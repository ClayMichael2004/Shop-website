import React from 'react';
import HeroHome from './HeroHome';
import { ArrowRight, ShieldCheck, Truck, FileText, CheckCircle2, ShoppingBag } from 'lucide-react';

export default function HomePage({
  products,
  onNavigate,
  onSelectProduct,
  onAddToCart
}) {
  const featuredProducts = products.filter(p => p.featured).slice(0, 4);

  return (
    <div className="w-full flex flex-col font-sans">
      
      {/* 1. Main Inspiring Home Hero */}
      <HeroHome
        onGetStarted={() => onNavigate('products')}
        onSelectHeroTab={onNavigate}
      />

      {/* 2. Flagship Category Gateway Cards matching industry standards */}
      <section className="w-full bg-[#fcfbf9] py-20 border-b border-neutral-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs uppercase font-mono tracking-widest text-neutral-700 block mb-2 font-bold">
              Core Specialties
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 mb-3">
              Engineered Power &amp; Architectural Illumination
            </h2>
            <p className="text-sm text-neutral-700 font-medium leading-relaxed">
              Kadianga Electricals supplies certified electrical power distribution hardware alongside luxury curated lighting fixtures for modern residences, commercial developments, and hospitality projects.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            
            {/* Gateway 1: Lighting & Chandeliers */}
            <div 
              onClick={() => onNavigate('lighting')}
              className="group relative bg-white rounded-3xl border border-neutral-200/90 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
                <img
                  src="/images/chandelier section.jpg"
                  alt="Architectural Lighting and Chandeliers"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute top-4 left-4">
                  <span className="bg-white/95 backdrop-blur-sm text-neutral-900 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                    Lighting Collection
                  </span>
                </div>
              </div>

              <div className="p-5 sm:p-8 flex flex-col justify-between flex-1">
                <div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-2 group-hover:text-[#e67e22] transition-colors">
                    Architectural Lighting &amp; Chandeliers
                  </h3>
                  <p className="text-sm text-neutral-700 font-normal leading-relaxed mb-6">
                    Discover Nordic luxury drop pendants, linear kitchen island chandeliers, bi-directional wall lights, and dimmable track spotlights designed to transform living spaces.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-900 group-hover:text-[#e67e22] transition-colors pt-4 border-t border-neutral-100">
                  <span>Explore Lighting Page</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            {/* Gateway 2: Power Cables & Hardware */}
            <div 
              onClick={() => onNavigate('cables')}
              className="group relative bg-[#141416] text-white rounded-3xl border border-neutral-800 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-neutral-900">
                <img
                  src="/images/armured cable.jpg"
                  alt="Power Cables and Hardware"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 filter brightness-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute top-4 left-4">
                  <span className="bg-neutral-800/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/10 shadow-sm">
                    Power &amp; Hardware
                  </span>
                </div>
              </div>

              <div className="p-5 sm:p-8 flex flex-col justify-between flex-1">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-[#e67e22] transition-colors">
                    Power Cables &amp; Industrial Hardware
                  </h3>
                  <p className="text-sm text-neutral-200 font-normal leading-relaxed mb-6">
                    BS 5467 &amp; IEC certified copper armoured underground cables, single core conduit wires, circuit breakers, and digital smart meters for electrical contractors.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 text-sm font-semibold text-white group-hover:text-[#e67e22] transition-colors pt-4 border-t border-neutral-800">
                  <span>Explore Power Cables Page</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 3. Featured Contractor Best Sellers */}
      {featuredProducts.length > 0 && (
        <section className="w-full bg-white py-20 border-b border-neutral-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
              <div>
                <span className="text-xs uppercase font-mono tracking-widest text-neutral-700 block mb-2 font-bold">
                  Curated Highlights
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900">
                  Featured Contractor Essentials
                </h2>
              </div>
              <button
                onClick={() => onNavigate('products')}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-900 hover:text-[#e67e22] transition-colors"
              >
                <span>View Full Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
              {featuredProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => onSelectProduct && onSelectProduct(prod)}
                  className="group relative bg-[#faf9f6] border border-neutral-300 hover:border-neutral-500 rounded-2xl p-5 transition-all duration-300 hover:shadow-xl flex flex-col justify-between cursor-pointer select-none"
                >
                  <div>
                    <div className="relative w-full aspect-[4/3] bg-white rounded-xl overflow-hidden mb-4 flex items-center justify-center p-3 border border-neutral-100">
                      <img
                        src={prod.image_url}
                        alt={prod.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      />
                      {prod.in_stock === false && (
                        <span className="absolute top-2 left-2 bg-neutral-900 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-sm">
                          Sold Out
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-mono font-bold text-neutral-700 uppercase tracking-wider block mb-1 truncate">
                      {prod.subcategory || prod.category}
                    </span>

                    <h4 className="text-sm font-bold text-neutral-900 line-clamp-2 leading-snug group-hover:text-[#e67e22] transition-colors mb-2">
                      {prod.name}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-neutral-200 mt-4">
                    <span className="text-base font-bold text-neutral-900">
                      KSh {Number(prod.base_estimate_price || 0).toLocaleString()}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart && onAddToCart(prod);
                      }}
                      disabled={prod.in_stock === false}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                        prod.in_stock === false
                          ? 'bg-neutral-200 text-neutral-600 cursor-not-allowed'
                          : 'bg-neutral-900 hover:bg-[#e67e22] text-white active:scale-95 shadow-sm'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Quote</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* 4. Why Electrical Contractors Trust Kadianga */}
      <section className="w-full bg-[#faf9f6] py-20 border-b border-neutral-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
          
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs uppercase font-mono tracking-widest text-neutral-700 block mb-2 font-bold">
              The Kadianga Standard
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 mb-2">
              Why Building Contractors Choose Us
            </h2>
            <p className="text-xs sm:text-sm text-neutral-700 font-medium">
              We eliminate supply bottlenecks with certified cable stock and direct digital quote dispatch.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#e67e22] flex items-center justify-center mb-4">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-neutral-900 text-base mb-2">100% Electrolytic Copper</h3>
              <p className="text-xs text-neutral-700 font-normal leading-relaxed">
                Annealed high-conductivity copper insulated with lead-free XLPE and PVC. Compliant with BS 5467 &amp; KEBS.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-neutral-900 text-base mb-2">Direct Contractor Quotes</h3>
              <p className="text-xs text-neutral-700 font-normal leading-relaxed">
                Add required cable drums, switchgear, and chandeliers to quotation cart and dispatch via WhatsApp or Email in seconds.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-neutral-900 text-base mb-2">Site Logistics Delivery</h3>
              <p className="text-xs text-neutral-700 font-normal leading-relaxed">
                Dispatched directly from our Nairobi Industrial Area warehouse to your construction site or regional project depot.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-neutral-900 text-base mb-2">Warranty &amp; Support</h3>
              <p className="text-xs text-neutral-700 font-normal leading-relaxed">
                90-day limited warranty against manufacturer defects. Dedicated engineering team available on phone and WhatsApp.
              </p>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
}
