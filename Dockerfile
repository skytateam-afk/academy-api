# Multi-stage Dockerfile for SchoolBox Platform
# Builds API, Frontend, and Admin in separate stages

# ============================================================================
# API Stage
# ============================================================================
FROM node:18-alpine AS api-build

WORKDIR /app/api

COPY lms-api/package*.json ./
RUN npm ci --only=production

COPY lms-api/ ./

EXPOSE 3000

CMD ["node", "server.js"]

# ============================================================================
# Frontend Stage
# ============================================================================
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

COPY lms-frontend/package*.json ./
RUN npm ci

COPY lms-frontend/ ./
RUN npm run build

# ============================================================================
# Admin Stage
# ============================================================================
FROM node:18-alpine AS admin-build

WORKDIR /app/admin

COPY lms-admin/package*.json ./
RUN npm ci

COPY lms-admin/ ./
RUN npm run build

# ============================================================================
# Production Stage - Nginx serving Frontend and Admin
# ============================================================================
FROM nginx:alpine AS production

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built frontend
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html/student

# Copy built admin
COPY --from=admin-build /app/admin/dist /usr/share/nginx/html/admin

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
