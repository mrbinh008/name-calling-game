import test from "node:test";
import assert from "node:assert/strict";
import {
  createVillage,
  createRound,
  getRoosterPose,
  createDisplayNames,
} from "../src/game/world.ts";

const names = Array.from({ length: 24 }, (_, i) => `Nguyễn Học Sinh ${i + 1}`);
function seeded(seed = 31) {
  return () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32;
}

test("mỗi học sinh có một nhà, tối đa 60 nhà và bố cục ổn định", () => {
  const village = createVillage(names, {}, 16 / 9);
  assert.equal(village.houses.length, names.length);
  assert.deepEqual(village, createVillage(names, {}, 16 / 9));
  assert.equal(
    createVillage(Array.from({ length: 80 }, (_, i) => `Em ${i}`)).houses
      .length,
    60,
  );
});

test("không gọi học sinh vắng hoặc đã được gọi khi còn em khác", () => {
  const village = createVillage(names);
  const called = new Set(names.slice(0, 10));
  const absent = new Set(names.slice(10, 15));
  const round = createRound(village, called, absent, 5, seeded());
  assert.equal(round.selectedNames.length, 5);
  assert.equal(new Set(round.selectedNames).size, 5);
  assert.ok(
    round.selectedNames.every((name) => !called.has(name) && !absent.has(name)),
  );
});

test("hết lượt thì bắt đầu vòng mới, vẫn loại học sinh vắng", () => {
  const village = createVillage(names);
  const round = createRound(
    village,
    new Set(names),
    new Set([names[0]]),
    3,
    seeded(),
  );
  assert.equal(round.startsNewCycle, true);
  assert.equal(round.selectedNames.length, 3);
  assert.ok(!round.selectedNames.includes(names[0]));
});

test("lớp trống hoặc cả lớp vắng không sinh hoạt cảnh", () => {
  assert.equal(createRound(createVillage([]), new Set(), new Set()), null);
  assert.equal(
    createRound(createVillage(names), new Set(), new Set(names)),
    null,
  );
});

test("gọi chính xác nhà được chọn và phân biệt tên trùng tên gọi", () => {
  const village = createVillage(names);
  assert.deepEqual(
    createRound(village, new Set(), new Set(), 1, seeded(), {
      selectedNames: [names[3]],
    }).selectedNames,
    [names[3]],
  );
  const signs = createDisplayNames([
    "Nguyễn Văn An",
    "Trần Văn An",
    "Lê Thị Mai",
  ]);
  assert.equal(new Set(Object.values(signs)).size, 3);
});
test("tên trùng thuộc tính JavaScript vẫn có biển tên dạng chuỗi", () => {
  const signs = createDisplayNames([
    "constructor",
    "__proto__",
    "Nguyễn Văn An",
  ]);
  assert.equal(signs.constructor, "constructor");
  assert.equal(signs.__proto__, "__proto__");
});

test("hoạt cảnh có thời gian hữu hạn, đúng thứ tự với nhiều cỡ lớp", () => {
  for (const size of [1, 2, 3, 12, 60]) {
    const village = createVillage(
      Array.from({ length: size }, (_, i) => `Học sinh ${i}`),
    );
    for (const count of [1, 3, 5]) {
      const round = createRound(
        village,
        new Set(),
        new Set(),
        count,
        seeded(size),
      );
      assert.equal(round.selectedNames.length, Math.min(size, count));
      assert.ok(Number.isFinite(round.resultTime) && round.resultTime > 0);
      assert.ok(
        round.segments.every((segment) => segment.endTime >= segment.startTime),
      );
      assert.ok(
        round.cues.every(
          (cue, i) => i === 0 || cue.time >= round.cues[i - 1].time,
        ),
      );
      const position = getRoosterPose(round, round.resultTime).position;
      assert.ok(Number.isFinite(position.x) && Number.isFinite(position.y));
    }
  }
});
