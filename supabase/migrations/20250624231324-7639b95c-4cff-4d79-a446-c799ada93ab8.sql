
-- Create a table to store dashboard settings
CREATE TABLE public.dashboard_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  dashboard_url TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert a default row
INSERT INTO public.dashboard_settings (id) VALUES (1);

-- Enable RLS on the table
ALTER TABLE public.dashboard_settings ENABLE ROW LEVEL SECURITY;

-- Create policies - only authenticated users can read, only super admins can update
CREATE POLICY "Anyone can view dashboard settings" 
  ON public.dashboard_settings 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can update dashboard settings" 
  ON public.dashboard_settings 
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Add trigger to update the updated_at timestamp
CREATE TRIGGER update_dashboard_settings_updated_at
  BEFORE UPDATE ON public.dashboard_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
