DOCKER_COMPOSE_CMD := $(shell if command -v docker-compose > /dev/null 2>&1; then echo "docker-compose"; else echo "docker compose"; fi)


# Commands for Development Environment
start-dev:
	$(DOCKER_COMPOSE_CMD) -f docker-compose.dev.yml up --build -d
start-dev-backend:
	$(DOCKER_COMPOSE_CMD) -f docker-compose.dev.yml up -d mysql phpmyadmin backend
start-dev-frontend:
	$(DOCKER_COMPOSE_CMD) -f docker-compose.dev.yml up -d frontend
down-dev:
	$(DOCKER_COMPOSE_CMD) -f docker-compose.dev.yml down --rmi all

# Commands for Production Environment
start-prod:
	sudo chmod -R 777 db && $(DOCKER_COMPOSE_CMD) -f docker-compose.prod.yml up --build -d --remove-orphans

down-prod:
	$(DOCKER_COMPOSE_CMD) -f docker-compose.prod.yml down --rmi all
