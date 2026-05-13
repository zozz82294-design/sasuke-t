const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 👇 أهم سطر (ده اللي كان ناقصك)
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

  socket.on("disconnect", () => {
    for (let roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter(p => p.id !== socket.id);
      io.to(roomId).emit("updatePlayers", rooms[roomId]);
    }
  });

});

server.listen(3000, () => {
  console.log("Server running...");
});
