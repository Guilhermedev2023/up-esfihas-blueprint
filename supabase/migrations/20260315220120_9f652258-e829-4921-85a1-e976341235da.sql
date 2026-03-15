CREATE TABLE public.configuracao_pagamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metodo text NOT NULL UNIQUE,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.configuracao_pagamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gerenciam pagamentos" ON public.configuracao_pagamento
  FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Configuração pagamento visível para todos" ON public.configuracao_pagamento
  FOR SELECT TO public
  USING (true);

INSERT INTO public.configuracao_pagamento (metodo, ativo) VALUES
  ('pagamento_online', true),
  ('na_entrega', true);

CREATE TRIGGER update_configuracao_pagamento_updated_at
  BEFORE UPDATE ON public.configuracao_pagamento
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();