import manifest from "@/games/assets/dog-chase.json" with { type: "json" };
import {
  AnimatedScene,
  type SceneOptions,
  type StoryCue,
} from "@/games/shared/AnimatedScene.ts";
import { loadArtwork } from "@/games/shared/artwork.ts";

interface ChaChaBeat {
  lech: number;
  nguoi: number;
  cho: number;
  phach: number;
  cha?: string;
}

const CHA_CHA_TEMPO = 60 / 124;
const CHA_CHA_BEATS: readonly ChaChaBeat[] = [
  { lech: 48, nguoi: 1, cho: 3, phach: 1 },
  { lech: 0, nguoi: 0, cho: 0, phach: 1 },
  { lech: -12, nguoi: 2, cho: 2, phach: 0.5, cha: "Cha" },
  { lech: -24, nguoi: 0, cho: 0, phach: 0.5, cha: "cha" },
  { lech: -36, nguoi: 2, cho: 2, phach: 1, cha: "cha!" },
  { lech: -84, nguoi: 3, cho: 1, phach: 1 },
  { lech: -36, nguoi: 0, cho: 0, phach: 1 },
  { lech: -24, nguoi: 2, cho: 2, phach: 0.5, cha: "Cha" },
  { lech: -12, nguoi: 0, cho: 0, phach: 0.5, cha: "cha" },
  { lech: 0, nguoi: 2, cho: 2, phach: 1, cha: "cha!" },
];
const CHA_CHA_TOTAL_TIME =
  CHA_CHA_BEATS.reduce((sum, b) => sum + b.phach, 0) * CHA_CHA_TEMPO;

const TREE_DIALOGS = [
  "Cây ơi cứu tui!",
  "Mẹ ơi con sợ!",
  "Tui ôm cây rồi nha!",
  "Cây là của tui!",
];
const MISS_DIALOGS = ["Ơ hụt!", "Lại hụt!", "Trơn như lươn!", "Đứng lại coi!"];
const CORNER_DIALOGS = [
  "Hết đường rồi!",
  "Ơ ngõ cụt!",
  "Lách lách lách!",
  "Quay lại mau!",
];
const PANIC_DIALOGS = [
  "Mẹ ơiii!",
  "Dép của tui!",
  "Em chưa học bài!",
  "Chạy đi chờ chi!",
  "Cứu với!",
  "Ổ bánh mì của tui!",
  "Sao lại là tui?!",
];
const CONFETTI_COLORS = [
  "#ef4444",
  "#f59e0b",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
  "#facc15",
];

interface StudentActor {
  name: string;
  shortName: string;
  character: string;
  x: number;
  y: number;
  targetY: number;
  targetX: number;
  v: number;
  targetV: number;
  direction: number;
  action: "sneak" | "scared" | "run" | "dance" | "jump" | "cling";
  frame: number;
  jumpY: number;
  jumpV: number;
  isSelected: boolean;
  scale: number;
}

interface DogActor {
  x: number;
  y: number;
  v: number;
  direction: number;
  action: "sleep" | "growl" | "bark" | "run" | "brake" | "dance" | "jump";
  frame: number;
  jumpY: number;
}

interface FlyingSlipper {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRotation: number;
  groundY: number;
  landed: boolean;
}

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  color: string;
  time: number;
}

interface DustPuff {
  x: number;
  y: number;
  radius: number;
  time: number;
}

interface DialogBubble {
  text: string;
  target: StudentActor | "dog";
  time: number;
  duration: number;
}

interface FloatingText {
  text: string;
  x: number;
  y: number;
  time: number;
  duration: number;
  size: number;
  color: string;
  isCentered?: boolean;
}

type DogPhase =
  | "cho"
  | "ngu"
  | "giaTinh"
  | "tinh"
  | "gam"
  | "sua"
  | "chay"
  | "ngui"
  | "lao"
  | "doiMat"
  | "bat"
  | "nhay"
  | "xong";

export class DogChaseScene extends AnimatedScene {
  private phase: DogPhase = "cho";
  private phaseTime = 0;
  private cameraX = 0;
  private screenShake = 0;
  private screenFlash = 0;
  private slowMo = 1;

