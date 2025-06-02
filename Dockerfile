# Stage 1: Build the Next.js app
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Set memory limit for Node.js
ENV NODE_OPTIONS="--max-old-space-size=1024"

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Install ALL dependencies (including dev) for building
RUN npm ci --silent && \
    npm cache clean --force

# Copy all necessary files for build
COPY . .

# Set build environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_FONT_GOOGLE_SKIP_DOWNLOAD=1

# Build the application
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine AS runtime

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy package.json for node_modules reference
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./

# Copy the standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static files
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy public directory
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV PORT=3000
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]