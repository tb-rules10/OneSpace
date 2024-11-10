require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Redis = require("ioredis");
const { Server } = require("socket.io");
const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const playgroundRoutes = require("./routes/playgroundRoutes");

const PORT = process.env.PORT || 9000;
const app = express();
const subscriber = new Redis(process.env.REDIS_URL);
const io = new Server({ cors: "*" });

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/user", userRoutes);
app.use("/projects", projectRoutes);
app.use("/pg", playgroundRoutes);

// Initialize Redis and Socket.io
const initRedisSubscribe = async () => {
  console.log("---> Redis Logs Running");
  subscriber.psubscribe("logs:*");
  subscriber.on("pmessage", (pattern, channel, message) => {
    io.to(channel).emit("message", message);
  });
};

io.on("connection", (socket) => {
  socket.on("subscribe", (channel) => {
    socket.join(channel);
    socket.emit("message", `Joined ${channel}`);
  });
});

// Start Redis and Socket.io listeners
initRedisSubscribe();
io.listen(9002, () => console.log("Socket Server running on port 9002"));

// Start the API server
app.listen(PORT, () => console.log(`API Server running on port ${PORT}`));
