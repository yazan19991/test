import { Language } from './data/translations';

export type GamePhase = 
  | 'LOBBY' 
  | 'ROLE_ASSIGNMENT' 
  | 'QUESTIONING' 
  | 'VOTING' 
  | 'SPY_GUESSING' 
  | 'GAME_OVER';

export type { Language };

export interface Player {
  id: string; // Socket ID or unique session ID
  name: string;
  avatar: string;
  isHost: boolean;
  readyForNext: boolean; // Confirmed role viewed
  readyToVote: boolean; // Voted to start voting in questioning phase
  votedFor?: string; // Player ID they voted for
  isSpy?: boolean; // Only visible to server / self if spy
  isOnline: boolean;
  score: number;
}

export interface CategoryPack {
  id: string;
  name: string;
  icon: string;
  description: string;
  words: string[];
}

export interface VoteResult {
  suspectId: string;
  suspectName: string;
  votesCount: number;
  voters: string[];
  isSpy: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  type: 'chat' | 'system' | 'reaction';
}

export interface RoomState {
  code: string;
  hostId: string;
  language?: Language;
  phase: GamePhase;
  players: Player[];
  categoryId: string;
  categoryName: string;
  targetWord?: string; // Hidden from spy in client payloads
  isSpy?: boolean; // Client-specific flag for current user
  spyId?: string; // Only revealed at game over or when spy is caught
  startingPlayerName?: string;
  readyToVoteCount: number;
  totalPlayers: number;
  voteResults?: VoteResult[];
  accusedPlayer?: Player;
  spyGuessChoices?: string[];
  spyGuessResult?: {
    guessedWord: string;
    correctWord: string;
    isCorrect: boolean;
  };
  winnerTeam?: 'SPY' | 'PLAYERS';
  gameOverReason?: 'WRONG_ACCUSATION' | 'CORRECT_GUESS' | 'WRONG_GUESS';
  customPacks: CategoryPack[];
}
