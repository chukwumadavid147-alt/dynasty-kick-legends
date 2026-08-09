import { FORMATIONS } from "./data";
import type { Difficulty, FormationName, PlayerCard } from "./types";

export const W = 1050;
export const H = 680;
const GOAL_TOP = H / 2 - 80;
const GOAL_BOT = H / 2 + 80;
const MARGIN = 34;

export interface Input {
  dx: number;
  dy: number;
  sprint: boolean;
  pass: boolean;
  shoot: boolean;
  tackle: boolean;
}

export interface EngineEvents {
  onScore: (home: number, away: number) => void;
  onClock: (secondsLeft: number) => void;
  onEnd: (home: number, away: number) => void;
}

interface Actor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  home: boolean;
  gk: boolean;
  hx: number;
  hy: number;
  spd: number;
  sht: number;
  pas: number;
  def: number;
  cooldown: number;
  num: number;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  owner: Actor | null;
  lock: number;
}

const DIFF: Record<Difficulty, { speed: number; react: number; aim: number; press: number }> = {
  EASY: { speed: 0.82, react: 0.35, aim: 0.55, press: 0.55 },
  NORMAL: { speed: 0.94, react: 0.18, aim: 0.75, press: 0.8 },
  HARD: { speed: 1.06, react: 0.06, aim: 0.92, press: 1 },
};

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(ax - bx, ay - by);

export class MatchEngine {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private actors: Actor[] = [];
  private ball: Ball;
  private raf = 0;
  private acc = 0;
  private last = 0;
  private running = false;
  private time: number;
  private home = 0;
  private away = 0;
  private diff: (typeof DIFF)[Difficulty];
  private controlled: Actor | null = null;
  private celebration = 0;
  input: Input = { dx: 0, dy: 0, sprint: false, pass: false, shoot: false, tackle: false };

  constructor(
    canvas: HTMLCanvasElement,
    private lineup: PlayerCard[],
    private formation: FormationName,
    difficulty: Difficulty,
    seconds: number,
    private events: EngineEvents,
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    this.ctx = ctx;
    this.diff = DIFF[difficulty];
    this.time = seconds;
    this.ball = { x: W / 2, y: H / 2, vx: 0, vy: 0, owner: null, lock: 0 };
    this.buildTeams();
    this.kickoff(true);
  }

  private buildTeams() {
    const slots = FORMATIONS[this.formation];
    const mk = (slot: { x: number; y: number }, p: PlayerCard | undefined, home: boolean, num: number): Actor => {
      const hx = home ? slot.x * W : W - slot.x * W;
      const hy = home ? slot.y * H : H - slot.y * H;
      const base = p ?? { speed: 68, shooting: 66, passing: 66, defense: 66, fitness: 100, number: num };
      // low fitness slightly reduces effectiveness during the match
      const f = 0.8 + Math.max(0, Math.min(100, base.fitness ?? 100)) / 500;
      return {
        x: hx,
        y: hy,
        vx: 0,
        vy: 0,
        home,
        gk: slot.x < 0.1,
        hx,
        hy,
        spd: base.speed * f,
        sht: base.shooting * f,
        pas: base.passing * f,
        def: base.defense * f,
        cooldown: 0,
        num: p?.number ?? num,
      };
    };
    this.actors = [];
    slots.forEach((s, i) => this.actors.push(mk(s, this.lineup[i], true, i + 1)));
    slots.forEach((s, i) => this.actors.push(mk(s, undefined, false, i + 1)));
  }


