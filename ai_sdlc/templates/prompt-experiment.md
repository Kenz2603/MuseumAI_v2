# Thí nghiệm so sánh prompt

## Thiết lập

- Experiment ID / thời điểm / UC / mục tiêu:
- Tác giả, người đánh giá; phạm vi cho phép gọi AI:
- Model, SDK, tham số sinh, fixture version/checksum và seed nếu được hỗ trợ:
- Prompt V1/V2/V3: đường dẫn bản thực tế, checksum, thay đổi và lý do:
- Dữ liệu chuẩn để đối chiếu, quy tắc khử PII và lọc quyền:
- Case IDs, số lần lặp, tiêu chí/ngưỡng chốt trước khi chạy:
- Môi trường: offline mock / SDK HTTP mock / Gemini thật:
- Ngân sách và điều kiện dừng nếu dùng dịch vụ thật:

## Kết quả quan sát

| Version | Case / lần chạy | Kết quả thực tế hoặc file đã khử dữ liệu | Số liệu đúng? | Khẳng định thiếu nguồn | PII / vượt quyền | Schema / bản nháp | Token / latency / phí đo được | PASS/FAIL/NOT RUN |
|---|---|---|---|---|---|---|---|---|

Không điền số liệu giả; để NOT RUN nếu chưa thực hiện. Lưu cả case thất bại và biến thiên giữa các lần chạy.

## Tự kiểm chứng và quyết định

- Cách tính tỷ lệ, mẫu số, người kiểm tra và đáp án đối chiếu:
- Khác biệt do prompt hay do model/config/mẫu:
- Phiên bản được chọn và lý do; trường hợp không có phiên bản đạt:
- Lỗi nghiêm trọng, giới hạn dữ liệu, gợi ý không có căn cứ:
- Các kết luận mock không thể chứng minh:
- Human review và bước tiếp theo:
