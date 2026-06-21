DROP POLICY IF EXISTS "Anyone can view active bairros" ON public.bairros;

CREATE POLICY "Public can view active bairros"
ON public.bairros FOR SELECT
TO anon, authenticated
USING (ativo = true);

CREATE POLICY "Admins can view all bairros"
ON public.bairros FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.bairros TO anon, authenticated;