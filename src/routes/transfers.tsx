import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { GameShell } from "@/components/game/GameShell";
import { PlayerCard } from "@/components/game/PlayerCard";
import { actions, useGame } from "@/lib/game/store";

export const Route = createFileRoute("/transfers")({
  head: () => ({
    meta: [
      { title: "Transfer Market — Football Dynasty" },
      {
        name: "description",
        content:
          "Browse the Football Dynasty transfer market, compare ratings and prices, and sign new players with the coins you earn on the pitch.",
      },
      { property: "og:title", content: "Transfer Market — Football Dynasty" },
      {
        property: "og:description",
        content: "Scout and sign fictional players to strengthen your squad.",
      },
    ],
  }),
  component: TransfersPage,
});

function TransfersPage() {
  const game = useGame();

  return (
    <GameShell title="Transfer Market">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
        <p className="text-sm text-muted-foreground">
          Budget: <span className="font-extrabold text-gold">{game.coins.toLocaleString()} coins</span>
        </p>
        <button
          onClick={() => actions.refreshMarket()}
          className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-xs font-black uppercase tracking-wide text-secondary-foreground ring-1 ring-border"
        >
          <RefreshCw className="size-4" /> Scout new players
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {game.market.map((p) => {
          const affordable = game.coins >= p.price;
          return (
            <PlayerCard
              key={p.id}
              player={p}
              footer={
                <button
                  onClick={() => actions.buyPlayer(p.id)}
                  disabled={!affordable}
                  className="w-full rounded-lg bg-primary px-3 py-2.5 text-xs font-black uppercase tracking-wide text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {affordable ? `Sign · ${p.price.toLocaleString()}` : `Need ${p.price.toLocaleString()}`}
                </button>
              }
            />
          );
        })}
      </div>
      {game.market.length === 0 && (
        <p className="rounded-2xl bg-card p-8 text-center text-sm text-muted-foreground ring-1 ring-border">
          No players listed. Scout again to refresh the market.
        </p>
      )}
    </GameShell>
  );
}
