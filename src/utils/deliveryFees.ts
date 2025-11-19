export const DELIVERY_FEES: Record<string, number> = {
  'Cachoeira': 5,
  'Ponta das Canas': 7,
  'Ingleses': 10,
  'Canasvieiras': 7,
  'Jurerê': 12,
  'Jurerê Internacional': 15,
  'Vargem Grande': 8
};

export const getDeliveryFee = (bairro: string): number | null => {
  return DELIVERY_FEES[bairro] || null;
};
