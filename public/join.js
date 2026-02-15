(function () {
  const socket = io("http://localhost:3000");

  socket.on("connect", () => {
    const name = prompt("Enter your name");
    socket.emit("setName", name);
  });

  socket.on("playersUpdated", (players) => {
    console.log("Players:", players);
  });
})();
