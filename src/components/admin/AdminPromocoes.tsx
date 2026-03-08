import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Gift, Ticket, ShoppingCart, Calendar, Truck, Save } from 'lucide-react';
import { usePromocoes, Promocao } from '@/hooks/usePromocoes';

const DIAS_LABELS: Record<string, string> = {
  seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta', sex: 'Sexta', sab: 'Sábado', dom: 'Domingo',
};

interface PromoCardProps {
  titulo: string;
  descricao: string;
  icone: React.ReactNode;
  ativo: boolean;
  onAtivoChange: (v: boolean) => void;
  onSave: () => void;
  saving?: boolean;
  children: React.ReactNode;
}

function PromoCard({ titulo, descricao, icone, ativo, onAtivoChange, onSave, saving, children }: PromoCardProps) {
  return (
    <Card className="border-2 transition-colors" style={{ borderColor: ativo ? 'hsl(var(--primary) / 0.4)' : undefined }}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-primary/10 p-2">{icone}</div>
            <div>
              <CardTitle className="text-base">{titulo}</CardTitle>
              <CardDescription className="mt-1">{descricao}</CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 shrink-0">
            <Switch checked={ativo} onCheckedChange={onAtivoChange} />
            <span className="text-[10px] font-medium text-muted-foreground">{ativo ? 'ATIVO' : 'INATIVO'}</span>
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-4 space-y-4">
        {children}
        <Button onClick={onSave} disabled={saving} className="w-full gap-2">
          <Save className="h-4 w-4" />
          Salvar configurações
        </Button>
      </CardContent>
    </Card>
  );
}

function PromoPrimeiroPedido({ promo, onSave }: { promo: Promocao | undefined; onSave: (u: Partial<Promocao> & { id: string }) => void }) {
  const [ativo, setAtivo] = useState(promo?.ativo || false);
  const [porcentagem, setPorcentagem] = useState(String(promo?.desconto_porcentagem || 10));
  const [valorMin, setValorMin] = useState(String(promo?.valor_minimo_pedido || ''));
  const [delivery, setDelivery] = useState(promo?.aplicar_delivery ?? true);
  const [retirada, setRetirada] = useState(promo?.aplicar_retirada ?? false);

  useEffect(() => {
    if (promo) {
      setAtivo(promo.ativo);
      setPorcentagem(String(promo.desconto_porcentagem || 10));
      setValorMin(promo.valor_minimo_pedido ? String(promo.valor_minimo_pedido) : '');
      setDelivery(promo.aplicar_delivery ?? true);
      setRetirada(promo.aplicar_retirada ?? false);
    }
  }, [promo]);

  if (!promo) return null;

  const handleSave = () => {
    onSave({
      id: promo.id, ativo,
      desconto_porcentagem: Math.min(100, Math.max(1, Number(porcentagem) || 10)),
      valor_minimo_pedido: valorMin ? Number(valorMin) : null,
      aplicar_delivery: delivery,
      aplicar_retirada: retirada,
    });
  };

  return (
    <PromoCard
      titulo="Desconto para primeiro pedido"
      descricao="Aplicar desconto automático no primeiro pedido de novos clientes."
      icone={<Gift className="h-5 w-5 text-primary" />}
      ativo={ativo}
      onAtivoChange={setAtivo}
      onSave={handleSave}
    >
      <div className="space-y-2">
        <Label>Porcentagem de desconto (%)</Label>
        <Input type="number" min={1} max={100} value={porcentagem} onChange={e => setPorcentagem(e.target.value)} placeholder="Ex: 10" />
      </div>
      <div className="space-y-2">
        <Label>Valor mínimo do pedido (R$)</Label>
        <Input type="number" min={0} value={valorMin} onChange={e => setValorMin(e.target.value)} placeholder="Ex: 30 (opcional)" />
      </div>
      <div className="space-y-2">
        <Label>Aplicar para</Label>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Checkbox checked={delivery} onCheckedChange={(v) => setDelivery(!!v)} id="pp-delivery" />
            <Label htmlFor="pp-delivery" className="text-sm cursor-pointer">Pedidos delivery</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={retirada} onCheckedChange={(v) => setRetirada(!!v)} id="pp-retirada" />
            <Label htmlFor="pp-retirada" className="text-sm cursor-pointer">Retirada no local</Label>
          </div>
        </div>
      </div>
    </PromoCard>
  );
}

