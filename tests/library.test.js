import test from "node:test";
import assert from "node:assert/strict";
import { GAME_CATALOG, parseGameRoute } from "../src/games/catalog.ts";
import { selectPickerRound } from "../src/games/shared/selection.ts";

test("thư viện có game hiện tại và 5 game từ các bản build mới", () => {
  assert.deepEqual(
    GAME_CATALOG.map((game) => game.id),
    [
      "village-summon",
      "dog-chase",
      "mango-poke",
      "jiangshi",
      "parent-call",
      "meteor",
    ],
  );
  for (const game of GAME_CATALOG)
    assert.equal(parseGameRoute(`#/games/${game.id}`), game.id);
  assert.equal(parseGameRoute("#/"), null);
  assert.equal(parseGameRoute("#/games/unknown"), null);
});

test("chọn học sinh tránh vắng và gọi lặp; hết vòng thì làm mới", () => {
  const roster = ["An", "Bảo", "Chi", "Dũng"];
  const round = selectPickerRound(
    roster,
    new Set(["An"]),
    new Set(["Bảo"]),
    2,
    () => 0.4,
  );
  assert.deepEqual(new Set(round.selectedNames), new Set(["Chi", "Dũng"]));
  assert.equal(round.startsNewCycle, false);
  const next = selectPickerRound(
    roster,
    new Set(roster),
    new Set(["Bảo"]),
    2,
    () => 0.4,
  );
  assert.equal(next.startsNewCycle, true);
  assert.ok(!next.selectedNames.includes("Bảo"));
  assert.equal(selectPickerRound([], new Set(), new Set()), null);
  assert.equal(selectPickerRound(roster, new Set(), new Set(roster)), null);
});

test("gọi đúng một em vẫn tôn trọng trạng thái vắng", () => {
  const roster = ["An", "Bảo"];
  assert.deepEqual(
    selectPickerRound(roster, new Set(), new Set(), 1, () => 0.5, "An")
      .selectedNames,
    ["An"],
  );
  assert.equal(
    selectPickerRound(roster, new Set(), new Set(["An"]), 1, () => 0.5, "An"),
    null,
  );
});
