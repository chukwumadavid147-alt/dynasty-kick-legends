import { overall } from "@/lib/game/data";
import type { PlayerCard as PlayerCardType } from "@/lib/game/types";
import { cn } from "@/lib/utils";

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-[0.6rem] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
      </div>
      <span className="w-6 text-right text-[0.7rem] font-bold tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}

export function PlayerCard({
  player,
  active,
  footer,
  onClick,
}: {
  player: PlayerCardType;
  active?: boolean;
  footer?: React.ReactNode;
  onClick?: () => void;
}) {
  const ovr = overall(player);
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        "flex w-full flex-col gap-3 rounded-2xl bg-card p-4 text-left ring-1 ring-border transition-all",
        onClick && "cursor-pointer hover:ring-primary/60",
        active && "ring-2 ring-primary shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_15%,transparent)]",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-gold/15 ring-1 ring-gold/40">
          <span className="text-lg font-extrabold text-gold tabular-nums">{ovr}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">{player.name}</p>
          <p className="text-xs text-muted-foreground">
            {player.position} · Lvl {player.level}
          </p>
        </div>
        {active && (
          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-primary">
            Starting
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        <Bar label="PAC" value={player.speed} />
        <Bar label="SHO" value={player.shooting} />
        <Bar label="PAS" value={player.passing} />
        <Bar label="DEF" value={player.defense} />
        <Bar label="STA" value={player.stamina} />
      </div>
      {footer}
    </div>
  );
}
