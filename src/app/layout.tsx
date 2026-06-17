import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import { WeatherThemeProvider } from '@/context/WeatherThemeContext';
import { ThemeWrapper } from '@/components/ThemeWrapper';
import { Navbar } from '@/components/Navbar';

// Load Outfit font for a premium, modern typography
const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'SkyMind AI Weather | AI-Powered Forecasting Platform',
  description: 'SkyMind AI is a professional meteorological dashboard providing real-time weather analytics, AI predictions, health warnings, agricultural planning, and custom conversational chats powered by Google Gemini.',
  keywords: ['weather forecast', 'ai weather prediction', 'gemini api weather', 'farming weather recommendations', 'severe weather alerts'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full font-sans bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500/30 selection:text-white">
        <ToastProvider>
          <AuthProvider>
            <WeatherThemeProvider>
              <ThemeWrapper>
                <Navbar />
                <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                  {children}
                </main>
              </ThemeWrapper>
            </WeatherThemeProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
