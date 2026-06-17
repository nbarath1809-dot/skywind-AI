'use client';

import { useState, useEffect, useCallback } from 'react';

// --- 1. Speech to Text Hook ---
export interface UseSpeechToTextReturn {
  listening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
  clearTranscript: () => void;
}

export const useSpeechToText = (onResult?: (text: string) => void): UseSpeechToTextReturn => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check browser support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setListening(true);
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setListening(false);
      };

      rec.onend = () => {
        setListening(false);
      };

      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        setTranscript(resultText);
        if (onResult) {
          onResult(resultText);
        }
      };

      setRecognition(rec);
    }
  }, [onResult]);

  const startListening = useCallback(() => {
    if (recognition && !listening) {
      try {
        recognition.start();
      } catch (err) {
        console.error('Failed to start recognition:', err);
      }
    }
  }, [recognition, listening]);

  const stopListening = useCallback(() => {
    if (recognition && listening) {
      try {
        recognition.stop();
        setListening(false);
      } catch (err) {
        console.error('Failed to stop recognition:', err);
      }
    }
  }, [recognition, listening]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    listening,
    transcript,
    startListening,
    stopListening,
    isSupported,
    clearTranscript
  };
};

// --- 2. Text to Speech Hook ---
export interface UseTextToSpeechReturn {
  speaking: boolean;
  speak: (text: string) => void;
  stop: () => void;
  isSupported: boolean;
}

export const useTextToSpeech = (): UseTextToSpeechReturn => {
  const [speaking, setSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setIsSupported(true);
    }
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      if (!text) return;

      // Strip markdown syntax for natural voice output
      const cleanText = text
        .replace(/[*_`#\-]/g, ' ')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .substring(0, 300); // Limit length to avoid infinite speaking blocks

      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      utterance.onstart = () => {
        setSpeaking(true);
      };

      utterance.onend = () => {
        setSpeaking(false);
      };

      utterance.onerror = (err) => {
        console.error('Speech synthesis error:', err);
        setSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Cancel speaking when component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    speaking,
    speak,
    stop,
    isSupported
  };
};
