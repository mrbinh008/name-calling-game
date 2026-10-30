import { test, expect } from "@playwright/test";

async function openVillage(page) {
  await page.goto("/#/games/village-summon");
  await expect(
    page.getByRole("button", { name: "Gọi tên", exact: true }),
  ).toBeVisible();
}

test("tải đầy đủ hoạt cảnh và giao diện ở các kích thước màn hình", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });
  await openVillage(page);
  await expect(page.getByText("Lớp minh họa", { exact: true })).toBeVisible();
  for (const [width, height] of [
    [1440, 900],
    [1024, 768],
    [768, 1024],
    [320, 720],
  ]) {
    await page.setViewportSize({ width, height });
    await page.screenshot({ path: `test-results/village-${width}.png` });
    for (const name of ["Gọi tên", "Danh sách lớp", "Điểm danh"]) {
      const rect = await page
        .getByRole("button", { name, exact: true })
        .boundingBox();
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.width).toBeLessThanOrEqual(width + 1);
      expect(rect.y + rect.height).toBeLessThanOrEqual(height);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
  }
  expect(errors).toEqual([]);
});

test("nhập lớp, xác thực, lưu lại và loại học sinh vắng khỏi kết quả", async ({
  page,
}) => {
  await openVillage(page);
  await page
    .getByRole("button", { name: "Danh sách lớp", exact: true })
    .click();
  await page.getByRole("textbox", { name: "Học sinh" }).fill("An\nAn");
  await page.getByRole("button", { name: "Lưu danh sách" }).click();
  await expect(page.getByRole("alert")).toContainText("bị trùng");
  await page.getByRole("textbox", { name: "Tên lớp" }).fill("Lớp 5A");
  await page
    .getByRole("textbox", { name: "Học sinh" })
    .fill("Nguyễn Văn An | nam\nTrần Thị Mai | nữ\nLê Minh Bảo | nam");
  await page.getByRole("button", { name: "Lưu danh sách" }).click();
  await expect(
    page.getByRole("button", { name: "Gọi tên", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByText("Lớp 5A · 3 em", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Điểm danh", exact: true }).click();
  await page.getByRole("checkbox", { name: "Nguyễn Văn An" }).uncheck();
  await page.getByRole("button", { name: "Xong · 2 em có mặt" }).click();
  await page.getByRole("button", { name: "Gọi 2 em", exact: true }).click();
  await page.getByRole("button", { name: "Gọi tên", exact: true }).click();
  await page.getByRole("button", { name: "Xem ngay kết quả Enter" }).click();
  const result = page.getByRole("dialog", { name: "GIẤY TRIỆU TẬP" });
  await expect(result.locator(".xm-giay__ten")).toHaveCount(2);
  await expect(result).toContainText("Trần Thị Mai");
  await expect(result).toContainText("Lê Minh Bảo");
  await expect(result).not.toContainText("Nguyễn Văn An");
  await page.getByRole("button", { name: "Gọi tiếp", exact: true }).click();
  await page.getByRole("button", { name: "Xem ngay kết quả Enter" }).click();
  await expect(result.locator(".xm-giay__ten")).toHaveCount(2);
  await page.getByRole("button", { name: "Về xóm", exact: true }).click();
  await expect(
    page.getByText("2 em có mặt · 2 đã gọi", { exact: true }),
  ).toBeVisible();
});

test("bàn phím, tạm dừng, âm thanh và gọi đúng em", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openVillage(page);
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Tạm dừng", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("heading", { name: "Xóm đang nghỉ một chút" }),
  ).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("dialog", { name: "GIẤY TRIỆU TẬP" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Gọi tên", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Tắt âm thanh", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Bật âm thanh", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Điểm danh", exact: true }).click();
  await page
    .locator(".attendance-list li")
    .filter({ hasText: "Bùi Khánh Linh" })
    .getByRole("button", { name: "Gọi", exact: true })
    .click();
  await page.keyboard.press("Enter");
  await expect(page.locator(".xm-giay__ten")).toHaveText("Bùi Khánh Linh");
  expect(errors).toEqual([]);
});

test("hoạt cảnh tự chạy đến giấy triệu tập, không cần bỏ qua", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openVillage(page);
  await page.getByRole("button", { name: "Gọi tên", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "GIẤY TRIỆU TẬP" }),
  ).toBeVisible({ timeout: 50000 });
  await expect(page.locator(".xm-giay__ten")).toHaveCount(1);
  await page.screenshot({ path: "test-results/summons-result.png" });
  expect(errors).toEqual([]);
});
