---
name: security-review
description: Rà soát ranh giới dữ liệu và quyền trong JWT, RBAC, upload, Gemini và cấu hình triển khai MuseumAI.
---

# Security Review

Đọc [quy trình chung](../../workflow.md). Lập data flow từ UI → API → database/Gemini và ranh giới local/production. Review theo hành động, đối tượng và dữ liệu trả về.

## Trọng điểm của MuseumAI

- `core/security.py`, `core/dependencies.py`: token hết hạn/sai, user bị khóa, role thiếu; không tin role từ payload client hoặc localStorage.
- Router người dùng chỉ Admin; kiểm tra chống tự nâng quyền và truy cập bản ghi ngoài quyền.
- `routers/dashboard.py`: backend không query/trả số liệu ngoài quyền; UI phải phân biệt `null` với số 0, ẩn thẻ không được xem.
- `routers/tickets.py`: giá tính ở backend, không nhận giá tùy ý của client.
- Upload: loại file, kích thước, tên/path traversal, static serving, dữ liệu trong volume. Không thay đổi/xóa ảnh thật chỉ để thử lỗi.
- Gemini: lọc/ẩn tên, email, điện thoại và dữ liệu không cần cho tác vụ trước khi gửi; không coi che PII trên UI là đã che payload. Kiểm tra prompt injection trong feedback/hiện vật và nội dung log.
- CORS dùng origin cần thiết; các biến `VITE_*` đều công khai trong bundle. Không để secret, dotenv hoặc private key vào Git, Docker context hoặc log.
- Startup seed có thể tạo tài khoản mặc định; đánh giá từ source mà không in mật khẩu hoặc chạy seed.

## Bằng chứng và xử lý

Negative test dùng user/fixture test riêng, không tài khoản hay database production. Chỉ chạy scanner hoặc gọi đích thật khi tác vụ cho phép; không tạo traffic kiểm tra bảo mật ngoài phạm vi.

Mỗi finding ghi severity, file/line hoặc request đã che dữ liệu, điều kiện khai thác, ảnh hưởng, cách sửa và test chứng minh. Nếu gặp secret, chỉ báo loại và vị trí; đề xuất thu hồi/rotate theo chủ sở hữu, không tự in hoặc luân chuyển secret. Phân biệt việc chưa kiểm chứng với finding đã tái hiện.
