const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// يخدم ملفات public
app.use(express.static(path.join(__dirname, "public")));

let rooms = {};

io.on("connection", (socket) => {

  socket.on("createRoom", () => {
    const roomId = Math.floor(1000 + Math.random() * 9000).toString();

    rooms[roomId] = [];
    socket.join(roomId);

    rooms[roomId].push({
      id: socket.id,
      name: "SASUKE",
      host: true
    });

    socket.emit("roomCreated", roomId);
    io.to(roomId).emit("updatePlayers", rooms[roomId]);
  });

  socket.on("joinRoom", ({ roomId, name }) => {
    if (!rooms[roomId]) {
      socket.emit("errorMsg", "الغرفة غير موجودة");
      return;
    }

    rooms[roomId].push({
      id: socket.id,
      name: name,
      host: false
    });

    socket.join(roomId);
    io.to(roomId).emit("updatePlayers", rooms[roomId]);
  });

});

// 👇 أهم سطر
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
