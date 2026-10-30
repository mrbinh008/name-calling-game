# Lớp mình chơi — source React + TypeScript

Viết tiếp source hiện tại thành thư viện game lớp học từ các bản build cục bộ. Giữ game xóm đã khôi phục và bổ sung năm game có đủ mã/tài nguyên chơi trong các thư mục đầu vào.

## Phạm vi

- Trang chính có sáu thẻ game, ảnh gốc, tìm kiếm không dấu và chỉnh danh sách lớp chung.
- Game: `village-summon`, `dog-chase`, `mango-poke`, `jiangshi`, `parent-call`, `meteor`. Mỗi game có đường dẫn hash riêng và liên kết về thư viện.
- Các thư mục `game1/` và `game2/` là gói build, không phải ID trò chơi. Chỉ thêm game có bản chơi và tài nguyên được cung cấp; các thẻ quảng bá không đủ bản chơi nằm ngoài phạm vi.
- Năm hoạt cảnh mới được viết lại bằng TypeScript với tài nguyên gốc, có giao diện dùng chung và engine riêng từng cảnh. Không cam kết đối chiếu khung hình/timeline nguyên bản của năm game mới.
- Giữ nguyên các thư mục build đầu vào. Source trong `src/`, tài nguyên độc lập trong `public/`, test trong `tests/`.

## Hành vi

- React/TSX, TypeScript strict, biến/hàm tiếng Anh. Tiếng Việt cho nội dung giao diện; giữ tên tệp asset gốc.
- Tên lớp và danh sách tối đa 60 học sinh không trùng họ tên, giới tính tùy chọn, lưu cục bộ. Dùng lớp minh họa khi chưa nhập. Không gọi backend cũ.
- Danh sách và tùy chọn âm thanh dùng chung; vắng và lịch sử gọi tồn tại trong phiên game hiện tại. Đổi game hoặc lưu lớp tạo phiên mới.
- Chọn ngẫu nhiên loại học sinh vắng và tránh gọi lặp đến hết vòng. Điểm danh cho phép chọn đúng một em có mặt. Xóm chọn 1–5 em; linh phù 1–2; các game còn lại một em/lượt.
- Mọi game có màn hình chờ, hoạt cảnh, kết quả đủ họ tên, gọi tiếp, về sân chơi, tạm dừng, bỏ qua, âm thanh và toàn màn hình. Chuyển tab tự tạm dừng. Người được chọn phải có trong số nhân vật hiển thị.
- Riêng chọc xoài: mỗi học sinh có một quả xoài trên cây ghi đầy đủ họ tên, kể cả lớp 60 em. Hiển thị trạng thái vắng/đã gọi, chỉ làm nổi bật người được chọn từ lúc quả rụng. Vùng cây cuộn được khi cần, tự đưa quả được chọn vào tầm nhìn. Nền phủ kín viewport, điều khiển gọn và nút toàn màn hình có chữ, đồng bộ khi thoát bằng Escape.
- Tải code/ảnh từng game khi cần, có trạng thái tải, báo lỗi và thử lại. Dọn animation frame, observer, âm thanh khi rời game.
- Game gọi phụ huynh chỉ mô phỏng giao diện; không gửi tin nhắn hay tạo cuộc gọi thật.

## Xác minh

- Test chọn học sinh, danh sách, vắng, hết vòng và chọn đích.
- Test DOM: nhập/lưu lớp, chuyển từ thư viện sang từng game, tạm dừng, bỏ qua, gọi tiếp không lặp và tìm kiếm.
- Canvas với ảnh thật: tải năm bộ asset mới, vẽ các giai đoạn, tạm dừng, kết thúc một lần, viewport nhỏ. Game xóm giữ đối chiếu 15 bố cục/timeline, 729 thao tác âm thanh.
- Test âm thanh: tắt tiếng, dùng lại nhạc nền và dừng/dọn khi rời game.
- Browser test: thư viện và game ở màn hình nhỏ/lớn, mở game, chọn học sinh, kết quả; chạy trên máy hỗ trợ localhost/Chromium. Không thay DOM test bằng tuyên bố đã kiểm tra trình duyệt.
- Lệnh bắt buộc: `npm test`, `npm run typecheck`, `npm run format:check`, `npm run build`. Không xuất bản ngoài workspace.
