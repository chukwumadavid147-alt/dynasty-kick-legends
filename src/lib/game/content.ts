import type { Challenge, LiveEvent } from "./types";

export const PLAYER_INSTRUCTIONS: Array<{ id: string; label: string; hint: string }> = [
  { id: "overlap", label: "Overlapping full-backs", hint: "Full-backs push high down the flanks" },
  { id: "target", label: "Target striker", hint: "Play early balls into the striker" },
  { id: "counter", label: "Counter attack", hint: "Break at speed after winning the ball" },
  { id: "wide", label: "Stay wide", hint: "Wingers hug the touchline to stretch play" },
  { id: "tight", label: "Tight marking", hint: "Defenders track runners man-to-man" },
  { id: "shoot", label: "Shoot on sight", hint: "Take on efforts from distance" },
];

export interface StoreItem {
  id: string;
  name: string;
  blurb: string;
  category: "PACKS" | "CLUB" | "TRAINING" | "COSMETIC";
  costCoins: number;
  costGems: number;
  /** Repeatable items can be bought many times; others are one-off unlocks. */
  repeatable: boolean;
}

export const STORE_ITEMS: StoreItem[] = [
  {
    id: "pack-bronze",
    name: "Bronze Player Pack",
    blurb: "One scouted player added straight to your squad.",
    category: "PACKS",
    costCoins: 800,
    costGems: 0,
    repeatable: true,
  },
  {
    id: "pack-gold",
    name: "Gold Player Pack",
    blurb: "A high-rated prospect joins the club immediately.",
    category: "PACKS",
    costCoins: 0,
    costGems: 12,
    repeatable: true,
  },
  {
    id: "pack-scout",
    name: "Scout Refresh",
    blurb: "Refresh the transfer market with a brand new shortlist.",
    category: "PACKS",
    costCoins: 300,
    costGems: 0,
    repeatable: true,
  },
  {
    id: "club-floodlights",
    name: "Floodlight Upgrade",
    blurb: "Permanent +5 club reputation for those big night games.",
    category: "CLUB",
    costCoins: 2500,
    costGems: 0,
    repeatable: false,
  },
  {
    id: "club-pitch",
    name: "Hybrid Pitch",
    blurb: "Permanent +5 club reputation and a smoother surface.",
    category: "CLUB",
    costCoins: 3200,
    costGems: 0,
    repeatable: false,
  },
  {
    id: "train-recovery",
    name: "Recovery Session",
    blurb: "Restore the whole squad to full fitness.",
    category: "TRAINING",
    costCoins: 600,
    costGems: 0,
    repeatable: true,
  },
  {
    id: "train-morale",
    name: "Team Bonding Day",
    blurb: "+20 morale for every player in the squad.",
    category: "TRAINING",
    costCoins: 500,
    costGems: 0,
    repeatable: true,
  },
  {
    id: "train-energy",
    name: "Energy Drink Crate",
    blurb: "Refill your match energy to the maximum.",
    category: "TRAINING",
    costCoins: 0,
    costGems: 4,
    repeatable: true,
  },
  {
    id: "cos-kit-gold",
    name: "Golden Away Kit",
    blurb: "Cosmetic black and gold kit for your club profile.",
    category: "COSMETIC",
    costCoins: 1200,
    costGems: 0,
    repeatable: false,
  },
  {
    id: "cos-crest",
    name: "Royal Crest Badge",
    blurb: "Cosmetic crowned crest shown on your manager profile.",
    category: "COSMETIC",
    costCoins: 0,
    costGems: 8,
    repeatable: false,
  },
];

const CHALLENGE_POOL: Array<Omit<Challenge, "progress" | "claimed">> = [
  { id: "c-win", label: "Win a match", metric: "WINS", target: 1, rewardCoins: 350, rewardGems: 1 },
  { id: "c-goals", label: "Score 3 goals", metric: "GOALS", target: 3, rewardCoins: 300, rewardGems: 1 },
  { id: "c-play", label: "Play 2 matches", metric: "MATCHES", target: 2, rewardCoins: 250, rewardGems: 0 },
  {
    id: "c-clean",
    label: "Keep a clean sheet",
    metric: "CLEAN_SHEETS",
    target: 1,
    rewardCoins: 400,
    rewardGems: 2,
  },
  {
    id: "c-cup",
    label: "Win a tournament match",
    metric: "TOURNAMENT_WINS",
    target: 1,
    rewardCoins: 500,
    rewardGems: 2,
  },
];

export function makeChallenges(): Challenge[] {
  return CHALLENGE_POOL.map((c) => ({ ...c, progress: 0, claimed: false }));
}

export function makeEvents(now = 0): LiveEvent[] {
  const day = 86_400_000;
  return [
    {
      id: "e-goldrush",
      name: "Golden Goal Rush",
      blurb: "Bang in the goals while the floodlights are on.",
      objective: "Score 6 goals in any matches",
      metric: "GOALS",
      target: 6,
      progress: 0,
      rewardCoins: 1200,
      rewardGems: 5,
      claimed: false,
      endsAt: now + day * 2,
    },
    {
      id: "e-fortress",
      name: "Fortress Week",
      blurb: "Shut the door at the back and bank the bonus.",
      objective: "Keep 2 clean sheets",
      metric: "CLEAN_SHEETS",
      target: 2,
      progress: 0,
      rewardCoins: 1500,
      rewardGems: 6,
      claimed: false,
      endsAt: now + day * 4,
    },
    {
      id: "e-cupruns",
      name: "Cup Run Festival",
      blurb: "Knockout football, doubled rewards.",
      objective: "Win 2 tournament matches",
      metric: "TOURNAMENT_WINS",
      target: 2,
      progress: 0,
      rewardCoins: 2000,
      rewardGems: 8,
      claimed: false,
      endsAt: now + day * 6,
    },
  ];
}

export const EVENT_LEADERBOARD = [
  { manager: "K. Aldridge", club: "Royal United", points: 4120 },
  { manager: "T. Moreau", club: "Metro City", points: 3870 },
  { manager: "S. Ibori", club: "Thunder FC", points: 3610 },
  { manager: "D. Vance", club: "Golden Eagles", points: 3340 },
  { manager: "P. Larsen", club: "Ocean FC", points: 3105 },
];

export const ACHIEVEMENTS: Array<{
  id: string;
  label: string;
  hint: string;
  target: number;
  metric: "matches" | "wins" | "goalsFor" | "cleanSheets" | "tournamentWins" | "trophies";
}> = [
  { id: "a-first", label: "First Whistle", hint: "Play your first match", target: 1, metric: "matches" },
  { id: "a-win5", label: "Winning Habit", hint: "Win 5 matches", target: 5, metric: "wins" },
  { id: "a-goals25", label: "Goal Machine", hint: "Score 25 goals", target: 25, metric: "goalsFor" },
  { id: "a-clean5", label: "Brick Wall", hint: "Keep 5 clean sheets", target: 5, metric: "cleanSheets" },
  { id: "a-cup", label: "Cup Fighter", hint: "Win 3 tournament matches", target: 3, metric: "tournamentWins" },
  { id: "a-trophy", label: "Dynasty Begins", hint: "Win a league title", target: 1, metric: "trophies" },
];

export const STAFF_ROLES: Array<{
  key: "coach" | "scout" | "physio";
  label: string;
  hint: string;
}> = [
  { key: "coach", label: "Head Coach", hint: "Boosts XP earned by your players" },
  { key: "scout", label: "Chief Scout", hint: "Improves the quality of scouted players" },
  { key: "physio", label: "Physio", hint: "Speeds up fitness recovery between matches" },
];
