# Deployment Guide

## Docker Deployment

### Quick Start with Docker Compose

```bash
# Production deployment
docker-compose up -d

# Development with hot reload
docker-compose -f docker-compose.dev.yml up -d
```

### Manual Docker Build & Run

```bash
# Build image
./scripts/docker-build.sh -t v1.0.0

# Run container
./scripts/docker-run.sh -d
```

### Environment Variables

Required environment variables for production:

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://mongodb:27017/user_service
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=https://yourdomain.com
API_DOCS_ENABLED=false
```

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (1.20+)
- kubectl configured
- Ingress controller (nginx)
- Cert-manager (for TLS)

### Deploy to Kubernetes

```bash
# Apply all manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n user-service
kubectl get services -n user-service
kubectl get ingress -n user-service
```

### Update Deployment

```bash
# Update image
kubectl set image deployment/user-service-deployment user-service=your-registry/user-service-backend:v1.1.0 -n user-service

# Check rollout status
kubectl rollout status deployment/user-service-deployment -n user-service
```

## CI/CD Pipeline

### GitHub Actions

The repository includes two workflows:

1. **CI Pipeline** (`.github/workflows/ci.yml`)
   - Runs on push/PR to main/develop
   - Linting, type checking, testing
   - Security scanning
   - Docker image build

2. **Deployment Pipeline** (`.github/workflows/deploy.yml`)
   - Runs on push to main or tags
   - Deploys to production
   - Health checks

### Required Secrets

Configure these secrets in GitHub repository settings:

```
DOCKER_USERNAME         # Docker Hub username
DOCKER_PASSWORD         # Docker Hub password
HOST                   # Production server IP
USERNAME               # SSH username
SSH_PRIVATE_KEY        # SSH private key
PORT                   # SSH port (default: 22)
SNYK_TOKEN            # Snyk security token
SLACK_WEBHOOK         # Slack notification webhook
```

## Production Setup

### Server Requirements

- Node.js 18+
- MongoDB 6.0+
- 2GB RAM minimum
- 1 CPU core minimum

### Security Checklist

- [ ] Use strong JWT secret
- [ ] Enable HTTPS/TLS
- [ ] Configure firewall
- [ ] Set up monitoring
- [ ] Enable log aggregation
- [ ] Regular security updates
- [ ] Database authentication
- [ ] Rate limiting configured

### Monitoring

#### Health Endpoints

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system status
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

#### Metrics Collection

Consider integrating with:
- Prometheus for metrics
- Grafana for dashboards
- ELK stack for logs
- Sentry for error tracking

### Backup Strategy

#### Database Backup

```bash
# MongoDB backup
mongodump --uri="mongodb://localhost:27017/user_service" --out=backup/

# Restore
mongorestore --uri="mongodb://localhost:27017/user_service" backup/user_service/
```

#### Application Backup

- Source code: Git repository
- Environment config: Secure storage
- SSL certificates: Automated renewal
- Database: Daily automated backups

## Troubleshooting

### Common Issues

1. **Container won't start**
   - Check environment variables
   - Verify MongoDB connection
   - Check application logs

2. **Database connection failed**
   - Verify MongoDB is running
   - Check connection string
   - Verify network connectivity

3. **Health check failures**
   - Check application startup time
   - Verify health endpoints
   - Check resource limits

### Debugging Commands

```bash
# Docker logs
docker logs user-service

# Kubernetes logs
kubectl logs -f deployment/user-service-deployment -n user-service

# Container shell access
docker exec -it user-service sh
kubectl exec -it deployment/user-service-deployment -n user-service -- sh

# Test health endpoints
curl http://localhost:3000/health
curl http://localhost:3000/health/detailed
```
