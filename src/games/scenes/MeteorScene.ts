import manifest from "../assets/meteor.json" with { type: "json" };
import {
  AnimatedScene,
  type SceneOptions,
  type StoryCue,
} from "../shared/AnimatedScene.ts";
import { loadArtwork } from "../shared/artwork.ts";
import { clamp01 } from "../../game/geometry.ts";

const WORLD_WIDTH = 1536;
const WORLD_HEIGHT = 1024;
const SIDEWALK = { x0: 80, x1: 1460, yFar: 672, yNear: 905 };

function smoothstep(val: number): number {
  const c = clamp01(val);
  return c * c * (3 - 2 * c);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * smoothstep(t);
}

function perspectiveScale(y: number): number {
  return (
    0.62 +
    0.38 * clamp01((y - SIDEWALK.yFar) / (SIDEWALK.yNear - SIDEWALK.yFar))
  );
}

function simpleHash(str: string, seed = 0): number {
  let h = 0x811c9dc5 ^ seed;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x1000193);
  }
  return ((h >>> 0) % 100000) / 100000;
}

interface MeteorImpact {
  time: number;
  x: number;
  y: number;
  scale: number;
  fromX: number;
  fromY: number;
  label: string;
}

interface StudentStreetState {
  name: string;
  variant: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  isMale: boolean;
  role: "walking" | "sitting" | "gaming" | "stargazing" | "chatting";
  hidingSpot: "bread" | "sign" | "bench" | "pot" | null;
}

export class MeteorScene extends AnimatedScene {
  override get revealedNames(): readonly string[] {
    return this.progress >= 0.76 ? (this.round?.selectedNames ?? []) : [];
  }

  protected override getStageSize(
    width: number,
    height: number,
  ): { width: number; height: number } {
    return { width: 1600, height: (1600 * height) / width };
  }

  static async create(
    canvas: HTMLCanvasElement,
    options: SceneOptions,
  ): Promise<MeteorScene> {
    return new MeteorScene(canvas, await loadArtwork(manifest), options);
  }

  override getStatus(): string {
    if (!this.round) return "Một ngày yên bình trên con phố nhỏ…";
    if (this.progress < 0.25)
      return "Cả lớp đang dạo phố. Trên trời có gì kìa?";
    if (this.progress < 0.45)
      return "Báo động! Mưa thiên thạch đang rơi xuống phố!";
    if (this.progress < 0.68)
      return "Thiên thạch đang khóa mục tiêu điểm danh!";
    if (this.progress < 0.8) return "ĐÙNG! Thiên thạch giáng trúng hồng tâm!";
    return "Đã tìm thấy người cần lên bảng!";
  }

  protected override getSoundCues(): StoryCue[] {
    return [
      { time: this.duration * 0.25, sound: "tone:warning" },
      { time: this.duration * 0.38, sound: "tone:impact" },
      { time: this.duration * 0.48, sound: "tone:impact" },
      { time: this.duration * 0.58, sound: "tone:impact" },
      { time: this.duration * 0.68, sound: "tone:rumble" },
      { time: this.duration * 0.72, sound: "tone:rumble" },
      { time: this.duration * 0.76, sound: "tone:impact" },
      { time: this.duration * 0.85, sound: "tone:result" },
    ];
  }

