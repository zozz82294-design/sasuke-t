const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let room = {
  id: null,
  players: [],
  host: null
};

function generateRoomId() {
  return Math.random().toString(36).substring(2, 7);
}

io.on("connection", (socket) => {

  socket.on("createRoom", (name) => {
    room.id = generateRoomId();
    room.players = [];
    room.host = socket.id;

    socket.join(room.id);

    room.players.push({ id: socket.id, name: "SASUKE", host: true });

    socket.emit("roomCreated", room.id);
    io.to(room.id).emit("updatePlayers", room.players);
  });

  socket.on("joinRoom", ({ roomId, name }) => {
    if (room.id !== roomId) {
      socket.emit("errorMsg", "لقد انتهت صلاحية الرابط");
      return;
    }

    socket.join(room.id);

    room.players.push({ id: socket.id, name, host: false });

    io.to(room.id).emit("updatePlayers", room.players);
  });

  socket.on("disconnect", () => {
    room.players = room.players.filter(p => p.id !== socket.id);
    io.to(room.id).emit("updatePlayers", room.players);
  });

});

server.listen(process.env.PORT || 3000, "0.0.0.0", () => {
  console.log("Server running");
});
