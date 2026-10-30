import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import MangoCanopy from "../src/games/mango/MangoCanopy.tsx";

test("mỗi em trong lớp 60 học sinh có một quả xoài với đầy đủ họ tên", () => {
  const roster = Array.from(
    { length: 60 },
    (_, index) => `Nguyễn Hoàng Minh Anh ${index + 1}`,
  );
  const dom = new JSDOM(
    renderToStaticMarkup(
      createElement(MangoCanopy, {
        roster,
        absent: [roster[1]],
        called: [roster[2]],
        selectedNames: [roster[59]],
      }),
    ),
  );
  try {
    const fruit = Array.from(
      dom.window.document.querySelectorAll(".mango-fruit"),
    );
    assert.equal(fruit.length, 60);
    assert.deepEqual(
      fruit.map(
        (element) => element.querySelector(".mango-fruit-name").textContent,
      ),
      roster,
    );
    assert.equal(
      dom.window.document.querySelector(
        ".mango-fruit.is-selected .mango-fruit-name",
      ).textContent,
      roster[59],
    );
    assert.match(fruit[1].textContent, /Vắng/);
    assert.match(fruit[2].textContent, /Đã gọi/);
    assert.equal(
      dom.window.document.querySelectorAll(".mango-fruit svg").length,
      60,
    );
  } finally {
    dom.window.close();
  }
});
