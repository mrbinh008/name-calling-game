import * as world from "@/game/world.ts";
import { clamp01, RIDING_ACTIONS, smoothstep } from "@/game/geometry.ts";
import type {
  DoorEvent,
  House,
  MotionSegment,
  Point,
  Round,
  SpriteFrame,
  SpriteSheet,
} from "@/game/types.ts";
import type {
  DoorProjection,
  SceneAssets,
  ScreenProjector,
  SpriteDrawBounds,
  SpriteDrawOptions,
} from "@/game/rendering/types.ts";
export class ActorRenderer {
  private readonly context: CanvasRenderingContext2D;
  private readonly assets: SceneAssets;
  private readonly displayNames: Record<string, string>;
  private readonly textWidthCache = new Map<string, number>();
  private calledNames = new Set<string>();
  constructor(
    context: CanvasRenderingContext2D,
    assets: SceneAssets,
    displayNames: Record<string, string>,
  ) {
    this.context = context;
    this.assets = assets;
    this.displayNames = displayNames;
  }
  setCalledNames(names: Iterable<string>): void {
    this.calledNames = new Set(names);
  }
  drawSprite(
    sheet: SpriteSheet,
    frameIndex: number,
    x: number,
    y: number,
    height: number,
    referenceFrame: SpriteFrame,
    options: SpriteDrawOptions = {},
  ): SpriteDrawBounds | undefined {
    const frame = sheet.frames[frameIndex];
    if (!frame) return;
    const drawHeight =
      (height /
        ((referenceFrame.bounds[3] - referenceFrame.bounds[1]) *
          referenceFrame.height)) *
      frame.height;
    const drawWidth = drawHeight * (frame.width / frame.height);
    const context = this.context;
    context.save();
    if (undefined !== options.opacity) {
      context.globalAlpha *= options.opacity;
    }
    if (options.filter) {
      context.filter = options.filter;
    }
    context.translate(x, y);
    if (options.flipX) {
      context.scale(-1, 1);
    }
    const anchorX =
      options.centerByBounds === false
        ? 0.5
        : (frame.bounds[0] + frame.bounds[2]) / 2;
    context.drawImage(
      sheet.image,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      -anchorX * drawWidth,
      -frame.bounds[3] * drawHeight,
      drawWidth,
      drawHeight,
    );
    context.restore();
    return {
      top: y - (frame.bounds[3] - frame.bounds[1]) * drawHeight,
      width: drawWidth,
      height: drawHeight,
    };
  }
  drawChild(
    house: House,
    sheet: SpriteSheet,
    door: DoorProjection,
    round: Round,
    doorEvent: DoorEvent,
    time: number,
    toScreen: ScreenProjector,
    scale: number,
  ): number | null {
    const context = this.context;
    const elapsed = time - doorEvent.startTime;
    const height = (door.bottom - door.top) * 0.94;
    const drawInsideDoor = (
      frameIndex: number,
      opacity: number,
      rise: number = 0,
    ) => {
      context.save();
      context.beginPath();
      context.rect(
        door.x - door.width / 2,
        door.top,
        door.width,
        door.bottom - door.top + 2 * scale,
      );
      context.clip();
      const bounds = this.drawSprite(
        sheet,
        frameIndex,
        door.x,
        door.bottom - rise,
        height,
        sheet.frames[0],
        {
          opacity: opacity,
        },
      );
      context.restore();
      return bounds ? bounds.top : null;
    };
    if (!doorEvent.exitsHouse)
      return elapsed < 0.15
        ? null
        : drawInsideDoor(
            3,
            clamp01((elapsed - 0.15) / 0.25) *
              clamp01((doorEvent.endTime - time) / 0.3),
          );
    if (elapsed < 0.3) return null;
    if (elapsed < 0.75)
      return drawInsideDoor(
        Math.floor(elapsed / 0.18) % 2 ? 2 : 1,
        clamp01((elapsed - 0.3) / 0.3),
        0,
      );
    const destination = toScreen(world.getChildPosition(house));
    const progress = smoothstep((elapsed - 0.75) / 0.6);
    const x = door.x + (destination.x - door.x) * progress;
    const y = door.bottom + (destination.y - door.bottom) * progress;
    let frameIndex = 0;
    if (progress < 1) frameIndex = Math.floor(elapsed / 0.18) % 2 ? 2 : 1;
    else {
      const summonSegment = round.segments.find(
        (segment) =>
          segment.action === "summon" &&
          segment.startTime >= doorEvent.startTime,
      );
      frameIndex =
        summonSegment && time >= summonSegment.startTime
          ? 8
          : (round.reactions[house.id] ?? 5);
    }
    context.save();
    context.globalAlpha = 0.25 * progress;
    context.fillStyle = "#2b3a1a";
    context.beginPath();
    context.ellipse(x, y, 11 * scale, 3.5 * scale, 0, 0, 2 * Math.PI);
    context.fill();
    context.restore();
    const bounds = this.drawSprite(
      sheet,
      frameIndex,
      x,
      y,
      height * (1 + 0.08 * progress),
      sheet.frames[0],
    );
    return bounds ? bounds.top : null;
  }
  drawRooster(
    segment: MotionSegment,
    progress: number,
    position: Point,
    scale: number,
    time: number,
  ): number {
    let bounds;
    const flipX = segment.direction === "left";
    const ridingSheet = this.assets.riding;
    const walkingSheet = this.assets.walking;
    const frameStep = Math.floor(9 * time) % 2;
    const context = this.context;
    const isRiding = RIDING_ACTIONS.has(segment.action);
    const isHorizontal =
      segment.direction === "right" || segment.direction === "left";
    context.save();
    context.globalAlpha = 0.28;
    context.fillStyle = "#1f2433";
    context.beginPath();
    context.ellipse(
      position.x,
      position.y,
      (isRiding && isHorizontal ? 32 : 16) * scale,
      (isRiding ? 7 : 5) * scale,
      0,
      0,
      2 * Math.PI,
    );
    context.fill();
    context.restore();
    const ridingHeight = 100 * scale;
    const walkingHeight = 74 * scale;
    switch (segment.action) {
      case "ride":
        bounds = this.drawSprite(
          ridingSheet,
          (isHorizontal ? 0 : segment.direction === "down" ? 2 : 4) + frameStep,
          position.x,
          position.y - 2 * frameStep * scale,
          ridingHeight,
          ridingSheet.frames[0],
          {
            flipX: flipX,
          },
        );
        break;
      case "brake":
        bounds = this.drawSprite(
          ridingSheet,
          6,
          position.x,
          position.y,
          ridingHeight,
          ridingSheet.frames[0],
          {
            flipX: flipX,
          },
        );
        this.drawSprite(
          this.assets.effects,
          7,
          position.x + (flipX ? 34 : -34) * scale,
          position.y,
          46 * scale * (0.6 + progress),
          this.assets.effects.frames[7],
          {
            flipX: flipX,
            opacity: 1 - 0.6 * progress,
          },
        );
        break;
      case "turn":
        bounds = this.drawSprite(
          ridingSheet,
          10,
          position.x,
          position.y,
          ridingHeight,
          ridingSheet.frames[0],
          {
            flipX: flipX,
          },
        );
        break;
      case "look":
        bounds = this.drawSprite(
          ridingSheet,
          11,
          position.x,
          position.y,
          ridingHeight,
          ridingSheet.frames[0],
          {
            flipX: Math.floor(time / 0.45) % 2 ? !flipX : flipX,
          },
        );
        break;
      case "horn":
        bounds = this.drawSprite(
          ridingSheet,
          7,
          position.x,
          position.y,
          ridingHeight,
          ridingSheet.frames[0],
          {
            flipX: flipX,
          },
        );
        break;
      case "stall":
        bounds = this.drawSprite(
          ridingSheet,
          8,
          position.x,
          position.y - (Math.floor(12 * time) % 2) * scale,
          ridingHeight,
          ridingSheet.frames[0],
          {
            flipX: flipX,
          },
        );
        break;
      case "fall":
        bounds = this.drawSprite(
          ridingSheet,
          9,
          position.x,
          position.y,
          0.86 * ridingHeight,
          ridingSheet.frames[0],
          {
            flipX: flipX,
          },
        );
        if (bounds) {
          this.drawSprite(
            this.assets.effects,
            11,
            position.x,
            bounds.top + 14 * scale,
            44 * scale,
            this.assets.effects.frames[11],
            {
              opacity: 1 - clamp01((progress - 0.8) / 0.2),
            },
          );
        }
        break;
      case "walk": {
        const walkStep = Math.floor(6 * time) % 2;
        const frameIndex = isHorizontal
          ? 10
          : segment.direction === "down"
            ? 1 + walkStep
            : 3 + walkStep;
        bounds = this.drawSprite(
          walkingSheet,
          frameIndex,
          position.x,
          position.y - 3 * Math.abs(Math.sin(10 * time)) * scale,
          walkingHeight,
          walkingSheet.frames[0],
          {
            flipX: flipX,
          },
        );
        break;
      }
      case "knock":
        bounds = this.drawSprite(
          walkingSheet,
          Math.floor(time / 0.2) % 2 ? 6 : 5,
          position.x,
          position.y,
          walkingHeight,
          walkingSheet.frames[0],
        );
        break;
      case "waitForDoor":
        bounds = this.drawSprite(
          walkingSheet,
          11,
          position.x,
          position.y,
          walkingHeight,
          walkingSheet.frames[0],
        );
        break;
      case "readNotice":
        bounds = this.drawSprite(
          walkingSheet,
          8,
          position.x,
          position.y,
          walkingHeight,
          walkingSheet.frames[0],
        );
        break;
      case "summon":
        bounds = this.drawSprite(
          walkingSheet,
          7,
          position.x,
          position.y - 5 * Math.abs(Math.sin(progress * Math.PI * 3)) * scale,
          1.06 * walkingHeight,
          walkingSheet.frames[0],
        );
    }
    return bounds?.top ?? position.y - ridingHeight;
  }
  drawHouseSign(
    house: House,
    position: Point,
    scale: number,
    round: Round | null,
    time: number,
    isAbsent: boolean,
  ): void {
    const context = this.context;
    const name = house.name;
    const targetIndex = round ? round.selectedHouseIds.indexOf(house.id) : -1;
    const isSelected =
      round !== null &&
      targetIndex >= 0 &&
      time >= round.knockTimes[targetIndex];
    const wasCalled = this.calledNames.has(name) && !round?.startsNewCycle;
    const label =
      (wasCalled ? "✓ " : "") +
      (isAbsent
        ? `${this.displayNames[name]} (vắng)`
        : this.displayNames[name]);
    const fontSize = Math.max(
      15,
      Math.min(isSelected ? 32 : 21, 15.5 * scale * (isSelected ? 1.25 : 1)),
    );
    context.save();
    context.font = `800 ${fontSize}px "Be Vietnam Pro", "Segoe UI", system-ui, sans-serif`;
    const cacheKey = `${fontSize.toFixed(1)}|${label}`;
    let textWidth = this.textWidthCache.get(cacheKey);
    if (undefined === textWidth) {
      textWidth = context.measureText(label).width;
      if (this.textWidthCache.size > 4e3) {
        this.textWidthCache.clear();
      }
      this.textWidthCache.set(cacheKey, textWidth);
    }
    const signWidth = textWidth + 0.9 * fontSize;
    const signHeight = 1.5 * fontSize;
    const postHeight = Math.max(10, 18 * scale);
    context.strokeStyle = "#6e4a2b";
    context.lineWidth = Math.max(2, 3 * scale);
    context.beginPath();
    context.moveTo(position.x, position.y);
    context.lineTo(position.x, position.y - postHeight);
    context.stroke();
    const left = position.x - signWidth / 2;
    const top = position.y - postHeight - signHeight;
    context.fillStyle = isSelected
      ? "#dc2626"
      : isAbsent
        ? "#d6d3d1"
        : wasCalled
          ? "#dcfce7"
          : "#fffaf0";
    context.strokeStyle = isSelected ? "#7f1d1d" : "#6e4a2b";
    context.lineWidth = Math.max(1.5, 2 * scale);
    context.beginPath();
    context.roundRect(left, top, signWidth, signHeight, 0.3 * signHeight);
    context.fill();
    context.stroke();
    context.fillStyle = isSelected
      ? "#fff"
      : isAbsent
        ? "#57534e"
        : wasCalled
          ? "#166534"
          : "#43291a";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(label, position.x, top + signHeight / 2 + 0.04 * fontSize);
    context.restore();
  }
}
