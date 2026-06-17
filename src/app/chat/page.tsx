'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWeatherTheme } from '@/context/WeatherThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { createClientBrowser } from '@/lib/supabase';
import { sendChatMessage } from '@/app/actions';
import { useSpeechToText, useTextToSpeech } from '@/components/TtsVoice';
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Trash2, 
  Loader2, 
  User, 
  MapPin,
  Bot
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export default function ChatPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { weatherData, themeStyles } = useWeatherTheme();
  const supabase = createClientBrowser();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // STT / TTS hooks
  const { speak, stop, speaking, isSupported: ttsSupported } = useTextToSpeech();
  const { listening, startListening, stopListening, isSupported: sttSupported, transcript } = 
    useSpeechToText((text) => setInputText(text));

  const suggestionChips = [
    'Will it rain tomorrow?',
    'What clothes should I wear today?',
    'Is it safe to travel this weekend?',
    'Explain today\'s weather in simple language.',
    'Suggest outdoor activities based on weather.',
    'Farming recommendations based on this forecast.'
  ];

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load chat history from Supabase if logged in
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!user) {
        // Load default greeting
        setMessages([
          {
            id: 'welcome',
            role: 'model',
            text: `Hi! I am **SkyMind AI**, your personal weather assistant. Ask me anything about current conditions, travel safety, clothing, or agriculture!`
          }
        ]);
        return;
      }

      setHistoryLoading(true);
      try {
        const { data, error } = await supabase
          .from('chat_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(20);
        
        if (error) throw error;

        const greeting: ChatMessage = {
          id: 'welcome',
          role: 'model',
          text: `Welcome back! I am ready to analyze weather conditions. Ask me anything about ${
            weatherData ? weatherData.city : 'our forecasts'
          }!`
        };

        if (data && data.length > 0) {
          const loaded: ChatMessage[] = data.flatMap((log) => [
            { id: `${log.id}-q`, role: 'user', text: log.question },
            { id: `${log.id}-a`, role: 'model', text: log.ai_response }
          ]);
          setMessages([greeting, ...loaded]);
        } else {
          setMessages([greeting]);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadChatHistory();
  }, [user, supabase]);

  const handleSend = async (textToSend: string) => {
    const query = textToSend.trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      text: query
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      // Map existing messages format to Gemini history:
      // Gemini expects format: { role: 'user' | 'model', parts: [{ text: string }] }
      // Filter out the initial welcome greeting
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

      // Call Gemini Server Action
      const response = await sendChatMessage(query, history, weatherData);

      const aiMsg: ChatMessage = {
        id: Math.random().toString(),
        role: 'model',
        text: response
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Sync chat to Supabase database if logged in
      if (user) {
        await supabase.from('chat_history').insert({
          user_id: user.id,
          question: query,
          ai_response: response
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      showToast('Error communicating with Gemini AI', 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearChatLogs = async () => {
    if (!user) {
      setMessages([
        {
          id: 'welcome',
          role: 'model',
          text: `Hi! I am **SkyMind AI**, your personal weather assistant. Ask me anything about current conditions, travel safety, clothing, or agriculture!`
        }
      ]);
      showToast('Cleared session logs', 'success');
      return;
    }

    try {
      const { error } = await supabase
        .from('chat_history')
        .delete()
        .eq('user_id', user.id);
      
      if (error) throw error;
      setMessages([
        {
          id: 'welcome',
          role: 'model',
          text: `Logged conversations cleared from databases. How can I help you today?`
        }
      ]);
      showToast('Successfully deleted chat history', 'success');
    } catch (error) {
      console.error('Error clearing history:', error);
      showToast('Failed to delete history', 'error');
    }
  };

  const handleMicToggle = () => {
    if (!sttSupported) {
      showToast('Speech recognition is not supported in this browser.', 'error');
      return;
    }
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="flex flex-col h-[78vh] gap-4 max-w-4xl mx-auto animate-fade-in">
      {/* Active City Context Badge */}
      <div className={`p-3 rounded-xl border flex flex-wrap items-center justify-between text-xs gap-3 ${themeStyles.cardBg} ${themeStyles.borderColor}`}>
        <div className="flex items-center gap-1.5 font-medium text-slate-300">
          <Bot className="w-4.5 h-4.5 text-sky-400" />
          <span>Assistant Engine: Gemini 1.5 Flash</span>
        </div>
        
        {weatherData ? (
          <div className="flex items-center gap-1.5 bg-sky-500/10 text-sky-300 px-2.5 py-1 rounded-full border border-sky-500/20">
            <MapPin className="w-3.5 h-3.5" />
            <span>Context: {weatherData.city} (Loaded)</span>
          </div>
        ) : (
          <span className="text-slate-400 font-semibold italic">No context selected. Ask me to search or select a city.</span>
        )}

        <button
          onClick={clearChatLogs}
          className="flex items-center gap-1 text-rose-400 hover:text-rose-300 transition-colors font-semibold ml-auto sm:ml-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear logs</span>
        </button>
      </div>

      {/* Main Chat Box */}
      <div className={`flex-1 rounded-2xl border p-4 overflow-y-auto space-y-4 flex flex-col ${themeStyles.cardBg} ${themeStyles.borderColor}`}>
        {historyLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
            <span className="ml-2 text-slate-400 text-sm font-semibold">Synchronizing chat history...</span>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isAi = msg.role === 'model';
              return (
                <div
                  key={msg.id}
                  className={`flex w-full gap-3 ${isAi ? 'justify-start' : 'justify-end'}`}
                >
                  {/* AI Badge */}
                  {isAi && (
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-500/30 font-bold shrink-0 self-end">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className="group relative flex items-start gap-2 max-w-[80%]">
                    <div
                      className={`p-3.5 rounded-2xl border text-sm leading-relaxed ${
                        isAi
                          ? 'bg-slate-950/60 border-white/5 text-slate-100'
                          : 'bg-sky-500 text-white border-sky-600 shadow-md shadow-sky-500/5'
                      }`}
                    >
                      {/* Formatted Text (simple bold/paragraph replacement for robust rendering) */}
                      <div className="prose prose-invert max-w-none">
                        {msg.text.split('\n').map((para, pIdx) => {
                          // Very basic markdown parsing for bold **text**
                          const parts = para.split(/(\*\*.*?\*\*)/g);
                          return (
                            <p key={pIdx} className="mb-1">
                              {parts.map((part, partIdx) => {
                                if (part.startsWith('**') && part.endsWith('**')) {
                                  return (
                                    <strong key={partIdx} className={isAi ? 'text-purple-300' : 'text-white'}>
                                      {part.slice(2, -2)}
                                    </strong>
                                  );
                                }
                                return part;
                              })}
                            </p>
                          );
                        })}
                      </div>
                    </div>

                    {/* Text to Speech Buttons for AI responses */}
                    {isAi && ttsSupported && (
                      <button
                        onClick={() => {
                          if (speaking) {
                            stop();
                          } else {
                            speak(msg.text);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/15 text-slate-400 hover:text-white transition-all shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title={speaking ? 'Stop speaking' : 'Read message out loud'}
                      >
                        {speaking ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* User Initials Badge */}
                  {!isAi && (
                    <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center border border-sky-500/30 font-bold shrink-0 self-end">
                      <User className="w-4 h-4 text-sky-400" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-500/30 shrink-0 self-end animate-pulse">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span className="text-xs text-slate-400 font-semibold">Gemini is drafting a response...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Suggestion Chips */}
      {messages.length <= 1 && !loading && (
        <div className="flex flex-wrap gap-2 py-1 items-center justify-center">
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              className="px-3.5 py-2 rounded-xl bg-slate-900/35 border border-white/5 hover:border-sky-500/30 text-xs font-semibold text-slate-300 hover:text-white transition-all hover:scale-[1.01]"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Message input panel */}
      <div className="flex gap-2 items-center">
        {/* Mic Toggle Button */}
        {sttSupported && (
          <button
            onClick={handleMicToggle}
            className={`p-3.5 rounded-xl border transition-all flex items-center justify-center shrink-0 ${
              listening
                ? 'bg-rose-500 border-rose-600 text-white animate-pulse'
                : 'bg-slate-900/50 border-white/10 hover:bg-slate-900 text-slate-300 hover:text-white'
            }`}
            title={listening ? 'Stop recording' : 'Dictate message'}
          >
            {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        )}

        <input
          type="text"
          placeholder={listening ? 'Listening to voice...' : 'Type a query or ask for recommendations...'}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend(inputText);
          }}
          disabled={loading}
          className="flex-1 py-3.5 px-4 rounded-xl border border-white/10 bg-slate-900/30 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm transition-all"
        />

        <button
          onClick={() => handleSend(inputText)}
          disabled={loading || !inputText.trim()}
          className="p-3.5 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:bg-sky-600/50 text-white flex items-center justify-center transition-all shrink-0 shadow-md shadow-sky-500/10"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
