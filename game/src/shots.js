// Velvet Fox — deterministic screenshot staging. A `?shot=` URL parameter
// puts the live game into one of its real states (cover, cone sweep, caught,
// getaway) so the maker can capture honest renders of the game itself. The
// staging only sets state the game itself can reach; nothing is drawn that
// the game cannot draw while playing.
export function applyShot(game, shot) {
  if (!shot) return;
  const s = game.state;
  // Staged shots hold their alarm and sneak pose steady while the game keeps
  // animating around them, so the capture shows the intended tension.
  s.shotStaged = true;
  if (shot === 'cover') {
    // Mid-heist: the Fox crosses the gallery floor between two sweeping
    // cones, the Ruby glinting ahead, alarm already warm.
    s.phase = 'play';
    s.player.x = 470; s.player.y = 300; s.player.sneaking = true;
    s.stagedSneak = true;
    s.alarm.value = 38; s.alarm.peak = 38; s.stagedAlarm = 38;
    s.guards[0].x = 300; s.guards[0].y = 110; s.guards[0].angle = 0.5;
    s.guards[1].x = 640; s.guards[1].y = 500; s.guards[1].angle = Math.PI;
    s.elapsed = 34;
  } else if (shot === 'sweep') {
    // Tension: cones sweep across the room while the Fox hides behind a crate.
    s.phase = 'play';
    s.player.x = 322; s.player.y = 134; s.player.sneaking = true;
    s.stagedSneak = true;
    s.alarm.value = 52; s.alarm.peak = 52; s.stagedAlarm = 52;
    s.guards[0].x = 420; s.guards[0].y = 110; s.guards[0].angle = 0;
    s.guards[0].state = 'suspicious'; s.guards[0].suspicion = 0.4;
    s.guards[1].x = 300; s.guards[1].y = 500; s.guards[1].angle = Math.PI;
    s.elapsed = 51;
  } else if (shot === 'caught') {
    // A fair caught moment: the alarm is full, a guard has the Fox dead to
    // rights just above the CAUGHT panel, and the screen explains the retry.
    s.phase = 'caught';
    s.alarm.value = 100; s.alarm.peak = 100;
    s.player.x = 250; s.player.y = 120;
    s.guards[0].x = 310; s.guards[0].y = 120; s.guards[0].angle = Math.PI;
    s.guards[0].state = 'chase'; s.guards[0].suspicion = 1;
    s.elapsed = 63;
  } else if (shot === 'getaway') {
    // The payoff: Ruby in the bag, the Fox at the getaway door, alarm cooling.
    s.phase = 'escaped';
    s.jobTake = 6600;
    s.score = 6600;
    s.job.loot[0].taken = true;
    s.job.loot[1].taken = true;
    s.player.x = 60; s.player.y = 540;
    s.alarm.value = 12; s.alarm.peak = 61;
    s.guards[0].x = 700; s.guards[0].y = 110; s.guards[0].angle = 0;
    s.guards[1].x = 200; s.guards[1].y = 500; s.guards[1].angle = 0;
    s.elapsed = 68;
  }
}
