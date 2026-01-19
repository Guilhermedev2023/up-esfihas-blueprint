import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ConfiguracaoRestaurante {
  id: string;
  endereco: string;
  cep: string;
  cidade: string;
  estado: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface FaixaEntrega {
  id: string;
  distancia_min_km: number;
  distancia_max_km: number;
  taxa_entrega: number;
  tempo_estimado_min: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ZonaEntrega {
  id: string;
  nome: string;
  poligono: Array<{ lat: number; lng: number }>;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeliveryCalculation {
  success: boolean;
  distanceKm?: number;
  durationSeconds?: number;
  estimatedMinutes?: number;
  deliveryFee?: number;
  withinZone?: boolean;
  error?: string;
}

// Hook for restaurant configuration
export const useConfiguracaoRestaurante = () => {
  return useQuery({
    queryKey: ['configuracao-restaurante'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracao_restaurante')
        .select('*')
        .single();

      if (error) throw error;
      return data as ConfiguracaoRestaurante;
    },
  });
};

export const useUpdateConfiguracaoRestaurante = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Partial<ConfiguracaoRestaurante> & { id: string }) => {
      const { id, ...updates } = config;
      const { data, error } = await supabase
        .from('configuracao_restaurante')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracao-restaurante'] });
    },
  });
};

// Hook for delivery fee tiers
export const useFaixasEntrega = (showInactive = false) => {
  return useQuery({
    queryKey: ['faixas-entrega', showInactive],
    queryFn: async () => {
      let query = supabase
        .from('faixas_entrega')
        .select('*')
        .order('distancia_min_km', { ascending: true });

      if (!showInactive) {
        query = query.eq('ativo', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as FaixaEntrega[];
    },
  });
};

export const useCreateFaixaEntrega = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (faixa: Omit<FaixaEntrega, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('faixas_entrega')
        .insert(faixa)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faixas-entrega'] });
    },
  });
};

export const useUpdateFaixaEntrega = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (faixa: Partial<FaixaEntrega> & { id: string }) => {
      const { id, ...updates } = faixa;
      const { data, error } = await supabase
        .from('faixas_entrega')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faixas-entrega'] });
    },
  });
};

export const useDeleteFaixaEntrega = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('faixas_entrega')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faixas-entrega'] });
    },
  });
};

// Hook for delivery zones
export const useZonasEntrega = () => {
  return useQuery({
    queryKey: ['zonas-entrega'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('zonas_entrega')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      return data as ZonaEntrega[];
    },
  });
};

export const useUpdateZonaEntrega = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (zona: Partial<ZonaEntrega> & { id: string }) => {
      const { id, ...updates } = zona;
      const { data, error } = await supabase
        .from('zonas_entrega')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zonas-entrega'] });
    },
  });
};

// Calculate delivery fee function
export const calculateDeliveryFee = async (address: string): Promise<DeliveryCalculation> => {
  try {
    const { data, error } = await supabase.functions.invoke('calculate-delivery', {
      body: { address },
    });

    if (error) throw error;
    return data as DeliveryCalculation;
  } catch (error) {
    console.error('Error calculating delivery:', error);
    return {
      success: false,
      error: 'Erro ao calcular taxa de entrega. Tente novamente.',
    };
  }
};

// Geocode address function
export const geocodeAddress = async (address: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('geocode-address', {
      body: { address },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return {
      success: false,
      error: 'Erro ao buscar endereço.',
    };
  }
};
