/** Plays a short notification chime using Web Audio API – no file needed */
let audioCtx: AudioContext | null = null;

export function playNotificationSound() {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    const ctx = audioCtx;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(830, ctx.currentTime);
    osc.frequency.setValueAtTime(1050, ctx.currentTime + 0.08);
    osc.frequency.setValueAtTime(990, ctx.currentTime + 0.16);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // silent fail – audio not available
  }
}
