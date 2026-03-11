import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2, DollarSign, ShoppingBag, TrendingUp, Package, ArrowUp, ArrowDown,
  Download, Filter, CalendarDays, Users, UserCheck, Clock, BarChart3
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';

// ─── Types & Constants ──────────────────────────────────────────────
type PeriodoPreset = 'hoje' | 'ontem' | '7dias' | '30dias' | 'este_mes' | 'mes_passado' | 'personalizado';

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

const STATUS_VALIDOS = ['confirmado', 'concluido', 'entregue', 'em_preparo', 'aguardando_confirmacao'];
const filterValid = (pedidos: Pedido[]) => pedidos.filter(p => p.status !== 'cancelado');

const METODO_LABELS: Record<string, string> = { pix: 'PIX', entrega: 'Na Entrega', cartao: 'Cartão', dinheiro: 'Dinheiro' };
const STATUS_LABELS: Record<string, string> = {
  aguardando_confirmacao: 'Aguardando', pendente: 'Pendente', confirmado: 'Confirmado',
  em_preparo: 'Em Preparo', entregue: 'Entregue', concluido: 'Concluído', cancelado: 'Cancelado',
};
const STATUS_COLORS: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
  aguardando_confirmacao: 'outline', pendente: 'outline', confirmado: 'secondary',
  em_preparo: 'secondary', entregue: 'default', concluido: 'default', cancelado: 'destructive',
};
const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const DIAS_SEMANA_CURTO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// ─── Helpers ────────────────────────────────────────────────────────
function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function countItems(items: any): number {
  if (Array.isArray(items)) return items.reduce((s: number, i: any) => s + (i.quantidade || 1), 0);
  return 0;
}

function getDateRange(preset: PeriodoPreset, customStart?: string, customEnd?: string): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (preset) {
    case 'hoje': return { start: today, end: now };
    case 'ontem': { const y = new Date(today); y.setDate(y.getDate() - 1); return { start: y, end: today }; }
    case '7dias': { const d = new Date(today); d.setDate(d.getDate() - 7); return { start: d, end: now }; }
    case '30dias': { const d = new Date(today); d.setDate(d.getDate() - 30); return { start: d, end: now }; }
    case 'este_mes': return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
    case 'mes_passado': return { start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: new Date(now.getFullYear(), now.getMonth(), 1) };
    case 'personalizado': return { start: customStart ? new Date(customStart) : today, end: customEnd ? new Date(customEnd + 'T23:59:59') : now };
    default: return { start: today, end: now };
  }
}

function getPreviousPeriodRange(start: Date, end: Date): { start: Date; end: Date } {
  const duration = end.getTime() - start.getTime();
  return { start: new Date(start.getTime() - duration), end: new Date(start.getTime()) };
}

// ─── Data hooks ─────────────────────────────────────────────────────
function usePedidosPeriodo(start: Date, end: Date) {
  return useQuery({
    queryKey: ['financeiro_pedidos', start.toISOString(), end.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos').select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Pedido[];
    },
  });
}

function usePedidosPeriodoAnterior(start: Date, end: Date) {
  const prev = getPreviousPeriodRange(start, end);
  return useQuery({
    queryKey: ['financeiro_pedidos_prev', prev.start.toISOString(), prev.end.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos').select('*')
        .gte('created_at', prev.start.toISOString())
        .lte('created_at', prev.end.toISOString());
      if (error) throw error;
      return (data || []) as Pedido[];
    },
  });
}

// ─── Analytics computations ─────────────────────────────────────────
function getTopProducts(pedidos: Pedido[], limit = 10, sortBy: 'qtd' | 'faturamento' = 'qtd') {
  const map = new Map<string, { nome: string; qtd: number; faturamento: number }>();
  for (const p of pedidos) {
    if (p.status === 'cancelado' || !Array.isArray(p.items)) continue;
    for (const item of p.items as any[]) {
      const nome = item.nome || 'Produto';
      const qtd = item.quantidade || 1;
      const preco = (item.preco || 0) * qtd;
      const ex = map.get(nome);
      if (ex) { ex.qtd += qtd; ex.faturamento += preco; }
      else map.set(nome, { nome, qtd, faturamento: preco });
    }
  }
  return Array.from(map.values()).sort((a, b) => sortBy === 'qtd' ? b.qtd - a.qtd : b.faturamento - a.faturamento).slice(0, limit);
}

