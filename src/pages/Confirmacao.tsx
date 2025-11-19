import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { CheckCircle, Clock } from 'lucide-react';

const Confirmacao = () => {
  const navigate = useNavigate();
  const { items, clearCart, deliveryFee } = useCart();
  const [pedido, setPedido] = useState<any>(null);
  const total = items.reduce((sum, item) => sum + item.preco * item.quantidade, 0);

  useEffect(() => {
    const ultimoPedido = localStorage.getItem('ultimoPedido');
    if (ultimoPedido) {
      setPedido(JSON.parse(ultimoPedido));
      clearCart();
    } else {
      navigate('/home');
    }
  }, [clearCart, navigate]);

  if (!pedido) {
    return null;
  }

  const whatsappNumber = '5548915069666';
  const whatsappMessage = `Olá! Gostaria de acompanhar meu pedido #${pedido.numero}`;
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Card className="border-2">
          <CardContent className="p-8 text-center">
            <CheckCircle className="mx-auto mb-4 h-20 w-20 text-green-500" />
            
            <h1 className="mb-2 text-3xl font-bold">Pedido Confirmado!</h1>
            
            <p className="mb-6 text-lg text-muted-foreground">
              Sua esfiha está sendo preparada com carinho
            </p>

            <div className="mb-8 rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">Número do pedido</p>
              <p className="text-3xl font-bold text-accent">#{pedido.numero}</p>
            </div>

            <div className="mb-8 flex items-center justify-center gap-2 text-muted-foreground">
              <Clock className="h-5 w-5" />
              <span>Tempo médio de entrega: 40-60 minutos</span>
            </div>

            <Card className="mb-8 text-left">
              <CardContent className="p-4">
                <h3 className="mb-4 font-bold">Itens do Pedido</h3>
                <div className="space-y-2">
                  {pedido.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.quantidade}x {item.nome}</span>
                      <span>R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>R$ {pedido.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa de entrega</span>
                      <span>R$ {deliveryFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2 mt-2">
                      <span>Total</span>
                      <span className="text-accent">R$ {(pedido.total + deliveryFee).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded bg-muted p-3">
                  <p className="text-sm font-semibold">Forma de pagamento</p>
                  <p className="text-sm capitalize">{pedido.metodoPagamento.replace('-', ' ')}</p>
                  {pedido.troco && (
                    <p className="text-sm">Troco para: R$ {pedido.troco}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button
                onClick={() => window.open(whatsappUrl, '_blank')}
                className="w-full"
                size="lg"
              >
                Acompanhar via WhatsApp
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/home')}
                className="w-full"
              >
                Voltar ao Cardápio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Confirmacao;
