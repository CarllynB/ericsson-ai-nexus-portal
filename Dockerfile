
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    ca-certificates \
    tzdata

# Set timezone
ENV TZ=UTC

# Copy package files
COPY package*.json ./

# Install dependencies with production optimizations
RUN npm ci --only=production --silent

# Copy source code
COPY . .

# Build the application for production
RUN npm run build

# Verify build output
RUN ls -la dist/

# Copy SSL certificates (if they exist)
COPY aiduagent-csstip.ckit1.explab.com.crt* ./
COPY aiduagent-csstip.ckit1.explab.com.key* ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=443

# Expose HTTPS port
EXPOSE 443

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider https://localhost:443/api/health || exit 1

# Start the production server
CMD ["node", "server.js"]
