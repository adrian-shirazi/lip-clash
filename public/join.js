(function () {
  const socket = io();

  document.getElementById("joinBtn").onclick = () => {
    const playerId = crypto.randomUUID();
    const name =
      document.getElementById("name").value.trim() || "Mystery player";
    socket.emit("join", { playerId, name });
    localStorage.setItem("playerId", playerId);
    localStorage.setItem("name", name);
    window.location.href = "/lobby.html";
  };

  socket.on("error", ({ message }) => {
    document.getElementById("joinMsg").textContent = message;
  });
})();
