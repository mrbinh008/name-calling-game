import type { ArtworkBank } from "./artwork.ts";

export interface SpritePose {
  x: number;
  y: number;
  height: number;
  time?: number;
  frame?: number;
  fps?: number;
  animation?: string;
  flipX?: boolean;
  rotation?: number;
  opacity?: number;
}
interface TextStyle {
  size?: number;
  color?: string;
  align?: CanvasTextAlign;
  weight?: number;
  maxWidth?: number;
  font?: string;
}

export class CanvasPainter {
  constructor(
    readonly context: CanvasRenderingContext2D,
    readonly artwork: ArtworkBank,
  ) {}

  image(
    key: string,
    x: number,
    y: number,
    width: number,
    height: number,
    opacity = 1,
  ): void {
    const asset = this.artwork.get(key);
    if (!asset) throw new Error(`Missing artwork: ${key}`);
    this.context.save();
    this.context.globalAlpha *= opacity;
    this.context.drawImage(asset.image, x, y, width, height);
    this.context.restore();
  }

  imageBelow(
    key: string,
    topRatio: number,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    const asset = this.artwork.get(key);
    if (!asset) throw new Error(`Missing artwork: ${key}`);
    const sourceY = Math.round(asset.image.height * topRatio);
    const destinationY = (sourceY / asset.image.height) * height;
    this.context.drawImage(
      asset.image,
      0,
      sourceY,
      asset.image.width,
      asset.image.height - sourceY,
      x,
      y + destinationY,
      width,
      height - destinationY,
    );
  }

  sprite(key: string, pose: SpritePose): void {
    const asset = this.artwork.get(key);
    if (!asset) throw new Error(`Missing sprite: ${key}`);
    const { context } = this;
    const frames = asset.definition.frames;
    const sequence = pose.animation
      ? asset.definition.animations?.[pose.animation]
      : undefined;
    const step = pose.frame ?? Math.floor((pose.time ?? 0) * (pose.fps ?? 8));
    const frameIndex = sequence?.length
      ? sequence[((step % sequence.length) + sequence.length) % sequence.length]
      : ((step % Math.max(1, frames.length)) + frames.length) %
        Math.max(1, frames.length);
    const frame = frames[frameIndex];
    context.save();
    context.translate(pose.x, pose.y);
    context.rotate(pose.rotation ?? 0);
    context.scale(pose.flipX ? -1 : 1, 1);
    context.globalAlpha *= pose.opacity ?? 1;
    if (!frame) {
      const width = (pose.height * asset.image.width) / asset.image.height;
      context.drawImage(
        asset.image,
        -width / 2,
        -pose.height,
        width,
        pose.height,
      );
    } else if (frame.sourceWidth && frame.sourceHeight) {
      const scale = pose.height / frame.sourceHeight;
      context.drawImage(
        asset.image,
        frame.x,
        frame.y,
        frame.width,
        frame.height,
        ((frame.offsetX ?? 0) - frame.sourceWidth / 2) * scale,
        ((frame.offsetY ?? 0) - frame.sourceHeight) * scale,
        frame.width * scale,
        frame.height * scale,
      );
    } else {
      const reference = frames[0];
      const scale =
        pose.height /
        (reference.height * (reference.bounds[3] - reference.bounds[1]));
      const width = frame.width * scale;
      const height = frame.height * scale;
      context.drawImage(
        asset.image,
        frame.x,
        frame.y,
        frame.width,
        frame.height,
        (-(frame.bounds[0] + frame.bounds[2]) / 2) * width,
        -frame.bounds[3] * height,
        width,
        height,
      );
    }
    context.restore();
  }

  panel(
    x: number,
    y: number,
    width: number,
    height: number,
    fill: string,
    stroke?: string,
    radius = 16,
  ): void {
    const { context } = this;
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
    context.fillStyle = fill;
    context.fill();
    if (stroke) {
      context.strokeStyle = stroke;
      context.lineWidth = 2;
      context.stroke();
    }
  }

  text(message: string, x: number, y: number, style: TextStyle = {}): void {
    const { context } = this;
    context.save();
    context.fillStyle = style.color ?? "#243529";
    context.font = `${style.weight ?? 800} ${style.size ?? 30}px "${style.font ?? "Baloo 2"}", sans-serif`;
    context.textAlign = style.align ?? "center";
    context.textBaseline = "middle";
    context.fillText(message, x, y, style.maxWidth);
    context.restore();
  }

  label(name: string, x: number, y: number, selected = false): void {
    const width = Math.min(230, Math.max(90, name.length * 15 + 26));
    this.panel(
      x - width / 2,
      y - 20,
      width,
      40,
      selected ? "#b83822" : "#fffdf3ee",
      selected ? "#ffd66b" : "#385d3c",
      9,
    );
    this.text(name, x, y + 1, {
      size: 25,
      color: selected ? "#fff" : "#243529",
      maxWidth: width - 18,
    });
  }

  bubble(message: string, x: number, y: number, width = 360): void {
    this.panel(x - width / 2, y - 62, width, 62, "#fffdf7", "#463d30", 18);
    const { context } = this;
    context.fillStyle = "#fffdf7";
    context.beginPath();
    context.moveTo(x - 8, y - 2);
    context.lineTo(x + 10, y + 16);
    context.lineTo(x + 18, y - 2);
    context.fill();
    this.text(message, x, y - 30, { size: 25, maxWidth: width - 24 });
  }

  shadow(x: number, y: number, width: number, opacity = 0.2): void {
    const { context } = this;
    context.save();
    context.globalAlpha = opacity;
    context.fillStyle = "#202018";
    context.beginPath();
    context.ellipse(x, y, width, width / 5, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  wrappedText(
    message: string,
    x: number,
    y: number,
    width: number,
    style: TextStyle = {},
  ): number {
    const words = message.split(/\s+/);
    const size = style.size ?? 23;
    let line = "";
    let lineCount = 0;
    this.context.font = `${style.weight ?? 500} ${size}px "Be Vietnam Pro", sans-serif`;
    for (const word of words) {
      const next = `${line} ${word}`.trim();
      if (line && this.context.measureText(next).width > width) {
        this.text(line, x, y + lineCount * size * 1.5, {
          ...style,
          size,
          align: "left",
          font: "Be Vietnam Pro",
        });
        lineCount++;
        line = word;
      } else line = next;
    }
    if (line) {
      this.text(line, x, y + lineCount * size * 1.5, {
        ...style,
        size,
        align: "left",
        font: "Be Vietnam Pro",
      });
      lineCount++;
    }
    return lineCount * size * 1.5;
  }
}
