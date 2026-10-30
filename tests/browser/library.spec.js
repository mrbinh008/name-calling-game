import { test, expect } from "@playwright/test";

test("thư viện hiển thị sáu game và tìm kiếm không dấu trên điện thoại", async ({
  page,
}) => {
  await page.goto("/");
  for (const width of [1440, 768, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole("link", { name: /^Chơi / })).toHaveCount(6);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
    await page.screenshot({
      path: `test-results/library-${width}.png`,
      fullPage: true,
    });
  }
  await page
    .getByRole("searchbox", { name: "Tìm trò chơi" })
    .fill("muc oi dung day");
  await expect(page.getByRole("link", { name: /^Chơi / })).toHaveCount(1);
  await expect(
    page.getByRole("link", { name: "Chơi Mực Ơi, Đừng Dậy!", exact: true }),
  ).toBeVisible();
});

for (const [id, title] of [
  ["dog-chase", "Mực Ơi, Đừng Dậy!"],
  ["mango-poke", "Chọc Xoài Chấm Muối"],
  ["jiangshi", "Thử Thách Linh Phù"],
  ["parent-call", "Cô Gọi Về Nhà"],
  ["meteor", "Thiên Thạch Điểm Danh"],
]) {
  test(`${id}: mở từ thư viện, gọi đúng học sinh, tạm dừng và quay về`, async ({
    page,
  }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400)
        errors.push(`${response.status()} ${response.url()}`);
    });
    await page.goto("/");
    await page
      .getByRole("link", { name: `Chơi ${title}`, exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Bắt đầu", exact: true }),
    ).toBeVisible();
    for (const width of [1440, 768, 320]) {
      await page.setViewportSize({ width, height: 900 });
      for (const name of ["Bắt đầu", "Danh sách lớp", "Điểm danh"]) {
        await expect(
          page.getByRole("button", { name, exact: true }),
        ).toBeInViewport();
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width);
    }
    await page.getByRole("button", { name: "Điểm danh", exact: true }).click();
    await page
      .locator(".attendance-list li")
      .filter({ hasText: "Bùi Khánh Linh" })
      .getByRole("button", { name: "Gọi", exact: true })
      .click();
    await page.getByRole("button", { name: "Tạm dừng", exact: true }).click();
    const pause = page.getByRole("dialog", { name: "Tạm dừng một chút" });
    await expect(pause).toBeVisible();
    await pause.getByRole("button", { name: "Tiếp tục", exact: true }).click();
    await page.getByRole("button", { name: "Xem ngay kết quả Enter" }).click();
    await expect(page.locator(".picker-result-names")).toHaveText(
      "Bùi Khánh Linh",
    );
    await page
      .getByRole("button", { name: "Về sân chơi", exact: true })
      .click();
    await page.getByRole("link", { name: "Về danh sách trò chơi" }).click();
    await expect(
      page.getByRole("heading", { name: "Kho trò chơi" }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
}
