import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, X, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

export const FloatingCart = () => {
  const { items, total, updateQuantity, itemCount } = useCart();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animate cart when items change
  useEffect(() => {
    if (itemCount > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [itemCount]);

  if (items.length === 0) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-2xl transition-transform ${isAnimating ? 'scale-105' : 'scale-100'}`}>
      {/* Expanded view */}
      {isExpanded && (
        <div className="max-h-64 overflow-y-auto border-b border-border">
          <div className="flex items-center justify-between p-4 pb-2">
            <h3 className="font-bold text-foreground">Seu Pedido</h3>
            <button onClick={() => setIsExpanded(false)}>
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
          <div className="space-y-2 px-4 pb-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted p-3">
                <div className="flex items-center gap-3">
                  <img 
                    src={item.imagem} 
                    alt={item.nome} 
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.nome}</p>
                    <p className="text-sm text-foreground font-semibold">R$ {item.preco.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-card border border-border px-1">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantidade - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-primary hover:bg-muted"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-5 text-center text-sm font-bold text-foreground">{item.quantidade}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantidade + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-primary hover:bg-muted"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="flex items-center justify-between p-4">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3"
        >
          <div className={`relative rounded-full bg-primary p-2 transition-transform ${isAnimating ? 'scale-110' : 'scale-100'}`}>
            <ShoppingCart className="h-5 w-5 text-primary-foreground" />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
              {itemCount}
            </span>
          </div>
          <div className="text-left">
            <p className="text-xs text-muted-foreground">
              {itemCount} {itemCount === 1 ? 'item' : 'itens'}
            </p>
            <p className="text-lg font-bold text-foreground">R$ {total.toFixed(2)}</p>
          </div>
        </button>
        
        <Button 
          onClick={() => navigate('/carrinho')}
          size="lg"
          className="rounded-full px-6"
        >
          Ver Carrinho
        </Button>
      </div>
    </div>
  );
};
