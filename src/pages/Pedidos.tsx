import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Package, ChefHat, Truck, CheckCircle2, ShoppingBag, CreditCard, MapPin, XCircle, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const STATUS_STEPS = [
  { key: 'aceito', label: 'Pedido aceito', icon: CheckCircle2, progress: 25 },
  { key: 'preparo', label: 'Em preparo', icon: ChefHat, progress: 50 },
  { key: 'saiu_entrega', label: 'Saiu p/ entrega', icon: Truck, progress: 75 },
  { key: 'finalizado', label: 'Finalizado', icon: CheckCircle2, progress: 100 },
];

const traduzirStatus = (status: string): string => {
  switch (status) {
    case 'pendente': return 'Pedido recebido';
    case 'aceito': return 'Pedido aceito';
    case 'preparo': return 'Em preparo';
    case 'saiu_entrega': return 'Saiu para entrega';
    case 'finalizado': return 'Pedido finalizado';
    case 'cancelado': return 'Cancelado';
    default: return status;
  }
};

const getStatusProgress = (status: string) => {
  if (status === 'pendente') return 10;
  const step = STATUS_STEPS.find(s => s.key === status);
  return step?.progress || 5;
};

const PAYMENT_LABELS: Record<string, string> = {
  'card_online': '💳 Pagamento Online',
  'pix_entrega': 'PIX na Entrega',
  'dinheiro_entrega': '💵 Dinheiro',
  'maquininha_entrega': '💳 Maquininha',
  'entrega': 'Na Entrega',
  'pendente': '⏳ Pendente',
};

const WHATSAPP_NUMBER = '5548915069666';

