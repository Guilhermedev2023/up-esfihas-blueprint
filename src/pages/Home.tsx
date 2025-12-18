import { useState } from 'react';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { CategoryBar } from '@/components/CategoryBar';
import { CategoryBanner } from '@/components/CategoryBanner';
import { FloatingCart } from '@/components/FloatingCart';
import { HeroSlider } from '@/components/HeroSlider';
import { products, categories, categoryBanners } from '@/data/products';

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredProducts = selectedCategory
    ? products.filter(p => p.categoria === selectedCategory)
    : products;

  // Group products by category for "Todas" view
  const productsByCategory = categories.reduce((acc, category) => {
    acc[category] = products.filter(p => p.categoria === category);
    return acc;
  }, {} as Record<string, typeof products>);

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header />

      {/* Hero Section with Slider */}
      <HeroSlider />

      {/* Category Bar Sticky */}
      <CategoryBar 
        selectedCategory={selectedCategory} 
        onSelectCategory={setSelectedCategory} 
      />

      {/* Menu Section */}
      <section className="pt-6">
        <div className="container mx-auto px-4">
          {selectedCategory ? (
            // Single category view
            <>
              <CategoryBanner 
                title={categoryBanners[selectedCategory] || selectedCategory}
              />
              <div className="space-y-3">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          ) : (
            // All categories view with banners
            <>
              {categories.map((category) => (
                <div key={category} className="mb-8">
                  <CategoryBanner 
                    title={categoryBanners[category]}
                  />
                  <div className="space-y-3">
                    {productsByCategory[category].map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-12 bg-primary py-8 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h4 className="text-xl font-bold">UP Esfihas Artesanais</h4>
          <p className="mt-2 text-sm opacity-90">Sabor que eleva sua fome!</p>
          <p className="mt-2 text-sm opacity-75">WhatsApp: (48) 99150-6966</p>
          <p className="mt-1 text-sm opacity-75">Todos os dias, das 18h às 00h</p>
          <p className="mt-4 text-xs opacity-60">2025 UP Esfihas Artesanais</p>
        </div>
      </footer>

      {/* Floating Cart */}
      <FloatingCart />
    </div>
  );
};

export default Home;
