export interface Player {
  sessionId: string;
  name: string;
}

export interface ServerToClientEvents {
  playersUpdated: (players: Player[]) => void;
  gameStarted: () => void;
}

export interface ClientToServerEvents {
  joinLobby: (payload: { name: string; sessionId?: string }) => void;
  startGame: () => void;
}
