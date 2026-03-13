CREATE OR REPLACE FUNCTION public.validate_pedido_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status NOT IN ('pendente', 'aceito', 'preparo', 'saiu_entrega', 'finalizado', 'cancelado', 'aguardando_pagamento') THEN
    RAISE EXCEPTION 'Status inválido: %. Permitidos: pendente, aceito, preparo, saiu_entrega, finalizado, cancelado, aguardando_pagamento', NEW.status;
  END IF;
  RETURN NEW;
END;
$function$;