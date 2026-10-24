import React from 'react';
import { Star, Box, ChevronRight } from 'lucide-react';

export default function HeroHome({ onGetStarted }) {
  return (
    <section className="relative w-full min-h-[90vh] flex items-center justify-center overflow-hidden bg-[#181615] text-white">
      {/* Background Image matching herosection.webp / home hero section.jpg */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/herosection.webp"
          alt="Build your dream home"
          className="w-full h-full object-cover object-center filter brightness-[0.72] contrast-[1.05]"
        />
        {/* Warm ambient gradient overlays matching inspo lighting */}
        <div className="absolute inset-0 bg-black/35"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#181615] via-transparent to-black/20"></div>
      </div>

      {/* Main Hero Content matching home hero section.jpg */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 text-center flex flex-col items-center pt-12 sm:pt-16 pb-20 sm:pb-24">

        {/* Hero Title matching inspo */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-sans font-bold tracking-tight text-white mb-4 max-w-4xl drop-shadow-md">
          Build your dream home
        </h1>

        {/* Hero Subtitle matching inspo */}
        <p className="text-base sm:text-xl md:text-2xl text-white max-w-2xl font-normal mb-10 tracking-wide drop-shadow">
          Discover and create your perfect living space with us.
        </p>

        {/* "Get Started >" Button matching inspo */}
        <button
          onClick={onGetStarted}
          className="group inline-flex items-center gap-2 bg-[#f4ebe1] hover:bg-white text-[#181615] px-8 py-3.5 rounded-full text-base font-semibold shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200"
        >
          <span>Get Started</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Frosted Glass Bottom Stats Bar matching home hero section.jpg */}
        <div className="mt-20 w-full max-w-4xl bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-2xl border border-white/15 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 text-white">
          
          {/* Stat 1: 4.8 Rating */}
          <div className="flex items-center justify-center gap-2 pt-2 sm:pt-0">
            <div className="flex text-amber-400">
              {[...Array(4)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
              <Star className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-lg font-bold tracking-wide">4.8</span>
          </div>

          {/* Stat 2: Stylish interiors */}
          <div className="flex items-center justify-center gap-2.5 pt-2 sm:pt-0">
            <Box className="w-5 h-5 text-neutral-200 stroke-[1.5]" />
            <div className="text-left leading-tight">
              <span className="text-sm font-semibold tracking-wide block text-white">Stylish</span>
              <span className="text-xs text-neutral-100 font-medium block">interiors</span>
            </div>
          </div>

          {/* Stat 3: 250k Customers */}
          <div className="flex flex-col items-center justify-center pt-2 sm:pt-0 leading-tight">
            <span className="text-2xl font-bold tracking-tight text-white">250k</span>
            <span className="text-xs text-neutral-100 font-medium">Customers served</span>
          </div>

          {/* Stat 4: Save 20% */}
          <div className="flex flex-col items-center justify-center pt-2 sm:pt-0 leading-tight">
            <span className="text-2xl font-bold tracking-tight">Save 20%</span>
          </div>

        </div>

      </div>
    </section>
  );
}
