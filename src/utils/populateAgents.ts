
import { offlineApiService } from '@/services/offlineApi';

export const populateDefaultAgents = async () => {
  try {
    // Check if agents already exist
    const existingAgents = await offlineApiService.getAgents();
    if (existingAgents.length > 0) {
      console.log('Agents already exist, skipping population');
      return;
    }

    const defaultAgents = [
      {
        id: '1',
        name: 'AI Code Assistant',
        description: 'Intelligent code generation and debugging assistant for developers',
        category: 'Development',
        status: 'active' as const,
        owner: 'Development Team',
        key_features: ['Code Generation', 'Bug Detection', 'Documentation'],
        access_link: 'https://github.com/copilot',
        contact_info: null,
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Customer Support Bot',
        description: 'Automated customer service agent with natural language processing',
        category: 'Support',
        status: 'active' as const,
        owner: 'Customer Success Team',
        key_features: ['24/7 Availability', 'Multi-language Support', 'Ticket Routing'],
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
        name: 'Data Analytics Agent',
        description: 'Advanced data analysis and visualization tool for business insights',
        category: 'Analytics',
        status: 'active' as const,
        owner: 'Data Science Team',
        key_features: ['Real-time Analysis', 'Custom Dashboards', 'Predictive Modeling'],
        access_link: 'https://analytics.internal.com',
        contact_info: null,
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      },
      {
        id: '4',
        name: 'Content Generator',
        description: 'AI-powered content creation for marketing and documentation',
        category: 'Marketing',
        status: 'coming_soon' as const,
        owner: 'Marketing Team',
        key_features: ['SEO Optimization', 'Multi-format Output', 'Brand Voice Consistency'],
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
        name: 'Security Monitor',
        description: 'Real-time security threat detection and response system',
        category: 'Security',
        status: 'active' as const,
        owner: 'Security Team',
        key_features: ['Threat Detection', 'Automated Response', 'Compliance Reporting'],
        access_link: 'https://security.internal.com',
        contact_info: null,
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      },
      {
        id: '6',
        name: 'HR Assistant',
        description: 'Intelligent HR support for employee queries and processes',
        category: 'Human Resources',
        status: 'active' as const,
        owner: 'HR Team',
        key_features: ['Employee Onboarding', 'Policy Questions', 'Leave Management'],
        access_link: null,
        contact_info: {
          name: 'Lisa Wang',
          email: 'lisa.wang@company.com'
        },
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      }
    ];

    // Add each agent to the database
    for (const agent of defaultAgents) {
      await offlineApiService.createAgent(agent);
    }

    console.log('Successfully populated default agents');
  } catch (error) {
    console.error('Error populating default agents:', error);
  }
};
