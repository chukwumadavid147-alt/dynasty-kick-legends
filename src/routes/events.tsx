import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Target } from "lucide-react";
import { GameShell } from "@/components/game/GameShell";
import { actions, useGame } from "@/lib/game/store";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Live Events & Daily Challenges — Football Dynasty X" },
      {
        name: "description",
        content:
          "Rotating live events and daily challenges in Football Dynasty X. Complete objectives to earn coins, gems and manager XP.",
      },
      { property: "og:title", content: "Live Events & Daily Challenges — Football Dynasty X" },
      { property: "og:description", content: "Rotating objectives with coin, gem and XP rewards." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const game = useGame();

  return (
    <GameShell title="Live Events" subtitle="Rotating objectives and limited-time rewards">
      <section className="mb-5">
        <h3 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-gold">
          <Sparkles className="size-4" /> Live events
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {game.liveEvents.map((e) => (
            <article key={e.id} className="card-premium rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-base font-black text-foreground">{e.name}</h4>
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[0.55rem] font-black uppercase tracking-widest text-primary">
                  Live
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{e.blurb}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-gold"
                  style={{ width: `${Math.min(100, (e.progress / e.target) * 100)}%` }}
                />
              </div>
              <p className="mt-2 flex items-center justify-between text-[0.7rem] font-bold text-muted-foreground">
                <span className="tabular-nums">
                  {Math.min(e.progress, e.target)}/{e.target}
                </span>
                <span className="text-gold">
                  {e.rewardCoins} coins · {e.rewardGems} gems
                </span>
              </p>
              <button
                type="button"
                disabled={e.claimed || e.progress < e.target}
                onClick={() => actions.claimEvent(e.id)}
                className="press mt-3 w-full rounded-xl bg-gold px-3 py-2 text-xs font-black uppercase tracking-wide text-gold-foreground disabled:opacity-40"
              >
                {e.claimed ? "Claimed" : "Claim reward"}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-gold">
          <Target className="size-4" /> Daily challenges
        </h3>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {game.challenges.map((c) => (
            <li key={c.id} className="card-premium rounded-2xl p-4">
              <p className="text-sm font-black text-foreground">{c.label}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${Math.min(100, (c.progress / c.target) * 100)}%` }}
                />
              </div>
              <p className="mt-2 flex items-center justify-between text-[0.7rem] font-bold text-muted-foreground">
                <span className="tabular-nums">
                  {Math.min(c.progress, c.target)}/{c.target}
                </span>
                <span className="text-gold">+{c.rewardCoins} coins</span>
              </p>
              <button
                type="button"
                disabled={c.claimed || c.progress < c.target}
                onClick={() => actions.claimChallenge(c.id)}
                className="press mt-3 w-full rounded-xl bg-secondary px-3 py-2 text-xs font-black uppercase tracking-wide text-foreground ring-1 ring-border disabled:opacity-40"
              >
                {c.claimed ? "Claimed" : "Claim"}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </GameShell>
  );
}
