import { dbRun, dbAll, dbGet } from '../server/database';

export const clearAllCachedAgents = () => {
  localStorage.removeItem('agents');
  localStorage.removeItem('roles');
  localStorage.removeItem('sidebar_items');
  console.log('🧹 Cleared ALL cached agent data from localStorage');
};

const agentData = [
  {
    id: 'navigator365',
    name: 'Navigator365',
    description: 'Your AI-powered productivity automation agent. Automate tasks across Microsoft 365 apps.',
    category: 'Productivity',
    use_cases: 'Automated report generation, calendar management, email filtering',
    access_level: 'internal',
    cost_per_use: 0.05,
    average_time_saved: 60,
    usage_count: 1200,
    impact_score: 0.85,
    user_feedback: 'Great for automating routine tasks, saves a lot of time!',
    security_compliance: 'SOC2, GDPR',
    integrations: 'Microsoft 365 Suite',
    agent_persona: 'Efficient, reliable, and detail-oriented',
    agent_limitations: 'Limited to Microsoft 365 apps, requires specific instructions',
    agent_version: '2.1',
    release_date: '2023-08-15',
    last_updated: '2024-01-20',
    developer: 'AI & Data Unit',
    known_issues: 'Occasional delays in report generation',
    suggested_improvements: 'Add support for Google Workspace',
    related_agents: 'Explorer, 5GC FA Agent',
    tags: 'automation, productivity, microsoft 365',
    is_active: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Advanced data analysis agent. Explore datasets, generate insights, and create visualizations.',
    category: 'Analytics',
    use_cases: 'Data mining, trend analysis, predictive modeling',
    access_level: 'internal',
    cost_per_use: 0.10,
    average_time_saved: 120,
    usage_count: 800,
    impact_score: 0.92,
    user_feedback: 'Powerful tool for data analysis, provides valuable insights.',
    security_compliance: 'SOC2, HIPAA',
    integrations: 'SQL Databases, Cloud Storage',
    agent_persona: 'Analytical, insightful, and data-driven',
    agent_limitations: 'Requires large datasets, may produce false positives',
    agent_version: '1.5',
    release_date: '2023-11-01',
    last_updated: '2024-02-28',
    developer: 'AI & Data Unit',
    known_issues: 'High memory usage with large datasets',
    suggested_improvements: 'Improve performance with big data',
    related_agents: 'Navigator365, 5GC FA Agent',
    tags: 'data analysis, analytics, visualization',
    is_active: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '5gc-fa-agent',
    name: '5GC FA Agent',
    description: '5G Core Fault Analysis Agent. Detect and resolve network faults in real-time.',
    category: 'Network Optimization',
    use_cases: 'Fault detection, root cause analysis, automated remediation',
    access_level: 'external',
    cost_per_use: 0.15,
    average_time_saved: 180,
    usage_count: 500,
    impact_score: 0.95,
    user_feedback: 'Critical for maintaining network stability, reduces downtime significantly.',
    security_compliance: 'GDPR, PCI DSS',
    integrations: '5G Core Network Elements',
    agent_persona: 'Proactive, efficient, and solution-oriented',
    agent_limitations: 'Limited to 5G core network, requires network access',
    agent_version: '3.0',
    release_date: '2024-01-15',
    last_updated: '2024-03-10',
    developer: 'AI & Data Unit',
    known_issues: 'Occasional false alarms during peak hours',
    suggested_improvements: 'Improve accuracy of fault detection',
    related_agents: 'Navigator365, Explorer',
    tags: '5g, network optimization, fault analysis',
    is_active: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
];

export const populateDefaultAgents = async () => {
  console.log('🚀 Populating default agents and sidebar items...');
  
  try {
    // Populate agents table
    console.log('🤖 Adding default agents...');
    for (const agent of agentData) {
      const existing = await dbGet('SELECT id FROM agents WHERE id = ?', [agent.id]);
      if (!existing) {
        await dbRun(
          'INSERT INTO agents (id, name, description, category, use_cases, access_level, cost_per_use, average_time_saved, usage_count, impact_score, user_feedback, security_compliance, integrations, agent_persona, agent_limitations, agent_version, release_date, last_updated, developer, known_issues, suggested_improvements, related_agents, tags, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            agent.id,
            agent.name,
            agent.description,
            agent.category,
            agent.use_cases,
            agent.access_level,
            agent.cost_per_use,
            agent.average_time_saved,
            agent.usage_count,
            agent.impact_score,
            agent.user_feedback,
            agent.security_compliance,
            agent.integrations,
            agent.agent_persona,
            agent.agent_limitations,
            agent.agent_version,
            agent.release_date,
            agent.last_updated,
            agent.developer,
            agent.known_issues,
            agent.suggested_improvements,
            agent.related_agents,
            agent.tags,
            agent.is_active,
            agent.created_at,
            agent.updated_at
          ]
        );
        console.log(`✅ Added agent: ${agent.name}`);
      }
    }

    // Add default sidebar items including NOVA
    const defaultSidebarItems = [
      { id: 'home', title: 'Home', url: '/', order_index: 1, is_default: 1 },
      { id: 'agents', title: 'Agents', url: '/agents', order_index: 2, is_default: 1 },
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard', order_index: 3, is_default: 1 },
      { id: 'talk-to-nova', title: 'Talk to NOVA', url: '/talk-to-nova', order_index: 4, is_default: 1 },
      { id: 'pitchbox', title: 'PitchBox', url: 'https://pitchbox.csstip.ckit1.explab.com', order_index: 5, is_default: 1 }
    ];

    console.log('📋 Adding default sidebar items...');
    for (const item of defaultSidebarItems) {
      const existing = await dbGet('SELECT id FROM sidebar_items WHERE id = ?', [item.id]);
      if (!existing) {
        await dbRun(
          'INSERT INTO sidebar_items (id, title, url, order_index, is_default) VALUES (?, ?, ?, ?, ?)',
          [item.id, item.title, item.url, item.order_index, item.is_default]
        );
        console.log(`✅ Added sidebar item: ${item.title}`);
      }
    }

    console.log('✅ Default agents and sidebar items populated successfully');
  } catch (error) {
    console.error('❌ Error populating default data:', error);
    throw error;
  }
};
