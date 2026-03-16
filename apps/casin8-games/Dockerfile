FROM node:20-alpine

WORKDIR /app

COPY . .

# Use pnpm and optionally build the Poker Room frontend if present
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate
RUN if [ -d "AI-ARCADE.XYZ---POKER-ROOM" ]; then cd "AI-ARCADE.XYZ---POKER-ROOM" && pnpm install && pnpm run build; fi

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server.js"]
