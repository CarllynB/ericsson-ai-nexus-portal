
-- Create the agents table
CREATE TABLE public.agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  key_features TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'coming_soon')),
  access_link TEXT,
  owner TEXT NOT NULL,
  category TEXT NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default agents data
INSERT INTO public.agents (id, name, description, category, status, key_features, access_link, owner, last_updated, created_at) VALUES
('devmate', 'DevMate', 'Accelerate the delivery of upgrades and patches on Ericsson-developed tools and systems.', 'Dev Tools', 'active', ARRAY['VS Code extension for efficient patch releases', 'Automated upgrade workflows', 'License management integration', 'Usage analytics'], null, 'system', now(), now()),
('smart-error-detect', 'Smart Error Detect', 'Use GenAI to resolve CNIS issues reported in JIRA', 'CNIS OPS', 'active', ARRAY['Suggest possible solutions on CNIS issues', 'Leverages past Jira ticket knowledge base', 'Improves error detection accuracy', 'Speeds resolution time'], 'https://sed-csstip.msts.ericsson.net/', 'system', now(), now()),
('5gc-fa', '5GC FA Agent', 'Use GenAI to perform 5GC fault analysis from network PCAP logs', 'Fault Analysis', 'active', ARRAY['PCAP log processing', '5G Core fault detection', 'Performance analysis', 'Predictive insights'], 'https://5gcfa-csstip.msts.ericsson.net/login.html', 'system', now(), now()),
('mop', 'MoP Agent', 'Use GenAI to create base MoPs for delivery teams', 'Documentation', 'active', ARRAY['Automated MoP generation', 'Best practice integration', 'Template customization', 'Quality assurance'], 'https://mop.cram066.rnd.gic.ericsson.se/mop-gui/mop-agent', 'system', now(), now()),
('palle', 'PALLE', 'Use GenAI to provide lessons learned from all projects', 'Learning', 'coming_soon', ARRAY['Project knowledge extraction', 'Lessons learned database', 'Best practice recommendations', 'Historical insights'], null, 'system', now(), now()),
('ml4sec', 'ML4SEC', 'Use GenAI to execute SRM (Security Reliability Model)', 'Security', 'coming_soon', ARRAY['Security reliability modeling', 'Risk assessment automation', 'Compliance monitoring', 'Threat analysis'], null, 'system', now(), now()),
('henka', 'Henka', 'GenAI based utility to improve Change Request (CR) - Henka', 'Change Management', 'coming_soon', ARRAY['Change request optimization', 'Impact analysis', 'Automated workflows', 'Risk mitigation'], null, 'system', now(), now()),
('swift', 'SWIFT', 'GenAI based chatbot for end-use issue resolution (STWFT)', 'Support', 'coming_soon', ARRAY['End-user issue resolution', 'Automated troubleshooting', 'Knowledge base integration', 'Real-time support'], null, 'system', now(), now()),
('nexus', 'Nexus', 'GenAI based handover from Project to Delivery (CNS)', 'Project Management', 'coming_soon', ARRAY['Project handover automation', 'Documentation generation', 'Knowledge transfer', 'Delivery optimization'], null, 'system', now(), now()),
('stlc', 'STLC', 'Use GenAI to create full software test life cycle', 'Testing', 'coming_soon', ARRAY['Test case generation', 'Automated test planning', 'Coverage analysis', 'Quality assurance'], null, 'system', now(), now());

-- Enable Row Level Security (make it public for now since no auth requirements specified)
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access to agents" 
ON public.agents 
FOR SELECT 
USING (true);

-- Create policy to allow authenticated users to modify (if needed later)
CREATE POLICY "Allow authenticated users to modify agents" 
ON public.agents 
FOR ALL 
USING (true)
WITH CHECK (true);
