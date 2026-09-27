---
name: testing
description: Kiểm thử hệ thống MuseumAI theo yêu cầu, Business Rule, API, RBAC và chức năng AI.
---

# Testing Skill – MuseumAI

## Mục tiêu

Kiểm tra hệ thống MuseumAI dựa trên yêu cầu và nghiệp vụ đã được xác định.

## Phạm vi

- Authentication
- Authorization
- API
- Business Rule
- Database interaction
- AI functionality
- Frontend integration

## Authentication Tests

Kiểm tra:

- Đăng nhập hợp lệ.
- Đăng nhập không hợp lệ.
- Access token.
- Request yêu cầu xác thực.

## RBAC Tests

Kiểm tra quyền của:

- Admin
- Content Staff
- Ticket Staff

## Ticket Tests

Kiểm tra:

- Backend quyết định giá vé.
- Client không thể tự thay đổi giá vé.

Giá vé:

- Thường: 50.000 VNĐ
- Sinh viên: 25.000 VNĐ
- Trẻ em: 10.000 VNĐ

## AI Tests

Kiểm tra:

- Kết nối Gemini AI API.
- Sinh nội dung thuyết minh.
- AI hỏi đáp.
- AI phân tích phản hồi.

Kiểm tra trường hợp AI không khả dụng và cách hệ thống xử lý lỗi.

## Quy tắc

1. Test phải dựa trên yêu cầu đã có.
2. Không tạo test cho nghiệp vụ chưa được đặc tả.
3. Kiểm tra trường hợp thành công và lỗi.
4. Kiểm tra quyền ở Backend.
5. Kiểm tra Business Rule.

## Output

- Test Case
- Test Result
- Expected Result
- Actual Result
- Pass/Fail
- Defect
