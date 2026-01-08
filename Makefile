.PHONY: help install dev build test clean docker

# Simple, straightforward commands
help:
	@echo "Skyta Academy Platform Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make install          Install all dependencies"
	@echo "  make setup            Full setup (install + db)"
	@echo ""
	@echo "Development:"
	@echo "  make dev              Start all services"
	@echo "  make api              Start API only"
	@echo "  make frontend         Start frontend only"
	@echo "  make admin            Start admin only"
	@echo ""
	@echo "Testing:"
	@echo "  make test             Run all tests"
	@echo "  make test-watch       Run tests in watch mode"
	@echo ""
	@echo "Database:"
	@echo "  make db-migrate       Run migrations"
	@echo "  make db-seed          Seed database"
	@echo "  make db-reset         Reset database"
	@echo ""
	@echo "Docker:"
	@echo "  make docker           Start with Docker"
	@echo "  make docker-stop      Stop Docker services"
	@echo "  make docker-logs      View Docker logs"
	@echo ""
	@echo "Build & Deploy:"
	@echo "  make build            Build all projects"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean            Clean all artifacts"
	@echo "  make logs             View API logs"
	@echo ""

# Installation
install:
	@cd lms-api && npm install
	@cd lms-frontend && npm install
	@cd lms-admin && npm install

setup: install db-migrate db-seed

# Development
dev:
	@trap 'kill 0' INT; \
	(cd lms-api && npm run dev) & \
	(cd lms-frontend && npm run dev) & \
	(cd lms-admin && npm run dev -- --port 5174) & \
	wait

api:
	@cd lms-api && npm run dev

frontend:
	@cd lms-frontend && npm run dev

admin:
	@cd lms-admin && npm run dev -- --port 5174

# Testing
test:
	@cd lms-api && npm test

test-watch:
	@cd lms-api && npm run test:watch

# Database
db-migrate:
	@cd lms-api && npx knex migrate:latest

db-seed:
	@cd lms-api && npx knex seed:run

db-reset:
	@cd lms-api && npx knex migrate:rollback --all
	@cd lms-api && npx knex migrate:latest
	@cd lms-api && npx knex seed:run

# Docker
docker:
	@docker-compose up -d

docker-stop:
	@docker-compose down

docker-logs:
	@docker-compose logs -f

docker-clean:
	@docker-compose down -v

# Build
build:
	@cd lms-frontend && npm run build
	@cd lms-admin && npm run build

# Utilities
clean:
	@rm -rf lms-api/node_modules lms-api/dist
	@rm -rf lms-frontend/node_modules lms-frontend/dist
	@rm -rf lms-admin/node_modules lms-admin/dist

logs:
	@cd lms-api && tail -f logs/combined.log 2>/dev/null || echo "No logs found"
