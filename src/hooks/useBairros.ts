import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Bairro {
  id: string;
  nome: string;
  taxa_entrega: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const useBairros = (showInactive = false) => {
  return useQuery({
    queryKey: ['bairros', showInactive],
    queryFn: async () => {
      let query = supabase
        .from('bairros')
        .select('*')
        .order('nome', { ascending: true });

      if (!showInactive) {
        query = query.eq('ativo', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Bairro[];
    },
  });
};

export const useUpdateBairro = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bairro: Partial<Bairro> & { id: string }) => {
      const { id, ...updates } = bairro;
      const { data, error } = await supabase
        .from('bairros')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bairros'] });
    },
  });
};

export const useCreateBairro = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bairro: Omit<Bairro, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('bairros')
        .insert(bairro)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bairros'] });
    },
  });
};

export const useDeleteBairro = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bairros')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bairros'] });
    },
  });
};
