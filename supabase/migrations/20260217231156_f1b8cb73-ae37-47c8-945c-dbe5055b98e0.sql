
-- Table for promotional banner configuration
CREATE TABLE public.banner_promocional (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ativo boolean NOT NULL DEFAULT false,
  imagem_url text,
  produto_id uuid REFERENCES public.produtos(id) ON DELETE SET NULL,
  valor_promocional numeric,
  titulo text DEFAULT 'Promoção',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.banner_promocional ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Banner visível para todos" ON public.banner_promocional
  FOR SELECT USING (true);

CREATE POLICY "Apenas admins podem modificar banner" ON public.banner_promocional
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_banner_promocional_updated_at
  BEFORE UPDATE ON public.banner_promocional
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default row
INSERT INTO public.banner_promocional (ativo, titulo) VALUES (false, 'Promoção Especial');
