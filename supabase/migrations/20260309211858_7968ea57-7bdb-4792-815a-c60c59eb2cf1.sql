
-- Create a SECURITY DEFINER function to count orders by phone (bypasses RLS)
CREATE OR REPLACE FUNCTION public.contar_pedidos_por_telefone(_telefone text)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(COUNT(*)::integer, 0)
  FROM public.pedidos
  WHERE telefone = _telefone
$$;
