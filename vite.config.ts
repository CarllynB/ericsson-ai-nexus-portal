
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";

// Check if SSL certificates exist (look for mkcert generated files)
const sslCertExists = fs.existsSync('./localhost.pem') || fs.existsSync('./aiduagent-csstip.ckit1.explab.com.crt');
const sslKeyExists = fs.existsSync('./localhost-key.pem') || fs.existsSync('./aiduagent-csstip.ckit1.explab.com.key');

// Check if we're in offline mode
const isOfflineMode = process.env.VITE_OFFLINE_MODE === 'true';

// Determine which certificates to use
const getCertificates = () => {
  if (fs.existsSync('./localhost.pem') && fs.existsSync('./localhost-key.pem')) {
    return {
      cert: fs.readFileSync('./localhost.pem'),
      key: fs.readFileSync('./localhost-key.pem'),
    };
  } else if (fs.existsSync('./aiduagent-csstip.ckit1.explab.com.crt') && fs.existsSync('./aiduagent-csstip.ckit1.explab.com.key')) {
    return {
      cert: fs.readFileSync('./aiduagent-csstip.ckit1.explab.com.crt'),
      key: fs.readFileSync('./aiduagent-csstip.ckit1.explab.com.key'),
    };
  }
  return undefined;
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // In offline mode, prefer HTTP to avoid mixed-content issues
    // Unless we have SSL certs available
    https: !isOfflineMode && sslCertExists && sslKeyExists ? getCertificates() : undefined,
    cors: true,
    // Proxy API calls to local Supabase when in development and offline mode
    proxy: mode === 'development' && isOfflineMode ? {
      '/api': {
        target: 'http://localhost:54321',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false
      }
    } : undefined,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  define: {
    'process.env.VITE_OFFLINE_MODE': JSON.stringify(process.env.VITE_OFFLINE_MODE || 'false'),
  },
}));