  private kickoff(homeStart: boolean) {
    for (const a of this.actors) {
      a.x = a.hx;
      a.y = a.hy;
      a.vx = 0;
      a.vy = 0;
      a.cooldown = 0;
    }
    this.ball.x = W / 2;
    this.ball.y = H / 2;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.lock = 0;
    const team = this.actors.filter((a) => a.home === homeStart && !a.gk);
    this.ball.owner = team[team.length - 1] ?? null;
    this.controlled = this.ball.owner?.home ? this.ball.owner : null;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = (t: number) => {
      if (!this.running) return;
      const delta = Math.min((t - this.last) / 1000, 0.25);
      this.last = t;
      this.acc += delta;
      while (this.acc >= 1 / 60) {
        this.step(1 / 60);
        this.acc -= 1 / 60;
      }
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private nearestHomeToBall(): Actor {
    const outfield = this.actors.filter((a) => a.home && !a.gk);
    let best = outfield[0] as Actor;
    let bd = Infinity;
    for (const a of outfield) {
      const d = dist(a.x, a.y, this.ball.x, this.ball.y);
      if (d < bd) {
        bd = d;
        best = a;
      }
    }
    return best;
  }

  private step(dt: number) {
    if (this.celebration > 0) {
      this.celebration -= dt;
      if (this.celebration <= 0) this.kickoff(this.celebration < 0 && Math.random() < 0.5);
      return;
    }
    this.time -= dt;
    this.events.onClock(Math.max(0, this.time));
    if (this.time <= 0) {
      this.stop();
      this.events.onEnd(this.home, this.away);
      return;
    }

    const owner = this.ball.owner;
    if (!owner || owner.home) {
      const target = owner && owner.home ? owner : this.nearestHomeToBall();
      this.controlled = target;
    } else if (!this.controlled || this.controlled.gk) {
      this.controlled = this.nearestHomeToBall();
    }

    for (const a of this.actors) {
      a.cooldown = Math.max(0, a.cooldown - dt);
      if (a === this.controlled) this.driveControlled(a, dt);
      else this.driveAI(a, dt);
      a.x = clamp(a.x + a.vx * dt, 12, W - 12);
      a.y = clamp(a.y + a.vy * dt, 12, H - 12);
    }

    this.updateBall(dt);
    this.resolveActions();
    this.checkGoal();
  }

  private driveControlled(a: Actor, dt: number) {
    const i = this.input;
    const mag = Math.hypot(i.dx, i.dy);
    const speed = (140 + a.spd * 1.5) * (i.sprint ? 1.35 : 1);
    if (mag > 0.05) {
      a.vx += ((i.dx / mag) * speed - a.vx) * Math.min(1, dt * 9);
      a.vy += ((i.dy / mag) * speed - a.vy) * Math.min(1, dt * 9);
    } else {
      a.vx *= 0.82;
      a.vy *= 0.82;
    }
  }

  private driveAI(a: Actor, dt: number) {
    const b = this.ball;
    const attackingRight = a.home;
    const goalX = attackingRight ? W : 0;
    let tx = a.hx;
    let ty = a.hy;
    const mine = b.owner === a;
    const teamHasBall = b.owner ? b.owner.home === a.home : false;
    const scale = a.home ? 1 : this.diff.speed;

    if (a.gk) {
      const gx = a.home ? MARGIN + 18 : W - MARGIN - 18;
      tx = gx;
      ty = clamp(b.y, GOAL_TOP + 6, GOAL_BOT - 6);
      if (dist(b.x, b.y, gx, H / 2) < 130 && !b.owner) {
        tx = b.x;
        ty = b.y;
      }
    } else if (mine) {
      tx = goalX;
      ty = H / 2 + (a.hy - H / 2) * 0.35;
    } else if (teamHasBall) {
      tx = a.hx + (attackingRight ? 130 : -130);
      ty = a.hy * 0.75 + b.y * 0.25;
    } else {
      const chaser = this.closestOfTeam(a.home);
      if (chaser === a) {
        tx = b.x;
        ty = b.y;
      } else {
        tx = a.hx * (1 - 0.25 * this.diff.press) + b.x * 0.25 * this.diff.press;
        ty = a.hy * 0.6 + b.y * 0.4;
      }
    }

    const dx = tx - a.x;
    const dy = ty - a.y;
    const d = Math.hypot(dx, dy) || 1;
    const speed = (130 + a.spd * 1.4) * scale * (d > 90 ? 1.1 : 0.85);
    a.vx += ((dx / d) * speed - a.vx) * Math.min(1, dt * 7);
    a.vy += ((dy / d) * speed - a.vy) * Math.min(1, dt * 7);

    if (mine && a.cooldown <= 0) {
      const goalDist = Math.abs(goalX - a.x);
      if (goalDist < 260 && Math.random() < 0.03 * (a.home ? 1 : this.diff.press + 0.3)) {
        this.shoot(a);
      } else if (Math.random() < 0.02) {
        this.pass(a);
      }
    }
  }

  private closestOfTeam(home: boolean): Actor | null {
    let best: Actor | null = null;
    let bd = Infinity;
    for (const a of this.actors) {
      if (a.home !== home || a.gk) continue;
      const d = dist(a.x, a.y, this.ball.x, this.ball.y);
      if (d < bd) {
        bd = d;
        best = a;
      }
    }
    return best;
  }

  private updateBall(dt: number) {
    const b = this.ball;
    b.lock = Math.max(0, b.lock - dt);
    if (b.owner) {
      const o = b.owner;
      const m = Math.hypot(o.vx, o.vy) || 1;
      b.x = o.x + (o.vx / m) * 20;
      b.y = o.y + (o.vy / m) * 20;
      b.vx = o.vx;
      b.vy = o.vy;
    } else {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.vx *= 0.985;
      b.vy *= 0.985;
      if (b.y < MARGIN || b.y > H - MARGIN) {
        b.y = clamp(b.y, MARGIN, H - MARGIN);
        b.vy *= -0.7;
      }
      const inGoalMouth = b.y > GOAL_TOP && b.y < GOAL_BOT;
      if (!inGoalMouth && (b.x < MARGIN || b.x > W - MARGIN)) {
        b.x = clamp(b.x, MARGIN, W - MARGIN);
        b.vx *= -0.7;
      }
      // possession pickup
      if (b.lock <= 0) {
        let taker: Actor | null = null;
        let bd = 26;
        for (const a of this.actors) {
          const d = dist(a.x, a.y, b.x, b.y);
          if (d < bd) {
            bd = d;
            taker = a;
          }
        }
        if (taker) {
          b.owner = taker;
          if (taker.gk) {
            // keeper save / clearance
            b.lock = 0.35;
            window.setTimeout(() => {
              if (this.ball.owner === taker) this.clear(taker);
            }, 400);
          }
        }
      }
    }
  }

  private clear(a: Actor) {
    const dirX = a.home ? 1 : -1;
    const power = 420;
    this.ball.owner = null;
    this.ball.lock = 0.3;
    this.ball.vx = dirX * power;
    this.ball.vy = (Math.random() - 0.5) * 280;
  }

  private pass(a: Actor) {
    const mates = this.actors.filter((m) => m !== a && m.home === a.home && !m.gk);
    const fwd = a.home ? 1 : -1;
    let best: Actor | null = null;
    let bestScore = -Infinity;
    for (const m of mates) {
      const d = dist(a.x, a.y, m.x, m.y);
      if (d > 420) continue;
      const score = (m.x - a.x) * fwd * 0.6 - d * 0.25;
      if (score > bestScore) {
        bestScore = score;
        best = m;
      }
    }
    const target = best ?? mates[0];
    if (!target) return;
    const dx = target.x - a.x;
    const dy = target.y - a.y;
    const d = Math.hypot(dx, dy) || 1;
    const power = clamp(d * 2.1, 260, 620) * (0.85 + a.pas / 400);
    this.ball.owner = null;
    this.ball.lock = 0.18;
    this.ball.vx = (dx / d) * power;
    this.ball.vy = (dy / d) * power;
    a.cooldown = 0.3;
  }

  private shoot(a: Actor) {
    const goalX = a.home ? W - 6 : 6;
    const accuracy = a.home ? 0.6 + a.sht / 260 : this.diff.aim;
    const spread = (1 - accuracy) * 260;
    const targetY = H / 2 + (Math.random() - 0.5) * (110 + spread);
    const dx = goalX - a.x;
    const dy = targetY - a.y;
    const d = Math.hypot(dx, dy) || 1;
    const power = 620 + a.sht * 3.2;
    this.ball.owner = null;
    this.ball.lock = 0.2;
    this.ball.vx = (dx / d) * power;
    this.ball.vy = (dy / d) * power;
    a.cooldown = 0.5;
  }

  private tackle(a: Actor) {
    const o = this.ball.owner;
    a.cooldown = 0.6;
    if (!o || o.home === a.home) return;
    if (dist(a.x, a.y, o.x, o.y) < 46) {
      const success = Math.random() < 0.45 + a.def / 260;
      if (success) {
        this.ball.owner = a;
        this.ball.lock = 0.15;
      }
    }
  }

  private resolveActions() {
    const c = this.controlled;
    const i = this.input;
    if (!c) return;
    if (i.pass) {
      i.pass = false;
      if (this.ball.owner === c) this.pass(c);
    }
    if (i.shoot) {
      i.shoot = false;
      if (this.ball.owner === c) this.shoot(c);
    }
    if (i.tackle) {
      i.tackle = false;
      if (c.cooldown <= 0) this.tackle(c);
    }
    // AI defenders auto tackle
    const owner = this.ball.owner;
    if (owner && !owner.home) return;
    if (owner && owner.home) {
      for (const a of this.actors) {
        if (a.home || a.gk || a.cooldown > 0) continue;
        if (dist(a.x, a.y, owner.x, owner.y) < 26 && Math.random() < 0.06 * this.diff.press) {
          a.cooldown = this.diff.react + 0.4;
          if (Math.random() < 0.55 * this.diff.press) {
            this.ball.owner = a;
            this.ball.lock = 0.15;
          }
        }
      }
    }
  }

  private checkGoal() {
    const b = this.ball;
    const inMouth = b.y > GOAL_TOP && b.y < GOAL_BOT;
    if (!inMouth) return;
    if (b.x >= W - 10) {
      this.home += 1;
      this.goalScored();
    } else if (b.x <= 10) {
      this.away += 1;
      this.goalScored();
    }
  }

  private goalScored() {
    this.events.onScore(this.home, this.away);
    this.ball.owner = null;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.x = W / 2;
    this.ball.y = H / 2;
    this.celebration = 1.2;
  }

  /* ---------------- rendering ---------------- */

  private draw() {
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const scale = Math.min(cw / W, ch / H);
    ctx.save();
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, cw, ch);
    ctx.translate((cw - W * scale) / 2, (ch - H * scale) / 2);
    ctx.scale(scale, scale);

    // turf
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = i % 2 === 0 ? "#12643a" : "#0f5733";
      ctx.fillRect((i * W) / 10, 0, W / 10, H);
    }

    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 3;
    ctx.strokeRect(MARGIN, MARGIN, W - MARGIN * 2, H - MARGIN * 2);
    ctx.beginPath();
    ctx.moveTo(W / 2, MARGIN);
    ctx.lineTo(W / 2, H - MARGIN);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 78, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fill();

    // boxes + goals
    const boxH = 260;
    const boxW = 120;
    ctx.strokeRect(MARGIN, H / 2 - boxH / 2, boxW, boxH);
    ctx.strokeRect(W - MARGIN - boxW, H / 2 - boxH / 2, boxW, boxH);
    ctx.strokeRect(MARGIN, H / 2 - 100, 52, 200);
    ctx.strokeRect(W - MARGIN - 52, H / 2 - 100, 52, 200);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillRect(MARGIN - 16, GOAL_TOP, 16, GOAL_BOT - GOAL_TOP);
    ctx.fillRect(W - MARGIN, GOAL_TOP, 16, GOAL_BOT - GOAL_TOP);

    // actors
    for (const a of this.actors) {
      ctx.beginPath();
      ctx.arc(a.x, a.y + 4, 13, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(a.x, a.y, 13, 0, Math.PI * 2);
      ctx.fillStyle = a.gk ? (a.home ? "#f7c948" : "#c94f4f") : a.home ? "#3ddc84" : "#e0e4f0";
      ctx.fill();
      if (a === this.controlled) {
        ctx.strokeStyle = "#f7c948";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(a.x, a.y, 19, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = "#0b1220";
      ctx.font = "bold 12px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(a.num), a.x, a.y);
    }

    // ball
    const b = this.ball;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#0b1220";
    ctx.lineWidth = 2;
    ctx.stroke();

    if (this.celebration > 0) {
      ctx.fillStyle = "rgba(11,18,32,0.55)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#f7c948";
      ctx.font = "bold 76px system-ui, sans-serif";
      ctx.fillText("GOAL!", W / 2, H / 2);
    }
    ctx.restore();
  }
}
