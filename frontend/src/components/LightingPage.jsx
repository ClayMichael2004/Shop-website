import React from 'react';
import HeroChandelier from './HeroChandelier';
import ProductCatalog from './ProductCatalog';

export default function LightingPage({
  products,
  onSelectProduct,
  onAddToCart,
  searchQuery,
  onSearchChange,
  loading
}) {
  const [selectedSubcategory, setSelectedSubcategory] = React.useState('All');

  const lightingCategories = [
    'All',
    'Luxury Ceiling Fixtures',
    'Island Chandeliers',
    'Wall Lights',
    'Pendant Lights',
    'Lighting Controls'
  ];

  const handleExploreClick = () => {
    document.getElementById('lighting-catalog-anchor')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="w-full flex flex-col">
      {/* 1. Iconic Editorial Lighting Hero Section matching chandelier section.jpg */}
      <HeroChandelier onExplore={handleExploreClick} />

      {/* Anchor for smooth scroll */}
      <div id="lighting-catalog-anchor"></div>

      {/* 2. Dedicated Lighting Product Catalog Grid */}
      <ProductCatalog
        products={products}
        onSelectProduct={onSelectProduct}
        onAddToCart={onAddToCart}
        selectedCategory={selectedSubcategory}
        onSelectCategory={setSelectedSubcategory}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        loading={loading}
        title="Architectural Lighting &amp; Chandeliers"
        subtitle="Curated Nordic drop pendants, linear kitchen island chandeliers, bi-directional wall sconces, and architectural luminaires for contemporary homes and hospitality spaces."
        allowedCategoryFilter={['Chandeliers & Lighting', 'Accessories & Sockets']}
        categoryList={lightingCategories}
      />
    </div>
  );
}