function getDailyChart(pedidos: Pedido[]) {
  const dayMap = new Map<string, { pedidos: number; faturamento: number }>();
  for (const p of filterValid(pedidos)) {
    if (!p.created_at) continue;
    const key = new Date(p.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const ex = dayMap.get(key);
    if (ex) { ex.pedidos += 1; ex.faturamento += Number(p.total); }
    else dayMap.set(key, { pedidos: 1, faturamento: Number(p.total) });
  }
  return Array.from(dayMap.entries()).map(([dia, d]) => ({ dia, ...d })).sort((a, b) => {
    const [da, ma] = a.dia.split('/').map(Number);
    const [db, mb] = b.dia.split('/').map(Number);
    return ma !== mb ? ma - mb : da - db;
  });
}

function getHourlyChart(pedidos: Pedido[]) {
  const hours = Array.from({ length: 24 }, (_, i) => ({ hora: `${i}h`, pedidos: 0, faturamento: 0 }));
  for (const p of filterValid(pedidos)) {
    if (!p.created_at) continue;
    const h = new Date(p.created_at).getHours();
    hours[h].pedidos += 1;
    hours[h].faturamento += Number(p.total);
  }
  return hours.filter(h => h.pedidos > 0);
}

function getDayOfWeekChart(pedidos: Pedido[]) {
  const days = DIAS_SEMANA.map(d => ({ dia: d, pedidos: 0, faturamento: 0 }));
  for (const p of filterValid(pedidos)) {
    if (!p.created_at) continue;
    const dow = new Date(p.created_at).getDay();
    days[dow].pedidos += 1;
    days[dow].faturamento += Number(p.total);
  }
  return days;
}

function getHeatmapData(pedidos: Pedido[]) {
  // 7 days x 24 hours grid
  const grid: number[][] = Array.from({ length: 24 }, () => Array(7).fill(0));
  for (const p of filterValid(pedidos)) {
    if (!p.created_at) continue;
    const d = new Date(p.created_at);
    grid[d.getHours()][d.getDay()] += 1;
  }
  const max = Math.max(1, ...grid.flat());
  return { grid, max };
}

function getRecurringCustomers(pedidos: Pedido[], limit = 20) {
  const map = new Map<string, { telefone: string; pedidos: number; total: number; ultimo: string }>();
  for (const p of filterValid(pedidos)) {
    const tel = p.telefone || '';
    if (!tel) continue;
    const ex = map.get(tel);
    if (ex) {
      ex.pedidos += 1;
      ex.total += Number(p.total);
      if (p.created_at && p.created_at > ex.ultimo) ex.ultimo = p.created_at;
    } else {
      map.set(tel, { telefone: tel, pedidos: 1, total: Number(p.total), ultimo: p.created_at || '' });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, limit);
}

// ─── Main Component ─────────────────────────────────────────────────
export default function AdminFinanceiro() {
  const [periodo, setPeriodo] = useState<PeriodoPreset>('este_mes');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [page, setPage] = useState(0);
  const [filterMetodo, setFilterMetodo] = useState('todos');
  const [filterStatus, setFilterStatus] = useState('todos');
  const PER_PAGE = 20;

  const { start, end } = useMemo(() => getDateRange(periodo, customStart, customEnd), [periodo, customStart, customEnd]);
  const { data: pedidos = [], isLoading } = usePedidosPeriodo(start, end);
  const { data: pedidosPrev = [] } = usePedidosPeriodoAnterior(start, end);

  const validPedidos = useMemo(() => filterValid(pedidos), [pedidos]);
  const validPrev = useMemo(() => filterValid(pedidosPrev), [pedidosPrev]);

  // KPIs
  const totalVendas = validPedidos.reduce((s, p) => s + Number(p.total), 0);
  const numPedidos = validPedidos.length;
  const ticketMedio = numPedidos > 0 ? totalVendas / numPedidos : 0;
  const totalItens = validPedidos.reduce((s, p) => s + countItems(p.items), 0);

  // Growth
  const totalPrev = validPrev.reduce((s, p) => s + Number(p.total), 0);
  const crescimento = totalPrev > 0 ? ((totalVendas - totalPrev) / totalPrev) * 100 : 0;

  // Unique & recurring customers
  const phonesSet = new Set(validPedidos.map(p => p.telefone).filter(Boolean));
  const clientesUnicos = phonesSet.size;
  const phoneCount = new Map<string, number>();
  for (const p of validPedidos) { if (p.telefone) phoneCount.set(p.telefone, (phoneCount.get(p.telefone) || 0) + 1); }
  const clientesRecorrentes = Array.from(phoneCount.values()).filter(c => c >= 2).length;

  // Charts
  const dailyData = useMemo(() => getDailyChart(pedidos), [pedidos]);
  const hourlyData = useMemo(() => getHourlyChart(pedidos), [pedidos]);
  const dowData = useMemo(() => getDayOfWeekChart(pedidos), [pedidos]);
  const heatmap = useMemo(() => getHeatmapData(pedidos), [pedidos]);
  const topByQtd = useMemo(() => getTopProducts(pedidos, 10, 'qtd'), [pedidos]);
  const topByRevenue = useMemo(() => getTopProducts(pedidos, 10, 'faturamento'), [pedidos]);
  const recurringCustomers = useMemo(() => getRecurringCustomers(pedidos), [pedidos]);

  // Monthly comparison for chart
  const monthlyChartData = useMemo(() => {
    const now = new Date();
    const curName = now.toLocaleDateString('pt-BR', { month: 'long' });
    const prevName = new Date(now.getFullYear(), now.getMonth() - 1).toLocaleDateString('pt-BR', { month: 'long' });
    return [
      { mes: prevName.charAt(0).toUpperCase() + prevName.slice(1), Faturamento: totalPrev, Pedidos: validPrev.length },
      { mes: curName.charAt(0).toUpperCase() + curName.slice(1), Faturamento: totalVendas, Pedidos: numPedidos },
    ];
  }, [totalVendas, totalPrev, numPedidos, validPrev.length]);

  // Table filters
  const filteredPedidos = useMemo(() => {
    let list = pedidos;
    if (filterMetodo !== 'todos') list = list.filter(p => p.metodo_pagamento === filterMetodo);
    if (filterStatus !== 'todos') list = list.filter(p => p.status === filterStatus);
    return list;
  }, [pedidos, filterMetodo, filterStatus]);

  const totalPages = Math.ceil(filteredPedidos.length / PER_PAGE);
  const pagePedidos = filteredPedidos.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const exportCSV = () => {
    const headers = ['Nº', 'Data', 'Hora', 'Telefone', 'Valor', 'Pagamento', 'Itens', 'Status'];
    const rows = filteredPedidos.map(p => {
      const d = p.created_at ? new Date(p.created_at) : null;
      return [p.numero, d?.toLocaleDateString('pt-BR') || '', d?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) || '',
        p.telefone || '', Number(p.total).toFixed(2), METODO_LABELS[p.metodo_pagamento] || p.metodo_pagamento,
        countItems(p.items), STATUS_LABELS[p.status || 'pendente'] || p.status].join(';');
    });
    const csv = [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `relatorio-vendas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">💰 Financeiro</h2>
        <p className="text-muted-foreground text-sm mt-1">Acompanhe faturamento, pedidos e desempenho do restaurante.</p>
      </div>

      {/* Period Filter */}
      <PeriodFilter periodo={periodo} setPeriodo={(v) => { setPeriodo(v); setPage(0); }}
        customStart={customStart} setCustomStart={setCustomStart} customEnd={customEnd} setCustomEnd={setCustomEnd} />

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="dashboard" className="gap-2"><BarChart3 className="h-4 w-4" />Dashboard</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2"><TrendingUp className="h-4 w-4" />Analytics</TabsTrigger>
        </TabsList>

        {/* ── DASHBOARD TAB ─────────────────────────────────── */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard icon={<DollarSign className="h-5 w-5" />} label="Total de vendas" sublabel="Vendas do período" value={formatCurrency(totalVendas)} />
            <SummaryCard icon={<ShoppingBag className="h-5 w-5" />} label="Total de pedidos" value={`${numPedidos} pedidos`} />
            <SummaryCard icon={<Package className="h-5 w-5" />} label="Ticket médio" value={formatCurrency(ticketMedio)} />
            <SummaryCard icon={<CalendarDays className="h-5 w-5" />} label="Crescimento" value={crescimento !== 0 ? `${crescimento >= 0 ? '+' : ''}${crescimento.toFixed(1)}%` : '—'} variation={crescimento} />
          </div>

          {/* Revenue line chart */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Faturamento por dia</CardTitle></CardHeader>
            <CardContent>
              {dailyData.length === 0 ? <EmptyState /> : (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={v => `R$${v}`} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Line type="monotone" dataKey="faturamento" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Faturamento" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Orders bar chart */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Pedidos por dia</CardTitle></CardHeader>
            <CardContent>
              {dailyData.length === 0 ? <EmptyState /> : (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="pedidos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Pedidos" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly comparison */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Comparativo mensal</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData} barGap={8}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={v => `R$${v}`} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: number, name: string) => name === 'Faturamento' ? formatCurrency(v) : `${v} pedidos`} />
                    <Legend />
                    <Bar dataKey="Faturamento" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {crescimento !== 0 && (
                <div className={`mt-2 text-sm font-medium flex items-center gap-1 ${crescimento >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {crescimento >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  {crescimento >= 0 ? '+' : ''}{crescimento.toFixed(1)}% em relação ao período anterior
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Products */}
          <ProductRanking title="Produtos mais vendidos" products={topByQtd} sortKey="qtd" />

          {/* Orders Table */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <CardTitle className="text-base">Histórico de pedidos</CardTitle>
                <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2"><Download className="h-4 w-4" /> Exportar CSV</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 mb-4">
                <FilterSelect label="Pagamento" value={filterMetodo} onChange={v => { setFilterMetodo(v); setPage(0); }}
                  options={[{ value: 'todos', label: 'Todos' }, { value: 'pix', label: 'PIX' }, { value: 'entrega', label: 'Na Entrega' }]} />
                <FilterSelect label="Status" value={filterStatus} onChange={v => { setFilterStatus(v); setPage(0); }}
                  options={[{ value: 'todos', label: 'Todos' }, { value: 'aguardando_confirmacao', label: 'Aguardando' },
                    { value: 'confirmado', label: 'Confirmado' }, { value: 'em_preparo', label: 'Em Preparo' },
                    { value: 'entregue', label: 'Entregue' }, { value: 'concluido', label: 'Concluído' }, { value: 'cancelado', label: 'Cancelado' }]} />
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
                      <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum pedido encontrado.</TableCell></TableRow>
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
                          <TableCell><Badge variant={STATUS_COLORS[p.status || 'pendente'] || 'outline'} className="text-xs">{STATUS_LABELS[p.status || 'pendente'] || p.status}</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
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
        </TabsContent>

        {/* ── ANALYTICS TAB ─────────────────────────────────── */}
        <TabsContent value="analytics" className="space-y-6">
          {/* 6 KPI cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <SummaryCard icon={<DollarSign className="h-5 w-5" />} label="Faturamento" value={formatCurrency(totalVendas)} />
            <SummaryCard icon={<ShoppingBag className="h-5 w-5" />} label="Pedidos" value={`${numPedidos}`} />
            <SummaryCard icon={<TrendingUp className="h-5 w-5" />} label="Ticket médio" value={formatCurrency(ticketMedio)} />
            <SummaryCard icon={<Users className="h-5 w-5" />} label="Clientes únicos" value={`${clientesUnicos}`} />
            <SummaryCard icon={<UserCheck className="h-5 w-5" />} label="Clientes recorrentes" value={`${clientesRecorrentes}`} />
            <SummaryCard icon={<CalendarDays className="h-5 w-5" />} label="Crescimento" value={crescimento !== 0 ? `${crescimento >= 0 ? '+' : ''}${crescimento.toFixed(1)}%` : '—'} variation={crescimento} />
          </div>

          {/* Top products by quantity */}
          <ProductRanking title="Top 10 — Mais vendidos (volume)" products={topByQtd} sortKey="qtd" />

          {/* Top products by revenue */}
          <ProductRanking title="Top 10 — Maior faturamento" products={topByRevenue} sortKey="faturamento" />

          {/* Hourly chart */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" />Pedidos por hora</CardTitle></CardHeader>
            <CardContent>
              {hourlyData.length === 0 ? <EmptyState /> : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis dataKey="hora" type="category" tick={{ fontSize: 11 }} width={40} />
                      <Tooltip formatter={(v: number, name: string) => name === 'faturamento' ? formatCurrency(v) : v} />
                      <Bar dataKey="pedidos" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Pedidos" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Day of week chart */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Vendas por dia da semana</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dowData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={v => `R$${v}`} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: number, name: string) => name === 'Faturamento' ? formatCurrency(v) : v} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="pedidos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Pedidos" />
                    <Bar yAxisId="right" dataKey="faturamento" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} name="Faturamento" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Heatmap */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Mapa de calor — Pedidos por hora e dia</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="p-1 text-left font-medium text-muted-foreground">Hora</th>
                      {DIAS_SEMANA_CURTO.map(d => <th key={d} className="p-1 text-center font-medium text-muted-foreground">{d}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmap.grid.map((row, hour) => {
                      const hasData = row.some(v => v > 0);
                      if (!hasData) return null;
                      return (
                        <tr key={hour}>
                          <td className="p-1 font-mono text-muted-foreground">{hour}h</td>
                          {row.map((val, dow) => {
                            const intensity = val / heatmap.max;
                            const bg = val === 0 ? 'bg-muted/30' : intensity > 0.7 ? 'bg-green-500' : intensity > 0.4 ? 'bg-green-400' : intensity > 0.15 ? 'bg-green-300' : 'bg-green-200';
                            return (
                              <td key={dow} className="p-1">
                                <div className={`rounded h-7 flex items-center justify-center font-medium ${bg} ${val > 0 ? 'text-white' : 'text-muted-foreground'}`}>
                                  {val > 0 ? val : ''}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Recurring customers */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><UserCheck className="h-4 w-4" />Top 20 clientes</CardTitle></CardHeader>
            <CardContent>
              {recurringCustomers.length === 0 ? <EmptyState /> : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead className="text-center">Pedidos</TableHead>
                        <TableHead className="text-right">Total gasto</TableHead>
                        <TableHead>Último pedido</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recurringCustomers.map((c, i) => (
                        <TableRow key={c.telefone}>
                          <TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="font-mono text-sm">{c.telefone}</TableCell>
                          <TableCell className="text-center">{c.pedidos}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(c.total)}</TableCell>
                          <TableCell className="text-sm">{c.ultimo ? new Date(c.ultimo).toLocaleDateString('pt-BR') : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

function PeriodFilter({ periodo, setPeriodo, customStart, setCustomStart, customEnd, setCustomEnd }: {
  periodo: PeriodoPreset; setPeriodo: (v: PeriodoPreset) => void;
  customStart: string; setCustomStart: (v: string) => void; customEnd: string; setCustomEnd: (v: string) => void;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Período</Label>
            <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoPreset)}>
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

function ProductRanking({ title, products, sortKey }: { title: string; products: { nome: string; qtd: number; faturamento: number }[]; sortKey: 'qtd' | 'faturamento' }) {
  const maxVal = products.length > 0 ? (sortKey === 'qtd' ? products[0].qtd : products[0].faturamento) : 1;
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {products.length === 0 ? <EmptyState /> : (
          <div className="space-y-3">
            {products.map((p, i) => {
              const val = sortKey === 'qtd' ? p.qtd : p.faturamento;
              return (
                <div key={p.nome} className="flex items-center gap-3">
                  <span className="w-6 text-sm font-bold text-muted-foreground text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-sm font-medium truncate">{p.nome}</span>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">{p.qtd} vendas · {formatCurrency(p.faturamento)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(val / maxVal) * 100}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" /> {label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>{options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

function EmptyState() {
  return <p className="text-sm text-muted-foreground py-8 text-center">Nenhum dado no período selecionado.</p>;
}
