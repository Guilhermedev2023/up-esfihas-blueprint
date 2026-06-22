-- Ensure the app can access profiles through the Data API only for authenticated users.
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Keep RLS enabled and normalize profile policies to the real schema (user_id is the auth user id).
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Secure exact-phone availability check for signup. It returns only true/false, not profile data.
CREATE OR REPLACE FUNCTION public.telefone_disponivel(_telefone text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE telefone = NULLIF(BTRIM(_telefone), '')
  );
$$;

REVOKE ALL ON FUNCTION public.telefone_disponivel(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.telefone_disponivel(text) TO anon;
GRANT EXECUTE ON FUNCTION public.telefone_disponivel(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.telefone_disponivel(text) TO service_role;

-- Rebuild the signup trigger function to match the current profiles schema.
-- Do not swallow insert errors here: if required profile data is invalid, signup must fail atomically.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _telefone text;
BEGIN
  _telefone := NULLIF(BTRIM(COALESCE(NEW.raw_user_meta_data->>'telefone', '')), '');

  INSERT INTO public.profiles (user_id, nome, email, telefone, endereco, bairro)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(BTRIM(NEW.raw_user_meta_data->>'nome'), ''), NEW.email, ''),
    COALESCE(NEW.email, ''),
    _telefone,
    NULLIF(BTRIM(COALESCE(NEW.raw_user_meta_data->>'endereco', '')), ''),
    NULLIF(BTRIM(COALESCE(NEW.raw_user_meta_data->>'bairro', '')), '')
  );

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RAISE LOG 'handle_new_user failed for user %, duplicate profile field: %', NEW.id, SQLERRM;
    RAISE EXCEPTION 'Não foi possível criar o perfil: telefone já cadastrado.';
  WHEN OTHERS THEN
    RAISE LOG 'handle_new_user failed for user %: %', NEW.id, SQLERRM;
    RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;