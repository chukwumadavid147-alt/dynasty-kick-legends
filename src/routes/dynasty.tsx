import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Crown, Coins, Trophy } from "lucide-react";
import { GameShell } from "@/components/game/GameShell";
import { actions, nextOpponent, sortTablePosition, teamRating, useGame } from "@/lib/game/store";

export const Route = createFileRoute("/dynasty")({
  head: () => ({
    meta: [
      { title: "Dynasty Mode — Football Dynasty" },
      {
        name: "description",
        content:
          "Run your club in Dynasty Mode: track the season, upgrade your stadium, bank coins, win trophies and earn promotion.",
      },
      { property: "og:title", content: "Dynasty Mode — Football Dynasty" },
      {
        property: "og:description",
        content: "Club hub for season progress, stadium upgrades and trophies.",
      },
    ],
  }),
  component: DynastyPage,
});

function DynastyPage() {
  const game = useGame();
  const opponent = nextOpponent(game);
  const stadiumCost = game.stadiumLevel * 1500;
  const played = game.table.find((r) => r.club === game.club)?.played ?? 0;
  const position = sortTablePosition(game);

  return (
    <GameShell title="Dynasty Mode">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border md:col-span-2">
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Club hub</h2>
          <p className="mt-2 text-3xl font-black text-foreground">{game.club}</p>
          <p className="text-sm text-muted-foreground">
            {game.league} · Season {game.season} · Position {position}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: Coins, label: "Coins", value: game.coins.toLocaleString() },
              { icon: Crown, label: "Rating", value: teamRating(game) },
              { icon: Trophy, label: "Trophies", value: game.trophies },
              { icon: Building2, label: "Stadium", value: `Lv ${game.stadiumLevel}` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl bg-secondary p-3">
                <Icon className="size-4 text-accent" />
                <p className="mt-2 text-[0.6rem] uppercase tracking-widest text-muted-foreground">
                  {label}
                </p>
                <p className="text-lg font-extrabold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Next fixture</h2>
          <p className="mt-3 text-xl font-black text-foreground">{game.club}</p>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">vs</p>
          <p className="text-xl font-black text-foreground">{opponent}</p>
          <Link
            to="/match"
            className="mt-5 block rounded-xl bg-primary px-4 py-3 text-center text-sm font-black uppercase tracking-widest text-primary-foreground"
          >
            Play match
          </Link>
          {game.lastResult && (
            <p className="mt-4 text-xs text-muted-foreground">
              Last: {game.lastResult.outcome} {game.lastResult.scored}–{game.lastResult.conceded} vs{" "}
              {game.lastResult.opponent}
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Stadium</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Bigger stands mean bigger gates. Each level boosts your matchday atmosphere and club
            prestige.
          </p>
          <button
            onClick={() => actions.upgradeStadium()}
            disabled={game.coins < stadiumCost}
            className="mt-4 w-full rounded-xl bg-gold px-4 py-3 text-sm font-black uppercase tracking-wide text-gold-foreground disabled:opacity-40"
          >
            Upgrade to Lv {game.stadiumLevel + 1} · {stadiumCost.toLocaleString()}
          </button>
        </div>

        <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Season</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {played} matches played. Finish top of the table to lift the trophy and win promotion.
          </p>
          <button
            onClick={() => actions.endSeason()}
            disabled={played < 9}
            className="mt-4 w-full rounded-xl bg-secondary px-4 py-3 text-sm font-black uppercase tracking-wide text-secondary-foreground ring-1 ring-border disabled:opacity-40"
          >
            {played < 9 ? `End season (${played}/9)` : "End season"}
          </button>
        </div>

        <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Grow the club</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Win matches to bank more coins</li>
            <li>Upgrade players in My Squad</li>
            <li>Sign talent in the Transfer Market</li>
            <li>Climb the table for promotion</li>
          </ul>
        </div>
      </div>
    </GameShell>
  );
}
