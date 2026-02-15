(function () {
  const socket = io();

  const name = localStorage.getItem("name");
  let sessionId = localStorage.getItem("sessionId");

  socket.on("connect", () => {
    socket.emit("joinLobby", { name, sessionId });
  });

  socket.on("playersUpdated", (players) => {
    const list = document.getElementById("playerList");
    list.innerHTML = "";

    players.forEach((p) => {
      const li = document.createElement("li");
      li.textContent = p.name;
      list.appendChild(li);
    });
  });

  socket.on("gameStarted", () => {
    alert("Game started!");
  });

  document.getElementById("startBtn").onclick = () => {
    socket.emit("startGame");
  };

  socket.on("connect", () => {
    sessionId = socket.id;
    localStorage.setItem("sessionId", sessionId);
  });
})();
