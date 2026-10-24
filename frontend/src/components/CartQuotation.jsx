import React, { useState } from 'react';
import { Trash2, X, Check, MessageCircle, AlertCircle } from 'lucide-react';

export default function CartQuotation({ 
  cart, 
  onUpdateQuantity, 
  onRemoveItem, 
  onClearCart,
  onClose, 
  onSubmitQuote,
  shopWhatsApp = "254712880970"
}) {
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerLocation, setCustomerLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Subtotal calculation
  const subtotal = cart.reduce((acc, item) => {
    return acc + (item.base_estimate_price || 0) * (item.quantity || 1);
  }, 0);

  const deliveryFee = subtotal > 10000 ? 0 : (subtotal > 0 ? 500 : 0);
  const calculatedTotal = Math.max(0, subtotal - discountAmount + deliveryFee);

  const handleApplyVoucher = (e) => {
    e.preventDefault();
    if (!voucherCode.trim()) return;
    if (voucherCode.trim().toUpperCase() === 'VOLT10') {
      const disc = Math.round(subtotal * 0.10);
      setDiscountAmount(disc);
      setVoucherApplied(true);
    } else {
      setDiscountAmount(500);
      setVoucherApplied(true);
    }
  };

  const handleSystemSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    if (!customerPhone.trim() && !customerEmail.trim()) {
      setErrorMsg('Please enter a phone number or email for quotation delivery');
      return;
    }
    if (customerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      setErrorMsg('Please enter a valid email format');
      return;
    }
    if (cart.length === 0) {
      setErrorMsg('Your cart is empty');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmitQuote({
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        customer_phone: customerPhone.trim(),
        customer_location: customerLocation.trim(),
        notes: notes.trim(),
        preferred_contact: 'both',
        items: cart.map(item => ({
          product_id: item.id,
          quantity: Math.max(1, item.quantity || 1),
          specs_notes: (item.specs_notes || '').trim()
        }))
      });
    } catch (err) {
      setErrorMsg(err.message || 'Quotation queued for dispatch.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsAppSubmit = () => {
    setErrorMsg('');
    if (cart.length === 0) {
      setErrorMsg('Your cart is empty');
      return;
    }
    if (!customerName.trim()) {
      setErrorMsg('Please enter your Name before sending on WhatsApp.');
      return;
    }

    let msg = `*KADIANGA ELECTRICALS - QUOTATION REQUEST*\n\n`;
    msg += `*Name:* ${customerName.trim()}\n`;
    if (customerPhone.trim()) msg += `*Phone:* ${customerPhone.trim()}\n`;
    if (customerEmail.trim()) msg += `*Email:* ${customerEmail.trim()}\n`;
    if (customerLocation.trim()) msg += `*Location:* ${customerLocation.trim()}\n`;
    msg += `\n*Items to Quote:*\n`;
    cart.forEach((it, idx) => {
      msg += `${idx + 1}. *${it.name}* (Qty: ${it.quantity || 1})\n`;
    });
    if (notes.trim()) msg += `\n*Notes:* ${notes.trim()}\n`;
    msg += `\n_Please send official contractor prices._`;

    const cleanPhone = shopWhatsApp.replace(/\D/g, '');
    const validPhone = (cleanPhone.startsWith('0') && cleanPhone.length === 10) 
      ? `254${cleanPhone.slice(1)}` 
      : cleanPhone;
    window.open(`https://wa.me/${validPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md overflow-y-auto animate-fade-in font-sans">
      
      {/* Outer White Card matching cart to request quotation.jpg */}
      <div 
        className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl p-4 sm:p-8 lg:p-10 my-auto border border-neutral-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Card Top Header matching inspo: Logo + "Lets Talk!" pill + hamburger */}
        <div className="flex items-center justify-between pb-6 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            {/* Hexagon/Square Logo Icon matching inspo */}
            <div className="w-5 h-5 border-[1.5px] border-neutral-900 rounded-sm flex items-center justify-center">
              <div className="w-2 h-2 bg-neutral-900"></div>
            </div>
            <span className="font-bold text-sm tracking-tight text-neutral-900">
              kadianga
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const el = document.getElementById('contact');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                onClose();
              }}
              className="px-4 py-1.5 rounded-full border border-neutral-300 text-xs font-medium text-neutral-800 hover:border-black transition-colors"
            >
              Lets Talk!
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-700 hover:text-black transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Big Title matching inspo: "Shopping Cart" */}
        <div className="pt-6 pb-6 flex items-baseline justify-between border-b border-neutral-200 mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 font-sans">
            Shopping Cart
          </h1>
          <span className="text-xs sm:text-sm font-bold text-neutral-700">
            {cart.length} {cart.length === 1 ? 'Product' : 'Products'}
          </span>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {cart.length === 0 ? (
          <div className="py-16 text-center text-neutral-700 text-sm">
            <p className="mb-4 font-medium">Your shopping cart is currently empty.</p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-full bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition-colors"
            >
              Return to Shop
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left Column: Scrollable Cart Items Container matching Admin Panel quote view */}
            <div className="lg:col-span-7 flex flex-col">
              
              {/* Table Header */}
              <div className="grid grid-cols-12 text-xs font-bold text-neutral-900 pb-3 border-b border-neutral-300 uppercase tracking-wider sticky top-0 bg-white z-10">
                <div className="col-span-6">Product Details</div>
                <div className="col-span-3 text-center">Quantity</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-1 text-right"></div>
              </div>

              {/* Scrollable Items Container (Displays ~3-4 items, scroll up/down to view the rest) */}
              <div className="max-h-[380px] sm:max-h-[440px] overflow-y-auto divide-y divide-neutral-200 text-xs sm:text-sm pr-1">
                {cart.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 items-center py-4 gap-2 hover:bg-neutral-50/60 transition-colors rounded-xl px-1">
                    
                    {/* Product Code & Image */}
                    <div className="col-span-6 flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-neutral-100 overflow-hidden shrink-0 flex items-center justify-center p-1 border border-neutral-200/80">
                        <img 
                          src={item.image_url} 
                          alt={item.name} 
                          className="w-full h-full object-contain" 
                          onError={(e) => { e.target.src = '/images/armured cable.jpg'; }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-neutral-900 text-xs truncate" title={item.name}>
                          {item.name}
                        </h4>
                        <span className="text-[11px] text-neutral-500 font-mono block">
                          SKU: {item.sku || `ITEM-${item.id}`}
                        </span>
                        <span className="text-[10px] text-neutral-600 font-semibold block">
                          Rate: KSh {Number(item.base_estimate_price || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Quantity Stepper pill: "+  4  -" */}
                    <div className="col-span-3 flex justify-center">
                      <div className="flex items-center gap-1.5 sm:gap-2 border border-neutral-300 rounded-full px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-white text-[11px] sm:text-xs shadow-sm">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, (item.quantity || 1) + 1)}
                          className="text-neutral-700 hover:text-black font-semibold text-sm w-4 h-4 flex items-center justify-center"
                          title="Increase quantity"
                        >
                          +
                        </button>
                        <span className="w-5 text-center font-bold text-neutral-900">
                          {item.quantity || 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, Math.max(1, (item.quantity || 1) - 1))}
                          className="text-neutral-700 hover:text-black font-semibold text-sm w-4 h-4 flex items-center justify-center"
                          title="Decrease quantity"
                        >
                          -
                        </button>
                      </div>
                    </div>

                    {/* Total Price */}
                    <div className="col-span-2 text-right">
                      <span className="font-bold text-neutral-900 block font-mono text-[11px] sm:text-sm">
                        KSh {((item.base_estimate_price || 0) * (item.quantity || 1)).toLocaleString()}
                      </span>
                    </div>

                    {/* Action: Trash Icon */}
                    <div className="col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        className="text-neutral-400 hover:text-red-600 p-1.5 transition-colors rounded-lg hover:bg-red-50"
                        title="Remove from cart"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4 stroke-[1.75]" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>

              {/* Bottom Actions Bar */}
              <div className="pt-4 mt-2 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-full bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition-colors shadow-sm active:scale-95"
                >
                  Continue Shopping
                </button>

                {cart.length > 3 && (
                  <span className="text-[11px] font-semibold text-neutral-500">
                    ↕ {cart.length} items (scroll up/down to view all)
                  </span>
                )}

                {onClearCart && (
                  <button
                    type="button"
                    onClick={onClearCart}
                    className="text-xs font-semibold text-neutral-500 hover:text-red-600 transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

            </div>

            {/* Right Column: "Order Summary" matching cart to request quotation.jpg */}
            <div className="lg:col-span-5 bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm lg:sticky lg:top-4">
              <h2 className="text-sm font-bold text-neutral-900 mb-4">
                Order Summary
              </h2>

              {/* Discount voucher input with Apply pill matching inspo */}
              <form onSubmit={handleApplyVoucher} className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Discount voucher (e.g. VOLT10)"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-full border border-neutral-300 text-xs text-neutral-900 placeholder-neutral-500 focus:outline-none focus:border-black font-medium"
                />
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full border border-neutral-300 text-xs font-semibold text-neutral-800 hover:border-black transition-colors"
                >
                  Apply
                </button>
              </form>

              {/* Summary line items matching inspo */}
              <div className="space-y-3 text-xs text-neutral-700 pb-5 border-b border-neutral-200 font-medium">
                <div className="flex justify-between">
                  <span>Sub Total</span>
                  <span className="font-bold text-neutral-900">KSh {subtotal.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>Discount</span>
                    <span>-KSh {discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery fee</span>
                  <span className="font-bold text-neutral-900">{deliveryFee > 0 ? `KSh ${deliveryFee.toLocaleString()}` : 'Free'}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-neutral-900 pt-3 border-t border-neutral-200">
                  <span>Estimated Total</span>
                  <span className="font-bold text-[#e67e22]">KSh {calculatedTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Warranty text matching inspo */}
              <div className="py-3 text-xs text-neutral-700 flex items-start gap-2 font-medium">
                <div className="w-4 h-4 rounded-full border border-neutral-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-neutral-800" />
                </div>
                <span>
                  90 Day Limited Warranty against manufacturer defects. Validated with KEBS and IEC standards.
                </span>
              </div>

              {/* How You Receive Feedback / Delivery Info */}
              <div className="my-2 p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-neutral-900 block">How You Get Your Quote:</span>
                <p className="text-neutral-700 text-[11px] leading-relaxed">
                  No login required! Fill in your contact info below and submit. Our shop team will price your items and send the finalized quote directly to your <strong>WhatsApp</strong> or <strong>Email</strong>.
                </p>
                <p className="text-neutral-700 text-[11px] leading-relaxed">
                  You'll also get a reference number to <strong>track it live on this site</strong> anytime.
                </p>
              </div>

              {/* Minimal Quotation Contact Form (No Login Required) */}
              <div className="pt-2 space-y-2.5">
                <input
                  type="text"
                  placeholder="Your Name *"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-neutral-300 text-neutral-900 placeholder-neutral-500 font-medium focus:outline-none focus:border-black"
                />
                <input
                  type="tel"
                  placeholder="Phone / WhatsApp Number *"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-neutral-300 text-neutral-900 placeholder-neutral-500 font-medium focus:outline-none focus:border-black"
                />
                <input
                  type="email"
                  placeholder="Email (for official quotation PDF)"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-neutral-300 text-neutral-900 placeholder-neutral-500 font-medium focus:outline-none focus:border-black"
                />
                <input
                  type="text"
                  placeholder="Delivery Location / Site"
                  value={customerLocation}
                  onChange={(e) => setCustomerLocation(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-neutral-300 text-neutral-900 placeholder-neutral-500 font-medium focus:outline-none focus:border-black"
                />

                {/* Main Action Buttons */}
                <button
                  type="button"
                  onClick={handleSystemSubmit}
                  disabled={submitting}
                  className="w-full mt-3 py-3 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-bold tracking-wider transition-colors disabled:opacity-50 shadow-sm"
                >
                  {submitting ? 'Submitting Quotation...' : 'Request Official Quote'}
                </button>

                <button
                  type="button"
                  onClick={handleWhatsAppSubmit}
                  className="w-full py-2.5 rounded-full border border-neutral-300 hover:border-black text-neutral-900 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send Request via WhatsApp</span>
                </button>
              </div>

            </div>

          </div>
        )}

        {/* Lower Banner matching inspo */}
        <div className="mt-14 pt-8 border-t border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-neutral-700 block font-semibold">
              Custom contractor orders
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-neutral-900">
              Craft Custom Electrical Quote
            </h3>
          </div>
          <button
            onClick={() => {
              const el = document.getElementById('contact');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
              onClose();
            }}
            className="px-6 py-2 rounded-full bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition-colors"
          >
            Lets Talk!
          </button>
        </div>

        {/* Bottom Footer inside card matching inspo */}
        <div className="mt-10 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-700 font-medium">
          <div>
            ©2026, All rights reserved.<br />
            <span className="font-bold text-neutral-900 uppercase tracking-wider text-xs">KADIANGA ELECTRICALS</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1 rounded-full border border-neutral-300 text-neutral-800 text-[11px] font-semibold cursor-pointer hover:border-black">Facebook</span>
            <span className="px-3.5 py-1 rounded-full border border-neutral-300 text-neutral-800 text-[11px] font-semibold cursor-pointer hover:border-black">Instagram</span>
            <span className="px-3.5 py-1 rounded-full border border-neutral-300 text-neutral-800 text-[11px] font-semibold cursor-pointer hover:border-black">Twitter</span>
            <span className="px-3.5 py-1 rounded-full border border-neutral-300 text-neutral-800 text-[11px] font-semibold cursor-pointer hover:border-black">LinkedIn</span>
          </div>

          <div className="text-right text-[11px] text-neutral-700 font-medium">
            36 East 78th street<br />
            NAIROBI INDUSTRIAL AREA
          </div>
        </div>

      </div>
    </div>
  );
}
