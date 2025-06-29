
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { addNovaToSidebar } from './utils/populateAgents';

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
setTimeout(() => {
  addNovaToSidebar().catch(console.error);
}, 1000);
