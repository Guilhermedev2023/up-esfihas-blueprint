import { useBannerPromocional } from '@/hooks/useBannerPromocional';
import { useProdutos } from '@/hooks/useProdutos';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import { useState } from 'react';

export const PromoBanner = () => {
  const { data: banner } = useBannerPromocional();
  const { data: produtos } = useProdutos(false);
  const { addToCart } = useCart();
  const [isPressed, setIsPressed] = useState(false);

  if (!banner?.ativo || !banner.produto_id || !banner.imagem_url) return null;

  const produto = produtos?.find(p => p.id === banner.produto_id);
  if (!produto) return null;

  const precoFinal = banner.valor_promocional ?? produto.preco;

  const handleClick = () => {
    addToCart({ ...produto, preco: precoFinal });
    setIsPressed(true);
    toast.success(`${produto.nome} adicionado ao carrinho!`);
    setTimeout(() => setIsPressed(false), 300);
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 pt-3">
      <button
        onClick={handleClick}
        className={`relative w-full overflow-hidden rounded-xl shadow-md transition-all duration-200 hover:shadow-xl active:scale-[0.98] ${isPressed ? 'scale-[0.97]' : ''}`}
      >
        <img
          src={banner.imagem_url}
          alt={banner.titulo || 'Promoção'}
          loading="lazy"
          className="w-full h-auto object-cover"
        />
      </button>
    </div>
  );
};
