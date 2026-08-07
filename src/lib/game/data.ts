import type { FormationName, PlayerCard, Position, TableRow } from "./types";

export const CLUBS = [
  "Dynasty FC",
  "Royal United",
  "Metro City",
  "Thunder FC",
  "Golden Eagles",
  "Red Warriors",
  "Capital Stars",
  "Ocean FC",
  "Victory Athletic",
  "Lion Hearts",
];

export const LEAGUES = [
  "Beginner League",
  "Bronze Division",
  "Silver Division",
  "Gold Division",
  "Dynasty Elite",
];

const FIRST = [
  "Marcus","Jayden","Leo","Daniel","Ethan","Alex","Rico","Noah","Kai","Milo",
  "Theo","Elias","Andre","Bruno","Caleb","Dario","Emre","Felix","Gabriel","Hugo",
  "Ivan","Jonas","Kofi","Lucas","Mateo","Nikos","Omar","Pablo","Quinn","Rafael",
];

const LAST = [
  "Vale","Cole","Grant","King","Brooks","Storm","Rivers","Frost","Hale","Marsh",
  "Quinn","Sable","Vance","Reyes","Okoro","Bishop","Nolan","Falk","Duarte","Mensah",
  "Byrne","Costa","Adler","Rowe","Sterling","Novak","Bello","Kane","Ward","Silva",
];

export const POSITIONS: Position[] = ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"];

let seq = 0;
const uid = () => `p${Date.now().toString(36)}${(seq++).toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;

const rnd = (min: number, max: number) => Math.floor(min + Math.random() * (max - min + 1));
const pick = <T,>(arr: readonly T[]): T => arr[rnd(0, arr.length - 1)] as T;

export function overall(p: PlayerCard): number {
  const w =
    p.position === "GK"
      ? p.defense * 0.45 + p.speed * 0.2 + p.passing * 0.15 + p.stamina * 0.2
      : p.position === "ST" || p.position === "LW" || p.position === "RW"
        ? p.shooting * 0.35 + p.speed * 0.3 + p.passing * 0.2 + p.defense * 0.05 + p.stamina * 0.1
        : p.position === "CB" || p.position === "LB" || p.position === "RB"
          ? p.defense * 0.4 + p.speed * 0.2 + p.passing * 0.2 + p.stamina * 0.15 + p.shooting * 0.05
          : p.passing * 0.32 + p.speed * 0.2 + p.shooting * 0.18 + p.defense * 0.18 + p.stamina * 0.12;
  return Math.round(w);
}

export function priceFor(p: PlayerCard): number {
  const ovr = overall(p);
  return Math.round((Math.pow(Math.max(ovr - 45, 5), 2.1) * 1.6 + 250) / 50) * 50;
}

export function makePlayer(position: Position, base: number, name?: string): PlayerCard {
  const j = (bias = 0) => Math.max(35, Math.min(99, base + bias + rnd(-6, 6)));
  const attack = position === "ST" || position === "LW" || position === "RW";
  const def = position === "CB" || position === "LB" || position === "RB" || position === "GK";
  const p: PlayerCard = {
    id: uid(),
    name: name ?? `${pick(FIRST)} ${pick(LAST)}`,
    position,
    speed: position === "GK" ? j(-8) : j(attack ? 6 : 0),
    shooting: j(attack ? 8 : def ? -14 : 0),
    passing: j(position === "CM" || position === "CAM" ? 7 : def ? -4 : 0),
    defense: j(def ? 10 : attack ? -16 : 0),
    stamina: j(2),
    level: 1,
    xp: 0,
    price: 0,
  };
  p.price = priceFor(p);
  return p;
}

const STARTER_NAMES: Array<[string, Position]> = [
  ["Ethan Brooks", "GK"],
  ["Daniel King", "CB"],
  ["Samir Okoro", "CB"],
  ["Tom Rivers", "LB"],
  ["Owen Marsh", "RB"],
  ["Leo Grant", "CM"],
  ["Isaac Frost", "CM"],
  ["Nathan Hale", "CAM"],
  ["Jayden Cole", "RW"],
  ["Ruben Sable", "LW"],
  ["Marcus Vale", "ST"],
  ["Felix Nolan", "ST"],
];

export function makeStartingSquad(): PlayerCard[] {
  return STARTER_NAMES.map(([name, pos]) => makePlayer(pos, 64, name));
}

export function makeMarket(count = 12, base = 70): PlayerCard[] {
  return Array.from({ length: count }, () =>
    makePlayer(pick(POSITIONS), base + rnd(-8, 12)),
  );
}

export function makeTable(club: string): TableRow[] {
  const clubs = [club, ...CLUBS.filter((c) => c !== club)].slice(0, 10);
  return clubs.map((c) => ({ club: c, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 }));
}

export const points = (r: TableRow) => r.wins * 3 + r.draws;
export const gd = (r: TableRow) => r.gf - r.ga;

export function sortTable(rows: TableRow[]): TableRow[] {
  return [...rows].sort((a, b) => points(b) - points(a) || gd(b) - gd(a) || b.gf - a.gf);
}

/** Relative pitch slots, x: 0 (own goal) -> 1 (opponent goal), y: 0 (top) -> 1 (bottom) */
export const FORMATIONS: Record<FormationName, Array<{ x: number; y: number; role: Position }>> = {
  "4-3-3": [
    { x: 0.05, y: 0.5, role: "GK" },
    { x: 0.25, y: 0.3, role: "CB" },
    { x: 0.25, y: 0.7, role: "CB" },
    { x: 0.42, y: 0.5, role: "CM" },
    { x: 0.62, y: 0.2, role: "LW" },
    { x: 0.62, y: 0.8, role: "RW" },
    { x: 0.72, y: 0.5, role: "ST" },
  ],
  "4-4-2": [
    { x: 0.05, y: 0.5, role: "GK" },
    { x: 0.24, y: 0.28, role: "CB" },
    { x: 0.24, y: 0.72, role: "CB" },
    { x: 0.45, y: 0.22, role: "CM" },
    { x: 0.45, y: 0.78, role: "CM" },
    { x: 0.68, y: 0.38, role: "ST" },
    { x: 0.68, y: 0.62, role: "ST" },
  ],
  "3-5-2": [
    { x: 0.05, y: 0.5, role: "GK" },
    { x: 0.22, y: 0.5, role: "CB" },
    { x: 0.4, y: 0.18, role: "CM" },
    { x: 0.4, y: 0.82, role: "CM" },
    { x: 0.5, y: 0.5, role: "CAM" },
    { x: 0.7, y: 0.36, role: "ST" },
    { x: 0.7, y: 0.64, role: "ST" },
  ],
  "4-2-3-1": [
    { x: 0.05, y: 0.5, role: "GK" },
    { x: 0.23, y: 0.32, role: "CB" },
    { x: 0.23, y: 0.68, role: "CB" },
    { x: 0.38, y: 0.5, role: "CDM" },
    { x: 0.58, y: 0.22, role: "LW" },
    { x: 0.58, y: 0.78, role: "RW" },
    { x: 0.72, y: 0.5, role: "ST" },
  ],
};

export const FORMATION_NAMES = Object.keys(FORMATIONS) as FormationName[];
