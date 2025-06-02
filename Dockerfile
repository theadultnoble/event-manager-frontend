# Stage 1: Build the Next.js app
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
# Skip font download during build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_FONT_GOOGLE_SKIP_DOWNLOAD=1
# Build with default or placeholder env vars
ARG NEXT_PUBLIC_PARSE_APPLICATION_ID
ARG NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY
ARG NEXT_PUBLIC_PARSE_SERVER_URL
RUN npm run build

# Stage 2: Run the Next.js app
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3000
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_FONT_GOOGLE_SKIP_DOWNLOAD=1
# These will be overridden at runtime with -e flags
ENV NEXT_PUBLIC_PARSE_APPLICATION_ID=""
ENV NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY=""
ENV NEXT_PUBLIC_PARSE_SERVER_URL=""
CMD ["npm", "start"]