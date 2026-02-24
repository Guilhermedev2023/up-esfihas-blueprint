import { useStoreOpen } from '@/hooks/useStoreOpen';
import { Clock } from 'lucide-react';
import { useHorarioFuncionamento } from '@/hooks/useHorarioFuncionamento';

export const StoreStatus = () => {
  const { data: isOpen = true } = useStoreOpen();
  const { horario } = useHorarioFuncionamento();

  const hoursText = horario
    ? `${horario.dias_semana}, ${horario.hora_abertura.slice(0, 5).replace(':', 'h')} às ${horario.hora_fechamento.slice(0, 5).replace(':', 'h')}`
    : 'Seg a Dom, 18h às 00h';
  
  return (
    <div className="flex items-center gap-2">
      <div 
        className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
          isOpen 
            ? 'bg-green-500/20 text-green-600' 
            : 'bg-red-500/20 text-red-600'
        }`}
      >
        <span className={`h-2 w-2 rounded-full ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        {isOpen ? 'Aberto' : 'Fechado'}
      </div>
      <span className="hidden text-xs text-muted-foreground sm:inline">
        <Clock className="mr-1 inline h-3 w-3" />
        {hoursText}
      </span>
    </div>
  );
};
