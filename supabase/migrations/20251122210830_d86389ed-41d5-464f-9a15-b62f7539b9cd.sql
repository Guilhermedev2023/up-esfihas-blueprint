-- Criar tabela de pedidos
CREATE TABLE IF NOT EXISTS public.pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  telefone TEXT NOT NULL,
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  taxa_entrega DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  endereco JSONB NOT NULL,
  metodo_pagamento TEXT NOT NULL,
  troco DECIMAL(10,2),
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'preparando', 'entregue', 'cancelado')),
  infinitepay_order_nsu TEXT,
  infinitepay_transaction_nsu TEXT,
  infinitepay_receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Usuários podem ver seus próprios pedidos"
  ON public.pedidos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios pedidos"
  ON public.pedidos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pedidos_updated_at
  BEFORE UPDATE ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Criar sequência para número do pedido
CREATE SEQUENCE IF NOT EXISTS pedido_numero_seq START WITH 1000;