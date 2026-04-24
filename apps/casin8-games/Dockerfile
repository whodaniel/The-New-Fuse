FROM node:20-slim
WORKDIR /app

# Copy all source files that server.js requires/imports
COPY package.json ./
RUN npm install --production
COPY server.js ./
COPY risk-db.js ./
COPY db-store.js ./
COPY engine.mjs ./

# Copy all dynamic-imported module directories
COPY shared/ ./shared/
COPY core-logic/ ./core-logic/
COPY swarm/ ./swarm/

# Copy docs only if present (not required for runtime)
# docs/ is in .dockerignore, so skip it here

ENV PORT=8080
ENV NODE_ENV=production
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:8080/api/health || exit 1

CMD ["node", "server.js"]
