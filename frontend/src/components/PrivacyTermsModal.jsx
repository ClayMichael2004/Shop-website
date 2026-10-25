import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Lock, CheckCircle2, AlertTriangle, Scale } from 'lucide-react';

export default function PrivacyTermsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('privacy'); // 'privacy' | 'terms'

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto animate-fade-in font-sans"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden my-auto flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200 bg-[#faf9f6]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#18181b] text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#e67e22]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 leading-tight">
                Legal Notice &amp; Customer Protection
              </h2>
              <p className="text-xs text-neutral-600 font-medium">
                Kadianga Electricals &bull; Ang'awa St, Kisumu &bull; KDPA 2019 Compliant
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-neutral-200 px-6 bg-white gap-6">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-3.5 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'privacy' 
                ? 'border-[#e67e22] text-[#e67e22]' 
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Data Privacy &amp; Cookies (KDPA 2019)</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`py-3.5 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'terms' 
                ? 'border-[#e67e22] text-[#e67e22]' 
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Wholesale Terms &amp; Quotation Policy</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-neutral-700 leading-relaxed">
          {activeTab === 'privacy' ? (
            <>
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-900 text-xs sm:text-sm mb-1">
                    Kenya Data Protection Act (2019) Compliance
                  </h4>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Kadianga Electricals complies fully with the Kenya Data Protection Act, 2019 and regulations enacted by the Office of the Data Protection Commissioner (ODPC). Your customer privacy is strictly safeguarded.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-neutral-900 mb-2">1. Data We Collect &amp; Why</h3>
                <p className="mb-2">
                  When you use our store to request a wholesale quotation or send an inquiry, we collect:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-neutral-700">
                  <li><strong>Personal Identifiers:</strong> Name, WhatsApp phone number, and email address.</li>
                  <li><strong>Project Details:</strong> Site location/county and equipment specifications submitted in quotation notes.</li>
                  <li><strong>Purpose:</strong> We use this information solely to compute your official quote, confirm warehouse stock in Kisumu, arrange delivery logistics, and respond to your trade inquiries.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-neutral-900 mb-2">2. Local Storage &amp; Cookies</h3>
                <p className="mb-2">
                  This website does <strong>not</strong> deploy third-party advertising trackers, pixel spyware, or cross-site tracking scripts. We utilize strictly functional browser storage:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-neutral-700">
                  <li><strong>Quotation Cart Storage:</strong> Retains your selected electrical cables, chandeliers, and switchgear in your browser so you do not lose your items during browsing.</li>
                  <li><strong>Offline Sync Cache (IndexedDB):</strong> Temporarily queues quotation requests if your mobile device loses cellular data connection, automatically syncing when connection resumes.</li>
                  <li><strong>Consent Preference:</strong> Remembers your acknowledgment of this notice.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-neutral-900 mb-2">3. Zero Third-Party Data Selling</h3>
                <p>
                  Kadianga Electricals will never sell, rent, or trade your phone number, email, or order history to third-party marketing firms or data brokers. Your communications remain directly between you and our Kisumu commercial trade desk.
                </p>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-neutral-900 mb-2">4. Your Statutory Rights</h3>
                <p>
                  Under Section 26 of the Kenya Data Protection Act, you have the right to request access to your quotation records, demand correction of inaccurate details, or request total deletion of your contact records from our operations database by contacting <a href="mailto:mikewillmakeit2004@gmail.com" className="text-blue-600 underline font-semibold">mikewillmakeit2004@gmail.com</a> or calling +254 712 880 970.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-900 text-xs sm:text-sm mb-1">
                    Wholesale Price &amp; Stock Availability Disclaimer
                  </h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Electrical cable and metal commodity prices fluctuate daily with international copper and foreign exchange rates. Online catalog prices serve as guide estimates until officially confirmed.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-neutral-900 mb-2">1. Nature of Online Quotations</h3>
                <p>
                  All products, specifications, and guide prices displayed on this website constitute an <em>invitation to treat</em> (inquiry stage). A binding contract of sale is only formed once our trade desk verifies current factory stock, issues an official proforma quote with verified delivery rates, and payment terms are agreed upon.
                </p>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-neutral-900 mb-2">2. Copper &amp; Material Market Fluctuations</h3>
                <p>
                  Prices for XLPE Armoured Cables, Single Core Conduit wires, and pure copper building conductors are subject to global commodity index adjustments. Final quoted prices provided via WhatsApp or email remain valid for forty-eight (48) hours from the timestamp of quotation issuance unless otherwise specified.
                </p>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-neutral-900 mb-2">3. Product Warranties &amp; Standards</h3>
                <p>
                  All electrical switchgear, miniature circuit breakers (MCBs), meters, and cables supplied by Kadianga Electricals conform to Kenya Bureau of Standards (KEBS) specifications and relevant IEC/BS manufacturing standards. Manufacturer warranty terms apply to verified defects upon inspection at our Kisumu showroom.
                </p>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-neutral-900 mb-2">4. Dispatch &amp; Delivery Terms</h3>
                <p>
                  Dispatch within Kisumu Central Business District and Western Kenya regional project sites is coordinated via authorized courier or direct store logistics upon confirmation of order deposits.
                </p>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-neutral-900 mb-2">5. Governing Law</h3>
                <p>
                  These terms and conditions are governed by and construed in accordance with the Laws of the Republic of Kenya.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 bg-[#faf9f6]">
          <span className="text-[11px] text-neutral-500 font-medium">
            Last Updated: October 2026 &bull; Kadianga Electricals
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#18181b] hover:bg-[#e67e22] text-white text-xs font-bold transition-colors shadow-sm"
          >
            Close &amp; Return
          </button>
        </div>
      </div>
    </div>
  );
}
