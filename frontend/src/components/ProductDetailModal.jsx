import React, { useState } from 'react';
import { X, Star, ShoppingBag, MessageCircle, Share2 } from 'lucide-react';

export default function ProductDetailModal({ product, onClose, onAddToCart, shopWhatsApp = "254712880970" }) {
  const [quantity, setQuantity] = useState(1);
  const [specsNote, setSpecsNote] = useState('');
  const [copied, setCopied] = useState(false);

  if (!product) return null;

  // Multi-angle gallery images (Amazon/Alibaba style)
  const gallery = [
    product.image_url,
    product.category.includes('Cable') 
      ? (product.image_url.includes('armured') ? '/images/single cable.jpg' : '/images/armured cable.jpg')
      : '/images/home hero section.jpg',
    '/images/twin cable and others.jpg'
  ];

  const [activeImage, setActiveImage] = useState(product.image_url);

  let parsedSpecs = {};
  try {
    if (typeof product.specs === 'string' && product.specs.startsWith('{')) {
      parsedSpecs = JSON.parse(product.specs);
    }
  } catch (e) {
    parsedSpecs = { "Specification": product.specs };
  }

  const handleAdd = () => {
    const validQty = Math.max(1, Math.min(10000, quantity || 1));
    onAddToCart({
      ...product,
      quantity: validQty,
      specs_notes: specsNote.trim()
    });
    onClose();
  };

  const handleDirectWhatsApp = () => {
    const cleanPhone = shopWhatsApp.replace(/\D/g, '');
    const validPhone = (cleanPhone.startsWith('0') && cleanPhone.length === 10) 
      ? `254${cleanPhone.slice(1)}` 
      : cleanPhone;

    const text = encodeURIComponent(
      `Hello Kadianga Electricals,\nI am inquiring about:\n\n*Product:* ${product.name}\n*SKU:* ${product.sku}\n*Quantity Requested:* ${quantity}\n${specsNote ? `*Notes:* ${specsNote}\n` : ''}\nPlease provide availability and exact pricing.`
    );
    window.open(`https://wa.me/${validPhone}?text=${text}`, '_blank');
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/75 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors shadow-sm"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10 p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
          
          {/* Left Column: Amazon/Alibaba Image Showcase with interactive thumbnails */}
          <div className="md:col-span-5 flex flex-col">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-50 border border-neutral-200 shadow-inner mb-3 group">
              <img
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Interactive Gallery Thumbnails if multiple images exist */}
            {gallery.length > 1 && (
              <div className="flex items-center gap-2 mb-4">
                {gallery.map((imgSrc, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(imgSrc)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      activeImage === imgSrc 
                        ? 'border-[#e67e22] shadow-md scale-105' 
                        : 'border-neutral-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={imgSrc} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Specifications & Actions */}
          <div className="md:col-span-7 flex flex-col justify-between">
            <div>
              {/* SKU & Category & Share */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-neutral-800 uppercase">
                    SKU: {product.sku}
                  </span>
                  <span className="text-neutral-400">•</span>
                  <span className="text-xs font-bold text-[#e67e22]">
                    {product.subcategory || product.category}
                  </span>
                </div>
                <button
                  onClick={handleShare}
                  className="text-xs text-neutral-700 hover:text-black font-semibold flex items-center gap-1 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied Link' : 'Share'}</span>
                </button>
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2 leading-snug">
                {product.name}
              </h2>

              {/* Rating Bar */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.floor(product.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-neutral-800">{product.rating || 4.9}</span>
                <span className="text-xs text-neutral-700 font-medium">({product.reviews_count || 32} contractor reviews)</span>
                {product.in_stock === false ? (
                  <span className="ml-auto text-xs font-bold text-neutral-800 bg-neutral-100 px-2.5 py-0.5 rounded border border-neutral-300">
                    Sold Out
                  </span>
                ) : (
                  <span className="ml-auto text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-300">
                    In Stock
                  </span>
                )}
              </div>

              {/* Price / Quote indicator */}
              <div className="bg-[#faf9f6] p-3.5 rounded-2xl border border-neutral-200/80 mb-5">
                <span className="text-xs text-neutral-800 font-bold block">Pricing Structure:</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-neutral-900">
                    {product.base_estimate_price > 0 ? `KSh ${Number(product.base_estimate_price).toLocaleString()}` : 'Wholesale Quotation'}
                  </span>
                  <span className="text-xs text-neutral-700 font-medium">
                    {product.base_estimate_price > 0 ? '(Estimated guide price - final total discounted upon quote)' : '(No upfront payment needed)'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-neutral-800 text-xs sm:text-sm leading-relaxed mb-5 font-normal">
                {product.full_description || product.short_description}
              </p>

              {/* Structured Specifications Table (Alibaba style) */}
              {Object.keys(parsedSpecs).length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs uppercase font-bold text-neutral-900 tracking-wider mb-2 font-mono">
                    Technical Specifications
                  </h4>
                  <div className="bg-neutral-50 rounded-xl border border-neutral-200/70 overflow-hidden divide-y divide-neutral-200/70 text-xs">
                    {Object.entries(parsedSpecs).map(([key, val]) => (
                      <div key={key} className="grid grid-cols-12 px-3 py-2">
                        <span className="col-span-5 text-neutral-700 font-bold">{key}</span>
                        <span className="col-span-7 text-neutral-900 font-semibold">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Specs / Cuts Input */}
              <div className="mb-5">
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Custom Requirements / Drum Length / Color Code (Optional):
                </label>
                <input
                  type="text"
                  maxLength={500}
                  placeholder="e.g. 50-meter drum cut, red color code, etc."
                  value={specsNote}
                  onChange={(e) => setSpecsNote(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#e67e22]/50 focus:border-[#e67e22]"
                />
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-xs font-bold text-neutral-800">Quantity:</span>
                <div className="flex items-center border border-neutral-300 rounded-full bg-white px-2 py-1 shadow-sm">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-700 text-base font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-12 text-center text-sm font-bold text-neutral-900 border-none focus:outline-none"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-700 text-base font-bold"
                  >
                    +
                  </button>
                </div>

                <span className="text-[11px] text-neutral-700 font-medium">
                  Tiered contractor bulk rates apply on 10+ units
                </span>
              </div>
            </div>

            {/* Actions: Add to Cart and Direct WhatsApp */}
            <div className="space-y-2.5 pt-4 border-t border-neutral-200">
              <button
                onClick={handleAdd}
                disabled={product.in_stock === false}
                className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                  product.in_stock === false
                    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200 shadow-none'
                    : 'bg-[#18181b] hover:bg-[#e67e22] text-white active:scale-95'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{product.in_stock === false ? 'Item Currently Sold Out' : `Add ${quantity} Item${quantity > 1 ? 's' : ''} to Quotation Cart`}</span>
              </button>

              <button
                onClick={handleDirectWhatsApp}
                className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-3 px-6 rounded-xl font-semibold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Inquire This Item Directly on WhatsApp</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