  private students: StudentActor[] = [];
  private dog: DogActor = {
    x: 640,
    y: 880,
    v: 0,
    direction: 1,
    action: "sleep",
    frame: 0,
    jumpY: 0,
  };
  private targetStudent: StudentActor | null = null;
  private bumpStudent: StudentActor | null = null;
  private treeClimber: StudentActor | null = null;

  private slippers: FlyingSlipper[] = [];
  private confetti: ConfettiPiece[] = [];
  private dustPuffs: DustPuff[] = [];
  private dialogs: DialogBubble[] = [];
  private floatingTexts: FloatingText[] = [];

  private chickenX = 0;
  private chickenY = 0;
  private chickenTime = -1;

  private chaChaTime = 0;
  private chaChaStep = -1;
  private chaChaOffset = 0;
  private chaChaOffsetFrom = 0;
  private danceOriginX = 0;

  static async create(
    canvas: HTMLCanvasElement,
    options: SceneOptions,
  ): Promise<DogChaseScene> {
    return new DogChaseScene(canvas, await loadArtwork(manifest), options);
  }

  getStatus(): string {
    if (!this.round || this.phase === "cho")
      return "Mực đang ngủ… Cả lớp đi thật khẽ nhé!";
    if (this.phase === "ngu" || this.phase === "giaTinh")
      return "Suỵt… đừng làm Mực thức giấc!";
    if (this.phase === "tinh" || this.phase === "gam" || this.phase === "sua")
      return "Á! Mực dậy rồi!";
    if (this.phase === "chay" || this.phase === "ngui" || this.phase === "lao")
      return "Chạy mau! Mực đang đuổi theo!";
    if (this.phase === "doiMat") return "Mực đã dồn được một bạn vào góc!";
    return "Mực và bạn nhảy vũ điệu Cha-Cha chúc mừng!";
  }

  protected getSoundCues(): StoryCue[] {
    return [
      { time: this.duration * 0.1, sound: "/games/dog-chase/am/ngay.mp3" },
      { time: this.duration * 0.22, sound: "/games/dog-chase/am/hatxi.mp3" },
      { time: this.duration * 0.32, sound: "/games/dog-chase/am/chit.mp3" },
      { time: this.duration * 0.36, sound: "/games/dog-chase/am/gau.mp3" },
      { time: this.duration * 0.45, sound: "/games/dog-chase/am/kit.mp3" },
      { time: this.duration * 0.72, sound: "/games/dog-chase/am/tim.mp3" },
      { time: this.duration * 0.84, sound: "/games/dog-chase/am/bop.mp3" },
      { time: this.duration * 0.88, sound: "/games/dog-chase/am/ken-giay.mp3" },
    ];
  }

  override startRound(
    round: import("../shared/selection.ts").PickerRound,
  ): void {
    super.startRound(round);
    this.resetChaseState();
    const count = this.actors.length;
    const isMultiRow = count > 8;
    const cols = isMultiRow ? Math.min(3, Math.ceil(count / 15)) : 1;
    const startX = this.dog.x - 40;

    this.students = this.actors.map((name, index) => {
      const selected = this.isSelected(name);
      const character = this.characterVariant(name, index);
      const shortName = this.displayName(name);
      let x: number;
      let y: number;
      if (cols === 1) {
        x = startX - 105 * index;
        y = 700 + (index % 2) * 30 + (index % 3) * 6;
      } else {
        const col = Math.floor(index / cols);
        const row = index % cols;
        x = startX + 200 - 112 * col - (row % 2) * 56;
        y = 820 - 70 * row;
      }
      return {
        name,
        shortName,
        character,
        x,
        y,
        targetX: x,
        targetY: y,
        v: 140,
        targetV: 140,
        direction: 1,
        action: "sneak",
        frame: (index * 2) % 8,
        jumpY: 0,
        jumpV: 0,
        isSelected: selected,
        scale: cols > 1 ? 0.85 : 1,
      };
    });

    this.targetStudent =
      this.students.find((s) => s.isSelected) ?? this.students[0];
    const nonTargets = this.students.filter((s) => !s.isSelected);
    this.bumpStudent = this.students[Math.min(1, this.students.length - 1)];
    this.treeClimber =
      nonTargets.length > 1 ? nonTargets[nonTargets.length - 1] : null;

    this.setPhase("ngu");
  }

