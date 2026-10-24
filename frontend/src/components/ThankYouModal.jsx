import React, { useState } from 'react';
import { Check, Copy, MessageCircle, ArrowLeft, Search } from 'lucide-react';

export default function ThankYouModal({ quoteResponse, onClose, onReset, onTrackQuote }) {
  const [copied, setCopied] = useState(false);

  if (!quoteResponse) return null;

  const quoteNumber = quoteResponse.quote_number || 'EQ-2026-PENDING';
  const customerEmail = quoteResponse.quote?.customer_email || '';
  const customerName = quoteResponse.quote?.customer_name || 'Customer';
  const waLink = quoteResponse.whatsapp_link || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(quoteNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
      <div 
        className="relative w-full max-w-lg bg-[#f9f9f8] rounded-3xl shadow-2xl p-6 sm:p-10 text-center border border-neutral-300 my-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Giant Editorial Typography matching thank you inspo.jpg */}
        <div className="mb-6 select-none text-left pl-2">
          <div className="font-sans text-5xl sm:text-6xl md:text-7xl font-black text-[#111111] tracking-tight leading-[0.9]">
            <div>Thank</div>
            <div className="flex items-center gap-4 pl-8 mt-1">
              <span className="w-10 sm:w-14 h-[2px] bg-[#111111] inline-block -translate-y-1"></span>
              <span className="text-xl sm:text-2xl font-normal -ml-3 -translate-y-1">→</span>
              <span>you</span>
            </div>
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-neutral-800 text-sm font-semibold mb-6 text-left pl-2">
          Your quotation request has been received by Kadianga Electricals.
        </p>

        {/* Minimalist Quote Reference Box */}
        <div className="bg-white border border-neutral-300 rounded-2xl p-5 mb-5 text-left shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs uppercase tracking-wider text-neutral-800 font-bold font-mono">
              Quote Reference Number
            </span>
            <button
              onClick={handleCopy}
              className="text-xs text-neutral-800 hover:text-black font-bold flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          
          <div className="text-2xl font-mono font-black text-neutral-900 tracking-wide">
            {quoteNumber}
          </div>

          <div className="mt-2 text-xs text-neutral-700 font-medium">
            {customerEmail ? (
              <span>Confirmation dispatched to <strong className="text-neutral-900">{customerEmail}</strong></span>
            ) : (
              <span>Customer: <strong className="text-neutral-900">{customerName}</strong></span>
            )}
          </div>
        </div>

        {/* Next Steps Guidance */}
        <div className="bg-[#f0f4f8] border border-blue-200 rounded-2xl p-4 mb-6 text-left text-xs text-neutral-800 space-y-2">
          <div className="font-bold text-neutral-900 flex items-center gap-1.5">
            <Check className="w-4 h-4 text-blue-600 shrink-0" />
            <span>How You Receive Your Pricing:</span>
          </div>
          <ul className="space-y-1.5 text-[11px] text-neutral-700 font-medium">
            <li>• <strong>Wholesale Pricing:</strong> Our engineering team is calculating your exact bulk discounts.</li>
            <li>• <strong>Direct Delivery:</strong> Your finalized quotation will be sent to your <strong>WhatsApp</strong> and <strong>Email</strong>.</li>
            <li>• <strong>Live Tracking:</strong> Track real-time progress anytime using your reference number.</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          {onTrackQuote && (
            <button
              onClick={() => {
                onTrackQuote(quoteNumber);
                onClose();
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-6 rounded-full font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Search className="w-4 h-4" />
              <span>Track This Quote Live on Site</span>
            </button>
          )}

          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-3.5 px-6 rounded-full font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Continue on WhatsApp</span>
            </a>
          )}

          <button
            onClick={() => {
              onReset();
              onClose();
            }}
            className="w-full bg-black hover:bg-neutral-800 text-white py-3.5 px-6 rounded-full font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Catalog</span>
          </button>
        </div>

      </div>
    </div>
  );
}
