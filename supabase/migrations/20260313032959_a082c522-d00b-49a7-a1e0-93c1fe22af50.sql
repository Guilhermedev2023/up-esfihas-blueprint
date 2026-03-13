-- Fix 1: Storage policies - restrict to admin only
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images' 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images' 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Fix 2: Coupon UPDATE policy - create secure RPC instead
DROP POLICY IF EXISTS "Users can use own coupons" ON public.cupons_desconto;

-- Create a secure RPC that only marks coupon as used
CREATE OR REPLACE FUNCTION public.usar_cupom(_cupom_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _telefone_usuario text;
  _updated boolean;
BEGIN
  -- Get user's phone
  SELECT telefone INTO _telefone_usuario
  FROM public.profiles
  WHERE user_id = auth.uid();

  IF _telefone_usuario IS NULL THEN
    RAISE EXCEPTION 'Perfil não encontrado';
  END IF;

  -- Only mark as used, only if it belongs to the user and is not already used
  UPDATE public.cupons_desconto
  SET usado = true
  WHERE id = _cupom_id
    AND telefone = _telefone_usuario
    AND usado = false
    AND (expires_at IS NULL OR expires_at > now());

  GET DIAGNOSTICS _updated = ROW_COUNT;
  RETURN _updated > 0;
END;
$$;