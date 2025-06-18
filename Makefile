# Makefile for Accounts Agents Minikube Deployment

.PHONY: help build deploy clean start stop restart logs status

# Default target
help:
	@echo "🚀 Accounts Agents Minikube Deployment"
	@echo ""
	@echo "Available commands:"
	@echo "  make build     - Build the Docker image"
	@echo "  make deploy    - Deploy to Minikube"
	@echo "  make start     - Start Minikube and deploy"
	@echo "  make stop      - Stop Minikube"
	@echo "  make restart   - Restart the application deployment"
	@echo "  make clean     - Clean up deployment"
	@echo "  make logs      - View application logs"
	@echo "  make status    - Show deployment status"
	@echo "  make dev       - Start local development server"
	@echo "  make test      - Run tests"

# Build Docker image
build:
	@echo "🏗️  Building Docker image..."
	eval $$(minikube docker-env) && docker build -t accounts-agents:latest .

# Deploy to Minikube
deploy:
	@echo "📦 Deploying to Minikube..."
	kubectl apply -f k8s/configmap.yaml
	kubectl apply -f k8s/deployment.yaml
	kubectl wait --for=condition=available --timeout=300s deployment/accounts-agents-app
	@echo "✅ Deployment complete!"
	@echo "🌍 Access your app at: http://accounts-agents.local"

# Start Minikube and deploy
start:
	@echo "🚀 Starting Minikube..."
	minikube start --driver=docker
	minikube addons enable ingress
	@make build
	@make deploy
	@echo ""
	@echo "Add to /etc/hosts:"
	@echo "$$(minikube ip) accounts-agents.local"

# Stop Minikube
stop:
	@echo "⏹️  Stopping Minikube..."
	minikube stop

# Restart application deployment
restart:
	@echo "🔄 Restarting deployment..."
	@make build
	kubectl rollout restart deployment/accounts-agents-app
	kubectl wait --for=condition=available --timeout=300s deployment/accounts-agents-app
	@echo "✅ Restart complete!"

# Clean up deployment
clean:
	@echo "🧹 Cleaning up deployment..."
	kubectl delete -f k8s/deployment.yaml --ignore-not-found=true
	kubectl delete -f k8s/configmap.yaml --ignore-not-found=true

# View logs
logs:
	@echo "📋 Viewing application logs..."
	kubectl logs -f -l app=accounts-agents

# Show deployment status
status:
	@echo "📊 Deployment Status:"
	@echo ""
	@echo "Pods:"
	kubectl get pods -l app=accounts-agents
	@echo ""
	@echo "Services:"
	kubectl get services -l app=accounts-agents
	@echo ""
	@echo "Ingress:"
	kubectl get ingress
	@echo ""
	@echo "Minikube Status:"
	minikube status

# Start local development
dev:
	@echo "🔧 Starting local development server..."
	npm run dev

# Run tests
test:
	@echo "🧪 Running tests..."
	npm run test.unit
	npm run lint
