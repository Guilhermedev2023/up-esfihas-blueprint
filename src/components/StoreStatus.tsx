import { useState, useEffect } from 'react';
import { fetchHorarioFuncionamento, isStoreOpenWithConfig, isStoreOpen, getStoreStatusText, getStoreHoursText } from '@/utils/storeHours';
import { Clock } from 'lucide-react';

export const StoreStatus = () => {
  const [open, setOpen] = useState(isStoreOpen());
  const [hoursText, setHoursText] = useState(getStoreHoursText());

  useEffect(() => {
    const loadHorario = async () => {
      const horario = await fetchHorarioFuncionamento();
      setOpen(isStoreOpenWithConfig(horario));
      const openTime = horario.hora_abertura.slice(0, 5).replace(':', 'h');
      const closeTime = horario.hora_fechamento.slice(0, 5).replace(':', 'h');
      setHoursText(`${horario.dias_semana}, ${openTime} às ${closeTime}`);
    };

    loadHorario();

    // Update status every minute
    const interval = setInterval(loadHorario, 60000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="flex items-center gap-2">
      <div 
        className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
          open 
            ? 'bg-green-500/20 text-green-600' 
            : 'bg-red-500/20 text-red-600'
        }`}
      >
        <span className={`h-2 w-2 rounded-full ${open ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        {open ? 'Aberto' : 'Fechado'}
      </div>
      <span className="hidden text-xs text-muted-foreground sm:inline">
        <Clock className="mr-1 inline h-3 w-3" />
        {hoursText}
      </span>
    </div>
  );
};
