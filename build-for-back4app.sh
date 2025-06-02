#!/bin/bash

# Back4App Optimized Build Script
echo "Building optimized Docker image for Back4App deployment..."

# Set your Parse credentials here
export NEXT_PUBLIC_PARSE_APPLICATION_ID="ANMG78uEmA9lBZl0nXVyzkpMlGbd6lfMZHv7EoYs"
export NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY="vU3qaW4YBS4wwlWXrIcPjwxEsmT1BQYp6O9DANPJ" 
export NEXT_PUBLIC_PARSE_SERVER_URL="https://parseapi.back4app.com/parse"

# Build with memory constraints and optimizations
echo "Building with memory optimizations..."
docker build \
  --memory=1g \
  --memory-swap=2g \
  --build-arg NEXT_PUBLIC_PARSE_APPLICATION_ID="$NEXT_PUBLIC_PARSE_APPLICATION_ID" \
  --build-arg NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY="$NEXT_PUBLIC_PARSE_JAVASCRIPT_KEY" \
  --build-arg NEXT_PUBLIC_PARSE_SERVER_URL="$NEXT_PUBLIC_PARSE_SERVER_URL" \
  --no-cache \
  -t event-manager-frontend:back4app \
  .

echo "Build complete! Image size:"
docker images event-manager-frontend:back4app --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

echo ""
echo "To test locally:"
echo "docker run -p 3000:3000 event-manager-frontend:back4app"
echo ""
echo "The image is now optimized for Back4App deployment!" 