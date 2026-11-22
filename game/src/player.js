// Velvet Fox — the thief. Runs fast, sneaks slow and quiet, grabs loot with
// E and tosses coins with a click to pull guards away. Walls and crates stop
// her; the room's edges stop her too.
import { WORLD_W, WORLD_H } from './levels.js';
import { collideCircleRects } from './vision.js';

export const PLAYER_RADIUS = 11;
export const RUN_SPEED = 165;
export const SNEAK_SPEED = 88;

export function createPlayer(start) {
  return {
    x: start.x,
    y: start.y,
    angle: -Math.PI / 2,
    sneaking: false,
    moving: false,
    coins: 0,
    score: 0,
    lootTaken: 0,
    hidden: false,
    stepTimer: 0,
  };
}

export function updatePlayer(p, dt, axis, sneaking, blockers) {
  p.sneaking = sneaking;
  const speed = sneaking ? SNEAK_SPEED : RUN_SPEED;
  p.moving = axis.x !== 0 || axis.y !== 0;
  if (p.moving) {
    p.angle = Math.atan2(axis.y, axis.x);
    const nx = p.x + axis.x * speed * dt;
    const ny = p.y + axis.y * speed * dt;
    const hit = collideCircleRects(nx, ny, PLAYER_RADIUS, blockers);
    p.x = Math.max(PLAYER_RADIUS, Math.min(WORLD_W - PLAYER_RADIUS, hit.x));
    p.y = Math.max(PLAYER_RADIUS, Math.min(WORLD_H - PLAYER_RADIUS, hit.y));
  }
  p.stepTimer += dt;
  return p;
}

// Nearest ungrabbed loot within reach, or null.
export function lootInReach(p, loot, reach = 34) {
  let best = null;
  let bestD = reach;
  for (const item of loot) {
    if (item.taken) continue;
    const d = Math.hypot(item.x - p.x, item.y - p.y);
    if (d < bestD) { best = item; bestD = d; }
  }
  return best;
}

// Toss a coin toward a point: it lands there with a little scatter.
export function tossCoin(p, tx, ty) {
  if (p.coins <= 0) return null;
  p.coins -= 1;
  const d = Math.hypot(tx - p.x, ty - p.y);
  const maxThrow = 260;
  const k = d > maxThrow ? maxThrow / d : 1;
  return {
    x: p.x + (tx - p.x) * k + (Math.random() - 0.5) * 14,
    y: p.y + (ty - p.y) * k + (Math.random() - 0.5) * 14,
  };
}
