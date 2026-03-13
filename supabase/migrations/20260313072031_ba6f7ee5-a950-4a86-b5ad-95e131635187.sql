
-- Drop old check constraint
ALTER TABLE public.pedidos DROP CONSTRAINT pedidos_status_check;

-- Standardize existing statuses
UPDATE public.pedidos SET status = 'finalizado' WHERE status IN ('entregue', 'concluido');
UPDATE public.pedidos SET status = 'preparo' WHERE status = 'em_preparo';
UPDATE public.pedidos SET status = 'aceito' WHERE status = 'confirmado';
UPDATE public.pedidos SET status = 'pendente' WHERE status IN ('pago', 'aguardando_pagamento', 'preparando');

-- Create validation trigger
CREATE OR REPLACE FUNCTION public.validate_pedido_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('pendente', 'aceito', 'preparo', 'saiu_entrega', 'finalizado', 'cancelado') THEN
    RAISE EXCEPTION 'Status inválido: %. Permitidos: pendente, aceito, preparo, saiu_entrega, finalizado, cancelado', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_pedido_status
  BEFORE INSERT OR UPDATE ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_pedido_status();
