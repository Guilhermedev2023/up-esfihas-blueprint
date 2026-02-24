import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Clock, Save, Power, PowerOff } from 'lucide-react';
import { useHorarioFuncionamento } from '@/hooks/useHorarioFuncionamento';

const DAYS = [
  { key: 'seg', label: 'Segunda-feira' },
  { key: 'ter', label: 'Terça-feira' },
  { key: 'qua', label: 'Quarta-feira' },
  { key: 'qui', label: 'Quinta-feira' },
  { key: 'sex', label: 'Sexta-feira' },
  { key: 'sab', label: 'Sábado' },
  { key: 'dom', label: 'Domingo' },
];

const AdminHorario = () => {
  const { horario, isLoading, updateHorario } = useHorarioFuncionamento();
  const [horaAbertura, setHoraAbertura] = useState('18:00');
  const [horaFechamento, setHoraFechamento] = useState('23:59');
  const [diasSemana, setDiasSemana] = useState('Seg a Dom');
  const [diasAbertos, setDiasAbertos] = useState<Record<string, boolean>>({
    seg: true, ter: true, qua: true, qui: true, sex: true, sab: true, dom: true,
  });
  const [overrideManual, setOverrideManual] = useState<string | null>(null);

  useEffect(() => {
    if (horario) {
      setHoraAbertura(horario.hora_abertura.slice(0, 5));
      setHoraFechamento(horario.hora_fechamento.slice(0, 5));
      setDiasSemana(horario.dias_semana);
      setDiasAbertos(horario.dias_abertos);
      setOverrideManual(horario.override_manual);
    }
  }, [horario]);

  const handleSave = () => {
    updateHorario.mutate({
      hora_abertura: horaAbertura,
      hora_fechamento: horaFechamento,
      dias_semana: diasSemana,
      dias_abertos: diasAbertos,
      override_manual: overrideManual,
    });
  };

  const handleOverride = (value: string | null) => {
    setOverrideManual(value);
    // Save immediately
    updateHorario.mutate({
      hora_abertura: horaAbertura,
      hora_fechamento: horaFechamento,
      dias_semana: diasSemana,
      dias_abertos: diasAbertos,
      override_manual: value,
    });
  };

  const toggleDay = (key: string) => {
    setDiasAbertos(prev => ({ ...prev, [key]: !prev[key] }));
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
      {/* Manual Override */}
      <Card className={`border-2 ${overrideManual === 'fechado' ? 'border-destructive' : overrideManual === 'aberto' ? 'border-green-500' : ''}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {overrideManual === 'fechado' ? <PowerOff className="h-5 w-5 text-destructive" /> : <Power className="h-5 w-5 text-green-500" />}
            Controle Manual do Delivery
          </CardTitle>
          <CardDescription>
            Sobrescreve todas as regras de dia e horário. Use para feriados, imprevistos ou manutenção.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant={overrideManual === 'aberto' ? 'default' : 'outline'}
              className={overrideManual === 'aberto' ? 'bg-green-600 hover:bg-green-700' : ''}
              onClick={() => handleOverride('aberto')}
              disabled={updateHorario.isPending}
            >
              🟢 Forçar ABERTO
            </Button>
            <Button
              variant={overrideManual === 'fechado' ? 'destructive' : 'outline'}
              onClick={() => handleOverride('fechado')}
              disabled={updateHorario.isPending}
            >
              🔴 Forçar FECHADO
            </Button>
            <Button
              variant={overrideManual === null ? 'secondary' : 'outline'}
              onClick={() => handleOverride(null)}
              disabled={updateHorario.isPending}
            >
              ⚙️ Automático (sem override)
            </Button>
          </div>
          {overrideManual && (
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              ⚠️ Override ativo: o delivery está <strong>{overrideManual === 'aberto' ? 'ABERTO' : 'FECHADO'}</strong> independente do dia/horário.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Day Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📅 Funcionamento do Delivery
          </CardTitle>
          <CardDescription>
            Selecione os dias em que o delivery funciona. Dias marcados como fechado bloqueiam pedidos automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DAYS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                <span className="font-medium">{label}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${diasAbertos[key] ? 'text-green-600' : 'text-destructive'}`}>
                    {diasAbertos[key] ? '✅ Aberto' : '❌ Fechado'}
                  </span>
                  <Switch
                    checked={diasAbertos[key]}
                    onCheckedChange={() => toggleDay(key)}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hours Config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horário de Funcionamento
          </CardTitle>
          <CardDescription>
            Configure o horário de abertura e fechamento nos dias ativos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hora-abertura">Horário de Abertura</Label>
              <Input
                id="hora-abertura"
                type="time"
                value={horaAbertura}
                onChange={(e) => setHoraAbertura(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora-fechamento">Horário de Fechamento</Label>
              <Input
                id="hora-fechamento"
                type="time"
                value={horaFechamento}
                onChange={(e) => setHoraFechamento(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dias-semana">Texto exibido para clientes</Label>
            <Input
              id="dias-semana"
              type="text"
              value={diasSemana}
              onChange={(e) => setDiasSemana(e.target.value)}
              placeholder="Ex: Seg a Dom, Seg a Sex"
            />
            <p className="text-xs text-muted-foreground">
              Texto descritivo exibido no site (ex: "Seg a Sáb", "Segunda a Sexta")
            </p>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium">Horário atual configurado:</p>
            <p className="text-lg">
              {diasSemana}, {horaAbertura} às {horaFechamento}
            </p>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={updateHorario.isPending}
            className="w-full sm:w-auto"
          >
            {updateHorario.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Alterações
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminHorario;
