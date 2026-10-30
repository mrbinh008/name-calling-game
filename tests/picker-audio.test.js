import test from "node:test";
import assert from "node:assert/strict";
import { PickerAudio } from "../src/games/shared/PickerAudio.ts";
import { gameAudio } from "../src/game/sound.ts";

test("âm thanh game mới tôn trọng nút tắt tiếng và dừng toàn bộ khi rời game", () => {
  const originalAudio = globalThis.Audio;
  const previousEnabled = gameAudio.isEnabled();
  const players = [];
  globalThis.Audio = class {
    paused = true;
    onended = null;
    constructor(url) {
      this.url = url;
      players.push(this);
    }
    play() {
      this.paused = false;
      return Promise.resolve();
    }
    pause() {
      this.paused = true;
    }
  };
  try {
    const audio = new PickerAudio("/background.mp3");
    gameAudio.setEnabled(false);
    audio.startBackground();
    audio.play("/bark.mp3");
    assert.equal(players.length, 0);
    gameAudio.setEnabled(true);
    audio.startBackground();
    audio.startBackground();
    audio.play("/bark.mp3");
    assert.equal(players.length, 2);
    assert.equal(players[0].loop, true);
    assert.ok(players.every((player) => !player.paused));
    audio.stopBackground();
    assert.ok(players.every((player) => player.paused));
    assert.equal(players[1].onended, null);
    audio.startBackground();
    assert.equal(players[0].paused, false);
    audio.dispose();
    assert.ok(players.every((player) => player.paused));
  } finally {
    gameAudio.setEnabled(previousEnabled);
    if (originalAudio === undefined) delete globalThis.Audio;
    else globalThis.Audio = originalAudio;
  }
});
