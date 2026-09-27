---
name: code-review
description: Review code MuseumAI theo yêu cầu, kiến trúc, bảo mật, RBAC và Business Rule.
---

# Code Review Skill – MuseumAI

## Mục tiêu

Kiểm tra code trước khi được xem là hoàn thành.

## Review Areas

### Requirement

Kiểm tra code có đúng đặc tả hay không.

### Architecture

Kiểm tra:

- React
- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic

### Authentication

Kiểm tra JWT và access token.

### Authorization

Kiểm tra RBAC ở Backend.

### Business Rules

Kiểm tra:

- Giá vé do Backend quyết định.
- Client không được thay đổi giá vé.
- AI không tự thay đổi dữ liệu nghiệp vụ.

### Security

Kiểm tra:

- Không expose GOOGLE_API_KEY.
- Không tin dữ liệu quyền từ Client.
- Không bỏ qua authorization.

### AI

Kiểm tra kết nối và xử lý Gemini AI API.

## Quy tắc

1. Không tự thay đổi nghiệp vụ.
2. Không tự thêm chức năng.
3. Phân biệt lỗi thực tế với đề xuất cải tiến.
4. Vấn đề chưa chắc chắn phải được đánh dấu Human Review.

## Output

- Findings
- Severity
- Evidence
- Suggested Fix
- Human Review