function PromoSegundoPedido({ promo, onSave }: { promo: Promocao | undefined; onSave: (u: Partial<Promocao> & { id: string }) => void }) {
  const [ativo, setAtivo] = useState(promo?.ativo || false);
  const [porcentagem, setPorcentagem] = useState(String(promo?.desconto_porcentagem || 10));
  const [validade, setValidade] = useState(String(promo?.validade_dias || 7));
  const [valorMin, setValorMin] = useState(String(promo?.valor_minimo_pedido || ''));

  useEffect(() => {
    if (promo) {
      setAtivo(promo.ativo);
      setPorcentagem(String(promo.desconto_porcentagem || 10));
      setValidade(String(promo.validade_dias || 7));
      setValorMin(promo.valor_minimo_pedido ? String(promo.valor_minimo_pedido) : '');
    }
  }, [promo]);

  if (!promo) return null;

  const handleSave = () => {
    onSave({
      id: promo.id, ativo,
      desconto_porcentagem: Math.min(100, Math.max(1, Number(porcentagem) || 10)),
      validade_dias: Number(validade) || null,
      valor_minimo_pedido: valorMin ? Number(valorMin) : null,
    });
  };

  return (
    <PromoCard
      titulo="Cupom automático para segundo pedido"
      descricao="Após o primeiro pedido, o cliente recebe automaticamente um cupom para o próximo pedido."
      icone={<Ticket className="h-5 w-5 text-primary" />}
      ativo={ativo}
      onAtivoChange={setAtivo}
      onSave={handleSave}
    >
      <div className="space-y-2">
        <Label>Porcentagem de desconto (%)</Label>
        <Input type="number" min={1} max={100} value={porcentagem} onChange={e => setPorcentagem(e.target.value)} placeholder="Ex: 15" />
      </div>
      <div className="space-y-2">
        <Label>Validade do cupom (dias)</Label>
        <Input type="number" min={1} value={validade} onChange={e => setValidade(e.target.value)} placeholder="Ex: 7" />
      </div>
      <div className="space-y-2">
        <Label>Valor mínimo do pedido (R$)</Label>
        <Input type="number" min={0} value={valorMin} onChange={e => setValorMin(e.target.value)} placeholder="Opcional" />
      </div>
    </PromoCard>
  );
}

