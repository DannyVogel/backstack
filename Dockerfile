FROM node:24-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production image
FROM node:24-alpine

WORKDIR /app

# Copy built output
COPY --from=builder /app/.output .output
COPY --from=builder /app/package*.json ./

# Create data directory for SQLite
RUN mkdir -p /app/data

# Set environment
ENV NODE_ENV=production
ENV NITRO_DATABASE_PATH=/app/data/backstack.db

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