  private initStudents(
    targetName: string,
    targetSpot: { x: number; y: number },
  ): StudentStreetState[] {
    const list: StudentStreetState[] = [];
    const count = this.actors.length;
    const hidingSpots: ("bread" | "sign" | "bench" | "pot")[] = [
      "bread",
      "sign",
      "bench",
      "pot",
    ];

    for (let i = 0; i < count; i++) {
      const name = this.actors[i];
      const isTarget = name === targetName;
      const gender = this.genders[name];
      const isMale =
        gender === "nam" || (gender !== "nu" && simpleHash(name, 1) > 0.45);
      const variantNum = 1 + (Math.floor(simpleHash(name, 2) * 6) % 6);
      const variant = isMale
        ? `student.male${variantNum}`
        : `student.female${variantNum}`;

      let role: StudentStreetState["role"] = "walking";
      if (i === 1) role = "gaming";
      else if (i === 2) role = "stargazing";
      else if (i === 3 || i === 4) role = "sitting";
      else if (i === 5 || i === 6) role = "chatting";

      let startX = 0;
      let startY = 0;
      let targetX = 0;
      let targetY = 0;

      if (isTarget) {
        startX = targetSpot.x;
        startY = targetSpot.y;
        targetX = targetSpot.x;
        targetY = targetSpot.y;
      } else {
        const u = count > 1 ? i / (count - 1) : 0.5;
        startX = SIDEWALK.x0 + u * (SIDEWALK.x1 - SIDEWALK.x0);
        startY =
          SIDEWALK.yFar +
          30 +
          simpleHash(name, 5) * (SIDEWALK.yNear - SIDEWALK.yFar - 60);

        // Assign a hiding spot for when siren goes off
        const spot = hidingSpots[i % hidingSpots.length];
        if (spot === "bread") {
          targetX = 712 + (simpleHash(name, 8) - 0.5) * 60;
          targetY = 660;
        } else if (spot === "sign") {
          targetX = 336 + (simpleHash(name, 8) - 0.5) * 50;
          targetY = 680;
        } else if (spot === "bench") {
          targetX = 1380 + (simpleHash(name, 8) - 0.5) * 80;
          targetY = 660;
        } else {
          targetX = 902 + (simpleHash(name, 8) - 0.5) * 50;
          targetY = 665;
        }
      }

      list.push({
        name,
        variant,
        x: startX,
        y: startY,
        targetX,
        targetY,
        isMale,
        role,
        hidingSpot: isTarget ? null : hidingSpots[i % hidingSpots.length],
      });
    }

    return list;
  }

