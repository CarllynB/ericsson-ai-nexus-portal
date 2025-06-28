
// Debugging utility to track where agents are coming from
export const debugAgentSources = () => {
  console.log('🔍 DEBUGGING: Checking all possible agent sources...');
  
  // Check localStorage
  const localStorageAgents = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes('agent')) {
      try {
        const value = localStorage.getItem(key);
        localStorageAgents.push({ key, value: JSON.parse(value || '[]') });
      } catch (e) {
        localStorageAgents.push({ key, value: localStorage.getItem(key) });
      }
    }
  }
  
  // Check sessionStorage
  const sessionStorageAgents = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.includes('agent')) {
      try {
        const value = sessionStorage.getItem(key);
        sessionStorageAgents.push({ key, value: JSON.parse(value || '[]') });
      } catch (e) {
        sessionStorageAgents.push({ key, value: sessionStorage.getItem(key) });
      }
    }
  }
  
  console.log('📊 LOCAL STORAGE AGENTS:', localStorageAgents);
  console.log('📊 SESSION STORAGE AGENTS:', sessionStorageAgents);
  
  // Check if any global variables contain agents
  const globalAgentVars = [];
  try {
    // @ts-ignore
    if (window.agents) globalAgentVars.push('window.agents');
    // @ts-ignore  
    if (window.defaultAgents) globalAgentVars.push('window.defaultAgents');
    // @ts-ignore
    if (window.mockAgents) globalAgentVars.push('window.mockAgents');
  } catch (e) {
    // Ignore
  }
  
  console.log('🌍 GLOBAL AGENT VARIABLES:', globalAgentVars);
  
  if (localStorageAgents.length === 0 && sessionStorageAgents.length === 0 && globalAgentVars.length === 0) {
    console.log('✅ No cached or global agent data found');
  } else {
    console.error('🔥 FOUND CACHED AGENT DATA - This might be the source of hardcoded agents!');
  }
};

// Auto-run debug on import
debugAgentSources();
