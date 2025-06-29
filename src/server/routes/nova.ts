
import { Router } from 'express';
import { Ollama } from 'ollama';

const router = Router();

// Initialize Ollama client
const ollama = new Ollama({ host: 'http://localhost:11434' });

// System prompt for NOVA
const NOVA_SYSTEM_PROMPT = `You are NOVA, the AI-DU Portal assistant for Ericsson's AI & Data Unit. You help users navigate GenAI agents, answer technical questions, and explain portal features.

You have knowledge about:
- The AI-DU Agent Portal and its features
- GenAI agents including 5GC FA agent, Navigator365, Explorer agent, Gemini agent, Copilot for Jira
- User roles: Super Admin, Admin, and Viewer
- Agent management, publishing, and onboarding
- The AI & Data Unit's mission and responsibilities
- Portal navigation and troubleshooting

Key agents in the portal:
- Navigator 365: Helps with navigation and workflow automation
- Explorer: Data exploration and analysis tool
- 5GC FA: 5G Core Fault Analysis agent
- Gemini: Google's AI assistant integration
- Copilot for Jira: Atlassian integration for project management

User roles:
- Super Admin: Full control, can manage users, agents, and system settings
- Admin: Can manage agents and view analytics
- Viewer: Can only view and access published agents

Be helpful, concise, and professional. If you don't know something specific, suggest contacting the system administrator or checking the documentation.`;

// Chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    console.log('🤖 NOVA: Received message:', message);

    // Check if Ollama is available
    try {
      await ollama.list();
    } catch (error) {
      console.warn('⚠️ Ollama not available, using fallback response');
      res.json({ 
        response: "I'm currently running in limited mode. For full AI assistance, please ensure Ollama is installed and running with a model like 'mistral' or 'llama3'. In the meantime, I can help with basic portal navigation questions."
      });
      return;
    }

    // Generate response using Ollama
    const response = await ollama.chat({
      model: 'mistral', // fallback to llama3 if mistral not available
      messages: [
        {
          role: 'system',
          content: NOVA_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: message
        }
      ],
      stream: false
    });

    console.log('✅ NOVA: Generated response');
    res.json({ response: response.message.content });

  } catch (error) {
    console.error('❌ NOVA Error:', error);
    
    // Provide contextual fallback responses
    const fallbackResponse = getFallbackResponse(req.body.message);
    res.json({ response: fallbackResponse });
  }
});

// Fallback responses when Ollama is not available
function getFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('agent') && lowerMessage.includes('available')) {
    return "The AI-DU Portal currently features several GenAI agents including Navigator 365, Explorer, 5GC FA agent, Gemini, and Copilot for Jira. You can view all available agents on the main portal page.";
  }
  
  if (lowerMessage.includes('admin') || lowerMessage.includes('role')) {
    return "The portal has three user roles: Super Admin (full control), Admin (can manage agents), and Viewer (can access published agents). Super Admins can assign roles through the Dashboard.";
  }
  
  if (lowerMessage.includes('navigator') || lowerMessage.includes('365')) {
    return "Navigator 365 is a workflow automation agent that helps users navigate complex processes and automate routine tasks within the Ericsson ecosystem.";
  }
  
  if (lowerMessage.includes('add') && lowerMessage.includes('agent')) {
    return "To add a new GenAI agent, you need Super Admin or Admin privileges. Go to the Dashboard and use the Agent Management section to create a new agent with details like name, description, category, and access links.";
  }
  
  if (lowerMessage.includes('explorer')) {
    return "The Explorer agent is a data exploration and analysis tool that helps users investigate datasets, generate insights, and create visualizations for better decision-making.";
  }
  
  if (lowerMessage.includes('ai') && (lowerMessage.includes('data') || lowerMessage.includes('unit'))) {
    return "The AI & Data Unit at Ericsson is responsible for advancing AI adoption, ensuring data privacy and compliance, developing GenAI solutions, and providing internal AI tools and support to enhance automation and efficiency across the organization.";
  }
  
  return "I'm currently running in limited mode. For full AI assistance, please ensure Ollama is installed and running. You can also check the portal documentation or contact your system administrator for specific technical questions.";
}

// Health check endpoint
router.get('/status', async (req, res) => {
  try {
    await ollama.list();
    res.json({ status: 'online', ollama: true });
  } catch (error) {
    res.json({ status: 'limited', ollama: false });
  }
});

export { router as novaRoutes };
