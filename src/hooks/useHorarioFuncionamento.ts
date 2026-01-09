import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface HorarioFuncionamento {
  id: string;
  hora_abertura: string;
  hora_fechamento: string;
  dias_semana: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const useHorarioFuncionamento = () => {
  const queryClient = useQueryClient();

  const { data: horario, isLoading, error } = useQuery({
    queryKey: ['horario-funcionamento'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('horario_funcionamento')
        .select('*')
        .eq('ativo', true)
        .maybeSingle();

      if (error) throw error;
      return data as HorarioFuncionamento | null;
    },
  });

  const updateHorario = useMutation({
    mutationFn: async (updates: { hora_abertura: string; hora_fechamento: string; dias_semana: string }) => {
      if (!horario?.id) {
        // Insert if no record exists
        const { data, error } = await supabase
          .from('horario_funcionamento')
          .insert({
            hora_abertura: updates.hora_abertura,
            hora_fechamento: updates.hora_fechamento,
            dias_semana: updates.dias_semana,
            ativo: true,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      const { data, error } = await supabase
        .from('horario_funcionamento')
        .update({
          hora_abertura: updates.hora_abertura,
          hora_fechamento: updates.hora_fechamento,
          dias_semana: updates.dias_semana,
        })
        .eq('id', horario.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horario-funcionamento'] });
      toast.success('Horário de funcionamento atualizado!');
    },
    onError: (error) => {
      console.error('Error updating horario:', error);
      toast.error('Erro ao atualizar horário');
    },
  });

  return {
    horario,
    isLoading,
    error,
    updateHorario,
  };
};
