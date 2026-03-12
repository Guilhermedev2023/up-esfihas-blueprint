import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Package, Clock, ChefHat, Truck, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const STATUS_STEPS = [
  { key: 'pago', label: 'Pedido aceito', icon: Package, progress: 25 },
  { key: 'em_preparo', label: 'Em preparo', icon: ChefHat, progress: 50 },
  { key: 'saiu_entrega', label: 'Saiu para entrega', icon: Truck, progress: 75 },
  { key: 'concluido', label: 'Entregue', icon: CheckCircle2, progress: 100 },
];

const getStatusProgress = (status: string) => {
  const step = STATUS_STEPS.find(s => s.key === status);
  return step?.progress || 10;
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'aguardando_pagamento': return 'Aguardando pagamento';
    case 'aguardando_confirmacao': return 'Aguardando confirmação';
    case 'pago': return 'Pedido aceito';
    case 'em_preparo': return 'Em preparo';
    case 'saiu_entrega': return 'Saiu para entrega';
    case 'concluido': return 'Entregue';
    case 'cancelado': return 'Cancelado';
    default: return status;
  }
};

const MeusPedidos = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
    refetchInterval: 10000,
  });

  const confirmarEntrega = useMutation({
    mutationFn: async (pedidoId: string) => {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: 'concluido' })
        .eq('id', pedidoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meus-pedidos'] });
      toast.success('Entrega confirmada! Obrigado!');
    },
  });

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Meus Pedidos</h1>

        {isLoading && <p className="text-muted-foreground">Carregando...</p>}

        {pedidos.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Você ainda não tem pedidos</p>
            <Button className="mt-4" onClick={() => navigate('/home')}>Ver Cardápio</Button>
          </div>
        )}

        <div className="space-y-4">
          {pedidos.map((pedido: any) => {
            const progress = getStatusProgress(pedido.status);
            const isCancelled = pedido.status === 'cancelado';
            const isDelivered = pedido.status === 'concluido';
            const canConfirm = pedido.status === 'saiu_entrega';

            return (
              <Card key={pedido.id} className="border">
                <CardContent className="p-4 space-y-4">
                  {/* Header */}
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
                      <Badge variant={isCancelled ? 'destructive' : isDelivered ? 'default' : 'secondary'}>
                        {getStatusLabel(pedido.status)}
                      </Badge>
                    </div>
                  </div>

                  {/* Progress bar */}
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

                  {/* Items summary */}
                  <div className="text-sm text-muted-foreground">
                    {Array.isArray(pedido.items) && pedido.items.map((item: any, i: number) => (
                      <span key={i}>
                        {item.quantidade}x {item.nome}
                        {i < pedido.items.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>

                  {/* Confirm delivery button */}
                  {canConfirm && (
                    <Button
                      className="w-full"
                      onClick={() => confirmarEntrega.mutate(pedido.id)}
                      disabled={confirmarEntrega.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Confirmar Entrega
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MeusPedidos;
