import { test, expect } from "@playwright/test";

test("chọc xoài: đủ họ tên trên 60 quả, đổi kích thước và vào/thoát toàn màn hình", async ({
  page,
}) => {
  await page.goto("/#/games/mango-poke");
  await expect(
    page.getByRole("button", { name: "Bắt đầu", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Danh sách lớp", exact: true })
    .click();
  const roster = Array.from(
    { length: 60 },
    (_, index) => `Nguyễn Hoàng Minh Anh ${index + 1}`,
  );
  await page.getByRole("textbox", { name: "Học sinh" }).fill(roster.join("\n"));
  await page
    .getByRole("button", { name: "Lưu danh sách", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Bắt đầu", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".mango-fruit-name")).toHaveText(roster);
  for (const [width, height] of [
    [1920, 1080],
    [1440, 900],
    [768, 1024],
    [320, 720],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    await expect(
      page.getByRole("button", { name: "Toàn màn hình", exact: true }),
    ).toBeInViewport();
    await expect(
      page.getByRole("button", { name: "Bắt đầu", exact: true }),
    ).toBeInViewport();
    const tree = await page
      .getByRole("list", { name: "Xoài trên cây", exact: true })
      .boundingBox();
    expect(tree.height).toBeGreaterThan(40);
    expect(tree.y + tree.height).toBeLessThan(height);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
    await page.screenshot({ path: `test-results/mango-ui-${width}.png` });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page
    .getByRole("button", { name: "Toàn màn hình", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Thu nhỏ", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    await page.evaluate(
      () => document.fullscreenElement === document.documentElement,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Thu nhỏ", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Toàn màn hình", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
});
