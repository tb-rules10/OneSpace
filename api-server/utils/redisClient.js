const Redis = require("ioredis");
const { Server } = require("socket.io");

const subscriber = new Redis(process.env.REDIS_URL);
const io = new Server({ cors: "*" });

const initRedisSubscribe = () => {
  subscriber.psubscribe("logs:*");
  subscriber.on("pmessage", (pattern, channel, message) => {
    io.to(channel).emit("message", message);
  });
};

const startSocketServer = (port) => {
  io.listen(port, () => console.log(`Socket Server Running - ${port}`));
};

module.exports = { initRedisSubscribe, startSocketServer };
