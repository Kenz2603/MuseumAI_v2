---
name: requirement-analysis
description: Phân tích đặc tả yêu cầu của hệ thống MuseumAI, bao gồm Actor, Use Case, Functional Requirement, Business Rule và RBAC.
---

# Requirement Analysis Skill – MuseumAI

## Mục tiêu

Phân tích và kiểm tra yêu cầu của hệ thống MuseumAI dựa trên đặc tả yêu cầu của đồ án.

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

## Quy tắc phân tích

1. Chỉ sử dụng yêu cầu đã có trong đặc tả.
2. Không tự tạo nghiệp vụ mới.
3. Không tự thay đổi Actor.
4. Kiểm tra quyền của từng Role.
5. Kiểm tra Business Rule.
6. Kiểm tra quan hệ giữa Use Case và Actor.
7. Nếu yêu cầu chưa rõ, đánh dấu [NEEDS HUMAN REVIEW].
8. Không tự quyết định thay cho người dùng hoặc nhóm phát triển.

## RBAC

Kiểm tra quyền của:

- Admin
- Content Staff
- Ticket Staff

## Business Rules

- Giá vé được quyết định ở Backend.
- Client không được tự thay đổi giá vé.
- Backend phải kiểm tra RBAC.
- AI không tự thay đổi dữ liệu nghiệp vụ.
- Nội dung AI phải được nhân viên kiểm tra trước khi sử dụng chính thức.

## Output

- Requirements
- Use Cases
- Business Rules
- RBAC
- Acceptance Criteria
- Human Review items
