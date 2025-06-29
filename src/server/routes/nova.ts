
import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { dbAll, dbGet, dbRun } from '../database';

const router = Router();

// Helper function to get agent data for NOVA responses
const getAgentData = async () => {
  try {
    const agents = await dbAll('SELECT * FROM agents WHERE is_active = 1 ORDER BY usage_count DESC');
    return agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      category: agent.category,
      use_cases: agent.use_cases,
      access_level: agent.access_level,
      usage_count: agent.usage_count,
      average_time_saved: agent.average_time_saved,
      impact_score: agent.impact_score
    }));
  } catch (error) {
    console.error('Error fetching agent data for NOVA:', error);
    return [];
  }
};

// Get NOVA settings
const getNovaSettings = async () => {
  try {
    const settings = await dbGet('SELECT * FROM nova_settings WHERE id = 1');
    return settings || { is_live: 0, available_to_all: 0 };
  } catch (error) {
    // Table might not exist yet, return defaults
    return { is_live: 0, available_to_all: 0 };
  }
};

// Chat endpoint for NOVA
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    // Check if user has access to NOVA
    const settings = await getNovaSettings();
    const userRole = req.user?.role || 'viewer';
    
    if (!settings.available_to_all && userRole !== 'super_admin') {
      res.status(403).json({ error: 'NOVA is not available to your role yet' });
      return;
    }

    console.log('🤖 NOVA chat request:', message);

    // Get real agent data from database
    const agents = await getAgentData();
    
    // Build context with real agent data
    const agentContext = agents.length > 0 ? `
Current Active Agents in the Portal:
${agents.map(agent => `
- ${agent.name} (${agent.category}): ${agent.description}
  Use cases: ${agent.use_cases}
  Access: ${agent.access_level}
  Usage: ${agent.usage_count} times
  Time saved: ${agent.average_time_saved} minutes average
  Impact score: ${agent.impact_score}
