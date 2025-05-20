import express from 'express';
import http from 'http';
import path from 'path';
import { Server  } from 'socket.io';
import Redis from 'ioredis';

// Create Redis clients
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const redisClient = new Redis(redisUrl);
const redisPub = new Redis(redisUrl);
const redisSub = new Redis(redisUrl);

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Serve static files
app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Redis channels
const CHAT_CHANNEL = "chat:room";
const AI_CHANNEL = "chat:ai";

// Subscribe to Redis channels
redisSub.subscribe(CHAT_CHANNEL, AI_CHANNEL);

// Handle Redis messages
redisSub.on("message", (channel, message) => {
  
  io.emit(channel, JSON.parse(message));
});

// Socket.io connection handling
io.on("connection", (socket) => {

  // Send a welcome message
  redisPub.publish(
    CHAT_CHANNEL,
    JSON.stringify({
      id: "System",
      message: `Welcome ${socket.id} to the chat room!`,
      timestamp: new Date().toISOString(),
    }),
  );

  // Handle chat messages
  socket.on("chat", (payload) => {
    redisPub.publish(
      CHAT_CHANNEL,
      JSON.stringify({
        id: socket.id,
        message: payload.message,
        timestamp: new Date().toISOString(),
      }),
    );

    // Simulate Augment AI response
    setTimeout(() => {
      redisPub.publish(
        AI_CHANNEL,
        JSON.stringify({
          id: "Augment AI",
          message: `I received your message: "${payload.message}". I'm here to help with coding tasks.`,
          timestamp: new Date().toISOString(),
          isAI: true,
        }),
      );
    }, 1000);
  });

  // Handle AI-specific messages
  socket.on("ai", (payload) => {
    redisPub.publish(
      AI_CHANNEL,
      JSON.stringify({
        id: socket.id,
        message: payload.message,
        timestamp: new Date().toISOString(),
        isAI: true,
      }),
    );
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {

});
export {};
