// Velvet Fox — everything the player sees, drawn on one canvas. The playfield
// is 960 x 600, centred under a HUD bar; safe cover, danger and loot each
// have their own unmistakable colour so the room reads at a glance.
import { WORLD_W, WORLD_H } from './levels.js';
import { GUARD_RANGE, GUARD_HALF_ANGLE } from './guards.js';
import { CAMERA_HALF_ANGLE } from './cameras.js';
import { alarmState } from './alarm.js';

export const VIEW = { x: 160, y: 80, w: WORLD_W, h: WORLD_H };
const TAU = Math.PI * 2;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawGame(ctx, s, time) {
  ctx.clearRect(0, 0, 1280, 720);
  ctx.fillStyle = '#0b0b12';
  ctx.fillRect(0, 0, 1280, 720);
  drawHud(ctx, s, time);
  ctx.save();
  ctx.translate(VIEW.x, VIEW.y);
  drawRoom(ctx, s, time);
  if (s.phase === 'plan') drawPatrolRoutes(ctx, s);
  drawLoot(ctx, s, time);
  drawExit(ctx, s, time);
  drawLasers(ctx, s, time);
  for (const cam of s.cameras) drawCameraCone(ctx, cam);
  for (const g of s.guards) drawGuardCone(ctx, g);
  for (const cam of s.cameras) drawCamera(ctx, cam, time);
  for (const g of s.guards) drawGuard(ctx, g, time);
  drawCoins(ctx, s, time);
  drawPlayer(ctx, s, time);
  ctx.restore();
  if (s.phase === 'plan') drawPlanOverlay(ctx, s);
  if (s.phase === 'caught') drawCaughtOverlay(ctx, s);
  if (s.phase === 'escaped') drawEscapedOverlay(ctx, s);
  if (s.phase === 'campaign') drawCampaignOverlay(ctx, s);
  if (s.spottedFlash > 0 && s.phase === 'play') drawSpottedBanner(ctx);
}

// ---- HUD -----------------------------------------------------------------
function drawHud(ctx, s, time) {
  ctx.fillStyle = '#171226';
  ctx.fillRect(0, 0, 1280, 64);
  ctx.fillStyle = '#2c2140';
  ctx.fillRect(0, 64, 1280, 2);
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#ffb02e';
  ctx.font = 'bold 22px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('VELVET FOX', 20, 24);
  ctx.fillStyle = '#9a8fb5';
  ctx.font = '14px "Segoe UI", sans-serif';
  ctx.fillText(`JOB ${s.jobIndex + 1} OF 3 — ${s.job.name.toUpperCase()}`, 20, 48);

  // Loot tally
  const got = s.job.loot.filter((l) => l.taken).length;
  const need = s.job.loot.filter((l) => l.required).length;
  const needGot = s.job.loot.filter((l) => l.required && l.taken).length;
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 17px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`◆ LOOT ${got}/${s.job.loot.length}  (key pieces ${needGot}/${need})`, 330, 26);
  ctx.fillStyle = '#e8e2d4';
  ctx.font = '15px "Segoe UI", sans-serif';
  ctx.fillText(`SCORE $${s.score.toLocaleString()}`, 330, 48);

  // Coins (tools)
  ctx.fillStyle = '#c9b8ff';
  ctx.font = 'bold 17px "Segoe UI", sans-serif';
  ctx.fillText(`● COINS ${s.player.coins}  — click to toss`, 640, 26);
  ctx.fillStyle = '#9a8fb5';
  ctx.font = '14px "Segoe UI", sans-serif';
  const mm = Math.floor(s.elapsed / 60);
  const ss = Math.floor(s.elapsed % 60).toString().padStart(2, '0');
  ctx.fillText(`TIME ${mm}:${ss}  ·  PAR ${Math.floor(s.job.par / 60)}:${(s.job.par % 60).toString().padStart(2, '0')}`, 640, 48);

  // Alarm meter — the big one, top right
  const a = alarmState(s.alarm);
  const bx = 940;
  const bw = 260;
  ctx.fillStyle = '#e8e2d4';
  ctx.font = 'bold 13px "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', bx, 18);
  ctx.fillStyle = a.color;
  ctx.textAlign = 'right';
  ctx.fillText(a.label, bx + bw, 18);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#241d33';
  rr(ctx, bx, 28, bw, 20, 5);
  ctx.fill();
  ctx.fillStyle = a.color;
  rr(ctx, bx, 28, Math.max(6, bw * a.t), 20, 5);
  ctx.fill();
  ctx.strokeStyle = '#3a2f4d';
  ctx.lineWidth = 1;
  rr(ctx, bx, 28, bw, 20, 5);
  ctx.stroke();
  ctx.fillStyle = '#9a8fb5';
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.fillText('seen = alarm rises · hidden = it falls', bx, 56);

  if (s.phase === 'play' && s.alarm.spotted) {
    ctx.fillStyle = '#ff4d2e';
    ctx.font = 'bold 15px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('— SPOTTED —', 640, 76);
  }
}

