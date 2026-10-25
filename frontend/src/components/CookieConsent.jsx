import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cookie, X, ExternalLink } from 'lucide-react';

export default function CookieConsent({ onOpenPrivacyTerms }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('kadianga_cookie_consent');
      if (!consent) {
        const timer = setTimeout(() => {
          setVisible(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage may fail in strict private mode
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem('kadianga_cookie_consent', 'accepted');
    } catch {}
    setVisible(false);
  };

  const handleEssentialOnly = () => {
    try {
      localStorage.setItem('kadianga_cookie_consent', 'essential');
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside 
      aria-label="Cookie and data privacy consent"
      className="fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-[95] max-w-xl bg-[#18181b]/95 backdrop-blur-md text-white p-4 sm:p-5 rounded-2xl shadow-2xl border border-white/15 animate-fade-in font-sans"
    >
      <div className="flex items-start gap-3 sm:gap-4 mb-3">
        <div className="w-9 h-9 rounded-xl bg-[#e67e22]/20 text-[#e67e22] flex items-center justify-center shrink-0 mt-0.5">
          <Cookie className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 leading-tight">
            <span>Customer Privacy &amp; Local Storage Notice</span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-mono font-normal">
              KDPA 2019
            </span>
          </h4>
          <p className="text-[11px] sm:text-xs text-neutral-300 mt-1 leading-relaxed">
            We use functional browser storage to preserve your quotation items, support offline requests, and enable WhatsApp trade desk dispatch. We never sell your personal data or track you across the web.
          </p>
        </div>

        <button
          onClick={handleEssentialOnly}
          className="text-neutral-400 hover:text-white transition-colors p-1 -mr-1 -mt-1"
          aria-label="Close consent banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-white/10 text-xs">
        <button
          type="button"
          onClick={() => {
            if (onOpenPrivacyTerms) onOpenPrivacyTerms();
          }}
          className="text-[#e67e22] hover:underline font-semibold text-[11px] sm:text-xs flex items-center gap-1"
        >
          <span>Read Privacy &amp; Terms Policy</span>
          <ExternalLink className="w-3 h-3" />
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleEssentialOnly}
            className="px-3 py-1.5 rounded-lg border border-white/20 text-neutral-300 hover:text-white hover:bg-white/10 text-xs font-semibold transition-colors"
          >
            Essential Only
          </button>
          <button
            type="button"
            onClick={handleAcceptAll}
            className="px-4 py-1.5 rounded-lg bg-[#e67e22] hover:bg-[#d35400] text-white text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            Accept &amp; Continue
          </button>
        </div>
      </div>
    </aside>
  );
}
