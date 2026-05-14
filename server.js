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

  // بدء التصويت
  socket.on("startVote", () => {
    room.votes = {};
    room.voted = {};

    room.players.forEach(p => {
      room.votes[p.id] = [];
    });

    io.emit("voteStarted", room.players);
  });

  // التصويت
  socket.on("vote", ({ voter, targetId }) => {

    if (room.voted[voter]) return; // منع تكرار

    room.voted[voter] = true;
    room.votes[targetId].push(voter);

    io.emit("voteUpdate", {
      votes: room.votes,
      total: Object.keys(room.voted).length,
      max: room.players.length
    });

    // لو الكل صوت
    if (Object.keys(room.voted).length >= room.players.length) {

      let maxVotes = 0;
      let selected = null;

      for (let id in room.votes) {
        if (room.votes[id].length > maxVotes) {
          maxVotes = room.votes[id].length;
          selected = id;
        }
      }

      io.emit("voteResult", selected);
    }
  });

  // خروج لاعب بدون جلتش
  socket.on("disconnect", () => {
    room.players = room.players.filter(p => p.id !== socket.id);

    delete room.voted[socket.id];

    for (let id in room.votes) {
      room.votes[id] = room.votes[id].filter(v => v !== socket.id);
    }

    io.emit("updatePlayers", room.players);
  });

});

server.listen(3000, () => {
  console.log("🔥 Voting Server Ready");
});
