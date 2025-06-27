
-- Create an enum for the different roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'viewer');

-- Create the user_roles table to store role assignments
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on the user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to check roles without RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_email TEXT)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE email = user_email ORDER BY updated_at DESC LIMIT 1),
    'viewer'::app_role
  );
$$;

-- Create policies for the user_roles table
CREATE POLICY "Super admins can manage all user roles"
  ON public.user_roles
  FOR ALL
  USING (
    public.get_user_role((SELECT email FROM auth.users WHERE id = auth.uid())) = 'super_admin'
  )
  WITH CHECK (
    public.get_user_role((SELECT email FROM auth.users WHERE id = auth.uid())) = 'super_admin'
  );

CREATE POLICY "Users can view their own role"
  ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid());

-- Modify the table to allow nullable user_id temporarily for pre-signup role assignments
ALTER TABLE public.user_roles ALTER COLUMN user_id DROP NOT NULL;

-- Insert the hardcoded super admins with placeholder UUIDs
-- These will be updated when users actually sign up
INSERT INTO public.user_roles (user_id, email, role) 
VALUES 
  (gen_random_uuid(), 'muhammad.mahmood@ericsson.com', 'super_admin'),
  (gen_random_uuid(), 'carllyn.barfi@ericsson.com', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Create a function to handle user role assignment when users actually sign up
CREATE OR REPLACE FUNCTION public.handle_user_role_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this user should have a predefined role
  UPDATE public.user_roles 
  SET user_id = NEW.id 
  WHERE email = NEW.email AND user_id IS NULL;
  
  -- If no predefined role exists, create a default viewer role
  IF NOT FOUND THEN
    INSERT INTO public.user_roles (user_id, email, role)
    VALUES (NEW.id, NEW.email, 'viewer');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically assign roles when users sign up
DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_role_on_signup();

-- Create trigger to update the updated_at column
CREATE OR REPLACE FUNCTION public.update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_roles_updated_at();
