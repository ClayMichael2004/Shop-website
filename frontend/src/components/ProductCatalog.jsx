import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, ChevronLeft, Search, X, ShoppingBag } from 'lucide-react';

export default function ProductCatalog({ 
  products = [], 
  onSelectProduct, 
  onAddToCart,
  selectedCategory = 'All', 
  onSelectCategory,
  searchQuery = '',
  onSearchChange,
  loading = false,
  title = "Shop",
  subtitle = null,
  categoryList = null,
  allowedCategoryFilter = null
}) {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [sortOption, setSortOption] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedColor, setSelectedColor] = useState('All');
  const itemsPerPage = 8;

  const categories = useMemo(() => {
    if (categoryList) return categoryList;
    const catSet = new Set([
      'Armoured Cables',
      'Single Core Cables',
      'Twin & Earth Cables',
      'Chandeliers & Lighting',
      'Electrical Fittings',
      'Electronics & Appliances',
      'Solar Systems & Accessories',
      'Contractor Tools & Hardware',
      'Switchgear & Meters',
      'Accessories & Sockets'
    ]);
    try {
      const stored = localStorage.getItem('kadianga_custom_categories');
      if (stored) {
        JSON.parse(stored).forEach(c => catSet.add(c));
      }
    } catch {}
    (products || []).forEach(p => {
      if (p.category) catSet.add(p.category);
    });
    return ['All', ...Array.from(catSet)];
  }, [categoryList, products]);

  // Preset color swatches matching items section layout.jpg
  const productColors = [
    { name: 'Navy', hex: '#1e3a8a' },
    { name: 'Brown', hex: '#854d0e' },
    { name: 'Grey', hex: '#64748b' },
    { name: 'Copper', hex: '#c2410c' }
  ];

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Restrict to allowed domain categories if specified (e.g. for lighting or cables pages)
    if (allowedCategoryFilter && allowedCategoryFilter.length > 0) {
      list = list.filter(p => allowedCategoryFilter.includes(p.category));
    }

    if (selectedCategory && selectedCategory !== 'All') {
      const target = selectedCategory.toLowerCase().trim();
      list = list.filter(p => {
        const cat = (p.category || '').toLowerCase();
        const sub = (p.subcategory || '').toLowerCase();

        // Exact match
        if (cat === target || sub === target) return true;

        // Aliases / Substring matching for grouped categories
        if (target === 'electrical fittings' && (cat.includes('fitting') || cat.includes('accessories') || cat.includes('socket') || sub.includes('switch') || sub.includes('outlet'))) return true;
        if (target.includes('tool') || target.includes('hardware')) {
          return cat.includes('tool') || cat.includes('hardware') || sub.includes('crimping') || sub.includes('hammer') || sub.includes('clip');
        }
        if (target.includes('solar')) {
          return cat.includes('solar') || sub.includes('solar') || sub.includes('photovoltaic');
        }
        if (target.includes('electronic') || target.includes('appliance')) {
          return cat.includes('electron') || cat.includes('appliance') || sub.includes('stabilizer') || sub.includes('regulator') || sub.includes('surge');
        }

        return cat.includes(target) || target.includes(cat) || sub.includes(target);
      });
    }

    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.short_description && p.short_description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    }

    if (sortOption === 'price_asc') {
      list.sort((a, b) => a.base_estimate_price - b.base_estimate_price);
    } else if (sortOption === 'price_desc') {
      list.sort((a, b) => b.base_estimate_price - a.base_estimate_price);
    } else if (sortOption === 'rating') {
      list.sort((a, b) => (b.rating || 4.8) - (a.rating || 4.8));
    } else if (sortOption === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [products, allowedCategoryFilter, selectedCategory, searchQuery, sortOption]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      document.getElementById('catalog-view-anchor')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="shop-section" className="w-full bg-[#fcfbf9] py-16 sm:py-20 border-b border-neutral-200/60 font-sans">
      <div id="catalog-view-anchor" className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        
        {/* Header matching items section layout.jpg with industry standard typography */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 mb-2">
              {title}
            </h2>
            {subtitle ? (
              <p className="text-sm text-neutral-700 font-normal max-w-xl leading-relaxed">
                {subtitle}
              </p>
            ) : (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-700 font-medium">
                <span>Home</span>
                <span>&gt;</span>
                <span className="text-neutral-900 font-bold">{title}</span>
                {selectedCategory !== 'All' && (
                  <>
                    <span>&gt;</span>
                    <span className="text-neutral-900 font-bold">{selectedCategory}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Catalog Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange && onSearchChange(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={`Search ${title.toLowerCase()}...`}
              className="w-full bg-white text-xs sm:text-sm pl-10 pr-9 py-2.5 rounded-full border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#18181b]/20 focus:border-neutral-900 text-neutral-900 placeholder-neutral-500 font-medium shadow-sm transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange && onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-600 hover:text-black"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar matching items section layout.jpg */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-10 border-b border-neutral-200 gap-4">
          
          {/* Left: Filter by row */}
          <div className="flex items-center flex-wrap gap-5 text-xs sm:text-sm text-neutral-800">
            <span className="text-neutral-800 font-bold text-xs uppercase tracking-wider">
              Filter by
            </span>

            {/* Categories dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'cat' ? null : 'cat')}
                className="flex items-center gap-1.5 font-semibold hover:text-black py-1 px-2 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <span>{selectedCategory === 'All' ? 'All Categories' : selectedCategory}</span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-600" />
              </button>

              {activeDropdown === 'cat' && (
                <div className="absolute top-full left-0 mt-2 w-60 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-neutral-200 py-2 z-30">
                  {categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        onSelectCategory && onSelectCategory(c);
                        setActiveDropdown(null);
                        setCurrentPage(1);
                      }}
                      className={`block w-full text-left px-4 py-2 text-xs sm:text-sm transition-colors ${
                        selectedCategory === c ? 'font-bold text-neutral-900 bg-neutral-100' : 'text-neutral-700 hover:bg-neutral-50 font-medium'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Color dropdown filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'color' ? null : 'color')}
                className="flex items-center gap-1.5 font-semibold hover:text-black py-1 px-2 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <span>Color</span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-600" />
              </button>

              {activeDropdown === 'color' && (
                <div className="absolute top-full left-0 mt-2 w-44 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-neutral-200 py-2 z-30">
                  <span className="block px-4 py-1 text-[11px] font-bold uppercase text-neutral-800">Finishes / Color</span>
                  {productColors.map((col) => (
                    <button
                      key={col.name}
                      onClick={() => {
                        setSelectedColor(col.name);
                        setActiveDropdown(null);
                      }}
                      className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-xs sm:text-sm text-neutral-800 hover:bg-neutral-50 font-medium"
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col.hex }}></div>
                      <span>{col.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Specifications dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'size' ? null : 'size')}
                className="flex items-center gap-1.5 font-semibold hover:text-black py-1 px-2 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <span>Gauges &amp; Sizes</span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-600" />
              </button>

              {activeDropdown === 'size' && (
                <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 w-48 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-neutral-200 py-2 z-30">
                  <span className="block px-4 py-1 text-[11px] font-bold uppercase text-neutral-800">Available Sizes</span>
                  {['1.5mm² (Lighting)', '2.5mm² (Ring Mains)', '4.0mm² (Heavier Load)', '16mm² - 95mm² (Armoured)', '5 Drop Cluster'].map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setActiveDropdown(null)}
                      className="block w-full text-left px-4 py-2 text-xs text-neutral-800 hover:bg-neutral-50 font-medium"
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Brand dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'brand' ? null : 'brand')}
                className="flex items-center gap-1.5 font-semibold hover:text-black py-1 px-2 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <span>Certified Brands</span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-600" />
              </button>

              {activeDropdown === 'brand' && (
                <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 w-48 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-neutral-200 py-2 z-30">
                  <span className="block px-4 py-1 text-[11px] font-bold uppercase text-neutral-800">Manufacturers</span>
                  {['Kadianga Certified', 'East African Cables', 'Schneider Electric', 'ABB Industrial'].map((b) => (
                    <button
                      key={b}
                      onClick={() => setActiveDropdown(null)}
                      className="block w-full text-left px-4 py-2 text-xs text-neutral-800 hover:bg-neutral-50 font-medium"
                    >
                      {b}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right: Default Sorting */}
          <div className="flex items-center gap-4 text-xs sm:text-sm text-neutral-800 font-semibold">
            <div className="relative">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="bg-white border border-neutral-200 rounded-xl px-3 py-1.5 font-bold cursor-pointer focus:outline-none text-neutral-900 shadow-sm"
              >
                <option value="default">Default Sorting</option>
                <option value="rating">Top Rated</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>

            <span className="text-xs text-neutral-800 font-bold font-mono">
              {filteredProducts.length} Item{filteredProducts.length === 1 ? '' : 's'}
            </span>
          </div>

        </div>

        {/* Polished Product Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-neutral-200 p-5 animate-pulse">
                <div className="w-full aspect-[4/3] bg-neutral-100 rounded-xl mb-4"></div>
                <div className="h-4 bg-neutral-100 rounded w-1/3 mb-2"></div>
                <div className="h-5 bg-neutral-100 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-neutral-100 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : paginatedProducts.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-neutral-200 p-8">
            <p className="text-base font-bold text-neutral-900 mb-1">No products found</p>
            <p className="text-xs text-neutral-700 font-medium mb-4">Try clearing your search query or selecting a different category filter.</p>
            {(searchQuery || selectedCategory !== 'All') && (
              <button
                onClick={() => {
                  onSearchChange && onSearchChange('');
                  onSelectCategory && onSelectCategory('All');
                }}
                className="px-5 py-2.5 bg-neutral-900 text-white rounded-full text-xs font-semibold hover:bg-neutral-800 transition-colors shadow-sm"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {paginatedProducts.map((prod) => (
              <div
                key={prod.id}
                onClick={() => onSelectProduct && onSelectProduct(prod)}
                className="group relative bg-white border border-neutral-300 hover:border-neutral-500 rounded-xl sm:rounded-2xl p-2.5 sm:p-5 transition-all duration-300 hover:shadow-xl flex flex-col justify-between cursor-pointer select-none"
              >
                <div>
                  {/* Product Image Frame */}
                  <div className="relative w-full aspect-[4/3] bg-gradient-to-b from-[#f9f9f9] to-[#f2f0eb] rounded-lg sm:rounded-xl overflow-hidden mb-2 sm:mb-4 flex items-center justify-center p-1.5 sm:p-3 border border-neutral-100">
                    <img
                      src={prod.image_url}
                      alt={prod.name}
                      className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Stock Status Badge */}
                    <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5">
                      {prod.in_stock === false ? (
                        <span className="bg-neutral-900 text-white text-[9px] sm:text-[11px] font-bold px-1.5 sm:px-2.5 py-0.5 rounded shadow-sm">
                          Sold Out
                        </span>
                      ) : (
                        <span className="bg-white/95 backdrop-blur-sm text-emerald-800 text-[9px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded border border-emerald-200 shadow-sm">
                          In Stock
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Subcategory Label */}
                  <span className="text-[9px] sm:text-xs font-mono font-bold text-neutral-700 uppercase tracking-wider block mb-0.5 sm:mb-1 truncate">
                    {prod.subcategory || prod.category}
                  </span>

                  {/* Product Title */}
                  <h3 className="text-xs sm:text-base font-bold text-neutral-900 line-clamp-2 leading-tight sm:leading-snug group-hover:text-[#e67e22] transition-colors mb-1 sm:mb-1.5">
                    {prod.name}
                  </h3>

                  {/* Short Description */}
                  <p className="text-[10px] sm:text-xs text-neutral-700 line-clamp-1 sm:line-clamp-2 mb-2 sm:mb-4 leading-normal sm:leading-relaxed font-normal">
                    {prod.short_description}
                  </p>
                </div>

                <div>
                  {/* Price & Action Button Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 sm:pt-3 border-t border-neutral-200 gap-1.5 sm:gap-2">
                    <div>
                      <span className="text-[11px] sm:text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60 inline-block leading-tight">
                        Price on Quote
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-neutral-500 font-medium block mt-0.5">
                        Direct Wholesale Rate
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart && onAddToCart(prod);
                      }}
                      disabled={prod.in_stock === false}
                      className={`w-full sm:w-auto px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95 ${
                        prod.in_stock === false
                          ? 'bg-neutral-200 text-neutral-600 cursor-not-allowed border border-neutral-300'
                          : 'bg-[#18181b] hover:bg-[#e67e22] text-white'
                      }`}
                      title={prod.in_stock === false ? 'Item sold out' : 'Add to quotation cart'}
                    >
                      <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                      <span>{prod.in_stock === false ? 'Sold Out' : 'Quote'}</span>
                    </button>
                  </div>

                  {/* Color Swatch Dots matching items section layout.jpg */}
                  <div className="flex items-center gap-1 sm:gap-1.5 pt-2 sm:pt-3 mt-1.5 sm:mt-2 border-t border-neutral-200">
                    <span className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-[#1e3a8a] border border-black/10"></span>
                    <span className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-[#854d0e] border border-black/10"></span>
                    <span className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-[#64748b] border border-black/10"></span>
                    <span className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-[#c2410c] border border-black/10"></span>
                    <span className="text-[9px] sm:text-[11px] text-neutral-700 ml-auto font-mono truncate">
                      {prod.sku}
                    </span>
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}

        {/* Pagination matching items section layout.jpg */}
        {totalPages > 1 && (
          <div className="mt-16 flex items-center justify-center gap-2 text-xs sm:text-sm">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="w-9 h-9 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-600 hover:text-black hover:border-black disabled:opacity-30 disabled:hover:border-neutral-200"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {[...Array(totalPages)].map((_, idx) => {
              const pageNum = idx + 1;
              const isActive = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-semibold transition-all ${
                    isActive
                      ? 'bg-black text-white shadow-sm'
                      : 'border border-neutral-200 text-neutral-700 hover:border-black hover:text-black'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="w-9 h-9 rounded-xl border border-neutral-200 flex items-center justify-center text-neutral-600 hover:text-black hover:border-black disabled:opacity-30"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
