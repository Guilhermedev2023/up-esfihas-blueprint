-- Create table for store hours configuration
CREATE TABLE public.horario_funcionamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hora_abertura TIME NOT NULL DEFAULT '18:00',
  hora_fechamento TIME NOT NULL DEFAULT '23:59',
  dias_semana TEXT NOT NULL DEFAULT 'Seg a Dom',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.horario_funcionamento ENABLE ROW LEVEL SECURITY;

-- Anyone can view the store hours
CREATE POLICY "Anyone can view store hours"
ON public.horario_funcionamento
FOR SELECT
USING (true);

-- Only admins can update store hours
CREATE POLICY "Admins can update store hours"
ON public.horario_funcionamento
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert store hours
CREATE POLICY "Admins can insert store hours"
ON public.horario_funcionamento
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete store hours
CREATE POLICY "Admins can delete store hours"
ON public.horario_funcionamento
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_horario_funcionamento_updated_at
BEFORE UPDATE ON public.horario_funcionamento
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default hours
INSERT INTO public.horario_funcionamento (hora_abertura, hora_fechamento, dias_semana)
VALUES ('18:00', '23:59', 'Seg a Dom');