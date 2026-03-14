FROM node:20-alpine

WORKDIR /app

COPY . .

# Build the graphical Poker Room frontend
RUN cd "AI-ARCADE.XYZ---POKER-ROOM" && npm install && npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server.js"]
