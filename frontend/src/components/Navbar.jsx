import React, { useState } from 'react';
import { ShoppingBag, Search, X, Menu, FileText } from 'lucide-react';

export default function Navbar({ 
  cartCount = 0, 
  onOpenCart, 
  onOpenTrackQuote,
  activeSection = 'home',
  activeCategory = null,
  onNavigate,
  searchQuery = '',
  onSearchChange,
  onSearchSubmit
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'cables', label: 'Power Cables', shortLabel: 'Cables' },
    { id: 'lighting', label: 'Lighting' },
    { id: 'fittings', label: 'Electrical Fittings', shortLabel: 'Fittings', category: 'Electrical Fittings' },
    { id: 'electronics', label: 'Electronics', category: 'Electronics & Appliances' },
    { id: 'solar', label: 'Solar', category: 'Solar Systems & Accessories' },
    { id: 'tools', label: 'Tools', category: 'Contractor Tools & Hardware' },
    { id: 'products', label: 'Catalog' },
    { id: 'contact', label: 'Contact' },
  ];

  const handleNavClick = (link) => {
    if (typeof link === 'string') {
      onNavigate(link);
    } else if (link.category) {
      onNavigate('products', link.category);
    } else {
      onNavigate(link.id);
    }
    setMobileMenuOpen(false);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (onSearchSubmit) {
        onSearchSubmit();
      } else {
        onNavigate('products');
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-neutral-300 text-neutral-900 shadow-sm transition-all">
      <div className="w-full px-3 sm:px-6 lg:px-8 xl:px-10 h-20 flex items-center justify-between gap-2 sm:gap-4 lg:gap-4 xl:gap-6">
        
        {/* Left: Brand Logo pinned to the far left corner */}
        <div 
          onClick={() => handleNavClick('home')} 
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none shrink-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#18181b] group-hover:bg-[#e67e22] flex items-center justify-center text-white font-bold text-xs sm:text-sm tracking-wider transition-colors shadow-sm shrink-0">
            KE
          </div>
          <div className="flex flex-col justify-center leading-none">
            <span className="font-serif tracking-wider text-base sm:text-xl font-bold text-[#18181b]">
              KADIANGA
            </span>
            <span className="text-[9px] sm:text-xs uppercase font-sans font-bold tracking-widest text-[#e67e22]">
              Electricals
            </span>
          </div>
        </div>

        {/* Center: High-Contrast Uniform Navigation Links evenly arranged across remaining space */}
        <nav className="hidden lg:flex items-center justify-center xl:justify-evenly flex-1 gap-1 xl:gap-2.5 2xl:gap-4 min-w-0 px-1 xl:px-3">
          {navLinks.map((link) => {
            const isActive = 
              link.category 
                ? activeSection === 'products' && activeCategory === link.category
                : link.id === 'products'
                  ? activeSection === 'products' && (!activeCategory || activeCategory === 'All')
                  : activeSection === link.id;

            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link)}
                className={`text-[11px] xl:text-xs uppercase font-bold tracking-wider transition-colors py-1.5 px-1.5 xl:px-2 rounded-md whitespace-nowrap relative ${
                  isActive
                    ? 'text-[#18181b] font-black after:absolute after:-bottom-1 after:left-1.5 after:right-1.5 after:h-[2px] after:bg-[#18181b]'
                    : 'text-neutral-700 hover:text-black hover:bg-neutral-100/70 font-bold'
                }`}
                title={link.label}
              >
                <span className="hidden xl:inline">{link.label}</span>
                <span className="xl:hidden">{link.shortLabel || link.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Search Bar */}
        <div className="relative w-32 xl:w-48 2xl:w-60 hidden md:block shrink-0">
          <Search className="w-3.5 h-3.5 text-neutral-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none font-bold" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search products..."
            className="w-full bg-neutral-100 hover:bg-neutral-100/90 focus:bg-white text-xs pl-8 pr-7 py-2 rounded-full border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-neutral-900 placeholder-neutral-500 font-medium transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange && onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-neutral-500 hover:text-neutral-900"
              aria-label="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Right: Actions (Track Quote + Quotation Cart + Hamburger) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          
          {/* Track Quote Button */}
          <button
            onClick={onOpenTrackQuote}
            className="flex items-center gap-1.5 bg-white hover:bg-neutral-100 active:scale-95 transition-all text-neutral-900 px-2.5 sm:px-3 py-2 rounded-full border border-neutral-300 text-xs font-bold shadow-sm"
            title="Track status of a submitted quotation"
          >
            <FileText className="w-3.5 h-3.5 text-neutral-800" />
            <span className="hidden sm:inline">Track Quote</span>
          </button>

          {/* Quotation Cart Button */}
          <button
            onClick={onOpenCart}
            aria-label="View Quotation Cart"
            className="flex items-center gap-1.5 sm:gap-2 bg-[#18181b] hover:bg-[#e67e22] active:scale-95 transition-all text-white px-3 sm:px-3.5 py-2 rounded-full text-xs font-bold shadow-sm"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Quotation Cart</span>
            {cartCount > 0 && (
              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-[#e67e22] text-white text-[10px] font-black shadow-sm">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-neutral-800 hover:text-black hover:bg-neutral-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Search Bar & Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-neutral-200 px-5 py-4 space-y-2.5 shadow-xl max-h-[80vh] overflow-y-auto">
          {/* Mobile Search Input */}
          <div className="relative w-full mb-3 md:hidden">
            <Search className="w-4 h-4 text-neutral-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleNavClick('products');
                }
              }}
              placeholder="Search catalog products..."
              className="w-full bg-neutral-100 text-xs pl-9 pr-4 py-2.5 rounded-full border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 text-neutral-900 font-medium placeholder-neutral-500"
            />
          </div>

          <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-600 font-bold px-2 pt-1">
            Store Navigation
          </div>

          {navLinks.map((link) => {
            const isActive = 
              link.category 
                ? activeSection === 'products' && activeCategory === link.category
                : link.id === 'products'
                  ? activeSection === 'products' && (!activeCategory || activeCategory === 'All')
                  : activeSection === link.id;

            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link)}
                className={`flex items-center justify-between w-full text-left px-3 py-2 rounded-xl text-xs uppercase font-bold tracking-wider transition-colors ${
                  isActive
                    ? 'bg-neutral-900 text-white font-black'
                    : 'text-neutral-700 hover:bg-neutral-100 hover:text-black'
                }`}
              >
                <span>{link.label}</span>
                {link.category && (
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                    Category
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-2 border-t border-neutral-200">
            {/* Mobile Track Quote button */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenTrackQuote();
              }}
              className="block w-full text-left px-3 py-2.5 rounded-xl text-xs uppercase font-bold tracking-wider text-[#e67e22] hover:bg-orange-50"
            >
              📋 Track My Quotation
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
