import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createVillage, createRound } from "../src/game/world.ts";
import { VillageAudio } from "../src/game/audio.ts";
import {
  createAudioHarness,
  runAudioScenario,
} from "./support/audio-harness.js";

function createRandom(seed) {
  return () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32;
}

test("15 bố cục và timeline khớp dữ liệu chụp trước khi refactor", async () => {
  const fixtures = JSON.parse(
    await readFile(new URL("./fixtures/rounds.json", import.meta.url), "utf8"),
  );
  for (const fixture of fixtures) {
    const { size, count } = fixture;
    const names = Array.from(
      { length: size },
      (_unused, index) => `Học sinh ${index + 1}`,
    );
    const village = createVillage(names, {}, 16 / 9);
    assert.deepEqual(village, fixture.village, `Village: ${size} students`);
    const called = new Set(names.slice(0, Math.floor(size / 4)));
    const absent = new Set(names.slice(-Math.floor(size / 6) || size));
    const round = createRound(
      village,
      called,
      absent,
      count,
      createRandom(size * 31 + count),
    );
    // JSON records open-ended door events (Infinity) as null.
    assert.deepEqual(
      JSON.parse(JSON.stringify(round)),
      fixture.round,
      `Round: ${size} students, ${count} selected`,
    );
  }
});

test("lịch âm thanh giữ nguyên 729 thao tác Web Audio của bản trước", async () => {
  const expected = JSON.parse(
    await readFile(
      new URL("./fixtures/audio-schedule.json", import.meta.url),
      "utf8",
    ),
  );
  const originalWindow = globalThis.window;
  const originalRandom = Math.random;
  const harness = createAudioHarness();
  globalThis.window = harness.window;
  Math.random = () => 0.5;
  try {
    runAudioScenario(new VillageAudio(), harness);
    assert.deepEqual(harness.trace, expected);
    assert.equal(harness.intervals.size, 0);
  } finally {
    globalThis.window = originalWindow;
    Math.random = originalRandom;
  }
});
