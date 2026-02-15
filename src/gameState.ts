// src/gameState.ts
export type Player = {
  id: string;
  name: string;
};

export type Submission = { id: string; playerId: string; text: string };

export type Phase = "lobby" | "submission" | "voting" | "results";

export interface GameState {
  phase: Phase;
  players: Player[];
  hostSocketId: string | null;
  maxPlayers: number;
}

export const game: GameState = {
  phase: "lobby",
  players: [],
  hostSocketId: null,
  maxPlayers: 8,
};
