import manifest from "../assets/jiangshi.json" with { type: "json" };
import {
  AnimatedScene,
  type SceneOptions,
  type StoryCue,
} from "../shared/AnimatedScene.ts";
import { loadArtwork } from "../shared/artwork.ts";
import { clamp01 } from "../../game/geometry.ts";

export class JiangshiScene extends AnimatedScene {
  static async create(
    canvas: HTMLCanvasElement,
    options: SceneOptions,
  ): Promise<JiangshiScene> {
    return new JiangshiScene(canvas, await loadArtwork(manifest), options);
  }
  getStatus(): string {
    if (!this.round) return "Đèn lồng đã sáng. Cả lớp vào sân nào!";
    if (this.progress < 0.2) return "Pháp sư đang khai đàn…";
    if (this.progress < 0.65)
      return "Lá bùa đang chuyền từ bạn này sang bạn khác!";
    if (this.progress < 0.82) return "Ai sẽ được linh phù chọn?";
    return "Định thân! Mời người được chọn lên bảng!";
  }
  protected getSoundCues(): StoryCue[] {
    return [
      { time: this.duration * 0.12, sound: "/cuong-thi/v2/am/cong.flac" },
      { time: this.duration * 0.23, sound: "/cuong-thi/v2/am/bua-bay.flac" },
      { time: this.duration * 0.42, sound: "/cuong-thi/v2/am/nhay.flac" },
      { time: this.duration * 0.66, sound: "/cuong-thi/v2/am/hut.flac" },
      { time: this.duration * 0.82, sound: "/cuong-thi/v2/am/dinh-than.flac" },
    ];
  }
  protected draw(): void {
    const { painter, context } = this;
    const progress = this.round ? this.progress : 0;
    const clock = this.round ? this.time : this.ambientTime;
    painter.image("sky", 0, 0, 1600, 900);
    painter.imageBelow("ground", 0.4, 0, 0, 1600, 900);
    painter.image("middle", 0, 0, 1600, 900);
    painter.image("foreground", 0, 95, 1600, 900);
    painter.sprite("lantern", { x: 450, y: 270, height: 170, opacity: 0.9 });
    painter.sprite("lantern", { x: 1210, y: 215, height: 140, opacity: 0.85 });
    painter.image(
      "seal",
      420,
      535,
      970,
      260,
      this.round ? 0.55 + Math.sin(clock * 3) * 0.15 : 0.3,
    );
    const positions = this.actors.map((_name, index) => ({
      x: 460 + (index % 6) * 170,
      y: 570 + Math.floor(index / 6) * 240,
    }));
    const flyingIndex =
      Math.floor(clock * (progress > 0.55 ? 5 : 2)) %
      Math.max(1, this.actors.length);
    const wizardX = this.round ? 110 + clamp01(progress / 0.16) * 110 : 220;
    painter.shadow(wizardX, 715, 55, 0.3);
    painter.sprite("wizard", {
      x: wizardX,
      y: 715,
      height: 300,
      animation: progress < 0.2 ? "enter" : "idle",
      time: clock,
      fps: 7,
    });
    this.actors.forEach((name, index) => {
      const position = positions[index];
      const selected = this.isSelected(name);
      const frontRow = index >= 6;
      const height = frontRow ? 210 : 185;
      let animation = "idle";
      let y = position.y;
      if (this.round && progress >= 0.2 && progress < 0.65) {
        animation = index === flyingIndex ? "panic" : "hop";
        y -= Math.abs(Math.sin(clock * 5 + index)) * 12;
      }
      if (selected && progress >= 0.65) {
        animation = progress < 0.82 ? "float" : "tagged";
        y -= Math.sin(clamp01((progress - 0.65) / 0.17) * Math.PI) * 130;
        context.save();
        const beam = context.createLinearGradient(
          position.x,
          y - 220,
          position.x,
          y + 30,
        );
        beam.addColorStop(0, "#f8dc7080");
        beam.addColorStop(1, "#ffeaa700");
        context.fillStyle = beam;
        context.fillRect(position.x - 55, y - 220, 110, 260);
        context.restore();
      }
      painter.shadow(position.x, position.y, 42, 0.32);
      painter.sprite(
        `student.ct-${String((index % 10) + 1).padStart(2, "0")}`,
        { x: position.x, y, height, animation, time: clock, fps: 8 },
      );
      painter.label(
        this.displayName(name),
        position.x,
        position.y + 12,
        selected && progress >= 0.82,
      );
      if (selected && progress >= 0.82)
        painter.sprite("paper", {
          x: position.x,
          y: y - height * 0.58,
          height: 80,
        });
    });
    if (this.round && progress >= 0.2 && progress < 0.82) {
      const selectedIndex = Math.max(
        0,
        this.actors.findIndex((name) => this.isSelected(name)),
      );
      const destination =
        positions[progress < 0.65 ? flyingIndex : selectedIndex];
      const travel = clamp01((progress - 0.2) / 0.1);
      const x = wizardX + (destination.x - wizardX) * travel;
      const y = 380 + (destination.y - 520) * travel + Math.sin(clock * 7) * 28;
      painter.sprite("talisman", {
        x,
        y,
        height: 95,
        animation: "fly",
        time: clock,
        fps: 14,
        rotation: Math.sin(clock * 5) * 0.22,
      });
      if (progress >= 0.65)
        painter.sprite("burst", {
          x: destination.x,
          y: destination.y - 60,
          height: 200,
          animation: "burst",
          time: clock,
          fps: 12,
          opacity: 0.75,
        });
    }
    if (progress >= 0.82)
      painter.bubble("ĐỊNH THÂN! Đến lượt con rồi!", 790, 330, 510);
  }
}
