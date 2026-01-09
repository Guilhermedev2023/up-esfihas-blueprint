import { Product } from '@/data/products';
import { Produto } from '@/hooks/useProdutos';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Minus } from 'lucide-react';

// Accept both Product (static) and Produto (from database)
type ProductType = Product | Produto;

interface ProductCardProps {
  product: ProductType;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart, items, updateQuantity, removeFromCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const cartItem = items.find(item => item.id === product.id);
  const quantity = cartItem?.quantidade || 0;

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Faça login para adicionar itens ao carrinho');
      navigate('/login');
      return;
    }
    addToCart(product);
  };

  const handleIncrement = () => {
    if (!isAuthenticated) {
      toast.error('Faça login para adicionar itens ao carrinho');
      navigate('/login');
      return;
    }
    if (quantity === 0) {
      addToCart(product);
    } else {
      updateQuantity(product.id, quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      updateQuantity(product.id, quantity - 1);
    } else if (quantity === 1) {
      removeFromCart(product.id);
    }
  };

  return (
    <div className="flex items-stretch gap-4 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md">
      {/* Content Left */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h3 className="font-bold text-foreground">{product.nome}</h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{product.descricao}</p>
        </div>
        
        <div className="mt-3">
          <span className="text-lg font-bold text-foreground">
            R$ {product.preco.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Image Right */}
      <div className="relative flex-shrink-0">
        <img
          src={product.imagem}
          alt={product.nome}
          className="h-24 w-24 rounded-lg object-cover"
        />
        
        {/* Quantity Controls */}
        <div className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-card border border-border shadow-lg">
          {quantity > 0 ? (
            <>
              <button
                onClick={handleDecrement}
                className="flex h-8 w-8 items-center justify-center rounded-full text-primary hover:bg-muted transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-6 text-center text-sm font-bold text-foreground">
                {quantity}
              </span>
              <button
                onClick={handleIncrement}
                className="flex h-8 w-8 items-center justify-center rounded-full text-primary hover:bg-muted transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              onClick={handleAddToCart}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
