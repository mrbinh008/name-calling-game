import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { createCanvas, Image } from "@napi-rs/canvas";
import { resolve } from "node:path";

test("React: nhập lớp, điểm danh, gọi tên, tạm dừng, kết quả, gọi tiếp và lưu lớp", async () => {
  const dom = new JSDOM('<html><body><div id="root"></div></body></html>', {
    url: "http://localhost/#/games/village-summon",
    pretendToBeVisual: true,
  });
  const replaced = new Map();
  const install = (key, value) => {
    replaced.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, {
      value,
      configurable: true,
      writable: true,
    });
  };
  for (const key of [
    "window",
    "document",
    "HTMLElement",
    "HTMLCanvasElement",
    "Event",
    "MouseEvent",
    "localStorage",
  ])
    install(key, dom.window[key]);
  install("IS_REACT_ACT_ENVIRONMENT", true);
  install(
    "requestAnimationFrame",
    dom.window.requestAnimationFrame.bind(dom.window),
  );
  install(
    "cancelAnimationFrame",
    dom.window.cancelAnimationFrame.bind(dom.window),
  );
  install(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  install(
    "Image",
    class extends Image {
      set src(value) {
        super.src = resolve("public", value.replace(/^\//, ""));
      }
      get src() {
        return super.src;
      }
    },
  );
  Object.defineProperty(document, "fonts", {
    value: { ready: Promise.resolve() },
  });
  dom.window.HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  dom.window.HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  const canvases = new WeakMap();
  const native = (element) => {
    if (!canvases.has(element))
      canvases.set(element, createCanvas(element.width, element.height));
    return canvases.get(element);
  };
  for (const dimension of ["width", "height"]) {
    const original = Object.getOwnPropertyDescriptor(
      dom.window.HTMLCanvasElement.prototype,
      dimension,
    );
    Object.defineProperty(dom.window.HTMLCanvasElement.prototype, dimension, {
      get() {
        return original.get.call(this);
      },
      set(value) {
        original.set.call(this, value);
        native(this)[dimension] = value;
      },
    });
  }
  Object.defineProperty(dom.window.HTMLCanvasElement.prototype, "clientWidth", {
    get: () => 1440,
  });
  Object.defineProperty(
    dom.window.HTMLCanvasElement.prototype,
    "clientHeight",
    { get: () => 900 },
  );
  dom.window.HTMLCanvasElement.prototype.getContext = function () {
    const ctx = native(this).getContext("2d");
    if (!ctx.wrappedForDOM) {
      const draw = ctx.drawImage.bind(ctx);
      ctx.drawImage = (source, ...args) =>
        draw(
          source instanceof dom.window.HTMLCanvasElement
            ? native(source)
            : source,
          ...args,
        );
      ctx.wrappedForDOM = true;
    }
    return ctx;
  };
  const { render, fireEvent, waitFor, cleanup, within, act } =
    await import("@testing-library/react");
  const { default: App } = await import("../src/App.tsx");
  const errors = [];
  const originalError = console.error;
  console.error = (...args) => {
    errors.push(args.join(" "));
    originalError(...args);
  };
  let ui;
  try {
    ui = render(AppElement(App));
    await waitFor(() =>
      assert.ok(ui.getByRole("button", { name: "Gọi tên", exact: true })),
    );
    fireEvent.click(
      ui.getByRole("button", { name: "Danh sách lớp", exact: true }),
    );
    fireEvent.change(ui.getByRole("textbox", { name: "Tên lớp" }), {
      target: { value: "Lớp 5A" },
    });
    fireEvent.change(ui.getByRole("textbox", { name: /Học sinh/ }), {
      target: {
        value: "Nguyễn Văn An | nam\nTrần Thị Mai | nữ\nLê Minh Bảo | nam",
      },
    });
    fireEvent.click(ui.getByRole("button", { name: "Lưu danh sách" }));
    await waitFor(() =>
      assert.ok(ui.getByRole("button", { name: "Gọi tên", exact: true })),
    );
    fireEvent.click(ui.getByRole("button", { name: "Điểm danh", exact: true }));
    fireEvent.click(ui.getByRole("checkbox", { name: "Nguyễn Văn An" }));
    fireEvent.click(ui.getByRole("button", { name: "Xong · 2 em có mặt" }));
    fireEvent.click(ui.getByRole("button", { name: "Gọi 2 em", exact: true }));
    fireEvent.click(ui.getByRole("button", { name: "Gọi tên", exact: true }));
    fireEvent.click(ui.getByRole("button", { name: "Tạm dừng", exact: true }));
    assert.ok(ui.getByRole("heading", { name: "Xóm đang nghỉ một chút" }));
    fireEvent.click(
      ui.getByRole("button", { name: "Xem kết quả", exact: true }),
    );
    assert.equal(document.querySelectorAll(".xm-giay__ten").length, 2);
    const result = ui.getByRole("dialog", { name: "GIẤY TRIỆU TẬP" });
    assert.ok(result.textContent.includes("Trần Thị Mai"));
    assert.ok(result.textContent.includes("Lê Minh Bảo"));
    assert.ok(!result.textContent.includes("Nguyễn Văn An"));
    fireEvent.click(ui.getByRole("button", { name: "Gọi tiếp", exact: true }));
    fireEvent.keyDown(document.body, { key: "Enter", code: "Enter" });
    assert.equal(document.querySelectorAll(".xm-giay__ten").length, 2);
    fireEvent.click(ui.getByRole("button", { name: "Về xóm", exact: true }));
    assert.ok(ui.getByText("2 em có mặt · 2 đã gọi", { exact: true }));
    const stored = JSON.parse(localStorage.getItem("ca-xom-classroom-v1"));
    assert.equal(stored.title, "Lớp 5A");
    assert.equal(stored.roster.length, 3);
    fireEvent.click(ui.getByRole("link", { name: "Về danh sách trò chơi" }));
    await waitFor(() =>
      assert.ok(ui.getByRole("heading", { name: "Kho trò chơi" })),
    );
    assert.equal(ui.getAllByRole("link", { name: /^Chơi / }).length, 6);
    const gameTitles = [
      "Mực Ơi, Đừng Dậy!",
      "Chọc Xoài Chấm Muối",
      "Thử Thách Linh Phù",
      "Cô Gọi Về Nhà",
      "Thiên Thạch Điểm Danh",
    ];
    for (const title of gameTitles) {
      fireEvent.click(
        ui.getByRole("link", { name: `Chơi ${title}`, exact: true }),
      );
      await waitFor(
        () =>
          assert.ok(ui.getByRole("button", { name: "Bắt đầu", exact: true })),
        { timeout: 15000 },
      );
      if (title === "Chọc Xoài Chấm Muối") {
        assert.deepEqual(
          Array.from(
            document.querySelectorAll(".mango-fruit-name"),
            (element) => element.textContent,
          ),
          stored.roster,
        );
        let fullscreenElement = null;
        Object.defineProperty(document, "fullscreenElement", {
          configurable: true,
          get: () => fullscreenElement,
        });
        document.documentElement.requestFullscreen = async function () {
          fullscreenElement = this;
          document.dispatchEvent(new Event("fullscreenchange"));
        };
        document.exitFullscreen = async () => {
          fullscreenElement = null;
          document.dispatchEvent(new Event("fullscreenchange"));
        };
        fireEvent.click(
          ui.getByRole("button", { name: "Toàn màn hình", exact: true }),
        );
        assert.equal(fullscreenElement, document.documentElement);
        assert.equal(
          ui
            .getByRole("button", { name: "Thu nhỏ", exact: true })
            .getAttribute("aria-pressed"),
          "true",
        );
        fireEvent.click(
          ui.getByRole("button", { name: "Thu nhỏ", exact: true }),
        );
        assert.equal(fullscreenElement, null);
        assert.equal(
          ui
            .getByRole("button", { name: "Toàn màn hình", exact: true })
            .getAttribute("aria-pressed"),
          "false",
        );
      }
      fireEvent.click(
        ui.getByRole("button", { name: "Điểm danh", exact: true }),
      );
      const studentRow = Array.from(
        document.querySelectorAll(".attendance-list li"),
      ).find((element) => element.textContent.includes("Trần Thị Mai"));
      assert.ok(studentRow);
      fireEvent.click(
        within(studentRow).getByRole("button", { name: "Gọi", exact: true }),
      );
      fireEvent.click(
        ui.getByRole("button", { name: "Tạm dừng", exact: true }),
      );
      const pause = ui.getByRole("dialog", { name: "Tạm dừng một chút" });
      fireEvent.click(
        within(pause).getByRole("button", { name: "Tiếp tục", exact: true }),
      );
      fireEvent.click(
        ui.getByRole("button", { name: "Xem ngay kết quả Enter" }),
      );
      assert.equal(
        document.querySelector(".picker-result-names").textContent,
        "Trần Thị Mai",
      );
      if (title === "Chọc Xoài Chấm Muối")
        assert.equal(
          document.querySelector(".mango-fruit.is-selected .mango-fruit-name")
            .textContent,
          "Trần Thị Mai",
        );
      fireEvent.click(
        ui.getByRole("button", { name: "Gọi tiếp", exact: true }),
      );
      fireEvent.click(
        ui.getByRole("button", { name: "Xem ngay kết quả Enter" }),
      );
      assert.notEqual(
        document.querySelector(".picker-result-names").textContent,
        "Trần Thị Mai",
      );
      fireEvent.click(
        ui.getByRole("button", { name: "Về sân chơi", exact: true }),
      );
      assert.ok(ui.getByText(/^3 em có mặt · 2 đã gọi/));
      fireEvent.click(ui.getByRole("link", { name: "Về danh sách trò chơi" }));
      await waitFor(() =>
        assert.ok(ui.getByRole("heading", { name: "Kho trò chơi" })),
      );
      assert.ok(ui.getByText("Lớp 5A", { exact: true }));
    }
    fireEvent.change(ui.getByRole("searchbox", { name: "Tìm trò chơi" }), {
      target: { value: "xoai" },
    });
    assert.equal(ui.getAllByRole("link", { name: /^Chơi / }).length, 1);
    fireEvent.change(ui.getByRole("searchbox", { name: "Tìm trò chơi" }), {
      target: { value: "MUC OI DUNG DAY" },
    });
    assert.ok(
      ui.getByRole("link", { name: "Chơi Mực Ơi, Đừng Dậy!", exact: true }),
    );
    fireEvent.change(ui.getByRole("searchbox", { name: "Tìm trò chơi" }), {
      target: { value: "không có game này" },
    });
    assert.ok(ui.getByText("Chưa tìm thấy trò chơi phù hợp."));
    fireEvent.click(ui.getByRole("button", { name: "Xem tất cả trò chơi" }));
    assert.equal(ui.getAllByRole("link", { name: /^Chơi / }).length, 6);
    assert.deepEqual(errors, []);
  } finally {
    await act(async () => cleanup());
    console.error = originalError;
    dom.window.close();
    for (const [key, descriptor] of replaced)
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
  }
});

import { createElement, StrictMode } from "react";
const AppElement = (App) => createElement(StrictMode, null, createElement(App));