  protected override draw(): void {
    const { painter, context } = this;
    const progress = this.round ? this.progress : 0;
    const clock = this.round ? this.time : this.ambientTime;

    // Viewport scaling
    const bg = this.artwork.get("background");
    if (!bg) throw new Error("Missing street background");
    const bgScale = Math.max(
      this.stageWidth / bg.image.width,
      this.stageHeight / bg.image.height,
    );
    const bgW = bg.image.width * bgScale;
    const bgH = bg.image.height * bgScale;

    const worldScale = Math.min(
      this.stageWidth / WORLD_WIDTH,
      this.stageHeight / WORLD_HEIGHT,
    );
    const worldOffsetX = (this.stageWidth - WORLD_WIDTH * worldScale) / 2;
    const worldOffsetY = this.stageHeight - WORLD_HEIGHT * worldScale;

    const wx = (x: number) => worldOffsetX + x * worldScale;
    const wy = (y: number) => worldOffsetY + y * worldScale;
    const ws = (val: number) => val * worldScale;

    // Dynamic Camera Shake on Impacts
    let shakeX = 0;
    let shakeY = 0;
    if (progress >= 0.76 && progress < 0.95) {
      const dt = progress - 0.76;
      const decay = Math.exp(-dt * 12);
      shakeX = Math.sin(clock * 60) * ws(24) * decay;
      shakeY = Math.cos(clock * 50) * ws(18) * decay;
    } else if (
      (progress >= 0.38 && progress < 0.44) ||
      (progress >= 0.48 && progress < 0.54) ||
      (progress >= 0.58 && progress < 0.64)
    ) {
      const subDt = progress % 0.1;
      const decay = Math.exp(-subDt * 18);
      shakeX = Math.sin(clock * 50) * ws(8) * decay;
      shakeY = Math.cos(clock * 45) * ws(6) * decay;
    }

    context.save();
    context.translate(shakeX, shakeY);

    // 1. Sky Rendering with Dynamic Atmosphere
    this.renderDynamicSky(progress, clock);

    // 2. Street Background
    painter.image(
      "background",
      (this.stageWidth - bgW) / 2,
      (this.stageHeight - bgH) / 2,
      bgW,
      bgH,
    );

    // 3. Floating Sun with Glow
    if (progress < 0.68) {
      const sunAlpha = 1 - clamp01((progress - 0.25) / 0.4);
      const sunX = wx(1320);
      const sunY = wy(240);
      const sunR = ws(140);
      context.save();
      context.globalCompositeOperation = "lighter";
      const sunGlow = context.createRadialGradient(
        sunX,
        sunY,
        0,
        sunX,
        sunY,
        sunR,
      );
      sunGlow.addColorStop(0, `rgba(255, 244, 214, ${0.9 * sunAlpha})`);
      sunGlow.addColorStop(0.2, `rgba(255, 228, 160, ${0.7 * sunAlpha})`);
      sunGlow.addColorStop(1, "rgba(255, 190, 110, 0)");
      context.fillStyle = sunGlow;
      context.beginPath();
      context.arc(sunX, sunY, sunR, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }

    // 4. Clouds Drifting Across Sky
    for (let c = 0; c < 5; c++) {
      const cSpeed = 10 + c * 4;
      const cWidth = WORLD_WIDTH + 600;
      const cRawX =
        ((((c * 350 - clock * cSpeed) % cWidth) + cWidth) % cWidth) - 300;
      const cX = wx(cRawX);
      const cY = wy(120 + (c % 3) * 60);
      const cHeight = ws(110 + (c % 2) * 40);
      painter.sprite("clouds", {
        x: cX,
        y: cY,
        height: cHeight,
        frame: c % 3,
        opacity: 0.65,
      });
    }

    // Targets and Near-Miss Impact Points
    const targetName =
      this.round?.selectedNames[0] ?? this.actors[0] ?? "Học sinh";
    const targetSpot = { x: 768, y: 740 };
    const students = this.initStudents(targetName, targetSpot);

    const nearMisses: MeteorImpact[] = [
      {
        time: 0.38,
        x: 420,
        y: 690,
        scale: 0.8,
        fromX: 180,
        fromY: -200,
        label: "RẦM!",
      },
      {
        time: 0.48,
        x: 1080,
        y: 680,
        scale: 0.85,
        fromX: 1300,
        fromY: -220,
        label: "VÈO!",
      },
      {
        time: 0.58,
        x: targetSpot.x - 140,
        y: targetSpot.y - 30,
        scale: 0.9,
        fromX: 600,
        fromY: -240,
        label: "SUÝT!",
      },
    ];

    // Floating Comic texts & speech dialog
    interface ComicText {
      text: string;
      x: number;
      y: number;
      scale: number;
      color?: string;
    }
    const comicTexts: ComicText[] = [];

    interface SpeechBubble {
      text: string;
      x: number;
      y: number;
    }
    let speechBubble: SpeechBubble | null = null;

    // 5. Ground Scorch Marks & Craters from Near-Misses
    for (const miss of nearMisses) {
      if (progress >= miss.time) {
        this.renderGroundCrater(wx(miss.x), wy(miss.y), ws(miss.scale * 120));
      }
    }

    // Target Ground Crater after Big Impact
    if (progress >= 0.76) {
      this.renderGroundCrater(
        wx(targetSpot.x),
        wy(targetSpot.y),
        ws(220),
        true,
      );
    }

    // 6. Target Student Red Warning Ring (bongDo) before impact
    if (progress >= 0.65 && progress < 0.76) {
      const ringP = (progress - 0.65) / 0.11;
      const ringRadius = ws((60 + 70 * ringP) * 1.15);
      const ringX = wx(targetSpot.x);
      const ringY = wy(targetSpot.y);
      context.save();
      context.translate(ringX, ringY);
      context.scale(1, 0.36);

      const radGlow = context.createRadialGradient(0, 0, 0, 0, 0, ringRadius);
      radGlow.addColorStop(0, "rgba(185, 28, 28, 0.8)");
      radGlow.addColorStop(0.65, "rgba(220, 38, 38, 0.55)");
      radGlow.addColorStop(1, "rgba(220, 38, 38, 0)");
      context.fillStyle = radGlow;
      context.beginPath();
      context.arc(0, 0, ringRadius, 0, Math.PI * 2);
      context.fill();

      context.strokeStyle = "rgba(254, 226, 226, 0.95)";
      context.lineWidth = Math.max(3, ws(6));
      context.setLineDash([ws(12), ws(8)]);
      context.lineDashOffset = -clock * ws(80);
      context.beginPath();
      context.arc(0, 0, ringRadius * 0.88, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    }

    // 7. Render NPCs
    this.renderNPCs(progress, clock, wx, wy, ws);

    // 8. Render Students sorted by Y for correct depth
    students.sort((a, b) => a.y - b.y);
    for (const student of students) {
      const isTarget = student.name === targetName;
      let sx = student.x;
      let sy = student.y;
      let frame = 0;
      let flip = false;

      if (progress < 0.25) {
        // Peaceful city walking / chatting
        if (student.role === "gaming") {
          frame = 0;
          if (progress > 0.08 && progress < 0.22) {
            speechBubble = {
              text: "Khoan, đang leo rank!",
              x: wx(sx),
              y: wy(sy - 150),
            };
          }
        } else if (student.role === "stargazing") {
          frame = 5;
          if (progress > 0.16 && progress < 0.25) {
            speechBubble = {
              text: "Ơ kìa! Cái gì trên trời kìa!",
              x: wx(sx),
              y: wy(sy - 150),
            };
          }
        } else {
          frame = Math.floor(clock * 4) % 2;
          sx += Math.sin(clock * 0.8 + student.x) * 15;
        }
      } else if (progress < 0.68) {
        // Siren & Near-miss barrage: scrambling to hiding spots
        const p = clamp01((progress - 0.25) / 0.15);
        sx = lerp(student.x, student.targetX, p);
        sy = lerp(student.y, student.targetY, p);
        frame = 3 + (Math.floor(clock * 8) % 2); // running

        if (progress >= 0.38 && student.hidingSpot) {
          frame = 7; // crouching / hiding
        }
        if (isTarget && progress >= 0.58) {
          frame = 5; // looking back in disbelief
          speechBubble = {
            text: "Hụt rồi, lêu lêu! Ơ... còn viên nữa kìa!",
            x: wx(sx),
            y: wy(sy - 150),
          };
        }
      } else if (progress < 0.76) {
        // Giant meteor targeting
        if (isTarget) {
          sx = targetSpot.x;
          sy = targetSpot.y;
          frame = 10; // terrified shiver
          speechBubble = {
            text: "Con hứa về học bài mà! Đừng mà!",
            x: wx(sx),
            y: wy(sy - 150),
          };
        } else {
          sx = student.targetX;
          sy = student.targetY;
          frame = 7; // hiding/praying
        }
      } else {
        // Post-impact result!
        if (isTarget) {
          sx = targetSpot.x;
          sy = targetSpot.y;
          frame = 9; // soot-covered face!
          if (progress >= 0.8) {
            speechBubble = {
              text: "Ơ… điểm danh thôi mà!",
              x: wx(sx),
              y: wy(sy - 160),
            };
          }
        } else {
          sx = student.targetX + (student.targetX < targetSpot.x ? -20 : 20);
          sy = student.targetY;
          frame = 11; // coughing/dusting off
        }
      }

      const pScale = perspectiveScale(sy);
      const pHeight = ws(150 * pScale);
      const screenX = wx(sx);
      const screenY = wy(sy);

      painter.shadow(screenX, screenY, ws(36 * pScale));
      painter.sprite(student.variant, {
        x: screenX,
        y: screenY,
        height: pHeight,
        frame,
        flipX: flip,
      });

      // Name tags: show on all students before impact, show highlighted on target after impact
      if (progress < 0.76 || isTarget) {
        painter.label(
          this.displayName(student.name),
          screenX,
          screenY - pHeight - ws(12),
          isTarget && progress >= 0.76,
        );
      }
    }

    // 9. Falling Near-Miss Meteors
    for (const miss of nearMisses) {
      const startTime = miss.time - 0.08;
      if (progress >= startTime && progress < miss.time) {
        const p = (progress - startTime) / 0.08;
        const curX = lerp(miss.fromX, miss.x, p);
        const curY = lerp(miss.fromY, miss.y, p * p);
        const meteorSize = ws(140 * miss.scale);

        // Fire streak
        context.save();
        context.strokeStyle = "rgba(251, 146, 60, 0.7)";
        context.lineWidth = ws(18);
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(wx(miss.fromX), wy(miss.fromY));
        context.lineTo(wx(curX), wy(curY));
        context.stroke();
        context.restore();

        painter.sprite("meteor", {
          x: wx(curX),
          y: wy(curY),
          height: meteorSize,
          frame: 3 + (Math.floor(clock * 12) % 3),
          rotation: -0.5,
        });
      }

      // Explosion Shockwave & Mushroom for near-miss
      if (progress >= miss.time && progress < miss.time + 0.08) {
        const ep = (progress - miss.time) / 0.08;
        const impactSize = ws(180 * miss.scale * (1 + ep * 0.4));
        painter.sprite("impact", {
          x: wx(miss.x),
          y: wy(miss.y),
          height: impactSize,
          frame: Math.min(11, Math.floor(ep * 11)),
          opacity: 1 - ep * 0.5,
        });
        comicTexts.push({
          text: miss.label,
          x: wx(miss.x),
          y: wy(miss.y - 120),
          scale: 1.2,
          color: "#f97316",
        });
      }
    }

    // 10. Giant Meteor Falling onto Target
    if (progress >= 0.68 && progress < 0.76) {
      const p = (progress - 0.68) / 0.08;
      const startX = targetSpot.x + 360;
      const startY = -300;
      const curX = lerp(startX, targetSpot.x, p);
      const curY = lerp(startY, targetSpot.y, p * p);
      const giantSize = ws(260 + p * 80);

      // Massive blazing streak
      context.save();
      context.strokeStyle = "rgba(239, 68, 68, 0.75)";
      context.lineWidth = ws(50);
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(wx(startX), wy(startY));
      context.lineTo(wx(curX), wy(curY));
      context.stroke();
      context.restore();

      painter.sprite("meteorAlt", {
        x: wx(curX),
        y: wy(curY),
        height: giantSize,
        frame: 3 + (Math.floor(clock * 12) % 3),
        rotation: -0.6,
      });
    }

    // 11. Giant Impact Explosion! (ĐÙNG!)
    if (progress >= 0.76 && progress < 0.92) {
      const ep = (progress - 0.76) / 0.16;
      const giantImpactSize = ws(360 + ep * 120);

      painter.sprite("impactAlt", {
        x: wx(targetSpot.x),
        y: wy(targetSpot.y + 15),
        height: giantImpactSize,
        frame: Math.min(11, Math.floor(ep * 11)),
        opacity: 1 - ep * 0.45,
      });

      comicTexts.push({
        text: "ĐÙNG!",
        x: wx(targetSpot.x),
        y: wy(targetSpot.y - 200),
        scale: 1.8,
        color: "#dc2626",
      });
    }

    // 12. Screen Flash on Direct Impact
    if (progress >= 0.76 && progress < 0.8) {
      const flashAlpha = 1 - (progress - 0.76) / 0.04;
      context.save();
      context.fillStyle = `rgba(255, 244, 214, ${0.85 * flashAlpha})`;
      context.fillRect(0, 0, this.stageWidth, this.stageHeight);
      context.restore();
    }

    // 13. Comic Texts
    for (const c of comicTexts) {
      this.drawComicText(c.text, c.x, c.y, c.scale, c.color);
    }

    // 14. Speech Bubble
    if (speechBubble) {
      painter.bubble(
        speechBubble.text,
        Math.max(180, Math.min(this.stageWidth - 180, speechBubble.x)),
        speechBubble.y,
        380,
      );
    }

    context.restore();
  }

  private renderDynamicSky(progress: number, clock: number): void {
    const { context } = this;
    const skyHeight = this.stageHeight * 0.75;
    const sky = context.createLinearGradient(0, 0, 0, skyHeight);

    if (progress < 0.25) {
      // Daylight
      sky.addColorStop(0, "#4f9fe0");
      sky.addColorStop(0.55, "#a5d3f2");
      sky.addColorStop(1, "#ffe6b0");
    } else if (progress < 0.68) {
      // Sunset warning siren
      const p = (progress - 0.25) / 0.43;
      sky.addColorStop(0, lerpColor("#4f9fe0", "#9a3412", p));
      sky.addColorStop(0.55, lerpColor("#a5d3f2", "#f97316", p));
      sky.addColorStop(1, lerpColor("#ffe6b0", "#fed7aa", p));
    } else if (progress < 0.78) {
      // Dark fiery red apocalypse
      sky.addColorStop(0, "#1c0a0c");
      sky.addColorStop(0.55, "#7f1d1d");
      sky.addColorStop(1, "#f97316");
    } else {
      // Smoky dusty haze
      sky.addColorStop(0, "#292524");
      sky.addColorStop(0.55, "#78716c");
      sky.addColorStop(1, "#d97706");
    }

    context.fillStyle = sky;
    context.fillRect(0, 0, this.stageWidth, this.stageHeight);

    // Falling burning embers during meteor shower
    if (progress >= 0.25 && progress < 0.76) {
      context.save();
      context.fillStyle = "rgba(253, 186, 116, 0.75)";
      for (let i = 0; i < 15; i++) {
        const ex = (clock * (40 + i * 10) + i * 120) % this.stageWidth;
        const ey = (clock * (80 + i * 15) + i * 70) % skyHeight;
        context.beginPath();
        context.arc(ex, ey, 2.5 + (i % 3), 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
    }
  }

  private renderGroundCrater(
    x: number,
    y: number,
    radius: number,
    isMolten = false,
  ): void {
    const { context } = this;
    context.save();
    context.translate(x, y);
    context.scale(1, 0.36);

    const crater = context.createRadialGradient(
      0,
      0,
      radius * 0.1,
      0,
      0,
      radius,
    );
    crater.addColorStop(0, isMolten ? "#f97316" : "#26150b");
    crater.addColorStop(0.55, isMolten ? "#7f1d1d" : "#451a03");
    crater.addColorStop(1, "rgba(69, 26, 3, 0)");

    context.fillStyle = crater;
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  private renderNPCs(
    progress: number,
    clock: number,
    wx: (x: number) => number,
    wy: (y: number) => number,
    ws: (v: number) => number,
  ): void {
    const { painter } = this;

    // Motorbike taxi (xeOm) at (232, 700)
    let xeOmX = 232;
    let xeOmFrame = 0;
    let xeOmFlip = false;
    if (progress >= 0.25) {
      const dt = progress - 0.25;
      xeOmX = 232 - dt * 1400; // zooms off to the left!
      xeOmFrame = 4 + (Math.floor(clock * 12) % 4);
      xeOmFlip = true;
    }
    if (xeOmX > -100) {
      painter.sprite("npc-xeom", {
        x: wx(xeOmX),
        y: wy(700),
        height: ws(152),
        frame: xeOmFrame,
        flipX: xeOmFlip,
      });
    }

    // Bread vendor (banhMi) at (712, 664)
    let banhMiX = 712;
    let banhMiFrame = 0;
    if (progress >= 0.25) {
      const dt = progress - 0.25;
      banhMiX = 712 + dt * 1200; // pushes cart to the right!
      banhMiFrame = 2 + (Math.floor(clock * 8) % 4);
    }
    if (banhMiX < WORLD_WIDTH + 100) {
      painter.sprite("npc-banhmi", {
        x: wx(banhMiX),
        y: wy(664),
        height: ws(160),
        frame: banhMiFrame,
      });
    }

    // Ice cream vendor (kem) at (1252, 680)
    let kemX = 1252;
    let kemFrame = 0;
    if (progress >= 0.25) {
      const dt = progress - 0.25;
      kemX = 1252 + dt * 1100;
      kemFrame = 2 + (Math.floor(clock * 8) % 4);
    }
    if (kemX < WORLD_WIDTH + 100) {
      painter.sprite("npc-kem", {
        x: wx(kemX),
        y: wy(680),
        height: ws(160),
        frame: kemFrame,
      });
    }
  }

  private drawComicText(
    text: string,
    x: number,
    y: number,
    scale: number,
    color = "#f97316",
  ): void {
    const ctx = this.context;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.font = '900 36px "Baloo 2", system-ui, sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = 7;
    ctx.strokeStyle = "#ffffff";
    ctx.strokeText(text, 0, 0);
    ctx.fillStyle = color;
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }
}

function lerpColor(c1: string, c2: string, t: number): string {
  const parse = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = parse(c1);
  const [r2, g2, b2] = parse(c2);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${b})`;
}
