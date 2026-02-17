import { useState } from 'react';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { CategoryBar } from '@/components/CategoryBar';
import { CategoryBanner } from '@/components/CategoryBanner';
import { PromoBanner } from '@/components/PromoBanner';
import { FloatingCart } from '@/components/FloatingCart';
import { HeroSlider } from '@/components/HeroSlider';
import { Footer } from '@/components/Footer';
import { categories, categoryBanners } from '@/data/products';
import { useProdutos, Produto } from '@/hooks/useProdutos';
import { Loader2 } from 'lucide-react';

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const { data: produtos, isLoading } = useProdutos(false); // Only active products

  const filteredProducts = selectedCategory
    ? produtos?.filter(p => p.categoria === selectedCategory) || []
    : produtos || [];

  // Group products by category for "Todas" view
  const productsByCategory = categories.reduce((acc, category) => {
    acc[category] = produtos?.filter(p => p.categoria === category) || [];
    return acc;
  }, {} as Record<string, Produto[]>);

  // Reset expanded product when category changes
  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
    setExpandedProductId(null);
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header />

      {/* Hero Section with Slider */}
      <HeroSlider />

      {/* Category Bar Sticky */}
      <CategoryBar 
        selectedCategory={selectedCategory} 
        onSelectCategory={handleCategoryChange} 
      />

      {/* Promotional Banner */}
      <PromoBanner />

      {/* Menu Section */}
      <section className="pt-6">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : selectedCategory ? (
            // Single category view
            <>
              <CategoryBanner 
                title={categoryBanners[selectedCategory] || selectedCategory}
              />
              <div className="space-y-3">
                {filteredProducts.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product}
                    expandedId={expandedProductId}
                    onExpand={setExpandedProductId}
                  />
                ))}
              </div>
            </>
          ) : (
            // All categories view with banners
            <>
              {categories.map((category) => {
                const categoryProducts = productsByCategory[category];
                if (categoryProducts.length === 0) return null;
                return (
                  <div key={category} className="mb-8">
                    <CategoryBanner 
                      title={categoryBanners[category]}
                    />
                    <div className="space-y-3">
                      {categoryProducts.map((product) => (
                        <ProductCard 
                          key={product.id} 
                          product={product}
                          expandedId={expandedProductId}
                          onExpand={setExpandedProductId}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Floating Cart */}
      <FloatingCart />
    </div>
  );
};

export default Home;
