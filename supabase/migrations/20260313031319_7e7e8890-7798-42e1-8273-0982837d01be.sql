
CREATE OR REPLACE FUNCTION public.proximo_numero_pedido()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(MAX(numero), 0) + 1 FROM public.pedidos
$$;
