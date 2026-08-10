import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, Trophy } from "lucide-react";
import { GameShell } from "@/components/game/GameShell";
import { ACHIEVEMENTS } from "@/lib/game/content";
import { actions, squadMorale, teamRating, useGame, xpForLevel } from "@/lib/game/store";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Manager Profile — Football Dynasty X" },
      {
        name: "description",
        content:
          "Your Football Dynasty X manager profile: level, XP, trophies, achievements and full career statistics.",
      },
      { property: "og:title", content: "Manager Profile — Football Dynasty X" },
      { property: "og:description", content: "Level, XP, achievements, trophies and career stats." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const game = useGame();
  const s = game.stats;
  const need = xpForLevel(game.managerLevel);
  const pct = Math.round((game.managerXp / need) * 100);

  const metricValue = (m: (typeof ACHIEVEMENTS)[number]["metric"]) =>
    m === "trophies" ? game.trophies : s[m];

  return (
    <GameShell title="Profile" subtitle="Manager career overview">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <section className="card-premium rounded-2xl p-5">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gold">Manager</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">
                Manager name
              </span>
              <input
                value={game.managerName}
                onChange={(e) => actions.setManagerName(e.target.value)}
                className="mt-1 w-full rounded-xl bg-secondary px-3 py-2 text-sm font-bold text-foreground ring-1 ring-border outline-none focus:ring-gold"
              />
            </label>
            <label className="block">
              <span className="text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">
                Club name
              </span>
              <input
                value={game.club}
                onChange={(e) => actions.setClubName(e.target.value)}
                className="mt-1 w-full rounded-xl bg-secondary px-3 py-2 text-sm font-bold text-foreground ring-1 ring-border outline-none focus:ring-gold"
              />
            </label>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>Level {game.managerLevel}</span>
              <span className="tabular-nums">
                {game.managerXp}/{need} XP
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["Trophies", game.trophies],
              ["Cups", game.tournament.titles],
              ["Reputation", game.reputation],
              ["Team rating", teamRating(game)],
            ].map(([k, v]) => (
              <div key={String(k)} className="rounded-xl bg-secondary px-3 py-2 text-center">
                <p className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground">{k}</p>
                <p className="text-lg font-black tabular-nums text-foreground">{v}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card-premium rounded-2xl p-5">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gold">Career statistics</h3>
          {s.matches === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No matches played yet.{" "}
              <Link to="/match" className="font-bold text-gold underline">
                Kick off your first game
              </Link>{" "}
              to start your record.
            </p>
          ) : (
            <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["Played", s.matches],
                ["Won", s.wins],
                ["Drawn", s.draws],
                ["Lost", s.losses],
                ["Goals for", s.goalsFor],
                ["Goals against", s.goalsAgainst],
                ["Clean sheets", s.cleanSheets],
                ["Cup wins", s.tournamentWins],
              ].map(([k, v]) => (
                <div key={String(k)} className="rounded-xl bg-secondary px-3 py-2">
                  <dt className="text-[0.6rem] uppercase tracking-widest text-muted-foreground">{k}</dt>
                  <dd className="text-lg font-black tabular-nums text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        <section className="card-premium rounded-2xl p-5 lg:col-span-2">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gold">Achievements</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ACHIEVEMENTS.map((a) => {
              const value = metricValue(a.metric);
              const done = value >= a.target;
              return (
                <div
                  key={a.id}
                  className={`rounded-xl p-3 ring-1 ${done ? "bg-gold/12 ring-gold/60" : "bg-secondary ring-border"}`}
                >
                  <div className="flex items-center gap-2">
                    {done ? (
                      <Trophy className="size-4 shrink-0 text-gold" />
                    ) : (
                      <Award className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    <p className={`text-sm font-black ${done ? "text-gold" : "text-foreground"}`}>{a.label}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{a.hint}</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background">
                    <div
                      className={`h-full rounded-full ${done ? "bg-gold" : "bg-accent"}`}
                      style={{ width: `${Math.min(100, (value / a.target) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-right text-[0.65rem] font-bold tabular-nums text-muted-foreground">
                    {Math.min(value, a.target)}/{a.target}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Squad morale: <span className="font-black text-foreground">{squadMorale(game)}%</span>
          </p>
        </section>
      </div>
    </GameShell>
  );
}
