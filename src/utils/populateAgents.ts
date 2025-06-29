import { dbRun, dbGet } from "@/server/database";

// Simple ID generation function for browser compatibility
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Function to clear all agents from the database
export const clearAllAgents = async (): Promise<boolean> => {
  try {
    console.log('🧹 Clearing all agents from the database...');
    await dbRun('DELETE FROM agents');
    console.log('✅ All agents cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing agents:', error);
    return false;
  }
};

// Function to clear all cached agent data (localStorage)
export const clearAllCachedAgents = () => {
  try {
    console.log('🧹 Clearing all cached agent data from localStorage...');
    
    // Get all keys in localStorage
    const keys = Object.keys(localStorage);
    
    // Filter keys that start with 'agent_'
    const agentKeys = keys.filter(key => key.startsWith('agent_'));
    
    // Remove each agent key from localStorage
    agentKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log('🗑️  Removed cached agent:', key);
    });

    console.log('✅ All cached agent data cleared');
  } catch (error) {
    console.error('❌ Error clearing cached agent data:', error);
  }
};

// Function to populate default agents into the database
export const populateDefaultAgents = async () => {
  try {
    console.log('📝 Populating default agents into the database...');

    const defaultAgents = [
      {
        id: generateId(),
        name: 'Code Companion',
        description: 'Assists with code generation, debugging, and documentation.',
        category: 'Development',
        status: 'active',
        key_features: ['Code generation', 'Debugging', 'Documentation'],
        access_link: null,
        contact_info: null,
        owner: 'AI-DU',
        last_updated: new Date().toISOString(),
        created_at: new Date().toISOString(),
        is_active: 1,
        use_cases: 'Software development, code review, technical writing',
        access_level: 'internal',
        usage_count: 150,
        average_time_saved: 30,
        impact_score: 8
      },
      {
        id: generateId(),
        name: 'Content Curator',
        description: 'Generates engaging content for marketing and social media.',
        category: 'Marketing',
        status: 'active',
        key_features: ['Content creation', 'Social media management', 'SEO optimization'],
        access_link: null,
        contact_info: null,
        owner: 'AI-DU',
        last_updated: new Date().toISOString(),
        created_at: new Date().toISOString(),
        is_active: 1,
        use_cases: 'Content marketing, social media campaigns, brand awareness',
        access_level: 'internal',
        usage_count: 200,
        average_time_saved: 45,
        impact_score: 9
      },
      {
        id: generateId(),
        name: 'Data Detective',
        description: 'Analyzes data to provide insights and improve decision-making.',
        category: 'Analytics',
        status: 'active',
        key_features: ['Data analysis', 'Reporting', 'Visualization'],
        access_link: null,
        contact_info: null,
        owner: 'AI-DU',
        last_updated: new Date().toISOString(),
        created_at: new Date().toISOString(),
        is_active: 1,
        use_cases: 'Business intelligence, data-driven decisions, performance tracking',
        access_level: 'internal',
        usage_count: 120,
        average_time_saved: 60,
        impact_score: 7
      },
      {
        id: generateId(),
        name: 'HR Helper',
        description: 'Automates HR tasks such as onboarding and policy updates.',
        category: 'HR',
        status: 'coming_soon',
        key_features: ['Onboarding', 'Policy updates', 'Employee support'],
        access_link: null,
        contact_info: {
          name: 'Carl Barfi',
          email: 'carllyn.barfi@ericsson.com'
        },
        owner: 'AI-DU',
        last_updated: new Date().toISOString(),
        created_at: new Date().toISOString(),
        is_active: 1,
        use_cases: 'Employee onboarding, HR policy management, employee self-service',
        access_level: 'internal',
        usage_count: 0,
        average_time_saved: 0,
        impact_score: 0
      },
      {
        id: generateId(),
        name: 'Sales Navigator',
        description: 'Provides sales teams with real-time leads and customer insights.',
        category: 'Sales',
        status: 'inactive',
        key_features: ['Lead generation', 'Customer insights', 'Sales automation'],
        access_link: null,
        contact_info: null,
        owner: 'AI-DU',
        last_updated: new Date().toISOString(),
        created_at: new Date().toISOString(),
        is_active: 1,
        use_cases: 'Sales prospecting, customer relationship management, sales forecasting',
        access_level: 'internal',
        usage_count: 80,
        average_time_saved: 90,
        impact_score: 6
      },
      {
        id: generateId(),
        name: 'Legal Eagle',
        description: 'Assists with legal research, contract review, and compliance.',
        category: 'Legal',
        status: 'active',
        key_features: ['Legal research', 'Contract review', 'Compliance'],
        access_link: null,
        contact_info: {
          name: 'Muhammad Mahmood',
          email: 'muhammad.mahmood@ericsson.com'
        },
        owner: 'AI-DU',
        last_updated: new Date().toISOString(),
        created_at: new Date().toISOString(),
        is_active: 1,
        use_cases: 'Legal research, contract management, regulatory compliance',
        access_level: 'internal',
        usage_count: 50,
        average_time_saved: 120,
        impact_score: 5
      },
      {
        id: generateId(),
        name: 'Market Maven',
        description: 'Analyzes market trends and customer behavior to optimize marketing strategies.',
        category: 'Marketing',
        status: 'active',
        key_features: ['Market analysis', 'Customer behavior', 'Marketing optimization'],
        access_link: null,
        contact_info: null,
        owner: 'AI-DU',
        last_updated: new Date().toISOString(),
        created_at: new Date().toISOString(),
        is_active: 1,
        use_cases: 'Market research, customer segmentation, marketing campaign optimization',
        access_level: 'external',
        usage_count: 90,
        average_time_saved: 75,
        impact_score: 8
      },
      {
        id: generateId(),
        name: 'Financial Forecaster',
        description: 'Predicts financial trends and provides investment recommendations.',
        category: 'Finance',
        status: 'active',
        key_features: ['Financial analysis', 'Investment recommendations', 'Risk management'],
        access_link: null,
        contact_info: null,
        owner: 'AI-DU',
        last_updated: new Date().toISOString(),
        created_at: new Date().toISOString(),
        is_active: 1,
        use_cases: 'Financial planning, investment management, risk assessment',
        access_level: 'external',
        usage_count: 60,
        average_time_saved: 105,
        impact_score: 7
      },
      {
        id: generateId(),
        name: 'Supply Chain Sage',
        description: 'Optimizes supply chain operations and reduces costs.',
        category: 'Supply Chain',
        status: 'active',
        key_features: ['Supply chain optimization', 'Cost reduction', 'Logistics management'],
        access_link: null,
        contact_info: null,
        owner: 'AI-DU',
        last_updated: new Date().toISOString(),
        created_at: new Date().toISOString(),
        is_active: 1,
        use_cases: 'Supply chain planning, logistics optimization, inventory management',
        access_level: 'external',
        usage_count: 110,
        average_time_saved: 135,
        impact_score: 9
      },
      {
        id: generateId(),
        name: 'Customer Care Champ',
        description: 'Enhances customer service and improves customer satisfaction.',
        category: 'Customer Service',
        status: 'active',
        key_features: ['Customer service', 'Customer satisfaction', 'Support automation'],
        access_link: null,
        contact_info: null,
        owner: 'AI-DU',
        last_updated: new Date().toISOString(),
        created_at: new Date().toISOString(),
        is_active: 1,
        use_cases: 'Customer support, customer feedback analysis, customer engagement',
        access_level: 'external',
        usage_count: 180,
        average_time_saved: 150,
        impact_score: 10
      }
    ];

    // Insert each agent into the database
    for (const agent of defaultAgents) {
      await dbRun(
        `INSERT INTO agents (
          id, name, description, category, status, key_features, access_link, contact_info, owner, last_updated, created_at, is_active, use_cases, access_level, usage_count, average_time_saved, impact_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          agent.id,
          agent.name,
          agent.description,
          agent.category,
          agent.status,
          JSON.stringify(agent.key_features), // Store key_features as JSON
          agent.access_link,
          agent.contact_info ? JSON.stringify(agent.contact_info) : null, // Store contact_info as JSON
          agent.owner,
          agent.last_updated,
          agent.created_at,
          agent.is_active,
          agent.use_cases,
          agent.access_level,
          agent.usage_count,
          agent.average_time_saved,
          agent.impact_score
        ]
      );
      console.log('✅ Agent created:', agent.name);
    }

    console.log('✅ Default agents populated');
  } catch (error) {
    console.error('❌ Error populating default agents:', error);
  }
};
