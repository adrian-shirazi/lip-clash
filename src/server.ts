// src/server.ts
import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import path from "path";
import { game, Player } from "./gameState";

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// Static public files
app.use(express.static(path.join(__dirname, "..", "public")));

function broadcastPlayers() {
  io.emit("players_update", {
    players: game.players,
    hostId: game.hostSocketId || "",
  });
}

// Socket.IO handlers
io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  socket.on("join", (data: { playerId: string; name: string }) => {
    let player = game.players.find((p) => p.id === data.playerId);

    if (player) {
      // reconnect
      player.socketId = socket.id;
    } else {
      if (game.players.length >= game.maxPlayers) {
        socket.emit("error", { message: "Lobby is full" });
        return;
      }

      player = {
        id: data.playerId,
        socketId: socket.id,
        name: data.name,
        score: 0,
      };

      game.players.push(player);

      // First player is the host
      if (!game.hostSocketId) game.hostSocketId = socket.id;
    }

    broadcastPlayers();
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);

    game.players = game.players.filter((p) => p.socketId !== socket.id);

    if (game.hostSocketId === socket.id) {
      game.hostSocketId =
        game.players.length > 0 ? game.players[0].socketId : null;
    }

    broadcastPlayers();
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
