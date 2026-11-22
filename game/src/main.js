// Velvet Fox — game bootstrap and loop. Owns the state machine
// (plan -> play -> caught | escaped -> next job -> campaign), wires input,
// guards, cameras, alarm and rendering together, and keeps the HUD honest.
import { JOBS, freshJob, WORLD_W, WORLD_H } from './levels.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createPlayer, updatePlayer, lootInReach, tossCoin } from './player.js';
import { createGuard, updateGuard, distractGuards } from './guards.js';
import { createCamera, updateCamera } from './cameras.js';
import { createAlarm, updateAlarm, spikeAlarm } from './alarm.js';
import { drawGame, VIEW } from './render.js';
import { applyShot } from './shots.js';
import { segmentHitsRect } from './vision.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const audio = createAudio();

const game = {
  state: null,
  time: 0,
  lastTs: 0,
};

function blockersOf(job) {
  return [...job.walls, ...job.crates];
}

export function startJob(jobIndex, keepScore = 0) {
  const job = freshJob(jobIndex);
  const player = createPlayer(job.start);
  player.coins = job.coins;
  const state = {
    jobIndex,
    job,
    player,
    guards: job.guards.map(createGuard),
    cameras: job.cameras.map(createCamera),
    alarm: createAlarm(job.alarmDecay),
    phase: 'plan', // plan | play | caught | escaped | campaign
    elapsed: 0,
    score: keepScore,
    jobTake: 0,
    thrownCoins: [],
    nearLoot: null,
    requiredLootDone: false,
    spottedFlash: 0,
    laserCooldown: 0,
    lastLaserHit: 0,
  };
  state.player.score = keepScore;
  game.state = state;
  return state;
}

function requiredLootDone(s) {
  return s.job.loot.filter((l) => l.required).every((l) => l.taken);
}

function grabLoot(s) {
  const item = lootInReach(s.player, s.job.loot);
  if (!item) return;
  item.taken = true;
  s.player.lootTaken += 1;
  s.jobTake += item.value;
  s.score += item.value;
  s.player.score = s.score;
  s.requiredLootDone = requiredLootDone(s);
  audio.pickup();
}

function tryExit(s) {
  if (!s.requiredLootDone) return;
  const e = s.job.exit;
  if (Math.hypot(s.player.x - e.x, s.player.y - e.y) < 44) {
    // Time bonus: beat par and the crew pays extra. Ghost bonus: barely seen.
    const timeBonus = Math.max(0, Math.round((s.job.par - s.elapsed) * 10));
    const ghostBonus = s.alarm.peak < 35 ? 500 : 0;
    s.jobTake += timeBonus + ghostBonus;
    s.score += timeBonus + ghostBonus;
    s.player.score = s.score;
    s.phase = 'escaped';
    audio.win();
  }
}

function crossedLaser(s, px, py, nx, ny) {
  if (!s.job.lasers || s.laserCooldown > 0) return false;
  for (const l of s.job.lasers) {
    if (segmentHitsRect(px, py, nx, ny, { x: Math.min(l.x1, l.x2), y: l.y1 - 2, w: Math.abs(l.x2 - l.x1), h: 4 })) {
      return true;
    }
  }
  return false;
}

function update(dt) {
  const s = game.state;
  if (!s) return;
  game.time += dt;
  if (s.spottedFlash > 0) s.spottedFlash -= dt;
  if (s.laserCooldown > 0) s.laserCooldown -= dt;

  if (s.phase === 'plan') {
    if (input.wasPressed('Enter')) {
      s.phase = 'play';
      audio.unlock();
      audio.click();
    }
    input.endFrame();
    return;
  }
  if (s.phase === 'caught') {
    if (input.wasPressed('r') || input.wasPressed('R')) startJob(s.jobIndex, s.score - s.jobTake);
    input.endFrame();
    return;
  }
  if (s.phase === 'escaped') {
    if (input.wasPressed('Enter')) {
      if (s.jobIndex + 1 < JOBS.length) startJob(s.jobIndex + 1, s.score);
      else s.phase = 'campaign';
      audio.click();
    }
    input.endFrame();
    return;
  }
  if (s.phase === 'campaign') {
    if (input.wasPressed('r') || input.wasPressed('R')) startJob(0, 0);
    input.endFrame();
    return;
  }

  // --- play ---
  s.elapsed += dt;
  audio.unlock();
  if (input.wasPressed('m') || input.wasPressed('M')) audio.toggleMute();

  const axis = input.axis();
  const px = s.player.x;
  const py = s.player.y;
  updatePlayer(s.player, dt, axis, input.sneaking(), blockersOf(s.job));
  if (crossedLaser(s, px, py, s.player.x, s.player.y)) {
    spikeAlarm(s.alarm, 25);
    s.laserCooldown = 1;
    s.spottedFlash = 1.2;
    audio.laser();
  }

  // Coin toss: click anywhere in the room.
  if (input.consumeClick()) {
    const wx = input.mouse.clickX - VIEW.x;
    const wy = input.mouse.clickY - VIEW.y;
    if (wx >= 0 && wx <= WORLD_W && wy >= 0 && wy <= WORLD_H) {
      const landing = tossCoin(s.player, wx, wy);
      if (landing) {
        s.thrownCoins.push({ ...landing, ttl: 6 });
        distractGuards(s.guards, landing.x, landing.y);
        audio.coinToss();
      }
    }
  }
  s.thrownCoins = s.thrownCoins.filter((c) => (c.ttl -= dt) > 0);

  if (input.wasPressed('e') || input.wasPressed('E')) grabLoot(s);
  s.nearLoot = lootInReach(s.player, s.job.loot);

  const blockers = blockersOf(s.job);
  let watched = false;
  let caught = false;
  for (const g of s.guards) {
    const result = updateGuard(g, dt, s.player, blockers, s.alarm);
    if (result === 'spotted') watched = true;
    if (result === 'caught') caught = true;
  }
  for (const cam of s.cameras) {
    if (updateCamera(cam, dt, game.time, s.player, blockers)) watched = true;
  }
  if (watched && !s.alarm.spotted) audio.spotted();
  if (watched) s.spottedFlash = Math.max(s.spottedFlash, 0.6);

  if (updateAlarm(s.alarm, dt, watched, s.player.sneaking) || caught) {
    s.phase = 'caught';
    audio.caught();
  }
  tryExit(s);
  // Screenshot staging holds its alarm reading and sneak pose steady.
  if (s.shotStaged && s.stagedAlarm !== undefined) {
    s.alarm.value = s.stagedAlarm;
    s.alarm.peak = Math.max(s.alarm.peak, s.stagedAlarm);
    s.player.sneaking = s.stagedSneak;
  }
  input.endFrame();
}

function frame(ts) {
  const dt = Math.min(0.05, (ts - game.lastTs) / 1000 || 0.016);
  game.lastTs = ts;
  update(dt);
  drawGame(ctx, game.state, game.time);
  requestAnimationFrame(frame);
}

// Boot: job 1 plan screen, then optional screenshot staging.
startJob(0, 0);
const params = new URLSearchParams(window.location.search);
applyShot(game, params.get('shot'));
window.__heist = {
  game,
  startJob,
  JOBS,
  get state() { return game.state; },
};
requestAnimationFrame(frame);
