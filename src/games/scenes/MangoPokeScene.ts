import manifest from "../assets/mango-poke.json" with { type: "json" };
import {
  AnimatedScene,
  type SceneOptions,
  type StoryCue,
} from "../shared/AnimatedScene.ts";
import { loadArtwork } from "../shared/artwork.ts";
import { clamp01 } from "../../game/geometry.ts";

const WORLD_WIDTH = 1536;
const WORLD_HEIGHT = 1024;
const GROUND_Y = 905;
const TREE_BASE_X = 740;
const SALT_PLATE_X = 560;
const SALT_PLATE_Y = 912;
const TY_HEIGHT = 215;
const BEO_HEIGHT = 290;
const MIT_HEIGHT = 225;
const MANGO_HEIGHT = 66;
const U_POKE = 1 / Math.tan((70 * Math.PI) / 180);

const MANGO_FRAMES: Record<string, number> = {
  vui: 0,
  ngu: 1,
  lo: 2,
  so: 3,
  ratSo: 4,
  phao: 5,
  hoang: 6,
  roi: 7,
  choang: 8,
  ngai: 9,
  treu: 10,
  cuoi: 11,
};

function smoothstep(val: number): number {
  const c = clamp01(val);
  return c * c * (3 - 2 * c);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * smoothstep(t);
}

function simpleHash(str: string, seed = 0): number {
  let h = 0x811c9dc5 ^ seed;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x1000193);
  }
  return ((h >>> 0) % 100000) / 100000;
}

interface TreeMango {
  name: string;
  x: number;
  y: number;
  phase: number;
  idleExpression: string;
}

export class MangoPokeScene extends AnimatedScene {
  protected override get actorLimit(): number {
    return 3;
  }

  override get revealedNames(): readonly string[] {
    return this.progress >= 0.58 ? (this.round?.selectedNames ?? []) : [];
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
  ): Promise<MangoPokeScene> {
    return new MangoPokeScene(canvas, await loadArtwork(manifest), options);
  }

  override getStatus(): string {
    if (!this.round) return "Ra vườn thôi! Xoài chín đang đợi cả lớp.";
    if (this.progress < 0.18)
      return "Đĩa muối tôm Tây Ninh đã sẵn sàng, chuẩn bị hái xoài…";
    if (this.progress < 0.28)
      return "Tý đang ngắm quả ngon nhất… quả này chắc ngọt nè!";
    if (this.progress < 0.38)
      return "Á! Kiến cắn ngứa quá! Tý phải thả sào gãi lưng…";
    if (this.progress < 0.46)
      return "Tý nhón chân ráng chọc quả trên cao… mà hụt rồi!";
    if (this.progress < 0.56)
      return "Anh Bèo ra tay! Xoài né võ Lăng Ba Vi Bộ!";
    if (this.progress < 0.75)
      return "CHỌC trúng rồi! Xoài rụng ngay đĩa muối tôm Tây Ninh!";
    return "Xoài chấm muối đã chọn được người lên bảng!";
  }

  protected override getSoundCues(): StoryCue[] {
    return [
      { time: this.duration * 0.04, sound: "/games/mango-poke/am/muoi.mp3" },
      { time: this.duration * 0.16, sound: "/games/mango-poke/am/vut.mp3" },
      { time: this.duration * 0.22, sound: "/games/mango-poke/am/buoc.mp3" },
      { time: this.duration * 0.26, sound: "/games/mango-poke/am/choc.mp3" },
      { time: this.duration * 0.29, sound: "/games/mango-poke/am/kiem.mp3" },
      { time: this.duration * 0.31, sound: "/games/mango-poke/am/la.mp3" },
      { time: this.duration * 0.42, sound: "/games/mango-poke/am/buoc.mp3" },
      { time: this.duration * 0.44, sound: "/games/mango-poke/am/vut.mp3" },
      { time: this.duration * 0.47, sound: "/games/mango-poke/am/buoc.mp3" },
      { time: this.duration * 0.5, sound: "/games/mango-poke/am/vut.mp3" },
      { time: this.duration * 0.53, sound: "/games/mango-poke/am/vut.mp3" },
      { time: this.duration * 0.56, sound: "/games/mango-poke/am/choc.mp3" },
      { time: this.duration * 0.57, sound: "/games/mango-poke/am/gay.mp3" },
      { time: this.duration * 0.58, sound: "/games/mango-poke/am/bich.mp3" },
      { time: this.duration * 0.66, sound: "/games/mango-poke/am/bop.mp3" },
      { time: this.duration * 0.72, sound: "/games/mango-poke/am/cuoi.mp3" },
      { time: this.duration * 0.82, sound: "/games/mango-poke/am/chieng.mp3" },
    ];
  }

