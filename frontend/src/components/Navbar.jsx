import React, { useState } from 'react';
import { ShoppingBag, Search, X, Menu, FileText } from 'lucide-react';

export default function Navbar({ 
  cartCount = 0, 
  onOpenCart, 
  onOpenTrackQuote,
  activeSection = 'home', 
  onNavigate,
  searchQuery = '',
  onSearchChange,
  onSearchSubmit
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'cables', label: 'Power Cables' },
    { id: 'lighting', label: 'Lighting' },
    { id: 'products', label: 'Catalog' },
    { id: 'contact', label: 'Contact' },
  ];

  const handleNavClick = (sectionId) => {
    onNavigate(sectionId);
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
      <div className="max-w-7xl mx-auto px-3 sm:px-8 lg:px-12 h-20 flex items-center justify-between gap-2 sm:gap-6">
        
        {/* Left: Brand Logo */}
        <div 
          onClick={() => handleNavClick('home')} 
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none shrink-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#18181b] group-hover:bg-[#e67e22] flex items-center justify-center text-white font-bold text-xs sm:text-sm tracking-wider transition-colors shadow-sm">
            KE
          </div>
          <div>
            <span className="font-serif tracking-wider text-lg sm:text-xl font-bold text-[#18181b] flex items-center gap-1 sm:gap-1.5">
              KADIANGA
              <span className="text-[10px] sm:text-xs uppercase font-sans font-bold tracking-widest text-[#e67e22]">
                Electricals
              </span>
            </span>
          </div>
        </div>

        {/* Center: High-Contrast Uniform Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8 shrink-0">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className={`text-xs uppercase font-bold tracking-wider transition-colors py-1.5 relative ${
                activeSection === link.id
                  ? 'text-[#18181b] font-black after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[2px] after:bg-[#18181b]'
                  : 'text-neutral-700 hover:text-black font-bold'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-xs sm:max-w-sm hidden md:block">
          <Search className="w-4 h-4 text-neutral-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none font-bold" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search cables, lighting, breakers..."
            className="w-full bg-neutral-100 hover:bg-neutral-100/90 focus:bg-white text-xs pl-10 pr-8 py-2.5 rounded-full border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 text-neutral-900 placeholder-neutral-500 font-medium transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange && onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-neutral-500 hover:text-neutral-900"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: Actions (Track Quote + Quotation Cart) */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          {/* Track Quote Button */}
          <button
            onClick={onOpenTrackQuote}
            className="flex items-center gap-1.5 bg-white hover:bg-neutral-100 active:scale-95 transition-all text-neutral-900 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-full border border-neutral-300 text-xs font-bold shadow-sm"
            title="Track status of a submitted quotation"
          >
            <FileText className="w-4 h-4 text-neutral-800" />
            <span className="hidden sm:inline">Track Quote</span>
          </button>

          {/* Quotation Cart Button */}
          <button
            onClick={onOpenCart}
            aria-label="View Quotation Cart"
            className="flex items-center gap-2 bg-[#18181b] hover:bg-[#e67e22] active:scale-95 transition-all text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs font-bold shadow-sm"
          >
            <ShoppingBag className="w-4 h-4 text-white" />
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
        <div className="lg:hidden bg-white border-t border-neutral-200 px-6 py-4 space-y-3 shadow-lg">
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

          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className={`block w-full text-left px-3 py-2.5 rounded-xl text-xs uppercase font-bold tracking-wider ${
                activeSection === link.id
                  ? 'bg-neutral-100 text-[#18181b] font-black'
                  : 'text-neutral-700 hover:bg-neutral-50 hover:text-black'
              }`}
            >
              {link.label}
            </button>
          ))}

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
      )}
    </header>
  );
}
