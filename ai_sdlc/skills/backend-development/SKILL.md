---
name: backend-development
description: Phát triển và kiểm tra Backend MuseumAI bằng FastAPI, SQLAlchemy, PostgreSQL, Alembic, JWT và RBAC.
---

# Backend Development Skill – MuseumAI

## Technology

- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic
- JWT
- RBAC

## Authentication

Backend sử dụng JWT cho authentication.

## Authorization

Backend phải kiểm tra RBAC.

Không chỉ dựa vào Frontend để bảo vệ quyền truy cập.

## Business Rules

### Ticket

Giá vé phải được Backend quyết định.

Client không được tự thay đổi giá vé.

- Vé thường: 50.000 VNĐ
- Vé sinh viên: 25.000 VNĐ
- Vé trẻ em: 10.000 VNĐ

### AI

Backend xử lý kết nối với Gemini AI API.

GOOGLE_API_KEY không được đưa vào Frontend.

AI không được tự ý thay đổi dữ liệu nghiệp vụ.

## Database

- PostgreSQL
- SQLAlchemy
- Alembic

Mọi thay đổi cấu trúc database phải được quản lý bằng migration.

## Quy tắc

1. Không thay đổi nghiệp vụ nếu chưa có yêu cầu.
2. Không bỏ qua authentication.
3. Không bỏ qua authorization.
4. Không tin dữ liệu quyền hạn do Client gửi lên.
5. Không để Client quyết định giá vé.
6. Không expose API key.
7. Không sửa database trực tiếp thay cho migration.

## Output

- API
- Authentication
- Authorization
- Validation
- Database logic
- Migration
- Error handling