  private generateCanopyFruits(
    names: readonly string[],
    targetName: string,
  ): TreeMango[] {
    const totalCount = Math.max(16, names.length);
    const yTop = 220;
    const yBottom = 460;
    const fruits: TreeMango[] = [];
    const idleChoices = ["vui", "ngu", "treu", "cuoi", "vui"];

    for (let i = 0; i < totalCount; i++) {
      const name = i < names.length ? names[i] : `Xoài non ${i + 1}`;
      const isTarget = name === targetName;
      let x = 0;
      let y = 0;

      if (isTarget) {
        x = 940;
        y = 310;
      } else if (i === 1) {
        x = 580;
        y = 340; // Decoy 1 (Left candidate A)
      } else if (i === 2) {
        x = 780;
        y = 250; // Decoy 2 (High candidate B)
      } else if (i === 3) {
        x = 1080;
        y = 360; // Decoy 3 (Right candidate C)
      } else {
        const u = i / totalCount;
        const arch = Math.sin(u * Math.PI);
        const spreadX = 400 + u * 740;
        const spreadY = yBottom - arch * (yBottom - yTop);
        const jitterX = (simpleHash(name, 7) - 0.5) * 50;
        const jitterY = (simpleHash(name, 9) - 0.5) * 40;
        x = spreadX + jitterX;
        y = spreadY + jitterY;
      }

      fruits.push({
        name,
        x,
        y,
        phase: simpleHash(name, 3) * Math.PI * 2,
        idleExpression:
          idleChoices[
            Math.floor(simpleHash(name, 5) * idleChoices.length) %
              idleChoices.length
          ],
      });
    }

    return fruits;
  }

