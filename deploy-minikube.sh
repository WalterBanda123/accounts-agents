#!/bin/bash

# Minikube deployment script for Accounts Agents app

set -e

echo "🚀 Starting Minikube deployment for Accounts Agents"

# Check if minikube is running
if ! minikube status > /dev/null 2>&1; then
    echo "⚠️  Minikube is not running. Starting Minikube..."
    minikube start --driver=docker
fi

# Enable ingress addon
echo "🔧 Enabling ingress addon..."
minikube addons enable ingress

# Set docker environment to use minikube's docker daemon
echo "🐳 Setting Docker environment to use Minikube's Docker daemon..."
eval $(minikube docker-env)

# Build the Docker image locally in Minikube
echo "🏗️  Building Docker image locally in Minikube..."
docker build -t accounts-agents:latest .

# Apply Kubernetes manifests
echo "📦 Applying Kubernetes manifests..."
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml

# Wait for deployment to be ready
echo "⏳ Waiting for deployment to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/accounts-agents-app

# Get Minikube IP
MINIKUBE_IP=$(minikube ip)

# Add entry to /etc/hosts (requires sudo)
echo "🌐 Adding entry to /etc/hosts..."
echo "Please add the following line to your /etc/hosts file:"
echo "$MINIKUBE_IP accounts-agents.local"
echo ""
echo "You can do this by running:"
echo "echo '$MINIKUBE_IP accounts-agents.local' | sudo tee -a /etc/hosts"

# Display access information
echo "✅ Deployment complete!"
echo ""
echo "🌍 Access your app at: http://accounts-agents.local"
echo "📊 Minikube dashboard: minikube dashboard"
echo "🔍 Check pods: kubectl get pods"
echo "📋 Check services: kubectl get services"
echo "🔄 Check ingress: kubectl get ingress"
echo ""
echo "To update the app after making changes:"
echo "1. Rebuild the image: eval \$(minikube docker-env) && docker build -t accounts-agents:latest ."
echo "2. Restart the deployment: kubectl rollout restart deployment/accounts-agents-app"
