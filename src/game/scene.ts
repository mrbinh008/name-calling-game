import { getParkedBike } from "./rendering/animation.ts";
import type { RoosterPose } from "./types.ts";
import type { RenderFrameState } from "./rendering/types.ts";
import {
  clamp01,
  RIDING_ACTIONS,
  smoothstep,
  TILE_HEIGHT,
  toWorldPixels,
} from "./geometry.ts";
import { ActorRenderer } from "./rendering/ActorRenderer.ts";
import { loadSprite } from "./rendering/assets.ts";
import { createVillageBackground } from "./rendering/background.ts";
import { getSceneCamera } from "./rendering/camera.ts";
import type { SceneAssets } from "./rendering/types.ts";
import type {
  CueName,
  Point,
  Round,
  SoundState,
  SpeechFrame,
  Village,
} from "./types.ts";
import type { DrawLayer, HouseHitbox } from "./rendering/types.ts";
import * as world from "./world.ts";
const HOUSE_WIDTH = 64 * world.HOUSE_SIZE * 1.2;
const hashName = (name: string) => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < name.length; index++) {
    hash ^= name.charCodeAt(index);
    hash = Math.imul(hash, 0x1000193);
  }
  return (hash >>> 0) / 0x100000000;
};
export class VillageScene {
  readonly canvas: HTMLCanvasElement;
  readonly village: Village;
  onCue: (cue: CueName) => void;
  readonly context: CanvasRenderingContext2D;
  round: Round | null;
  time: number;
  paused: boolean;
  pixelRatio: number;
  readonly backgroundCanvas: HTMLCanvasElement;
  readonly worldWidth: number;
  readonly worldHeight: number;
  absentNames: Set<string>;
  houseHitboxes: HouseHitbox[];
  private readonly assets: SceneAssets;
  private readonly actors: ActorRenderer;
  constructor(
    canvas: HTMLCanvasElement,
    village: Village,
    assets: SceneAssets,
  ) {
    this.canvas = canvas;
    this.village = village;
    this.assets = assets;
    this.onCue = () => {};
    this.round = null;
    this.time = 0;
    this.paused = false;
    this.pixelRatio = 1;
    this.absentNames = new Set();
    this.houseHitboxes = [];
    const context = canvas.getContext("2d", {
      alpha: false,
    });
    if (!context) throw new Error("Canvas 2D is unavailable");
    this.context = context;
    this.worldWidth = 64 * village.width;
    this.worldHeight = village.depth * TILE_HEIGHT;
    this.actors = new ActorRenderer(
      context,
      assets,
      world.createDisplayNames(
        village.houses.map((house) => house.name).filter(Boolean),
      ),
    );
    this.backgroundCanvas = createVillageBackground(
      village,
      this.worldWidth,
      this.worldHeight,
    );
  }
  static async create(
    canvas: HTMLCanvasElement,
    village: Village,
  ): Promise<VillageScene> {
    const requiredCharacters = new Set(
      village.houses.map((house) => house.characterIndex),
    );
    let [
      houseSheet,
      doorSheet,
      effectsSheet,
      extraEffectsSheet,
      environmentSheet,
      ridingSheet,
      walkingSheet,
      ...childSheets
    ] = await Promise.all([
      loadSprite("nha2"),
      loadSprite("nha2-cua").catch(() => null),
      loadSprite("do"),
      loadSprite("do2").catch(() => null),
      loadSprite("do3"),
      loadSprite("ga-xe2"),
      loadSprite("ga-bo2"),
      ...world.CHILD_SPRITE_VARIANTS.map((variant, index) =>
        requiredCharacters.has(index)
          ? loadSprite(`tre2-${variant}`).catch(() => null)
          : Promise.resolve(null),
      ),
    ]);
    if (
      !houseSheet ||
      !effectsSheet ||
      !environmentSheet ||
      !ridingSheet ||
      !walkingSheet
    )
      throw Error("Thiếu ảnh hoạt cảnh");
    return new VillageScene(canvas, village, {
      houses: houseSheet,
      doors: doorSheet,
      effects: effectsSheet,
      extraEffects: extraEffectsSheet,
      environment: environmentSheet,
      riding: ridingSheet,
      walking: walkingSheet,
      children: childSheets,
    });
  }
  resize(width: number, height: number, pixelRatio: number): void {
    this.pixelRatio = pixelRatio;
    this.canvas.width = Math.round(width * pixelRatio);
    this.canvas.height = Math.round(height * pixelRatio);
  }
  setPaused(paused: boolean): void {
    this.paused = paused;
  }
  setTime(time: number): void {
    this.time = time;
  }
  setAttendance(
    calledNames: Iterable<string>,
    absentNames: Iterable<string>,
  ): void {
    this.actors.setCalledNames(calledNames);
    this.absentNames = new Set(absentNames);
  }
  startRound(round: Round): void {
    this.round = round;
    this.time = 0;
    this.paused = false;
  }
  showLobby(): void {
    this.round = null;
  }
  skipToResult(): void {
    if (this.round) {
      this.time = Math.max(this.time, this.round.resultTime + 0.01);
      this.onCue("result");
    }
  }
  get isPlaying(): boolean {
    return !!this.round;
  }
  getSoundState(): SoundState {
    const round = this.round;
    if (!round || this.time >= round.resultTime)
      return {
        engineRunning: false,
        musicMood: "calm",
      };
    const finalDoorTime =
      round.doorEvents.find(
        (doorEvent) =>
          doorEvent.exitsHouse &&
          doorEvent.houseId ===
            round.selectedHouseIds[round.selectedHouseIds.length - 1],
      )?.startTime ?? round.finalKnockTime + 1.6;
    if (this.time >= finalDoorTime)
      return {
        engineRunning: false,
        musicMood: "silent",
      };
    if (this.time >= round.finalKnockTime - 0.1)
      return {
        engineRunning: false,
        musicMood: "suspense",
      };
    const isRiding = RIDING_ACTIONS.has(
      world.getRoosterPose(round, this.time).segment.action,
    );
    return {
      engineRunning: isRiding,
      musicMood: isRiding ? "chase" : "arrival",
    };
  }
  getHouseAt(x: number, y: number): string | null {
    let houseName: string | null = null;
    let closestDepth = -1 / 0;
    for (const hitbox of this.houseHitboxes) {
      if (
        x >= hitbox.left &&
        x <= hitbox.right &&
        y >= hitbox.top &&
        y <= hitbox.bottom &&
        hitbox.depth > closestDepth
      ) {
        closestDepth = hitbox.depth;
        houseName = hitbox.name;
      }
    }
    return houseName;
  }
  renderFrame(deltaTime: number, width: number, height: number): SpeechFrame {
    const step = Math.min(0.06, Math.max(0, deltaTime));
    if (!this.paused && this.round) {
      const previousTime = this.time;
      this.time += step;
      for (const cue of this.round.cues) {
        if (previousTime < cue.time && this.time >= cue.time) {
          this.onCue(cue.name);
        }
      }
    }
    const context = this.context;
    const round = this.round;
    const time = this.time;
    const speech: SpeechFrame = {
      shouts: [],
      bubbles: [],
    };
    context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    context.globalAlpha = 1;
    context.filter = "none";
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "low";
    context.fillStyle = "#93d07c";
    context.fillRect(0, 0, width, height);
    const camera = getSceneCamera(
      this.village,
      this.round,
      this.time,
      width,
      height,
      this.worldWidth,
      this.worldHeight,
    );
    const scale = camera.scale;
    const viewWidth = width / scale;
    const viewHeight = height / scale;
    const viewX =
      viewWidth >= this.worldWidth
        ? camera.centerX - viewWidth / 2
        : Math.max(
            0,
            Math.min(
              this.worldWidth - viewWidth,
              camera.centerX - viewWidth / 2,
            ),
          );
    const viewY =
      viewHeight >= this.worldHeight
        ? camera.centerY - viewHeight / 2
        : Math.max(
            0,
            Math.min(
              this.worldHeight - viewHeight,
              camera.centerY - viewHeight / 2,
            ),
          );
    {
      const backgroundScaleX = this.backgroundCanvas.width / this.worldWidth;
      const backgroundScaleY = this.backgroundCanvas.height / this.worldHeight;
      const left = Math.max(0, viewX);
      const top = Math.max(0, viewY);
      const right = Math.min(this.worldWidth, viewX + viewWidth);
      const bottom = Math.min(this.worldHeight, viewY + viewHeight);
      if (right > left && bottom > top) {
        context.drawImage(
          this.backgroundCanvas,
          left * backgroundScaleX,
          top * backgroundScaleY,
          (right - left) * backgroundScaleX,
          (bottom - top) * backgroundScaleY,
          (left - viewX) * scale,
          (top - viewY) * scale,
          (right - left) * scale,
          (bottom - top) * scale,
        );
      }
    }
    const toScreen = (point: Point) => {
      const pixel = toWorldPixels(point);
      return {
        x: (pixel.x - viewX) * scale,
        y: (pixel.y - viewY) * scale,
      };
    };
    const pose = round ? world.getRoosterPose(round, time) : null;
    const recentPositions = round
      ? [0, 0.4, 0.8, 1.2].map(
          (delay) =>
            world.getRoosterPose(round, Math.max(0, time - delay)).position,
        )
      : [];
    const layers: DrawLayer[] = [];
    const overlays: (() => void)[] = [];
    const speechAnchors: Record<number, Point> = {};
    const frame: RenderFrameState = {
      width,
      height,
      time,
      round,
      scale,
      toScreen,
      recentPositions,
      layers,
      overlays,
      speechAnchors,
    };
    this.queueHouses(frame);
    this.queueTrees(frame);
    if (round && pose) this.queueRoundActors(frame, round, pose);
    layers.sort((left, right) => left.depth - right.depth);
    for (const layer of layers) layer.draw();
    for (const drawOverlay of overlays) drawOverlay();
    if (round && pose) this.drawRoundOverlays(frame, round, speech);
    return speech;
  }
  private queueHouses(frame: RenderFrameState): void {
    const {
      round,
      time,
      scale,
      toScreen,
      recentPositions,
      layers,
      overlays,
      speechAnchors,
    } = frame;
    const context = this.context;
    const village = this.village;
    this.houseHitboxes = [];
    for (const house of village.houses) {
      const isAbsent = this.absentNames.has(house.name);
      const frame = this.assets.houses.frames[house.styleIndex];
      const base = toScreen({
        x: house.gridX + world.HOUSE_SIZE / 2,
        y: house.gridY + world.HOUSE_SIZE,
      });
      const drawWidth =
        (HOUSE_WIDTH * scale) / (frame.bounds[2] - frame.bounds[0]);
      const drawHeight = (drawWidth * frame.height) / frame.width;
      const left =
        base.x - ((frame.bounds[0] + frame.bounds[2]) / 2) * drawWidth;
      const top = base.y + 3 * scale - frame.bounds[3] * drawHeight;
      const doorFrame = this.assets.doors?.frames[house.styleIndex];
      const doorBounds = doorFrame?.doorBounds ?? [
        0.43,
        0.6,
        0.57,
        frame.bounds[3],
      ];
      const door = {
        x: left + ((doorBounds[0] + doorBounds[2]) / 2) * drawWidth,
        top: top + doorBounds[1] * drawHeight,
        bottom: top + doorBounds[3] * drawHeight,
        width: (doorBounds[2] - doorBounds[0]) * drawWidth,
      };
      const childDoor = {
        ...door,
        width: 0.58 * door.width,
      };
      const doorEvent = round
        ? round.doorEvents.find(
            (event) =>
              event.houseId === house.id &&
              time >= event.startTime &&
              time < event.endTime,
          )
        : undefined;
      const childSheet =
        this.assets.children[house.characterIndex] ??
        this.assets.children.find(
          (sheet, index) => sheet && index >= 6 === house.characterIndex >= 6,
        ) ??
        this.assets.children.find(Boolean) ??
        null;
      speechAnchors[house.id] = {
        x: door.x,
        y: door.top - 4 * scale,
      };
      layers.push({
        depth: house.gridY + world.HOUSE_SIZE,
        draw: () => {
          context.save();
          if (isAbsent) {
            context.filter = "grayscale(0.7) brightness(0.72)";
          }
          context.drawImage(
            this.assets.houses.image,
            frame.x,
            frame.y,
            frame.width,
            frame.height,
            left,
            top,
            drawWidth,
            drawHeight,
          );
          if (doorEvent && doorFrame && this.assets.doors) {
            context.drawImage(
              this.assets.doors.image,
              doorFrame.x,
              doorFrame.y,
              doorFrame.width,
              doorFrame.height,
              left,
              top,
              drawWidth,
              drawHeight,
            );
          } else {
            if (doorEvent) {
              context.fillStyle = "#2a1d17";
              context.fillRect(
                door.x - door.width / 2,
                door.top,
                door.width,
                door.bottom - door.top,
              );
            }
          }
          context.restore();
          if (
            doorEvent &&
            childSheet &&
            round &&
            (!doorEvent.exitsHouse || time - doorEvent.startTime < 0.75)
          ) {
            const childTop = this.actors.drawChild(
              house,
              childSheet,
              childDoor,
              round,
              doorEvent,
              time,
              toScreen,
              scale,
            );
            if (null !== childTop) {
              speechAnchors[house.id] = {
                x: door.x,
                y: childTop,
              };
            }
          }
          this.houseHitboxes.push({
            name: house.name,
            left: left + frame.bounds[0] * drawWidth,
            top: top + frame.bounds[1] * drawHeight,
            right: left + frame.bounds[2] * drawWidth,
            bottom: base.y + village.yardDepth * TILE_HEIGHT * scale,
            depth: house.gridY,
          });
        },
      });
      if (
        doorEvent &&
        childSheet &&
        round &&
        doorEvent.exitsHouse &&
        time - doorEvent.startTime >= 0.75
      ) {
        const childPosition = world.getChildPosition(house);
        layers.push({
          depth:
            house.gridY +
            world.HOUSE_SIZE +
            0.01 +
            (childPosition.y - house.gridY - world.HOUSE_SIZE) *
              smoothstep((time - doorEvent.startTime - 0.75) / 0.6),
          draw: () => {
            const childTop = this.actors.drawChild(
              house,
              childSheet,
              childDoor,
              round,
              doorEvent,
              time,
              toScreen,
              scale,
            );
            if (null !== childTop) {
              speechAnchors[house.id] = {
                x: toScreen(childPosition).x,
                y: childTop,
              };
            }
          },
        });
      }
      if (round && !isAbsent && this.assets.extraEffects) {
        const nameHash = hashName(house.name);
        const roof = {
          x:
            left +
            ((frame.bounds[0] + frame.bounds[2]) / 2 + (nameHash - 0.5) * 0.3) *
              drawWidth,
          y: top + frame.bounds[1] * drawHeight,
        };
        const doorPosition = world.getDoorPosition(house);
        const distanceToRooster = Math.min(
          ...recentPositions.map((point) =>
            Math.hypot(
              point.x - doorPosition.x,
              (point.y - doorPosition.y) * 1.4,
            ),
          ),
        );
        const isTarget = round.selectedHouseIds.includes(house.id);
        const wasAlreadyKnocked =
          isTarget && round.knockTimes.some((knockTime) => time >= knockTime);
        if (distanceToRooster < 3.2 && !doorEvent && !wasAlreadyKnocked) {
          overlays.push(() =>
            this.actors.drawSprite(
              this.assets.effects,
              10,
              roof.x + 14 * scale,
              roof.y + 8 * scale + 4 * Math.abs(Math.sin(6 * time)) * scale,
              20 * scale,
              this.assets.effects.frames[10],
              {
                opacity: clamp01((3.2 - distanceToRooster) / 0.6),
              },
            ),
          );
        }
      }
      const signPosition = world.getSignPosition(house);
      layers.push({
        depth: signPosition.y,
        draw: () =>
          this.actors.drawHouseSign(
            house,
            toScreen(signPosition),
            scale,
            round,
            time,
            isAbsent,
          ),
      });
    }
  }
  private queueTrees(frame: RenderFrameState): void {
    const { toScreen, scale, layers } = frame;
    const village = this.village;
    for (const tree of village.trees) {
      const point = toScreen(tree);
      layers.push({
        depth: tree.y,
        draw: () =>
          this.actors.drawSprite(
            this.assets.environment,
            3,
            point.x,
            point.y,
            108 * scale,
            this.assets.environment.frames[3],
          ),
      });
    }
  }
  private queueRoundActors(
    frame: RenderFrameState,
    round: Round,
    pose: RoosterPose,
  ): void {
    const { time, scale, toScreen, layers, speechAnchors } = frame;
    for (const obstacle of round.obstacles)
      if (obstacle.type === "trashCan") {
        const point = toScreen(obstacle.position);
        const frameIndex = time >= obstacle.impactTime ? 9 : 8;
        layers.push({
          depth: obstacle.position.y - 0.01,
          draw: () =>
            this.actors.drawSprite(
              this.assets.environment,
              frameIndex,
              point.x,
              point.y,
              (frameIndex === 9 ? 28 : 38) * scale,
              this.assets.environment.frames[frameIndex],
            ),
        });
      } else {
        const isChasing =
          time >= obstacle.impactTime && time < obstacle.endTime;
        const dogPosition =
          time < obstacle.impactTime
            ? obstacle.position
            : world.getRoosterPose(
                round,
                Math.min(time, obstacle.endTime) - 0.55,
              ).position;
        const previousPosition = world.getRoosterPose(
          round,
          Math.min(time, obstacle.endTime) - 0.75,
        ).position;
        const point = toScreen(dogPosition);
        const flipX = toScreen(previousPosition).x > point.x;
        layers.push({
          depth: dogPosition.y,
          draw: () =>
            this.actors.drawSprite(
              this.assets.environment,
              isChasing ? 11 : 10,
              point.x,
              point.y +
                (isChasing ? -(6 * Math.abs(Math.sin(14 * time))) * scale : 0),
              (isChasing ? 30 : 22) * scale,
              this.assets.environment.frames[isChasing ? 11 : 10],
              {
                flipX: isChasing && flipX,
              },
            ),
        });
      }
    const parkedBike = getParkedBike(round, time);
    if (parkedBike) {
      const point = toScreen(parkedBike.position);
      const frameIndex =
        parkedBike.direction === "down"
          ? 1
          : 2 * Number(parkedBike.direction === "up");
      layers.push({
        depth: parkedBike.position.y,
        draw: () =>
          this.actors.drawSprite(
            this.assets.environment,
            frameIndex,
            point.x,
            point.y,
            62 * scale,
            this.assets.environment.frames[0],
            {
              flipX: parkedBike.direction === "left",
            },
          ),
      });
    }
    const roosterPosition = toScreen(pose.position);
    layers.push({
      depth: pose.position.y + 0.02,
      draw: () => {
        const roosterTop = this.actors.drawRooster(
          pose.segment,
          pose.progress,
          roosterPosition,
          scale,
          time,
        );
        speechAnchors[-1] = {
          x: roosterPosition.x,
          y: roosterTop,
        };
      },
    });
    for (let trailIndex = 1; trailIndex <= 4; trailIndex++) {
      const sampleTime = time - 0.11 * trailIndex;
      if (sampleTime < 0) break;
      const trailPose = world.getRoosterPose(round, sampleTime);
      if (
        trailPose.segment.action !== "ride" &&
        trailPose.segment.action !== "stall"
      )
        continue;
      const point = toScreen(trailPose.position);
      const isStalling =
        trailPose.segment.action === "stall" && !!this.assets.extraEffects;
      const sheet =
        (isStalling ? this.assets.extraEffects : null) ?? this.assets.effects;
      const frameIndex = isStalling ? 2 : 6;
      layers.push({
        depth: trailPose.position.y - 0.3,
        draw: () =>
          this.actors.drawSprite(
            sheet,
            frameIndex,
            point.x,
            point.y,
            (14 + 5 * trailIndex) * scale,
            sheet.frames[frameIndex],
            {
              opacity: 0.55 - 0.11 * trailIndex,
            },
          ),
      });
    }
  }
  private drawRoundOverlays(
    frame: RenderFrameState,
    round: Round,
    speech: SpeechFrame,
  ): void {
    const { time, width, height, scale, toScreen, speechAnchors } = frame;
    const context = this.context;
    const village = this.village;
    const darkness = clamp01((time - round.finalKnockTime) / 0.9);
    if (darkness > 0) {
      const house =
        village.houses[
          round.selectedHouseIds[round.selectedHouseIds.length - 1]
        ];
      const point = toScreen({
        x: house.gridX + world.HOUSE_SIZE / 2 + 0.3,
        y: house.gridY + world.HOUSE_SIZE,
      });
      const radius = Math.max(width, height);
      const gradient = context.createRadialGradient(
        point.x,
        point.y - 30 * scale,
        80 * scale,
        point.x,
        point.y - 30 * scale,
        160 * scale,
      );
      gradient.addColorStop(0, "rgba(10,14,30,0)");
      gradient.addColorStop(1, `rgba(10,14,30,${0.68 * darkness})`);
      context.fillStyle = gradient;
      context.fillRect(
        point.x - radius,
        point.y - radius,
        2 * radius,
        2 * radius,
      );
    }
    for (const segment of round.segments) {
      if (segment.action !== "summon") continue;
      const elapsed = time - segment.startTime - 0.3;
      if (elapsed < 0 || elapsed > 1.6 || !this.assets.extraEffects) continue;
      const anchor = speechAnchors[-1];
      if (anchor) {
        this.actors.drawSprite(
          this.assets.extraEffects,
          7,
          anchor.x,
          anchor.y + 30 * scale - 20 * elapsed * scale,
          (70 + 50 * elapsed) * scale,
          this.assets.extraEffects.frames[7],
          {
            opacity: 1 - elapsed / 1.6,
          },
        );
      }
    }
    for (const dialogue of round.dialogues) {
      if (time < dialogue.startTime || time >= dialogue.endTime) continue;
      const anchor =
        dialogue.speaker === "rooster"
          ? speechAnchors[-1]
          : speechAnchors[dialogue.speaker];
      if (anchor) {
        if (dialogue.isShout) {
          speech.shouts.push({
            id: `${dialogue.startTime}-${dialogue.text}`,
            text: dialogue.text,
            x: anchor.x + 70 * Math.min(1.6, scale),
            y: anchor.y - 10,
            progress:
              (time - dialogue.startTime) /
              (dialogue.endTime - dialogue.startTime),
            isLarge: true,
          });
        } else {
          speech.bubbles.push({
            id: `${dialogue.speaker}-${dialogue.startTime}`,
            text: dialogue.text,
            x: anchor.x,
            y: anchor.y - 6,
          });
        }
      }
    }
  }
  destroy(): void {
    this.round = null;
  }
}
