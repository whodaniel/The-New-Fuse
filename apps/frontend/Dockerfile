FROM node:18-alpine AS runtime
WORKDIR /app
RUN npm install -g serve
COPY apps/frontend/dist ./dist
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
CMD ["serve", "-s", "dist", "-l", "3000"]
