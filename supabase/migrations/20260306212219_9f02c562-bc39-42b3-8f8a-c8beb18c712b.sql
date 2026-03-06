
-- Coupons table for 2nd order coupons
CREATE TABLE IF NOT EXISTS public.cupons_desconto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  telefone TEXT NOT NULL,
  desconto_porcentagem NUMERIC NOT NULL,
  usado BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cupons_desconto ENABLE ROW LEVEL SECURITY;

-- Users can see coupons linked to their phone
CREATE POLICY "Users can view own coupons" ON public.cupons_desconto
  FOR SELECT TO authenticated
  USING (
    telefone IN (SELECT telefone FROM public.profiles WHERE user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Admins can manage coupons
CREATE POLICY "Admins gerenciam cupons" ON public.cupons_desconto
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can mark their own coupons as used
CREATE POLICY "Users can use own coupons" ON public.cupons_desconto
  FOR UPDATE TO authenticated
  USING (telefone IN (SELECT telefone FROM public.profiles WHERE user_id = auth.uid()));
