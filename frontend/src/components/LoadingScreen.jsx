import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';

export default function LoadingScreen({ message = "Loading...", onComplete }) {
  const [progress, setProgress] = useState(15);

    useEffect(() => {
    if (progress >= 100) {
      if (onComplete) onComplete();
    }
  }, [progress, onComplete]);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return Math.min(100, prev + Math.floor(Math.random() * 20) + 10);
      });
    }, 180);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-neutral-200/80 overflow-hidden flex flex-col justify-between min-h-[380px]">
        
        {/* Top Header matching loading screen.jpg */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-600"></div>
            <span className="text-xs font-bold tracking-wider text-neutral-800 uppercase">Kadianga Electricals</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-neutral-400 font-medium">
            <span className="text-blue-600 font-semibold border-b border-blue-600 pb-0.5">Catalog</span>
            <span>Quotation</span>
            <span>Offline Sync</span>
          </div>
        </div>

        {/* Center Progress Circle and Percentage matching loading screen.jpg */}
        <div className="flex flex-col items-center justify-center p-8">
          
          {/* Animated Spinner Ring */}
          <div className="relative w-16 h-16 mb-6">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-neutral-100"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-blue-600 transition-all duration-300"
                strokeDasharray={`${progress}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
          </div>

          <h3 className="text-lg font-bold text-neutral-900 mb-1 font-sans">
            {message}
          </h3>
          <p className="text-xs text-neutral-400 mb-6">
            Please wait a moment while catalog assets initialize
          </p>

          {/* Linear Progress Bar */}
          <div className="w-48 bg-neutral-100 h-1 rounded-full overflow-hidden mb-2">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, progress)}%` }}
            ></div>
          </div>
          <span className="text-[11px] font-mono text-neutral-500 font-bold">
            {Math.min(100, progress)}%
          </span>

        </div>

        {/* Footer Badge matching loading screen.jpg */}
        <div className="px-6 py-3.5 bg-[#faf9f6] border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
          <div className="flex items-center gap-1.5 text-neutral-600">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Secure. Fast. Minimal.</span>
          </div>
          <span>© 2026 Kadianga Electricals</span>
        </div>

      </div>
    </div>
  );
}
