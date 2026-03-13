import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Truck, CheckCircle2, MapPin, Tag, Gift, CreditCard,
  Loader2, Home, AlertCircle, Clock, Ruler, ArrowLeft, ChevronRight,
  Banknote, Smartphone
} from 'lucide-react';
import { generateWhatsAppMessage, sendToWhatsApp } from '@/utils/whatsappMessage';
import { toast } from 'sonner';
import { useStoreOpen } from '@/hooks/useStoreOpen';
import { ClosedStoreMessage } from '@/components/ClosedStoreMessage';
import { usePromocoes, useCuponsUsuario, useContarPedidosTelefone, calcularDescontos } from '@/hooks/usePromocoes';
import { supabase } from '@/integrations/supabase/client';
import { calculateDeliveryFee, DeliveryCalculation } from '@/hooks/useDeliveryConfig';
import StripeCheckoutForm from '@/components/StripeCheckoutForm';

type CheckoutStep = 'address' | 'payment';

export interface ConfirmedAddress {
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  taxaEntrega: number;
  origem: 'profile' | 'custom';
  distanciaKm?: number;
  tempoEstimado?: number;
}

type PaymentMethod = 'card_online' | 'pix_entrega' | 'dinheiro_entrega' | 'maquininha_entrega' | '';

const Pagamento = () => {
  const navigate = useNavigate();
  const { items, deliveryFee, setDeliveryFee, clearCart } = useCart();
  const { user, session } = useAuth();
  const subtotal = items.reduce((sum, item) => sum + item.preco * item.quantidade, 0);
  const { data: isOpen = true } = useStoreOpen();

  // Step management
  const [step, setStep] = useState<CheckoutStep>('address');
  const [confirmedAddress, setConfirmedAddress] = useState<ConfirmedAddress | null>(null);
  const [pedidoCriado, setPedidoCriado] = useState<{ numero: number; id: string } | null>(null);

  // Address state
  const [addressOption, setAddressOption] = useState<'profile' | 'custom'>('profile');
  const [customRua, setCustomRua] = useState('');
  const [customNumero, setCustomNumero] = useState('');
  const [customBairro, setCustomBairro] = useState('');
  const [customComplemento, setCustomComplemento] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [profileDelivery, setProfileDelivery] = useState<DeliveryCalculation | null>(null);
  const [customDelivery, setCustomDelivery] = useState<DeliveryCalculation | null>(null);

  // Payment state
  const [metodoPagamento, setMetodoPagamento] = useState<PaymentMethod>('');
  const [salvandoPedido, setSalvandoPedido] = useState(false);
  const [cupomGerado, setCupomGerado] = useState<string | null>(null);

  // Stripe state
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [creatingIntent, setCreatingIntent] = useState(false);

  // Promoções
  const { promocoes } = usePromocoes();
  const telefone = user?.telefone;
  const { data: cuponsDisponiveis = [] } = useCuponsUsuario(telefone);
  const { data: numPedidos = 0 } = useContarPedidosTelefone(telefone);

  const currentDeliveryFee = confirmedAddress?.taxaEntrega || deliveryFee;
  const { melhorDesconto, freteGratis } = calcularDescontos(subtotal, currentDeliveryFee, promocoes, numPedidos, cuponsDisponiveis);
  const descontoValor = melhorDesconto?.valor || 0;
  const taxaEntregaFinal = freteGratis ? 0 : currentDeliveryFee;
  const totalFinal = subtotal - descontoValor + taxaEntregaFinal;

  const [observacoes, setObservacoes] = useState('');
  useEffect(() => {
    const saved = localStorage.getItem('pedido_observacoes');
    if (saved) setObservacoes(saved);
  }, []);

  // Load Stripe key
  useEffect(() => {
    const loadKey = async () => {
      try {
        const { data } = await supabase.functions.invoke('get-stripe-key');
        if (data?.publishableKey) setStripePromise(loadStripe(data.publishableKey));
      } catch { /* Stripe unavailable */ }
    };
    loadKey();
  }, []);

  // Redirect if no items or not logged in
  useEffect(() => {
    if (items.length === 0) navigate('/carrinho');
    if (!user) { toast.error('Faça login para continuar'); navigate('/login'); }
  }, [items, user, navigate]);

  // Profile address parsing
  const getProfileAddress = () => {
    if (!user) return null;
    if (user.endereco && user.bairro) return { endereco: user.endereco, bairro: user.bairro };
    return null;
  };

  const profileAddress = getProfileAddress();
  const parseProfileAddress = () => {
    if (!profileAddress?.endereco) return { rua: '', numero: '', complemento: '' };
    const parts = profileAddress.endereco.split(',').map(p => p.trim());
    return { rua: parts[0] || '', numero: parts[1] || '', complemento: parts[2] || '' };
  };
  const parsedProfile = parseProfileAddress();
  const hasValidProfileAddress = !!(profileAddress?.endereco && profileAddress?.bairro && parsedProfile.rua && parsedProfile.numero);

  // Set default address option
  useEffect(() => {
    if (!hasValidProfileAddress) setAddressOption('custom');
  }, [hasValidProfileAddress]);

  // Auto-calculate profile delivery
  useEffect(() => {
    if (step === 'address' && hasValidProfileAddress && profileAddress?.bairro && !profileDelivery) {
      const fullAddress = `${parsedProfile.rua}, ${parsedProfile.numero}, ${profileAddress.bairro}, Florianópolis, SC`;
      setIsCalculating(true);
      calculateDeliveryFee(fullAddress)
        .then(result => setProfileDelivery(result))
        .finally(() => setIsCalculating(false));
    }
  }, [step, hasValidProfileAddress]);

  const isCustomFormValid = customRua.trim() && customNumero.trim() && customBairro.trim();

  const handleCalculateCustomDelivery = async () => {
    if (!isCustomFormValid) { toast.error('Preencha Rua, Número e Bairro'); return; }
    const fullAddress = `${customRua.trim()}, ${customNumero.trim()}, ${customBairro.trim()}, Florianópolis, SC`;
    setIsCalculating(true);
    try {
      const result = await calculateDeliveryFee(fullAddress);
      setCustomDelivery(result);
      if (!result.success) toast.error(result.error || 'Erro ao calcular taxa de entrega');
    } catch { toast.error('Erro ao calcular taxa de entrega'); }
    finally { setIsCalculating(false); }
  };

  // ---- ORDER CREATION ----
  const gerarNumeroPedido = async (): Promise<number> => {
    const { data, error } = await supabase.rpc('proximo_numero_pedido');
    if (error || !data) return Date.now() % 100000;
    return data as number;
  };

  const salvarPedidoDB = async (
    address: ConfirmedAddress,
    recalcTaxa: number,
    recalcTotal: number,
    authUserId: string,
    status = 'pendente'
  ): Promise<{ numero: number; id: string } | null> => {
    try {
      const numeroPedido = await gerarNumeroPedido();
      const pedidoData = {
        numero: numeroPedido,
        user_id: authUserId,
        telefone: user?.telefone ?? '',
        items: items.map(item => ({ id: item.id, nome: item.nome, preco: item.preco, quantidade: item.quantidade, categoria: item.categoria })),
        subtotal,
        taxa_entrega: recalcTaxa,
        total: recalcTotal,
        endereco: {
          rua: address.rua,
          numero: address.numero,
          complemento: address.complemento || '',
          bairro: address.bairro,
          distancia_km: address.distanciaKm ?? null,
          tempo_estimado_min: address.tempoEstimado ?? null,
        },
        metodo_pagamento: 'pendente',
        status,
      };

      const { data, error } = await supabase.from('pedidos').insert(pedidoData).select('id').single();

      if (error) {
        console.error('Erro ao criar pedido:', error);
        return null;
      }

      return { numero: numeroPedido, id: data.id };
    } catch (err) {
      console.error('Erro inesperado ao salvar pedido:', err);
      return null;
    }
  };

  const gerarCupomSegundoPedido = async () => {
    if (!telefone) return;
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/gerar-cupom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ telefone }),
      });
      const data = await res.json();
      if (data.cupom) setCupomGerado(data.cupom.codigo);
    } catch { /* Silent */ }
  };

  const marcarCupomUsado = async (cupomId: string) => {
    await supabase.rpc('usar_cupom', { _cupom_id: cupomId });
  };

  // Called when user clicks "Usar esse endereço"
  const handleConfirmAddress = async (address: ConfirmedAddress) => {
    if (!isOpen) { toast.error('😔 O delivery está fechado no momento.'); return; }
    if (salvandoPedido) return;

    if (!address.rua?.trim() || !address.numero?.trim() || !address.bairro?.trim()) {
      toast.error('Preencha o endereço completo antes de continuar.');
      return;
    }

    if (!Number.isFinite(address.distanciaKm ?? NaN)) {
      toast.error('Não foi possível validar a distância da entrega.');
      return;
    }

    const recalcTaxa = freteGratis ? 0 : address.taxaEntrega;
    const recalcTotal = subtotal - descontoValor + recalcTaxa;

    if (![recalcTaxa, subtotal, recalcTotal].every((value) => Number.isFinite(value))) {
      toast.error('Valores do pedido inválidos. Recalcule o frete e tente novamente.');
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();
    const authUserId = authData.user?.id;

    if (authError || !authUserId) {
      toast.error('Sessão expirada. Faça login novamente.');
      return;
    }

    setSalvandoPedido(true);

    try {
      setConfirmedAddress(address);
      setDeliveryFee(address.taxaEntrega);

      if (melhorDesconto?.cupomId) await marcarCupomUsado(melhorDesconto.cupomId);
      if (numPedidos === 0) await gerarCupomSegundoPedido();

      const result = await salvarPedidoDB(address, recalcTaxa, recalcTotal, authUserId, 'pendente');
      if (!result) {
        toast.error('Erro ao criar pedido. Tente novamente.');
        return;
      }

      setPedidoCriado(result);
      setStep('payment');
      toast.success(`Pedido #${result.numero} criado! Escolha a forma de pagamento.`);
    } finally {
      setSalvandoPedido(false);
    }
  };

  // ---- PAYMENT HANDLERS ----
  const handleFinalizarWhatsApp = async (paymentType: string) => {
    if (!confirmedAddress || !pedidoCriado || !user) return;

    const recalcTaxa = freteGratis ? 0 : confirmedAddress.taxaEntrega;
    const recalcTotal = subtotal - descontoValor + recalcTaxa;

    await supabase.from('pedidos').update({ metodo_pagamento: paymentType }).eq('id', pedidoCriado.id);

    const paymentLabels: Record<string, string> = {
      'pix_entrega': 'PIX na entrega',
      'dinheiro_entrega': 'Dinheiro',
      'maquininha_entrega': 'Maquininha (cartão)',
    };

    const orderDetails = {
      nome: user.nome, telefone: user.telefone || '',
      endereco: { rua: confirmedAddress.rua, numero: confirmedAddress.numero, complemento: confirmedAddress.complemento, bairro: confirmedAddress.bairro },
      items, subtotal, taxaEntrega: recalcTaxa, total: recalcTotal,
      metodoPagamento: 'entrega' as 'entrega',
      observacoes: observacoes || undefined
    };

    let descontoTexto = '';
    if (melhorDesconto) descontoTexto = `\n🏷️ ${melhorDesconto.label}: -R$ ${descontoValor.toFixed(2)}`;
    if (freteGratis) descontoTexto += '\n🚚 Frete grátis aplicado!';

    const baseMessage = generateWhatsAppMessage(orderDetails);
    const messageWithPedido = baseMessage.replace('Olá,', `Olá, Pedido #${pedidoCriado.numero} —`);
    const messageWithPayment = messageWithPedido.replace(
      '💳 Pagamento:',
      `💳 Pagamento: ${paymentLabels[paymentType] || paymentType}`
    );
    const message = descontoTexto ? messageWithPayment.replace('💰 Total:', `${descontoTexto}\n💰 Total:`) : messageWithPayment;

    if (cupomGerado) toast.success(`🎉 Você ganhou o cupom ${cupomGerado} para seu próximo pedido!`, { duration: 10000 });

    clearCart();
    localStorage.removeItem('pedido_observacoes');
    sendToWhatsApp(message);
  };

  const handlePagarOnline = async () => {
    if (!pedidoCriado) return;
    setCreatingIntent(true);

    await supabase.from('pedidos').update({ metodo_pagamento: 'card_online' }).eq('id', pedidoCriado.id);

    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: { pedido_id: pedidoCriado.id, amount: Math.round(totalFinal * 100) },
      });
      if (error) throw error;
      setClientSecret(data.clientSecret);
    } catch (err: any) {
      toast.error('Erro ao iniciar pagamento: ' + (err.message || 'tente novamente'));
    }
    setCreatingIntent(false);
  };

  const handleStripeSuccess = () => {
    if (cupomGerado) toast.success(`🎉 Você ganhou o cupom ${cupomGerado} para seu próximo pedido!`, { duration: 10000 });
    toast.success('Pagamento realizado com sucesso!');
    clearCart();
    localStorage.removeItem('pedido_observacoes');
    navigate('/meus-pedidos');
  };

  // ---- RENDER ----
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto max-w-5xl px-4 py-8">
        {!isOpen && <div className="mb-6"><ClosedStoreMessage /></div>}

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${step === 'address' ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'}`}>
            <MapPin className="h-4 w-4" /> 1. Endereço
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${step === 'payment' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            <CreditCard className="h-4 w-4" /> 2. Pagamento
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">

            {/* ========== STEP 1: ADDRESS ========== */}
            {step === 'address' && (
              <div className="space-y-4">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <MapPin className="h-6 w-6 text-primary" />
                      Endereço de Entrega
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={addressOption} onValueChange={(v) => setAddressOption(v as 'profile' | 'custom')} className="space-y-4">

                      {/* Profile Address */}
                      <Card className={`cursor-pointer transition-all ${addressOption === 'profile' ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <RadioGroupItem value="profile" id="profile" className="mt-1" />
                            <Label htmlFor="profile" className="flex-1 cursor-pointer">
                              <div className="flex items-center gap-2 mb-2">
                                <Home className="h-4 w-4 text-primary" />
                                <span className="font-semibold">Endereço do Cadastro</span>
                              </div>
                              {hasValidProfileAddress ? (
                                <div className="space-y-1 text-sm text-muted-foreground">
                                  <p><strong>Rua:</strong> {parsedProfile.rua}</p>
                                  <p><strong>Número:</strong> {parsedProfile.numero}</p>
                                  {parsedProfile.complemento && <p><strong>Complemento:</strong> {parsedProfile.complemento}</p>}
                                  <p><strong>Bairro:</strong> {profileAddress?.bairro}</p>

                                  {isCalculating && addressOption === 'profile' ? (
                                    <div className="flex items-center gap-2 mt-2 text-primary">
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      <span>Calculando taxa de entrega...</span>
                                    </div>
                                  ) : profileDelivery?.success ? (
                                    <div className="mt-3 p-3 bg-primary/10 rounded-lg space-y-1">
                                      <div className="flex items-center gap-2 text-primary font-medium">
                                        <Ruler className="h-4 w-4" />
                                        <span>Distância: {profileDelivery.distanceKm?.toFixed(1)} km</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-primary font-medium">
                                        <Clock className="h-4 w-4" />
                                        <span>Tempo estimado: ~{profileDelivery.estimatedMinutes} min</span>
                                      </div>
                                      <p className="text-lg font-bold text-primary">
                                        Taxa de entrega: R$ {profileDelivery.deliveryFee?.toFixed(2)}
                                      </p>
                                    </div>
                                  ) : profileDelivery?.error ? (
                                    <div className="flex items-center gap-2 mt-2 text-destructive">
                                      <AlertCircle className="h-4 w-4" />
                                      <span>{profileDelivery.error}</span>
                                    </div>
                                  ) : null}
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <AlertCircle className="h-4 w-4 text-amber-500" />
                                  <span>Endereço incompleto no cadastro</span>
                                </div>
                              )}
                            </Label>
                          </div>

                          {addressOption === 'profile' && hasValidProfileAddress && profileDelivery?.success && (
                            <Button
                              onClick={() => handleConfirmAddress({
                                rua: parsedProfile.rua,
                                numero: parsedProfile.numero,
                                complemento: parsedProfile.complemento || undefined,
                                bairro: profileAddress!.bairro!,
                                taxaEntrega: profileDelivery.deliveryFee!,
                                origem: 'profile',
                                distanciaKm: profileDelivery.distanceKm,
                                tempoEstimado: profileDelivery.estimatedMinutes
                              })}
                              className="w-full mt-4"
                              size="lg"
                              disabled={salvandoPedido || !isOpen}
                            >
                              {salvandoPedido ? (
                                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Criando pedido...</>
                              ) : (
                                '✅ Usar esse endereço'
                              )}
                            </Button>
                          )}
                        </CardContent>
                      </Card>

                      {/* Custom Address */}
                      <Card className={`cursor-pointer transition-all ${addressOption === 'custom' ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <RadioGroupItem value="custom" id="custom" className="mt-1" />
                            <Label htmlFor="custom" className="flex-1 cursor-pointer">
                              <div className="flex items-center gap-2 mb-2">
                                <MapPin className="h-4 w-4 text-primary" />
                                <span className="font-semibold">Outro endereço</span>
                              </div>
                              <p className="text-sm text-muted-foreground">Use um endereço diferente para este pedido</p>
                            </Label>
                          </div>

                          {addressOption === 'custom' && (
                            <div className="space-y-4 mt-4 pt-4 border-t">
                              <div className="space-y-2">
                                <Label htmlFor="customRua">Rua *</Label>
                                <Input id="customRua" value={customRua} onChange={(e) => { setCustomRua(e.target.value); setCustomDelivery(null); }} placeholder="Nome da rua" />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="customNumero">Número *</Label>
                                <Input id="customNumero" value={customNumero} onChange={(e) => { setCustomNumero(e.target.value); setCustomDelivery(null); }} placeholder="Número" />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="customBairro">Bairro *</Label>
                                <Input id="customBairro" value={customBairro} onChange={(e) => { setCustomBairro(e.target.value); setCustomDelivery(null); }} placeholder="Nome do bairro" />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="customComplemento">Complemento (opcional)</Label>
                                <Input id="customComplemento" value={customComplemento} onChange={(e) => setCustomComplemento(e.target.value)} placeholder="Apto, bloco, etc." />
                              </div>

                              {!customDelivery && (
                                <Button onClick={handleCalculateCustomDelivery} variant="outline" className="w-full" disabled={!isCustomFormValid || isCalculating}>
                                  {isCalculating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Calculando...</> : 'Calcular taxa de entrega'}
                                </Button>
                              )}

                              {customDelivery?.success && (
                                <div className="p-3 bg-primary/10 rounded-lg space-y-1">
                                  <div className="flex items-center gap-2 text-primary font-medium">
                                    <Ruler className="h-4 w-4" />
                                    <span>Distância: {customDelivery.distanceKm?.toFixed(1)} km</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-primary font-medium">
                                    <Clock className="h-4 w-4" />
                                    <span>Tempo estimado: ~{customDelivery.estimatedMinutes} min</span>
                                  </div>
                                  <p className="text-lg font-bold text-primary">
                                    Taxa de entrega: R$ {customDelivery.deliveryFee?.toFixed(2)}
                                  </p>
                                </div>
                              )}

                              {customDelivery?.error && (
                                <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive">
                                  <AlertCircle className="h-4 w-4" />
                                  <span>{customDelivery.error}</span>
                                </div>
                              )}

                              <Button
                                onClick={() => handleConfirmAddress({
                                  rua: customRua.trim(),
                                  numero: customNumero.trim(),
                                  complemento: customComplemento.trim() || undefined,
                                  bairro: customBairro.trim(),
                                  taxaEntrega: customDelivery!.deliveryFee!,
                                  origem: 'custom',
                                  distanciaKm: customDelivery?.distanceKm,
                                  tempoEstimado: customDelivery?.estimatedMinutes
                                })}
                                className="w-full"
                                size="lg"
                                disabled={!customDelivery?.success || salvandoPedido || !isOpen}
                              >
                                {salvandoPedido ? (
                                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Criando pedido...</>
                                ) : (
                                  '✅ Usar esse endereço'
                                )}
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </RadioGroup>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ========== STEP 2: PAYMENT ========== */}
            {step === 'payment' && confirmedAddress && pedidoCriado && (
              <div className="space-y-6">
                {/* Confirmed address summary */}
                <Card className="border-2 border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-700 dark:text-green-400">Endereço confirmado</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {confirmedAddress.rua}, {confirmedAddress.numero}
                      {confirmedAddress.complemento && `, ${confirmedAddress.complemento}`} — {confirmedAddress.bairro}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      📦 Pedido #{pedidoCriado.numero} • {confirmedAddress.distanciaKm?.toFixed(1)} km • ~{confirmedAddress.tempoEstimado} min
                    </p>
                  </CardContent>
                </Card>

                {/* Payment method selection */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-2xl">Forma de Pagamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={metodoPagamento} onValueChange={(v) => { setMetodoPagamento(v as PaymentMethod); setClientSecret(null); }}>
                      {/* Online Card */}
                      <Card className="mb-4 cursor-pointer transition-all hover:border-primary hover:shadow-md">
                        <CardContent className="flex items-center gap-4 p-4">
                          <RadioGroupItem value="card_online" id="card_online" />
                          <Label htmlFor="card_online" className="flex flex-1 cursor-pointer items-center gap-3">
                            <CreditCard className="h-6 w-6 text-primary" />
                            <div>
                              <p className="font-semibold">Pagamento Online</p>
                              <p className="text-sm text-muted-foreground">Cartão de crédito, Apple Pay, Google Pay</p>
                            </div>
                          </Label>
                        </CardContent>
                      </Card>

                      {/* PIX na entrega */}
                      <Card className="mb-4 cursor-pointer transition-all hover:border-primary hover:shadow-md">
                        <CardContent className="flex items-center gap-4 p-4">
                          <RadioGroupItem value="pix_entrega" id="pix_entrega" />
                          <Label htmlFor="pix_entrega" className="flex flex-1 cursor-pointer items-center gap-3">
                            <Smartphone className="h-6 w-6 text-primary" />
                            <div>
                              <p className="font-semibold">PIX</p>
                              <p className="text-sm text-muted-foreground">Pague com PIX na entrega</p>
                            </div>
                          </Label>
                        </CardContent>
                      </Card>

                      {/* Dinheiro */}
                      <Card className="mb-4 cursor-pointer transition-all hover:border-primary hover:shadow-md">
                        <CardContent className="flex items-center gap-4 p-4">
                          <RadioGroupItem value="dinheiro_entrega" id="dinheiro_entrega" />
                          <Label htmlFor="dinheiro_entrega" className="flex flex-1 cursor-pointer items-center gap-3">
                            <Banknote className="h-6 w-6 text-primary" />
                            <div>
                              <p className="font-semibold">Dinheiro</p>
                              <p className="text-sm text-muted-foreground">Pague em dinheiro na entrega</p>
                            </div>
                          </Label>
                        </CardContent>
                      </Card>

                      {/* Maquininha */}
                      <Card className="cursor-pointer transition-all hover:border-primary hover:shadow-md">
                        <CardContent className="flex items-center gap-4 p-4">
                          <RadioGroupItem value="maquininha_entrega" id="maquininha_entrega" />
                          <Label htmlFor="maquininha_entrega" className="flex flex-1 cursor-pointer items-center gap-3">
                            <CreditCard className="h-6 w-6 text-primary" />
                            <div>
                              <p className="font-semibold">Maquininha</p>
                              <p className="text-sm text-muted-foreground">Débito ou crédito na entrega</p>
                            </div>
                          </Label>
                        </CardContent>
                      </Card>
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* Online Payment - Stripe */}
                {metodoPagamento === 'card_online' && (
                  <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <CreditCard className="h-6 w-6 text-primary" />
                        Pagamento Online
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {!clientSecret && !creatingIntent && (
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            Pague com cartão de crédito, débito, Apple Pay ou Google Pay de forma segura.
                          </p>
                          <Button onClick={handlePagarOnline} className="w-full" size="lg">
                            💳 Pagar R$ {totalFinal.toFixed(2)}
                          </Button>
                        </div>
                      )}
                      {creatingIntent && (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          <span>Preparando pagamento...</span>
                        </div>
                      )}
                      {clientSecret && stripePromise && (
                        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#ea580c' } } }}>
                          <StripeCheckoutForm total={totalFinal} onSuccess={handleStripeSuccess} onError={(err) => toast.error(err)} />
                        </Elements>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Entrega payments (PIX, Dinheiro, Maquininha) */}
                {(metodoPagamento === 'pix_entrega' || metodoPagamento === 'dinheiro_entrega' || metodoPagamento === 'maquininha_entrega') && (
                  <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-accent/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Truck className="h-6 w-6 text-primary" />
                        Pagamento na Entrega
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="rounded-lg bg-accent/10 p-6 space-y-4">
                        {metodoPagamento === 'pix_entrega' && (
                          <p className="text-base">
                            📱 Você pagará via <strong>PIX</strong> quando o motoboy chegar. Tenha o app do banco pronto!
                          </p>
                        )}
                        {metodoPagamento === 'dinheiro_entrega' && (
                          <p className="text-base">
                            💵 Você pagará em <strong>dinheiro</strong> na entrega. Valor total: <strong>R$ {totalFinal.toFixed(2)}</strong>
                          </p>
                        )}
                        {metodoPagamento === 'maquininha_entrega' && (
                          <p className="text-base">
                            💳 O motoboy levará a <strong>maquininha</strong>. Você pode pagar em cartão de crédito ou débito.
                          </p>
                        )}
                      </div>
                      <Button onClick={() => handleFinalizarWhatsApp(metodoPagamento)} className="w-full" size="lg">
                        📲 Finalizar Pedido pelo WhatsApp
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Right column: order summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20 border-2">
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.quantidade}x {item.nome}</span>
                      <span>R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 border-t pt-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                  {melhorDesconto && (
                    <div className="flex justify-between text-sm text-green-600 font-medium">
                      <span className="flex items-center gap-1"><Tag className="h-3 w-3" />{melhorDesconto.label}</span>
                      <span>-R$ {descontoValor.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Taxa de entrega</span>
                    {freteGratis ? (
                      <span className="text-green-600 font-medium flex items-center gap-1"><Truck className="h-3 w-3" /> Grátis!</span>
                    ) : confirmedAddress ? (
                      <span>R$ {currentDeliveryFee.toFixed(2)}</span>
                    ) : (
                      <span className="text-muted-foreground">A calcular</span>
                    )}
                  </div>
                  {freteGratis && (
                    <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-2 text-center">
                      <p className="text-xs text-green-600 font-medium">🚚 Frete grátis aplicado!</p>
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span className="text-primary">R$ {totalFinal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {cuponsDisponiveis.length > 0 && !melhorDesconto?.cupomId && (
                  <div className="rounded-lg bg-primary/5 p-3 space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <Gift className="h-4 w-4" />
                      Cupom disponível!
                    </div>
                    <p className="text-xs text-muted-foreground">Será aplicado automaticamente se for o melhor benefício.</p>
                  </div>
                )}

                <div className="space-y-2 pt-4">
                  <Button variant="outline" onClick={() => step === 'payment' ? setStep('address') : navigate('/carrinho')} className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {step === 'payment' ? 'Alterar endereço' : 'Voltar ao Carrinho'}
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