  override showLobby(): void {
    super.showLobby();
    this.resetChaseState();
    this.setPhase("cho");
  }

  override skipToResult(): void {
    if (this.round && !this.revealedNames.length) {
      this.finishChaseInstantly();
      super.skipToResult();
    }
  }

  override setPaused(paused: boolean): void {
    super.setPaused(paused);
  }

  private resetChaseState(): void {
    this.dog = {
      x: 640,
      y: 880,
      v: 0,
      direction: 1,
      action: "sleep",
      frame: 0,
      jumpY: 0,
    };
    this.cameraX = this.dog.x - 0.45 * 1600;
    this.slippers = [];
    this.confetti = [];
    this.dustPuffs = [];
    this.dialogs = [];
    this.floatingTexts = [];
    this.chickenTime = -1;
    this.screenShake = 0;
    this.screenFlash = 0;
    this.slowMo = 1;
    this.chaChaTime = 0;
    this.chaChaStep = -1;
    this.chaChaOffset = 0;
  }

  private setPhase(phase: DogPhase): void {
    this.phase = phase;
    this.phaseTime = 0;
  }

  private finishChaseInstantly(): void {
    this.setPhase("xong");
    const target = this.targetStudent;
    if (target) {
      target.action = "dance";
      target.direction = 1;
      target.x = Math.max(530, target.x);
      target.v = 0;
      this.dog.x = target.x + 165;
      this.dog.y = target.y;
      this.dog.action = "dance";
      this.dog.direction = 1;
      this.dog.v = 0;
      this.cameraX = target.x + 82.5 - 800;
    }
    this.slippers.forEach((s) => {
      s.landed = true;
      s.y = s.groundY;
    });
    this.spawnConfetti();
  }

  private spawnConfetti(): void {
    for (let i = 0; i < 140; i++) {
      this.confetti.push({
        x: this.cameraX + 1600 * (0.15 + 0.7 * Math.random()),
        y: -20 - 300 * Math.random(),
        vx: (Math.random() - 0.5) * 300,
        vy: 120 + 200 * Math.random(),
        rotation: 6 * Math.random(),
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        time: 0,
      });
    }
  }

  private triggerDialog(
    target: StudentActor | "dog",
    text: string,
    duration = 1.2,
  ): void {
    this.dialogs = this.dialogs.filter((d) => d.target !== target);
    this.dialogs.push({ text, target, time: 0, duration });
  }

  private triggerFloatingText(
    text: string,
    x: number,
    y: number,
    size = 44,
    color = "#dc2626",
    isCentered = false,
  ): void {
    this.floatingTexts.push({
      text,
      x,
      y,
      time: 0,
      duration: 1.2,
      size,
      color,
      isCentered,
    });
  }