const Pedidos = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedPedido, setSelectedPedido] = useState<any>(null);

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ['meus-pedidos', user?.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('user_id', user?.user_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.user_id,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user?.user_id) return;

    const channel = supabase
      .channel('pedidos-cliente-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pedidos' },
        (payload) => {
          const updated = payload.new as any;
          if (updated.user_id === user.user_id) {
            queryClient.invalidateQueries({ queryKey: ['meus-pedidos'] });
            toast.info(`Pedido #${updated.numero}: ${traduzirStatus(updated.status)}`);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pedidos' },
        (payload) => {
          const inserted = payload.new as any;
          if (inserted.user_id === user.user_id) {
            queryClient.invalidateQueries({ queryKey: ['meus-pedidos'] });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.user_id, queryClient]);

  // Separate active and finished orders
  const activeOrders = pedidos.filter((p: any) => !['finalizado', 'cancelado'].includes(p.status));
  const historyOrders = pedidos.filter((p: any) => ['finalizado', 'cancelado'].includes(p.status));

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground mb-4">Faça login para ver seus pedidos</p>
          <Button onClick={() => navigate('/login')}>Fazer Login</Button>
        </div>
      </div>
    );
  }

  const renderOrderCard = (pedido: any) => {
    const progress = getStatusProgress(pedido.status);
    const isCancelled = pedido.status === 'cancelado';
    const isFinished = pedido.status === 'finalizado';

    return (
      <Card key={pedido.id} className="border cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedPedido(pedido)}>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-lg">Pedido #{pedido.numero}</span>
              <p className="text-xs text-muted-foreground">
                {new Date(pedido.created_at).toLocaleDateString('pt-BR')} às{' '}
                {new Date(pedido.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-primary">R$ {Number(pedido.total).toFixed(2)}</p>
              <Badge variant={isCancelled ? 'destructive' : isFinished ? 'default' : 'secondary'}>
                {traduzirStatus(pedido.status)}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="h-3 w-3" />
            <span>{PAYMENT_LABELS[pedido.metodo_pagamento] || pedido.metodo_pagamento}</span>
          </div>

          {!isCancelled && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between">
                {STATUS_STEPS.map((step) => {
                  const StepIcon = step.icon;
                  const isActive = progress >= step.progress;
                  return (
                    <div key={step.key} className={`flex flex-col items-center gap-1 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                      <StepIcon className="h-4 w-4" />
                      <span className="text-[10px] text-center leading-tight">{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isCancelled && (
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">Pedido cancelado</span>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            {Array.isArray(pedido.items) && pedido.items.map((item: any, i: number) => (
              <span key={i}>
                {item.quantidade}x {item.nome}
                {i < pedido.items.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>

          <Button variant="outline" size="sm" className="w-full">
            Ver detalhes
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Pedidos</h1>

        {isLoading && <p className="text-muted-foreground">Carregando...</p>}

        {pedidos.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Você ainda não tem pedidos</p>
            <Button className="mt-4" onClick={() => navigate('/home')}>Ver Cardápio</Button>
          </div>
        )}

        {/* Active orders */}
        {activeOrders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Pedidos em andamento
            </h2>
            <div className="space-y-4">
              {activeOrders.map(renderOrderCard)}
            </div>
          </div>
        )}

        {/* History */}
        {historyOrders.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Histórico</h2>
            <div className="space-y-4">
              {historyOrders.map(renderOrderCard)}
            </div>
          </div>
        )}
      </div>

      {/* WhatsApp floating button */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-full shadow-lg transition-colors"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="text-sm font-medium">Falar com o restaurante</span>
      </a>

      {/* Detail Modal */}
      <Dialog open={!!selectedPedido} onOpenChange={() => setSelectedPedido(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pedido #{selectedPedido?.numero}</DialogTitle>
          </DialogHeader>
          {selectedPedido && (
            <div className="space-y-5">
              {selectedPedido.status !== 'cancelado' ? (
                <div className="space-y-3">
                  <p className="font-semibold text-sm">Acompanhamento</p>
                  <div className="relative pl-6 space-y-4">
                    {STATUS_STEPS.map((step, idx) => {
                      const currentIdx = STATUS_STEPS.findIndex(s => s.key === selectedPedido.status);
                      const isComplete = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;
                      const StepIcon = step.icon;
                      return (
                        <div key={step.key} className="flex items-start gap-3 relative">
                          <div className={`absolute -left-6 w-4 h-4 rounded-full border-2 flex items-center justify-center ${isComplete ? 'bg-primary border-primary' : 'bg-background border-muted-foreground/30'}`}>
                            {isComplete && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          {idx < STATUS_STEPS.length - 1 && (
                            <div className={`absolute -left-[17px] top-5 w-0.5 h-6 ${isComplete ? 'bg-primary' : 'bg-muted-foreground/20'}`} />
                          )}
                          <div className={`flex items-center gap-2 ${isCurrent ? 'text-primary font-semibold' : isComplete ? 'text-foreground' : 'text-muted-foreground'}`}>
                            <StepIcon className="h-4 w-4" />
                            <span className="text-sm">{step.label}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-destructive p-3 bg-destructive/10 rounded-lg">
                  <XCircle className="h-5 w-5" />
                  <span className="font-semibold">Pedido cancelado</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Data</p>
                  <p className="font-medium">
                    {new Date(selectedPedido.created_at).toLocaleDateString('pt-BR')}{' '}
                    {new Date(selectedPedido.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pagamento</p>
                  <p className="font-medium">
                    {PAYMENT_LABELS[selectedPedido.metodo_pagamento] || selectedPedido.metodo_pagamento}
                  </p>
                </div>
              </div>

              {selectedPedido.endereco && (
                <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                  <p className="font-semibold flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Endereço de entrega
                  </p>
                  <p>
                    {(selectedPedido.endereco as any).rua}, {(selectedPedido.endereco as any).numero}
                    {(selectedPedido.endereco as any).complemento && ` - ${(selectedPedido.endereco as any).complemento}`}
                  </p>
                  <p>{(selectedPedido.endereco as any).bairro}</p>
                </div>
              )}

              <div className="space-y-2">
                <p className="font-semibold text-sm">Itens do pedido</p>
                <div className="space-y-1">
                  {Array.isArray(selectedPedido.items) && selectedPedido.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm py-1 border-b last:border-0">
                      <span>{item.quantidade}x {item.nome}</span>
                      <span>R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1 text-sm pt-2 border-t">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>R$ {Number(selectedPedido.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa de entrega</span>
                  <span>R$ {Number(selectedPedido.taxa_entrega).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-1">
                  <span>Total</span>
                  <span className="text-primary">R$ {Number(selectedPedido.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pedidos;
