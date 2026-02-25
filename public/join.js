(function () {
  const socket = io();

  document.getElementById("joinBtn").onclick = () => {
    const name = document.getElementById("name").value.trim();
    socket.emit("joinLobby", name);
    window.location.href = "/lobby.html";
  };
})();
