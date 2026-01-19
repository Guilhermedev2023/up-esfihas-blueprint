-- Tabela de configuração do restaurante (localização fixa)
CREATE TABLE public.configuracao_restaurante (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endereco TEXT NOT NULL DEFAULT 'Rua Ovídio Zierke, 168',
  cep TEXT NOT NULL DEFAULT '88056-560',
  cidade TEXT NOT NULL DEFAULT 'Florianópolis',
  estado TEXT NOT NULL DEFAULT 'SC',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de faixas de distância para taxa de entrega
CREATE TABLE public.faixas_entrega (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  distancia_min_km DOUBLE PRECISION NOT NULL DEFAULT 0,
  distancia_max_km DOUBLE PRECISION NOT NULL,
  taxa_entrega DECIMAL(10,2) NOT NULL,
  tempo_estimado_min INTEGER NOT NULL DEFAULT 30,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT faixas_distancia_positiva CHECK (distancia_max_km > distancia_min_km),
  CONSTRAINT faixas_taxa_positiva CHECK (taxa_entrega >= 0),
  CONSTRAINT faixas_tempo_positivo CHECK (tempo_estimado_min > 0)
);

-- Tabela de zonas de entrega (polígonos)
CREATE TABLE public.zonas_entrega (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL DEFAULT 'Zona Principal',
  poligono JSONB NOT NULL DEFAULT '[]'::jsonb,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Cache de distâncias calculadas para economia de API
CREATE TABLE public.cache_distancias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endereco_destino TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  distancia_km DOUBLE PRECISION NOT NULL,
  duracao_segundos INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days')
);

-- Índices para performance
CREATE INDEX idx_cache_distancias_endereco ON public.cache_distancias(endereco_destino);
CREATE INDEX idx_cache_distancias_expires ON public.cache_distancias(expires_at);
CREATE INDEX idx_faixas_entrega_ativo ON public.faixas_entrega(ativo);

-- Enable RLS
ALTER TABLE public.configuracao_restaurante ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faixas_entrega ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zonas_entrega ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache_distancias ENABLE ROW LEVEL SECURITY;

-- Políticas para configuracao_restaurante (apenas admins podem modificar, todos podem ler)
CREATE POLICY "Configuração visível para todos"
  ON public.configuracao_restaurante
  FOR SELECT
  USING (true);

CREATE POLICY "Apenas admins podem modificar configuração"
  ON public.configuracao_restaurante
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para faixas_entrega
CREATE POLICY "Faixas visíveis para todos"
  ON public.faixas_entrega
  FOR SELECT
  USING (true);

CREATE POLICY "Apenas admins podem modificar faixas"
  ON public.faixas_entrega
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para zonas_entrega
CREATE POLICY "Zonas visíveis para todos"
  ON public.zonas_entrega
  FOR SELECT
  USING (true);

CREATE POLICY "Apenas admins podem modificar zonas"
  ON public.zonas_entrega
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para cache_distancias (público, pois é apenas cache)
CREATE POLICY "Cache visível para todos"
  ON public.cache_distancias
  FOR SELECT
  USING (true);

CREATE POLICY "Qualquer um pode inserir cache"
  ON public.cache_distancias
  FOR INSERT
  WITH CHECK (true);

-- Triggers para updated_at
CREATE TRIGGER update_configuracao_restaurante_updated_at
  BEFORE UPDATE ON public.configuracao_restaurante
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faixas_entrega_updated_at
  BEFORE UPDATE ON public.faixas_entrega
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_zonas_entrega_updated_at
  BEFORE UPDATE ON public.zonas_entrega
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir configuração inicial do restaurante
INSERT INTO public.configuracao_restaurante (endereco, cep, cidade, estado, latitude, longitude)
VALUES ('Rua Ovídio Zierke, 168', '88056-560', 'Florianópolis', 'SC', -27.4262, -48.4831);

-- Inserir faixas de entrega iniciais (exemplo baseado na especificação)
INSERT INTO public.faixas_entrega (distancia_min_km, distancia_max_km, taxa_entrega, tempo_estimado_min) VALUES
  (0.0, 1.0, 4.00, 15),
  (1.0, 2.0, 6.00, 25),
  (2.0, 3.0, 8.00, 35),
  (3.0, 4.0, 14.00, 45);

-- Inserir zona de entrega padrão (será configurada pelo admin no mapa)
INSERT INTO public.zonas_entrega (nome, poligono, ativo)
VALUES ('Área de Entrega Principal', '[]'::jsonb, true);