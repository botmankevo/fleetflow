FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy application code needed for build
COPY frontend/app ./app
COPY frontend/next-env.d.ts frontend/tsconfig.json ./

# Build Next.js
RUN npm run build

# Expose port
EXPOSE 3000

# Run Next.js
CMD ["npm", "run", "dev"]
