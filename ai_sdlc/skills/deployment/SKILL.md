---
name: deployment
description: Kiểm tra và hỗ trợ triển khai MuseumAI với Frontend, Backend, PostgreSQL và Railway.
---

# Deployment Skill – MuseumAI

## Components

### Frontend

React/Vite application.

### Backend

FastAPI application.

### Database

PostgreSQL.

### Deployment

Railway.

### AI

Google Gemini API.

## Environment Configuration

Backend cần cấu hình các biến môi trường cần thiết cho:

- Database
- JWT
- Gemini AI

GOOGLE_API_KEY chỉ được cấu hình ở Backend.

Frontend sử dụng URL của Backend API.

## Verification

Kiểm tra:

- Backend health.
- Frontend gọi Backend.
- CORS.
- Authentication.
- API.
- Database connection.
- Gemini AI connection.

## Quy tắc

1. Không đưa secret vào source code.
2. Không đưa GOOGLE_API_KEY vào Frontend.
3. Không thay đổi nghiệp vụ trong deployment.
4. Kiểm tra environment variables.
5. Kiểm tra Backend trước các chức năng Frontend phụ thuộc Backend.

## Output

- Deployment checklist
- Environment checklist
- Health check
- API verification
- AI connection verification
- Deployment issues
