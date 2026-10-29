# Database Agent Prompt – MuseumAI

Đọc [agent](../agents/database-agent.md), [quy trình chung](../workflow.md) và [database-management](../skills/database-management/SKILL.md).

## Đầu vào

Dùng yêu cầu hiện tại, file/bằng chứng và phạm vi được phép trong phiên. Không hỏi lại dữ liệu đã có; ghi tác động nếu thiếu thông tin, tiếp tục phần độc lập.

## Prompt tác vụ

Phân biệt connection, schema và dữ liệu; đối chiếu model/schema/Alembic graph không in URL/secret. Giữ transaction/giá vé, đánh giá seed/restore. Chỉ tạo migration nếu schema đổi; test ghi trên database riêng. Báo impact, migration local, PASS/FAIL/NOT RUN, backup/rollback và handoff.

## Nghiệm thu và handoff

Đáp ứng acceptance criteria, có evidence và ghi NOT RUN nếu chưa kiểm tra. Không lưu secret/PII. Dùng [handoff](../templates/handoff.md) và [nhật ký AI](../templates/ai-sdlc-log.md) khi cần.
