-- Create promocoes table
CREATE TABLE public.promocoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL UNIQUE,
  ativo boolean NOT NULL DEFAULT false,
  desconto_porcentagem numeric,
  desconto_valor numeric,
  tipo_desconto text NOT NULL DEFAULT 'porcentagem',
  valor_minimo_pedido numeric,
  dias_semana jsonb DEFAULT '{}'::jsonb,
  validade_dias integer,
  aplicar_delivery boolean NOT NULL DEFAULT true,
  aplicar_retirada boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promocoes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Promocoes visiveis para todos" ON public.promocoes FOR SELECT USING (true);
CREATE POLICY "Admins gerenciam promocoes" ON public.promocoes FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default rows
INSERT INTO public.promocoes (tipo, ativo, desconto_porcentagem, tipo_desconto) VALUES
  ('primeiro_pedido', false, 10, 'porcentagem'),
  ('segundo_pedido', false, 10, 'porcentagem'),
  ('valor_minimo', false, 10, 'porcentagem'),
  ('dia_semana', false, 15, 'porcentagem'),
  ('frete_gratis', false, null, 'porcentagem');

-- Update trigger
CREATE TRIGGER update_promocoes_updated_at BEFORE UPDATE ON public.promocoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.promocoes;