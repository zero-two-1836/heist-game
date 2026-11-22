// Velvet Fox — the alarm meter. Being watched fills it; hiding drains it.
// At 100 the job is blown. Lasers spike it. The meter is the game's tension.
export function createAlarm(decayPerSecond) {
  return {
    value: 0,
    decay: decayPerSecond,
    peak: 0,
    spotted: false, // currently watched by anyone
  };
}

export function updateAlarm(alarm, dt, watched, sneaking) {
  alarm.spotted = watched;
  if (watched) {
    alarm.value += dt * (sneaking ? 26 : 46);
  } else {
    alarm.value -= dt * alarm.decay;
  }
  alarm.value = Math.max(0, Math.min(100, alarm.value));
  alarm.peak = Math.max(alarm.peak, alarm.value);
  return alarm.value >= 100;
}

export function spikeAlarm(alarm, amount) {
  alarm.value = Math.max(0, Math.min(100, alarm.value + amount));
  alarm.peak = Math.max(alarm.peak, alarm.value);
}

// 0..1 for the HUD bar, plus a colour word the HUD reads.
export function alarmState(alarm) {
  const t = alarm.value / 100;
  return {
    t,
    label: t < 0.35 ? 'CALM' : t < 0.7 ? 'WARY' : t < 0.95 ? 'HUNTED' : 'BLOWN',
    color: t < 0.35 ? '#3ecf6f' : t < 0.7 ? '#ffb02e' : '#ff4d2e',
  };
}
