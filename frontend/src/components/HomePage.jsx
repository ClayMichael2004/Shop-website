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

  const categoryCards = [
    {
      id: 'lighting',
      title: 'Architectural Lighting & Chandeliers',
      tag: 'Lighting Collection',
      description: 'Discover Nordic luxury drop pendants, linear kitchen island chandeliers, bi-directional wall lights, and dimmable track spotlights designed to transform living spaces.',
      items: ['Chandeliers', 'Pendant Lights', 'Ceiling Lights', 'Outdoor Lights'],
      image: '/images/chandelier section.jpg',
      cta: 'Explore Lighting Page',
      action: () => onNavigate('lighting')
    },
    {
      id: 'cables',
      title: 'Power Cables & Industrial Hardware',
      tag: 'Power & Hardware',
      description: 'BS 5467 & IEC certified copper armoured underground cables, single core conduit wires, circuit breakers, and digital smart meters for electrical contractors.',
      items: ['Armoured Cables', 'Twin & Earth Cables', 'Single Core Cables', 'Flexible Wires'],
      image: '/images/armured cable.jpg',
      cta: 'Explore Power Cables Page',
      action: () => onNavigate('cables')
    },
    {
      id: 'fittings',
      title: 'Electrical Fittings & Switches',
      tag: 'Fittings & Switches',
      description: 'All certified electrical fittings including modular wall switches, multi-gang sockets with USB fast-chargers, weatherproof junction boxes, faceplates, and conduit adaptors.',
      items: ['Sockets & Switches', 'Wall Faceplates', 'Junction Boxes', 'Conduit Fittings'],
      image: '/images/items section layout.jpg',
      cta: 'Explore Electrical Fittings',
      action: () => onNavigate('products', 'Electrical Fittings')
    },
    {
      id: 'electronics',
      title: 'Electronics & Electrical Appliances',
      tag: 'Electronics & Appliances',
      description: 'Explore our complete range of electrical appliances, automatic digital voltage stabilizers (AVR), surge protectors, heavy-duty extension reels, and ventilation systems.',
      items: ['Voltage Stabilizers', 'Electrical Appliances', 'Surge Protectors', 'Extension Reels'],
      image: '/images/power.jpg',
      cta: 'Explore Electronics & Appliances',
      action: () => onNavigate('products', 'Electronics & Appliances')
    },
    {
      id: 'solar',
      title: 'Solar Systems & Accessories',
      tag: 'Solar & Renewable Energy',
      description: 'Complete solar energy solutions including Tier-1 high efficiency solar PV panels, hybrid pure sine wave inverters, deep-cycle lithium storage batteries, solar floodlights, and accessories.',
      items: ['Solar PV Panels', 'Hybrid Inverters', 'Lithium Batteries', 'Solar Floodlights'],
      image: '/images/herosection.webp',
      cta: 'Explore Solar Systems',
      action: () => onNavigate('products', 'Solar Systems & Accessories')
    },
    {
      id: 'tools',
      title: 'Contractor Tools & Hardware',
      tag: 'Tools & Hardware',
      description: 'Essential electrical contractor and DIY installation tools including drop-forged claw hammers, precision ratchet crimping tools, insulated pliers, PVC electrical insulation tapes, cable ties, and clips.',
      items: ['Hammers', 'Crimping Tools', 'Insulated Pliers', 'Tapes, Cable Ties & Clips'],
      image: '/images/twin cable and others.jpg',
      cta: 'Explore Tools & Hardware',
      action: () => onNavigate('products', 'Contractor Tools & Hardware')
    }
  ];

  return (
    <div className="w-full flex flex-col font-sans">
      
      {/* 1. Main Inspiring Home Hero */}
      <HeroHome
        onGetStarted={() => onNavigate('products')}
        onSelectHeroTab={onNavigate}
      />

      {/* 2. Flagship Category Gateway Cards (Expanded to 6 Cards) */}
      <section className="w-full bg-[#fcfbf9] py-16 sm:py-20 border-b border-neutral-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs uppercase font-mono tracking-widest text-[#e67e22] block mb-2 font-bold">
              Core Specialties
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-neutral-900 mb-3">
              Engineered Power, Illumination &amp; Equipment
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 font-medium leading-relaxed max-w-2xl mx-auto">
              Kadianga Electricals supplies certified electrical distribution hardware, solar equipment, luxury architectural lighting, and contractor tools for modern residential, commercial, and industrial projects.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {categoryCards.map((card) => (
              <div 
                key={card.id}
                onClick={card.action}
                className="group relative bg-white rounded-2xl sm:rounded-3xl border border-neutral-200/90 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                {/* Image Section */}
                <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100 shrink-0">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute top-3.5 left-3.5">
                    <span className="bg-white/95 backdrop-blur-sm text-neutral-900 text-xs font-semibold px-3 py-1 rounded-full shadow-sm border border-neutral-200/60">
                      {card.tag}
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-5 sm:p-6 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-neutral-900 mb-2 group-hover:text-[#e67e22] transition-colors leading-snug">
                      {card.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-600 font-normal leading-relaxed mb-4">
                      {card.description}
                    </p>

                    {/* Sub-item pills */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {card.items.map((item, idx) => (
                        <span 
                          key={idx}
                          className="text-[10px] sm:text-[11px] font-semibold bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-md border border-neutral-200/70"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Action CTA */}
                  <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-900 group-hover:text-[#e67e22] transition-colors pt-3.5 border-t border-neutral-100 mt-auto">
                    <span>{card.cta}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 3. Featured Contractor Best Sellers */}
      {featuredProducts.length > 0 && (
        <section className="w-full bg-white py-16 sm:py-20 border-b border-neutral-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 sm:mb-12">
              <div>
                <span className="text-xs uppercase font-mono tracking-widest text-[#e67e22] block mb-2 font-bold">
                  Curated Highlights
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-neutral-900">
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

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {featuredProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => onSelectProduct && onSelectProduct(prod)}
                  className="group relative bg-[#faf9f6] border border-neutral-300 hover:border-neutral-500 rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:shadow-xl flex flex-col justify-between cursor-pointer select-none"
                >
                  <div>
                    <div className="relative w-full aspect-[4/3] bg-white rounded-xl overflow-hidden mb-3.5 flex items-center justify-center p-3 border border-neutral-100">
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

                    <span className="text-[11px] sm:text-xs font-mono font-bold text-neutral-700 uppercase tracking-wider block mb-1 truncate">
                      {prod.subcategory || prod.category}
                    </span>

                    <h4 className="text-xs sm:text-sm font-bold text-neutral-900 line-clamp-2 leading-snug group-hover:text-[#e67e22] transition-colors mb-2">
                      {prod.name}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-neutral-200 mt-3 sm:mt-4">
                    <span className="text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60">
                      Price on Quote
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
      <section className="w-full bg-[#faf9f6] py-16 sm:py-20 border-b border-neutral-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs uppercase font-mono tracking-widest text-[#e67e22] block mb-2 font-bold">
              The Kadianga Standard
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 mb-2">
              Why Building Contractors Choose Us
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 font-medium">
              We eliminate supply bottlenecks with certified cable stock and direct digital quote dispatch.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#e67e22] flex items-center justify-center mb-4">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-neutral-900 text-base mb-2">100% Electrolytic Copper</h3>
              <p className="text-xs text-neutral-600 font-normal leading-relaxed">
                Annealed high-conductivity copper insulated with lead-free XLPE and PVC. Compliant with BS 5467 &amp; KEBS.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-neutral-900 text-base mb-2">Direct Contractor Quotes</h3>
              <p className="text-xs text-neutral-600 font-normal leading-relaxed">
                Add required cable drums, solar panels, and chandeliers to quotation cart and dispatch via WhatsApp or Email in seconds.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-neutral-900 text-base mb-2">Site Logistics Delivery</h3>
              <p className="text-xs text-neutral-600 font-normal leading-relaxed">
                Dispatched directly from our stores to your construction site, commercial building, or regional depot.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-neutral-900 text-base mb-2">Warranty &amp; Support</h3>
              <p className="text-xs text-neutral-600 font-normal leading-relaxed">
                Certified quality against manufacturer defects. Dedicated engineering team available on phone and WhatsApp.
              </p>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
}
