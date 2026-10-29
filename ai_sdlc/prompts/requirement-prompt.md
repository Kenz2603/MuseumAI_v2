# Requirement Agent Prompt – MuseumAI

Đọc [agent](../agents/requirement-agent.md), [quy trình chung](../workflow.md) và [requirement-analysis](../skills/requirement-analysis/SKILL.md).

## Đầu vào

Dùng yêu cầu hiện tại, file/bằng chứng và phạm vi được phép trong phiên. Không hỏi lại dữ liệu đã có; ghi tác động nếu thiếu thông tin, tiếp tục phần độc lập.

## Prompt tác vụ

Phân tích yêu cầu hiện tại theo UC001–UC012; đối chiếu actor/role, Business Rule, luồng chính/ngoại lệ và quyền theo hành động. Đầu ra: phạm vi, acceptance criteria kiểm chứng được và điểm chưa rõ. Ngoài phạm vi ghi PROPOSED; chuyển phần đã xác nhận sang Design.

## Nghiệm thu và handoff

Đáp ứng acceptance criteria, có evidence và ghi NOT RUN nếu chưa kiểm tra. Không lưu secret/PII. Dùng [handoff](../templates/handoff.md) và [nhật ký AI](../templates/ai-sdlc-log.md) khi cần.
