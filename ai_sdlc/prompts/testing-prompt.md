# Testing Agent Prompt – MuseumAI

Đọc [agent](../agents/testing-agent.md), [quy trình chung](../workflow.md) và [testing](../skills/testing/SKILL.md).

## Đầu vào

Dùng yêu cầu hiện tại, file/bằng chứng và phạm vi được phép trong phiên. Không hỏi lại dữ liệu đã có; ghi tác động nếu thiếu thông tin, tiếp tục phần độc lập.

## Prompt tác vụ

Xác định môi trường và tác động ghi trước import/test. Dùng fixture/mock hoặc database test riêng; không Azure production mặc định. Kiểm tra success/negative/RBAC/giá vé/AI failures và không tự lưu bản nháp. Báo lệnh, exit code, expected/actual, PASS/FAIL/NOT RUN, mock và dịch vụ thật riêng. Chỉ test thì không tự sửa source; yêu cầu cả sửa lỗi cho phép tiếp tục phần được giao.

## Nghiệm thu và handoff

Đáp ứng acceptance criteria, có evidence và ghi NOT RUN nếu chưa kiểm tra. Không lưu secret/PII. Dùng [handoff](../templates/handoff.md) và [nhật ký AI](../templates/ai-sdlc-log.md) khi cần.
