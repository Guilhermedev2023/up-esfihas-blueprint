import { useState } from 'react';
import { Product } from '@/data/products';
import { Produto } from '@/hooks/useProdutos';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';

// Accept both Product (static) and Produto (from database)
type ProductType = Product | Produto;

interface ProductCardProps {
  product: ProductType;
  expandedId?: string | null;
  onExpand?: (id: string | null) => void;
}

export const ProductCard = ({ product, expandedId, onExpand }: ProductCardProps) => {
  const { addToCart, items, updateQuantity, removeFromCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Local state for standalone usage (when not controlled by parent)
  const [localExpanded, setLocalExpanded] = useState(false);
  
  // Use controlled state if provided, otherwise use local state
  const isExpanded = onExpand ? expandedId === product.id : localExpanded;

  const cartItem = items.find(item => item.id === product.id);
  const quantity = cartItem?.quantidade || 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Faça login para adicionar itens ao carrinho');
      navigate('/login');
      return;
    }
    addToCart(product);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity > 1) {
      updateQuantity(product.id, quantity - 1);
    } else if (quantity === 1) {
      removeFromCart(product.id);
    }
  };

  const handleCardClick = () => {
    if (!isMobile) return;
    
    if (onExpand) {
      // Controlled mode: toggle between this product and null
      onExpand(isExpanded ? null : product.id);
    } else {
      // Standalone mode: toggle local state
      setLocalExpanded(!localExpanded);
    }
  };

  return (
    <div 
      className={`flex items-stretch gap-4 rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:shadow-md ${isMobile ? 'cursor-pointer active:bg-muted/50' : ''}`}
      onClick={handleCardClick}
      role={isMobile ? 'button' : undefined}
      tabIndex={isMobile ? 0 : undefined}
      onKeyDown={isMobile ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(); } : undefined}
    >
      {/* Content Left */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-foreground">{product.nome}</h3>
            {isMobile && (
              <span className="flex-shrink-0 text-muted-foreground mt-0.5">
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </span>
            )}
          </div>
          <p 
            className={`mt-1 text-sm text-muted-foreground transition-all duration-200 ${
              isMobile && !isExpanded ? 'line-clamp-2' : ''
            }`}
          >
            {product.descricao}
          </p>
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
          loading="lazy"
          decoding="async"
          width={96}
          height={96}
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
