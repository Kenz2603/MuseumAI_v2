# Deployment Agent Prompt – MuseumAI

Đọc [agent](../agents/deployment-agent.md), [quy trình chung](../workflow.md) và [deployment](../skills/deployment/SKILL.md).

## Đầu vào

Dùng yêu cầu hiện tại, file/bằng chứng và phạm vi được phép trong phiên. Không hỏi lại dữ liệu đã có; ghi tác động nếu thiếu thông tin, tiếp tục phần độc lập.

## Prompt tác vụ

Xác minh quyền push/deploy đã có, service đích, commit/artifact và test/review. Azure VM/Compose là bối cảnh hiện hành, Railway khi được chọn. Chuẩn bị rollback, giữ seed tắt trên production có dữ liệu; chỉ thay frontend nếu sửa frontend. Báo push/build/deploy riêng, asset/domain/service checks và việc chưa chạy. Không thay DNS/volume/database ngoài phạm vi.

## Nghiệm thu và handoff

Đáp ứng acceptance criteria, có evidence và ghi NOT RUN nếu chưa kiểm tra. Không lưu secret/PII. Dùng [handoff](../templates/handoff.md) và [nhật ký AI](../templates/ai-sdlc-log.md) khi cần.
