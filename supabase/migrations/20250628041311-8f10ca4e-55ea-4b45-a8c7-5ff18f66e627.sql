
-- Create sidebar_items table
CREATE TABLE public.sidebar_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Add RLS policies
ALTER TABLE public.sidebar_items ENABLE ROW LEVEL SECURITY;

-- Everyone can read sidebar items
CREATE POLICY "Anyone can view sidebar items" 
  ON public.sidebar_items 
  FOR SELECT 
  USING (true);

-- Only admins and super_admins can insert sidebar items
CREATE POLICY "Admins can create sidebar items" 
  ON public.sidebar_items 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Only admins and super_admins can update sidebar items
CREATE POLICY "Admins can update sidebar items" 
  ON public.sidebar_items 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Only admins and super_admins can delete non-default sidebar items
CREATE POLICY "Admins can delete non-default sidebar items" 
  ON public.sidebar_items 
  FOR DELETE 
  USING (
    is_default = false AND
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Insert default sidebar items
INSERT INTO public.sidebar_items (title, url, "order", is_default) VALUES
  ('Home', '/', 1, true),
  ('Agents', '/agents', 2, true),
  ('Dashboard', '/dashboard', 3, true),
  ('Pitch Box', 'https://apps.powerapps.com/play/e/default-92e84ceb-fbfd-47ab-be52-080c6b87953f/a/549a8af5-f6ba-4b8b-824c-dfdfcf6f3740?tenantId=92e84ceb-fbfd-47ab-be52-080c6b87953f&hint=ec5023c9-376e-41fb-9280-10bd9f925919&source=sharebutton&sourcetime=1750260233474', 4, true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sidebar_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sidebar_items_updated_at
  BEFORE UPDATE ON public.sidebar_items
  FOR EACH ROW
  EXECUTE FUNCTION update_sidebar_items_updated_at();
