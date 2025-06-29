
import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { dbAll, dbGet, dbRun } from '../database';
import { AuthenticatedRequest } from '../types';

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

// Test Ollama connection
const testOllamaConnection = async () => {
  try {
    const response = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
      signal: AbortSignal.timeout(3000) // Reduced timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Ollama connected successfully. Available models:', data.models?.map(m => m.name));
      return true;
    } else {
      console.log('❌ Ollama responded with error:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Ollama connection failed:', error.message);
    return false;
  }
};

// Chat endpoint for NOVA
router.post('/chat', authenticateToken, async (req: AuthenticatedRequest, res) => {
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

    console.log('🤖 NOVA chat request from', req.user?.email, ':', message);

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

    // Test Ollama connection first
    const ollamaConnected = await testOllamaConnection();
    
    if (ollamaConnected) {
      try {
        console.log('🔄 Sending request to Ollama...');
        const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama3.2',
            prompt: `You are NOVA, the AI-DU Portal assistant. You help users navigate GenAI agents, answer technical questions, and explain portal features.

Context about the AI-DU Portal:
- This is an internal portal for the AI & Data Unit at Ericsson
- It manages various GenAI agents and tracks their performance
- Users can view agent metrics, time savings, and usage statistics
- The portal has different user roles: Super Admin, Admin, and Viewer
- Super Admins can manage agents, roles, and sidebar items
- The dashboard shows adoption graphs and KPIs for agent performance

${agentContext}

User question: ${message}

Provide a helpful, accurate response as NOVA using the real agent data above. Keep responses concise and focused on the AI-DU Portal context:`,
            stream: false,
            options: {
              temperature: 0.3,
              top_p: 0.8,
              top_k: 20,
              repeat_penalty: 1.1,
              num_predict: 200, // Limit response length for speed
              num_ctx: 2048 // Reduced context window for speed
            }
          }),
          signal: AbortSignal.timeout(15000) // 15 second timeout
        });

        if (ollamaResponse.ok) {
          const ollamaData = await ollamaResponse.json();
          console.log('✅ NOVA response from Ollama received');
          res.json({ response: ollamaData.response, source: 'ollama' });
          return;
        } else {
          console.log('❌ Ollama API error:', ollamaResponse.status);
        }
      } catch (ollamaError) {
        console.log('❌ Ollama request failed:', ollamaError.message);
      }
    }

    // Enhanced fallback response with real agent data
    console.log('📝 Using enhanced fallback response with real data');
    let response = "I'm NOVA, your AI-DU Portal assistant! ";
    
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('deploy') || lowerMessage.includes('deployment')) {
      response += "To deploy an agent in the AI-DU Portal:\n\n";
      response += "1. **Super Admins** can add new agents through the Agent Management section\n";
      response += "2. Configure the agent's name, description, category, and use cases\n";
      response += "3. Set the appropriate access level (Public, Internal, or Restricted)\n";
      response += "4. Test the agent functionality before making it active\n";
      response += "5. Monitor usage metrics and performance through the dashboard\n\n";
      response += "Would you like more details about any of these steps?";
    } else if (lowerMessage.includes('agent') || lowerMessage.includes('genai')) {
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
    } else {
      response += "I'm here to help with the AI-DU Portal! I can explain GenAI agents, dashboard metrics, user roles, navigation, and troubleshooting. ";
      if (agents.length > 0) {
        response += `We have ${agents.length} active agents ready to help you. `;
      }
      response += "What would you like to know about?";
    }

    res.json({ response, source: 'fallback' });

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
router.put('/settings', authenticateToken, requireRole(['super_admin']), async (req: AuthenticatedRequest, res) => {
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
