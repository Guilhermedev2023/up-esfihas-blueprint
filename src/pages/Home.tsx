import { useState } from 'react';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { CategoryBar } from '@/components/CategoryBar';
import { CategoryBanner } from '@/components/CategoryBanner';
import { FloatingCart } from '@/components/FloatingCart';
import { HeroSlider } from '@/components/HeroSlider';
import { categories, categoryBanners } from '@/data/products';
import { useProdutos, Produto } from '@/hooks/useProdutos';
import { Loader2 } from 'lucide-react';

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { data: produtos, isLoading } = useProdutos(false); // Only active products

  const filteredProducts = selectedCategory
    ? produtos?.filter(p => p.categoria === selectedCategory) || []
    : produtos || [];

  // Group products by category for "Todas" view
  const productsByCategory = categories.reduce((acc, category) => {
    acc[category] = produtos?.filter(p => p.categoria === category) || [];
    return acc;
  }, {} as Record<string, Produto[]>);

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
                  <ProductCard key={product.id} product={product} />
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
                        <ProductCard key={product.id} product={product} />
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
