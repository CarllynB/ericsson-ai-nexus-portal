
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
    port: mode === 'development' && sslCertExists && sslKeyExists ? 443 : 8080,
    https: mode === 'development' && sslCertExists && sslKeyExists ? {
      cert: fs.readFileSync('./aiduagent-csstip.ckit1.explab.com.crt'),
      key: fs.readFileSync('./aiduagent-csstip.ckit1.explab.com.key'),
    } : false,
    cors: true,
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
}));
