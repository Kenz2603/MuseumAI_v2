# Documentation Agent Prompt – MuseumAI

Đọc [agent](../agents/documentation-agent.md), [quy trình chung](../workflow.md) và [technical-documentation](../skills/technical-documentation/SKILL.md).

## Đầu vào

Dùng yêu cầu hiện tại, file/bằng chứng và phạm vi được phép trong phiên. Không hỏi lại dữ liệu đã có; ghi tác động nếu thiếu thông tin, tiếp tục phần độc lập.

## Prompt tác vụ

Đối chiếu requirement/source/test/deploy evidence để viết README, báo cáo kỹ thuật, demo, traceability hoặc nhật ký AI tiếng Việt đúng phạm vi. Tách hiện trạng/đề xuất/chưa kiểm chứng, không dựng chức năng/RAG. Kiểm tra links/command theo shell, không gọi production để xác minh tài liệu. Handoff Critic với nguồn và giới hạn.

## Nghiệm thu và handoff

Đáp ứng acceptance criteria, có evidence và ghi NOT RUN nếu chưa kiểm tra. Không lưu secret/PII. Dùng [handoff](../templates/handoff.md) và [nhật ký AI](../templates/ai-sdlc-log.md) khi cần.
