import type { Settings } from "./storage";
let context: AudioContext | null = null;
export function unlockAudio() {
  try {
    context ??= new AudioContext();
    if (context.state === "suspended") void context.resume().catch(() => {});
  } catch {
    /* Звук — необязательное улучшение. */
  }
}
export function completionFeedback(settings: Settings) {
  if (settings.vibration && "vibrate" in navigator) {
    try {
      navigator.vibrate([80, 80, 120]);
    } catch {
      /* API может быть ограничен платформой. */
    }
  }
  if (!settings.sound || !context || context.state !== "running") return;
  try {
    const now = context.currentTime;
    for (const [frequency, offset, volume] of [
      [660, 0, 0.14],
      [880, 0.18, 0.08],
    ]) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, now + offset);
      gain.gain.linearRampToValueAtTime(volume, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 1.1);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now + offset);
      oscillator.stop(now + offset + 1.2);
    }
  } catch {
    /* Не мешаем завершению таймера при отказе аудио. */
  }
}
