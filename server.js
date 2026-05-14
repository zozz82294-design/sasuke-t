let players = [];

io.on("connection", (socket) => {

  socket.on("createRoom", (name) => {
    players = [];
    players.push({ id: socket.id, name });

    socket.emit("updatePlayers", players);
  });

  socket.on("joinRoom", ({ name }) => {
    players.push({ id: socket.id, name });

    io.emit("updatePlayers", players);
  });

  // تغيير اسم
  socket.on("renamePlayer", ({ id, newName }) => {
    const player = players.find(p => p.id === id);
    if (player) player.name = newName;

    io.emit("updatePlayers", players);
  });

  // طرد لاعب
  socket.on("kickPlayer", (id) => {
    players = players.filter(p => p.id !== id);

    io.emit("updatePlayers", players);
  });

  // إعادة اللعبة
  socket.on("restartGame", () => {
    io.emit("gameRestarted");
  });

});
