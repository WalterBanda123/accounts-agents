# Accounts Agents - Minikube Deployment Guide

This guide will help you deploy the Accounts Agents Ionic React app to Minikube using Docker containers.

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Docker Desktop** - [Install Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. **Minikube** - [Install Minikube](https://minikube.sigs.k8s.io/docs/start/)
3. **kubectl** - [Install kubectl](https://kubernetes.io/docs/tasks/tools/)

### Install Minikube on macOS

```bash
# Using Homebrew
brew install minikube

# Or using curl
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-darwin-amd64
sudo install minikube-darwin-amd64 /usr/local/bin/minikube
```

## Quick Start

### Option 1: Automated Deployment

Run the automated deployment script:

```bash
./deploy-minikube.sh
```

This script will:
- Start Minikube if not running
- Enable the ingress addon
- Build the Docker image locally
- Deploy the app to Kubernetes
- Provide access instructions

### Option 2: Manual Deployment

1. **Start Minikube**
   ```bash
   minikube start --driver=docker
   ```

2. **Enable ingress addon**
   ```bash
   minikube addons enable ingress
   ```

3. **Set Docker environment to use Minikube's Docker daemon**
   ```bash
   eval $(minikube docker-env)
   ```

4. **Build the Docker image**
   ```bash
   docker build -t accounts-agents:latest .
   ```

5. **Deploy to Kubernetes**
   ```bash
   kubectl apply -f k8s/configmap.yaml
   kubectl apply -f k8s/deployment.yaml
   ```

6. **Wait for deployment**
   ```bash
   kubectl wait --for=condition=available --timeout=300s deployment/accounts-agents-app
   ```

7. **Add to /etc/hosts**
   ```bash
   echo "$(minikube ip) accounts-agents.local" | sudo tee -a /etc/hosts
   ```

8. **Access the app**
   Open http://accounts-agents.local in your browser

## Docker Image Structure

The Docker image uses a multi-stage build:

1. **Builder stage**: Builds the Ionic React app using Node.js
2. **Production stage**: Serves the built app using Nginx

### Key features:
- Optimized for production with gzip compression
- Health check endpoint at `/health`
- Security headers configured
- Client-side routing support
- Static asset caching

## Kubernetes Resources

The deployment includes:

### Deployment (`k8s/deployment.yaml`)
- 2 replica pods for high availability
- Resource limits and requests
- Liveness and readiness probes
- Rolling update strategy

### Service
- ClusterIP service exposing port 80
- Load balances traffic between pods

### Ingress
- Routes external traffic to the service
- Configured for `accounts-agents.local`

### ConfigMap (`k8s/configmap.yaml`)
- Environment variables for the app
- Easily configurable for different environments

## GitHub Actions CI/CD

The included GitHub Actions workflow (`.github/workflows/docker-build.yml`) will:

1. **On every push/PR**: Run tests and linting
2. **On merge to master/main**: 
   - Build multi-platform Docker image (AMD64 and ARM64)
   - Push to GitHub Container Registry
   - Generate build attestation for security

### Setup GitHub Actions

1. **Enable GitHub Packages**: The workflow uses GitHub Container Registry (ghcr.io)
2. **Update image name**: In `k8s/deployment.yaml`, replace `yourusername` with your GitHub username:
   ```yaml
   image: ghcr.io/yourusername/accounts-agents:latest
   ```

## Useful Commands

### Minikube Commands
```bash
# Start Minikube
minikube start

# Get Minikube IP
minikube ip

# Open Minikube dashboard
minikube dashboard

# Stop Minikube
minikube stop

# Delete Minikube cluster
minikube delete
```

### Kubernetes Commands
```bash
# Check pod status
kubectl get pods

# Check services
kubectl get services

# Check ingress
kubectl get ingress

# View pod logs
kubectl logs -l app=accounts-agents

# Port forward for local testing (alternative to ingress)
kubectl port-forward service/accounts-agents-service 8080:80

# Restart deployment (useful after rebuilding image)
kubectl rollout restart deployment/accounts-agents-app

# Scale deployment
kubectl scale deployment accounts-agents-app --replicas=3
```

### Docker Commands
```bash
# Build image
docker build -t accounts-agents:latest .

# Run locally for testing
docker run -p 8080:80 accounts-agents:latest

# Remove unused images
docker image prune
```

## Development Workflow

1. **Make changes** to your Ionic React app
2. **Test locally** using `npm run dev`
3. **Commit and push** to trigger CI/CD pipeline
4. **For local testing in Minikube**:
   ```bash
   # Set Minikube Docker env
   eval $(minikube docker-env)
   
   # Rebuild image
   docker build -t accounts-agents:latest .
   
   # Restart deployment
   kubectl rollout restart deployment/accounts-agents-app
   ```

## Troubleshooting

### Common Issues

1. **Ingress not working**
   - Ensure ingress addon is enabled: `minikube addons enable ingress`
   - Check if entry is in /etc/hosts: `cat /etc/hosts | grep accounts-agents`

2. **Image pull errors**
   - For local images, ensure you're using Minikube's Docker daemon: `eval $(minikube docker-env)`
   - For registry images, check if the image exists and is accessible

3. **Pod not starting**
   - Check pod logs: `kubectl logs -l app=accounts-agents`
   - Check events: `kubectl get events --sort-by=.metadata.creationTimestamp`

4. **Port conflicts**
   - If port 80 is in use, modify the service port in `k8s/deployment.yaml`

### Logs and Debugging
```bash
# View application logs
kubectl logs -f deployment/accounts-agents-app

# Describe deployment for issues
kubectl describe deployment accounts-agents-app

# Get detailed pod information
kubectl describe pod -l app=accounts-agents

# Check ingress controller logs
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller
```

## Environment Configuration

Modify `k8s/configmap.yaml` to add environment-specific configurations:

```yaml
data:
  REACT_APP_API_URL: "http://api.accounts-agents.local"
  REACT_APP_ENVIRONMENT: "production"
  # Add more environment variables as needed
```

For sensitive data, use Secrets:

```bash
# Create secret from command line
kubectl create secret generic app-secrets --from-literal=api-key=your-secret-key

# Or update the secret in k8s/configmap.yaml (base64 encoded)
echo -n 'your-secret-value' | base64
```

## Production Considerations

For production deployments, consider:

1. **Use proper domain names** instead of `.local`
2. **Set up TLS/SSL certificates**
3. **Configure proper resource limits**
4. **Set up monitoring and logging**
5. **Use persistent volumes** if needed
6. **Implement proper backup strategies**
7. **Use namespaces** for environment separation

## Next Steps

- Set up monitoring with Prometheus and Grafana
- Implement logging with ELK stack
- Add database connectivity if needed
- Set up CI/CD for multiple environments
- Implement blue-green or canary deployments
