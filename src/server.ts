import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { randomUUID } from "crypto";
import { Player, ServerToClientEvents, ClientToServerEvents } from "./types";

const app = express();
const server = http.createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// Static public files
app.use(express.static(path.join(__dirname, "..", "public")));

const players = new Map<string, Player>();

function broadcastPlayers() {
  io.emit("playersUpdated", Array.from(players.values()));
}

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  socket.on("joinLobby", ({ name, sessionId }) => {
    const id = sessionId ?? randomUUID();

    players.set(id, {
      sessionId: id,
      name,
    });

    socket.data.sessionId = id;
    broadcastPlayers();
  });

  socket.on("startGame", () => {
    io.emit("gameStarted");
  });

  socket.on("disconnect", () => {
    const id = socket.data.sessionId;
    if (!id) return;

    players.delete(id);
    broadcastPlayers();
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
