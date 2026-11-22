// Velvet Fox — guard patrol AI. A guard walks its waypoints, pauses to look
// around, and when it spots the Fox it raises the alarm and gives chase to
// the last place it saw them. A tossed coin pulls it off to investigate.
import { angleTo, dist, inVisionCone } from './vision.js';

export const GUARD_RANGE = 175;
export const GUARD_HALF_ANGLE = 0.56; // ~32 degrees each side
export const GUARD_CATCH_RADIUS = 26;

export function createGuard(def) {
  return {
    x: def.waypoints[0].x,
    y: def.waypoints[0].y,
    waypoints: def.waypoints,
    targetIndex: 1,
    speed: def.speed,
    pause: def.pause,
    waitTimer: 0,
    angle: 0,
    state: 'patrol', // patrol | suspicious | chase | investigate
    suspicion: 0, // 0..1, fills while the Fox is in the cone
    investigate: null, // {x, y} coin landing spot
    lastSeen: null,
    lookTimer: 0,
  };
}

export function updateGuard(g, dt, player, blockers, alarm) {
  const seesFox = !player.hidden && inVisionCone(
    { x: g.x, y: g.y, angle: g.angle },
    GUARD_RANGE, GUARD_HALF_ANGLE, player.x, player.y, blockers,
  );

  if (seesFox) {
    g.suspicion = Math.min(1, g.suspicion + dt * (player.sneaking ? 0.9 : 1.6));
    g.lastSeen = { x: player.x, y: player.y };
    if (g.suspicion > 0.55) g.state = 'chase';
    else if (g.suspicion > 0.15) g.state = 'suspicious';
  } else {
    g.suspicion = Math.max(0, g.suspicion - dt * 0.5);
    if (g.state === 'suspicious' && g.suspicion <= 0) g.state = 'patrol';
  }

  if (g.state === 'chase' && g.lastSeen) {
    moveToward(g, g.lastSeen.x, g.lastSeen.y, g.speed * 1.25, dt);
    if (dist(g.x, g.y, g.lastSeen.x, g.lastSeen.y) < 14) {
      g.state = 'suspicious';
      g.lookTimer = 1.4;
    }
    if (dist(g.x, g.y, player.x, player.y) < GUARD_CATCH_RADIUS) return 'caught';
  } else if (g.state === 'investigate' && g.investigate) {
    const arrived = moveToward(g, g.investigate.x, g.investigate.y, g.speed * 1.1, dt);
    if (arrived) {
      g.lookTimer -= dt;
      g.angle += dt * 2.2; // look around, puzzled
      if (g.lookTimer <= 0) { g.state = 'patrol'; g.investigate = null; }
    }
  } else if (g.state === 'suspicious') {
    g.lookTimer -= dt;
    g.angle += Math.sin(g.lookTimer * 3) * dt * 2.4;
    if (g.lookTimer <= 0 && g.suspicion <= 0) g.state = 'patrol';
  } else {
    // Patrol: walk to the next waypoint, pause and scan at each end.
    if (g.waitTimer > 0) {
      g.waitTimer -= dt;
      g.angle += Math.sin((g.pause - g.waitTimer) * 2.4) * dt * 1.6;
    } else {
      const wp = g.waypoints[g.targetIndex];
      const arrived = moveToward(g, wp.x, wp.y, g.speed, dt);
      if (arrived) {
        g.targetIndex = (g.targetIndex + 1) % g.waypoints.length;
        g.waitTimer = g.pause;
      }
    }
  }
  return seesFox ? 'spotted' : null;
}

function moveToward(g, tx, ty, speed, dt) {
  const d = dist(g.x, g.y, tx, ty);
  if (d < 4) return true;
  const step = Math.min(d, speed * dt);
  const nx = g.x + ((tx - g.x) / d) * step;
  const ny = g.y + ((ty - g.y) / d) * step;
  g.angle = angleTo(g.x, g.y, nx, ny);
  g.x = nx;
  g.y = ny;
  return d - step < 4;
}

// A coin landing nearby pulls every guard in earshot off patrol.
export function distractGuards(guards, x, y) {
  for (const g of guards) {
    if (dist(g.x, g.y, x, y) < 260 && g.state !== 'chase') {
      g.state = 'investigate';
      g.investigate = { x, y };
      g.lookTimer = 1.6;
      g.suspicion = Math.max(0, g.suspicion - 0.3);
    }
  }
}
