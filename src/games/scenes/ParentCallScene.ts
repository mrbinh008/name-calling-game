import manifest from "@/games/assets/parent-call.json" with { type: "json" };
import {
  AnimatedScene,
  type SceneOptions,
  type StoryCue,
} from "@/games/shared/AnimatedScene.ts";
import { loadArtwork } from "@/games/shared/artwork.ts";

const AVATAR_COLORS = [
  "#dd8658",
  "#5a9b87",
  "#8a78b7",
  "#639bc2",
  "#b99038",
  "#b96783",
];

export class ParentCallScene extends AnimatedScene {
  static async create(
    canvas: HTMLCanvasElement,
    options: SceneOptions,
  ): Promise<ParentCallScene> {
    return new ParentCallScene(canvas, await loadArtwork(manifest), options);
  }
  getStatus(): string {
    if (!this.round) return "Máy tính đã sẵn sàng. Cô mở nhóm phụ huynh nhé!";
    if (this.progress < 0.24) return "Cô đang mở nhóm phụ huynh của lớp…";
    if (this.progress < 0.5) return "Cô đang tìm một phụ huynh để trao đổi…";
    if (this.progress < 0.82) return "Có tin nhắn mới! Đang kết nối cuộc gọi…";
    return "Cô và phụ huynh đã thống nhất: mời em lên bảng!";
  }
  protected getSoundCues(): StoryCue[] {
    return [
      { time: this.duration * 0.25, sound: "tone:message" },
      { time: this.duration * 0.53, sound: "tone:message" },
      { time: this.duration * 0.67, sound: "tone:call" },
      { time: this.duration * 0.86, sound: "tone:result" },
    ];
  }
  protected draw(): void {
    const { painter } = this;
    const progress = this.round ? this.progress : 0;
    painter.image("background", 0, 0, 1600, 900);
    ["computer", "folder", "word", "excel", "zalo", "trash"].forEach(
      (key, index) => {
        painter.image(key, 32, 120 + index * 105, 52, 52);
        painter.text(
          ["Máy tính", "Tài liệu", "Word", "Excel", "Zalo", "Thùng rác"][index],
          58,
          187 + index * 105,
          { size: 16, color: "#fff", weight: 600 },
        );
      },
    );
    painter.panel(0, 850, 1600, 50, "#e7edf5e8", undefined, 0);
    painter.text("⊞", 35, 876, { size: 34, color: "#2679be" });
    ["folder", "browser", "word", "excel", "zalo"].forEach((key, index) =>
      painter.image(key, 115 + index * 65, 860, 28, 28),
    );
    painter.text("VIE     10:00     ♫", 1480, 877, {
      size: 17,
      color: "#344452",
    });
    if (!this.round) {
      painter.panel(500, 270, 620, 270, "#fffdf3ef", "#d9e2eb", 24);
      painter.image("zalo", 750, 300, 100, 100);
      painter.text("Nhóm phụ huynh lớp mình", 810, 435, {
        size: 34,
        color: "#236db5",
      });
      painter.text("Một cuộc gọi nhỏ. Một bất ngờ lớn!", 810, 490, {
        size: 23,
        weight: 500,
      });
      return;
    }
    const selectedName = this.round.selectedNames[0];
    const studentName = this.displayName(selectedName);
    const revealed = progress >= 0.5;
    painter.panel(190, 135, 1230, 650, "#fff", "#bdcbd8", 18);
    painter.panel(190, 135, 1230, 48, "#edf3f8", undefined, 16);
    painter.text("Zalo · Phụ huynh lớp mình", 225, 160, {
      size: 22,
      color: "#46617a",
      align: "left",
      weight: 600,
    });
    painter.text("—    □    ×", 1330, 159, { size: 25, color: "#647789" });
    painter.panel(190, 183, 300, 602, "#f5f8fc", undefined, 0);
    painter.panel(210, 200, 260, 40, "#e8edf3", undefined, 9);
    painter.text("⌕  Tìm phụ huynh", 230, 220, {
      size: 19,
      color: "#6e7d89",
      align: "left",
      weight: 500,
    });
    const visibleContacts = [
      selectedName,
      ...this.actors.filter((name) => name !== selectedName),
    ].slice(0, 7);
    visibleContacts.forEach((name, index) => {
      const y = 285 + index * 69;
      const active = revealed
        ? index === 0
        : index === Math.floor(this.time * 2) % visibleContacts.length;
      if (active) painter.panel(199, y - 29, 282, 62, "#dcecff", undefined, 7);
      painter.panel(
        215,
        y - 20,
        42,
        42,
        AVATAR_COLORS[index % AVATAR_COLORS.length],
        undefined,
        21,
      );
      painter.text(this.displayName(name).slice(0, 1), 236, y + 1, {
        size: 21,
        color: "#fff",
      });
      painter.text(`PH ${this.displayName(name)}`, 270, y - 6, {
        size: 20,
        color: "#294357",
        align: "left",
        weight: 700,
        maxWidth: 192,
      });
      painter.text(
        active ? "Đang hoạt động" : "Cảm ơn cô giáo ạ.",
        270,
        y + 18,
        { size: 15, color: "#8594a1", align: "left", weight: 400 },
      );
    });
    painter.text(
      revealed ? `PH ${selectedName}` : "Nhóm phụ huynh lớp mình",
      525,
      222,
      { size: 24, color: "#263d51", align: "left", maxWidth: 780 },
    );
    painter.text("Đang hoạt động", 525, 253, {
      size: 16,
      color: "#8293a1",
      align: "left",
      weight: 400,
    });
    painter.panel(491, 281, 928, 435, "#edf3f9", undefined, 0);
    this.message(
      "Cô giáo",
      "Kính chào quý phụ huynh. Hôm nay cô có một lời nhắn nhỏ tới lớp mình.",
      520,
      326,
      false,
    );
    if (progress >= 0.34)
      this.message(
        "Phụ huynh",
        "Dạ, có chuyện gì vậy cô? Cả nhà đang nghe đây ạ.",
        785,
        425,
        true,
      );
    if (revealed)
      this.message(
        "Cô giáo",
        `Cô xin phép mời em ${studentName} lên bảng trả bài một chút nhé!`,
        520,
        525,
        false,
      );
    if (progress >= 0.82)
      this.message(
        `PH ${studentName}`,
        `${studentName} ơi, đứng dậy trả bài đi con!`,
        785,
        625,
        true,
      );
    if (progress >= 0.67 && progress < 0.82) {
      painter.panel(800, 495, 390, 160, "#fff", "#bfd1e2", 18);
      painter.text("☎", 995, 534, { size: 40, color: "#3a9b6a" });
      painter.text(`Đang gọi PH ${studentName}…`, 995, 586, {
        size: 25,
        maxWidth: 350,
      });
      painter.text("Đang kết nối", 995, 626, { size: 18, color: "#7d8c99" });
    }
    painter.text("Nhập tin nhắn…", 525, 750, {
      size: 20,
      color: "#94a0aa",
      align: "left",
      weight: 400,
    });
  }

  private message(
    sender: string,
    text: string,
    x: number,
    y: number,
    outgoing: boolean,
  ): void {
    this.painter.panel(
      x,
      y - 24,
      580,
      78,
      outgoing ? "#dceeff" : "#fff",
      "#dbe4ee",
      12,
    );
    this.painter.text(sender, x + 18, y - 6, {
      size: 16,
      color: outgoing ? "#287cb6" : "#7b8a96",
      align: "left",
      weight: 600,
    });
    this.painter.wrappedText(text, x + 18, y + 23, 540, {
      size: 19,
      color: "#314452",
      weight: 500,
    });
  }
}
