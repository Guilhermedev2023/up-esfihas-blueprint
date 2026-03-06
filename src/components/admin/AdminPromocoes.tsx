import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Gift, Ticket, ShoppingCart, Calendar, Truck } from 'lucide-react';
import { usePromocoes, Promocao } from '@/hooks/usePromocoes';

const DIAS_LABELS: Record<string, string> = {
  seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta', sex: 'Sexta', sab: 'Sábado', dom: 'Domingo',
};

function PromoCard({ titulo, icone, children }: { titulo: string; icone: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          {icone}
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function PromoPrimeiroPedido({ promo, onSave }: { promo: Promocao | undefined; onSave: (updates: Partial<Promocao> & { id: string }) => void }) {
  const [ativo, setAtivo] = useState(promo?.ativo || false);
  const [porcentagem, setPorcentagem] = useState(String(promo?.desconto_porcentagem || 10));

  useEffect(() => {
    if (promo) { setAtivo(promo.ativo); setPorcentagem(String(promo.desconto_porcentagem || 10)); }
  }, [promo]);

  if (!promo) return null;

  const handleSave = () => {
    const val = Math.min(100, Math.max(1, Number(porcentagem) || 10));
    onSave({ id: promo.id, ativo, desconto_porcentagem: val });
  };

  return (
    <PromoCard titulo="Desconto Primeiro Pedido" icone={<Gift className="h-5 w-5 text-primary" />}>
      <div className="flex items-center justify-between">
        <Label>Ativar promoção</Label>
        <Switch checked={ativo} onCheckedChange={setAtivo} />
      </div>
      <div className="space-y-2">
        <Label>Porcentagem de desconto (%)</Label>
        <Input type="number" min={1} max={100} value={porcentagem} onChange={e => setPorcentagem(e.target.value)} />
      </div>
      <p className="text-xs text-muted-foreground">Desconto aplicado apenas no primeiro pedido do cliente (identificado pelo telefone).</p>
      <Button onClick={handleSave} className="w-full">Salvar</Button>
    </PromoCard>
  );
}

function PromoSegundoPedido({ promo, onSave }: { promo: Promocao | undefined; onSave: (updates: Partial<Promocao> & { id: string }) => void }) {
  const [ativo, setAtivo] = useState(promo?.ativo || false);
  const [porcentagem, setPorcentagem] = useState(String(promo?.desconto_porcentagem || 10));
  const [validade, setValidade] = useState(String(promo?.validade_dias || 7));

  useEffect(() => {
    if (promo) { setAtivo(promo.ativo); setPorcentagem(String(promo.desconto_porcentagem || 10)); setValidade(String(promo.validade_dias || 7)); }
  }, [promo]);

  if (!promo) return null;

  const handleSave = () => {
    onSave({
      id: promo.id, ativo,
      desconto_porcentagem: Math.min(100, Math.max(1, Number(porcentagem) || 10)),
      validade_dias: Number(validade) || null,
    });
  };

  return (
    <PromoCard titulo="Cupom Automático - Segundo Pedido" icone={<Ticket className="h-5 w-5 text-primary" />}>
      <div className="flex items-center justify-between">
        <Label>Ativar promoção</Label>
        <Switch checked={ativo} onCheckedChange={setAtivo} />
      </div>
      <div className="space-y-2">
        <Label>Porcentagem de desconto (%)</Label>
        <Input type="number" min={1} max={100} value={porcentagem} onChange={e => setPorcentagem(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Validade do cupom (dias, opcional)</Label>
        <Input type="number" min={1} value={validade} onChange={e => setValidade(e.target.value)} placeholder="Ex: 7" />
      </div>
      <p className="text-xs text-muted-foreground">Após o primeiro pedido, o cliente recebe automaticamente um cupom para o segundo pedido.</p>
      <Button onClick={handleSave} className="w-full">Salvar</Button>
    </PromoCard>
  );
}

function PromoValorMinimo({ promo, onSave }: { promo: Promocao | undefined; onSave: (updates: Partial<Promocao> & { id: string }) => void }) {
  const [ativo, setAtivo] = useState(promo?.ativo || false);
  const [valorMin, setValorMin] = useState(String(promo?.valor_minimo_pedido || 50));
  const [tipoDesconto, setTipoDesconto] = useState<'porcentagem' | 'valor_fixo'>(promo?.tipo_desconto || 'porcentagem');
  const [porcentagem, setPorcentagem] = useState(String(promo?.desconto_porcentagem || 10));
  const [valorFixo, setValorFixo] = useState(String(promo?.desconto_valor || 10));

  useEffect(() => {
    if (promo) {
      setAtivo(promo.ativo); setValorMin(String(promo.valor_minimo_pedido || 50));
      setTipoDesconto(promo.tipo_desconto || 'porcentagem');
      setPorcentagem(String(promo.desconto_porcentagem || 10));
      setValorFixo(String(promo.desconto_valor || 10));
    }
  }, [promo]);

  if (!promo) return null;

  const handleSave = () => {
    onSave({
      id: promo.id, ativo,
      valor_minimo_pedido: Number(valorMin) || 50,
      tipo_desconto: tipoDesconto,
      desconto_porcentagem: tipoDesconto === 'porcentagem' ? Math.min(100, Math.max(1, Number(porcentagem) || 10)) : null,
      desconto_valor: tipoDesconto === 'valor_fixo' ? Number(valorFixo) || 10 : null,
    });
  };

  return (
    <PromoCard titulo="Desconto por Valor Mínimo" icone={<ShoppingCart className="h-5 w-5 text-primary" />}>
      <div className="flex items-center justify-between">
        <Label>Ativar promoção</Label>
        <Switch checked={ativo} onCheckedChange={setAtivo} />
      </div>
      <div className="space-y-2">
        <Label>Valor mínimo do pedido (R$)</Label>
        <Input type="number" min={1} value={valorMin} onChange={e => setValorMin(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Tipo de desconto</Label>
        <Select value={tipoDesconto} onValueChange={(v) => setTipoDesconto(v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="porcentagem">Porcentagem</SelectItem>
            <SelectItem value="valor_fixo">Valor fixo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {tipoDesconto === 'porcentagem' ? (
        <div className="space-y-2">
          <Label>Desconto (%)</Label>
          <Input type="number" min={1} max={100} value={porcentagem} onChange={e => setPorcentagem(e.target.value)} />
        </div>
      ) : (
        <div className="space-y-2">
          <Label>Valor do desconto (R$)</Label>
          <Input type="number" min={1} value={valorFixo} onChange={e => setValorFixo(e.target.value)} />
        </div>
      )}
      <Button onClick={handleSave} className="w-full">Salvar</Button>
    </PromoCard>
  );
}

function PromoDiaSemana({ promo, onSave }: { promo: Promocao | undefined; onSave: (updates: Partial<Promocao> & { id: string }) => void }) {
  const [ativo, setAtivo] = useState(promo?.ativo || false);
  const [dias, setDias] = useState<Record<string, boolean>>(promo?.dias_semana || {});
  const [tipoDesconto, setTipoDesconto] = useState<'porcentagem' | 'valor_fixo'>(promo?.tipo_desconto || 'porcentagem');
  const [porcentagem, setPorcentagem] = useState(String(promo?.desconto_porcentagem || 15));
  const [valorFixo, setValorFixo] = useState(String(promo?.desconto_valor || 10));

  useEffect(() => {
    if (promo) {
      setAtivo(promo.ativo); setDias(promo.dias_semana || {});
      setTipoDesconto(promo.tipo_desconto || 'porcentagem');
      setPorcentagem(String(promo.desconto_porcentagem || 15));
      setValorFixo(String(promo.desconto_valor || 10));
    }
  }, [promo]);

  if (!promo) return null;

  const toggleDia = (dia: string) => setDias(prev => ({ ...prev, [dia]: !prev[dia] }));

  const handleSave = () => {
    onSave({
      id: promo.id, ativo,
      dias_semana: dias as any,
      tipo_desconto: tipoDesconto,
      desconto_porcentagem: tipoDesconto === 'porcentagem' ? Math.min(100, Math.max(1, Number(porcentagem) || 15)) : null,
      desconto_valor: tipoDesconto === 'valor_fixo' ? Number(valorFixo) || 10 : null,
    });
  };

  return (
    <PromoCard titulo="Promoções em Dias Específicos" icone={<Calendar className="h-5 w-5 text-primary" />}>
      <div className="flex items-center justify-between">
        <Label>Ativar promoção</Label>
        <Switch checked={ativo} onCheckedChange={setAtivo} />
      </div>
      <div className="space-y-2">
        <Label>Dias da semana</Label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(DIAS_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox checked={!!dias[key]} onCheckedChange={() => toggleDia(key)} id={`dia-${key}`} />
              <Label htmlFor={`dia-${key}`} className="text-sm cursor-pointer">{label}</Label>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Tipo de desconto</Label>
        <Select value={tipoDesconto} onValueChange={(v) => setTipoDesconto(v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="porcentagem">Porcentagem</SelectItem>
            <SelectItem value="valor_fixo">Valor fixo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {tipoDesconto === 'porcentagem' ? (
        <div className="space-y-2">
          <Label>Desconto (%)</Label>
          <Input type="number" min={1} max={100} value={porcentagem} onChange={e => setPorcentagem(e.target.value)} />
        </div>
      ) : (
        <div className="space-y-2">
          <Label>Valor do desconto (R$)</Label>
          <Input type="number" min={1} value={valorFixo} onChange={e => setValorFixo(e.target.value)} />
        </div>
      )}
      <Button onClick={handleSave} className="w-full">Salvar</Button>
    </PromoCard>
  );
}

function PromoFreteGratis({ promo, onSave }: { promo: Promocao | undefined; onSave: (updates: Partial<Promocao> & { id: string }) => void }) {
  const [ativo, setAtivo] = useState(promo?.ativo || false);
  const [valorMin, setValorMin] = useState(String(promo?.valor_minimo_pedido || 60));

  useEffect(() => {
    if (promo) { setAtivo(promo.ativo); setValorMin(String(promo.valor_minimo_pedido || 60)); }
  }, [promo]);

  if (!promo) return null;

  const handleSave = () => {
    onSave({ id: promo.id, ativo, valor_minimo_pedido: Number(valorMin) || 60 });
  };

  return (
    <PromoCard titulo="Frete Grátis Automático" icone={<Truck className="h-5 w-5 text-primary" />}>
      <div className="flex items-center justify-between">
        <Label>Ativar frete grátis</Label>
        <Switch checked={ativo} onCheckedChange={setAtivo} />
      </div>
      <div className="space-y-2">
        <Label>Valor mínimo do pedido (R$)</Label>
        <Input type="number" min={1} value={valorMin} onChange={e => setValorMin(e.target.value)} />
      </div>
      <p className="text-xs text-muted-foreground">Pedidos acima do valor configurado terão frete grátis automaticamente.</p>
      <Button onClick={handleSave} className="w-full">Salvar</Button>
    </PromoCard>
  );
}

export default function AdminPromocoes() {
  const { promocoes, getPromocao, updatePromocao, isLoading } = usePromocoes();

  const handleSave = async (updates: Partial<Promocao> & { id: string }) => {
    try {
      await updatePromocao.mutateAsync(updates);
      toast.success('Promoção atualizada com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + (err?.message || 'Erro desconhecido'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">🎁 Gestão de Promoções</h2>
        <p className="text-muted-foreground text-sm mt-1">Configure promoções e descontos automáticos para o checkout.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <PromoPrimeiroPedido promo={getPromocao('primeiro_pedido')} onSave={handleSave} />
        <PromoSegundoPedido promo={getPromocao('segundo_pedido')} onSave={handleSave} />
        <PromoValorMinimo promo={getPromocao('valor_minimo')} onSave={handleSave} />
        <PromoDiaSemana promo={getPromocao('dia_semana')} onSave={handleSave} />
        <PromoFreteGratis promo={getPromocao('frete_gratis')} onSave={handleSave} />
      </div>

      <Card className="border-dashed">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">📌 Regras de prioridade</h3>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal ml-4">
            <li>Desconto primeiro pedido</li>
            <li>Cupom segundo pedido</li>
            <li>Desconto por valor mínimo</li>
            <li>Promoção por dia da semana</li>
            <li>Frete grátis (pode acumular com qualquer desconto)</li>
          </ol>
          <p className="text-xs text-muted-foreground mt-2">Apenas o melhor desconto (1-4) é aplicado. Frete grátis é independente.</p>
        </CardContent>
      </Card>
    </div>
  );
}
