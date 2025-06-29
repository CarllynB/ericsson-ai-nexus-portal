
import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Chat endpoint for NOVA
router.post('/chat', authenticateToken, requireRole(['super_admin']), async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    console.log('🤖 NOVA chat request:', message);

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
- It manages various GenAI agents like Navigator365, Explorer, 5GC FA agent
- Users can view agent metrics, time savings, and usage statistics
- The portal has different user roles: Super Admin, Admin, and Viewer
- Super Admins can manage agents, roles, and sidebar items
- The dashboard shows adoption graphs and KPIs for agent performance

Common questions you should be able to answer:
- What each GenAI agent does and their purpose
- How to navigate the portal and access different features
- Difference between user roles and permissions
- How metrics like time savings and usage are calculated
- How to request new agents or report issues
- General troubleshooting and portal guidance

User question: ${message}

Provide a helpful, concise response as NOVA:`,
          stream: false
        })
      });

      if (ollamaResponse.ok) {
        const ollamaData = await ollamaResponse.json();
        console.log('✅ NOVA response from Ollama');
        res.json({ response: ollamaData.response });
        return;
      }
    } catch (ollamaError) {
      console.log('⚠️ Ollama not available, using fallback response');
    }

    // Fallback response with context-aware replies
    let response = "I'm NOVA, your AI-DU Portal assistant! ";
    
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('agent') || lowerMessage.includes('genai')) {
      response += "I can help you understand our GenAI agents like Navigator365 (productivity automation), Explorer (data analysis), and the 5GC FA agent (network optimization). What specific agent would you like to know about?";
    } else if (lowerMessage.includes('dashboard') || lowerMessage.includes('metric')) {
      response += "The dashboard shows key metrics like time savings, usage counts, and adoption rates for each agent. Time savings represents hours saved through automation, while usage counts show how often agents are accessed. Would you like details about any specific metric?";
    } else if (lowerMessage.includes('role') || lowerMessage.includes('permission')) {
      response += "Our portal has three roles: Super Admins (full access to manage everything), Admins (can manage agents and users), and Viewers (read-only access). Your current role determines what features you can access. Need help with role management?";
    } else if (lowerMessage.includes('user') || lowerMessage.includes('create')) {
      response += "Super Admins can create users through the Role Management panel in the sidebar. You can assign roles, manage permissions, and control access to different portal features. Would you like a walkthrough?";
    } else {
      response += "I'm here to help with the AI-DU Portal! I can explain GenAI agents, dashboard metrics, user roles, navigation, and troubleshooting. What would you like to know about?";
    }

    console.log('📝 NOVA fallback response sent');
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

    res.json({
      status: 'active',
      ollama: ollamaStatus,
      model: 'mistral',
      access_level: 'super_admin_only'
    });
  } catch (error) {
    console.error('❌ Error getting NOVA status:', error);
    res.status(500).json({ error: 'Failed to get NOVA status' });
  }
});

export { router as novaRoutes };
