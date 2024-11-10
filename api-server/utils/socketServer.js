const { Server } = require("socket.io");
const Redis = require("ioredis");

const subscriber = new Redis(process.env.REDIS_URL);
const io = new Server({ cors: "*" });

io.on("connection", (socket) => {
  socket.on("subscribe", (channel) => {
    socket.join(channel);
    socket.emit("message", `Joined ${channel}`);
  });
});

async function initRedisSubscribe() {
  console.log("---> Redis Logs Running");
  subscriber.psubscribe("logs:*");
  subscriber.on("pmessage", (pattern, channel, message) => {
    io.to(channel).emit("message", message);
  });
}

io.listen(9002, () => console.log("Socket Server running on port 9002"));

module.exports = initRedisSubscribe;
