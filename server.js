const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

let rooms = {};

io.on("connection", (socket) => {

  socket.on("createRoom", (name) => {
    const roomId = Math.floor(1000 + Math.random() * 9000).toString();

    rooms[roomId] = [];

    socket.join(roomId);

    rooms[roomId].push({
      id: socket.id,
      name: name,
      host: true
    });

    socket.emit("roomCreated", roomId);
    io.to(roomId).emit("updatePlayers", rooms[roomId]);
  });

  socket.on("joinRoom", ({ roomId, name }) => {

    if (!rooms[roomId]) {
      socket.emit("errorMsg", "انتهت صلاحية الرابط");
      return;
    }

    const exists = rooms[roomId].find(p => p.name === name);
    if (exists) {
      socket.emit("errorMsg", "الاسم مستخدم");
      return;
    }

    socket.join(roomId);

    rooms[roomId].push({
      id: socket.id,
      name: name,
      host: false
    });

    io.to(roomId).emit("updatePlayers", rooms[roomId]);
  });

  socket.on("disconnect", () => {
    for (let roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter(p => p.id !== socket.id);

      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      } else {
        io.to(roomId).emit("updatePlayers", rooms[roomId]);
      }
    }
  });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
