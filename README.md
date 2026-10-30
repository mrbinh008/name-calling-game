# Lớp mình chơi — React + TypeScript

Kho trò chơi lớp học viết tiếp trên source React hiện tại từ các bản build được cung cấp. Toàn bộ ứng dụng dùng TypeScript/TSX strict, tên biến và hàm bằng tiếng Anh; giao diện và lời thoại bằng tiếng Việt. Không cần backend hay tài khoản hệ thống cũ.

## Chạy

Dùng Node.js 24 trở lên:

```bash
npm install
npm run dev
```

Mở `http://localhost:5173` để xem danh sách sáu game. Có tìm kiếm không dấu, nhập danh sách lớp và liên kết riêng cho từng trò chơi:

| Game                  | Đường dẫn                 |
| --------------------- | ------------------------- |
| Cả Xóm Trốn Trả Bài   | `/#/games/village-summon` |
| Mực Ơi, Đừng Dậy!     | `/#/games/dog-chase`      |
| Chọc Xoài Chấm Muối   | `/#/games/mango-poke`     |
| Thử Thách Linh Phù    | `/#/games/jiangshi`       |
| Cô Gọi Về Nhà         | `/#/games/parent-call`    |
| Thiên Thạch Điểm Danh | `/#/games/meteor`         |

Năm game mới dùng ảnh, sprite và âm thanh từ `dog-chase/`, `game1/`, `game2/`; hoạt cảnh được viết lại trong TypeScript. Đây là các bản dựng lại có thể bảo trì, không cam kết khớp từng khung hình hoặc toàn bộ kịch bản của bản build cũ. Game Cô Gọi Về Nhà mô phỏng cuộc trò chuyện ngay trong Canvas, không gửi tin nhắn hoặc gọi điện thật.

## Danh sách lớp và cách chơi

Nhấn **Danh sách lớp**, nhập tên lớp và mỗi dòng một học sinh, tối đa 60 em, không trùng cả họ tên. Có thể thêm giới tính để chọn nhân vật:

```text
Nguyễn Văn An | nam
Trần Thị Mai | nữ
Lê Minh Bảo
```

Tên lớp, danh sách, giới tính và tùy chọn âm thanh lưu trên trình duyệt, dùng chung cho sáu game. Lần đầu dùng lớp minh họa. Trạng thái vắng và lịch sử gọi thuộc phiên chơi hiện tại; đổi game hoặc lưu danh sách sẽ tạo phiên mới.

- Chọn **Bắt đầu** (hoặc **Gọi tên** trong game xóm). Game xóm chọn 1–5 em, linh phù chọn 1–2 em, các game khác chọn một em mỗi lượt.
- **Điểm danh** để đánh dấu vắng hoặc bấm **Gọi** cạnh tên để chọn đúng một em. Lượt chọn ngẫu nhiên bỏ qua học sinh vắng và những em đã gọi, đến khi hết vòng.
- **Enter/Space** khi chờ: bắt đầu. Trong hoạt cảnh: **Space/P** tạm dừng, **Enter** xem ngay kết quả. Các phím tắt không can thiệp khi đang nhập liệu hoặc thao tác nút, hộp thoại.
- **Gọi tiếp** mở lượt mới; **Về sân chơi/Về xóm** ghi nhận kết quả và trở lại màn hình chờ. Dùng mũi tên trên đầu trang để về thư viện.
- Chuyển tab tự tạm dừng. Có bật/tắt âm thanh, toàn màn hình và bỏ qua hoạt cảnh. Trong game xóm còn có thể bấm nhà để gọi đúng em hoặc giữ 650 ms để đánh dấu vắng.

Game **Chọc Xoài** hiển thị một quả xoài trên cây cho mỗi học sinh, ghi nguyên họ tên (tối đa 60 quả). Quả xoài phân biệt em vắng/đã gọi và làm nổi bật người được chọn từ lúc xoài rụng. Tán cây tự cuộn tới quả được chọn khi cần. Trên màn hình nhỏ, có thể cuộn vùng cây bằng chuột, cảm ứng hoặc bàn phím để xem đủ tên. Thanh điều khiển gọn ở đầu/cuối màn hình; nút **Toàn màn hình** mở chế độ trình chiếu, **Thu nhỏ** hoặc Escape thoát ra. Cảnh nền phủ kín viewport khi đổi kích thước, màn hình dọc hoặc màn hình siêu rộng.

## Cấu trúc source

