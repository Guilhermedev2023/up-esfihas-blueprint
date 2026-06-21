-- 1. cache_distancias: remove public read
DROP POLICY IF EXISTS "Cache visível para todos" ON public.cache_distancias;
CREATE POLICY "Admins podem ver cache"
ON public.cache_distancias FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. storage product-images: allow public reads via API too
DROP POLICY IF EXISTS "Public product images access" ON storage.objects;
CREATE POLICY "Public product images access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- 3. handle_new_user is only used by an auth trigger; revoke direct exec
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;