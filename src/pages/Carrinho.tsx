import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

import { useNavigate } from 'react-router-dom';
import { Plus, Minus, Trash2, ShoppingBag, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useStoreOpen } from '@/hooks/useStoreOpen';
import { ClosedStoreMessage } from '@/components/ClosedStoreMessage';

const VALOR_MINIMO_PEDIDO = 15;

const Carrinho = () => {
  const { items, updateQuantity, removeFromCart, clearCart, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: isOpen = true } = useStoreOpen();
  const [observacoes, setObservacoes] = useState('');

  // Check if user just completed an order
  const [pedidoEnviado, setPedidoEnviado] = useState(false);
  useEffect(() => {
    const flag = localStorage.getItem('pedido_enviado_sucesso');
    if (flag === 'true') {
      setPedidoEnviado(true);
      localStorage.removeItem('pedido_enviado_sucesso');
    }
  }, []);

  // Save observacoes to localStorage for use in payment page
  useEffect(() => {
    localStorage.setItem('pedido_observacoes', observacoes);
  }, [observacoes]);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <Card className="mx-auto max-w-md text-center">
            <CardContent className="py-12">
              {pedidoEnviado ? (
                <>
                  <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
                  <h2 className="mb-2 text-2xl font-bold text-foreground">Pedido Enviado com Sucesso</h2>
                  <p className="mb-6 text-muted-foreground">Acompanhe seu pedido</p>
                  <Button onClick={() => navigate('/pedidos')} size="lg">
                    Ver pedido
                  </Button>
                </>
              ) : (
                <>
                  <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                  <h2 className="mb-2 text-2xl font-bold text-foreground">Seu carrinho está vazio</h2>
                  <p className="mb-6 text-muted-foreground">
                    Adicione esfihas deliciosas ao seu pedido
                  </p>
                  <Button onClick={() => navigate('/home')} size="lg">
                    Ver Cardápio
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Seu Pedido</h1>
          <Button variant="outline" onClick={clearCart} size="sm">
            Esvaziar
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted sm:h-24 sm:w-24">
                        <img
                          src={item.imagem}
                          alt={item.nome}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-foreground sm:text-base">{item.nome}</h3>
                          <p className="text-xs text-muted-foreground sm:text-sm">{item.categoria}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 sm:h-8 sm:w-8"
                              onClick={() => updateQuantity(item.id, item.quantidade - 1)}
                            >
                              <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <span className="w-6 text-center text-sm font-bold text-foreground sm:w-8 sm:text-base">
                              {item.quantidade}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 sm:h-8 sm:w-8"
                              onClick={() => updateQuantity(item.id, item.quantidade + 1)}
                            >
                              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-4">
                            <span className="text-sm font-bold text-foreground sm:text-lg">
                              R$ {(item.preco * item.quantidade).toFixed(2)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 sm:h-8 sm:w-8"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Campo de observações */}
            <Card className="mt-6">
              <CardContent className="p-4">
                <Label htmlFor="observacoes" className="text-sm font-semibold text-foreground">
                  Observações do pedido
                </Label>
                <Textarea
                  id="observacoes"
                  placeholder="Ex: Sem cebola, entregar na portaria, etc."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
              </CardContent>
            </Card>

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
                <h2 className="mb-4 text-xl font-bold text-foreground">Resumo do Pedido</h2>

                  <div className="space-y-2">
                  <div className="flex justify-between text-foreground">
                    <span>Subtotal</span>
                    <span className="font-medium">R$ {total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Taxa de entrega</span>
                    <span>Calculada no checkout</span>
                  </div>
                  <div className="my-4 border-t pt-4">
                    <div className="flex justify-between text-xl font-bold text-foreground">
                      <span>Subtotal</span>
                      <span>R$ {total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {!isOpen && (
                  <div className="mt-2">
                    <ClosedStoreMessage />
                  </div>
                )}

                {isOpen && total < VALOR_MINIMO_PEDIDO && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      O valor mínimo para pedidos é de R$ {VALOR_MINIMO_PEDIDO.toFixed(2)}.
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={() => navigate('/pagamento')}
                  className="mt-6 w-full"
                  size="lg"
                  disabled={!isOpen || total < VALOR_MINIMO_PEDIDO}
                >
                  {isOpen ? 'Continuar para Checkout' : '🔴 Delivery Fechado'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Carrinho;