| Đường dẫn                              | Trách nhiệm                                          |
| -------------------------------------- | ---------------------------------------------------- |
| `src/App.tsx`                          | Định tuyến hash, cấu hình lớp chung, tải game khi mở |
| `src/components/GameLibrary.tsx`       | Thư viện, tìm kiếm và liên kết game                  |
| `src/components/`                      | Game xóm, danh sách lớp, điểm danh, hộp thoại        |
| `src/games/catalog.ts`                 | ID, tiêu đề, ảnh đại diện và cấu hình sáu game       |
| `src/games/AnimatedGame.tsx`           | Giao diện dùng chung cho năm game mới                |
| `src/games/scenes/`                    | Hoạt cảnh riêng của từng game mới                    |
| `src/games/shared/selection.ts`        | Chọn học sinh, tránh lặp và loại học sinh vắng       |
| `src/games/shared/usePickerSession.ts` | Trạng thái lượt chơi, kết quả và tạm dừng            |
| `src/games/shared/useAnimatedScene.ts` | Tải cảnh, vòng vẽ, resize, dọn tài nguyên            |
| `src/games/shared/AnimatedScene.ts`    | Timeline, nhân vật, tín hiệu âm thanh và kết thúc    |
| `src/games/shared/CanvasPainter.ts`    | Vẽ ảnh, atlas sprite, tên và hội thoại               |
| `src/games/shared/PickerAudio.ts`      | Nhạc nền, hiệu ứng và âm thanh tổng hợp              |
| `src/games/assets/`                    | Metadata sprite chuẩn hóa, kiểm tra trước khi tải    |
| `src/game/`, `src/hooks/useGame.ts`    | Engine và trạng thái game xóm đã có                  |
| `src/lib/classroom.ts`                 | Xác thực danh sách, lưu/đọc localStorage             |
| `public/games/`, `public/cuong-thi/`   | Tài nguyên cục bộ, không phụ thuộc website cũ        |
| `public/images/games/`                 | Sáu ảnh đại diện thư viện                            |

Giữ nguyên bản build đầu vào `_next/`, `game/`, `gv/`, `dog-chase/`, `game1/`, `game2/`. Ứng dụng không nạp chunk Next.js hay gọi API cũ. Mỗi hoạt cảnh được tải riêng khi mở game; thư viện không tải tất cả sprite cùng lúc. Một số game chỉ hiển thị tối đa 12 nhân vật (chọc xoài 3); người được chọn luôn có trong cảnh, kết quả hiển thị đầy đủ họ tên.

`scripts/import-game-assets.mjs` sao chép tài nguyên từ `game2/pomyai.com/` và tạo metadata chuẩn hóa. Chạy `node scripts/import-game-assets.mjs` khi cần nhập lại tài nguyên, sau đó định dạng JSON bằng Prettier. Công cụ chỉ dành cho bản build cục bộ đã cung cấp; không cần chạy khi phát triển bình thường.

`scripts/recover-engine.mjs` phục hồi tài liệu JavaScript tham chiếu của game xóm vào `reference/recovered-build/`, không ghi đè source TypeScript.

## Kiểm tra và build

```bash
npm test
npm run typecheck
npm run format:check
npm run build
npm run preview
```

Test bao gồm quy tắc chọn học sinh, xác thực danh sách, các luồng React với sáu game, tạm dừng, kết quả, tìm kiếm và dọn âm thanh. Bộ vẽ Canvas tải sprite thật cho cả sáu game; ảnh kiểm tra nằm trong `test-results/`. Đây là ảnh Canvas, không phải ảnh chụp toàn bộ giao diện trình duyệt. Game xóm còn có dữ liệu đối chiếu 15 bố cục/timeline và 729 thao tác Web Audio để giữ hành vi đã khôi phục.

Build chạy TypeScript strict với `noUnusedLocals`, `noUnusedParameters` trước Vite. Source không dùng `any` hoặc tắt kiểm tra kiểu.

Kiểm tra trình duyệt trên máy có Chromium:

```bash
npx playwright install chromium
npm run test:e2e
```

Có thể dùng `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` để chỉ định Chromium có sẵn. Các bài kiểm tra trình duyệt bao gồm thư viện, tìm kiếm, các kích thước 320–1440 px và luồng chơi. Sandbox của môi trường thực hiện chặn localhost/Chromium nên chưa chạy được E2E trình duyệt tại đây; DOM, Canvas, TypeScript và build được kiểm tra riêng.

Build sản xuất nằm trong `dist/`. Đưa nội dung này lên hosting tĩnh qua HTTP/HTTPS. Dùng định tuyến hash nên hosting không cần fallback cho từng game. Cấu hình phục vụ ở gốc tên miền (`base: '/'`); nếu đặt trong thư mục con, cần đổi `base` và tiền tố URL ảnh/font tương ứng. Không mở `dist/index.html` bằng `file://`.
