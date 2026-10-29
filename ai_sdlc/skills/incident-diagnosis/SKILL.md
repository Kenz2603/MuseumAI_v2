---
name: incident-diagnosis
description: Truy nguyên lỗi HTTP 5xx, CORS, ảnh 404, sai cấu hình hoặc bản build MuseumAI bằng bằng chứng có thể tái hiện.
---

# Incident Diagnosis

Đọc [quy trình chung](../../workflow.md). Ghi thời điểm, môi trường, URL/method/status, nội dung detail an toàn, commit/image/bundle và thay đổi gần nhất. Kiểm tra triệu chứng ở browser, proxy, FastAPI, Gemini hay database; không quy mọi 502/503 cho API key.

## Trình tự có ích

1. Đọc router, service, schema, frontend caller và dependency của đúng phiên bản.
2. Tái hiện nhỏ nhất offline bằng fixture; giữ nguyên input/contract để so sánh trước/sau.
3. Nếu cần bằng chứng từ đích thật và đã được phép, chỉ lấy metadata, response detail hoặc log allowlist; không in raw exception/payload hay toàn bộ Docker inspect/config.
4. Chọn một giả thuyết có kiểm chứng, sửa nhỏ nhất khi tác vụ yêu cầu sửa, rồi regression test phần liên quan. Không làm sạch dữ liệu để làm lỗi biến mất.

## Phân biệt các lỗi thường gặp

- Narration 503: xem `reason` và `upstream_status`; quota, credentials, model, connection và unavailable là các nhóm khác nhau. Không tăng retry mù quáng.
- Chat 200: kiểm tra `ai_fallback` và `source`; fallback hoạt động không chứng minh Gemini hoạt động.
- Ảnh cũ 404: kiểm tra URL, file, mount và static route khi đúng phạm vi; không mặc định database sai, không tự xóa/cập nhật bản ghi.
- CORS: kiểm tra origin đầy đủ, preflight, methods/headers, proxy và biến môi trường ghi đè. Không dùng wildcard để che lỗi.
- Dashboard: `null` là ngoài quyền; 0 là dữ liệu được xem nhưng rỗng. Không mở quyền để hiển thị thẻ.
- Deploy frontend: đối chiếu bundle public với artifact đã build; health 200 không chứng minh bản mới đang được phục vụ.

Dừng retry khi lỗi lặp lại không có dữ liệu mới hoặc cần quyền/chi phí ngoài tác vụ. Báo lớp lỗi, bằng chứng đã có, những gì chưa biết và thông tin tối thiểu còn thiếu. Dùng [handoff](../../templates/handoff.md) cho bước sửa/kiểm thử/deploy tiếp theo.
