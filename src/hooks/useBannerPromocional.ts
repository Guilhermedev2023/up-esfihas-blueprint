import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BannerPromocional {
  id: string;
  ativo: boolean;
  imagem_url: string | null;
  produto_id: string | null;
  valor_promocional: number | null;
  titulo: string | null;
  created_at: string;
  updated_at: string;
}

export const useBannerPromocional = () => {
  return useQuery({
    queryKey: ['banner-promocional'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banner_promocional' as any)
        .select('*')
        .limit(1)
        .single();
      if (error) throw error;
      return data as unknown as BannerPromocional;
    },
  });
};

export const useUpdateBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<BannerPromocional> & { id: string }) => {
      const { id, ...rest } = updates;
      const { data, error } = await supabase
        .from('banner_promocional' as any)
        .update(rest as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banner-promocional'] });
    },
  });
};
