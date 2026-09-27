# AGENTS.md – MuseumAI_v2

## Project

MuseumAI_v2 là hệ thống quản lý bảo tàng có tích hợp AI.

## Architecture

### Frontend
- React
- Vite

### Backend
- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic

### Authentication
- JWT

### Authorization
- RBAC

### AI
- Google Gemini API

### Deployment
- Railway

## Actors

- Admin
- Content Staff
- Ticket Staff
- Gemini AI API

## Use Cases

- UC001 – Đăng nhập
- UC002 – Quản lý người dùng và phân quyền
- UC003 – Quản lý hiện vật
- UC004 – Quản lý khu vực trưng bày
- UC005 – Quản lý triển lãm
- UC006 – Quản lý hiện vật trong triển lãm
- UC007 – Quản lý khách tham quan
- UC008 – Quản lý vé tham quan
- UC009 – Quản lý phản hồi
- UC010 – Sinh nội dung thuyết minh bằng AI
- UC011 – AI hỏi đáp thông tin bảo tàng
- UC012 – AI phân tích phản hồi

## Business Rules

- Backend quyết định giá vé.
- Client không được tự thay đổi giá vé.
- Admin quản lý tài khoản và phân quyền.
- Backend phải kiểm tra RBAC.
- AI không tự thay đổi dữ liệu nghiệp vụ.
- Nội dung AI phải được nhân viên kiểm tra trước khi sử dụng chính thức.
- Database changes phải có Alembic migration.
- GOOGLE_API_KEY không được đưa vào Frontend.

## AI-SDLC

Các Agent và Skill phục vụ quá trình phát triển được lưu tại:

ai_sdlc/

### Agents

- Requirement Agent
- Design Agent
- Coding Agent
- Testing Agent
- Critic Agent
- Deployment Agent

### Skills

- Requirement Analysis
- UML Design
- Backend Development
- Frontend Development
- Testing
- Code Review
- Deployment

## Agent – Skill Mapping

| Agent | Skills |
|---|---|
| Requirement Agent | Requirement Analysis |
| Design Agent | UML Design |
| Coding Agent | Backend Development, Frontend Development |
| Testing Agent | Testing |
| Critic Agent | Code Review, Requirement Analysis, UML Design |
| Deployment Agent | Deployment |

## AI-SDLC Workflow

Requirement Agent
→ Design Agent
→ Coding Agent
→ Testing Agent
→ Critic Agent
→ Deployment Agent

### Handoff Rules

1. Requirement Agent tạo requirement artifacts.
2. Design Agent sử dụng requirement artifacts để tạo design artifacts.
3. Coding Agent triển khai code dựa trên requirement và design đã xác nhận.
4. Testing Agent kiểm thử code dựa trên requirement và Business Rule.
5. Critic Agent kiểm tra tính nhất quán giữa requirement, design, code và test.
6. Deployment Agent chỉ triển khai phiên bản đã được kiểm tra.

Nếu Agent phát hiện thông tin không đủ để quyết định:

[NEEDS HUMAN REVIEW]

Agent không được tự thay đổi nghiệp vụ để giải quyết điểm chưa rõ.