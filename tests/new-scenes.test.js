import test from "node:test";
import assert from "node:assert/strict";
import { createCanvas, Image } from "@napi-rs/canvas";
import { resolve } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { DogChaseScene } from "../src/games/scenes/DogChaseScene.ts";
import { MangoPokeScene } from "../src/games/scenes/MangoPokeScene.ts";
import { JiangshiScene } from "../src/games/scenes/JiangshiScene.ts";
import { ParentCallScene } from "../src/games/scenes/ParentCallScene.ts";
import { MeteorScene } from "../src/games/scenes/MeteorScene.ts";
import { selectPickerRound } from "../src/games/shared/selection.ts";

test("cả 5 game tải ảnh thật, vẽ các giai đoạn và kết thúc đúng một lần", async () => {
  const originalImage = globalThis.Image;
  globalThis.Image = class extends Image {
    set src(value) {
      super.src = resolve("public", value.replace(/^\//, ""));
    }
    get src() {
      return super.src;
    }
  };
  const roster = Array.from(
    { length: 24 },
    (_unused, index) => `Học sinh ${index + 1}`,
  );
  await mkdir("test-results", { recursive: true });
  try {
    for (const [id, Scene] of [
      ["dog-chase", DogChaseScene],
      ["mango-poke", MangoPokeScene],
      ["jiangshi", JiangshiScene],
      ["parent-call", ParentCallScene],
      ["meteor", MeteorScene],
    ]) {
      const canvas = createCanvas(1440, 900);
      const scene = await Scene.create(canvas, {
        roster,
        genders: {},
        duration: 24,
      });
      scene.resize(1440, 900, 1);
      scene.renderFrame(0, 1440, 900);
      const round = selectPickerRound(
        roster,
        new Set(),
        new Set(),
        1,
        () => 0.42,
      );
      scene.startRound(round);
      if (id === "mango-poke") {
        scene.seek(scene.duration * 0.57);
        assert.deepEqual(scene.revealedNames, []);
        scene.seek(scene.duration * 0.6);
        assert.deepEqual(scene.revealedNames, round.selectedNames);
      }
      let finished = 0;
      scene.onComplete = () => finished++;
      for (const progress of [0.1, 0.3, 0.6, 0.8, 1]) {
        scene.seek(progress * scene.duration);
        scene.renderFrame(0, 1440, 900);
      }
      scene.seek(10);
      scene.setPaused(true);
      scene.renderFrame(0.05, 1440, 900);
      assert.equal(scene.elapsed, 10);
      scene.skipToResult();
      scene.skipToResult();
      assert.equal(finished, 1);
      scene.seek(20);
      scene.renderFrame(0, 1440, 900);
      await writeFile(`test-results/${id}.png`, await canvas.encode("png"));
      scene.showLobby();
      assert.equal(scene.isPlaying, false);
      scene.resize(320, 720, 1);
      assert.doesNotThrow(() => scene.renderFrame(0, 320, 720));
      if (id === "mango-poke") {
        for (const [width, height] of [
          [2560, 1080],
          [320, 720],
        ]) {
          scene.resize(width, height, 1);
          scene.renderFrame(0, width, height);
          const pixel = Array.from(
            canvas.getContext("2d").getImageData(0, 0, 1, 1).data,
          );
          assert.notDeepEqual(
            pixel,
            [23, 40, 32, 255],
            "vườn xoài phủ kín viewport, không để dải nền đen",
          );
          await writeFile(
            `test-results/mango-poke-${width}.png`,
            await canvas.encode("png"),
          );
        }
      }
      scene.destroy();
    }
  } finally {
    globalThis.Image = originalImage;
  }
});
