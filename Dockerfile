# Stage 1: Build the Next.js app
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Set memory limit for Node.js
ENV NODE_OPTIONS="--max-old-space-size=1024"

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Install dependencies with cache cleaning
RUN npm ci --only=production --silent && \
    npm cache clean --force

# Copy source code
COPY . .

# Set build environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_FONT_GOOGLE_SKIP_DOWNLOAD=1
ARG NEXT_PUBLIC_PARSE_APPLICATION_ID=""
ARG NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY=""
ARG NEXT_PUBLIC_PARSE_SERVER_URL=""
ENV NEXT_PUBLIC_PARSE_APPLICATION_ID=$NEXT_PUBLIC_PARSE_APPLICATION_ID
ENV NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY=$NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY
ENV NEXT_PUBLIC_PARSE_SERVER_URL=$NEXT_PUBLIC_PARSE_SERVER_URL

# Build the application
RUN npm run build && \
    npm prune --production

# Stage 2: Production runtime
FROM node:20-alpine AS runtime

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy only necessary files from builder
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV PORT=3000
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "server.js"]