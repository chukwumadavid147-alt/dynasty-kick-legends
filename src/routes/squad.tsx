import { createFileRoute, Link } from "@tanstack/react-router";
import { FORMATION_NAMES, FORMATIONS, overall } from "@/lib/game/data";
import { GameShell } from "@/components/game/GameShell";
import { PlayerCard } from "@/components/game/PlayerCard";
import { actions, lineupPlayers, upgradeCost, useGame } from "@/lib/game/store";

export const Route = createFileRoute("/squad")({
  head: () => ({
    meta: [
      { title: "My Squad — Football Dynasty" },
      {
        name: "description",
        content:
          "Manage your Football Dynasty squad: pick your starting lineup, switch formation, upgrade player ratings and study full stats.",
      },
      { property: "og:title", content: "My Squad — Football Dynasty" },
      {
        property: "og:description",
        content: "Lineup, formations and player upgrades for your football club.",
      },
    ],
  }),
  component: SquadPage,
});

function FormationPitch() {
  const game = useGame();
  const xi = lineupPlayers(game);
  const slots = FORMATIONS[game.formation];
  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-pitch/80 ring-1 ring-border sm:aspect-[4/3]">
      <div className="absolute inset-3 rounded-xl border-2 border-white/50" />
      <div className="absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/50" />
      <div className="absolute left-3 right-3 top-1/2 h-0.5 -translate-y-1/2 bg-white/50" />
      {slots.map((s, i) => {
        const p = xi[i];
        return (
          <div
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
            style={{ left: `${s.y * 100}%`, top: `${100 - s.x * 100 - 8}%` }}
          >
            <div className="mx-auto grid size-9 place-items-center rounded-full bg-card text-xs font-black text-primary ring-2 ring-primary">
              {p ? overall(p) : s.role}
            </div>
            <span className="mt-1 block max-w-20 truncate text-[0.6rem] font-bold text-white">
              {p?.name ?? s.role}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SquadPage() {
  const game = useGame();
  const lineupIds = new Set(lineupPlayers(game).map((p) => p.id));

  return (
    <GameShell title="My Squad">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
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
            <p className="mt-3 text-xs text-muted-foreground">
              {lineupIds.size} / 7 players selected. Tap a card to add or remove from the lineup.
            </p>
          </div>
          <FormationPitch />
          <Link
            to="/match"
            className="block rounded-2xl bg-primary px-6 py-4 text-center text-sm font-black uppercase tracking-widest text-primary-foreground"
          >
            Play match
          </Link>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          {game.squad.map((p) => {
            const cost = upgradeCost(p);
            return (
              <PlayerCard
                key={p.id}
                player={p}
                active={lineupIds.has(p.id)}
                onClick={() => actions.toggleLineup(p.id)}
                footer={
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        actions.upgradePlayer(p.id);
                      }}
                      disabled={game.coins < cost}
                      className="flex-1 rounded-lg bg-gold px-3 py-2 text-[0.7rem] font-black uppercase tracking-wide text-gold-foreground disabled:opacity-40"
                    >
                      Upgrade · {cost.toLocaleString()}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        actions.sellPlayer(p.id);
                      }}
                      className="rounded-lg bg-secondary px-3 py-2 text-[0.7rem] font-black uppercase tracking-wide text-secondary-foreground ring-1 ring-border"
                    >
                      Sell
                    </button>
                  </div>
                }
              />
            );
          })}
        </section>
      </div>
    </GameShell>
  );
}
