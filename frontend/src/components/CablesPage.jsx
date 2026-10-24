import React, { useState } from 'react';
import HeroCables from './HeroCables';
import ProductCatalog from './ProductCatalog';

export default function CablesPage({
  products,
  onSelectProduct,
  onAddToCart,
  searchQuery,
  onSearchChange,
  loading
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const cableCategories = [
    'All',
    'Armoured Cables',
    'Single Core Cables',
    'Twin & Earth Cables',
    'Switchgear & Meters',
    'Accessories & Sockets'
  ];

  return (
    <div className="w-full flex flex-col">
      {/* 1. Power Cables Hero Banner with power.jpg */}
      <HeroCables />

      {/* Anchor for smooth scroll */}
      <div id="cables-catalog-anchor"></div>

      {/* 2. Dedicated Cables & Hardware Product Catalog Grid */}
      <ProductCatalog
        products={products}
        onSelectProduct={onSelectProduct}
        onAddToCart={onAddToCart}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        loading={loading}
        title="Power Cables &amp; Hardware Inventory"
        subtitle="Certified electrolytic copper conductors for underground mains, domestic conduit wiring, circuit protection switchgear, and commercial distribution boards."
        allowedCategoryFilter={['Armoured Cables', 'Single Core Cables', 'Twin & Earth Cables', 'Switchgear & Meters', 'Accessories & Sockets']}
        categoryList={cableCategories}
      />
    </div>
  );
}
