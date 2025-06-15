#!/bin/bash

# Docker build script for User Service

set -e

echo "🐳 Building User Service Docker Image"

# Default values
IMAGE_NAME="user-service-backend"
TAG="latest"
BUILD_ARGS=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -t|--tag)
      TAG="$2"
      shift 2
      ;;
    -n|--name)
      IMAGE_NAME="$2"
      shift 2
      ;;
    --build-arg)
      BUILD_ARGS="$BUILD_ARGS --build-arg $2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 [OPTIONS]"
      echo "Options:"
      echo "  -t, --tag TAG       Tag for the Docker image (default: latest)"
      echo "  -n, --name NAME     Name for the Docker image (default: user-service-backend)"
      echo "  --build-arg ARG     Build argument to pass to docker build"
      echo "  -h, --help          Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

FULL_IMAGE_NAME="${IMAGE_NAME}:${TAG}"

echo "Building image: ${FULL_IMAGE_NAME}"

# Build the Docker image
docker build $BUILD_ARGS -t $FULL_IMAGE_NAME .

echo "✅ Docker image built successfully: ${FULL_IMAGE_NAME}"

# Show image details
echo ""
echo "📊 Image Information:"
docker images $IMAGE_NAME --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"

echo ""
echo "🚀 To run the container:"
echo "docker run -p 3000:3000 --env-file .env $FULL_IMAGE_NAME"
echo ""
echo "🧪 To run with docker-compose:"
echo "docker-compose up"
