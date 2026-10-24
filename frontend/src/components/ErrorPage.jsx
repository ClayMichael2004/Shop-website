import React from 'react';
import { Home, ArrowLeft, Mail, MessageCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorPage({ 
  type = "404", 
  title, 
  message, 
  onGoHome, 
  onRetry,
  shopEmail = "mikewillmakeit2004@gmail.com",
  shopWhatsApp = "254712880970"
}) {
  const is404 = type === "404";

  return (
    <div className="w-full min-h-[85vh] flex items-center justify-center p-4 sm:p-8 bg-[#e8e8e8]">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-neutral-200/60 p-8 sm:p-14 text-center animate-fade-in my-auto">
        
        {is404 ? (
          /* Card 1 matching top half of error message inspo.jpg */
          <div>
            {/* 404 with ghost inside 0 matching inspo */}
            <div className="flex items-center justify-center mb-6 select-none">
              <span className="text-[#e52d2d] font-sans font-black text-8xl sm:text-9xl tracking-tighter leading-none">
                4
              </span>
              
              {/* Center 0 with cute ghost popping out */}
              <div className="relative mx-1 w-20 h-28 sm:w-24 sm:h-32 flex items-center justify-center">
                {/* Red Oval 0 */}
                <div className="w-full h-full rounded-full border-[14px] sm:border-[18px] border-[#e52d2d] flex items-center justify-center overflow-hidden bg-white">
                  {/* Cartoon Ghost */}
                  <div className="relative w-12 h-14 bg-white rounded-t-full flex flex-col items-center justify-start pt-2 shadow-sm border border-neutral-200/50">
                    {/* Ghost Eyes */}
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-1.5 h-2 bg-neutral-900 rounded-full"></div>
                      <div className="w-1.5 h-2 bg-neutral-900 rounded-full"></div>
                    </div>
                    {/* Ghost mouth */}
                    <div className="w-1.5 h-1 bg-neutral-800 rounded-full"></div>
                    {/* Little waving arms */}
                    <div className="absolute -left-1.5 top-5 w-2.5 h-1.5 bg-white rounded-full border-t border-neutral-200 -rotate-45"></div>
                    <div className="absolute -right-1.5 top-5 w-2.5 h-1.5 bg-white rounded-full border-t border-neutral-200 rotate-45"></div>
                  </div>
                </div>
              </div>

              <span className="text-[#e52d2d] font-sans font-black text-8xl sm:text-9xl tracking-tighter leading-none">
                4
              </span>
            </div>

            {/* Headline matching error message inspo.jpg */}
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-3 font-sans">
              Page not found
            </h2>

            {/* Subtext matching error message inspo.jpg */}
            <p className="text-xs sm:text-sm text-neutral-700 font-medium max-w-md mx-auto mb-8 leading-relaxed">
              The Page you are looking for doesn't exist or another error occurred. Go back, or head over to{' '}
              <button 
                onClick={onGoHome} 
                className="text-[#e52d2d] font-bold hover:underline"
              >
                Home
              </button>
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={onGoHome}
                className="px-6 py-2.5 rounded-full bg-[#18181b] hover:bg-neutral-800 text-white text-xs font-semibold shadow-md active:scale-95 transition-all flex items-center gap-2"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Return to Home</span>
              </button>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-6 py-2.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold active:scale-95 transition-all flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Card 2 matching bottom half of error message inspo.jpg (Site is Under maintenance) */
          <div>
            {/* Isometric Traffic Cone with red base matching inspo */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-24 h-24 flex items-center justify-center">
                {/* Traffic Cone SVG */}
                <svg viewBox="0 0 100 100" className="w-20 h-20 drop-shadow-md">
                  {/* Red Base */}
                  <polygon points="15,80 85,80 75,90 25,90" fill="#b91c1c" />
                  <polygon points="20,78 80,78 70,86 30,86" fill="#e52d2d" />
                  {/* Cone body with reflective stripes */}
                  <polygon points="40,25 60,25 73,78 27,78" fill="#e52d2d" />
                  {/* White reflective stripes */}
                  <polygon points="43,38 57,38 61,50 39,50" fill="#ffffff" />
                  <polygon points="36,58 64,58 68,70 32,70" fill="#ffffff" />
                  {/* Orange/red cap */}
                  <ellipse cx="50" cy="25" rx="10" ry="3" fill="#ef4444" />
                </svg>
              </div>
            </div>

            {/* Headline matching error message inspo.jpg */}
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2 font-sans">
              Site is Under maintenance
            </h2>

            {/* Subtext matching inspo */}
            <p className="text-xs sm:text-sm text-neutral-700 font-medium max-w-sm mx-auto mb-6">
              You can still reach us at our social media accounts or direct support lines
            </p>

            {/* Social Icons row matching inspo: Facebook, YouTube, TikTok, WhatsApp */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <a
                href="#"
                className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-800 hover:bg-neutral-100 transition-colors"
                title="Facebook"
              >
                <span className="font-bold text-xs">f</span>
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-800 hover:bg-neutral-100 transition-colors"
                title="YouTube"
              >
                <span className="font-bold text-[10px]">YT</span>
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-800 hover:bg-neutral-100 transition-colors"
                title="TikTok"
              >
                <span className="font-bold text-[10px]">TT</span>
              </a>
              <a
                href={`https://wa.me/${shopWhatsApp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-800 hover:bg-neutral-100 transition-colors"
                title="WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              </a>
            </div>

            {/* Send us an Email pill matching inspo */}
            <div className="flex items-center justify-center gap-3 text-xs">
              <span className="text-neutral-800 font-bold">Send us an Email:</span>
              <a
                href={`mailto:${shopEmail}`}
                className="px-4 py-1.5 rounded-full border border-neutral-400 text-neutral-900 font-mono font-semibold hover:bg-neutral-100 transition-colors"
              >
                {shopEmail}
              </a>
            </div>

            {onGoHome && (
              <div className="mt-8 pt-6 border-t border-neutral-100">
                <button
                  onClick={onGoHome}
                  className="px-6 py-2 rounded-full bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-all"
                >
                  Return to Home
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
