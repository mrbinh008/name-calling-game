import { gameAudio } from "../../game/sound.ts";
import type { BackgroundAudio } from "../../hooks/useGamePreferences.ts";

export class PickerAudio implements BackgroundAudio {
  private background: HTMLAudioElement | null = null;
  private readonly effects = new Set<HTMLAudioElement>();
  private context: AudioContext | null = null;
  private readonly tones = new Set<OscillatorNode>();

  constructor(private readonly backgroundTrack?: string) {}

  startBackground(): void {
    if (
      !gameAudio.isEnabled() ||
      !this.backgroundTrack ||
      typeof Audio === "undefined"
    )
      return;
    if (!this.background) {
      this.background = new Audio(this.backgroundTrack);
      this.background.loop = true;
      this.background.volume = 0.24;
    }
    if (this.background.paused) void this.background.play().catch(() => {});
  }
  stopBackground(): void {
    this.background?.pause();
    for (const effect of this.effects) {
      effect.pause();
      effect.onended = null;
    }
    this.effects.clear();
    for (const oscillator of this.tones) {
      try {
        oscillator.stop();
      } catch {
        /* Already ended. */
      }
    }
    this.tones.clear();
  }
  play(url: string): void {
    if (!gameAudio.isEnabled()) return;
    if (url.startsWith("tone:")) {
      this.playTone(url.slice(5));
      return;
    }
    if (typeof Audio === "undefined") return;
    const effect = new Audio(url);
    effect.volume = 0.6;
    this.effects.add(effect);
    effect.onended = () => this.effects.delete(effect);
    void effect.play().catch(() => this.effects.delete(effect));
  }
  dispose(): void {
    this.stopBackground();
    this.background = null;
    if (this.context) void this.context.close().catch(() => {});
    this.context = null;
  }

  private playTone(kind: string): void {
    const AudioContextConstructor =
      window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextConstructor) return;
    try {
      this.context ??= new AudioContextConstructor();
      const context = this.context;
      if (context.state === "suspended") void context.resume().catch(() => {});
      const notes =
        kind === "result"
          ? [523, 659, 784, 1047]
          : kind === "call"
            ? [784, 988, 784, 988]
            : kind === "impact"
              ? [140, 90, 55]
              : kind === "warning"
                ? [660, 880, 660]
                : [880, 1175];
      notes.forEach((frequency, index) => {
        const time =
          context.currentTime + index * (kind === "call" ? 0.23 : 0.1);
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = kind === "impact" ? "triangle" : "sine";
        oscillator.frequency.setValueAtTime(frequency, time);
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.exponentialRampToValueAtTime(0.12, time + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.28);
        oscillator.connect(gain).connect(context.destination);
        this.tones.add(oscillator);
        oscillator.onended = () => {
          this.tones.delete(oscillator);
          oscillator.disconnect();
          gain.disconnect();
        };
        oscillator.start(time);
        oscillator.stop(time + 0.3);
      });
    } catch {
      /* Browsers without an audio device can still play the game. */
    }
  }
}
