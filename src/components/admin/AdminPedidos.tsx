import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ChevronRight, Clock, MapPin, Phone, CreditCard, Eye, Volume2, VolumeX, AlertTriangle, MessageCircle } from 'lucide-react';

const buildWhatsAppLink = (telefone: string, nome: string | null | undefined, numero: number, tipo: 'saiu' | 'finalizado'): string => {
  const digits = (telefone || '').replace(/\D/g, '');
  const phone = digits.startsWith('55') ? digits : `55${digits}`;
  const nomeStr = (nome || 'cliente').split(' ')[0];
  const msg = tipo === 'saiu'
    ? `Olá, ${nomeStr}! 🛵 Seu pedido #${numero} da UP Esfihas Artesanais já saiu para entrega! Em breve chegará no seu endereço. Obrigado pela preferência! 🫓`
    : `Olá, ${nomeStr}! ✅ Seu pedido #${numero} da UP Esfihas Artesanais foi entregue com sucesso! Obrigado pela preferência. Qualquer dúvida, estamos à disposição! 🫓`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
};


interface Pedido {
  id: string;
  numero: number;
  telefone: string;
  items: any[];
  subtotal: number;
  taxa_entrega: number;
  total: number;
  endereco: any;
  metodo_pagamento: string;
  status: string;
  created_at: string;
  user_id: string | null;
  troco: number | null;
  observacao_pagamento: string | null;
  cliente_nome?: string | null;
  goup_delivery_id?: string | null;
  goup_status?: string | null;
  goup_last_error?: string | null;
}


const STATUS_COLUMNS = [
  { key: 'pendente', label: 'Aceitar Pedido', color: 'bg-orange-500', next: 'preparo', buttonLabel: 'Aceitar Pedido' },
  { key: 'preparo', label: 'Em Preparo', color: 'bg-blue-500', next: 'saiu_entrega', buttonLabel: 'Despachar Pedido' },
  { key: 'saiu_entrega', label: 'Saiu p/ Entrega', color: 'bg-purple-500', next: 'finalizado', buttonLabel: 'Finalizar' },
  { key: 'finalizado', label: 'Finalizado', color: 'bg-green-600', next: null, buttonLabel: '' },
];

const PAYMENT_LABELS: Record<string, string> = {
  'card_online': '💳 Cartão Online',
  'pix_entrega': '🔲 PIX na Entrega',
  'pix': '🔲 PIX na Entrega',
  'dinheiro': '💵 Dinheiro',
  'dinheiro_entrega': '💵 Dinheiro',
  'maquininha': '💳 Maquininha',
  'maquininha_entrega': '💳 Maquininha',
  'entrega': '🚚 Na Entrega',
  'pendente': '⏳ Pendente',
};

const isPossibleDuplicate = (pedido: Pedido, allPedidos: Pedido[]): boolean => {
  const pedidoTime = new Date(pedido.created_at).getTime();
  return allPedidos.some(p =>
    p.id !== pedido.id &&
    p.telefone === pedido.telefone &&
    p.total === pedido.total &&
    Math.abs(new Date(p.created_at).getTime() - pedidoTime) < 5 * 60 * 1000
  );
};

export const traduzirStatus = (status: string): string => {
  switch (status) {
    case 'aguardando_pagamento': return 'Aguardando pagamento';
    case 'pendente': return 'Aguardando aceitação';
    case 'aceito': return 'Pedido aceito';
    case 'preparo': return 'Em preparo';
    case 'saiu_entrega': return 'Saiu para entrega';
    case 'finalizado': return 'Pedido finalizado';
    case 'cancelado': return 'Cancelado';
    default: return status;
  }
};

const SOUND_PREF_KEY = 'admin-sound-enabled';

