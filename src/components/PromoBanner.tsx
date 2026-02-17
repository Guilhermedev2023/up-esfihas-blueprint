import { useBannerPromocional } from '@/hooks/useBannerPromocional';
import { useProdutos } from '@/hooks/useProdutos';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import { Tag } from 'lucide-react';

export const PromoBanner = () => {
  const { data: banner } = useBannerPromocional();
  const { data: produtos } = useProdutos(false);
  const { addToCart } = useCart();

  if (!banner?.ativo || !banner.produto_id) return null;

  const produto = produtos?.find(p => p.id === banner.produto_id);
  if (!produto) return null;

  const precoFinal = banner.valor_promocional ?? produto.preco;

  const handleClick = () => {
    addToCart({ ...produto, preco: precoFinal });
    toast.success(`${produto.nome} adicionado ao carrinho por R$ ${precoFinal.toFixed(2)}!`);
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 pt-3">
      <button
        onClick={handleClick}
        className="relative w-full overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 transition-all hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
      >
        <div className="flex items-center gap-3 p-3 sm:p-4">
          {banner.imagem_url ? (
            <img
              src={banner.imagem_url}
              alt={banner.titulo || 'Promoção'}
              className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg object-cover flex-shrink-0"
            />
          ) : produto.imagem ? (
            <img
              src={produto.imagem}
              alt={produto.nome}
              className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg object-cover flex-shrink-0"
            />
          ) : null}
          <div className="flex-1 text-left">
            <div className="flex items-center gap-1.5 mb-1">
              <Tag className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                {banner.titulo || 'Promoção'}
              </span>
            </div>
            <p className="text-sm font-bold text-foreground sm:text-base">{produto.nome}</p>
            {banner.valor_promocional && banner.valor_promocional < produto.preco && (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground line-through">
                  R$ {produto.preco.toFixed(2)}
                </span>
                <span className="text-sm font-bold text-primary">
                  R$ {precoFinal.toFixed(2)}
                </span>
              </div>
            )}
          </div>
          <span className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground whitespace-nowrap">
            Adicionar
          </span>
        </div>
      </button>
    </div>
  );
};
