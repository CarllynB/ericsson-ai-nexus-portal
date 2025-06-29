
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Add NOVA to sidebar after app loads (non-blocking)
// Only run in browser environment
if (typeof window !== 'undefined') {
  setTimeout(async () => {
    try {
      const { addNovaToSidebar } = await import('./utils/populateAgents');
      await addNovaToSidebar();
    } catch (error) {
      console.log('Could not add NOVA to sidebar:', error);
    }
  }, 2000);
}