`).join('')}
` : 'No active agents found in the database.';

    try {
      // Try to connect to Ollama
      const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mistral',
          prompt: `You are NOVA, the AI-DU Portal assistant. You help users navigate GenAI agents, answer technical questions, and explain portal features.

Context about the AI-DU Portal:
- This is an internal portal for the AI & Data Unit at Ericsson
- It manages various GenAI agents and tracks their performance
- Users can view agent metrics, time savings, and usage statistics
- The portal has different user roles: Super Admin, Admin, and Viewer
- Super Admins can manage agents, roles, and sidebar items
- The dashboard shows adoption graphs and KPIs for agent performance

${agentContext}

Common questions you should be able to answer:
- What each GenAI agent does and their specific purpose
- How to navigate the portal and access different features
- Difference between user roles and permissions
- How metrics like time savings and usage are calculated
- How to request new agents or report issues
- General troubleshooting and portal guidance
- Agent categories (Internal vs External access levels)
- Dashboard metrics explanations

User question: ${message}

Provide a helpful, accurate response as NOVA using the real agent data above:`,
          stream: false
        })
      });

      if (ollamaResponse.ok) {
        const ollamaData = await ollamaResponse.json();
        console.log('✅ NOVA response from Ollama with real data');
        res.json({ response: ollamaData.response });
        return;
      }
    } catch (ollamaError) {
      console.log('⚠️ Ollama not available, using enhanced fallback response');
    }

    // Enhanced fallback response with real agent data
    let response = "I'm NOVA, your AI-DU Portal assistant! ";
    
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('agent') || lowerMessage.includes('genai')) {
      if (agents.length > 0) {
        const topAgents = agents.slice(0, 3);
        response += `We currently have ${agents.length} active agents in the portal. Our top agents include:\n\n`;
        topAgents.forEach(agent => {
          response += `• **${agent.name}** (${agent.category}): ${agent.description}\n`;
          response += `  - Used ${agent.usage_count} times, saves ~${agent.average_time_saved} minutes per use\n\n`;
        });
        response += 'Would you like details about any specific agent?';
      } else {
        response += "I can help you understand GenAI agents, but it looks like no agents are currently active in the database. Super Admins can add agents through the portal.";
      }
    } else if (lowerMessage.includes('dashboard') || lowerMessage.includes('metric')) {
      response += "The dashboard shows key metrics like time savings, usage counts, and adoption rates for each agent. ";
      if (agents.length > 0) {
        const totalUsage = agents.reduce((sum, agent) => sum + agent.usage_count, 0);
        const avgTimeSaved = agents.reduce((sum, agent) => sum + agent.average_time_saved, 0) / agents.length;
        response += `Currently we have ${totalUsage} total agent uses across all agents, with an average of ${Math.round(avgTimeSaved)} minutes saved per use. `;
      }
      response += "Time savings represents hours saved through automation, while usage counts show how often agents are accessed. Would you like details about any specific metric?";
    } else if (lowerMessage.includes('role') || lowerMessage.includes('permission')) {
      response += "Our portal has three roles: Super Admins (full access to manage everything), Admins (can manage agents and users), and Viewers (read-only access). Your current role determines what features you can access. Need help with role management?";
    } else if (lowerMessage.includes('category') || lowerMessage.includes('internal') || lowerMessage.includes('external')) {
      const internalAgents = agents.filter(a => a.access_level === 'internal');
      const externalAgents = agents.filter(a => a.access_level === 'external');
      response += `Agents are categorized by access level:\n\n`;
      response += `**Internal Agents** (${internalAgents.length}): Available only within Ericsson\n`;
      response += `**External Agents** (${externalAgents.length}): Can be accessed by external partners\n\n`;
      if (internalAgents.length > 0) {
        response += `Internal agents include: ${internalAgents.map(a => a.name).join(', ')}\n`;
      }
      if (externalAgents.length > 0) {
        response += `External agents include: ${externalAgents.map(a => a.name).join(', ')}`;
      }
    } else {
      response += "I'm here to help with the AI-DU Portal! I can explain GenAI agents, dashboard metrics, user roles, navigation, and troubleshooting. ";
      if (agents.length > 0) {
        response += `We have ${agents.length} active agents ready to help you. `;
      }
      response += "What would you like to know about?";
    }

    console.log('📝 NOVA enhanced fallback response sent with real data');
    res.json({ response });

  } catch (error) {
    console.error('❌ Error in NOVA chat:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// Get NOVA status/settings
router.get('/status', authenticateToken, requireRole(['super_admin']), async (req, res) => {
  try {
    // Check if Ollama is available
    let ollamaStatus = 'disconnected';
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (response.ok) {
        ollamaStatus = 'connected';
      }
    } catch (error) {
      ollamaStatus = 'disconnected';
    }

    const settings = await getNovaSettings();

    res.json({
      status: 'active',
      ollama: ollamaStatus,
      model: 'mistral',
      is_live: settings.is_live,
      available_to_all: settings.available_to_all,
      access_level: settings.available_to_all ? 'all_users' : 'super_admin_only'
    });
  } catch (error) {
    console.error('❌ Error getting NOVA status:', error);
    res.status(500).json({ error: 'Failed to get NOVA status' });
  }
});

// Update NOVA settings (Super Admin only)
router.put('/settings', authenticateToken, requireRole(['super_admin']), async (req, res) => {
  try {
    const { available_to_all, is_live } = req.body;
    
    // Create nova_settings table if it doesn't exist
    await dbRun(`
      CREATE TABLE IF NOT EXISTS nova_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        is_live BOOLEAN DEFAULT 0,
        available_to_all BOOLEAN DEFAULT 0,
        updated_by TEXT,
        updated_at TEXT DEFAULT (datetime('now')),
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Insert or update settings
    await dbRun(`
      INSERT OR REPLACE INTO nova_settings (id, is_live, available_to_all, updated_by, updated_at)
      VALUES (1, ?, ?, ?, datetime('now'))
    `, [is_live ? 1 : 0, available_to_all ? 1 : 0, req.user?.email || 'system']);

    console.log('✅ NOVA settings updated:', { available_to_all, is_live });
    res.json({ 
      success: true, 
      settings: { available_to_all, is_live }
    });
  } catch (error) {
    console.error('❌ Error updating NOVA settings:', error);
    res.status(500).json({ error: 'Failed to update NOVA settings' });
  }
});

export { router as novaRoutes };
