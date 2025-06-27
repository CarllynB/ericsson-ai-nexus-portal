
-- Fix the foreign key constraint issue by creating users first
-- Insert the hardcoded super admin users into auth.users equivalent (public.users if needed)
-- Since we can't directly insert into auth.users, we'll modify the user_roles table approach

-- First, let's modify the user_roles table to not require existing users
-- We'll use email as the primary identifier instead of relying on auth.users

-- Update the existing user_roles table to make user_id nullable
-- and use email as the primary way to identify users
ALTER TABLE public.user_roles ALTER COLUMN user_id DROP NOT NULL;

-- Update the existing insert to not require specific user_ids
-- Remove the existing hardcoded entries first
DELETE FROM public.user_roles WHERE email IN ('muhammad.mahmood@ericsson.com', 'carllyn.barfi@ericsson.com');

-- Insert the hardcoded super admins with temporary UUIDs
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