  private syncTimelineToPhase(progress: number): void {
    if (this.phase === "xong") return;
    if (progress < 0.1) {
      if (this.phase !== "ngu") this.setPhase("ngu");
    } else if (progress < 0.28) {
      if (this.phase !== "giaTinh") {
        this.setPhase("giaTinh");
        if (this.bumpStudent) {
          this.bumpStudent.jumpV = 420;
          this.bumpStudent.action = "scared";
          this.triggerFloatingText(
            "HẮT XÌÌ!",
            this.bumpStudent.x,
            this.bumpStudent.y - 180,
            56,
            "#b45309",
          );
        }
      }
    } else if (progress < 0.34) {
      if (this.phase !== "tinh") {
        this.setPhase("tinh");
        if (this.bumpStudent) {
          this.chickenX = this.bumpStudent.x + 30;
          this.chickenY = this.bumpStudent.y + 4;
          this.chickenTime = 0;
          this.triggerFloatingText(
            "CHÍTTT!",
            this.bumpStudent.x + 30,
            this.bumpStudent.y - 40,
            58,
            "#dc2626",
          );
          this.triggerDialog(this.bumpStudent, "Ơ... chết rồi!", 1.2);
        }
      }
    } else if (progress < 0.42) {
      if (this.phase !== "gam") {
        this.setPhase("gam");
        this.dog.action = "growl";
        this.triggerDialog("dog", "Grừ... Đứa nào chưa học bài?", 2.0);
        this.students.forEach((s) => {
          s.action = "scared";
          s.v = 0;
        });
      }
    } else if (progress < 0.46) {
      if (this.phase !== "sua") {
        this.setPhase("sua");
        this.dog.action = "bark";
        this.screenShake = 20;
        this.triggerFloatingText("GÂU!", 800, 360, 180, "#dc2626", true);
        this.students.forEach((s) => {
          s.jumpV = 650;
        });
      }
    } else if (progress < 0.74) {
      if (
        this.phase !== "chay" &&
        this.phase !== "ngui" &&
        this.phase !== "lao"
      ) {
        this.setPhase("chay");
        this.students.forEach((s, idx) => {
          s.action = "run";
          s.targetV = 320 + (idx % 4) * 40;
          s.v = s.targetV;
          s.direction = 1;
          if (idx < 4) {
            this.slippers.push({
              x: s.x,
              y: s.y - 6,
              vx: (Math.random() - 0.5) * 160 - 80,
              vy: -700 - 300 * Math.random(),
              rotation: 0,
              vRotation: (Math.random() - 0.5) * 20,
              groundY: s.y,
              landed: false,
            });
          }
        });
        if (this.treeClimber) {
          this.treeClimber.action = "cling";
          this.treeClimber.x = 220;
          this.treeClimber.y = 580;
          this.triggerDialog(
            this.treeClimber,
            TREE_DIALOGS[Math.floor(Math.random() * TREE_DIALOGS.length)],
            1.5,
          );
        }
        const runner = this.students.find(
          (s) => s !== this.targetStudent && s !== this.treeClimber,
        );
        if (runner) {
          this.triggerDialog(
            runner,
            PANIC_DIALOGS[Math.floor(Math.random() * PANIC_DIALOGS.length)],
            1.2,
          );
        }
        this.dog.action = "run";
      }
    } else if (progress < 0.82) {
      if (this.phase !== "doiMat") {
        this.setPhase("doiMat");
        this.dog.action = "growl";
        this.dog.v = 0;
        if (this.targetStudent) {
          this.targetStudent.action = "scared";
          this.targetStudent.v = 0;
          this.dog.x = this.targetStudent.x + 220;
          this.triggerDialog(
            this.targetStudent,
            "Em... em chưa chuẩn bị!",
            1.2,
          );
        }
      }
    } else if (progress < 0.88) {
      if (this.phase !== "bat") {
        this.setPhase("bat");
        this.screenFlash = 1;
        this.triggerFloatingText("BẮT ĐƯỢC!", 800, 300, 140, "#dc2626", true);
        if (this.targetStudent) {
          this.danceOriginX = Math.max(530, this.targetStudent.x);
          this.targetStudent.x = this.danceOriginX;
          this.targetStudent.action = "dance";
          this.dog.x = this.danceOriginX + 165;
          this.dog.action = "dance";
        }
      }
    } else {
      if (this.phase !== "nhay") {
        this.setPhase("nhay");
        this.spawnConfetti();
        this.triggerFloatingText(
          "BỘP!",
          this.danceOriginX + 82,
          700,
          65,
          "#ea580c",
        );
        this.triggerDialog("dog", "Cha cha cha nào!", 1.2);
      }
    }
  }

