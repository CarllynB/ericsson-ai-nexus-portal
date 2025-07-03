
// Simple ID generation function for browser compatibility
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Function to clear all agents from the database via API
export const clearAllAgents = async (): Promise<boolean> => {
  try {
    console.log('🧹 Clearing all agents from the database...');
    const response = await fetch('/api/agents', {
      method: 'DELETE',
    });
    
    if (response.ok) {
      console.log('✅ All agents cleared');
      return true;
    } else {
      console.error('❌ Error clearing agents:', await response.text());
      return false;
    }
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

// Function to populate default agents via API
export const populateDefaultAgents = async () => {
  try {
    console.log('📝 Populating default agents via API...');

    const defaultAgents = [
      {
        name: 'Code Companion',
        description: 'Assists with code generation, debugging, and documentation.',
        category: 'Development',
        status: 'active',
        key_features: ['Code generation', 'Debugging', 'Documentation'],
        access_link: null,
        contact_info: null,
        owner: 'AI-DU',
        use_cases: 'Software development, code review, technical writing',
        access_level: 'internal',
        usage_count: 150,
        average_time_saved: 30,
        impact_score: 8
      },
      {
        name: 'Content Curator',
        description: 'Generates engaging content for marketing and social media.',
        category: 'Marketing',
        status: 'active',
        key_features: ['Content creation', 'Social media management', 'SEO optimization'],
        access_link: null,
        contact_info: null,
        owner: 'AI-DU',
        use_cases: 'Content marketing, social media campaigns, brand awareness',
        access_level: 'internal',
        usage_count: 200,
        average_time_saved: 45,
        impact_score: 9
      },
      {
        name: 'Data Detective',
        description: 'Analyzes data to provide insights and improve decision-making.',
        category: 'Analytics',
        status: 'active',
        key_features: ['Data analysis', 'Reporting', 'Visualization'],
        access_link: null,
        contact_info: null,
        owner: 'AI-DU',
        use_cases: 'Business intelligence, data-driven decisions, performance tracking',
        access_level: 'internal',
        usage_count: 120,
        average_time_saved: 60,
        impact_score: 7
      }
    ];

    // Create each agent via API
    for (const agent of defaultAgents) {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agent),
      });
      
      if (response.ok) {
        console.log('✅ Agent created:', agent.name);
      } else {
        console.error('❌ Failed to create agent:', agent.name, await response.text());
      }
    }

    console.log('✅ Default agents population completed');
  } catch (error) {
    console.error('❌ Error populating default agents:', error);
  }
};
