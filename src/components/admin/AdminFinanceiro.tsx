import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, DollarSign, ShoppingBag, TrendingUp, Package, ArrowUp, ArrowDown, Download, Filter, CalendarDays } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type PeriodoPreset = 'hoje' | 'ontem' | '7dias' | '30dias' | 'este_mes' | 'mes_passado' | 'personalizado';

function getDateRange(preset: PeriodoPreset, customStart?: string, customEnd?: string): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'hoje':
      return { start: today, end: now };
    case 'ontem': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { start: yesterday, end: today };
    }
    case '7dias': {
      const d = new Date(today);
      d.setDate(d.getDate() - 7);
      return { start: d, end: now };
    }
    case '30dias': {
      const d = new Date(today);
      d.setDate(d.getDate() - 30);
      return { start: d, end: now };
    }
    case 'este_mes':
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
    case 'mes_passado': {
      const firstLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const firstThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: firstLastMonth, end: firstThisMonth };
    }
    case 'personalizado':
      return {
        start: customStart ? new Date(customStart) : today,
        end: customEnd ? new Date(customEnd + 'T23:59:59') : now,
      };
    default:
      return { start: today, end: now };
  }
}

interface Pedido {
  id: string;
  numero: number;
  items: any;
  subtotal: number;
  taxa_entrega: number;
  total: number;
  metodo_pagamento: string;
  status: string | null;
  created_at: string | null;
  telefone: string;
}

function usePedidosPeriodo(start: Date, end: Date) {
  return useQuery({
    queryKey: ['financeiro_pedidos', start.toISOString(), end.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Pedido[];
    },
  });
}

function usePedidosMesAnterior() {
  const now = new Date();
  const firstThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  return useQuery({
    queryKey: ['financeiro_mes_anterior'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .gte('created_at', firstLastMonth.toISOString())
        .lt('created_at', firstThisMonth.toISOString());
      if (error) throw error;
      return (data || []) as Pedido[];
    },
  });
}

function usePedidosMesAtual() {
  const now = new Date();
  const firstThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return useQuery({
    queryKey: ['financeiro_mes_atual'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .gte('created_at', firstThisMonth.toISOString())
        .lte('created_at', now.toISOString());
      if (error) throw error;
      return (data || []) as Pedido[];
    },
  });
}

// Valid statuses for financial calculations
const STATUS_FINANCEIRO = ['confirmado', 'concluido', 'entregue', 'em_preparo', 'aguardando_confirmacao'];
const filterValid = (pedidos: Pedido[]) => pedidos.filter(p => p.status !== 'cancelado');

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const METODO_LABELS: Record<string, string> = {
  pix: 'PIX',
  entrega: 'Na Entrega',
  cartao: 'Cartão',
  dinheiro: 'Dinheiro',
};

const STATUS_LABELS: Record<string, string> = {
  aguardando_confirmacao: 'Aguardando',
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  em_preparo: 'Em Preparo',
  entregue: 'Entregue',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

const STATUS_COLORS: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
  aguardando_confirmacao: 'outline',
  pendente: 'outline',
  confirmado: 'secondary',
  em_preparo: 'secondary',
  entregue: 'default',
  concluido: 'default',
  cancelado: 'destructive',
};

function countItems(items: any): number {
  if (Array.isArray(items)) return items.reduce((s: number, i: any) => s + (i.quantidade || 1), 0);
  return 0;
}

