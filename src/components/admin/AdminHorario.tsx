import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Clock, Save } from 'lucide-react';
import { useHorarioFuncionamento } from '@/hooks/useHorarioFuncionamento';

const AdminHorario = () => {
  const { horario, isLoading, updateHorario } = useHorarioFuncionamento();
  const [horaAbertura, setHoraAbertura] = useState('18:00');
  const [horaFechamento, setHoraFechamento] = useState('23:59');
  const [diasSemana, setDiasSemana] = useState('Seg a Dom');

  useEffect(() => {
    if (horario) {
      // Remove seconds from time if present (e.g., "18:00:00" -> "18:00")
      setHoraAbertura(horario.hora_abertura.slice(0, 5));
      setHoraFechamento(horario.hora_fechamento.slice(0, 5));
      setDiasSemana(horario.dias_semana);
    }
  }, [horario]);

  const handleSave = () => {
    updateHorario.mutate({
      hora_abertura: horaAbertura,
      hora_fechamento: horaFechamento,
      dias_semana: diasSemana,
    });
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horário de Funcionamento
          </CardTitle>
          <CardDescription>
            Configure o horário de funcionamento do restaurante. O status "Aberto/Fechado" será atualizado automaticamente.
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
            <Label htmlFor="dias-semana">Dias de Funcionamento</Label>
            <Input
              id="dias-semana"
              type="text"
              value={diasSemana}
              onChange={(e) => setDiasSemana(e.target.value)}
              placeholder="Ex: Seg a Dom, Seg a Sex"
            />
            <p className="text-xs text-muted-foreground">
              Texto que será exibido para os clientes (ex: "Seg a Dom", "Segunda a Sexta")
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
