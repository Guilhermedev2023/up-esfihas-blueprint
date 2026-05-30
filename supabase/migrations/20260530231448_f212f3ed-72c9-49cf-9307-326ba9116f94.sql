
-- Add goup tracking columns to pedidos
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS goup_delivery_id TEXT,
  ADD COLUMN IF NOT EXISTS goup_status TEXT,
  ADD COLUMN IF NOT EXISTS goup_last_error TEXT;

CREATE INDEX IF NOT EXISTS idx_pedidos_goup_delivery_id ON public.pedidos(goup_delivery_id);

-- Sync logs table
CREATE TABLE IF NOT EXISTS public.goup_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID,
  action TEXT NOT NULL,
  status TEXT,
  request_body JSONB,
  response_body JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.goup_sync_logs TO authenticated;
GRANT ALL ON public.goup_sync_logs TO service_role;

ALTER TABLE public.goup_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view goup sync logs"
ON public.goup_sync_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