  private updateSimulation(dt: number): void {
    const timeStep = dt * this.slowMo;
    this.phaseTime += timeStep;
    this.screenShake = Math.max(0, this.screenShake - 35 * dt);
    this.screenFlash = Math.max(0, this.screenFlash - 3 * dt);

    if (this.chickenTime >= 0) {
      this.chickenTime += dt;
      this.chickenX += 160 * dt;
      this.chickenY -= Math.sin(this.chickenTime * 8) * 15;
    }

    // Slippers flying
    for (const slipper of this.slippers) {
      if (!slipper.landed) {
        slipper.vy += 2400 * dt;
        slipper.x += slipper.vx * dt;
        slipper.y += slipper.vy * dt;
        slipper.rotation += slipper.vRotation * dt;
        if (slipper.y >= slipper.groundY) {
          slipper.y = slipper.groundY;
          if (Math.abs(slipper.vy) > 400) {
            slipper.vy *= -0.3;
            slipper.vx *= 0.5;
          } else {
            slipper.landed = true;
          }
        }
      }
    }

    // Confetti falling
    for (const piece of this.confetti) {
      piece.time += dt;
      piece.x += piece.vx * dt;
      piece.y += piece.vy * dt;
      piece.rotation += 6 * dt;
    }
    this.confetti = this.confetti.filter((p) => p.y < 950);

    // Dust particles
    for (const dust of this.dustPuffs) {
      dust.time += dt;
      dust.radius += 50 * dt;
    }
    this.dustPuffs = this.dustPuffs.filter((d) => d.time < 0.6);

    // Students physics
    for (const student of this.students) {
      student.jumpV -= 2200 * dt;
      student.jumpY = Math.max(0, student.jumpY + student.jumpV * dt);
      if (student.jumpY === 0) student.jumpV = 0;
      student.frame += 10 * dt;
      if (
        (this.phase === "chay" || this.phase === "lao") &&
        student !== this.treeClimber
      ) {
        student.x += student.direction * student.v * dt;
        student.y += (student.targetY - student.y) * Math.min(1, 2.5 * dt);
      }
    }

    // Dog state updates
    this.dog.frame += 10 * dt;
    if (this.phase === "chay" || this.phase === "lao") {
      const target = this.targetStudent ?? this.students[0];
      if (target) {
        this.dog.x +=
          (target.x - 210 - this.dog.x) * Math.min(1, 2.8 * dt) +
          this.dog.v * dt * 0.2;
        this.dog.y += (target.y - this.dog.y) * Math.min(1, 2.2 * dt);
        if (Math.random() < 0.05 && this.dialogs.length < 2) {
          const dialog =
            Math.random() < 0.5
              ? MISS_DIALOGS[Math.floor(Math.random() * MISS_DIALOGS.length)]
              : CORNER_DIALOGS[
                  Math.floor(Math.random() * CORNER_DIALOGS.length)
                ];
          this.triggerDialog("dog", dialog, 0.9);
        }
      }
    }

    // Cha-cha dance logic
    if (this.phase === "nhay" || this.phase === "xong") {
      this.chaChaTime += dt;
      const beatCycle = this.chaChaTime % CHA_CHA_TOTAL_TIME;
      let accTime = 0;
      let currentIdx = 0;
      for (let i = 0; i < CHA_CHA_BEATS.length; i++) {
        const beatDur = CHA_CHA_BEATS[i].phach * CHA_CHA_TEMPO;
        if (beatCycle >= accTime && beatCycle < accTime + beatDur) {
          currentIdx = i;
          break;
        }
        accTime += beatDur;
      }
      const beat = CHA_CHA_BEATS[currentIdx];
      if (currentIdx !== this.chaChaStep) {
        this.chaChaStep = currentIdx;
        this.chaChaOffsetFrom = this.chaChaOffset;
        if (beat.cha) {
          this.triggerFloatingText(
            beat.cha,
            this.danceOriginX + 82,
            620,
            42,
            "#db2777",
          );
        }
      }
      const dur = beat.phach * CHA_CHA_TEMPO;
      const prog = Math.min(1, (beatCycle - accTime) / dur);
      this.chaChaOffset =
        this.chaChaOffsetFrom + (beat.lech - this.chaChaOffsetFrom) * prog;
      if (this.targetStudent) {
        this.targetStudent.x = this.danceOriginX + this.chaChaOffset;
        this.dog.x = this.danceOriginX + 165 + this.chaChaOffset;
        const bounce = beat.cha ? 14 * Math.sin(prog * Math.PI) : 0;
        this.targetStudent.jumpY = bounce;
        this.dog.jumpY = bounce;
      }
    }

    // Dialog & text life
    this.dialogs.forEach((d) => (d.time += dt));
    this.dialogs = this.dialogs.filter((d) => d.time < d.duration);
    this.floatingTexts.forEach((t) => (t.time += dt));
    this.floatingTexts = this.floatingTexts.filter((t) => t.time < t.duration);

    // Smooth camera tracking
    let targetCamX = this.dog.x - 700;
    if (this.phase === "nhay" || this.phase === "xong") {
      targetCamX = this.danceOriginX + 82 - 800;
    } else if (this.phase === "cho") {
      targetCamX = this.dog.x - 800;
    }
    this.cameraX += (targetCamX - this.cameraX) * Math.min(1, 3.5 * dt);
  }

