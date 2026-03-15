import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ConfiguracaoPagamento {
  id: string;
  metodo: string;
  ativo: boolean;
}

export const useConfiguracaoPagamento = () => {
  const queryClient = useQueryClient();

  const { data: configuracoes = [], isLoading } = useQuery({
    queryKey: ['configuracao_pagamento'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracao_pagamento')
        .select('*');
      if (error) throw error;
      return data as ConfiguracaoPagamento[];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('configuracao_pagamento')
        .update({ ativo })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracao_pagamento'] });
    },
  });

  const isMetodoAtivo = (metodo: string) => {
    const config = configuracoes.find((c) => c.metodo === metodo);
    return config?.ativo ?? true;
  };

  return { configuracoes, isLoading, toggleMutation, isMetodoAtivo };
};
