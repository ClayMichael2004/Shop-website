import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Phone, MessageCircle, Mail } from 'lucide-react';

export default function Footer({ onNavigate, onOpenTrackQuote }) {
  const [timeStr, setTimeStr] = useState('1:24 PM');

  useEffect(() => {
    const update = () => {
      const d = new Date();
      setTimeStr(d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  const phone = "+254712880970";
  const whatsapp = "254712880970";
  const email = "mikewillmakeit2004@gmail.com";

  return (
    <footer className="w-full bg-white border-t border-neutral-300 pt-12 sm:pt-20 pb-8 px-4 sm:px-10 lg:px-16 font-sans select-none overflow-hidden text-neutral-900">
      
      {/* Top Grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-8 pb-12">
        
        {/* Col 1: Bio */}
        <div className="md:col-span-4 pr-4">
          <p className="text-base sm:text-lg font-bold text-neutral-900 leading-snug mb-3">
            Kadianga Electricals is an independent commercial electrical supply, architectural lighting, and hardware store.
          </p>
          <div className="space-y-1.5 text-xs text-neutral-700 font-medium">
            <p className="flex items-center gap-1.5 font-bold text-neutral-900">
              <Phone className="w-3.5 h-3.5 text-[#e67e22]" />
              <a href={`tel:${phone}`} className="hover:underline">{phone}</a>
            </p>
            <p className="flex items-center gap-1.5 font-bold text-neutral-900">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <a href={`mailto:${email}`} className="hover:underline">{email}</a>
            </p>
          </div>
        </div>

        {/* Col 2: Explore */}
        <div className="md:col-span-2 text-sm text-neutral-700 font-medium">
          <span className="font-bold text-neutral-900 block mb-3 text-xs uppercase tracking-wider">Quick Navigation</span>
          <ul className="space-y-2.5">
            <li>
              <button onClick={() => onNavigate('home')} className="hover:text-black transition-colors font-medium">
                Home
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('cables')} className="hover:text-black transition-colors font-medium">
                Power Cables
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('lighting')} className="hover:text-black transition-colors font-medium">
                Lighting &amp; Chandeliers
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('products')} className="hover:text-black transition-colors font-medium">
                Full Catalog
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('contact')} className="hover:text-black transition-colors font-medium">
                Contact Us
              </button>
            </li>
            {onOpenTrackQuote && (
              <li>
                <button onClick={onOpenTrackQuote} className="text-[#e67e22] hover:underline font-bold">
                  Track My Quote
                </button>
              </li>
            )}
          </ul>
        </div>

        {/* Col 3: Follow Us */}
        <div className="md:col-span-3 text-sm text-neutral-700 font-medium">
          <span className="font-bold text-neutral-900 block mb-3 text-xs uppercase tracking-wider">Connect</span>
          <div className="space-y-2.5">
            <a href="#" className="flex items-center gap-2 hover:text-black transition-colors">
              <span className="font-bold text-neutral-900">X:</span>
              <span>@kadianga</span>
            </a>
            <a href="#" className="flex items-center gap-2 hover:text-black transition-colors">
              <span className="font-bold text-neutral-900">Instagram:</span>
              <span>@kadianga</span>
            </a>
            <a href="#" className="flex items-center gap-2 hover:text-black transition-colors">
              <span className="font-bold text-neutral-900">Facebook:</span>
              <span>Kadianga Electricals</span>
            </a>
            <a href="#" className="flex items-center gap-2 hover:text-black transition-colors">
              <span className="font-bold text-neutral-900">LinkedIn:</span>
              <span>Kadianga Electricals</span>
            </a>
          </div>
        </div>

        {/* Col 4: Action pills */}
        <div className="md:col-span-3 flex flex-col justify-start space-y-4">
          
          {/* Call Kadianga */}
          <a
            href={`tel:${phone}`}
            className="group flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 transition-all shadow-sm"
          >
            <div>
              <span className="text-sm font-bold text-neutral-900 block">
                Call Store
              </span>
              <span className="text-xs text-neutral-600 font-medium">
                {phone}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#f25022] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </a>

          {/* Inquire on WhatsApp */}
          <a
            href={`https://wa.me/${whatsapp}?text=Hello%20Kadianga%20Electricals,%20I%20would%20like%20to%20request%20a%20quotation.`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 transition-all text-left shadow-sm"
          >
            <div>
              <span className="text-sm font-bold text-neutral-900 block">
                WhatsApp Dispatch
              </span>
              <span className="text-xs text-neutral-600 font-medium">
                Instant pricing &amp; stock check
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <MessageCircle className="w-4 h-4 fill-white" />
            </div>
          </a>

        </div>

      </div>

      {/* Center Giant Geometric Brand Typography */}
      <div className="w-full py-6 sm:py-8 text-center overflow-hidden">
        <span className="font-sans font-black text-4xl sm:text-7xl md:text-[110px] lg:text-[160px] xl:text-[200px] tracking-tighter text-[#18181b] leading-none inline-block select-none opacity-90 max-w-full truncate">
          kadianga
        </span>
      </div>

      {/* Bottom Row */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-neutral-300 text-xs text-neutral-700 font-medium gap-3 text-center sm:text-left">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-3">
          <span>Kadianga Electricals ©2026</span>
          <span className="hidden sm:inline">·</span>
          <span>Quality Certified Supplies</span>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-1.5 sm:gap-3 text-center sm:text-right">
          <span className="break-words max-w-xs sm:max-w-none">Old Fire Station (Beside Kakwacha/Hangover), Ang'awa St, Kisumu</span>
          <span className="hidden sm:inline">·</span>
          <span>{timeStr}</span>
        </div>
      </div>

    </footer>
  );
}
