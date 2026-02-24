import { supabase } from '@/integrations/supabase/client';

interface HorarioConfig {
  hora_abertura: string;
  hora_fechamento: string;
  dias_semana: string;
  dias_abertos?: Record<string, boolean>;
  override_manual?: string | null;
}

let cachedHorario: HorarioConfig | null = null;
let lastFetch = 0;
const CACHE_DURATION = 30000; // 30 seconds cache

const DAY_MAP: Record<number, string> = {
  0: 'dom',
  1: 'seg',
  2: 'ter',
  3: 'qua',
  4: 'qui',
  5: 'sex',
  6: 'sab',
};

export const fetchHorarioFuncionamento = async (): Promise<HorarioConfig> => {
  const now = Date.now();
  
  if (cachedHorario && (now - lastFetch) < CACHE_DURATION) {
    return cachedHorario;
  }

  try {
    const { data, error } = await supabase
      .from('horario_funcionamento')
      .select('hora_abertura, hora_fechamento, dias_semana, dias_abertos, override_manual')
      .eq('ativo', true)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      cachedHorario = {
        ...data,
        dias_abertos: data.dias_abertos as Record<string, boolean> | undefined,
        override_manual: data.override_manual as string | null,
      };
      lastFetch = now;
      return cachedHorario;
    }
  } catch (error) {
    console.error('Error fetching horario:', error);
  }

  // Default fallback
  return {
    hora_abertura: '18:00:00',
    hora_fechamento: '23:59:00',
    dias_semana: 'Seg a Dom',
    dias_abertos: { seg: true, ter: true, qua: true, qui: true, sex: true, sab: true, dom: true },
    override_manual: null,
  };
};

export const clearHorarioCache = () => {
  cachedHorario = null;
  lastFetch = 0;
};

export const isStoreOpenWithConfig = (horario: HorarioConfig): boolean => {
  // 1. Manual override has highest priority
  if (horario.override_manual === 'aberto') return true;
  if (horario.override_manual === 'fechado') return false;

  // 2. Check day-of-week schedule
  const today = new Date();
  const dayKey = DAY_MAP[today.getDay()];
  if (horario.dias_abertos && horario.dias_abertos[dayKey] === false) {
    return false;
  }

  // 3. Check time-based hours
  const hours = today.getHours();
  const minutes = today.getMinutes();
  const currentTime = hours * 60 + minutes;

  const [openHour, openMin] = horario.hora_abertura.split(':').map(Number);
  const [closeHour, closeMin] = horario.hora_fechamento.split(':').map(Number);

  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

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
