export type Position = "GK" | "CB" | "LB" | "RB" | "CM" | "CDM" | "CAM" | "LW" | "RW" | "ST";

export type Difficulty = "EASY" | "NORMAL" | "HARD";

export type FormationName = "4-3-3" | "4-4-2" | "3-5-2" | "4-2-3-1";

export interface PlayerCard {
  id: string;
  name: string;
  position: Position;
  speed: number;
  shooting: number;
  passing: number;
  defense: number;
  stamina: number;
  level: number;
  xp: number;
  price: number;
  age: number;
  /** 0-100 match condition; low fitness reduces effectiveness in matches. */
  fitness: number;
  /** Shirt number */
  number: number;
}


export interface TableRow {
  club: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
}

export interface Settings {
  difficulty: Difficulty;
  matchMinutes: number;
  sound: boolean;
  forceTouchControls: boolean;
}

export interface GameState {
  version: number;
  club: string;
  coins: number;
  season: number;
  league: string;
  leagueTier: number;
  stadiumLevel: number;
  trophies: number;
  formation: FormationName;
  squad: PlayerCard[];
  lineup: string[];
  market: PlayerCard[];
  table: TableRow[];
  settings: Settings;
  lastResult: MatchResult | null;
}

export interface MatchResult {
  scored: number;
  conceded: number;
  outcome: "WIN" | "DRAW" | "LOSS";
  coins: number;
  xp: number;
  opponent: string;
  difficulty: Difficulty;
}