  protected draw(): void {
    const { context } = this;
    const progress = this.round ? this.progress : 0;
    const dt = 1 / 60;

    this.syncTimelineToPhase(progress);
    this.updateSimulation(dt);

    const shakeX = this.screenShake
      ? (Math.random() - 0.5) * this.screenShake
      : 0;
    const shakeY = this.screenShake
      ? (Math.random() - 0.5) * this.screenShake
      : 0;

    context.save();
    context.translate(shakeX, shakeY);

    // 1. Draw Background Alley with Parallax / Wrapping
    this.renderAlleyBackground();

    // 2. Draw Ground Slippers
    for (const slipper of this.slippers) {
      if (slipper.landed) this.renderSlipper(slipper);
    }

    // 3. Draw Dust
    for (const dust of this.dustPuffs) {
      context.save();
      context.globalAlpha = Math.max(0, 0.5 - dust.time);
      context.fillStyle = "#d6cfc4";
      context.beginPath();
      context.arc(
        dust.x - this.cameraX,
        dust.y - 8,
        dust.radius,
        0,
        2 * Math.PI,
      );
      context.fill();
      context.restore();
    }

    // 4. Draw Chicken if active
    if (this.chickenTime >= 0) {
      this.painter.sprite("chicken", {
        x: this.chickenX - this.cameraX,
        y: this.chickenY,
        height: 60,
      });
    }

    // 5. Draw Actors (Dog & Students) sorted by Y for depth
    const renderQueue: { y: number; draw: () => void }[] = [];
    renderQueue.push({
      y: this.dog.y,
      draw: () => this.renderDogActor(),
    });
    for (const student of this.students) {
      renderQueue.push({
        y: student.y,
        draw: () => this.renderStudentActor(student),
      });
    }
    renderQueue.sort((a, b) => a.y - b.y).forEach((item) => item.draw());

    // 6. Draw Flying Slippers
    for (const slipper of this.slippers) {
      if (!slipper.landed) this.renderSlipper(slipper);
    }

    // 7. Draw Foreground Trees & Details
    this.renderAlleyForeground();

    // 8. Draw Dialog Bubbles
    for (const dialog of this.dialogs) {
      this.renderDialogBubble(dialog);
    }

    // 9. Draw Sleeping Zzz Bubbles
    if (this.phase === "cho" || this.phase === "ngu") {
      this.renderSleepBubbles();
    }

    // 10. Draw Floating Texts
    for (const txt of this.floatingTexts) {
      this.renderFloatingText(txt);
    }

    // 11. Draw Falling Confetti
    for (const conf of this.confetti) {
      context.save();
      context.translate(conf.x - this.cameraX, conf.y);
      context.rotate(conf.rotation);
      context.fillStyle = conf.color;
      context.fillRect(-7, -4, 14, 8);
      context.restore();
    }

    // 12. Screen Flash on Impact
    if (this.screenFlash > 0) {
      context.fillStyle = `rgba(255, 255, 255, ${0.6 * this.screenFlash})`;
      context.fillRect(0, 0, 1600, 900);
    }

    context.restore();
  }

  private renderAlleyBackground(): void {
    const bg = this.artwork.get("background");
    const shelter = this.artwork.get("shelter") ?? bg;
    if (!bg) return;
    const tileW = (bg.image.width / bg.image.height) * 900;
    const step = tileW - 160;
    const minTile = Math.floor((this.cameraX - 160) / step);
    const maxTile = Math.floor((this.cameraX + 1600) / step);

    for (let t = minTile; t <= maxTile; t++) {
      const art = t % 2 === 0 ? bg : shelter;
      const x = t * step - this.cameraX;
      if (art) this.context.drawImage(art.image, x, 0, tileW + 2, 900);
    }
  }

