import React from 'react';

export default function HeroCables() {
  return (
    <section className="relative w-full min-h-[50vh] sm:min-h-[56vh] flex items-center justify-center overflow-hidden bg-[#121214] text-white border-b border-white/10 select-none">
      
      {/* Background Photography matching power.jpg */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/power.jpg"
          alt="Power Cables & Hardware"
          className="w-full h-full object-cover object-center filter brightness-[0.45] contrast-[1.12]"
        />
        {/* Multi-layered atmospheric overlays for depth, contrast, and high-readability */}
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-black/20 to-black/60"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50"></div>
      </div>

      {/* Main Hero Content: Exactly and exclusively the three requested elements, balanced on the space */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-8 lg:px-12 text-center py-16 sm:py-28 flex flex-col items-center justify-center">
        
        {/* Eyebrow */}
        <span className="text-xs sm:text-sm font-mono uppercase tracking-[0.25em] text-[#e67e22] font-semibold mb-4 block">
          Engineering Specification
        </span>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-sans font-bold tracking-tight text-white mb-6 drop-shadow-md leading-[1.08]">
          Power Cables &amp; Hardware
        </h1>

        {/* Subtitle / Description */}
        <p className="text-base sm:text-lg md:text-xl text-neutral-200/90 font-light max-w-2xl leading-relaxed tracking-wide drop-shadow-sm">
          Certified electrolytic copper conductors for underground mains, domestic conduit wiring, and commercial switchgear installations.
        </p>

      </div>

    </section>
  );
}
