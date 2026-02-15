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

const players = new Map<string, Player>();

app.get("/players", (_, res) => {
  res.json({
    count: players.size,
    players: Array.from(players.values()),
  });
});

// Socket.IO handlers
io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  players.set(socket.id, {
    id: socket.id,
  });

  console.log("Total players:", players.size);

  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
    players.delete(socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
