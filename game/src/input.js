// Velvet Fox — keyboard and mouse input. Tracks held keys and the pointer
// in canvas coordinates; the game reads this, never the DOM directly.
export function createInput(canvas) {
  const keys = new Set();
  const input = {
    keys,
    mouse: { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 },
    anyKeyPressed: false,
    pressed: new Set(), // keys pressed since last consume
  };

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
    if (!e.repeat) {
      input.pressed.add(e.key.length === 1 ? e.key.toLowerCase() : e.key);
      input.anyKeyPressed = true;
    }
    keys.add(e.key.length === 1 ? e.key.toLowerCase() : e.key);
  });
  window.addEventListener('keyup', (e) => {
    keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
  });
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    input.mouse.x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    input.mouse.y = ((e.clientY - rect.top) / rect.height) * canvas.height;
  });
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    input.mouse.clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    input.mouse.clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;
    input.mouse.clicked = true;
  });

  input.axis = () => {
    let x = 0;
    let y = 0;
    if (keys.has('a') || keys.has('ArrowLeft')) x -= 1;
    if (keys.has('d') || keys.has('ArrowRight')) x += 1;
    if (keys.has('w') || keys.has('ArrowUp')) y -= 1;
    if (keys.has('s') || keys.has('ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
    return { x, y };
  };
  input.sneaking = () => keys.has('Shift');
  input.wasPressed = (key) => input.pressed.has(key);
  input.consumeClick = () => {
    const c = input.mouse.clicked;
    input.mouse.clicked = false;
    return c;
  };
  input.endFrame = () => {
    input.pressed.clear();
    input.anyKeyPressed = false;
  };
  return input;
}
