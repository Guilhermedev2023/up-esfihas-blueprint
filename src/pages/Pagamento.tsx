import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useCart } from '@/contexts/CartContext';
import { CreditCard, Smartphone, Banknote, Wallet } from 'lucide-react';

const Pagamento = () => {
  const navigate = useNavigate();
  const { items, deliveryFee } = useCart();
  const total = items.reduce((sum, item) => sum + item.preco * item.quantidade, 0);
  const [metodoPagamento, setMetodoPagamento] = useState('');
  const [troco, setTroco] = useState('');

  const handleSubmit = () => {
    if (!metodoPagamento) {
      return;
    }

    const pedido = {
      numero: Math.floor(Math.random() * 10000),
      items,
      total,
      metodoPagamento,
      troco: metodoPagamento === 'dinheiro' ? troco : null,
      data: new Date().toISOString()
    };

    localStorage.setItem('ultimoPedido', JSON.stringify(pedido));
    navigate('/confirmacao');
  };

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl">Forma de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={metodoPagamento} onValueChange={setMetodoPagamento}>
                  <Card className="mb-4 cursor-pointer transition-colors hover:border-primary">
                    <CardContent className="flex items-center gap-4 p-4">
                      <RadioGroupItem value="pix" id="pix" />
                      <Label htmlFor="pix" className="flex flex-1 cursor-pointer items-center gap-3">
                        <Smartphone className="h-6 w-6 text-primary" />
                        <div>
                          <p className="font-semibold">PIX</p>
                          <p className="text-sm text-muted-foreground">Pagamento instantâneo</p>
                        </div>
                      </Label>
                    </CardContent>
                  </Card>

                  <Card className="mb-4 cursor-pointer transition-colors hover:border-primary">
                    <CardContent className="flex items-center gap-4 p-4">
                      <RadioGroupItem value="cartao-credito" id="cartao-credito" />
                      <Label htmlFor="cartao-credito" className="flex flex-1 cursor-pointer items-center gap-3">
                        <CreditCard className="h-6 w-6 text-primary" />
                        <div>
                          <p className="font-semibold">Cartão de Crédito</p>
                          <p className="text-sm text-muted-foreground">Pague na entrega</p>
                        </div>
                      </Label>
                    </CardContent>
                  </Card>

                  <Card className="mb-4 cursor-pointer transition-colors hover:border-primary">
                    <CardContent className="flex items-center gap-4 p-4">
                      <RadioGroupItem value="cartao-debito" id="cartao-debito" />
                      <Label htmlFor="cartao-debito" className="flex flex-1 cursor-pointer items-center gap-3">
                        <Wallet className="h-6 w-6 text-primary" />
                        <div>
                          <p className="font-semibold">Cartão de Débito</p>
                          <p className="text-sm text-muted-foreground">Pague na entrega</p>
                        </div>
                      </Label>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer transition-colors hover:border-primary">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <RadioGroupItem value="dinheiro" id="dinheiro" />
                        <Label htmlFor="dinheiro" className="flex flex-1 cursor-pointer items-center gap-3">
                          <Banknote className="h-6 w-6 text-primary" />
                          <div>
                            <p className="font-semibold">Dinheiro</p>
                            <p className="text-sm text-muted-foreground">Pague na entrega</p>
                          </div>
                        </Label>
                      </div>
                      {metodoPagamento === 'dinheiro' && (
                        <div className="mt-4 space-y-2">
                          <Label htmlFor="troco">Precisa de troco para quanto?</Label>
                          <Input
                            id="troco"
                            type="number"
                            placeholder="R$ 0,00"
                            value={troco}
                            onChange={(e) => setTroco(e.target.value)}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-20 border-2">
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de entrega</span>
                    <span>R$ {deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span className="text-accent">R$ {(total + deliveryFee).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={handleSubmit}
                    disabled={!metodoPagamento}
                    className="w-full"
                    size="lg"
                  >
                    Finalizar Pedido
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/endereco')}
                    className="w-full"
                  >
                    Voltar
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

export default Pagamento;
