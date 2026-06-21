
-- 1. cache_distancias: remove anonymous insert/upsert policy
DROP POLICY IF EXISTS "Qualquer um pode inserir cache" ON public.cache_distancias;
DROP POLICY IF EXISTS "Qualquer um pode atualizar cache" ON public.cache_distancias;

-- 2. pedidos: restrict INSERT to authenticated users only
DROP POLICY IF EXISTS "Usuários podem criar seus próprios pedidos" ON public.pedidos;
CREATE POLICY "Usuários podem criar seus próprios pedidos"
  ON public.pedidos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Also tighten SELECT to authenticated only
DROP POLICY IF EXISTS "Usuários podem ver seus próprios pedidos" ON public.pedidos;
CREATE POLICY "Usuários podem ver seus próprios pedidos"
  ON public.pedidos
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. cupons_desconto: ensure only admins can INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Admins gerenciam cupons" ON public.cupons_desconto;
CREATE POLICY "Admins gerenciam cupons"
  ON public.cupons_desconto
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. storage: restrict listing on product-images bucket to admins only.
-- Files are still publicly viewable via the /public/ CDN URL because the
-- bucket is public; this only restricts the storage.objects metadata listing.
DROP POLICY IF EXISTS "Public product images access" ON storage.objects;
CREATE POLICY "Public product images access"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'::app_role));

-- 5. Revoke execute on SECURITY DEFINER functions from anon and authenticated.
-- Re-grant only the ones that need to be callable by clients.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.proximo_numero_pedido() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.assign_admin_role(text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.revoke_admin_role(text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.usar_cupom(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.contar_pedidos_por_telefone(text) FROM anon, authenticated, public;

-- has_role must remain callable for the useAdmin hook (RPC)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
-- Authenticated users need to redeem coupons and check phone history
GRANT EXECUTE ON FUNCTION public.usar_cupom(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.contar_pedidos_por_telefone(text) TO authenticated;
-- Admin management functions are admin-only; gated inside the function body
GRANT EXECUTE ON FUNCTION public.assign_admin_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_admin_role(text) TO authenticated;
