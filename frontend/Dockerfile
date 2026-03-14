FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies first for caching
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Build args for production baking
ARG NEXT_PUBLIC_API_BASE
ENV NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE

# Build the application
RUN npm run build

# ---
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Only copy necessary files for runtime
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Use npm start for production
CMD ["npm", "start"]