// ---- Room ----------------------------------------------------------------
function drawRoom(ctx, s, time) {
  // Floor: deep violet boards, faint checker so motion reads.
  ctx.fillStyle = '#1b1428';
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  ctx.fillStyle = '#1e1730';
  const tile = 60;
  for (let y = 0; y < WORLD_H / tile; y++) {
    for (let x = 0; x < WORLD_W / tile; x++) {
      if ((x + y) % 2 === 0) ctx.fillRect(x * tile, y * tile, tile, tile);
    }
  }
  ctx.strokeStyle = '#241d33';
  ctx.lineWidth = 1;
  for (let x = 0; x <= WORLD_W; x += tile) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD_H); ctx.stroke();
  }
  for (let y = 0; y <= WORLD_H; y += tile) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD_W, y); ctx.stroke();
  }
  // Walls
  ctx.fillStyle = '#3a2f4d';
  for (const w of s.job.walls) {
    rr(ctx, w.x, w.y, w.w, w.h, 4);
    ctx.fill();
    ctx.fillStyle = '#4a3d63';
    ctx.fillRect(w.x, w.y, w.w, 4);
    ctx.fillStyle = '#3a2f4d';
  }
  // Crates: safe cover, warm wood.
  for (const c of s.job.crates) {
    ctx.fillStyle = '#7a5a34';
    rr(ctx, c.x, c.y, c.w, c.h, 4);
    ctx.fill();
    ctx.strokeStyle = '#5d4425';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(c.x + 4, c.y + 4); ctx.lineTo(c.x + c.w - 4, c.y + c.h - 4);
    ctx.moveTo(c.x + c.w - 4, c.y + 4); ctx.lineTo(c.x + 4, c.y + c.h - 4);
    ctx.stroke();
  }
  // Room frame
  ctx.strokeStyle = '#3a2f4d';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, WORLD_W, WORLD_H);
}

function drawPatrolRoutes(ctx, s) {
  ctx.setLineDash([6, 8]);
  ctx.strokeStyle = 'rgba(200, 180, 255, 0.55)';
  ctx.lineWidth = 2;
  for (const g of s.guards) {
    ctx.beginPath();
    const [a, b] = g.waypoints;
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(200, 180, 255, 0.8)';
    ctx.font = 'bold 11px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PATROL', (a.x + b.x) / 2, (a.y + b.y) / 2 - 10);
    ctx.setLineDash([6, 8]);
  }
  ctx.setLineDash([]);
}

function drawLoot(ctx, s, time) {
  for (const item of s.job.loot) {
    if (item.taken) continue;
    const pulse = 1 + Math.sin(time * 3 + item.x) * 0.12;
    const glow = ctx.createRadialGradient(item.x, item.y, 2, item.x, item.y, 34 * pulse);
    const core = item.required ? '255,77,46' : '255,215,106';
    glow.addColorStop(0, `rgba(${core},0.55)`);
    glow.addColorStop(1, `rgba(${core},0)`);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(item.x, item.y, 34 * pulse, 0, TAU);
    ctx.fill();
    // Diamond
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = item.required ? '#ff5a2e' : '#ffd76a';
    const r = 11 * pulse;
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillRect(-r * 0.45, -r * 0.45, r * 0.7, r * 0.7);
    ctx.restore();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(item.name.toUpperCase(), item.x, item.y + 30);
  }
}

