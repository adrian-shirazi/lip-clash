(function () {
  const playerId = localStorage.getItem("playerId");
  const name = localStorage.getItem("playerName");

  if (!playerId || !name) {
    window.location.href = "/join.html";
  }

  const socket = io();

  socket.emit("join", { playerId, name });

  socket.on("players_update", (msg) => {
    const playersList = document.getElementById("players");
    playersList.innerHTML = "";

    msg.players.forEach((player) => {
      const li = document.createElement("li");
      li.textContent = player.name;
      if (player.socketId === msg.hostId) li.classList.add("host");
      playersList.appendChild(li);
    });
  });

  socket.on("error", (msg) => {
    alert(msg.message);
  });
})();
