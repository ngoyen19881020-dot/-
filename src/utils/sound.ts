let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioContext) {
    audioContext = new AudioCtx();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

export function playCompletionChime(mode: 'focus' | 'break'): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = mode === 'focus' ? [523.25, 659.25, 783.99] : [440, 554.37];

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.16);

    gain.gain.setValueAtTime(0.0001, now + idx * 0.16);
    gain.gain.exponentialRampToValueAtTime(0.14, now + idx * 0.16 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.16 + 0.9);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.16);
    osc.stop(now + idx * 0.16 + 0.95);
  });
}
