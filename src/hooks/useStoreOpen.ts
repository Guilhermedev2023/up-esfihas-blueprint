import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const DAY_MAP: Record<number, string> = {
  0: 'dom', 1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex', 6: 'sab',
};

export const useStoreOpen = () => {
  return useQuery({
    queryKey: ['store-open-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('horario_funcionamento')
        .select('hora_abertura, hora_fechamento, dias_abertos, override_manual')
        .eq('ativo', true)
        .maybeSingle();

      if (error) throw error;

      if (!data) return true; // default open

      const overrideManual = data.override_manual as string | null;
      if (overrideManual === 'aberto') return true;
      if (overrideManual === 'fechado') return false;

      const diasAbertos = data.dias_abertos as Record<string, boolean> | null;
      const dayKey = DAY_MAP[new Date().getDay()];
      if (diasAbertos && diasAbertos[dayKey] === false) return false;

      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [oh, om] = data.hora_abertura.split(':').map(Number);
      const [ch, cm] = data.hora_fechamento.split(':').map(Number);
      const openTime = oh * 60 + om;
      const closeTime = ch * 60 + cm;

      if (closeTime < openTime) {
        return currentTime >= openTime || currentTime <= closeTime;
      }
      return currentTime >= openTime && currentTime <= closeTime;
    },
    refetchInterval: 30000, // refresh every 30s
  });
};
