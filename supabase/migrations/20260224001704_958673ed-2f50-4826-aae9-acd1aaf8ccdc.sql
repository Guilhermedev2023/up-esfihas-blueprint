
-- Add per-day schedule and manual override to horario_funcionamento
ALTER TABLE public.horario_funcionamento 
ADD COLUMN IF NOT EXISTS dias_abertos jsonb NOT NULL DEFAULT '{"seg": true, "ter": true, "qua": true, "qui": true, "sex": true, "sab": true, "dom": true}'::jsonb;

ALTER TABLE public.horario_funcionamento 
ADD COLUMN IF NOT EXISTS override_manual text DEFAULT NULL;
-- override_manual: null = sem override, 'aberto' = forçar aberto, 'fechado' = forçar fechado
