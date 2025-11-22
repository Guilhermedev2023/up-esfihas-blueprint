import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { getDeliveryFee } from '@/utils/deliveryFees';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { getPaymentLink, whatsappUrl } from '@/utils/paymentLinks';
import { toast } from 'sonner';

const Carrinho = () => {
  const { items, updateQuantity, removeFromCart, clearCart, total, deliveryFee, setDeliveryFee } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'entrega'>('online');

  useEffect(() => {
    if (user && 'bairro' in user) {
      const fee = getDeliveryFee((user as any).bairro);
      if (fee !== null) {
        setDeliveryFee(fee);
      }
    }
  }, [user, setDeliveryFee]);

  if (items.length === 0) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <Card className="mx-auto max-w-md text-center">
            <CardContent className="py-12">
              <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <h2 className="mb-2 text-2xl font-bold">Seu carrinho está vazio</h2>
              <p className="mb-6 text-muted-foreground">
                Adicione esfihas deliciosas ao seu pedido
              </p>
              <Button onClick={() => navigate('/home')} size="lg">
                Ver Cardápio
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Seu Pedido</h1>
          <Button variant="outline" onClick={clearCart}>
            Esvaziar carrinho
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                        <img
                          src={item.imagem}
                          alt={item.nome}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <h3 className="font-bold">{item.nome}</h3>
                          <p className="text-sm text-muted-foreground">{item.categoria}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, item.quantidade - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-bold">
                              {item.quantidade}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, item.quantidade + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-lg font-bold text-accent">
                              R$ {(item.preco * item.quantidade).toFixed(2)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={() => navigate('/home')}
              className="mt-4 w-full"
            >
              Adicionar mais itens
            </Button>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardContent className="p-6">
                <h2 className="mb-4 text-xl font-bold">Resumo do Pedido</h2>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>
                  {deliveryFee > 0 ? (
                    <div className="flex justify-between">
                      <span>Taxa de entrega</span>
                      <span>R$ {deliveryFee.toFixed(2)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Taxa de entrega</span>
                      <span>A calcular</span>
                    </div>
                  )}
                  <div className="my-4 border-t pt-4">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span className="text-accent">R$ {(total + deliveryFee).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Forma de Pagamento</Label>
                    <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as 'online' | 'entrega')}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="online" id="online" />
                        <Label htmlFor="online" className="font-normal cursor-pointer">Pagar Online</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="entrega" id="entrega" />
                        <Label htmlFor="entrega" className="font-normal cursor-pointer">Pagar na Entrega</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button
                    onClick={() => {
                      if (paymentMethod === 'online') {
                        // Verificar se há apenas um item no carrinho
                        if (items.length === 1) {
                          const item = items[0];
                          const paymentLink = getPaymentLink(item.nome);
                          
                          if (paymentLink) {
                            // Redirecionar para o link de pagamento
                            window.location.href = paymentLink;
                          } else {
                            toast.error('Link de pagamento não encontrado para este produto. Entre em contato conosco.');
                          }
                        } else {
                          toast.error('Por favor, adicione apenas um produto ao carrinho para pagamento online.');
                        }
                      } else {
                        // Redirecionar para WhatsApp
                        window.location.href = whatsappUrl;
                      }
                    }}
                    className="w-full"
                    size="lg"
                  >
                    Continuar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Carrinho;
