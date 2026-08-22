import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FORMATION_NAMES, FORMATIONS_XI, overall } from "@/lib/game/data";
import { GameShell } from "@/components/game/GameShell";
import {
  actions,
  attackRating,
  benchPlayers,
  defenceRating,
  lineupPlayers,
  midfieldRating,
  teamRating,
  upgradeCost,
  useGame,
} from "@/lib/game/store";
import type { PlayerCard as PlayerCardType } from "@/lib/game/types";

export const Route = createFileRoute("/squad")({
  head: () => ({
    meta: [
      { title: "My Squad — Football Dynasty" },
      {
        name: "description",
        content:
          "Manage your Football Dynasty squad: set the starting XI on the pitch, switch formation, make substitutions, pick a captain and track fitness.",
      },
      { property: "og:title", content: "My Squad — Football Dynasty" },
      {
        property: "og:description",
        content: "Starting XI, formations, substitutions, captaincy and player fitness.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SquadPage,
});

function fitnessTone(f: number) {
  return f >= 80 ? "bg-primary" : f >= 55 ? "bg-gold" : "bg-destructive";
}

function FitnessBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[0.6rem] font-bold uppercase tracking-wider text-muted-foreground">Fit</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
        <div className={`h-full rounded-full ${fitnessTone(value)}`} style={{ width: `${value}%` }} />
      </div>
      <span className="w-7 text-right text-[0.7rem] font-bold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function RatingTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-secondary px-3 py-2 text-center">
      <p className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-xl font-black tabular-nums text-foreground">{value}</p>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2">
      <span className="text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="text-sm font-extrabold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function SquadPage() {
  const game = useGame();
  const xi = lineupPlayers(game);
  const bench = benchPlayers(game);
  const slots = FORMATIONS_XI[game.formation];

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [subOutId, setSubOutId] = useState<string | null>(null);

  const selected = game.squad.find((p) => p.id === selectedId) ?? null;
  const onPitch = (id: string) => xi.some((p) => p.id === id);

  const handleBenchPick = (p: PlayerCardType) => {
    if (subOutId) {
      actions.substitute(subOutId, p.id);
      setSubOutId(null);
      setSelectedId(null);
      return;
    }
    setSelectedId(p.id);
  };

  return (
    <GameShell title="My Squad">
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* Pitch + formation */}
        <section className="space-y-4">
          <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Formation</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {FORMATION_NAMES.map((f) => (
                <button
                  key={f}
                  onClick={() => actions.setFormation(f)}
                  className={`rounded-lg px-4 py-2 text-sm font-extrabold ring-1 transition-colors ${
                    game.formation === f
                      ? "bg-primary text-primary-foreground ring-primary"
                      : "bg-secondary text-secondary-foreground ring-border hover:ring-primary/50"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <RatingTile label="Attack" value={attackRating(game)} />
              <RatingTile label="Midfield" value={midfieldRating(game)} />
              <RatingTile label="Defence" value={defenceRating(game)} />
              <RatingTile label="Overall" value={teamRating(game)} />
            </div>
          </div>

          {subOutId && (
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-gold/15 px-4 py-3 ring-1 ring-gold/40">
              <p className="min-w-0 text-xs font-bold uppercase tracking-wide text-gold">
                Choose a bench player to bring on
              </p>
              <button
                onClick={() => setSubOutId(null)}
                className="shrink-0 rounded-lg bg-secondary px-3 py-1.5 text-[0.7rem] font-black uppercase text-secondary-foreground ring-1 ring-border"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-pitch/80 ring-1 ring-border sm:aspect-[4/5]">
            <div className="absolute inset-3 rounded-xl border-2 border-white/50" />
            <div className="absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/50" />
            <div className="absolute left-3 right-3 top-1/2 h-0.5 -translate-y-1/2 bg-white/50" />
            <div className="absolute bottom-3 left-1/2 h-16 w-2/5 -translate-x-1/2 border-2 border-b-0 border-white/50" />
            <div className="absolute top-3 left-1/2 h-16 w-2/5 -translate-x-1/2 border-2 border-t-0 border-white/50" />
            {slots.map((s, i) => {
              const p = xi[i];
              const isCaptain = p && game.captainId === p.id;
              const subbing = p && subOutId === p.id;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => p && setSelectedId(p.id)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 text-center focus:outline-none"
                  style={{ left: `${s.y * 100}%`, top: `${100 - s.x * 100 - 8}%` }}
                >
                  <div className="relative mx-auto">
                    <div
                      className={`grid size-10 place-items-center rounded-full bg-card text-[0.7rem] font-black ring-2 transition-colors sm:size-11 ${
                        subbing
                          ? "text-gold ring-gold"
                          : selectedId === p?.id
                            ? "text-gold ring-gold"
                            : "text-primary ring-primary"
                      }`}
                    >
                      {p ? p.number : s.role}
                    </div>
                    {isCaptain && (
                      <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-gold text-[0.5rem] font-black text-gold-foreground">
                        C
                      </span>
                    )}
                    {p && (
                      <span className="absolute -bottom-1 -left-1 grid size-4 place-items-center rounded-full bg-primary text-[0.5rem] font-black text-primary-foreground tabular-nums">
                        {overall(p)}
                      </span>
                    )}
                  </div>
                  <span className="mt-1.5 block max-w-20 truncate text-[0.6rem] font-bold text-white">
                    {p?.name ?? s.role}
                  </span>
                  <span className="block text-[0.55rem] font-bold uppercase tracking-wide text-white/70">
                    {p?.position ?? ""} {s.role !== p?.position && p ? `(${s.role})` : ""}
                  </span>
                </button>
              );
            })}
          </div>

          <Link
            to="/match"
            search={{ code: undefined, role: undefined }}
            className="block rounded-2xl bg-primary px-6 py-4 text-center text-sm font-black uppercase tracking-widest text-primary-foreground"
          >
            Play match
          </Link>
        </section>

        {/* Details + bench */}
        <section className="space-y-4">
          <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Player details</h2>
            {!selected ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Tap a player on the pitch or on the bench to see their full profile, make a substitution or
                hand them the captain&apos;s armband.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-gold/15 text-lg font-extrabold text-gold tabular-nums ring-1 ring-gold/40">
                    {overall(selected)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-foreground">
                      #{selected.number} {selected.name}
                      {game.captainId === selected.id && (
                        <span className="ml-2 rounded-full bg-gold px-2 py-0.5 text-[0.55rem] font-black uppercase text-gold-foreground">
                          Captain
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selected.position} · Lvl {selected.level} · {onPitch(selected.id) ? "Starting XI" : "Bench"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <StatRow label="Age" value={selected.age} />
                  <StatRow label="Overall" value={overall(selected)} />
                  <StatRow label="Speed" value={selected.speed} />
                  <StatRow label="Shooting" value={selected.shooting} />
                  <StatRow label="Passing" value={selected.passing} />
                  <StatRow label="Defending" value={selected.defense} />
                  <StatRow label="Fitness" value={`${selected.fitness}%`} />
                  <StatRow label="Value" value={selected.price.toLocaleString()} />
                </div>
                <FitnessBar value={selected.fitness} />
                <div className="flex flex-wrap gap-2">
                  {onPitch(selected.id) && (
                    <button
                      onClick={() => setSubOutId(selected.id)}
                      className="flex-1 rounded-lg bg-primary px-3 py-2 text-[0.7rem] font-black uppercase tracking-wide text-primary-foreground"
                    >
                      Substitute
                    </button>
                  )}
                  {!onPitch(selected.id) && subOutId && (
                    <button
                      onClick={() => {
                        actions.substitute(subOutId, selected.id);
                        setSubOutId(null);
                      }}
                      className="flex-1 rounded-lg bg-primary px-3 py-2 text-[0.7rem] font-black uppercase tracking-wide text-primary-foreground"
                    >
                      Bring on
                    </button>
                  )}
                  <button
                    onClick={() => actions.setCaptain(selected.id)}
                    disabled={game.captainId === selected.id}
                    className="flex-1 rounded-lg bg-gold px-3 py-2 text-[0.7rem] font-black uppercase tracking-wide text-gold-foreground disabled:opacity-40"
                  >
                    Make captain
                  </button>
                  <button
                    onClick={() => actions.upgradePlayer(selected.id)}
                    disabled={game.coins < upgradeCost(selected)}
                    className="flex-1 rounded-lg bg-secondary px-3 py-2 text-[0.7rem] font-black uppercase tracking-wide text-secondary-foreground ring-1 ring-border disabled:opacity-40"
                  >
                    Upgrade · {upgradeCost(selected).toLocaleString()}
                  </button>
                  <button
                    onClick={() => {
                      actions.sellPlayer(selected.id);
                      setSelectedId(null);
                      setSubOutId(null);
                    }}
                    disabled={game.squad.length <= 12}
                    className="flex-1 rounded-lg bg-destructive/15 px-3 py-2 text-[0.7rem] font-black uppercase tracking-wide text-destructive ring-1 ring-destructive/40 disabled:opacity-40"
                  >
                    Sell · {Math.round(selected.price * 0.6).toLocaleString()}
                  </button>
                </div>

              </div>
            )}
          </div>

          <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <h2 className="truncate text-sm font-black uppercase tracking-widest text-foreground">
                Bench · {bench.length}
              </h2>
              <span className="shrink-0 text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">
                Starting XI {xi.length}/11
              </span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {bench.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleBenchPick(p)}
                  className={`w-full space-y-2 rounded-xl bg-secondary p-3 text-left ring-1 transition-colors ${
                    selectedId === p.id ? "ring-2 ring-gold" : "ring-border hover:ring-primary/60"
                  } ${subOutId ? "ring-primary/50" : ""}`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-card text-sm font-extrabold text-gold tabular-nums ring-1 ring-gold/30">
                      {overall(p)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold text-foreground">
                        #{p.number} {p.name}
                        {game.captainId === p.id && (
                          <span className="ml-1 text-[0.55rem] font-black text-gold">(C)</span>
                        )}
                      </span>
                      <span className="block text-[0.65rem] text-muted-foreground">{p.position}</span>
                    </span>
                  </div>
                  <FitnessBar value={p.fitness} />
                </button>
              ))}
              {!bench.length && (
                <p className="text-xs text-muted-foreground">No substitutes — sign players in the transfer market.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </GameShell>
  );
}
