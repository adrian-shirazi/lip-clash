// src/server.ts
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { game, Player, Submission } from './gameState';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// Static public files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Load prompts
let prompts: string[] = [];
try {
  const p = fs.readFileSync(path.join(process.cwd(), 'prompts.json'), 'utf8');
  prompts = JSON.parse(p);
} catch (err) {
  console.warn('Could not load prompts.json; create one at project root.');
  prompts = ['No prompts found — add prompts.json'];
}

// QR code endpoint (PNG)
app.get('/qr', async (req, res) => {
  const host = req.get('host');
  const joinUrl = `http://${host}/join.html`;
  try {
    const dataUrl = await QRCode.toDataURL(joinUrl);
    const img = Buffer.from(dataUrl.split(',')[1], 'base64');
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': img.length
    });
    res.end(img);
  } catch (err) {
    res.status(500).send('QR generation failed');
  }
});

// Helper functions
function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function emitGameState() {
  io.to('screen').emit('gameState', {
    phase: game.phase,
    players: game.players.map(p => ({ id: p.id, name: p.name })),
    prompt: prompts[game.currentPromptIndex],
    submissions: game.submissions.map(s => ({ id: s.id, text: s.text })),
    results: computeResultsIfAvailable()
  });
}

function shuffledSubmissions(): Submission[] {
  const arr = game.submissions.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function computeResultsIfAvailable() {
  if (game.phase !== 'results') return null;
  const counts: Record<string, number> = {};
  const N = game.submissions.length;
  game.submissions.forEach(s => (counts[s.id] = 0));
  Object.values(game.votes).forEach(rankMap => {
    Object.entries(rankMap).forEach(([submissionId, rank]) => {
      const points = Math.max(0, N - (rank - 1));
      counts[submissionId] += points;
    });
  });
  const results = game.submissions.map(s => ({
    id: s.id,
    text: s.text,
    score: counts[s.id] || 0
  }));
  results.sort((a, b) => b.score - a.score);
  return results;
}

function startVotingPhase() {
  if (game.submissions.length < 2) {
    if (game.hostSocketId) {
      io.to(game.hostSocketId).emit('errorMessage', { message: 'Need at least 2 submissions to vote.' });
    }
    return;
  }
  game.phase = 'voting';
  const shuffled = shuffledSubmissions();
  io.to('players').emit('phase', { phase: 'voting', submissions: shuffled });
  emitGameState();
}

// Socket.IO handlers
io.on('connection', socket => {
  socket.on('identify', ({ role }: { role: string }) => {
    if (role === 'screen') {
      socket.join('screen');
      game.hostSocketId = socket.id;
      emitGameState();
    }
    // players identify when they join
  });

  socket.on('joinGame', ({ name }: { name?: string }) => {
    if (game.players.length >= game.maxPlayers) {
      socket.emit('joinError', { message: 'Game is full.' });
      return;
    }
    const player: Player = { id: generateId(), name: (name || 'Anon').slice(0, 30), socketId: socket.id };
    game.players.push(player);
    (socket as any).data = { playerId: player.id };
    socket.join('players');
    emitGameState();
    socket.emit('joined', { playerId: player.id });
  });

  socket.on('startSubmission', () => {
    if (socket.id !== game.hostSocketId) return;
    game.phase = 'submission';
    game.submissions = [];
    game.votes = {};
    io.to('players').emit('phase', { phase: 'submission', prompt: prompts[game.currentPromptIndex] });
    emitGameState();
  });

  socket.on('submitAnswer', ({ text }: { text?: string }) => {
    const playerId = (socket as any).data?.playerId;
    if (!playerId) return;
    if (game.submissions.some(s => s.playerId === playerId)) return; // one submission each
    const sub: Submission = { playerId, text: (text || '').trim().slice(0, 300), id: generateId() };
    game.submissions.push(sub);
    emitGameState();
    if (game.submissions.length === game.players.length && game.players.length > 0) {
      startVotingPhase();
    }
  });

  socket.on('startVoting', () => {
    if (socket.id !== game.hostSocketId) return;
    startVotingPhase();
  });

  socket.on('submitRanking', ({ ranks }: { ranks: Record<string, number> }) => {
    const playerId = (socket as any).data?.playerId;
    if (!playerId) return;
    game.votes[playerId] = ranks;
    emitGameState();
    if (Object.keys(game.votes).length === game.players.length) {
      game.phase = 'results';
      io.to('players').emit('phase', { phase: 'results', results: computeResultsIfAvailable() });
      emitGameState();
    }
  });

  socket.on('nextRound', () => {
    if (socket.id !== game.hostSocketId) return;
    game.currentPromptIndex = (game.currentPromptIndex + 1) % prompts.length;
    game.phase = 'lobby';
    game.submissions = [];
    game.votes = {};
    io.to('players').emit('phase', { phase: 'lobby' });
    emitGameState();
  });

  socket.on('disconnect', () => {
    const idx = game.players.findIndex(p => p.socketId === socket.id);
    if (idx !== -1) {
      const pid = game.players[idx].id;
      game.players.splice(idx, 1);
      delete game.votes[pid];
      game.submissions = game.submissions.filter(s => s.playerId !== pid);
    }
    if (socket.id === game.hostSocketId) game.hostSocketId = null;
    emitGameState();
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Join URL: http://localhost:${PORT}/join.html`);
  console.log(`QR code: http://localhost:${PORT}/qr`);
});

