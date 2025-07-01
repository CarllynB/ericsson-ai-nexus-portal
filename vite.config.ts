
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";

// Domain-specific configuration
const DOMAIN = 'aiduagent-csstip.ckit1.explab.com';
const SSL_CERT_PATH = './aiduagent-csstip.ckit1.explab.com.crt';
const SSL_KEY_PATH = './aiduagent-csstip.ckit1.explab.com.key';

// Check if SSL certificates exist
const sslCertExists = fs.existsSync(SSL_CERT_PATH);
const sslKeyExists = fs.existsSync(SSL_KEY_PATH);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    // Use HTTPS with SSL certificates if they exist
    https: sslCertExists && sslKeyExists ? {
      cert: fs.readFileSync(SSL_CERT_PATH),
      key: fs.readFileSync(SSL_KEY_PATH)
    } : undefined,
    cors: true,
    // Proxy API requests to the backend server on the same domain
    proxy: {
      '/api': {
        target: sslCertExists && sslKeyExists ? `https://${DOMAIN}:8081` : 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
        rejectUnauthorized: false
      }
    }
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
