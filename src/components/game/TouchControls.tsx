import { useEffect, useRef, useState } from "react";

export function Joystick({ onChange }: { onChange: (dx: number, dy: number) => void }) {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const active = useRef<number | null>(null);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (active.current !== e.pointerId || !base.current) return;
      const r = base.current.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const max = r.width / 2;
      let dx = e.clientX - cx;
      let dy = e.clientY - cy;
      const d = Math.hypot(dx, dy);
      if (d > max) {
        dx = (dx / d) * max;
        dy = (dy / d) * max;
      }
      setKnob({ x: dx, y: dy });
      onChange(dx / max, dy / max);
    };
    const end = (e: PointerEvent) => {
      if (active.current !== e.pointerId) return;
      active.current = null;
      setKnob({ x: 0, y: 0 });
      onChange(0, 0);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [onChange]);

  return (
    <div
      ref={base}
      onPointerDown={(e) => {
        active.current = e.pointerId;
      }}
      className="relative size-32 touch-none rounded-full bg-card/80 ring-2 ring-border backdrop-blur"
      aria-label="Movement joystick"
      role="application"
    >
      <div
        className="absolute left-1/2 top-1/2 size-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/80 ring-2 ring-primary"
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
    </div>
  );
}

export function ActionButton({
  label,
  onDown,
  onUp,
  tone = "primary",
}: {
  label: string;
  onDown: () => void;
  onUp?: () => void;
  tone?: "primary" | "gold" | "muted";
}) {
  const tones = {
    primary: "bg-primary/85 text-primary-foreground ring-primary",
    gold: "bg-gold/85 text-gold-foreground ring-gold",
    muted: "bg-secondary text-secondary-foreground ring-border",
  } as const;
  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.preventDefault();
        onDown();
      }}
      onPointerUp={() => onUp?.()}
      onPointerLeave={() => onUp?.()}
      className={`size-16 touch-none rounded-full text-xs font-extrabold uppercase tracking-wide ring-2 active:scale-95 ${tones[tone]}`}
    >
      {label}
    </button>
  );
}
