const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let room = {
  players: [],
  votes: {},
  voted: {},
  spyId: null,
  word: "",
  category: "",
  started: false
};

const categories = {
  animals: ["أسد","نمر","فيل","زرافة","قرد","كلب","قط","حصان","ذئب","ثعلب","دب","جمل"],
  objects: ["تلاجة","مروحة","سرير","كنبة","معلقة","كوباية","خلاط","بامبرز","شاشة","موبايل","ريموت"],
  apps: ["واتساب","فيسبوك","يوتيوب","تيك توك","انستجرام","تليجرام","سناب شات"],
  anime: ["ناروتو","ون بيس","ديث نوت","هجوم العمالقة","دراغون بول"],
  cartoon: ["سبونج بوب","توم وجيري","بن تن","غامبول"]
};

io.on("connection", (socket) => {

  socket.on("createRoom", (name) => {
    room.players = [];
    room.started = false;
    room.players.push({ id: socket.id, name });
    io.emit("updatePlayers", room.players);
  });

  socket.on("joinRoom", ({ name }) => {
    room.players.push({ id: socket.id, name });
    io.emit("updatePlayers", room.players);
  });

  socket.on("startGame", () => {
    room.started = true;
    io.emit("showCategories");
  });

  socket.on("chooseCategory", (cat) => {
    room.category = cat;
    const words = categories[cat];
    room.word = words[Math.floor(Math.random() * words.length)];

    const others = room.players.slice(1);
    const spy = others[Math.floor(Math.random() * others.length)];
    room.spyId = spy.id;

    io.emit("categoryChosen", cat);

    room.players.forEach(p => {
      if (p.id === room.spyId) {
        io.to(p.id).emit("role", { spy: true, cat });
      } else {
        io.to(p.id).emit("role", { spy: false, word: room.word, cat });
      }
    });
  });

  socket.on("startVote", () => {
    room.votes = {};
    room.voted = {};
    room.players.forEach(p => room.votes[p.id] = []);
    io.emit("voteStart", room.players);
  });

  socket.on("vote", ({ voter, targetId }) => {
    if (room.voted[voter]) return;

    room.voted[voter] = true;
    room.votes[targetId].push(voter);

    io.emit("voteUpdate", {
      votes: room.votes,
      total: Object.keys(room.voted).length,
      max: room.players.length
    });

    if (Object.keys(room.voted).length >= room.players.length) {

      let max = 0, selected = null;

      for (let id in room.votes) {
        if (room.votes[id].length > max) {
          max = room.votes[id].length;
          selected = id;
        }
      }

      io.emit("voteResult", {
        selected,
        spy: room.spyId,
        players: room.players
      });
    }
  });

  socket.on("startGuess", () => {
    let words = [room.word];

    const pool = ["أسد","نمر","فيل","زرافة","كلب","قط","حصان","ذئب","دب","ثعلب","خروف","بقرة","جمل"];

    while (words.length < 13) {
      let w = pool[Math.floor(Math.random()*pool.length)];
      if (!words.includes(w)) words.push(w);
    }

    words.sort(()=>Math.random()-0.5);

    io.emit("guessUI", {
      words,
      spyId: room.spyId
    });
  });

  socket.on("selectGuess", ({ word, player }) => {
    io.emit("selectUpdate", { word, player });
  });

  socket.on("confirmGuess", (word) => {
    io.emit("guessResult", {
      word,
      correct: room.word
    });
  });

  socket.on("disconnect", () => {
    room.players = room.players.filter(p => p.id !== socket.id);
    delete room.voted[socket.id];
    for (let id in room.votes) {
      room.votes[id] = room.votes[id].filter(v => v !== socket.id);
    }
    io.emit("updatePlayers", room.players);
  });

});

server.listen(3000, () => console.log("🔥 PRO SERVER"));
