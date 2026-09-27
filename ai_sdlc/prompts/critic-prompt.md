# Critic Prompt – MuseumAI

Review và phản biện MuseumAI dựa trên requirements, design và code hiện tại.

## Kiểm tra

- Requirement compliance.
- Architecture.
- Authentication.
- Authorization và RBAC.
- Business Rules.
- Database và Alembic migration.
- Backend và Frontend consistency.
- Security.
- AI integration.
- Error handling.

## Business Rules cần kiểm tra

- Backend phải kiểm tra RBAC.
- Client không được tự quyết định giá vé.
- Giá vé phải được Backend xác định.
- AI không được tự ý thay đổi dữ liệu nghiệp vụ.
- Nội dung AI phải được nhân viên kiểm tra trước khi sử dụng chính thức.
- GOOGLE_API_KEY không được xuất hiện ở Frontend.
- Database changes phải có Alembic migration.

## Quy tắc

1. Không tự thay đổi nghiệp vụ.
2. Không tự thêm chức năng ngoài đặc tả.
3. Phân biệt lỗi thực tế với đề xuất cải tiến.
4. Mỗi vấn đề phải có Evidence.
5. Nếu chưa đủ bằng chứng để kết luận, đánh dấu:

[NEEDS HUMAN REVIEW]

## Output

Mỗi vấn đề cần ghi:

- Finding
- Evidence
- Severity
- Suggested Fix
- Human Review (nếu cần)