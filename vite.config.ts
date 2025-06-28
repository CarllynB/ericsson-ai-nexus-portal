
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";

// Check if SSL certificates exist
const sslCertExists = fs.existsSync('./aiduagent-csstip.ckit1.explab.com.crt');
const sslKeyExists = fs.existsSync('./aiduagent-csstip.ckit1.explab.com.key');

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    https: sslCertExists && sslKeyExists ? {
      cert: fs.readFileSync('./aiduagent-csstip.ckit1.explab.com.crt'),
      key: fs.readFileSync('./aiduagent-csstip.ckit1.explab.com.key'),
    } : undefined,
    cors: true,
    // Remove proxy - we'll handle API routes directly in the same server
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    // Custom plugin to integrate Express backend
    {
      name: 'integrated-backend',
      configureServer(server) {
        // Import and set up the Express app
        const { app } = require('./src/server/index.ts');
        server.middlewares.use('/api', app);
      }
    }
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
}));
