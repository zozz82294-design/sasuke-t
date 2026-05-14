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
  started: false,
  word: "",
  spyId: null,
  category: ""
};

// كلمات
const categories = {
  animals: ["أسد","نمر","فيل","زرافة","قرد","كلب","قط","حصان","ذئب"],
  objects: ["تلاجة","مروحة","سرير","كنبة","معلقة","كوباية","خلاط","بامبرز"],
  apps: ["واتساب","فيسبوك","يوتيوب","تيك توك","انستجرام"],
  anime: ["ناروتو","ون بيس","ديث نوت","هجوم العمالقة"],
  cartoon: ["سبونج بوب","توم وجيري","بن تن"]
};

io.on("connection", (socket) => {

  socket.on("createRoom", (name) => {
    room.id = Math.floor(Math.random() * 999999);
    room.players = [];
    room.started = false;

    room.players.push({ id: socket.id, name });

    socket.emit("roomCreated", room.id);
    io.emit("updatePlayers", room.players);
  });

  socket.on("joinRoom", ({ roomId, name }) => {
    if (roomId != room.id) {
      socket.emit("errorMsg", "❌ الرابط انتهى");
      return;
    }

    if (room.started) {
      socket.emit("errorMsg", "⛔ اللعبة بدأت بالفعل");
      return;
    }

    room.players.push({ id: socket.id, name });
    io.emit("updatePlayers", room.players);
  });

  // بدء اللعبة
  socket.on("startGame", () => {
    room.started = true;
    io.emit("showCategories");
  });

  // اختيار تصنيف
  socket.on("chooseCategory", (cat) => {
    room.category = cat;

    const words = categories[cat];
    room.word = words[Math.floor(Math.random() * words.length)];

    // اختيار جاسوس (مش أول لاعب = الهوست)
    const others = room.players.slice(1);
    const spy = others[Math.floor(Math.random() * others.length)];
    room.spyId = spy.id;

    io.emit("categoryChosen", cat);

    // توزيع الأدوار
    room.players.forEach(p => {
      if (p.id === room.spyId) {
        io.to(p.id).emit("yourRole", {
          spy: true,
          category: cat
        });
      } else {
        io.to(p.id).emit("yourRole", {
          spy: false,
          word: room.word,
          category: cat
        });
      }
    });
  });

});

server.listen(3000, () => {
  console.log("🔥 Server running");
});
