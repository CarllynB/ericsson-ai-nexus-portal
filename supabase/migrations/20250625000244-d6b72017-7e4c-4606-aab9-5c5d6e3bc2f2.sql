
-- First, let's drop the problematic policies that are causing the permission errors
DROP POLICY IF EXISTS "Super admins have full access to user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

-- Create a simple function to get current user role without accessing auth.users
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = auth.uid() ORDER BY assigned_at DESC LIMIT 1),
    'viewer'::app_role
  );
$$;

-- Create a function to check if current user has admin privileges
CREATE OR REPLACE FUNCTION public.is_admin_or_super()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  );
$$;

-- Create new, simpler policies
CREATE POLICY "Anyone can view user roles"
  ON public.user_roles
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert user roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (public.is_admin_or_super());

CREATE POLICY "Admins can update user roles"
  ON public.user_roles
  FOR UPDATE
  USING (public.is_admin_or_super());

CREATE POLICY "Admins can delete user roles"
  ON public.user_roles
  FOR DELETE
  USING (public.is_admin_or_super());
