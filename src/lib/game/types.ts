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
  /** 0-100 happiness; boosted by wins, dented by losses. */
  morale: number;
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
  /** Most recent results first, e.g. ["W","D","L"]. */
  form: Array<"W" | "D" | "L">;
}

export interface Settings {
  difficulty: Difficulty;
  matchMinutes: number;
  sound: boolean;
  forceTouchControls: boolean;
}

export type Mentality = "DEFENSIVE" | "BALANCED" | "ATTACKING";
export type PassingStyle = "SHORT" | "MIXED" | "DIRECT";
export type PressingLevel = "LOW" | "MEDIUM" | "HIGH";
export type DefensiveLine = "DEEP" | "NORMAL" | "HIGH";

export interface Tactics {
  mentality: Mentality;
  passing: PassingStyle;
  pressing: PressingLevel;
  defensiveLine: DefensiveLine;
  /** Player instruction ids that are switched on. */
  instructions: string[];
}

export interface Staff {
  coach: number;
  scout: number;
  physio: number;
}

export interface TransferRecord {
  id: string;
  name: string;
  position: Position;
  type: "IN" | "OUT";
  fee: number;
  season: number;
}

export interface Challenge {
  id: string;
  label: string;
  metric: "WINS" | "GOALS" | "MATCHES" | "CLEAN_SHEETS" | "TOURNAMENT_WINS";
  target: number;
  progress: number;
  rewardCoins: number;
  rewardGems: number;
  claimed: boolean;
}

export interface LiveEvent {
  id: string;
  name: string;
  blurb: string;
  objective: string;
  metric: Challenge["metric"];
  target: number;
  progress: number;
  rewardCoins: number;
  rewardGems: number;
  claimed: boolean;
  /** Epoch ms when the event closes. */
  endsAt: number;
}

export interface TournamentTie {
  round: number;
  opponent: string;
  scored: number | null;
  conceded: number | null;
}

export interface TournamentState {
  active: boolean;
  round: number;
  ties: TournamentTie[];
  won: number;
  titles: number;
}

export interface CareerStats {
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheets: number;
  tournamentWins: number;
}

export interface GameState {
  version: number;
  club: string;
  coins: number;
  gems: number;
  energy: number;
  maxEnergy: number;
  managerName: string;
  managerLevel: number;
  managerXp: number;
  reputation: number;
  season: number;
  league: string;
  leagueTier: number;
  stadiumLevel: number;
  youthLevel: number;
  staff: Staff;
  trophies: number;
  formation: FormationName;
  tactics: Tactics;
  squad: PlayerCard[];
  lineup: string[];
  captainId: string | null;
  market: PlayerCard[];
  table: TableRow[];
  settings: Settings;
  lastResult: MatchResult | null;
  notifications: string[];
  transferHistory: TransferRecord[];
  challenges: Challenge[];
  events: LiveEvent[];
  tournament: TournamentState;
  stats: CareerStats;
  ownedItems: string[];
  /** Which competition the next played match counts towards. */
  nextMatchMode: "LEAGUE" | "TOURNAMENT";
}

export interface MatchResult {
  scored: number;
  conceded: number;
  outcome: "WIN" | "DRAW" | "LOSS";
  coins: number;
  xp: number;
  opponent: string;
  difficulty: Difficulty;
  mode: "LEAGUE" | "TOURNAMENT";
}
