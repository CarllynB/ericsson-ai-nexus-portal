
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const https = require('https');
const fs = require('fs');

const app = express();

// Proxy all requests to Vite dev server
app.use('/', createProxyMiddleware({
  target: 'http://localhost:8080',
  changeOrigin: true,
  ws: true, // Enable websocket proxying for HMR
}));

// HTTPS Configuration
const httpsOptions = {
  cert: fs.readFileSync('./aiduagent-csstip.ckit1.explab.com.crt'),
  key: fs.readFileSync('./aiduagent-csstip.ckit1.explab.com.key') // You'll need to get this file
};

const PORT = 443;

https.createServer(httpsOptions, app).listen(PORT, '0.0.0.0', () => {
  console.log(`HTTPS Proxy Server running on port ${PORT}`);
  console.log(`Access your app at: https://aiduagent-csstip.ckit1.explab.com/`);
  console.log(`Proxying to Vite dev server at http://localhost:8080`);
});
