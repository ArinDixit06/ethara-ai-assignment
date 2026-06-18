# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifests first for better layer caching
COPY package*.json ./
COPY prisma ./prisma

# Install ALL deps (including devDependencies needed to compile)
RUN npm ci

# Copy source and build
COPY . .
RUN npx prisma generate
RUN npm run build

# ── Stage 2: Production ────────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Copy manifests
COPY package*.json ./
COPY prisma ./prisma

# Install production deps only
RUN npm ci --only=production

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Copy generated Prisma client (engine binaries + client JS)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 5000

# Run migrations then start server
# (prisma migrate deploy is idempotent and safe in production)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
