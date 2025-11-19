import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { products } from '@/data/products';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const Produto = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const product = products.find(p => p.id === id);

  if (!product) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold">Produto não encontrado</h2>
          <Button onClick={() => navigate('/home')} className="mt-4">
            Voltar ao cardápio
          </Button>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Faça login para adicionar itens ao carrinho');
      navigate('/login');
      return;
    }
    addToCart(product);
  };

  const relatedProducts = products
    .filter(p => p.categoria === product.categoria && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/home')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="overflow-hidden rounded-2xl bg-muted">
            <img
              src={product.imagem}
              alt={product.nome}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex flex-col justify-center space-y-6">
            <div>
              <h1 className="mb-2 text-4xl font-bold">{product.nome}</h1>
              <p className="text-muted-foreground">{product.categoria}</p>
            </div>

            <p className="text-lg">{product.descricao}</p>

            <div className="text-4xl font-bold text-accent">
              R$ {product.preco.toFixed(2)}
            </div>

            <Button onClick={handleAddToCart} size="lg" className="w-full text-lg sm:w-auto">
              Adicionar ao Carrinho
            </Button>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 text-2xl font-bold">Você também pode gostar</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((relatedProduct) => (
                <div
                  key={relatedProduct.id}
                  className="cursor-pointer overflow-hidden rounded-xl border-2 border-border transition-all hover:shadow-lg"
                  onClick={() => navigate(`/produto/${relatedProduct.id}`)}
                >
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img
                      src={relatedProduct.imagem}
                      alt={relatedProduct.nome}
                      className="h-full w-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold">{relatedProduct.nome}</h3>
                    <p className="text-lg font-bold text-accent">
                      R$ {relatedProduct.preco.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Produto;
