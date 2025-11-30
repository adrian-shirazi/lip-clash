// public/screen.js
const socket = io();
socket.emit('identify', { role: 'screen' });

const playersUl = document.getElementById('players');
const playerCountSpan = document.getElementById('playerCount');
const promptText = document.getElementById('promptText');
const submissionsDiv = document.getElementById('submissions');

document.getElementById('startSubmission').onclick = () => socket.emit('startSubmission');
document.getElementById('startVoting').onclick = () => socket.emit('startVoting');
document.getElementById('nextRound').onclick = () => socket.emit('nextRound');

socket.on('gameState', state => {
  playersUl.innerHTML = '';
  state.players.forEach(p => {
    const li = document.createElement('li');
    li.textContent = p.name;
    playersUl.appendChild(li);
  });
  playerCountSpan.textContent = state.players.length;
  promptText.textContent = state.prompt || '—';

  submissionsDiv.innerHTML = '';
  if (state.submissions && state.submissions.length > 0) {
    state.submissions.forEach(s => {
      const d = document.createElement('div');
      d.className = 'card';
      d.textContent = s.text;
      submissionsDiv.appendChild(d);
    });
  }

  if (state.results) {
    const resTitle = document.createElement('h4');
    resTitle.textContent = 'Results';
    submissionsDiv.appendChild(resTitle);
    state.results.forEach(r => {
      const d = document.createElement('div');
      d.className = 'card result';
      d.innerHTML = `<strong>${r.score}</strong> — ${r.text}`;
      submissionsDiv.appendChild(d);
    });
  }
});

