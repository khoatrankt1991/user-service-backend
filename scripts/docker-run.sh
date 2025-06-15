#!/bin/bash

# Docker run script for User Service

set -e

echo "🚀 Running User Service Docker Container"

# Default values
IMAGE_NAME="user-service-backend:latest"
CONTAINER_NAME="user-service"
PORT="3000"
ENV_FILE=".env"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -i|--image)
      IMAGE_NAME="$2"
      shift 2
      ;;
    -n|--name)
      CONTAINER_NAME="$2"
      shift 2
      ;;
    -p|--port)
      PORT="$2"
      shift 2
      ;;
    -e|--env-file)
      ENV_FILE="$2"
      shift 2
      ;;
    -d|--detach)
      DETACH="-d"
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [OPTIONS]"
      echo "Options:"
      echo "  -i, --image IMAGE   Docker image to run (default: user-service-backend:latest)"
      echo "  -n, --name NAME     Container name (default: user-service)"
      echo "  -p, --port PORT     Port to expose (default: 3000)"
      echo "  -e, --env-file FILE Environment file (default: .env)"
      echo "  -d, --detach        Run container in background"
      echo "  -h, --help          Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

# Check if container is already running
if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    echo "⚠️  Container $CONTAINER_NAME is already running"
    echo "🔄 Stopping existing container..."
    docker stop $CONTAINER_NAME
    docker rm $CONTAINER_NAME
fi

# Check if env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "⚠️  Environment file $ENV_FILE not found"
    echo "📝 Creating from .env.example..."
    cp .env.example $ENV_FILE
fi

echo "🐳 Starting container..."
echo "  Image: $IMAGE_NAME"
echo "  Container: $CONTAINER_NAME"
echo "  Port: $PORT"
echo "  Env file: $ENV_FILE"

# Run the container
docker run \
  $DETACH \
  --name $CONTAINER_NAME \
  -p $PORT:3000 \
  --env-file $ENV_FILE \
  --restart unless-stopped \
  $IMAGE_NAME

if [ -z "$DETACH" ]; then
    echo ""
    echo "📋 Container logs will appear above"
    echo "🛑 Press Ctrl+C to stop the container"
else
    echo ""
    echo "✅ Container started in background"
    echo "📋 View logs: docker logs -f $CONTAINER_NAME"
    echo "🛑 Stop container: docker stop $CONTAINER_NAME"
    echo "🌐 Health check: curl http://localhost:$PORT/health"
fi
