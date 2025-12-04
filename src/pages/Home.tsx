import { useState } from 'react';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { CategoryBar } from '@/components/CategoryBar';
import { FloatingCart } from '@/components/FloatingCart';
import { StoreStatus } from '@/components/StoreStatus';
import { products } from '@/data/products';

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredProducts = selectedCategory
    ? products.filter(p => p.categoria === selectedCategory)
    : products;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section 
        className="relative bg-cover bg-center py-16 sm:py-24"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(78, 43, 26, 0.85), rgba(78, 43, 26, 0.95)), url('/images/esfiha-carne.png')`
        }}
      >
        <div className="container mx-auto px-4 text-center">
          {/* Logo centralizada */}
          <div className="mb-6 flex justify-center">
            <img 
              src="/images/logo.jpg" 
              alt="UP Esfihas" 
              className="h-24 w-24 rounded-full border-4 border-background object-cover shadow-2xl sm:h-32 sm:w-32"
            />
          </div>
          
          <h1 className="mb-4 text-3xl font-bold text-background sm:text-5xl">
            Esfihas Artesanais
          </h1>
          <p className="mb-2 text-lg text-background/90 sm:text-2xl">
            Rápido, Quente e Saboroso
          </p>
          <p className="mb-8 text-sm text-background/80 sm:text-base">
            Feitas com ingredientes selecionados e muito amor
          </p>
          
          {/* Status da loja */}
          <div className="flex justify-center">
            <StoreStatus />
          </div>
        </div>
      </section>

      {/* Category Bar Sticky */}
      <CategoryBar 
        selectedCategory={selectedCategory} 
        onSelectCategory={setSelectedCategory} 
      />

      {/* Cardápio */}
      <section id="cardapio" className="pb-32 pt-8">
        <div className="container mx-auto px-4">
          <h3 className="mb-6 text-center text-2xl font-bold text-foreground">
            {selectedCategory || 'Cardápio Completo'}
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-brown py-8 text-background">
        <div className="container mx-auto px-4 text-center">
          <h4 className="mb-4 text-2xl font-bold">UP Esfihas Artesanais</h4>
          <p className="mb-2">Sabor que eleva sua fome!</p>
          <p className="mb-4">WhatsApp: (48) 99150-6966</p>
          <p className="text-sm opacity-75">Todos os dias, das 18h às 00h</p>
          <p className="mt-6 text-sm">2025 UP Esfihas Artesanais</p>
        </div>
      </footer>

      {/* Floating Cart */}
      <FloatingCart />
    </div>
  );
};

export default Home;