const AdminPedidos = () => {
  const queryClient = useQueryClient();
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [errorDetailPedido, setErrorDetailPedido] = useState<Pedido | null>(null);
  const [alertActive, setAlertActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(SOUND_PREF_KEY);
    return stored === null ? true : stored === 'true';
  });
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDone = useRef(false);

  useEffect(() => {
    localStorage.setItem(SOUND_PREF_KEY, String(soundEnabled));
  }, [soundEnabled]);



  // Fetch store hours to determine current cycle start
  const { data: horario } = useQuery({
    queryKey: ['admin-horario-kanban'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('horario_funcionamento')
        .select('hora_abertura')
        .eq('ativo', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const cycleStart = useMemo(() => {
    const now = new Date();
    const [oh, om] = (horario?.hora_abertura || '00:00').split(':').map(Number);
    const openToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), oh, om);
    // If current time is before today's opening, use yesterday's opening
    if (now < openToday) {
      openToday.setDate(openToday.getDate() - 1);
    }
    return openToday.toISOString();
  }, [horario]);

  const { data: pedidos = [] } = useQuery({
    queryKey: ['admin-pedidos', cycleStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .gte('created_at', cycleStart)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const list = (data || []) as Pedido[];
      const userIds = Array.from(new Set(list.map(p => p.user_id).filter(Boolean))) as string[];
      if (userIds.length === 0) return list;
      const { data: profs } = await supabase
        .from('profiles')
        .select('user_id, nome')
        .in('user_id', userIds);
      const nameMap = new Map<string, string>((profs || []).map((p: any) => [p.user_id, p.nome]));
      return list.map(p => ({ ...p, cliente_nome: p.user_id ? nameMap.get(p.user_id) || null : null }));
    },
  });

  useEffect(() => {
    if (pedidos.length > 0 && !initialLoadDone.current) {
      knownIdsRef.current = new Set(pedidos.map(p => p.id));
      initialLoadDone.current = true;
    }
  }, [pedidos]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-pedidos-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        (payload) => {
          const newRecord = payload.new as any;
          if (payload.eventType === 'INSERT' && newRecord.status === 'pendente') {
            if (!knownIdsRef.current.has(newRecord.id)) {
              knownIdsRef.current.add(newRecord.id);
              if (soundEnabled) {
                setAlertActive(true);
                playAlertSound();
              }
              toast.info(`🔔 Novo pedido #${newRecord.numero} recebido!`);
            }
          }
          if (payload.eventType === 'UPDATE' && newRecord.status === 'pendente') {
            if (!knownIdsRef.current.has(newRecord.id)) {
              knownIdsRef.current.add(newRecord.id);
              if (soundEnabled) {
                setAlertActive(true);
                playAlertSound();
              }
              toast.info(`🔔 Novo pedido #${newRecord.numero} recebido!`);
            }
          }
          queryClient.invalidateQueries({ queryKey: ['admin-pedidos'] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [soundEnabled, queryClient]);

  const ensureAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
      if (!Ctx) return null;
      audioCtxRef.current = new Ctx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  const beep = useCallback((freq = 800, duration = 0.3, gainVal = 0.3) => {
    const ctx = audioCtxRef.current;
    if (!ctx || ctx.state !== 'running') return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.value = gainVal;
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }, []);

  const playAlertSound = useCallback(() => {
    try {
      ensureAudioCtx();
      beep(800, 0.3);
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => beep(800, 0.3), 2000);
    } catch { /* Silent fail */ }
  }, [ensureAudioCtx, beep]);

  const unlockAudio = useCallback(() => {
    const ctx = ensureAudioCtx();
    if (!ctx) {
      toast.error('Seu navegador não suporta áudio');
      return;
    }
    // Play confirmation chirp
    setTimeout(() => beep(660, 0.15, 0.2), 50);
    setTimeout(() => beep(880, 0.2, 0.2), 220);
    setAudioUnlocked(true);
    toast.success('🔔 Alertas sonoros ativados!');
  }, [ensureAudioCtx, beep]);

  const stopAlert = useCallback(() => {
    setAlertActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);


  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const updateStatus = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pedidos'] });
      toast.success('Status atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar status'),
  });

  const dispatchToGoup = useCallback(async (pedido: Pedido) => {
    try {
      const { data, error } = await supabase.functions.invoke('goup-create-delivery', {
        body: { pedido_id: pedido.id },
      });
      if (error) throw error;
      if (data?.ok) {
        toast.success(`🛵 Pedido #${pedido.numero} enviado para o goup`);
      } else {
        toast.error(`Falha ao enviar para o goup: ${data?.error || 'erro desconhecido'}`);
      }
      queryClient.invalidateQueries({ queryKey: ['admin-pedidos'] });
    } catch (err: any) {
      console.error('[goup] erro ao enviar pedido', err);
      toast.error('Não foi possível contatar o goup. O Kanban segue normalmente.');
      queryClient.invalidateQueries({ queryKey: ['admin-pedidos'] });
    }
  }, [queryClient]);

  const handleAdvanceStatus = (pedido: Pedido, nextStatus: string) => {
    if (pedido.status === 'pendente') {
      stopAlert();
      // Fire-and-forget: enviar entrega ao goup sem bloquear o avanço de status
      if (!pedido.goup_delivery_id) dispatchToGoup(pedido);
    }
    updateStatus.mutate({ id: pedido.id, newStatus: nextStatus });
  };


  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('pt-BR');


  return (
    <div className="space-y-4">
      {soundEnabled && !audioUnlocked && (
        <button
          onClick={unlockAudio}
          className="w-full bg-amber-500/20 hover:bg-amber-500/30 border-2 border-amber-500 rounded-lg p-4 flex items-center justify-center gap-3 transition-colors animate-pulse cursor-pointer"
        >
          <Volume2 className="h-6 w-6 text-amber-600" />
          <span className="font-semibold text-amber-700 text-base">
            🔔 Clique aqui para ativar alertas sonoros de novos pedidos
          </span>
        </button>
      )}

      {alertActive && (
        <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-yellow-600" />
            <span className="font-semibold text-yellow-700">🔔 Novo pedido recebido!</span>
          </div>
          <Button size="sm" variant="outline" onClick={stopAlert}>Parar alerta</Button>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={soundEnabled && audioUnlocked ? 'text-green-600' : 'text-muted-foreground'}
        >
          {soundEnabled ? <Volume2 className="h-4 w-4 mr-1" /> : <VolumeX className="h-4 w-4 mr-1" />}
          {soundEnabled
            ? (audioUnlocked ? '🔔 Som ativo' : '🔔 Som (aguardando ativação)')
            : '🔕 Som desativado'}
        </Button>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATUS_COLUMNS.map((col) => {
          const colPedidos = pedidos.filter(p => p.status === col.key);
          return (
            <div key={col.key} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${col.color}`} />
                <h3 className="font-semibold text-sm">{col.label}</h3>
                <Badge variant="secondary" className="ml-auto">{colPedidos.length}</Badge>
              </div>

              <div className="space-y-2 min-h-[200px]">
                {colPedidos.map((pedido) => (
                  <Card key={pedido.id} className={`border shadow-sm hover:shadow-md transition-shadow ${isPossibleDuplicate(pedido, pedidos) ? 'border-red-400 bg-red-50/30' : ''}`}>
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm">#{pedido.numero}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(pedido.created_at)}
                        </span>
                      </div>

                      {pedido.cliente_nome && (
                        <div className="text-lg font-bold leading-tight uppercase tracking-tight">
                          {pedido.cliente_nome}
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {pedido.telefone}
                      </div>

                      {isPossibleDuplicate(pedido, pedidos) && (
                        <div className="flex items-center gap-1 text-[10px] text-red-600 font-semibold">
                          <AlertTriangle className="h-3 w-3" />
                          ⚠️ Possível duplicata
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-primary text-sm">
                          R$ {Number(pedido.total).toFixed(2)}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {PAYMENT_LABELS[pedido.metodo_pagamento] || pedido.metodo_pagamento}
                        </Badge>
                      </div>

                      {pedido.troco && (
                        <div className="text-[10px] font-semibold text-amber-700 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
                          💵 Troco p/ R$ {Number(pedido.troco).toFixed(2)} (devolver R$ {(Number(pedido.troco) - Number(pedido.total)).toFixed(2)})
                        </div>
                      )}
                      {pedido.goup_delivery_id && (
                        <div className="text-[10px] font-semibold text-green-700 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded inline-flex items-center gap-1">
                          🛵 Entregador designado
                        </div>
                      )}
                      {!pedido.goup_delivery_id && pedido.goup_status === 'error' && (
                        <div className="flex items-center justify-between gap-1 text-[10px] font-semibold text-red-700 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
                          <span title={pedido.goup_last_error || ''}>⚠️ Falha na designação</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 px-1 text-[10px] text-red-700 hover:bg-red-200"
                            onClick={(e) => { e.stopPropagation(); dispatchToGoup(pedido); }}
                          >
                            Tentar novamente
                          </Button>
                        </div>
                      )}
                      {pedido.observacao_pagamento && (
                        <div className="text-[10px] text-muted-foreground italic line-clamp-2">
                          📝 {pedido.observacao_pagamento}
                        </div>
                      )}





                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs" onClick={() => setSelectedPedido(pedido)}>
                          <Eye className="h-3 w-3 mr-1" /> Ver
                        </Button>
                        {(col.key === 'preparo' || col.key === 'saiu_entrega') && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs border-green-600 text-green-700 hover:bg-green-50"
                            title="Notificar cliente no WhatsApp"
                            onClick={() => {
                              const tipo = col.key === 'preparo' ? 'saiu' : 'finalizado';
                              window.open(buildWhatsAppLink(pedido.telefone, pedido.cliente_nome, pedido.numero, tipo), '_blank');
                            }}
                          >
                            <MessageCircle className="h-3 w-3" />
                          </Button>
                        )}
                        {col.next && (
                          <Button size="sm" className="flex-1 h-7 text-xs" onClick={() => handleAdvanceStatus(pedido, col.next!)}>
                            {col.buttonLabel}
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </div>

                    </CardContent>
                  </Card>
                ))}
                {colPedidos.length === 0 && (
                  <div className="text-center text-xs text-muted-foreground py-8 border border-dashed rounded-lg">
                    Nenhum pedido
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!selectedPedido} onOpenChange={() => setSelectedPedido(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pedido #{selectedPedido?.numero}</DialogTitle>
          </DialogHeader>
          {selectedPedido && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Data</p>
                  <p className="font-medium">{formatDate(selectedPedido.created_at)} {formatTime(selectedPedido.created_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Telefone</p>
                  <p className="font-medium">{selectedPedido.telefone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pagamento</p>
                  <p className="font-medium flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    {PAYMENT_LABELS[selectedPedido.metodo_pagamento] || selectedPedido.metodo_pagamento}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge>{traduzirStatus(selectedPedido.status)}</Badge>
                </div>
              </div>

              {(selectedPedido.troco || selectedPedido.observacao_pagamento) && (
                <div className="rounded-lg border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm space-y-1">
                  {selectedPedido.troco && (
                    <p>
                      <span className="font-semibold">💵 Troco para:</span> R$ {Number(selectedPedido.troco).toFixed(2)}
                      <span className="ml-2 text-muted-foreground">
                        (devolver R$ {(Number(selectedPedido.troco) - Number(selectedPedido.total)).toFixed(2)})
                      </span>
                    </p>
                  )}
                  {selectedPedido.observacao_pagamento && (
                    <p><span className="font-semibold">📝 Observação:</span> {selectedPedido.observacao_pagamento}</p>
                  )}
                </div>
              )}

              {selectedPedido.endereco && (
                <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                  <p className="font-semibold flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Endereço
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

export default AdminPedidos;