function drawExit(ctx, s, time) {
  const e = s.job.exit;
  const open = s.requiredLootDone;
  const pulse = open ? 1 + Math.sin(time * 4) * 0.15 : 1;
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.fillStyle = open ? '#2fbf5a' : '#4a4450';
  rr(ctx, -26, -34, 52, 68, 6);
  ctx.fill();
  ctx.strokeStyle = open ? '#7dff9e' : '#6b6472';
  ctx.lineWidth = 2;
  rr(ctx, -26, -34, 52, 68, 6);
  ctx.stroke();
  ctx.fillStyle = open ? '#062b12' : '#cfc9d6';
  ctx.font = 'bold 10px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GETAWAY', 0, -40 * pulse - 2);
  ctx.font = 'bold 22px "Segoe UI", sans-serif';
  ctx.fillText(open ? '➜' : '✕', 0, 8);
  ctx.restore();
}

function drawLasers(ctx, s, time) {
  if (!s.job.lasers) return;
  for (const l of s.job.lasers) {
    const flicker = 0.55 + Math.sin(time * 9 + l.x1) * 0.25;
    ctx.strokeStyle = `rgba(255,60,60,${flicker})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    ctx.moveTo(l.x1, l.y1);
    ctx.lineTo(l.x2, l.y2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ff6b6b';
    ctx.font = 'bold 10px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LASER — TRIPS THE ALARM', (l.x1 + l.x2) / 2, l.y1 - 8);
  }
}

function drawCameraCone(ctx, cam) {
  const col = cam.watching ? '255,60,40' : '255,200,80';
  const grad = ctx.createRadialGradient(cam.x, cam.y, 6, cam.x, cam.y, cam.range);
  grad.addColorStop(0, `rgba(${col},0.30)`);
  grad.addColorStop(1, `rgba(${col},0.02)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(cam.x, cam.y);
  ctx.arc(cam.x, cam.y, cam.range, cam.angle - CAMERA_HALF_ANGLE, cam.angle + CAMERA_HALF_ANGLE);
  ctx.closePath();
  ctx.fill();
}

function drawGuardCone(ctx, g) {
  const alerted = g.state === 'chase' || g.state === 'suspicious';
  const col = alerted ? '255,60,40' : '255,210,90';
  const alpha = alerted ? 0.34 : 0.22;
  const grad = ctx.createRadialGradient(g.x, g.y, 8, g.x, g.y, GUARD_RANGE);
  grad.addColorStop(0, `rgba(${col},${alpha})`);
  grad.addColorStop(1, `rgba(${col},0.02)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.arc(g.x, g.y, GUARD_RANGE, g.angle - GUARD_HALF_ANGLE, g.angle + GUARD_HALF_ANGLE);
  ctx.closePath();
  ctx.fill();
}

function drawCamera(ctx, cam, time) {
  ctx.save();
  ctx.translate(cam.x, cam.y);
  ctx.fillStyle = '#2b2b33';
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#55555f';
  ctx.lineWidth = 2;
  ctx.stroke();
  const lx = Math.cos(cam.angle) * 14;
  const ly = Math.sin(cam.angle) * 14;
  ctx.strokeStyle = cam.watching ? '#ff3c28' : '#ffb02e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(lx, ly);
  ctx.stroke();
  ctx.fillStyle = cam.watching ? '#ff3c28' : '#ff5a2e';
  ctx.beginPath();
  ctx.arc(lx, ly, 3.5, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawGuard(ctx, g, time) {
  ctx.save();
  ctx.translate(g.x, g.y);
  // Body: navy uniform, cap brim toward facing.
  ctx.fillStyle = '#2e3d66';
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#7d8fc9';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.rotate(g.angle);
  ctx.fillStyle = '#1c2745';
  ctx.beginPath();
  ctx.moveTo(8, -6);
  ctx.lineTo(20, 0);
  ctx.lineTo(8, 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath();
  ctx.arc(4, -4, 2, 0, TAU);
  ctx.arc(4, 4, 2, 0, TAU);
  ctx.fill();
  ctx.restore();
  // State mark: ! when hunting, ? when investigating.
  if (g.state === 'chase' || g.state === 'suspicious') {
    ctx.fillStyle = g.state === 'chase' ? '#ff3c28' : '#ffb02e';
    ctx.font = 'bold 20px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', g.x, g.y - 20);
  } else if (g.state === 'investigate') {
    ctx.fillStyle = '#c9b8ff';
    ctx.font = 'bold 20px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', g.x, g.y - 20);
  }
}

function drawCoins(ctx, s, time) {
  for (const c of s.thrownCoins) {
    ctx.fillStyle = '#c9b8ff';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 5, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#c9b8ff';
    ctx.font = 'bold 11px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('clink!', c.x, c.y - 12);
  }
}

function drawPlayer(ctx, s, time) {
  const p = s.player;
  const bob = p.moving ? Math.sin(time * 12) * 1.5 : 0;
  ctx.save();
  ctx.translate(p.x, p.y + bob);
  // Velvet Fox: burnt-orange hood, fox ears, pale mask.
  ctx.fillStyle = '#ff7a1a';
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ff7a1a';
  ctx.beginPath();
  ctx.moveTo(-8, -7); ctx.lineTo(-11, -17); ctx.lineTo(-3, -11); ctx.closePath();
  ctx.moveTo(8, -7); ctx.lineTo(11, -17); ctx.lineTo(3, -11); ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff2e0';
  ctx.beginPath();
  ctx.arc(0, 2, 6, 0, TAU);
  ctx.fill();
  ctx.rotate(p.angle);
  ctx.fillStyle = '#3a1c00';
  ctx.beginPath();
  ctx.moveTo(6, -3); ctx.lineTo(13, 0); ctx.lineTo(6, 3); ctx.closePath();
  ctx.fill();
  ctx.restore();
  if (p.sneaking) {
    ctx.strokeStyle = 'rgba(201,184,255,0.9)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 17, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#c9b8ff';
    ctx.font = 'bold 11px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SNEAKING', p.x, p.y - 22);
  }
  const near = s.nearLoot;
  if (near && s.phase === 'play') {
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`[E] GRAB ${near.name.toUpperCase()}`, p.x, p.y - 26);
  }
}

// ---- Overlays -------------------------------------------------------------
function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(12, 9, 20, 0.88)';
  rr(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = '#3a2f4d';
  ctx.lineWidth = 2;
  rr(ctx, x, y, w, h, 12);
  ctx.stroke();
}

function drawPlanOverlay(ctx, s) {
  ctx.fillStyle = 'rgba(8, 6, 14, 0.45)';
  ctx.fillRect(160, 80, 960, 600);
  panel(ctx, 340, 150, 600, 380);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffb02e';
  ctx.font = 'bold 30px "Segoe UI", sans-serif';
  ctx.fillText('VELVET FOX', 640, 195);
  ctx.fillStyle = '#e8e2d4';
  ctx.font = 'bold 20px "Segoe UI", sans-serif';
  ctx.fillText(`JOB ${s.jobIndex + 1}: ${s.job.name.toUpperCase()}`, 640, 230);
  ctx.fillStyle = '#c9c2d4';
  ctx.font = '15px "Segoe UI", sans-serif';
  wrapText(ctx, s.job.briefing, 640, 262, 520, 21);
  ctx.fillStyle = '#ffd76a';
  ctx.font = '15px "Segoe UI", sans-serif';
  const req = s.job.loot.filter((l) => l.required).map((l) => l.name).join(' + ');
  ctx.fillText(`MUST STEAL: ${req}`, 640, 360);
  ctx.fillStyle = '#c9b8ff';
  ctx.fillText(`GUARDS ${s.guards.length}  ·  CAMERAS ${s.cameras.length}  ·  COINS ${s.player.coins}  ·  PAR ${s.job.par}s`, 640, 388);
  ctx.fillStyle = '#9a8fb5';
  ctx.font = '14px "Segoe UI", sans-serif';
  ctx.fillText('Dotted lines are patrol routes. Study the cones, then move.', 640, 416);
  ctx.fillStyle = '#3ecf6f';
  ctx.font = 'bold 19px "Segoe UI", sans-serif';
  ctx.fillText('PRESS ENTER TO BEGIN THE JOB', 640, 470);
  ctx.fillStyle = '#9a8fb5';
  ctx.font = '13px "Segoe UI", sans-serif';
  ctx.fillText('WASD move · SHIFT sneak · E grab · CLICK toss a coin', 640, 500);
}

function drawCaughtOverlay(ctx, s) {
  ctx.fillStyle = 'rgba(40, 4, 4, 0.55)';
  ctx.fillRect(160, 80, 960, 600);
  panel(ctx, 340, 210, 600, 260);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff4d2e';
  ctx.font = 'bold 34px "Segoe UI", sans-serif';
  ctx.fillText('CAUGHT!', 640, 265);
  ctx.fillStyle = '#e8e2d4';
  ctx.font = '17px "Segoe UI", sans-serif';
  ctx.fillText('The alarm hit 100 — the guards closed in.', 640, 300);
  ctx.fillStyle = '#c9c2d4';
  ctx.font = '15px "Segoe UI", sans-serif';
  ctx.fillText(`Loot kept: $${s.score.toLocaleString()}  ·  Best alarm peak ${Math.round(s.alarm.peak)}%`, 640, 330);
  ctx.fillStyle = '#3ecf6f';
  ctx.font = 'bold 18px "Segoe UI", sans-serif';
  ctx.fillText('PRESS R TO TRY THE JOB AGAIN', 640, 390);
  ctx.fillStyle = '#9a8fb5';
  ctx.font = '13px "Segoe UI", sans-serif';
  ctx.fillText('Tip: sneak (SHIFT) to slow the alarm, toss a coin to pull a guard away.', 640, 425);
}

function drawEscapedOverlay(ctx, s) {
  ctx.fillStyle = 'rgba(4, 30, 10, 0.45)';
  ctx.fillRect(160, 80, 960, 600);
  panel(ctx, 340, 180, 600, 320);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#3ecf6f';
  ctx.font = 'bold 34px "Segoe UI", sans-serif';
  ctx.fillText('CLEAN GETAWAY!', 640, 235);
  ctx.fillStyle = '#e8e2d4';
  ctx.font = '17px "Segoe UI", sans-serif';
  ctx.fillText(`${s.job.name} — every key piece is in the bag.`, 640, 270);
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 19px "Segoe UI", sans-serif';
  ctx.fillText(`JOB TAKE: $${s.jobTake.toLocaleString()}`, 640, 305);
  ctx.fillStyle = '#c9c2d4';
  ctx.font = '15px "Segoe UI", sans-serif';
  const ghost = s.alarm.peak < 35 ? 'GHOST — never really seen! +$500' : `Peak alarm ${Math.round(s.alarm.peak)}%`;
  ctx.fillText(ghost, 640, 335);
  ctx.fillStyle = '#9a8fb5';
  ctx.font = '14px "Segoe UI", sans-serif';
  ctx.fillText(`Time ${Math.floor(s.elapsed / 60)}:${Math.floor(s.elapsed % 60).toString().padStart(2, '0')}  ·  Par ${s.job.par}s`, 640, 362);
  ctx.fillStyle = '#3ecf6f';
  ctx.font = 'bold 18px "Segoe UI", sans-serif';
  ctx.fillText(s.jobIndex + 1 < 3 ? 'PRESS ENTER FOR THE NEXT JOB' : 'PRESS ENTER FOR THE SCORE', 640, 420);
}

function drawCampaignOverlay(ctx, s) {
  ctx.fillStyle = 'rgba(8, 6, 14, 0.6)';
  ctx.fillRect(160, 80, 960, 600);
  panel(ctx, 340, 170, 600, 340);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffb02e';
  ctx.font = 'bold 32px "Segoe UI", sans-serif';
  ctx.fillText('THE CREW RETIRES RICH', 640, 225);
  ctx.fillStyle = '#e8e2d4';
  ctx.font = '17px "Segoe UI", sans-serif';
  ctx.fillText('Three jobs. Three clean getaways. The Velvet Fox vanishes.', 640, 262);
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 24px "Segoe UI", sans-serif';
  ctx.fillText(`TOTAL TAKE: $${s.score.toLocaleString()}`, 640, 305);
  ctx.fillStyle = '#c9c2d4';
  ctx.font = '15px "Segoe UI", sans-serif';
  ctx.fillText('Thanks for playing Velvet Fox.', 640, 345);
  ctx.fillStyle = '#3ecf6f';
  ctx.font = 'bold 18px "Segoe UI", sans-serif';
  ctx.fillText('PRESS R TO RUN THE WHOLE CREW AGAIN', 640, 420);
}

function drawSpottedBanner(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 77, 46, 0.92)';
  rr(ctx, 480, 92, 320, 34, 6);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SPOTTED! BREAK LINE OF SIGHT!', 640, 114);
  ctx.restore();
}

function wrapText(ctx, text, cx, y, maxW, lineH) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, cx, yy);
      line = w;
      yy += lineH;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, cx, yy);
  return yy;
}
