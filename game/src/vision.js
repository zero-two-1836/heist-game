// Velvet Fox — vision maths shared by guards and cameras: cone tests and
// line-of-sight against walls and crates. Nothing here touches the DOM.
export function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

export function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// True when the segment (x1,y1)-(x2,y2) touches rectangle r.
export function segmentHitsRect(x1, y1, x2, y2, r) {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  if (r.x > maxX || r.x + r.w < minX || r.y > maxY || r.y + r.h < minY) return false;
  if (pointInRect(x1, y1, r) || pointInRect(x2, y2, r)) return true;
  const edges = [
    [r.x, r.y, r.x + r.w, r.y],
    [r.x + r.w, r.y, r.x + r.w, r.y + r.h],
    [r.x + r.w, r.y + r.h, r.x, r.y + r.h],
    [r.x, r.y + r.h, r.x, r.y],
  ];
  return edges.some(([ax, ay, bx, by]) => segmentsCross(x1, y1, x2, y2, ax, ay, bx, by));
}

export function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function segmentsCross(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d1 = side(x3, y3, x4, y4, x1, y1);
  const d2 = side(x3, y3, x4, y4, x2, y2);
  const d3 = side(x1, y1, x2, y2, x3, y3);
  const d4 = side(x1, y1, x2, y2, x4, y4);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function side(ax, ay, bx, by, px, py) {
  return (bx - ax) * (py - ay) - (by - ay) * (px - ax);
}

// True when nothing blocks the view from (ax,ay) to (bx,by).
export function hasLineOfSight(ax, ay, bx, by, blockers) {
  return !blockers.some((r) => segmentHitsRect(ax, ay, bx, by, r));
}

// Is the target inside the watcher's vision cone (range, half-angle, LOS)?
export function inVisionCone(watcher, range, halfAngle, tx, ty, blockers) {
  if (dist(watcher.x, watcher.y, tx, ty) > range) return false;
  const toTarget = angleTo(watcher.x, watcher.y, tx, ty);
  if (Math.abs(angleDiff(toTarget, watcher.angle)) > halfAngle) return false;
  return hasLineOfSight(watcher.x, watcher.y, tx, ty, blockers);
}

// Circle (x,y,r) against a list of rectangles: push the circle out.
export function collideCircleRects(x, y, r, rects) {
  let px = x;
  let py = y;
  for (const rect of rects) {
    const cx = Math.max(rect.x, Math.min(px, rect.x + rect.w));
    const cy = Math.max(rect.y, Math.min(py, rect.y + rect.h));
    const dx = px - cx;
    const dy = py - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < r * r && d2 > 0.0001) {
      const d = Math.sqrt(d2);
      px = cx + (dx / d) * r;
      py = cy + (dy / d) * r;
    } else if (d2 <= 0.0001) {
      py = rect.y - r; // centre inside the block: shove it out the top
    }
  }
  return { x: px, y: py };
}