function getTopProducts(pedidos: Pedido[], limit = 10) {
  const map = new Map<string, { nome: string; qtd: number; faturamento: number }>();
  for (const p of pedidos) {
    if (p.status === 'cancelado' || !Array.isArray(p.items)) continue;
    for (const item of p.items as any[]) {
      const nome = item.nome || 'Produto';
      const qtd = item.quantidade || 1;
      const preco = (item.preco || 0) * qtd;
      const existing = map.get(nome);
      if (existing) {
        existing.qtd += qtd;
        existing.faturamento += preco;
      } else {
        map.set(nome, { nome, qtd, faturamento: preco });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => b.qtd - a.qtd).slice(0, limit);
}

function getDailyOrdersChart(pedidos: Pedido[]) {
  const dayMap = new Map<string, { pedidos: number; faturamento: number }>();
  
  for (const p of pedidos) {
    if (p.status === 'cancelado' || !p.created_at) continue;
    const dateKey = new Date(p.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const existing = dayMap.get(dateKey);
    if (existing) {
      existing.pedidos += 1;
      existing.faturamento += Number(p.total);
    } else {
      dayMap.set(dateKey, { pedidos: 1, faturamento: Number(p.total) });
    }
  }

  // Sort by date
  return Array.from(dayMap.entries())
    .map(([dia, data]) => ({ dia, ...data }))
    .sort((a, b) => {
      const [da, ma] = a.dia.split('/').map(Number);
      const [db, mb] = b.dia.split('/').map(Number);
      return ma !== mb ? ma - mb : da - db;
    });
}

function getMonthlyComparisonChart(mesAtual: Pedido[], mesAnterior: Pedido[]) {
  const now = new Date();
  const mesAtualNome = now.toLocaleDateString('pt-BR', { month: 'long' });
  const mesAnteriorDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const mesAnteriorNome = mesAnteriorDate.toLocaleDateString('pt-BR', { month: 'long' });

  const validAtual = filterValid(mesAtual);
  const validAnterior = filterValid(mesAnterior);

  const totalAtual = validAtual.reduce((s, p) => s + Number(p.total), 0);
  const totalAnterior = validAnterior.reduce((s, p) => s + Number(p.total), 0);

  return {
    data: [
      { mes: mesAnteriorNome.charAt(0).toUpperCase() + mesAnteriorNome.slice(1), Faturamento: totalAnterior, Pedidos: validAnterior.length },
      { mes: mesAtualNome.charAt(0).toUpperCase() + mesAtualNome.slice(1), Faturamento: totalAtual, Pedidos: validAtual.length },
    ],
    totalAtual,
    totalAnterior,
    pedidosAtual: validAtual.length,
    pedidosAnterior: validAnterior.length,
  };
}

export default function AdminFinanceiro() {
  const [periodo, setPeriodo] = useState<PeriodoPreset>('este_mes');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [page, setPage] = useState(0);
  const [filterMetodo, setFilterMetodo] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const PER_PAGE = 20;

  const { start, end } = getDateRange(periodo, customStart, customEnd);
  const { data: pedidos = [], isLoading } = usePedidosPeriodo(start, end);
  const { data: pedidosMesAnterior = [] } = usePedidosMesAnterior();
  const { data: pedidosMesAtual = [] } = usePedidosMesAtual();

  const validPedidos = useMemo(() => filterValid(pedidos), [pedidos]);

  // Summary cards
  const totalVendas = validPedidos.reduce((s, p) => s + Number(p.total), 0);
  const numPedidos = validPedidos.length;
  const ticketMedio = numPedidos > 0 ? totalVendas / numPedidos : 0;
  const totalItens = validPedidos.reduce((s, p) => s + countItems(p.items), 0);

  // Monthly growth
  const monthlyComparison = useMemo(() => getMonthlyComparisonChart(pedidosMesAtual, pedidosMesAnterior), [pedidosMesAtual, pedidosMesAnterior]);
  const crescimentoMensal = monthlyComparison.totalAnterior > 0
    ? ((monthlyComparison.totalAtual - monthlyComparison.totalAnterior) / monthlyComparison.totalAnterior) * 100
    : 0;

  // Daily orders chart (last 30 days)
  const dailyOrdersData = useMemo(() => getDailyOrdersChart(pedidos), [pedidos]);

  // Top products
  const topProducts = useMemo(() => getTopProducts(pedidos), [pedidos]);
  const maxQtd = topProducts.length > 0 ? topProducts[0].qtd : 1;

  // Resumo financeiro
  const totalDescontos = validPedidos.reduce((s, p) => {
    const itemsTotal = Array.isArray(p.items)
      ? (p.items as any[]).reduce((sum: number, item: any) => sum + (item.preco || 0) * (item.quantidade || 1), 0)
      : 0;
    const diff = itemsTotal - Number(p.subtotal);
    return s + (diff > 0 ? diff : 0);
  }, 0);

  // Filtered table
  const filteredPedidos = useMemo(() => {
    let list = pedidos;
    if (filterMetodo !== 'todos') list = list.filter(p => p.metodo_pagamento === filterMetodo);
    if (filterStatus !== 'todos') list = list.filter(p => p.status === filterStatus);
    return list;
  }, [pedidos, filterMetodo, filterStatus]);

  const totalPages = Math.ceil(filteredPedidos.length / PER_PAGE);
  const pagePedidos = filteredPedidos.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  // Export CSV
  const exportCSV = () => {
    const headers = ['Nº', 'Data', 'Hora', 'Telefone', 'Valor', 'Pagamento', 'Itens', 'Status'];
    const rows = filteredPedidos.map(p => {
      const d = p.created_at ? new Date(p.created_at) : null;
      return [
        p.numero,
        d ? d.toLocaleDateString('pt-BR') : '',
        d ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '',
        p.telefone || '',
        Number(p.total).toFixed(2),
        METODO_LABELS[p.metodo_pagamento] || p.metodo_pagamento,
        countItems(p.items),
        STATUS_LABELS[p.status || 'pendente'] || p.status,
      ].join(';');
    });
    const csv = [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-vendas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">💰 Financeiro</h2>
        <p className="text-muted-foreground text-sm mt-1">Acompanhe faturamento, pedidos e desempenho do restaurante em tempo real.</p>
      </div>

      {/* Period Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Período</Label>
              <Select value={periodo} onValueChange={(v) => { setPeriodo(v as PeriodoPreset); setPage(0); }}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="ontem">Ontem</SelectItem>
                  <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                  <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                  <SelectItem value="este_mes">Este mês</SelectItem>
                  <SelectItem value="mes_passado">Mês passado</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {periodo === 'personalizado' && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">Data inicial</Label>
                  <Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-[160px]" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Data final</Label>
                  <Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-[160px]" />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon={<DollarSign className="h-5 w-5" />} label="Total de vendas" sublabel="Vendas do período" value={formatCurrency(totalVendas)} />
        <SummaryCard icon={<ShoppingBag className="h-5 w-5" />} label="Total de pedidos" value={`${numPedidos} pedidos`} />
        <SummaryCard icon={<TrendingUp className="h-5 w-5" />} label="Ticket médio" value={formatCurrency(ticketMedio)} />
        <SummaryCard icon={<CalendarDays className="h-5 w-5" />} label="Crescimento mensal" value={crescimentoMensal !== 0 ? `${crescimentoMensal >= 0 ? '+' : ''}${crescimentoMensal.toFixed(1)}%` : '—'} variation={crescimentoMensal} />
      </div>

      {/* Monthly Comparison Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Comparativo mensal de faturamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyComparison.data} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `R$${v}`} />
                <Tooltip formatter={(v: number, name: string) => name === 'Faturamento' ? formatCurrency(v) : `${v} pedidos`} />
                <Legend />
                <Bar dataKey="Faturamento" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {crescimentoMensal !== 0 && (
            <div className={`mt-2 text-sm font-medium flex items-center gap-1 ${crescimentoMensal >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {crescimentoMensal >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              {crescimentoMensal >= 0 ? '+' : ''}{crescimentoMensal.toFixed(1)}% em relação ao mês passado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Orders Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Pedidos por dia</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyOrdersData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum pedido no período selecionado.</p>
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyOrdersData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} tickFormatter={v => `R$${v}`} />
                  <Tooltip formatter={(v: number, name: string) => name === 'faturamento' ? formatCurrency(v) : v} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="pedidos" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Pedidos" />
                  <Line yAxisId="right" type="monotone" dataKey="faturamento" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={{ r: 3 }} name="Faturamento" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Resumo financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <SummaryItem label="Total de vendas" value={formatCurrency(totalVendas)} />
            <SummaryItem label="Total de pedidos" value={`${numPedidos}`} />
            <SummaryItem label="Ticket médio" value={formatCurrency(ticketMedio)} />
            <SummaryItem label="Produtos vendidos" value={`${totalItens} itens`} />
            <SummaryItem label="Pedidos cancelados" value={`${pedidos.filter(p => p.status === 'cancelado').length}`} />
          </div>
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Produtos mais vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma venda no período.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.nome} className="flex items-center gap-3">
                  <span className="w-6 text-sm font-bold text-muted-foreground text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-sm font-medium truncate">{p.nome}</span>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">{p.qtd} vendas · {formatCurrency(p.faturamento)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(p.qtd / maxQtd) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Sales Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="text-base">Histórico de pedidos</CardTitle>
            <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
              <Download className="h-4 w-4" /> Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" /> Pagamento</Label>
              <Select value={filterMetodo} onValueChange={v => { setFilterMetodo(v); setPage(0); }}>
                <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="entrega">Na Entrega</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" /> Status</Label>
              <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPage(0); }}>
                <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="aguardando_confirmacao">Aguardando</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="em_preparo">Em Preparo</SelectItem>
                  <SelectItem value="entregue">Entregue</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Nº</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="text-center">Itens</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagePedidos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum pedido encontrado.</TableCell>
                  </TableRow>
                ) : pagePedidos.map(p => {
                  const d = p.created_at ? new Date(p.created_at) : null;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">#{p.numero}</TableCell>
                      <TableCell className="text-sm">{d?.toLocaleDateString('pt-BR') || '-'}</TableCell>
                      <TableCell className="text-sm">{d?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) || '-'}</TableCell>
                      <TableCell className="text-sm font-mono">{p.telefone || '-'}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(Number(p.total))}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{METODO_LABELS[p.metodo_pagamento] || p.metodo_pagamento}</Badge></TableCell>
                      <TableCell className="text-center">{countItems(p.items)}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_COLORS[p.status || 'pendente'] || 'outline'} className="text-xs">
                          {STATUS_LABELS[p.status || 'pendente'] || p.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-muted-foreground">{filteredPedidos.length} pedidos · Página {page + 1} de {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Anterior</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Próximo</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ icon, label, sublabel, value, variation }: { icon: React.ReactNode; label: string; sublabel?: string; value: string; variation?: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="rounded-lg bg-primary/10 p-2">{icon}</div>
          {variation !== undefined && variation !== 0 && (
            <span className={`text-xs font-medium flex items-center gap-0.5 ${variation >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {variation >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(variation).toFixed(1)}%
            </span>
          )}
        </div>
        <p className="text-2xl font-bold mt-3">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
        {sublabel && <p className="text-[10px] text-muted-foreground">{sublabel}</p>}
      </CardContent>
    </Card>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-3 rounded-lg bg-muted/50">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
