// Velvet Fox — wall-mounted security cameras. Each sweeps its arc back and
// forth; its cone is narrower than a guard's but it never blinks, and being
// watched by one feeds the alarm fast.
import { inVisionCone } from './vision.js';

export const CAMERA_RANGE = 210;
export const CAMERA_HALF_ANGLE = 0.44; // ~25 degrees each side

export function createCamera(def) {
  return {
    x: def.x,
    y: def.y,
    baseAngle: def.baseAngle,
    sweep: def.sweep,
    speed: def.speed,
    range: def.range ?? CAMERA_RANGE,
    angle: def.baseAngle,
    phase: Math.random() * Math.PI * 2,
    watching: false,
  };
}

export function updateCamera(cam, dt, time, player, blockers) {
  cam.angle = cam.baseAngle + Math.sin(time * cam.speed + cam.phase) * cam.sweep;
  cam.watching = !player.hidden && inVisionCone(
    { x: cam.x, y: cam.y, angle: cam.angle },
    cam.range, CAMERA_HALF_ANGLE, player.x, player.y, blockers,
  );
  return cam.watching;
}
