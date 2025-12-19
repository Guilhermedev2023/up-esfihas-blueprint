import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  imagem: string | null;
  categoria: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const useProdutos = (showInactive = false) => {
  return useQuery({
    queryKey: ['produtos', showInactive],
    queryFn: async () => {
      let query = supabase
        .from('produtos')
        .select('*')
        .order('categoria', { ascending: true })
        .order('nome', { ascending: true });

      if (!showInactive) {
        query = query.eq('ativo', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Produto[];
    },
  });
};

export const useUpdateProduto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (produto: Partial<Produto> & { id: string }) => {
      const { id, ...updates } = produto;
      const { data, error } = await supabase
        .from('produtos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
    },
  });
};

export const useCreateProduto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (produto: Omit<Produto, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('produtos')
        .insert(produto)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
    },
  });
};

export const useDeleteProduto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
    },
  });
};
