import { createDisplayNames } from "@/game/names.ts";
import type { GenderByName } from "@/game/types.ts";
import type { ArtworkBank } from "@/games/shared/artwork.ts";
import { CanvasPainter } from "@/games/shared/CanvasPainter.ts";
import { shuffleNames, type PickerRound } from "@/games/shared/selection.ts";

export interface StoryCue {
  time: number;
  sound: string;
}
export interface SceneOptions {
  roster: string[];
  genders: GenderByName;
  duration: number;
}

export abstract class AnimatedScene {
  onComplete: () => void = () => {};
  onSound: (url: string) => void = () => {};
  protected readonly painter: CanvasPainter;
  protected readonly context: CanvasRenderingContext2D;
  protected readonly displayNames: Record<string, string>;
  protected readonly roster: readonly string[];
  protected readonly genders: GenderByName;
  protected round: PickerRound | null = null;
  protected actors: string[];
  protected time = 0;
  protected ambientTime = 0;
  protected stageWidth = 1600;
  protected stageHeight = 900;
  private paused = false;
  private finished = false;
  private pixelRatio = 1;

  constructor(
    readonly canvas: HTMLCanvasElement,
    protected readonly artwork: ArtworkBank,
    readonly options: SceneOptions,
  ) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D is unavailable");
    this.context = context;
    this.painter = new CanvasPainter(context, artwork);
    this.roster = options.roster;
    this.genders = options.genders;
    this.actors = options.roster.slice(0, this.actorLimit);
    this.displayNames = createDisplayNames(options.roster);
  }

  get elapsed(): number {
    return this.time;
  }
  get duration(): number {
    return this.options.duration;
  }
  get isPlaying(): boolean {
    return this.round !== null && !this.finished;
  }
  get revealedNames(): readonly string[] {
    return this.finished ? (this.round?.selectedNames ?? []) : [];
  }
  protected get progress(): number {
    return Math.min(1, this.time / this.duration);
  }
  protected get actorLimit(): number {
    return 12;
  }
  protected abstract draw(): void;
  protected getStageSize(
    _width: number,
    _height: number,
  ): { width: number; height: number } {
    return { width: 1600, height: 900 };
  }
  abstract getStatus(): string;
  protected getSoundCues(): readonly StoryCue[] {
    return [];
  }

  resize(width: number, height: number, pixelRatio: number): void {
    this.pixelRatio = pixelRatio;
    this.canvas.width = Math.round(width * pixelRatio);
    this.canvas.height = Math.round(height * pixelRatio);
  }
  startRound(round: PickerRound): void {
    this.round = round;
    this.time = 0;
    this.finished = false;
    this.paused = false;
    const others = round.participants
      .filter((name) => !round.selectedNames.includes(name))
      .slice(0, Math.max(0, this.actorLimit - round.selectedNames.length));
    let seed = round.seed || 1;
    this.actors = shuffleNames(
      [...round.selectedNames, ...others],
      () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32,
    );
  }
  setPaused(paused: boolean): void {
    this.paused = paused;
  }
  showLobby(): void {
    this.round = null;
    this.time = 0;
    this.finished = false;
    this.paused = false;
    this.actors = this.roster.slice(0, this.actorLimit);
  }
  skipToResult(): void {
    if (this.round && !this.finished) {
      this.time = this.duration;
      this.finish();
    }
  }
  seek(time: number): void {
    this.time = Math.max(0, Math.min(this.duration, time));
  }

  renderFrame(deltaTime: number, width: number, height: number): void {
    if (!this.paused) {
      this.ambientTime += Math.min(0.06, Math.max(0, deltaTime));
      if (this.isPlaying) {
        const previous = this.time;
        this.time = Math.min(
          this.duration,
          this.time + Math.min(0.06, Math.max(0, deltaTime)),
        );
        for (const cue of this.getSoundCues())
          if (previous < cue.time && this.time >= cue.time)
            this.onSound(cue.sound);
        if (this.time >= this.duration) this.finish();
      }
    }
    if (width <= 0 || height <= 0) return;
    const stage = this.getStageSize(width, height);
    this.stageWidth = stage.width;
    this.stageHeight = stage.height;
    const scale = Math.min(width / stage.width, height / stage.height);
    this.context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    this.context.fillStyle = "#172820";
    this.context.fillRect(0, 0, width, height);
    this.context.translate(
      (width - stage.width * scale) / 2,
      (height - stage.height * scale) / 2,
    );
    this.context.scale(scale, scale);
    this.context.save();
    this.context.beginPath();
    this.context.rect(0, 0, stage.width, stage.height);
    this.context.clip();
    this.draw();
    this.context.restore();
  }

  protected isSelected(name: string): boolean {
    return this.round?.selectedNames.includes(name) ?? false;
  }
  protected displayName(name: string): string {
    return this.displayNames[name] ?? name;
  }
  protected characterVariant(
    name: string,
    index: number,
    variants = 3,
  ): string {
    const gender = this.genders[name];
    return `${gender === "nu" || (!gender && index % 2 === 1) ? "female" : "male"}${(index % variants) + 1}`;
  }
  private finish(): void {
    if (!this.finished) {
      this.finished = true;
      this.onComplete();
    }
  }
  destroy(): void {
    this.round = null;
    this.artwork.clear();
    this.onComplete = () => {};
    this.onSound = () => {};
  }
}
