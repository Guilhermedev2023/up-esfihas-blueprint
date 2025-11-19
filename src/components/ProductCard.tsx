import { Product } from '@/data/products';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Faça login para adicionar itens ao carrinho');
      navigate('/login');
      return;
    }
    addToCart(product);
  };

  const handleCardClick = () => {
    navigate(`/produto/${product.id}`);
  };

  return (
    <Card className="overflow-hidden border-2 border-border transition-all hover:shadow-lg">
      <div className="cursor-pointer" onClick={handleCardClick}>
        <div className="aspect-square overflow-hidden bg-muted">
          <img
            src={product.imagem}
            alt={product.nome}
            className="h-full w-full object-cover transition-transform hover:scale-105"
          />
        </div>
        <CardHeader>
          <CardTitle className="text-xl">{product.nome}</CardTitle>
          <CardDescription className="line-clamp-2">{product.descricao}</CardDescription>
        </CardHeader>
      </div>
      <CardFooter className="flex flex-col gap-3">
        <div className="flex w-full items-center justify-between">
          <span className="text-2xl font-bold text-accent">
            R$ {product.preco.toFixed(2)}
          </span>
        </div>
        <Button 
          onClick={handleAddToCart}
          className="w-full"
          size="lg"
        >
          Adicionar
        </Button>
      </CardFooter>
    </Card>
  );
};
