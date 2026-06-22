
-- Fix 1: Restrict Realtime channel subscriptions (defense-in-depth for broadcast/presence).
-- postgres_changes still respects RLS on the source `pedidos` table.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users own topic" ON realtime.messages;
CREATE POLICY "Authenticated users own topic"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (realtime.topic() LIKE 'pedidos-user-' || auth.uid()::text || '%')
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Authenticated users own topic insert" ON realtime.messages;
CREATE POLICY "Authenticated users own topic insert"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  (realtime.topic() LIKE 'pedidos-user-' || auth.uid()::text || '%')
  OR public.has_role(auth.uid(), 'admin')
);

-- Fix 2: Drop the broad public SELECT policy on storage.objects for product-images.
-- Public bucket files remain reachable via their public URL; only `.list()` is removed.
DROP POLICY IF EXISTS "Public product images access" ON storage.objects;

CREATE POLICY "Admins can list product images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
