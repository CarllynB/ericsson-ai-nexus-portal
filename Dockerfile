
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Copy SSL certificates
COPY aiduagent-csstip.ckit1.explab.com.crt ./
COPY aiduagent-csstip.ckit1.explab.com.key ./

# Expose HTTPS port
EXPOSE 443

# Start the server
CMD ["node", "server.js"]
