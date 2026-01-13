import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { QrCode, Truck, Copy, CheckCircle2, MapPin } from 'lucide-react';
import { generateWhatsAppMessage, sendToWhatsApp } from '@/utils/whatsappMessage';
import { toast } from 'sonner';
import { AddressConfirmationModal, ConfirmedAddress } from '@/components/AddressConfirmationModal';

const pixCode = '00020126740014BR.GOV.BCB.PIX0114436060510001740234linknabio.gg/christopher-rubin-6235204000053039865802BR5921CHRISTOPHER-RUBIN-6236009SAO PAULO62070503***6304CFF6';

const Pagamento = () => {
  const navigate = useNavigate();
  const { items, deliveryFee, setDeliveryFee } = useCart();
  const { user } = useAuth();
  const subtotal = items.reduce((sum, item) => sum + item.preco * item.quantidade, 0);
  const [metodoPagamento, setMetodoPagamento] = useState<'pix' | 'entrega' | ''>('');
  const [pixCopiado, setPixCopiado] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [confirmedAddress, setConfirmedAddress] = useState<ConfirmedAddress | null>(null);

  // Get observacoes from localStorage
  const [observacoes, setObservacoes] = useState('');
  useEffect(() => {
    const saved = localStorage.getItem('pedido_observacoes');
    if (saved) setObservacoes(saved);
  }, []);

  // Update delivery fee when address is confirmed
  useEffect(() => {
    if (confirmedAddress) {
      setDeliveryFee(confirmedAddress.taxaEntrega);
    }
  }, [confirmedAddress, setDeliveryFee]);

  const totalComTaxa = subtotal + (confirmedAddress?.taxaEntrega || deliveryFee);

  const handleCopyPixCode = () => {
    navigator.clipboard.writeText(pixCode);
    setPixCopiado(true);
    toast.success('Código PIX copiado!');
    setTimeout(() => setPixCopiado(false), 3000);
  };

  // Get profile address data
  const getProfileAddress = () => {
    if (!user) return null;
    
    // Try to get from localStorage users array
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const fullUserData = users.find((u: any) => u.email === user.email);
    
    if (fullUserData) {
      return {
        endereco: fullUserData.endereco,
        bairro: fullUserData.bairro
      };
    }
    
    // Fallback to user object
    if ('endereco' in user && 'bairro' in user) {
      return {
        endereco: (user as any).endereco,
        bairro: (user as any).bairro
      };
    }
    
    return null;
  };

  const handleFinalizarClick = () => {
    if (!metodoPagamento) {
      toast.error('Selecione uma forma de pagamento');
      return;
    }

    if (!user) {
      toast.error('Faça login para continuar');
      navigate('/login');
      return;
    }

    // Show address confirmation modal
    setShowAddressModal(true);
  };

  const handleAddressConfirm = (address: ConfirmedAddress) => {
    setConfirmedAddress(address);
    setShowAddressModal(false);
    
    // Now generate and send WhatsApp message
    const orderDetails = {
      nome: user!.nome,
      telefone: user!.telefone || '',
      endereco: {
        rua: address.rua,
        numero: address.numero,
        complemento: address.complemento,
        bairro: address.bairro
      },
      items,
      subtotal,
      taxaEntrega: address.taxaEntrega,
      total: subtotal + address.taxaEntrega,
      metodoPagamento: metodoPagamento as 'pix' | 'entrega',
      observacoes: observacoes || undefined
    };

    const message = generateWhatsAppMessage(orderDetails);
    sendToWhatsApp(message);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Área de seleção de pagamento */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl">Forma de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={metodoPagamento} onValueChange={(value) => setMetodoPagamento(value as 'pix' | 'entrega')}>
                  <Card className="mb-4 cursor-pointer transition-all hover:border-primary hover:shadow-md">
                    <CardContent className="flex items-center gap-4 p-4">
                      <RadioGroupItem value="pix" id="pix" />
                      <Label htmlFor="pix" className="flex flex-1 cursor-pointer items-center gap-3">
                        <QrCode className="h-6 w-6 text-primary" />
                        <div>
                          <p className="font-semibold">PIX</p>
                          <p className="text-sm text-muted-foreground">Pagamento instantâneo</p>
                        </div>
                      </Label>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer transition-all hover:border-primary hover:shadow-md">
                    <CardContent className="flex items-center gap-4 p-4">
                      <RadioGroupItem value="entrega" id="entrega" />
                      <Label htmlFor="entrega" className="flex flex-1 cursor-pointer items-center gap-3">
                        <Truck className="h-6 w-6 text-primary" />
                        <div>
                          <p className="font-semibold">Pagamento na Entrega</p>
                          <p className="text-sm text-muted-foreground">Dinheiro ou cartão (motoboy leva maquininha)</p>
                        </div>
                      </Label>
                    </CardContent>
                  </Card>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Área de PIX */}
            {metodoPagamento === 'pix' && (
              <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <QrCode className="h-6 w-6 text-primary" />
                    Pague com PIX
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* QR Code */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="rounded-lg bg-white p-4 shadow-lg">
                      <img 
                        src="/images/qr-code-pix.png" 
                        alt="QR Code PIX" 
                        className="w-64 h-64 object-contain"
                      />
                    </div>
                    <p className="text-sm text-center text-muted-foreground max-w-md">
                      Escaneie o QR Code acima com seu app de banco ou use o código PIX abaixo
                    </p>
                  </div>

                  {/* Código Copia e Cola */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Código Copia e Cola PIX:</Label>
                    <div className="flex gap-2">
                      <div className="flex-1 rounded-lg bg-muted p-3 font-mono text-xs break-all">
                        {pixCode}
                      </div>
                      <Button 
                        onClick={handleCopyPixCode}
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                      >
                        {pixCopiado ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Instrução */}
                  <div className="rounded-lg bg-primary/10 p-4 space-y-3">
                    <p className="font-semibold text-sm">📱 Como pagar:</p>
                    <ol className="text-sm space-y-1 ml-4 list-decimal">
                      <li>Escaneie o QR Code OU copie o código PIX</li>
                      <li>Abra seu app de banco e faça o pagamento</li>
                      <li>Clique no botão abaixo para enviar o comprovante</li>
                    </ol>
                    <p className="text-xs text-muted-foreground italic mt-3">
                      ⚠️ Seu pedido só é confirmado após enviar o comprovante pelo WhatsApp.
                    </p>
                  </div>

                  {/* Botão de enviar comprovante */}
                  <Button 
                    onClick={handleFinalizarClick}
                    className="w-full"
                    size="lg"
                  >
                    ✅ Já paguei – Enviar Comprovante no WhatsApp
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Área de Pagamento na Entrega */}
            {metodoPagamento === 'entrega' && (
              <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-accent/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Truck className="h-6 w-6 text-primary" />
                    Pagamento na Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-lg bg-accent/10 p-6 space-y-4">
                    <p className="text-base">
                      💳 O motoboy levará a maquininha. Você pode pagar em <strong>cartão de crédito</strong>, <strong>débito</strong> ou <strong>dinheiro</strong>.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Seu pedido será confirmado assim que você finalizar pelo WhatsApp.
                    </p>
                  </div>

                  <Button 
                    onClick={handleFinalizarClick}
                    className="w-full"
                    size="lg"
                  >
                    📲 Finalizar Pedido pelo WhatsApp
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Resumo do Pedido */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20 border-2">
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Confirmed Address Display */}
                {confirmedAddress && (
                  <div className="rounded-lg bg-primary/5 p-3 space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <MapPin className="h-4 w-4" />
                      Endereço de entrega
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {confirmedAddress.rua}, {confirmedAddress.numero}
                      {confirmedAddress.complemento && `, ${confirmedAddress.complemento}`}
                    </p>
                    <p className="text-sm font-medium">{confirmedAddress.bairro}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Taxa de entrega</span>
                    {confirmedAddress ? (
                      <span>R$ {confirmedAddress.taxaEntrega.toFixed(2)}</span>
                    ) : (
                      <span className="text-muted-foreground">A confirmar</span>
                    )}
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span className="text-primary">R$ {totalComTaxa.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/carrinho')}
                    className="w-full"
                  >
                    ← Voltar ao Carrinho
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Address Confirmation Modal */}
      <AddressConfirmationModal
        open={showAddressModal}
        onOpenChange={setShowAddressModal}
        profileAddress={getProfileAddress()}
        onConfirm={handleAddressConfirm}
      />
    </div>
  );
};

export default Pagamento;
