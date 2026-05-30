CREATE OR REPLACE FUNCTION public.check_duplicate_order()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.pedidos
    WHERE user_id = NEW.user_id
      AND total = NEW.total
      AND created_at > NOW() - INTERVAL '30 minutes'
      AND status <> 'cancelado'
  ) THEN
    RAISE EXCEPTION 'Pedido duplicado detectado. Aguarde 30 minutos para fazer outro pedido igual ou entre em contato pelo WhatsApp.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER prevent_duplicate_orders
  BEFORE INSERT ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.check_duplicate_order();