
-- First, let's check and update the RLS policies for user_roles table
-- We need to ensure admins can manage roles properly

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Super admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

-- Create more comprehensive policies
-- Super admins can do everything
CREATE POLICY "Super admins have full access to user roles"
  ON public.user_roles
  FOR ALL
  USING (
    public.get_user_role((SELECT email FROM auth.users WHERE id = auth.uid())) = 'super_admin'
  )
  WITH CHECK (
    public.get_user_role((SELECT email FROM auth.users WHERE id = auth.uid())) = 'super_admin'
  );

-- Regular admins can view and update (but not delete) user roles
CREATE POLICY "Admins can manage user roles"
  ON public.user_roles
  FOR ALL
  USING (
    public.get_user_role((SELECT email FROM auth.users WHERE id = auth.uid())) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    public.get_user_role((SELECT email FROM auth.users WHERE id = auth.uid())) IN ('admin', 'super_admin')
  );

-- Users can view their own role
CREATE POLICY "Users can view their own role"
  ON public.user_roles
  FOR SELECT
  USING (
    user_id = auth.uid() OR 
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Also ensure the agents table has proper RLS policies for admin access
-- Check if agents table has RLS enabled and add policies if needed
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can manage agents" ON public.agents;
DROP POLICY IF EXISTS "Everyone can view agents" ON public.agents;

-- Create policies for agents table
CREATE POLICY "Everyone can view agents"
  ON public.agents
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage agents"
  ON public.agents
  FOR ALL
  USING (
    public.get_user_role((SELECT email FROM auth.users WHERE id = auth.uid())) IN ('admin', 'super_admin')
  )
  WITH CHECK (
    public.get_user_role((SELECT email FROM auth.users WHERE id = auth.uid())) IN ('admin', 'super_admin')
  );
