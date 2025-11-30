// src/gameState.ts
export type Player = { id: string; name: string; socketId: string };
export type Submission = { id: string; playerId: string; text: string };

export type Phase = 'lobby' | 'submission' | 'voting' | 'results';

export interface GameState {
  phase: Phase;
  players: Player[];
  hostSocketId: string | null;
  currentPromptIndex: number;
  submissions: Submission[];
  votes: Record<string, Record<string, number>>; // playerId -> {submissionId: rank}
  maxPlayers: number;
}

export const game: GameState = {
  phase: 'lobby',
  players: [],
  hostSocketId: null,
  currentPromptIndex: 0,
  submissions: [],
  votes: {},
  maxPlayers: 8
};

