import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Promocao {
  id: string;
  tipo: 'primeiro_pedido' | 'segundo_pedido' | 'valor_minimo' | 'dia_semana' | 'frete_gratis';
  ativo: boolean;
  desconto_porcentagem: number | null;
  desconto_valor: number | null;
  tipo_desconto: 'porcentagem' | 'valor_fixo';
  valor_minimo_pedido: number | null;
  dias_semana: Record<string, boolean>;
  validade_dias: number | null;
}

export interface CupomDesconto {
  id: string;
  codigo: string;
  telefone: string;
  desconto_porcentagem: number;
  usado: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface DescontoAplicado {
  tipo: string;
  label: string;
  valor: number;
  cupomId?: string;
}

const DIAS_MAP: Record<string, number> = {
  dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6
};

export function usePromocoes() {
  const queryClient = useQueryClient();

  const { data: promocoes = [], ...query } = useQuery({
    queryKey: ['promocoes'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('promocoes')
        .select('*');
      if (error) throw error;
      return (data || []) as Promocao[];
    },
    refetchInterval: 30000,
  });

  const updatePromocao = useMutation({
    mutationFn: async (updates: Partial<Promocao> & { id: string }) => {
      const { id, ...rest } = updates;
      const { error } = await (supabase as any)
        .from('promocoes')
        .update(rest)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promocoes'] }),
  });

  const getPromocao = (tipo: Promocao['tipo']) => promocoes.find(p => p.tipo === tipo);

  return { promocoes, getPromocao, updatePromocao, ...query };
}

export function useCuponsUsuario(telefone: string | null | undefined) {
  return useQuery({
    queryKey: ['cupons', telefone],
    queryFn: async () => {
      if (!telefone) return [];
      const { data, error } = await (supabase as any)
        .from('cupons_desconto')
        .select('*')
        .eq('telefone', telefone)
        .eq('usado', false);
      if (error) throw error;
      return (data || []) as CupomDesconto[];
    },
    enabled: !!telefone,
  });
}

export function useContarPedidosTelefone(telefone: string | null | undefined) {
  return useQuery({
    queryKey: ['pedidos_count', telefone],
    queryFn: async () => {
      if (!telefone) return 0;
      // Count orders by looking at profiles with this phone that have orders
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('telefone', telefone);
      
      if (!profiles || profiles.length === 0) return 0;
      
      const userIds = profiles.map(p => p.user_id);
      const { count, error } = await supabase
        .from('pedidos')
        .select('id', { count: 'exact', head: true })
        .in('user_id', userIds);
      
      if (error) return 0;
      return count || 0;
    },
    enabled: !!telefone,
  });
}

export function calcularDescontos(
  subtotal: number,
  taxaEntrega: number,
  promocoes: Promocao[],
  numPedidos: number,
  cuponsDisponiveis: CupomDesconto[],
): { melhorDesconto: DescontoAplicado | null; freteGratis: boolean } {
  const candidatos: DescontoAplicado[] = [];
  const hoje = new Date().getDay(); // 0=dom, 6=sab

  // 1. Primeiro pedido
  const primeiroPedido = promocoes.find(p => p.tipo === 'primeiro_pedido' && p.ativo);
  if (primeiroPedido && numPedidos === 0 && primeiroPedido.desconto_porcentagem) {
    const valor = subtotal * (primeiroPedido.desconto_porcentagem / 100);
    candidatos.push({ tipo: 'primeiro_pedido', label: `Desconto primeiro pedido (${primeiroPedido.desconto_porcentagem}%)`, valor });
  }

  // 2. Cupom segundo pedido
  const segundoPedido = promocoes.find(p => p.tipo === 'segundo_pedido' && p.ativo);
  if (segundoPedido && cuponsDisponiveis.length > 0) {
    const cupom = cuponsDisponiveis.find(c => {
      if (c.usado) return false;
      if (c.expires_at && new Date(c.expires_at) < new Date()) return false;
      return true;
    });
    if (cupom) {
      const valor = subtotal * (cupom.desconto_porcentagem / 100);
      candidatos.push({ tipo: 'segundo_pedido', label: `Cupom de desconto (${cupom.desconto_porcentagem}%)`, valor, cupomId: cupom.id });
    }
  }

  // 3. Valor mínimo
  const valorMinimo = promocoes.find(p => p.tipo === 'valor_minimo' && p.ativo);
  if (valorMinimo && valorMinimo.valor_minimo_pedido && subtotal >= valorMinimo.valor_minimo_pedido) {
    let valor = 0;
    if (valorMinimo.tipo_desconto === 'porcentagem' && valorMinimo.desconto_porcentagem) {
      valor = subtotal * (valorMinimo.desconto_porcentagem / 100);
    } else if (valorMinimo.tipo_desconto === 'valor_fixo' && valorMinimo.desconto_valor) {
      valor = valorMinimo.desconto_valor;
    }
    if (valor > 0) {
      const label = valorMinimo.tipo_desconto === 'porcentagem'
        ? `Desconto pedido acima de R$${valorMinimo.valor_minimo_pedido} (${valorMinimo.desconto_porcentagem}%)`
        : `Desconto pedido acima de R$${valorMinimo.valor_minimo_pedido} (-R$${valorMinimo.desconto_valor})`;
      candidatos.push({ tipo: 'valor_minimo', label, valor });
    }
  }

  // 4. Dia da semana
  const diaSemana = promocoes.find(p => p.tipo === 'dia_semana' && p.ativo);
  if (diaSemana && diaSemana.dias_semana) {
    const diaKey = Object.entries(DIAS_MAP).find(([, v]) => v === hoje)?.[0];
    if (diaKey && diaSemana.dias_semana[diaKey]) {
      let valor = 0;
      if (diaSemana.tipo_desconto === 'porcentagem' && diaSemana.desconto_porcentagem) {
        valor = subtotal * (diaSemana.desconto_porcentagem / 100);
      } else if (diaSemana.tipo_desconto === 'valor_fixo' && diaSemana.desconto_valor) {
        valor = diaSemana.desconto_valor;
      }
      if (valor > 0) {
        const diasNomes: Record<string, string> = { dom: 'Domingo', seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta', sex: 'Sexta', sab: 'Sábado' };
        candidatos.push({ tipo: 'dia_semana', label: `Promoção de ${diasNomes[diaKey]}`, valor });
      }
    }
  }

  // Pick best discount (highest value for customer)
  let melhorDesconto: DescontoAplicado | null = null;
  if (candidatos.length > 0) {
    melhorDesconto = candidatos.reduce((best, c) => c.valor > best.valor ? c : best, candidatos[0]);
    // Cap discount to subtotal
    melhorDesconto.valor = Math.min(melhorDesconto.valor, subtotal);
  }

  // 5. Frete grátis (independent, can stack)
  const freteGratisPromo = promocoes.find(p => p.tipo === 'frete_gratis' && p.ativo);
  const freteGratis = !!(freteGratisPromo && freteGratisPromo.valor_minimo_pedido && subtotal >= freteGratisPromo.valor_minimo_pedido);

  return { melhorDesconto, freteGratis };
}
