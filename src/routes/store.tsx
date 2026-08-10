import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Coins, Gem } from "lucide-react";
import { GameShell } from "@/components/game/GameShell";
import { STORE_ITEMS, type StoreItem } from "@/lib/game/content";
import { actions, useGame } from "@/lib/game/store";

export const Route = createFileRoute("/store")({
  head: () => ({
    meta: [
      { title: "Club Store — Football Dynasty X" },
      {
        name: "description",
        content:
          "Spend in-game coins and gems in the Football Dynasty X store on player packs, club upgrades, training boosts and cosmetics.",
      },
      { property: "og:title", content: "Club Store — Football Dynasty X" },
      { property: "og:description", content: "Player packs, club items, training boosts and cosmetics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StorePage,
});

const TABS: Array<{ key: StoreItem["category"] | "ALL"; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "PACKS", label: "Player packs" },
  { key: "CLUB", label: "Club items" },
  { key: "TRAINING", label: "Training" },
  { key: "COSMETIC", label: "Cosmetics" },
];

function StorePage() {
  const game = useGame();
  const [tab, setTab] = useState<StoreItem["category"] | "ALL">("ALL");
  const [busy, setBusy] = useState<string | null>(null);

  const items = STORE_ITEMS.filter((i) => tab === "ALL" || i.category === tab);

  const buy = (id: string) => {
    setBusy(id);
    actions.buyStoreItem(id);
    window.setTimeout(() => setBusy(null), 350);
  };

  return (
    <GameShell title="Store" subtitle="In-game currency only — no real-money purchases">
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`press rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wide ring-1 transition-colors ${
              tab === t.key
                ? "bg-gold text-gold-foreground ring-gold"
                : "bg-secondary text-secondary-foreground ring-border hover:ring-gold/60"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((i) => {
          const owned = !i.repeatable && game.ownedItems.includes(i.id);
          const affordable = game.coins >= i.costCoins && game.gems >= i.costGems;
          return (
            <article key={i.id} className="card-premium flex flex-col rounded-2xl p-4">
              <span className="w-fit rounded-full bg-secondary px-2 py-0.5 text-[0.55rem] font-black uppercase tracking-widest text-muted-foreground">
                {i.category}
              </span>
              <h3 className="mt-2 text-base font-black text-foreground">{i.name}</h3>
              <p className="mt-1 flex-1 text-xs text-muted-foreground">{i.blurb}</p>
              <button
                type="button"
                disabled={owned || !affordable || busy === i.id}
                onClick={() => buy(i.id)}
                className="press mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-3 py-2.5 text-xs font-black uppercase tracking-wide text-gold-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                {owned ? (
                  <>
                    <Check className="size-4" /> Owned
                  </>
                ) : busy === i.id ? (
                  "Processing…"
                ) : i.costGems > 0 ? (
                  <>
                    <Gem className="size-4" /> {i.costGems} gems
                  </>
                ) : (
                  <>
                    <Coins className="size-4" /> {i.costCoins.toLocaleString()}
                  </>
                )}
              </button>
            </article>
          );
        })}
      </div>
      {!items.length && (
        <p className="rounded-2xl bg-card p-8 text-center text-sm text-muted-foreground ring-1 ring-border">
          Nothing stocked in this category yet.
        </p>
      )}
    </GameShell>
  );
}
