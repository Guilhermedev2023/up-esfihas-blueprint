-- Create admin role assignment functions for secure admin management
-- These use SECURITY DEFINER with proper authorization checks

-- Function to assign admin role (only admins can call)
CREATE OR REPLACE FUNCTION public.assign_admin_role(target_user_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Only existing admins can grant admin role
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can grant admin role';
  END IF;
  
  -- Find user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email: %', target_user_email;
  END IF;
  
  -- Grant admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT DO NOTHING;
END;
$$;

-- Function to revoke admin role (only admins can call, cannot self-demote)
CREATE OR REPLACE FUNCTION public.revoke_admin_role(target_user_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Only existing admins can revoke admin role
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can revoke admin role';
  END IF;
  
  -- Find user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email: %', target_user_email;
  END IF;
  
  -- Don't allow self-demotion
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot revoke your own admin role';
  END IF;
  
  -- Revoke admin role
  DELETE FROM public.user_roles
  WHERE user_id = target_user_id AND role = 'admin';
END;
$$;