import React, { useState } from 'react';
import { Search, X, CheckCircle2, Clock, Phone, MessageCircle, AlertCircle, FileText } from 'lucide-react';

export default function TrackQuoteModal({ 
  isOpen, 
  onClose, 
  apiBase = "/api",
  initialQuoteNumber = "",
  companyPhone = "+254712880970",
  companyWhatsApp = "254712880970"
}) {
  const [quoteNumber, setQuoteNumber] = useState(initialQuoteNumber || '');
  const [loading, setLoading] = useState(false);
  const [quoteData, setQuoteData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  React.useEffect(() => {
    if (initialQuoteNumber) {
      setQuoteNumber(initialQuoteNumber);
    }
  }, [initialQuoteNumber, isOpen]);

  if (!isOpen) return null;

  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    const queryNum = quoteNumber.trim().toUpperCase();
    if (!queryNum) {
      setErrorMsg('Please enter your Quote Reference number.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setQuoteData(null);

    try {
      const res = await fetch(`${apiBase}/quotes/track/${encodeURIComponent(queryNum)}`);
      if (res.ok) {
        const data = await res.json();
        setQuoteData(data);
      } else if (res.status === 404) {
        setErrorMsg('Quote reference not found. Please check your reference code (e.g., EQ-2026-XXXX).');
      } else {
        setErrorMsg('Unable to retrieve quotation right now. Please try again or reach out on WhatsApp.');
      }
    } catch (err) {
      setErrorMsg('Network connection issue. Please check your internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'quoted':
        return (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-xs uppercase tracking-wide text-emerald-800">Quotation Ready!</p>
              <p className="text-xs text-emerald-900 font-medium">Your personalized prices have been finalized by our shop team.</p>
            </div>
          </div>
        );
      case 'accepted':
      case 'closed':
        return (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
            <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <p className="font-bold text-xs uppercase tracking-wide text-blue-800">Order Confirmed</p>
              <p className="text-xs text-blue-900 font-medium">Order confirmed and in preparation for warehouse delivery.</p>
            </div>
          </div>
        );
      case 'pending':
      default:
        return (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-xs uppercase tracking-wide text-amber-800">Under Review</p>
              <p className="text-xs text-amber-900 font-medium">Our sales team is checking current warehouse stock and calculating your figures.</p>
            </div>
          </div>
        );
    }
  };

  const cleanPhone = companyWhatsApp.replace(/\D/g, '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md overflow-y-auto animate-fade-in font-sans">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-4 sm:p-8 my-auto border border-neutral-200 text-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-neutral-600 hover:text-black hover:bg-neutral-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-[#18181b] text-white flex items-center justify-center shadow-md">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
              Track Your Quotation
            </h2>
            <p className="text-xs text-neutral-700 font-medium">
              View your live quotation status, itemized figures, and delivery timeline.
            </p>
          </div>
        </div>

        {/* Tracking Input Form */}
        <form onSubmit={handleTrackSubmit} className="mb-6">
          <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
            Quote Reference Number
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={quoteNumber}
                onChange={(e) => setQuoteNumber(e.target.value)}
                placeholder="e.g. EQ-2026-X8FK-9P4W"
                className="w-full bg-neutral-100 text-neutral-900 text-sm font-mono pl-10 pr-4 py-3 rounded-xl border border-neutral-300 focus:bg-white focus:border-neutral-900 focus:outline-none transition-all placeholder-neutral-500 font-bold"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#18181b] hover:bg-[#e67e22] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md active:scale-95 transition-all disabled:opacity-50 shrink-0"
            >
              {loading ? 'Checking...' : 'Check Status'}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-red-800 mb-1">{errorMsg}</p>
              <p className="text-neutral-700 font-medium">
                Need immediate assistance? Message us on WhatsApp:{' '}
                <a 
                  href={`https://wa.me/${cleanPhone}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-bold text-emerald-700 underline"
                >
                  +{cleanPhone}
                </a>
              </p>
            </div>
          </div>
        )}

        {/* Live Quote Details Result */}
        {quoteData && (
          <div className="space-y-5 animate-fade-in border-t border-neutral-200 pt-5">
            
            {/* Status Visual Banner */}
            {getStatusBadge(quoteData.status)}

            {/* Reference Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
              <div>
                <span className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider block">Reference Number</span>
                <span className="text-base font-mono font-bold text-neutral-900">{quoteData.quote_number}</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider block">Customer</span>
                <span className="text-sm font-semibold text-neutral-900">{quoteData.customer_masked_name || 'Customer'}</span>
              </div>
            </div>

            {/* Itemized List */}
            {quoteData.items && quoteData.items.length > 0 && (
              <div>
                <p className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">Item Breakdown</p>
                <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden divide-y divide-neutral-200 text-xs">
                  {quoteData.items.map((item, idx) => (
                    <div key={idx} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-bold text-neutral-900 text-sm">{item.product_name}</p>
                        <p className="text-neutral-600 font-medium">Qty: {item.quantity} {item.specs_notes ? `• ${item.specs_notes}` : ''}</p>
                      </div>
                      <div className="text-right">
                        {item.quoted_unit_price > 0 ? (
                          <>
                            <p className="font-bold text-neutral-900 text-sm">KSh {Number(item.quoted_total_price || 0).toLocaleString()}</p>
                            <p className="text-[11px] text-neutral-600">KSh {Number(item.quoted_unit_price || 0).toLocaleString()} each</p>
                          </>
                        ) : (
                          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Calculating Price...
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price Totals (If finalized) */}
            {quoteData.grand_total > 0 && (
              <div className="bg-neutral-900 text-white p-4 sm:p-5 rounded-2xl space-y-2">
                <div className="flex justify-between text-xs text-neutral-300 font-medium">
                  <span>Subtotal:</span>
                  <span className="font-mono text-white">KSh {Number(quoteData.subtotal || 0).toLocaleString()}</span>
                </div>
                {quoteData.discount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-400 font-medium">
                    <span>Discount Applied:</span>
                    <span className="font-mono">-KSh {Number(quoteData.discount || 0).toLocaleString()}</span>
                  </div>
                )}
                {quoteData.delivery_fee > 0 && (
                  <div className="flex justify-between text-xs text-neutral-300 font-medium">
                    <span>Delivery / Transit:</span>
                    <span className="font-mono text-white">+KSh {Number(quoteData.delivery_fee || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-white/20">
                  <span>Official Total:</span>
                  <span className="text-xl font-mono text-[#e67e22]">KSh {Number(quoteData.grand_total || 0).toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Customer Contact & Confirmation CTA */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <a
                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hello Kadianga Electricals, following up on my Quote #${quoteData.quote_number}. Please confirm dispatch.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all text-center"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Confirm Order on WhatsApp</span>
              </a>
              <a
                href={`tel:${companyPhone}`}
                className="bg-neutral-100 hover:bg-neutral-200 text-neutral-900 py-3.5 px-5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border border-neutral-300 active:scale-95 transition-all text-center shrink-0"
              >
                <Phone className="w-4 h-4" />
                <span>Call Store</span>
              </a>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
