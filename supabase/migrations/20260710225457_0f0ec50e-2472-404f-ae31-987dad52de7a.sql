-- Public content: readable by anon + authenticated (RLS policies still apply)
GRANT SELECT ON public.produtos TO anon, authenticated;
GRANT SELECT ON public.banner_promocional TO anon, authenticated;
GRANT SELECT ON public.promocoes TO anon, authenticated;
GRANT SELECT ON public.horario_funcionamento TO anon, authenticated;
GRANT SELECT ON public.bairros TO anon, authenticated;
GRANT SELECT ON public.configuracao_pagamento TO anon, authenticated;
GRANT SELECT ON public.configuracao_restaurante TO anon, authenticated;
GRANT SELECT ON public.faixas_entrega TO anon, authenticated;
GRANT SELECT ON public.zonas_entrega TO anon, authenticated;

-- Admin writes go through authenticated role
GRANT INSERT, UPDATE, DELETE ON public.produtos TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.banner_promocional TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.promocoes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.horario_funcionamento TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.bairros TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.configuracao_pagamento TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.configuracao_restaurante TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.faixas_entrega TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.zonas_entrega TO authenticated;

-- User-scoped tables (auth only)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cupons_desconto TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT ON public.cache_distancias TO authenticated;
GRANT INSERT, UPDATE ON public.cache_distancias TO authenticated;

-- service_role full access for edge functions
GRANT ALL ON public.produtos, public.banner_promocional, public.promocoes,
             public.horario_funcionamento, public.bairros, public.configuracao_pagamento,
             public.configuracao_restaurante, public.faixas_entrega, public.zonas_entrega,
             public.profiles, public.pedidos, public.cupons_desconto, public.user_roles,
             public.cache_distancias, public.goup_sync_logs
TO service_role;