function PromoValorMinimo({ promo, onSave }: { promo: Promocao | undefined; onSave: (u: Partial<Promocao> & { id: string }) => void }) {
  const [ativo, setAtivo] = useState(promo?.ativo || false);
  const [valorMin, setValorMin] = useState(String(promo?.valor_minimo_pedido || 50));
  const [tipoDesconto, setTipoDesconto] = useState<'porcentagem' | 'valor_fixo'>(promo?.tipo_desconto || 'porcentagem');
  const [porcentagem, setPorcentagem] = useState(String(promo?.desconto_porcentagem || 10));
  const [valorFixo, setValorFixo] = useState(String(promo?.desconto_valor || 10));

  useEffect(() => {
    if (promo) {
      setAtivo(promo.ativo);
      setValorMin(String(promo.valor_minimo_pedido || 50));
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
    <PromoCard
      titulo="Desconto para pedidos acima de determinado valor"
      descricao="Aumentar o ticket médio oferecendo desconto em pedidos acima de um valor mínimo."
      icone={<ShoppingCart className="h-5 w-5 text-primary" />}
      ativo={ativo}
      onAtivoChange={setAtivo}
      onSave={handleSave}
    >
      <div className="space-y-2">
        <Label>Valor mínimo do pedido (R$)</Label>
        <Input type="number" min={1} value={valorMin} onChange={e => setValorMin(e.target.value)} placeholder="Ex: 50" />
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
    </PromoCard>
  );
}

function PromoDiaSemana({ promo, onSave }: { promo: Promocao | undefined; onSave: (u: Partial<Promocao> & { id: string }) => void }) {
  const [ativo, setAtivo] = useState(promo?.ativo || false);
  const [dias, setDias] = useState<Record<string, boolean>>(promo?.dias_semana || {});
  const [tipoDesconto, setTipoDesconto] = useState<'porcentagem' | 'valor_fixo'>(promo?.tipo_desconto || 'porcentagem');
  const [porcentagem, setPorcentagem] = useState(String(promo?.desconto_porcentagem || 15));
  const [valorFixo, setValorFixo] = useState(String(promo?.desconto_valor || 10));
  const [valorMin, setValorMin] = useState(String(promo?.valor_minimo_pedido || ''));

  useEffect(() => {
    if (promo) {
      setAtivo(promo.ativo);
      setDias(promo.dias_semana || {});
      setTipoDesconto(promo.tipo_desconto || 'porcentagem');
      setPorcentagem(String(promo.desconto_porcentagem || 15));
      setValorFixo(String(promo.desconto_valor || 10));
      setValorMin(promo.valor_minimo_pedido ? String(promo.valor_minimo_pedido) : '');
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
      valor_minimo_pedido: valorMin ? Number(valorMin) : null,
    });
  };

  return (
    <PromoCard
      titulo="Promoções em dias específicos"
      descricao="Criar promoções estratégicas em dias da semana. Ex: Terça da Esfiha, Sexta do Combo."
      icone={<Calendar className="h-5 w-5 text-primary" />}
      ativo={ativo}
      onAtivoChange={setAtivo}
      onSave={handleSave}
    >
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
      <div className="space-y-2">
        <Label>Valor mínimo do pedido (R$)</Label>
        <Input type="number" min={0} value={valorMin} onChange={e => setValorMin(e.target.value)} placeholder="Opcional" />
      </div>
    </PromoCard>
  );
}

function PromoFreteGratis({ promo, onSave }: { promo: Promocao | undefined; onSave: (u: Partial<Promocao> & { id: string }) => void }) {
  const [ativo, setAtivo] = useState(promo?.ativo || false);
  const [valorMin, setValorMin] = useState(String(promo?.valor_minimo_pedido || 60));
  const [delivery, setDelivery] = useState(promo?.aplicar_delivery ?? true);
  const [retirada, setRetirada] = useState(promo?.aplicar_retirada ?? false);

  useEffect(() => {
    if (promo) {
      setAtivo(promo.ativo);
      setValorMin(String(promo.valor_minimo_pedido || 60));
      setDelivery(promo.aplicar_delivery ?? true);
      setRetirada(promo.aplicar_retirada ?? false);
    }
  }, [promo]);

  if (!promo) return null;

  const handleSave = () => {
    onSave({
      id: promo.id, ativo,
      valor_minimo_pedido: Number(valorMin) || 60,
      aplicar_delivery: delivery,
      aplicar_retirada: retirada,
    });
  };

  return (
    <PromoCard
      titulo="Frete grátis automático"
      descricao="Aumentar conversão e reduzir abandono de carrinho com frete grátis para pedidos acima de um valor."
      icone={<Truck className="h-5 w-5 text-primary" />}
      ativo={ativo}
      onAtivoChange={setAtivo}
      onSave={handleSave}
    >
      <div className="space-y-2">
        <Label>Valor mínimo do pedido (R$)</Label>
        <Input type="number" min={1} value={valorMin} onChange={e => setValorMin(e.target.value)} placeholder="Ex: 60" />
      </div>
      <div className="space-y-2">
        <Label>Aplicar para</Label>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Checkbox checked={delivery} onCheckedChange={(v) => setDelivery(!!v)} id="fg-delivery" />
            <Label htmlFor="fg-delivery" className="text-sm cursor-pointer">Delivery</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={retirada} onCheckedChange={(v) => setRetirada(!!v)} id="fg-retirada" />
            <Label htmlFor="fg-retirada" className="text-sm cursor-pointer">Retirada</Label>
          </div>
        </div>
      </div>
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
        <p className="text-muted-foreground text-sm mt-1">Configure promoções e descontos automáticos para o checkout. Cada promoção funciona de forma independente.</p>
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
