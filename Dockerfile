# Build the React dashboard
FROM node:22-alpine AS frontend-builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . ./
RUN npm run build

# Run the API and serve the built dashboard from the same Railway service
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY server/ ./server/
COPY server.js ./
COPY db-credentials.js ./
COPY db-postgres.js ./
COPY --from=frontend-builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "server.js"]