  private renderAlleyForeground(): void {
    const fg = this.artwork.get("foreground");
    if (!fg) return;
    const { context } = this;
    const img = fg.image;
    const h = 0.45 * 900;
    const w = (img.width / img.height) * h;
    const y = 900 - h;
    context.drawImage(img, -this.cameraX * 0.2 - 20, y, w, h);
  }

  private renderStudentActor(student: StudentActor): void {
    const screenX = student.x - this.cameraX;
    const screenY = student.y - student.jumpY;
    const height = 230 * student.scale;

    this.painter.shadow(screenX, student.y, 48 * student.scale);
    this.painter.sprite(`student.${student.character}.${student.action}`, {
      x: screenX,
      y: screenY,
      height,
      time: student.frame * 0.1,
      fps: student.action === "run" ? 14 : 8,
      flipX: student.direction < 0,
    });

    // Draw Name Tag
    if (
      this.phase !== "cho" &&
      this.phase !== "bat" &&
      this.phase !== "nhay" &&
      this.phase !== "xong"
    ) {
      this.painter.label(
        student.shortName,
        screenX,
        screenY - height - 14,
        student.isSelected && this.phase === "doiMat",
      );
    }
  }

  private renderDogActor(): void {
    const screenX = this.dog.x - this.cameraX;
    const screenY = this.dog.y - this.dog.jumpY;
    const height = 215;

    this.painter.shadow(screenX, this.dog.y, 65);
    this.painter.sprite(`dog.${this.dog.action}`, {
      x: screenX,
      y: screenY,
      height,
      time: this.dog.frame * 0.1,
      fps: this.dog.action === "run" ? 14 : 7,
      flipX: this.dog.direction < 0,
    });
  }

  private renderSlipper(slipper: FlyingSlipper): void {
    const screenX = slipper.x - this.cameraX;
    this.painter.sprite("slipper", {
      x: screenX,
      y: slipper.y,
      height: 48,
      rotation: slipper.rotation,
    });
  }

  private renderDialogBubble(dialog: DialogBubble): void {
    let anchorX = 0;
    let anchorY = 0;
    if (dialog.target === "dog") {
      anchorX = this.dog.x - this.cameraX;
      anchorY = this.dog.y - 210;
    } else {
      anchorX = dialog.target.x - this.cameraX;
      anchorY =
        dialog.target.y - dialog.target.jumpY - 240 * dialog.target.scale;
    }
    this.painter.bubble(dialog.text, anchorX, anchorY, 400);
  }

  private renderSleepBubbles(): void {
    const { context } = this;
    const dogScreenX = this.dog.x - this.cameraX;
    const dogScreenY = this.dog.y - 100;
    for (let i = 0; i < 3; i++) {
      const p = (0.5 * this.ambientTime + i / 3) % 1;
      const x = dogScreenX + 50 + 70 * p + i * 12;
      const y = dogScreenY - 110 * p;
      context.save();
      context.globalAlpha = Math.sin(p * Math.PI);
      context.font = `900 ${28 + i * 8}px "Baloo 2", system-ui, sans-serif`;
      context.lineWidth = 5;
      context.strokeStyle = "#ffffff";
      context.fillStyle = "#1e3a8a";
      context.strokeText("Z", x, y);
      context.fillText("Z", x, y);
      context.restore();
    }
  }

  private renderFloatingText(txt: FloatingText): void {
    const { context } = this;
    const progress = txt.time / txt.duration;
    const alpha = Math.max(0, 1 - progress);
    const x = txt.isCentered ? txt.x : txt.x - this.cameraX;
    const y = txt.isCentered ? txt.y : txt.y - progress * 40;

    context.save();
    context.globalAlpha = alpha;
    context.font = `900 ${txt.size}px "Baloo 2", system-ui, sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.lineJoin = "round";
    context.lineWidth = Math.max(6, txt.size * 0.12);
    context.strokeStyle = "#ffffff";
    context.strokeText(txt.text, x, y);
    context.fillStyle = txt.color;
    context.fillText(txt.text, x, y);
    context.restore();
  }
}
