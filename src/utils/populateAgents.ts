
import { offlineApiService } from '@/services/offlineApi';

const sampleAgents = [
  {
    id: '1',
    name: 'Smart Analytics Assistant',
    description: 'An intelligent analytics agent that helps analyze data patterns and generate insights for business decision making.',
    category: 'Analytics',
    owner: 'Data Science Team',
    status: 'active' as const,
    key_features: ['Data Analysis', 'Pattern Recognition', 'Report Generation'],
    access_link: 'https://analytics.example.com',
    contact_info: null,
    created_at: new Date().toISOString(),
    last_updated: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Customer Support Bot',
    description: 'AI-powered customer support agent that handles common queries and escalates complex issues to human agents.',
    category: 'Customer Service',
    owner: 'Support Team',
    status: 'active' as const,
    key_features: ['24/7 Availability', 'Multi-language Support', 'Ticket Management'],
    access_link: null,
    contact_info: {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@company.com'
    },
    created_at: new Date().toISOString(),
    last_updated: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Content Generator',
    description: 'Creative AI agent specialized in generating marketing content, blog posts, and social media content.',
    category: 'Content Creation',
    owner: 'Marketing Team',
    status: 'active' as const,
    key_features: ['Content Writing', 'SEO Optimization', 'Brand Voice Consistency'],
    access_link: 'https://content.example.com',
    contact_info: null,
    created_at: new Date().toISOString(),
    last_updated: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Code Review Assistant',
    description: 'Development agent that assists with code review, bug detection, and code quality improvements.',
    category: 'Development',
    owner: 'Engineering Team',
    status: 'coming_soon' as const,
    key_features: ['Code Analysis', 'Bug Detection', 'Performance Optimization'],
    access_link: null,
    contact_info: {
      name: 'Mike Chen',
      email: 'mike.chen@company.com'
    },
    created_at: new Date().toISOString(),
    last_updated: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Financial Forecasting Agent',
    description: 'Specialized agent for financial analysis, forecasting, and budget planning with advanced predictive models.',
    category: 'Finance',
    owner: 'Finance Team',
    status: 'active' as const,
    key_features: ['Predictive Modeling', 'Risk Assessment', 'Budget Analysis'],
    access_link: 'https://finance.example.com',
    contact_info: null,
    created_at: new Date().toISOString(),
    last_updated: new Date().toISOString()
  },
  {
    id: '6',
    name: 'HR Recruitment Assistant',
    description: 'Human resources agent that helps with candidate screening, interview scheduling, and onboarding processes.',
    category: 'Human Resources',
    owner: 'HR Team',
    status: 'active' as const,
    key_features: ['Resume Screening', 'Interview Coordination', 'Onboarding Support'],
    access_link: null,
    contact_info: {
      name: 'Lisa Wang',
      email: 'lisa.wang@company.com'
    },
    created_at: new Date().toISOString(),
    last_updated: new Date().toISOString()
  }
];

export const populateAgents = async () => {
  try {
    console.log('Populating agents database...');
    
    for (const agent of sampleAgents) {
      await offlineApiService.createAgent(agent);
    }
    
    console.log('Successfully populated agents database');
    return true;
  } catch (error) {
    console.error('Error populating agents:', error);
    return false;
  }
};
