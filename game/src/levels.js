// Velvet Fox — the three jobs. Each job is one room layout: walls that make
// several routes, crates as cover, guard patrols, sweeping cameras, loot and
// the getaway door. Coordinates live in the 960 x 600 playfield.
export const WORLD_W = 960;
export const WORLD_H = 600;

function wall(x, y, w, h) { return { x, y, w, h }; }
function guard(x1, y1, x2, y2, speed, pause = 1.2) {
  return { waypoints: [{ x: x1, y: y1 }, { x: x2, y: y2 }], speed, pause };
}
function camera(x, y, baseAngle, sweep, speed, range = 210) {
  return { x, y, baseAngle, sweep, speed, range };
}
function loot(x, y, name, value, required) {
  return { x, y, name, value, required, taken: false };
}

export const JOBS = [
  {
    id: 1,
    name: 'The Ember Gallery',
    briefing: 'A quiet gallery after midnight. One guard upstairs, one down. The Ember Ruby hangs in the far hall — lift it and slip out the service door.',
    par: 75,
    start: { x: 70, y: 540 },
    exit: { x: 44, y: 540, label: 'SERVICE DOOR' },
    walls: [
      wall(0, 200, 520, 16),
      wall(640, 200, 320, 16),
      wall(620, 300, 16, 180),
      wall(220, 380, 200, 16),
      wall(120, 60, 16, 90),
    ],
    crates: [
      { x: 300, y: 90, w: 44, h: 44 },
      { x: 760, y: 120, w: 44, h: 44 },
      { x: 420, y: 470, w: 44, h: 44 },
      { x: 820, y: 430, w: 44, h: 44 },
    ],
    guards: [
      guard(150, 110, 820, 110, 62),
      guard(200, 500, 720, 500, 58),
    ],
    cameras: [
      camera(930, 30, Math.PI * 0.75, 0.9, 0.5),
    ],
    loot: [
      loot(870, 90, 'Ember Ruby', 5000, true),
      loot(130, 520, 'Gold Bar', 800, false),
      loot(700, 520, 'Gold Bar', 800, false),
    ],
    coins: 3,
    alarmDecay: 14,
  },
  {
    id: 2,
    name: 'The Gilded Vault',
    briefing: 'A private bank vault. Three guards, two cameras, and the vault key hangs beside the bullion. Grab both, then vanish through the service door.',
    par: 100,
    start: { x: 70, y: 540 },
    exit: { x: 44, y: 540, label: 'SERVICE DOOR' },
    walls: [
      wall(0, 180, 380, 16),
      wall(500, 180, 460, 16),
      wall(380, 180, 16, 160),
      wall(560, 340, 400, 16),
      wall(180, 420, 260, 16),
      wall(700, 60, 16, 120),
    ],
    crates: [
      { x: 240, y: 80, w: 44, h: 44 },
      { x: 470, y: 260, w: 44, h: 44 },
      { x: 640, y: 470, w: 44, h: 44 },
      { x: 860, y: 240, w: 44, h: 44 },
      { x: 120, y: 300, w: 44, h: 44 },
    ],
    guards: [
      guard(140, 90, 620, 90, 74),
      guard(660, 380, 660, 520, 70),
      guard(180, 500, 560, 500, 72),
    ],
    cameras: [
      camera(930, 30, Math.PI * 0.8, 1.0, 0.65),
      camera(30, 300, 0, 1.1, 0.55),
    ],
    loot: [
      loot(880, 90, 'Vault Key', 2500, true),
      loot(880, 520, 'Gold Bullion', 6000, true),
      loot(120, 90, 'Silver Tray', 600, false),
      loot(470, 120, 'Jade Figurine', 900, false),
    ],
    coins: 3,
    alarmDecay: 11,
  },
  {
    id: 3,
    name: 'The Crown Exhibit',
    briefing: 'The crown jewels, one night only. Four guards, three cameras and a laser grid over the plinth. Take the Crown, the Sceptre and the Orb — then run.',
    par: 140,
    start: { x: 70, y: 540 },
    exit: { x: 44, y: 540, label: 'SERVICE DOOR' },
    walls: [
      wall(0, 160, 300, 16),
      wall(420, 160, 540, 16),
      wall(300, 160, 16, 180),
      wall(640, 160, 16, 180),
      wall(160, 400, 300, 16),
      wall(580, 400, 220, 16),
      wall(820, 240, 140, 16),
    ],
    crates: [
      { x: 200, y: 80, w: 44, h: 44 },
      { x: 480, y: 80, w: 44, h: 44 },
      { x: 760, y: 80, w: 44, h: 44 },
      { x: 360, y: 480, w: 44, h: 44 },
      { x: 700, y: 480, w: 44, h: 44 },
      { x: 880, y: 470, w: 44, h: 44 },
    ],
    guards: [
      guard(120, 90, 560, 90, 84),
      guard(700, 90, 900, 90, 80),
      guard(120, 460, 560, 460, 82),
      guard(660, 500, 900, 500, 84),
    ],
    cameras: [
      camera(930, 30, Math.PI * 0.8, 1.0, 0.8),
      camera(30, 200, 0, 1.0, 0.7),
      camera(480, 570, -Math.PI / 2, 1.1, 0.75),
    ],
    lasers: [
      { x1: 420, y1: 300, x2: 640, y2: 300 },
      { x1: 420, y1: 340, x2: 640, y2: 340 },
    ],
    loot: [
      loot(480, 250, 'The Crown', 9000, true),
      loot(580, 250, 'The Sceptre', 7000, true),
      loot(530, 320, 'The Orb', 7000, true),
      loot(120, 520, 'Pearl Necklace', 1200, false),
      loot(880, 120, 'Diamond Tiara', 1500, false),
    ],
    coins: 4,
    alarmDecay: 9,
  },
];

// Deep-copy a job so a retry starts from a pristine layout.
export function freshJob(index) {
  return JSON.parse(JSON.stringify(JOBS[index]));
}