  protected override draw(): void {
    const { painter } = this;
    const progress = this.round ? this.progress : 0;
    const clock = this.round ? this.time : this.ambientTime;

    // 1. Dynamic Camera: Starts close on salt plate, then smoothly zooms out to wide orchard
    const stageW = this.stageWidth;
    const stageH = this.stageHeight;
    const v = Math.max(stageW / WORLD_WIDTH, stageH / WORLD_HEIGHT);

    const wideCam = { cx: WORLD_WIDTH / 2, cy: 545, z: 1.0 };
    const saltCam = { cx: SALT_PLATE_X + 30, cy: 800, z: 1.85 };

    let cam = wideCam;
    if (this.round) {
      if (progress < 0.12) {
        cam = saltCam;
      } else if (progress < 0.18) {
        const p = (progress - 0.12) / 0.06;
        const ease = p * p * (3 - 2 * p);
        cam = {
          cx: lerp(saltCam.cx, wideCam.cx, ease),
          cy: lerp(saltCam.cy, wideCam.cy, ease),
          z: lerp(saltCam.z, wideCam.z, ease),
        };
      }
    }

    const M = Math.max(v, Math.min(stageW / 1336, stageH / 865)) * cam.z;
    const T = Math.max(
      0,
      Math.min(WORLD_WIDTH - stageW / M, cam.cx - stageW / M / 2),
    );
    const k = Math.max(
      0,
      Math.min(WORLD_HEIGHT - stageH / M, cam.cy - stageH / M / 2),
    );

    // Screen coordinate projection based on camera
    const sx = (x: number) => (x - T) * M;
    const sy = (y: number) => (y - k) * M;
    const ss = (val: number) => val * M;

    // 2. Draw Background covering full viewport without black bars
    painter.image(
      "background",
      -T * M,
      -k * M,
      WORLD_WIDTH * M,
      WORLD_HEIGHT * M,
    );

    // Characters & names
    const targetName =
      this.round?.selectedNames[0] ?? this.actors[0] ?? "Học sinh";
    const secondTarget = this.round?.selectedNames[1];
    const candidateRoster =
      this.round?.participants && this.round.participants.length > 0
        ? this.round.participants
        : this.actors;
    const canopyFruits = this.generateCanopyFruits(candidateRoster, targetName);
    const targetFruit =
      canopyFruits.find((f) => f.name === targetName) ?? canopyFruits[0];
    const decoyFruitA = canopyFruits[1] ?? canopyFruits[0];
    const decoyFruitB = canopyFruits[2] ?? canopyFruits[0];

    // 3. Shrimp Salt Paper Sheet at (SALT_PLATE_X, SALT_PLATE_Y)
    const plateX = sx(SALT_PLATE_X);
    const plateY = sy(SALT_PLATE_Y);
    const plateSize = ss(190);

    // Salt spreading animation during opening moDau
    if (progress < 0.04) {
      painter.sprite("props", {
        x: plateX,
        y: plateY,
        height: plateSize,
        frame: 2, // Blank white paper sheet
      });
    } else if (progress < 0.12) {
      const alpha = clamp01((progress - 0.04) / 0.06);
      painter.sprite("props", {
        x: plateX,
        y: plateY,
        height: plateSize,
        frame: 2,
      });
      painter.sprite("props", {
        x: plateX,
        y: plateY,
        height: plateSize,
        frame: 3,
        opacity: alpha,
      });
    } else {
      painter.sprite("props", {
        x: plateX,
        y: plateY,
        height: plateSize,
        frame: 3,
      });
    }

    // 4. Characters Positions and State Machine
    let tyX = sx(660);
    let tyY = sy(GROUND_Y);
    let tySprite = "shortChild";
    let tyFrame = Math.floor(clock * 2) % 2;
    let tyFlip = false;

    let beoX = sx(WORLD_WIDTH + 140);
    let beoY = sy(GROUND_Y);
    let beoSprite = "tallChild";
    let beoFrame = 0;
    let beoFlip = false;
    let beoActive = false;

    // Pole tracking
    let poleActive = false;
    let poleFromX = 0;
    let poleFromY = 0;
    let poleToX = 0;
    let poleToY = 0;
    let poleOffset = 40;

    // Mango Dodge & Physics
    let targetDodgeX = 0;
    let targetDodgeY = 0;
    let targetRotation = 0.06 * Math.sin(1.3 * clock + targetFruit.phase);
    let targetExpression = targetFruit.idleExpression;
    let targetFallen = false;
    let targetCurX = sx(targetFruit.x);
    let targetCurY = sy(targetFruit.y);

    // Track which fruits are in danger (isDangerous -> red pulsing tag)
    const dangerousFruits = new Set<string>();

    // Comic text and speech bubbles
    interface ComicBubble {
      text: string;
      x: number;
      y: number;
      scale: number;
      color?: string;
    }
    const comicTexts: ComicBubble[] = [];

    interface SpeechBubble {
      speaker: "ty" | "beo" | "mit";
      text: string;
    }
    let activeSpeech: SpeechBubble | null = null;

    // Sequence Simulation
    if (progress < 0.18) {
      // Opening moDau: Tý brings salt, pours salt, Mít speaks, camera zooms out
      poleActive = false; // NEVER active during moDau!
      tySprite = "shortChild";
      if (progress < 0.04) {
        const p = progress / 0.04;
        tyX = sx(lerp(200, SALT_PLATE_X - 60, p));
        tyFrame = Math.floor(clock * 5) % 2;
      } else if (progress < 0.12) {
        tyX = sx(SALT_PLATE_X - 60);
        tyFrame = 2 + (Math.floor(clock * 3) % 2); // pouring salt
      } else {
        const p = (progress - 0.12) / 0.06;
        tyX = sx(lerp(SALT_PLATE_X - 60, TREE_BASE_X - 80, p));
        tyFrame = 4; // stands looking up at tree
      }

      if (progress < 0.09) {
        activeSpeech = {
          speaker: "ty",
          text: "Muối tôm Tây Ninh chính hiệu nè!",
        };
      } else {
        activeSpeech = { speaker: "mit", text: "Giờ chỉ thiếu xoài thôi…" };
      }
    } else if (progress < 0.28) {
      // Suspense 1: Tý sweeps canopy, hovers under Decoy A
      const p = (progress - 0.18) / 0.1;
      tySprite = "shortChildAlt";
      poleActive = true;
      poleOffset = 40;

      if (p < 0.4) {
        tyX = sx(lerp(TREE_BASE_X - 80, decoyFruitA.x - 70, p / 0.4));
        tyFrame = Math.floor(clock * 4) % 2;
        poleFromX = tyX + ss(10);
        poleFromY = tyY - ss(TY_HEIGHT * 0.45);
        poleToX = sx(decoyFruitA.x - 60);
        poleToY = sy(decoyFruitA.y + 80);
        activeSpeech = { speaker: "ty", text: "Quả nào ngon nhất ta?" };
      } else {
        tyX = sx(decoyFruitA.x - 70);
        tyFrame = 2 + (Math.floor(clock * 6) % 2);
        const pokeJitter = Math.sin((p - 0.4) * Math.PI * 6) * ss(18);
        poleFromX = tyX + ss(10);
        poleFromY = tyY - ss(TY_HEIGHT * 0.45);
        poleToX = sx(decoyFruitA.x) - pokeJitter * U_POKE;
        poleToY = sy(decoyFruitA.y + 20) - pokeJitter;
        decoyFruitA.idleExpression = "ratSo";
        dangerousFruits.add(decoyFruitA.name);
        activeSpeech = { speaker: "ty", text: "Quả này chắc ngọt nè!" };
      }
    } else if (progress < 0.38) {
      // Suspense 2: Ants attack! Tý drops pole, shivers, scratches
      const p = (progress - 0.28) / 0.1;
      tyX = sx(decoyFruitA.x - 70) + Math.sin(clock * 16) * ss(6);
      tySprite = "shortChildAlt";
      decoyFruitA.idleExpression = "phao";

      // Pole is on the ground!
      poleActive = true;
      poleOffset = 0;
      poleFromX = sx(TREE_BASE_X - 100);
      poleFromY = sy(GROUND_Y);
      poleToX = sx(TREE_BASE_X + 260);
      poleToY = sy(GROUND_Y);

      if (p < 0.3) {
        tyFrame = 6; // Ant shock
        comicTexts.push({
          text: "CHÍCH!",
          x: tyX + ss(50),
          y: tyY - ss(100),
          scale: 1.25,
          color: "#ef4444",
        });
        activeSpeech = { speaker: "ty", text: "Á! Kiến cắn!!" };
      } else {
        tyFrame = 7 + (Math.floor(clock * 5) % 2); // Scratching
        if (p < 0.65) {
          activeSpeech = { speaker: "ty", text: "Ui da… ngứa quá!" };
        } else {
          activeSpeech = { speaker: "mit", text: "Hi hi, đáng đời!" };
        }
      }
    } else if (progress < 0.46) {
      // Suspense 3: Lost track, aims Decoy B on high branch, misses
      const p = (progress - 0.38) / 0.08;
      tySprite = "shortChildAlt";
      poleActive = true;
      poleOffset = 40;

      if (p < 0.3) {
        tyX = sx(lerp(decoyFruitA.x - 70, decoyFruitB.x - 60, p / 0.3));
        tyFrame = 9; // Scratching head
        poleFromX = tyX + ss(10);
        poleFromY = tyY - ss(TY_HEIGHT * 0.45);
        poleToX = sx(decoyFruitB.x - 40);
        poleToY = sy(decoyFruitB.y + 120);
        activeSpeech = { speaker: "ty", text: "Ủa… nãy chọc quả nào ta?" };
      } else if (p < 0.7) {
        tyX = sx(decoyFruitB.x - 60);
        tyFrame = 4 + (Math.floor(clock * 6) % 2); // Stretching on tiptoes
        poleFromX = tyX + ss(10);
        poleFromY = tyY - ss(TY_HEIGHT * 0.55);
        poleToX = sx(decoyFruitB.x - 20);
        poleToY = sy(decoyFruitB.y + 70); // Just below fruit, misses!
        decoyFruitB.idleExpression = "ratSo";
        dangerousFruits.add(decoyFruitB.name);
        activeSpeech = { speaker: "ty", text: "Ráng… ráng chút nữa…" };
      } else {
        tyX = sx(decoyFruitB.x - 60);
        tyFrame = 3;
        poleFromX = tyX + ss(10);
        poleFromY = tyY - ss(TY_HEIGHT * 0.45);
        poleToX = sx(decoyFruitB.x - 30);
        poleToY = sy(decoyFruitB.y + 110);
        decoyFruitB.idleExpression = "treu"; // Laughs
        activeSpeech = { speaker: "ty", text: "Không tới!!" };
      }
    } else if (progress < 0.56) {
      // Suspense 4: Bèo steps in, takes pole, Target Mango dodges
      const p = (progress - 0.46) / 0.1;
      beoActive = true;
      beoSprite = "tallChild";
      tySprite = "shortChild";
      tyX = sx(decoyFruitB.x - 140);
      tyFrame = 11; // Watching
      poleActive = true;
      poleOffset = 40;

      if (p < 0.25) {
        beoX = sx(lerp(WORLD_WIDTH + 80, targetFruit.x - 90, p / 0.25));
        beoFrame = Math.floor(clock * 5) % 2;
        poleFromX = beoX - ss(15);
        poleFromY = beoY - ss(BEO_HEIGHT * 0.45);
        poleToX = sx(targetFruit.x - 50);
        poleToY = sy(targetFruit.y + 120);
        activeSpeech = { speaker: "beo", text: "Đưa đây, để anh!" };
      } else {
        beoX = sx(targetFruit.x - 90);
        beoFrame = 1 + (Math.floor(clock * 5) % 2);

        if (p < 0.65) {
          // Dodge 1: Lăng Ba Vi Bộ
          const dodgeP = (p - 0.25) / 0.4;
          targetDodgeX = Math.sin(dodgeP * Math.PI * 2) * ss(70);
          targetExpression = "treu";
          dangerousFruits.add(targetFruit.name);
          comicTexts.push({
            text: "LĂNG BA VI BỘ!",
            x: sx(targetFruit.x) + targetDodgeX,
            y: sy(targetFruit.y - 30),
            scale: 1.15,
            color: "#3b82f6",
          });
          activeSpeech = { speaker: "beo", text: "Ơ kìa, nó có võ!" };
        } else {
          // Dodge 2: 360 somersault flip
          const flipP = (p - 0.65) / 0.35;
          targetDodgeY = -Math.sin(flipP * Math.PI) * ss(55);
          targetRotation = flipP * Math.PI * 2;
          targetExpression = "choang";
          dangerousFruits.add(targetFruit.name);
          comicTexts.push({
            text: "HÂY-A!",
            x: sx(targetFruit.x),
            y: sy(targetFruit.y - 45),
            scale: 1.25,
            color: "#f59e0b",
          });
          activeSpeech = { speaker: "mit", text: "Xoài học võ Thiếu Lâm hả?!" };
        }

        poleFromX = beoX - ss(15);
        poleFromY = beoY - ss(BEO_HEIGHT * 0.48);
        poleToX = sx(targetFruit.x + targetDodgeX - 25);
        poleToY = sy(targetFruit.y + targetDodgeY + 25);
      }
    } else {
      // Progress >= 0.56: Final strike, stem snaps, mango drops into shrimp salt!
      beoActive = true;
      beoX = sx(targetFruit.x - 90);
      beoSprite = "tallChildAlt";
      beoFlip = false;

      if (progress < 0.58) {
        // Stem snapping in air
        poleActive = true;
        poleOffset = 40;
        const drop = (progress - 0.56) / 0.02;
        targetCurX = sx(targetFruit.x) + (plateX - sx(targetFruit.x)) * drop;
        targetCurY =
          sy(targetFruit.y) +
          (plateY - sy(targetFruit.y)) * drop * drop -
          Math.sin(drop * Math.PI) * ss(40);
        targetRotation = drop * Math.PI * 2;
        targetExpression = "roi";
        beoFrame = 4;
        poleFromX = beoX - ss(15);
        poleFromY = beoY - ss(BEO_HEIGHT * 0.52);
        poleToX = sx(targetFruit.x);
        poleToY = sy(targetFruit.y - 15);
        comicTexts.push({
          text: "CHỌC!",
          x: sx(targetFruit.x + 80),
          y: sy(targetFruit.y - 20),
          scale: 1.35,
          color: "#f97316",
        });
      } else {
        // Mango landed on shrimp salt plate!
        targetFallen = true;
        targetCurX = plateX;
        targetCurY = plateY - ss(20);
        targetRotation = 0;
        targetExpression = progress < 0.72 ? "choang" : "ngai";
        beoFrame = 7 + (Math.floor(clock * 4) % 3);
        tySprite = "shortChild";
        tyFrame = 10 + (Math.floor(clock * 4) % 2);
        poleActive = false; // NO POLE AFTER LANDING!

        // Salt burst effect
        if (progress < 0.65) {
          const burstAlpha = 1 - (progress - 0.58) / 0.07;
          painter.sprite("props", {
            x: plateX,
            y: plateY + ss(10),
            height: ss(190),
            frame: 9,
            opacity: burstAlpha,
          });
          comicTexts.push({
            text: "BỊCH!",
            x: plateX + ss(70),
            y: plateY - ss(110),
            scale: 1.5,
            color: "#dc2626",
          });
        }

        // Spinning dizzy stars above mango
        if (progress < 0.74) {
          painter.sprite("props", {
            x: plateX,
            y: plateY - ss(55),
            height: ss(75),
            frame: 8,
            rotation: clock * 3,
          });
        }

        activeSpeech = { speaker: "mit", text: "Chấm muối thôi!" };

        // Secondary mango bonk if 2 selected
        if (secondTarget && progress >= 0.65) {
          if (progress < 0.75) {
            comicTexts.push({
              text: "BỐP!",
              x: tyX + ss(40),
              y: tyY - ss(TY_HEIGHT),
              scale: 1.3,
              color: "#f59e0b",
            });
            activeSpeech = {
              speaker: "ty",
              text: "Úi da! Rụng trúng đầu tui!",
            };
          } else {
            activeSpeech = { speaker: "mit", text: "Hai quả luôn kìa!" };
          }
        }
      }
    }

    // 5. Draw Ants crawling during ant stage
    if (progress >= 0.28 && progress < 0.38) {
      const antP = (progress - 0.28) / 0.1;
      const antBaseX = sx(TREE_BASE_X + 40);
      const antTargetX = tyX + ss(10);
      const antTargetY = tyY - ss(80);
      for (let a = 0; a < 7; a++) {
        let ax = 0;
        let ay = 0;
        if (antP < 0.5) {
          const t = clamp01((antP - a * 0.05) / 0.4);
          ax =
            antBaseX +
            (antTargetX - antBaseX) * t +
            Math.sin(clock * 9 + a) * ss(3);
          ay = sy(GROUND_Y) + ss(5) - t * ss(80);
        } else {
          const angle = clock * 3 + a * 0.9;
          ax = antTargetX + Math.cos(angle) * ss(12);
          ay = antTargetY + Math.sin(angle) * ss(12);
        }
        this.drawAnt(ax, ay, M, Math.atan2(Math.sin(clock * 5 + a), 1));
      }
    }

    // 6. Draw Bamboo Pole
    if (poleActive && poleFromX && poleToX) {
      this.drawPole(poleFromX, poleFromY, poleToX, poleToY, M, poleOffset);
    }

    // 7. Draw Characters
    // Mít (sitting by plate)
    const mitX = plateX + ss(150);
    const mitY = plateY + ss(8);
    const mitFrame =
      progress < 0.18
        ? progress < 0.09
          ? 0
          : 1
        : progress < 0.58
          ? 2
          : 10 + (Math.floor(clock * 4) % 2);
    painter.shadow(mitX, mitY, ss(45));
    painter.sprite("girl", {
      x: mitX,
      y: mitY,
      height: ss(MIT_HEIGHT),
      frame: mitFrame,
      flipX: true,
    });

    // Tý
    painter.shadow(tyX, tyY, ss(42));
    painter.sprite(tySprite, {
      x: tyX,
      y: tyY,
      height: ss(TY_HEIGHT),
      frame: tyFrame,
      flipX: tyFlip,
    });

    // Bèo (if entered)
    if (beoActive) {
      painter.shadow(beoX, beoY, ss(55));
      painter.sprite(beoSprite, {
        x: beoX,
        y: beoY,
        height: ss(BEO_HEIGHT),
        frame: beoFrame,
        flipX: beoFlip,
      });
    }

    // 8. Draw Mangoes in Canopy & Name Tags
    for (const fruit of canopyFruits) {
      const isTarget = fruit.name === targetName;
      if (isTarget && targetFallen) continue;

      let fx = sx(fruit.x);
      let fy = sy(fruit.y);
      let fRot = 0.06 * Math.sin(1.3 * clock + fruit.phase);
      let expr = fruit.idleExpression;

      if (isTarget) {
        fx += targetDodgeX;
        fy += targetDodgeY;
        fRot = targetRotation;
        expr = targetExpression;
      }

      // Skip fruits far outside viewport
      if (fy < -ss(MANGO_HEIGHT) * 2 || fy > stageH + ss(MANGO_HEIGHT)) {
        continue;
      }

      const frameIdx = MANGO_FRAMES[expr] ?? 0;
      painter.sprite("mango", {
        x: fx,
        y: fy + ss(MANGO_HEIGHT),
        height: ss(MANGO_HEIGHT),
        frame: frameIdx,
        rotation: fRot,
      });

      // Only draw mango tags in wide view (progress >= 0.18 or lobby)
      if (progress >= 0.18 || !this.round) {
        const isDanger = dangerousFruits.has(fruit.name);
        const tagY = fy + ss(MANGO_HEIGHT) + ss(14);
        this.drawMangoTag(
          this.displayName(fruit.name),
          fx,
          tagY,
          isDanger,
          false,
          M,
        );
      }
    }

    // Fallen Target Mango on the salt plate
    if (targetFallen) {
      const frameIdx = MANGO_FRAMES[targetExpression] ?? 8;
      painter.sprite("mango", {
        x: targetCurX,
        y: targetCurY + ss(MANGO_HEIGHT * 0.9),
        height: ss(MANGO_HEIGHT * 1.2),
        frame: frameIdx,
        rotation: targetRotation,
      });

      // Winner Name Tag on shrimp salt plate
      this.drawMangoTag(
        this.displayName(targetName),
        targetCurX,
        targetCurY + ss(MANGO_HEIGHT * 1.35),
        false,
        true,
        M,
      );
    }

    // 9. Comic Text Popups
    for (const comic of comicTexts) {
      this.drawComicText(
        comic.text,
        comic.x,
        comic.y,
        comic.scale,
        comic.color,
      );
    }

    // 10. Speech Dialog Bubble
    if (activeSpeech) {
      let anchorX = tyX;
      let anchorY = tyY - ss(TY_HEIGHT) - ss(10);
      if (activeSpeech.speaker === "beo" && beoActive) {
        anchorX = beoX;
        anchorY = beoY - ss(BEO_HEIGHT) - ss(10);
      } else if (activeSpeech.speaker === "mit") {
        anchorX = mitX;
        anchorY = mitY - ss(MIT_HEIGHT) - ss(10);
      }
      painter.bubble(
        activeSpeech.text,
        Math.max(180, Math.min(this.stageWidth - 180, anchorX)),
        anchorY,
        340,
      );
    }
  }

