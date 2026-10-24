import React, { useState } from 'react';

export default function HeroChandelier({ onExplore }) {
  const [activeSlide, setActiveSlide] = useState(0);

  const images = [
    '/images/chandelier section.jpg',
    '/images/herosection.webp'
  ];

  const handlePrev = () => {
    setActiveSlide(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveSlide(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="relative w-full min-h-[85vh] bg-white flex flex-col justify-between overflow-hidden border-b border-neutral-200/60">
      
      {/* Top Tagline matching chandelier editorial aesthetic */}
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-8 lg:px-12 pt-6 sm:pt-8">
        <span className="text-xs uppercase tracking-widest font-semibold text-neutral-400">
          Curated Lighting &bull; 2026 Collection
        </span>
        <span className="text-xs text-neutral-400 font-light hidden sm:inline">
          Architectural Chandeliers &amp; Pendants
        </span>
      </div>

      {/* Main Grid: Left Typography + Right Photo + Right Social Strip */}
      <div className="flex-1 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 items-center px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
        
        {/* Left Column (Editorial Serif matching inspo) */}
        <div className="lg:col-span-6 flex flex-col justify-center max-w-lg">
          
          <h2 className="font-serif leading-[0.95] text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight mb-6 sm:mb-8">
            <span className="text-[#a4998e] font-serif font-normal block mb-1">
              unique
            </span>
            <span className="font-serif font-bold text-[#1a1a1a] block mb-1">
              modern
            </span>
            <span className="font-serif font-bold text-[#1a1a1a] block">
              collection
            </span>
          </h2>

          {/* Thin horizontal divider with "explore" centered on the line matching inspo */}
          <div className="relative w-full flex items-center justify-center my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300"></div>
            </div>
            <button
              onClick={onExplore}
              className="relative bg-white px-5 text-xs text-neutral-600 font-light tracking-widest lowercase hover:text-black transition-colors"
            >
              explore
            </button>
          </div>

        </div>

        {/* Right Column: Chandelier Photo */}
        <div className="lg:col-span-5 flex items-center justify-center relative">
          <div className="w-full max-w-md aspect-[3/4] overflow-hidden bg-[#e5dfd8]">
            <img
              src={images[activeSlide]}
              alt="Unique Modern Collection Chandeliers"
              className="w-full h-full object-cover object-center transition-all duration-500"
            />
          </div>
        </div>

        {/* Far Right Vertical Social Links matching chandelier section.jpg */}
        <div className="hidden lg:flex lg:col-span-1 justify-end items-center h-full">
          <div className="flex items-center gap-8 text-[11px] font-light text-neutral-500 tracking-widest [writing-mode:vertical-rl] rotate-180">
            <span className="hover:text-black cursor-pointer">facebook</span>
            <span className="hover:text-black cursor-pointer">instagram</span>
            <span className="hover:text-black cursor-pointer">twitter</span>
          </div>
        </div>

      </div>

      {/* Bottom Bar: "scroll down for more" + prev/next square buttons */}
      <div className="w-full max-w-7xl mx-auto flex items-end justify-between px-4 sm:px-8 lg:px-12 pb-6 sm:pb-8">
        
        {/* Bottom Left text matching inspo */}
        <div className="text-xs text-neutral-400 font-light tracking-wider">
          scroll down for more
        </div>

        {/* Center / Right Two Square Buttons: prev / next */}
        <div className="flex items-center">
          <button
            onClick={handlePrev}
            className="w-12 h-12 sm:w-16 sm:h-16 bg-[#eee7de] hover:bg-[#e4dcce] text-xs font-light text-neutral-800 flex items-center justify-center tracking-wider transition-colors"
            aria-label="Previous slide"
          >
            prev
          </button>
          <button
            onClick={handleNext}
            className="w-12 h-12 sm:w-16 sm:h-16 bg-[#dfd6c8] hover:bg-[#d4c9b9] text-xs font-light text-neutral-800 flex items-center justify-center tracking-wider transition-colors"
            aria-label="Next slide"
          >
            next
          </button>
        </div>

      </div>

    </section>
  );
}
