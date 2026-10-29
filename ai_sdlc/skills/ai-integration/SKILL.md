---
name: ai-integration
description: Tích hợp và sửa lỗi Gemini cho narration, management assistant và phân tích feedback; dùng khi thay request, response hoặc xử lý lỗi AI.
---

# AI Integration

Đọc [quy trình chung](../../workflow.md). Điểm bắt đầu: `backend/app/routers/artifacts.py`, `routers/ai.py`, `schemas/artifact.py`, `schemas/ai.py`, `services/gemini_service.py`, `services/ai_assistant.py`, `services/feedback_ai.py` và `requirements.txt`.

## Chẩn đoán trước khi sửa

- Đọc SDK/model đang cấu hình và các option được hỗ trợ. Khi cần API mới hoặc nghi ngờ tương thích, đối chiếu tài liệu chính thức theo phiên bản, không tự nâng SDK/model.
- So sánh dữ liệu nguồn, prompt, system instruction, token budget, timeout, retry, finish/block reason và cách frontend đọc `detail`.
- Chat có fallback PostgreSQL: xem `source`, `ai_fallback`, `data_verified`; HTTP 200 không chứng minh Gemini thành công hoặc câu trả lời chính xác.
- Thiếu traceback/response production thì ghi giới hạn; fixture tổng hợp chỉ chứng minh đường lỗi có thể xảy ra.

## Triển khai

Phân loại lỗi cấu hình, quyền, quota, model, transport, timeout, blocked, empty, invalid và truncated. Dùng thông báo an toàn và mã lỗi có giới hạn; không log exception/payload chứa thông tin nhạy cảm. Timeout và retry phải phù hợp deadline proxy và ngân sách; retry không được lặp vô hạn hoặc nhân phí ngoài dự kiến.

Không coi word limit là token limit. Token suy nghĩ có thể tiêu thụ ngân sách; chỉ nhận phần văn bản cuối hoàn chỉnh. Không trả thought hay nội dung cắt cụt làm bản nháp thành công. Giữ contract và quyền; không sửa Chat/feedback khi chỉ sửa narration.

Khi yêu cầu tách prompt runtime, giữ nguyên semantic, tham số và đường dẫn nạp trong Docker; thêm regression test cho request và đầu ra. Không coi các prompt SDLC trong `ai_sdlc/prompts` là prompt runtime.

## Kiểm tra và đầu ra

Dùng test hiện có ở `backend/tests`; mock tại SDK/HTTP boundary, không thay code production bằng mock. Bao phủ success, lỗi upstream, timeout, malformed/blocked/empty, retry, RBAC và không tự lưu dữ liệu.

Báo file đổi, bảng lỗi, bằng chứng trước/sau, mock/AI thật riêng biệt, ảnh hưởng token/latency và giới hạn. Khi cần so sánh prompt, dùng [Prompt Evaluation](../prompt-evaluation/SKILL.md).
