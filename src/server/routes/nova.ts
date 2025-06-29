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
      signal: AbortSignal.timeout(2000) // Quick timeout for connection test
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
    
    // Build simpler context with real agent data
    const agentContext = agents.length > 0 ? `
Active Agents: ${agents.map(agent => `${agent.name} (${agent.category}): ${agent.description}`).join(', ')}
` : 'No active agents found.';

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
            prompt: `You are NOVA, the AI-DU Portal assistant. Help users with GenAI agents and portal features.

Context: ${agentContext}

User question: ${message}

Provide a helpful, concise response as NOVA:`,
            stream: false,
            options: {
              temperature: 0.3,
              num_predict: 150, // Shorter response for speed
              num_ctx: 1024    // Smaller context for speed
            }
          }),
          signal: AbortSignal.timeout(10000) // 10 second timeout
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

    // Simple fallback response with real agent data
    console.log('📝 Using enhanced fallback response with real data');
    let response = "I'm NOVA, your AI-DU Portal assistant! ";
    
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('features') || lowerMessage.includes('portal')) {
      response += "The AI-DU Portal includes these key features:\n\n";
      response += "• **Agent Catalog** - Browse and access GenAI agents\n";
      response += "• **Dashboard** - View adoption metrics and performance\n";
      response += "• **Role Management** - Super Admins can manage user permissions\n";
      response += "• **Agent Management** - Add and configure new agents\n";
      response += "• **NOVA Chat** - AI assistant (that's me!)\n\n";
      if (agents.length > 0) {
        response += `We currently have ${agents.length} active agents ready to help you.`;
      }
    } else if (lowerMessage.includes('agent')) {
      if (agents.length > 0) {
        const topAgents = agents.slice(0, 3);
        response += `We have ${agents.length} active agents. Top agents: `;
        response += topAgents.map(agent => `${agent.name} (${agent.category})`).join(', ');
      } else {
        response += "No agents are currently active. Super Admins can add agents through the portal.";
      }
    } else {
      response += "I can help with portal navigation, agent information, and feature explanations. What would you like to know?";
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