  private drawMangoTag(
    name: string,
    x: number,
    y: number,
    isDangerous: boolean,
    isSelected: boolean,
    scale: number,
  ): void {
    const ctx = this.context;
    const fontSize = isSelected
      ? Math.max(14, 16 * scale)
      : Math.max(10, 12 * scale);
    ctx.save();
    ctx.font = `800 ${fontSize}px "Baloo 2", system-ui, sans-serif`;
    const textWidth = ctx.measureText(name).width;
    const paddingX = isSelected ? 10 * scale : 6 * scale;
    const paddingY = isSelected ? 4 * scale : 2 * scale;
    const boxW = textWidth + paddingX * 2;
    const boxH = fontSize + paddingY * 2;
    const boxX = x - boxW / 2;
    const boxY = y - boxH / 2;
    const radius = isSelected ? 8 * scale : 5 * scale;

    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, radius);

    if (isSelected) {
      ctx.fillStyle = "#b91c1c";
      ctx.shadowColor = "#7f1d1d";
      ctx.shadowOffsetY = 3 * scale;
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.strokeStyle = "#fde047";
      ctx.lineWidth = Math.max(1.5, 2.5 * scale);
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(name, x, y);
    } else if (isDangerous) {
      ctx.fillStyle = "#fff1f2";
      ctx.fill();
      ctx.strokeStyle = "#e11d48";
      ctx.lineWidth = Math.max(1, 1.8 * scale);
      ctx.stroke();

      ctx.fillStyle = "#9f1239";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(name, x, y);
    } else {
      ctx.fillStyle = "rgba(255, 253, 240, 0.93)";
      ctx.fill();
      ctx.strokeStyle = "rgba(77, 124, 15, 0.55)";
      ctx.lineWidth = Math.max(0.75, 1 * scale);
      ctx.stroke();

      ctx.fillStyle = "#1a2e05";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(name, x, y);
    }
    ctx.restore();
  }

  private drawAnt(x: number, y: number, scale: number, angle: number): void {
    const ctx = this.context;
    const n = Math.max(1.2, 2.2 * scale);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = "#7f1d1d";
    ctx.strokeStyle = "#450a0a";
    ctx.lineWidth = Math.max(0.6, 0.8 * scale);
    for (const [ox, r] of [
      [-(2 * n), 1.2 * n],
      [0, 0.8 * n],
      [1.7 * n, n],
    ]) {
      ctx.beginPath();
      ctx.ellipse(ox, 0, r, 0.8 * r, 0, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.beginPath();
    for (const t of [-n, 0, n]) {
      ctx.moveTo(t, 0);
      ctx.lineTo(t - 0.6 * n, 1.8 * n);
      ctx.moveTo(t, 0);
      ctx.lineTo(t - 0.6 * n, -1.8 * n);
    }
    ctx.stroke();
    ctx.restore();
  }

  private drawPole(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    scale: number,
    offset = 40,
  ): void {
    const ctx = this.context;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const len = Math.hypot(dx, dy);
    if (len < 5) return;
    const angle = Math.atan2(dy, dx);
    const u = 0.9 * offset * scale;
    ctx.save();
    ctx.translate(fromX, fromY);
    ctx.rotate(angle);

    const poleAsset = this.artwork.get("pole");
    if (
      poleAsset &&
      poleAsset.image.complete &&
      poleAsset.image.naturalWidth > 0
    ) {
      const h = 30 * scale;
      ctx.drawImage(poleAsset.image, -u, -h / 2, len + u, h);
    } else {
      const t = Math.max(3, 9 * scale);
      ctx.lineCap = "round";
      ctx.strokeStyle = "#6b4f1d";
      ctx.lineWidth = t + 3;
      ctx.beginPath();
      ctx.moveTo(-u, 0);
      ctx.lineTo(len - 30 * scale, 0);
      ctx.stroke();

      ctx.strokeStyle = "#b9a04a";
      ctx.lineWidth = t;
      ctx.beginPath();
      ctx.moveTo(-u, 0);
      ctx.lineTo(len - 30 * scale, 0);
      ctx.stroke();

      ctx.strokeStyle = "#6b4f1d";
      ctx.lineWidth = Math.max(1, 2 * scale);
      for (let e = -u + 40 * scale; e < len - 40 * scale; e += 70 * scale) {
        ctx.beginPath();
        ctx.moveTo(e, -t / 2);
        ctx.lineTo(e, t / 2);
        ctx.stroke();
      }

      // Wicker basket at tip
      ctx.fillStyle = "rgba(250, 224, 120, 0.85)";
      ctx.strokeStyle = "#7c5a12";
      ctx.lineWidth = Math.max(1, 2 * scale);
      ctx.beginPath();
      ctx.moveTo(len - 46 * scale, -7 * scale);
      ctx.lineTo(len - 26 * scale, -18 * scale);
      ctx.lineTo(len + 4 * scale, -20 * scale);
      ctx.lineTo(len + 4 * scale, 20 * scale);
      ctx.lineTo(len - 26 * scale, 18 * scale);
      ctx.lineTo(len - 46 * scale, 7 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
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
    ctx.font = '900 32px "Baloo 2", system-ui, sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#ffffff";
    ctx.strokeText(text, 0, 0);
    ctx.fillStyle = color;
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }
}
