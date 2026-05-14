const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let players = [];
let roomId = null;

io.on("connection", (socket) => {

  // إنشاء غرفة
  socket.on("createRoom", (name) => {
    players = [];
    roomId = Math.floor(Math.random() * 9999);

    players.push({ id: socket.id, name });

    socket.emit("roomCreated", roomId);
    io.emit("updatePlayers", players);
  });

  // انضمام
  socket.on("joinRoom", ({ roomId: rid, name }) => {
    if (rid != roomId) {
      socket.emit("errorMsg", "الرابط انتهت صلاحيته");
      return;
    }

    players.push({ id: socket.id, name });

    io.emit("updatePlayers", players);
  });

  // تغيير اسم
  socket.on("renamePlayer", ({ id, newName }) => {
    const player = players.find(p => p.id === id);
    if (player) player.name = newName;

    io.emit("updatePlayers", players);
  });

  // طرد
  socket.on("kickPlayer", (id) => {
    players = players.filter(p => p.id !== id);
    io.emit("updatePlayers", players);
  });

  // مغادرة (لما يقفل أو يخرج)
  socket.on("disconnect", () => {
    players = players.filter(p => p.id !== socket.id);
    io.emit("updatePlayers", players);
  });

});

server.listen(3000, () => {
  console.log("Server running...");
});
