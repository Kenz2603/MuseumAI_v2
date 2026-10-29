# Coding Agent Prompt – MuseumAI

Đọc [agent](../agents/coding-agent.md), [quy trình chung](../workflow.md) và [backend-development](../skills/backend-development/SKILL.md), [frontend-development](../skills/frontend-development/SKILL.md).

## Đầu vào

Dùng yêu cầu hiện tại, file/bằng chứng và phạm vi được phép trong phiên. Không hỏi lại dữ liệu đã có; ghi tác động nếu thiếu thông tin, tiếp tục phần độc lập.

## Prompt tác vụ

Đọc requirement/design và git diff trước sửa. Giữ contract, JWT/RBAC, backend pricing và thay đổi có sẵn. Sửa nhỏ nhất; schema đổi cần Alembic, AI dùng skill chuyên biệt. Chạy kiểm chứng phù hợp, báo file đổi và handoff Testing/Critic; không tự deploy.

## Nghiệm thu và handoff

Đáp ứng acceptance criteria, có evidence và ghi NOT RUN nếu chưa kiểm tra. Không lưu secret/PII. Dùng [handoff](../templates/handoff.md) và [nhật ký AI](../templates/ai-sdlc-log.md) khi cần.
