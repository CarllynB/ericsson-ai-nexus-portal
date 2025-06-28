
// Enhanced debugging utility to track where agents are coming from
export const debugAgentSources = () => {
  console.log('🔍 ENHANCED DEBUGGING: Checking ALL possible agent sources...');
  console.log('🔥 CRITICAL: If agents appear on screen but all sources below show empty, hardcoded data exists!');
  
  // Check localStorage
  const localStorageAgents = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('agent') || key.includes('Agent'))) {
      try {
        const value = localStorage.getItem(key);
        const parsed = JSON.parse(value || '[]');
        localStorageAgents.push({ key, value: parsed, raw: value });
      } catch (e) {
        localStorageAgents.push({ key, value: localStorage.getItem(key), raw: localStorage.getItem(key) });
      }
    }
  }
  
  // Check sessionStorage
  const sessionStorageAgents = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.includes('agent') || key.includes('Agent'))) {
      try {
        const value = sessionStorage.getItem(key);
        const parsed = JSON.parse(value || '[]');
        sessionStorageAgents.push({ key, value: parsed, raw: value });
      } catch (e) {
        sessionStorageAgents.push({ key, value: sessionStorage.getItem(key), raw: sessionStorage.getItem(key) });
      }
    }
  }
  
  // Check global variables
  const globalAgentVars = [];
  try {
    // @ts-ignore
    if (window.agents) globalAgentVars.push({ name: 'window.agents', value: window.agents });
    // @ts-ignore  
    if (window.defaultAgents) globalAgentVars.push({ name: 'window.defaultAgents', value: window.defaultAgents });
    // @ts-ignore
    if (window.mockAgents) globalAgentVars.push({ name: 'window.mockAgents', value: window.mockAgents });
    // @ts-ignore
    if (window.sampleAgents) globalAgentVars.push({ name: 'window.sampleAgents', value: window.sampleAgents });
    // @ts-ignore
    if (window.__INITIAL_AGENTS__) globalAgentVars.push({ name: 'window.__INITIAL_AGENTS__', value: window.__INITIAL_AGENTS__ });
  } catch (e) {
    console.log('⚠️ Error checking global variables:', e);
  }
  
  // Check all properties of window object for agent-like data
  const suspiciousGlobals = [];
  try {
    for (const prop in window) {
      if (prop.toLowerCase().includes('agent') && typeof (window as any)[prop] !== 'function') {
        try {
          const value = (window as any)[prop];
          if (Array.isArray(value) && value.length > 0) {
            suspiciousGlobals.push({ name: `window.${prop}`, value, type: typeof value });
          }
        } catch (e) {
          // Ignore
        }
      }
    }
  } catch (e) {
    console.log('⚠️ Error scanning window properties:', e);
  }
  
  console.log('📊 LOCAL STORAGE AGENTS:', localStorageAgents);
  console.log('📊 SESSION STORAGE AGENTS:', sessionStorageAgents);
  console.log('🌍 GLOBAL AGENT VARIABLES:', globalAgentVars);
  console.log('🔍 SUSPICIOUS GLOBALS:', suspiciousGlobals);
  
  // Check React DevTools global state (if available)
  try {
    // @ts-ignore
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log('🔧 React DevTools detected - checking for cached state...');
    }
  } catch (e) {
    // Ignore
  }
  
  const totalSources = localStorageAgents.length + sessionStorageAgents.length + globalAgentVars.length + suspiciousGlobals.length;
  
  if (totalSources === 0) {
    console.log('✅ EXCELLENT: No cached, global, or stored agent data found');
    console.log('🔥 CRITICAL: If agents still appear, they are hardcoded in React components or API responses!');
  } else {
    console.error('🔥 FOUND CACHED/GLOBAL AGENT DATA - This is likely the source of hardcoded agents!');
    console.error(`📊 Total suspicious sources found: ${totalSources}`);
    console.error('🧹 SOLUTION: Clear browser storage and check global variables');
  }
  
  // Additional debugging: Check if any modules export default agents
  console.log('🔍 CHECKING: Component state and module exports...');
  console.log('🔥 NOTE: If agents appear but all above is empty, check React component state and module exports');
  
  return {
    localStorage: localStorageAgents,
    sessionStorage: sessionStorageAgents,
    globals: globalAgentVars,
    suspicious: suspiciousGlobals,
    totalSources
  };
};

// Auto-run debug on import
const debugResults = debugAgentSources();

// Export for manual debugging
export { debugResults };
