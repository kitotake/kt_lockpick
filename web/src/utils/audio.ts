// Synthèse audio Web Audio API — pas besoin de fichiers .mp3
const ctx: AudioContext | null = (() => {
  try { return new (window.AudioContext || (window as any).webkitAudioContext)(); }
  catch { return null; }
})();

function resume() {
  if (ctx && ctx.state === "suspended") ctx.resume();
}

function tone(freq: number, duration: number, type: OscillatorType = "sine", vol = 0.3, detune = 0) {
  if (!ctx) return;
  resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function noise(duration: number, vol = 0.15, bandpass?: number) {
  if (!ctx) return;
  resume();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  if (bandpass) {
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = bandpass;
    filter.Q.value = 1.5;
    source.connect(filter);
    filter.connect(gain);
  } else {
    source.connect(gain);
  }
  gain.connect(ctx.destination);
  source.start();
}

export function playSound(type: string) {
  switch (type) {
    case "click_metal":
      noise(0.05, 0.2, 3000);
      tone(800, 0.04, "square", 0.1);
      break;

    case "select":
      tone(1200, 0.07, "sine", 0.15);
      break;

    case "tension_loop":
      tone(80, 0.2, "sawtooth", 0.06);
      noise(0.15, 0.08, 200);
      break;

    case "crack":
      noise(0.08, 0.35, 1500);
      tone(200, 0.12, "sawtooth", 0.2);
      tone(150, 0.18, "sawtooth", 0.15, -100);
      break;

    case "success":
      tone(523, 0.12, "sine", 0.25);
      setTimeout(() => tone(659, 0.12, "sine", 0.25), 120);
      setTimeout(() => tone(784, 0.25, "sine", 0.3), 240);
      break;

    case "fail":
      tone(220, 0.2, "sawtooth", 0.2);
      setTimeout(() => tone(180, 0.3, "sawtooth", 0.2), 180);
      break;

    case "error":
      tone(160, 0.15, "square", 0.15);
      setTimeout(() => tone(140, 0.15, "square", 0.1), 100);
      break;

    case "wire_grab":
      noise(0.04, 0.1, 4000);
      break;

    case "wire_connect":
      tone(880, 0.08, "sine", 0.2);
      setTimeout(() => tone(1100, 0.12, "sine", 0.18), 80);
      break;

    case "wire_drop":
      noise(0.06, 0.1, 800);
      break;

    case "engine_start":
      // Crescendo moteur
      if (!ctx) return;
      resume();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.connect(gain); osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.type = "sawtooth"; osc2.type = "square";
      osc1.frequency.setValueAtTime(50, ctx.currentTime);
      osc1.frequency.linearRampToValueAtTime(120, ctx.currentTime + 1.5);
      osc2.frequency.setValueAtTime(45, ctx.currentTime);
      osc2.frequency.linearRampToValueAtTime(110, ctx.currentTime + 1.5);
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.4);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 1.5);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
      osc1.start(); osc2.start();
      osc1.stop(ctx.currentTime + 2);
      osc2.stop(ctx.currentTime + 2);
      break;

    default:
      break;
  }
}
