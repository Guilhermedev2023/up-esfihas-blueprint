import { useState } from 'react';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { products, categories } from '@/data/products';
import { Button } from '@/components/ui/button';

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredProducts = selectedCategory
    ? products.filter(p => p.categoria === selectedCategory)
    : products;

  return (
    <div className="min-h-screen">
      <Header />

      {/* Banner Principal */}
      <section className="bg-secondary py-12 text-center text-secondary-foreground sm:py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-4 text-3xl font-bold sm:text-5xl">
            As melhores Esfihas Artesanais da região!
          </h2>
          <p className="mb-6 text-lg sm:text-xl">
            Feitas com ingredientes selecionados e muito amor
          </p>
          <Button 
            size="lg" 
            className="text-lg"
            onClick={() => document.getElementById('cardapio')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Ver Cardápio
          </Button>
        </div>
      </section>

      {/* Categorias */}
      <section className="border-b py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(null)}
            >
              Todos
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Cardápio */}
      <section id="cardapio" className="py-12">
        <div className="container mx-auto px-4">
          <h3 className="mb-8 text-center text-3xl font-bold">
            {selectedCategory || 'Nosso Cardápio'}
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          <p className="mb-4">WhatsApp: (48) 91506966</p>
          <p className="text-sm opacity-75">Todos os dias, das 18h às 00h</p>
          <p className="mt-6 text-sm">© 2025 UP Esfihas Artesanais</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
