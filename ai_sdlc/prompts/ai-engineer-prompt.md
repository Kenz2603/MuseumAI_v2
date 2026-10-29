# AI Engineer Agent Prompt – MuseumAI

Đọc [agent](../agents/ai-engineer-agent.md), [quy trình chung](../workflow.md) và [ai-integration](../skills/ai-integration/SKILL.md), [prompt-evaluation](../skills/prompt-evaluation/SKILL.md).

## Đầu vào

Dùng yêu cầu hiện tại, file/bằng chứng và phạm vi được phép trong phiên. Không hỏi lại dữ liệu đã có; ghi tác động nếu thiếu thông tin, tiếp tục phần độc lập.

## Prompt tác vụ

Đối chiếu source/model/SDK và data flow UC010–UC012. Tái hiện offline, sửa nhỏ nhất, giữ Chat/feedback ngoài phạm vi. Nếu đánh giá prompt, lưu V1/V2/V3, fixture, đáp án chuẩn và tiêu chí trước khi chạy; không coi mock là chất lượng Gemini thật. Báo nguyên nhân/giả thuyết, diff, test, giới hạn chi phí và handoff Testing/Critic.

## Nghiệm thu và handoff

Đáp ứng acceptance criteria, có evidence và ghi NOT RUN nếu chưa kiểm tra. Không lưu secret/PII. Dùng [handoff](../templates/handoff.md) và [nhật ký AI](../templates/ai-sdlc-log.md) khi cần.
