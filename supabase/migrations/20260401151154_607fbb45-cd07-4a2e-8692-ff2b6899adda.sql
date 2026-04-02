
-- Create a function to set up the first admin
-- Only works if no admin exists yet
CREATE OR REPLACE FUNCTION public.setup_first_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if any admin already exists
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RETURN FALSE;
  END IF;

  -- Update the user's role to admin
  UPDATE public.user_roles SET role = 'admin' WHERE user_id = _user_id;
  
  -- Update their profile
  UPDATE public.profiles SET department = 'Administration' WHERE id = _user_id;
  
  RETURN TRUE;
END;
$$;
