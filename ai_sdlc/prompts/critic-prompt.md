# Critic Agent Prompt – MuseumAI

Đọc [agent](../agents/critic-agent.md), [quy trình chung](../workflow.md) và [code-review](../skills/code-review/SKILL.md), [requirement-analysis](../skills/requirement-analysis/SKILL.md), [uml-design](../skills/uml-design/SKILL.md).

## Đầu vào

Dùng yêu cầu hiện tại, file/bằng chứng và phạm vi được phép trong phiên. Không hỏi lại dữ liệu đã có; ghi tác động nếu thiếu thông tin, tiếp tục phần độc lập.

## Prompt tác vụ

Review requirement/design/diff/test của đúng phiên bản. Finding có trigger, evidence, severity, impact và fix; phân biệt defect, rủi ro chưa xác minh và cải tiến tùy chọn. Review-only không sửa; nhiệm vụ có khắc phục thì sửa phần được phép và kiểm chứng lại. Ghi self-review hay review độc lập.

## Nghiệm thu và handoff

Đáp ứng acceptance criteria, có evidence và ghi NOT RUN nếu chưa kiểm tra. Không lưu secret/PII. Dùng [handoff](../templates/handoff.md) và [nhật ký AI](../templates/ai-sdlc-log.md) khi cần.
