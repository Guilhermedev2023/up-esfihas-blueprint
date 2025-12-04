import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, X, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export const FloatingCart = () => {
  const { items, total, updateQuantity, removeFromCart, itemCount } = useCart();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t-2 border-primary shadow-2xl">
      {/* Expanded view */}
      {isExpanded && (
        <div className="max-h-64 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-foreground">Seu Pedido</h3>
            <button onClick={() => setIsExpanded(false)}>
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted p-2">
                <div className="flex items-center gap-2">
                  <img 
                    src={item.imagem} 
                    alt={item.nome} 
                    className="h-10 w-10 rounded-md object-cover"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.nome}</p>
                    <p className="text-xs text-foreground">R$ {item.preco.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantidade - 1)}
                    className="rounded-full bg-primary/10 p-1 text-primary hover:bg-primary/20"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-foreground">{item.quantidade}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantidade + 1)}
                    className="rounded-full bg-primary/10 p-1 text-primary hover:bg-primary/20"
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
          <div className="relative">
            <ShoppingCart className="h-6 w-6 text-primary" />
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
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
          className="px-8"
        >
          Ver Carrinho
        </Button>
      </div>
    </div>
  );
};
