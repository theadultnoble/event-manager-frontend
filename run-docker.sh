#!/bin/bash

# Event Manager Frontend Docker Runner
# Replace the environment variables below with your actual Parse Server credentials

echo "Starting Event Manager Frontend Docker Container..."

# Replace these with your actual Parse Server credentials:
# - Get these from your Parse Server dashboard (Back4App, Self-hosted, etc.)
export NEXT_PUBLIC_PARSE_APPLICATION_ID="ANMG78uEmA9lBZl0nXVyzkpMlGbd6lfMZHv7EoYs"
export NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY="vU3qaW4YBS4wwlWXrIcPjwxEsmT1BQYp6O9DANPJ" 
export NEXT_PUBLIC_PARSE_SERVER_URL="https://parseapi.back4app.com/parse"

# Stop any existing container on port 3000
echo "Stopping any existing containers..."
docker stop $(docker ps -q --filter "publish=3000") 2>/dev/null || true

# Debug: Show environment variables being passed
echo "Environment variables being passed to build:"
echo "APP_ID: $NEXT_PUBLIC_PARSE_APPLICATION_ID"
echo "JS_KEY: $NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY"
echo "SERVER_URL: $NEXT_PUBLIC_PARSE_SERVER_URL"

# Build the Docker image with environment variables
echo "Building Docker image with Parse credentials..."
docker build -t event-manager-frontend \
  --build-arg NEXT_PUBLIC_PARSE_APPLICATION_ID="$NEXT_PUBLIC_PARSE_APPLICATION_ID" \
  --build-arg NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY="$NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY" \
  --build-arg NEXT_PUBLIC_PARSE_SERVER_URL="$NEXT_PUBLIC_PARSE_SERVER_URL" \
  .

# Run the container
echo "Running container on http://localhost:3000"
docker run -p 3000:3000 event-manager-frontend 