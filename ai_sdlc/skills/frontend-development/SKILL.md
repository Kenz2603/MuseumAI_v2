---
name: frontend-development
description: Phát triển giao diện React và Vite cho hệ thống MuseumAI theo Use Case và RBAC.
---

# Frontend Development Skill – MuseumAI

## Technology

- React
- Vite

## Authentication

Frontend sử dụng access token do Backend cấp.

## Authorization

Frontend có thể hiển thị hoặc ẩn chức năng theo role.

Frontend không thay thế kiểm tra quyền ở Backend.

## Roles

- Admin
- Content Staff
- Ticket Staff

## AI

Các chức năng AI:

- Sinh nội dung thuyết minh.
- AI hỏi đáp thông tin bảo tàng.
- AI phân tích phản hồi.

GOOGLE_API_KEY không được đặt trong Frontend.

## Ticket

Frontend không được tự quyết định giá vé.

Giá vé phải lấy từ Backend.

## Quy tắc

1. Không tạo chức năng ngoài Use Case.
2. Không hard-code quyền thay cho Backend.
3. Không lưu hoặc expose GOOGLE_API_KEY.
4. Không cho Client tự thay đổi giá vé.
5. Xử lý lỗi API rõ ràng.
6. UI phải phản ánh trạng thái xác thực và quyền người dùng.

## Output

- React components
- Pages
- Forms
- API integration
- Authentication state
- Role-based UI
- Error handling
