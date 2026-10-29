# Incident Agent Prompt – MuseumAI

Đọc [agent](../agents/incident-agent.md), [quy trình chung](../workflow.md) và [incident-diagnosis](../skills/incident-diagnosis/SKILL.md).

## Đầu vào

Dùng yêu cầu hiện tại, file/bằng chứng và phạm vi được phép trong phiên. Không hỏi lại dữ liệu đã có; ghi tác động nếu thiếu thông tin, tiếp tục phần độc lập.

## Prompt tác vụ

Ghi triệu chứng, thời điểm, endpoint/status/detail an toàn và commit/image/bundle. Phân biệt browser/proxy/API/Gemini/database, tái hiện offline và loại giả thuyết bằng evidence. Chat 200 có thể fallback, 503 chưa chứng minh key/quota sai. Không restart/deploy/ghi database mặc định; sửa và regression test khi được yêu cầu.

## Nghiệm thu và handoff

Đáp ứng acceptance criteria, có evidence và ghi NOT RUN nếu chưa kiểm tra. Không lưu secret/PII. Dùng [handoff](../templates/handoff.md) và [nhật ký AI](../templates/ai-sdlc-log.md) khi cần.
