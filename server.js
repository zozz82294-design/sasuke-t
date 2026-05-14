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
  started: false
};

io.on("connection", (socket) => {

  // 🔥 إنشاء غرفة
  socket.on("createRoom", (name) => {
    room.id = Math.floor(Math.random() * 999999);
    room.players = [];
    room.started = false;

    room.players.push({
      id: socket.id,
      name: name,
      connected: true
    });

    socket.emit("roomCreated", room.id);
    io.emit("updatePlayers", room.players);
  });

  // 🔥 انضمام
  socket.on("joinRoom", ({ roomId, name }) => {

    // ❌ لينك قديم
    if (roomId != room.id) {
      socket.emit("errorMsg", "❌ لقد انتهت صلاحية الرابط");
      return;
    }

    // ❌ لو اللعبة بدأت
    if (room.started) {
      socket.emit("errorMsg", "⛔ اللعبة بدأت بالفعل، انتظر إعادة اللعب");
      return;
    }

    // 🔥 رجوع بنفس الاسم (ريفرش)
    let existing = room.players.find(p => p.name === name);

    if (existing) {
      existing.id = socket.id;
      existing.connected = true;
    } else {
      // ❌ منع تكرار الأسماء
      if (room.players.some(p => p.name === name)) {
        socket.emit("errorMsg", "الاسم مستخدم");
        return;
      }

      room.players.push({
        id: socket.id,
        name: name,
        connected: true
      });
    }

    io.emit("updatePlayers", room.players);
  });

  // 🔥 بدء اللعبة
  socket.on("startGame", () => {
    room.started = true;
    io.emit("gameStarted");
  });

  // 🔥 إعادة اللعبة
  socket.on("restartGame", () => {
    room.started = false;
    io.emit("gameRestarted");
  });

  // 🔥 تغيير اسم
  socket.on("renamePlayer", ({ id, newName }) => {
    let p = room.players.find(x => x.id === id);
    if (p) p.name = newName;

    io.emit("updatePlayers", room.players);
  });

  // 🔥 طرد
  socket.on("kickPlayer", (id) => {
    room.players = room.players.filter(p => p.id !== id);
    io.emit("updatePlayers", room.players);
  });

  // 🔥 خروج (بدون حذف فوري)
  socket.on("disconnect", () => {
    let p = room.players.find(x => x.id === socket.id);
    if (p) {
      p.connected = false;
    }
  });

});

server.listen(3000, () => {
  console.log("🔥 Server running...");
});
