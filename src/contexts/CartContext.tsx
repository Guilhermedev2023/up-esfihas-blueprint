import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Product } from '@/data/products';
import { Produto } from '@/hooks/useProdutos';

// Accept both Product (static) and Produto (from database)
type ProductType = Product | Produto;

export interface CartItem {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  imagem: string | null;
  categoria: string;
  quantidade: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: ProductType) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantidade: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
  deliveryFee: number;
  setDeliveryFee: (fee: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);

  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      setItems(JSON.parse(storedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: ProductType) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.id === product.id);
      
      if (existingItem) {
        toast.success('Quantidade atualizada no carrinho');
        return currentItems.map(item =>
          item.id === product.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }

      toast.success('Item adicionado ao carrinho');
      return [...currentItems, { 
        id: product.id,
        nome: product.nome,
        descricao: product.descricao,
        preco: product.preco,
        imagem: product.imagem,
        categoria: product.categoria,
        quantidade: 1 
      }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== productId));
    toast.success('Item removido do carrinho');
  };

  const updateQuantity = (productId: string, quantidade: number) => {
    if (quantidade <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.id === productId ? { ...item, quantidade } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setDeliveryFee(0);
    localStorage.removeItem('cart');
  };

  const total = items.reduce((sum, item) => sum + item.preco * item.quantidade, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantidade, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, total, itemCount, deliveryFee, setDeliveryFee }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
