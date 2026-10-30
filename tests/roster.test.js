import test from "node:test";
import assert from "node:assert/strict";
import {
  parseRoster,
  loadClassroom,
  saveClassroom,
} from "../src/lib/classroom.ts";

test("chuẩn hóa danh sách và nhận giới tính tùy chọn", () => {
  const result = parseRoster(
    " Nguyễn   Văn An | nam\n\nTrần Thị Mai | nữ\nLê Minh",
  );
  assert.deepEqual(result.roster, ["Nguyễn Văn An", "Trần Thị Mai", "Lê Minh"]);
  assert.deepEqual(result.genders, {
    "Nguyễn Văn An": "nam",
    "Trần Thị Mai": "nu",
  });
  assert.equal(result.error, null);
});
test("báo lỗi tên trùng, danh sách rỗng, quá 60 em và giới tính không hợp lệ", () => {
  for (const text of [
    "",
    "Nguyễn An\nnguyễn an",
    "An | abc",
    Array.from({ length: 61 }, (_, i) => `Em ${i}`).join("\n"),
  ]) {
    assert.ok(parseRoster(text).error);
  }
});
test("dữ liệu lưu bị hỏng hoặc bộ nhớ bị khóa vẫn mở được ứng dụng", () => {
  for (const stored of [
    "{",
    "{}",
    '{"roster": [12]}',
    '{"roster": ["An", "An"]}',
    '{"roster": ["An"], "genders": null}',
  ]) {
    assert.equal(loadClassroom({ getItem: () => stored }).isDemo, true);
  }
  const storage = {
    getItem() {
      throw Error("blocked");
    },
    setItem() {
      throw Error("full");
    },
  };
  assert.equal(loadClassroom(storage).isDemo, true);
  assert.equal(saveClassroom({}, storage), false);
});
test("đọc lại lớp hợp lệ đã lưu", () => {
  const value = {
    title: "Lớp 5A",
    roster: ["Nguyễn An"],
    genders: { "Nguyễn An": "nam" },
    isDemo: false,
  };
  assert.deepEqual(
    loadClassroom({ getItem: () => JSON.stringify(value) }),
    value,
  );
});
test("quyền truy cập localStorage bị chặn vẫn cho chơi", () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      get localStorage() {
        throw Error("blocked");
      },
    },
  });
  try {
    assert.equal(loadClassroom().isDemo, true);
    assert.equal(saveClassroom({}), false);
  } finally {
    if (previous) Object.defineProperty(globalThis, "window", previous);
    else delete globalThis.window;
  }
});
