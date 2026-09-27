---
name: uml-design
description: Thiết kế và kiểm tra UML cho hệ thống MuseumAI dựa trên đặc tả yêu cầu.
---

# UML Design Skill – MuseumAI

## Mục tiêu

Thiết kế và kiểm tra các mô hình UML của MuseumAI dựa trên yêu cầu đã được xác định.

## Mô hình

- Use Case Diagram
- Use Case Decomposition
- Activity Diagram
- Class Diagram
- Sequence Diagram

## Quy tắc

1. UML phải phản ánh yêu cầu của MuseumAI.
2. Không thêm Actor không có trong đặc tả.
3. Không thêm Use Case ngoài phạm vi đồ án.
4. Quan hệ giữa Actor và Use Case phải phù hợp với quyền truy cập.
5. Activity Diagram phải phản ánh luồng nghiệp vụ.
6. Class Diagram phải phản ánh thực thể và quan hệ của hệ thống.
7. Sequence Diagram phải phản ánh luồng xử lý.
8. Chức năng AI phải thể hiện tương tác với Gemini AI API.
9. Không tự tạo nghiệp vụ mới.

## AI

- UC010 – Sinh nội dung thuyết minh bằng AI
- UC011 – AI hỏi đáp thông tin bảo tàng
- UC012 – AI phân tích phản hồi

Gemini AI API là hệ thống bên ngoài được sử dụng cho các chức năng AI.

## Output

- UML Diagram
- Actor
- Use Case
- Relationship
- Main Flow
- Alternative Flow nếu đã được đặc tả
