import { supabase } from '@/integrations/supabase/client';

interface HorarioConfig {
  hora_abertura: string;
  hora_fechamento: string;
  dias_semana: string;
}

let cachedHorario: HorarioConfig | null = null;
let lastFetch = 0;
const CACHE_DURATION = 60000; // 1 minute cache

export const fetchHorarioFuncionamento = async (): Promise<HorarioConfig> => {
  const now = Date.now();
  
  if (cachedHorario && (now - lastFetch) < CACHE_DURATION) {
    return cachedHorario;
  }

  try {
    const { data, error } = await supabase
      .from('horario_funcionamento')
      .select('hora_abertura, hora_fechamento, dias_semana')
      .eq('ativo', true)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      cachedHorario = data;
      lastFetch = now;
      return data;
    }
  } catch (error) {
    console.error('Error fetching horario:', error);
  }

  // Default fallback
  return {
    hora_abertura: '18:00:00',
    hora_fechamento: '23:59:00',
    dias_semana: 'Seg a Dom',
  };
};

export const isStoreOpenWithConfig = (horario: HorarioConfig): boolean => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 60 + minutes;

  // Parse time strings (format: "HH:MM" or "HH:MM:SS")
  const [openHour, openMin] = horario.hora_abertura.split(':').map(Number);
  const [closeHour, closeMin] = horario.hora_fechamento.split(':').map(Number);

  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

  // Handle overnight hours (e.g., 22:00 to 02:00)
  if (closeTime < openTime) {
    return currentTime >= openTime || currentTime <= closeTime;
  }

  return currentTime >= openTime && currentTime <= closeTime;
};

// Legacy sync function with default values (for backwards compatibility)
export const isStoreOpen = (): boolean => {
  if (cachedHorario) {
    return isStoreOpenWithConfig(cachedHorario);
  }
  
  // Default: 18:00 to 23:59
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 60 + minutes;
  const openTime = 18 * 60;
  const closeTime = 23 * 60 + 59;
  
  return currentTime >= openTime && currentTime <= closeTime;
};

export const getStoreStatusText = (): string => {
  return isStoreOpen() ? 'Aberto' : 'Fechado';
};

export const getStoreHoursText = (): string => {
  if (cachedHorario) {
    const openTime = cachedHorario.hora_abertura.slice(0, 5).replace(':', 'h');
    const closeTime = cachedHorario.hora_fechamento.slice(0, 5).replace(':', 'h');
    return `${cachedHorario.dias_semana}, ${openTime} às ${closeTime}`;
  }
  return 'Seg a Dom, 18h às 00h';
};
