# Multi-stage Dockerfile for Frontend
# Stage 1: Build dependencies (cached layer)
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files for dependency caching
COPY package*.json ./
RUN npm ci --prefer-offline --no-audit --no-fund

# Stage 2: Build application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy cached dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 3: Production server (nginx)
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Stage 4: Development server
FROM node:20-alpine AS development
WORKDIR /app

# Copy cached dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]