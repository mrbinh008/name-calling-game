import test from "node:test";
import assert from "node:assert/strict";
import { createCanvas, Image } from "@napi-rs/canvas";
import { resolve } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { VillageScene } from "../src/game/scene.ts";
import { createVillage, createRound } from "../src/game/world.ts";

test("bộ vẽ tải sprite thật, vẽ các tình tiết, chọn nhà, tạm dừng và kết thúc", async () => {
  const oldDocument = globalThis.document;
  const oldImage = globalThis.Image;
  globalThis.document = { createElement: () => createCanvas(300, 150) };
  globalThis.Image = class extends Image {
    set src(value) {
      super.src = resolve("public", value.replace(/^\//, ""));
    }
    get src() {
      return super.src;
    }
  };
  try {
    const names = [
      "Nguyễn Minh Anh",
      "Trần Quốc Bảo",
      "Lê Ngọc Châu",
      "Phạm Thành Đạt",
      "Hoàng Hà Giang",
      "Vũ Gia Hân",
      "Đặng Trung Hiếu",
      "Bùi Khánh Linh",
      "Đỗ Quang Huy",
      "Ngô Phương Mai",
      "Hồ Tuấn Kiệt",
      "Dương Bảo Ngọc",
    ];
    const world = createVillage(names);
    const canvas = createCanvas(1440, 900);
    const scene = await VillageScene.create(canvas, world);
    scene.resize(1440, 900, 1);
    scene.renderFrame(0, 1440, 900);
    assert.equal(scene.houseHitboxes.length, names.length);
    const house = scene.houseHitboxes[0];
    assert.ok(
      names.includes(
        scene.getHouseAt(
          (house.left + house.right) / 2,
          (house.top + house.bottom) / 2,
        ),
      ),
    );
    await mkdir("test-results", { recursive: true });
    await writeFile(
      "test-results/canvas-village.png",
      await canvas.encode("png"),
    );
    for (const options of [
      { decoyType: "wrongDoor", incidentType: "trashCan" },
      { decoyType: "brakeAndTurn", incidentType: "stall" },
      { decoyType: "duckHorn", incidentType: "dog" },
      { decoyType: "lookAround" },
    ]) {
      const round = createRound(
        world,
        new Set(),
        new Set(),
        3,
        Math.random,
        options,
      );
      scene.startRound(round);
      for (const segment of round.segments) {
        scene.setTime((segment.startTime + segment.endTime) / 2);
        const frame = scene.renderFrame(0, 1440, 900);
        assert.ok(Array.isArray(frame.bubbles));
      }
      scene.setPaused(true);
      const time = scene.time;
      scene.renderFrame(0.05, 1440, 900);
      assert.equal(scene.time, time);
      let finished = false;
      scene.onCue = (cue) => {
        if (cue === "result") finished = true;
      };
      scene.skipToResult();
      assert.equal(finished, true);
      assert.ok(scene.time >= round.resultTime);
      scene.renderFrame(0, 1440, 900);
    }
    scene.showLobby();
    assert.equal(scene.isPlaying, false);
    scene.resize(320, 720, 1);
    assert.doesNotThrow(() => scene.renderFrame(0, 320, 720));
    scene.destroy();
  } finally {
    globalThis.document = oldDocument;
    globalThis.Image = oldImage;
  }
});
