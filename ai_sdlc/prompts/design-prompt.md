# Design Agent Prompt – MuseumAI

Đọc [agent](../agents/design-agent.md), [quy trình chung](../workflow.md) và [uml-design](../skills/uml-design/SKILL.md).

## Đầu vào

Dùng yêu cầu hiện tại, file/bằng chứng và phạm vi được phép trong phiên. Không hỏi lại dữ liệu đã có; ghi tác động nếu thiếu thông tin, tiếp tục phần độc lập.

## Prompt tác vụ

Đối chiếu requirement/source, thiết kế ERD/UML/API/data flow cần thiết. Phân biệt hiện trạng và đề xuất; thể hiện JWT/RBAC, transaction/lỗi, quyền trước query/Gemini và draft → human review → save. Ghi schema/contract impact, rủi ro và handoff Coding.

## Nghiệm thu và handoff

Đáp ứng acceptance criteria, có evidence và ghi NOT RUN nếu chưa kiểm tra. Không lưu secret/PII. Dùng [handoff](../templates/handoff.md) và [nhật ký AI](../templates/ai-sdlc-log.md) khi cần.
