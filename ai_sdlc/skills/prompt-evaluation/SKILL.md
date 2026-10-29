---
name: prompt-evaluation
description: So sánh ba phiên bản prompt MuseumAI bằng dữ liệu có đáp án đối chiếu, kiểm tra bịa số liệu, quyền truy cập và chất lượng nội dung.
---

# Prompt Evaluation

Đọc [quy trình chung](../../workflow.md) và dùng [mẫu thí nghiệm](../../templates/prompt-experiment.md). Áp dụng cho UC010, UC011, UC012 hoặc cải tiến prompt có tiêu chí đo; không tự gọi Gemini thật để điền đủ số lượng kết quả.

## Chuẩn bị

Chọn đúng một chức năng, lưu ba phiên bản prompt với ID/checksum riêng:
- V1: baseline đang chạy hoặc bản sao nguyên nghĩa có nguồn.
- V2: thay đổi có mục tiêu, ví dụ siết ràng buộc dữ kiện nguồn.
- V3: thay đổi bổ sung có lý do, ví dụ thiếu dữ liệu, phạm vi quyền hoặc schema đầu ra.

Lưu bản prompt thực tế và tham số dùng để tái lập; không chỉ ghi tên V1/V2/V3. Không giả định V3 tốt hơn. Giữ cùng model/SDK, fixture, locale và cấu hình sinh khi muốn so sánh prompt; nếu thay cấu hình thì ghi đó là biến thí nghiệm khác. Không đưa PII thật hoặc dữ liệu ngoài quyền vào fixture.

## Bộ tình huống cần có

- UC010: dữ kiện đủ; thiếu niên đại/nguồn gốc; dữ liệu mâu thuẫn; yêu cầu bịa lịch sử; văn bản hiện vật chứa chỉ thị nhúng; response bị chặn/cắt cụt.
- UC011: số đếm/doanh thu có kết quả tính bằng backend; khoảng ngày biên; không có dữ liệu; câu hỏi vượt quyền; feedback/prompt injection; Gemini lỗi và fallback.
- UC012: tập feedback nhỏ/rỗng; điểm và thống kê tính sẵn; phản hồi trái chiều; PII; lời khuyên vượt căn cứ của mẫu.

Chỉ chọn tình huống phù hợp chức năng. Thiết lập đáp án chuẩn: số liệu/khoảng thời gian và dữ kiện được phép; không dùng một LLM khác làm nguồn sự thật duy nhất.

## Đo và quyết định

Ghi số case, số lần lặp, thất bại và tỷ lệ theo mẫu số rõ ràng:
- Sai số số liệu, số khẳng định không có nguồn.
- Lộ PII hoặc vượt quyền; làm theo chỉ thị nhúng.
- Dùng đúng schema, đánh dấu thiếu dữ liệu/bản nháp, tuân thủ ngôn ngữ/độ dài.
- Chất lượng gợi ý trong nguồn lực bảo tàng đã biết; không tự bịa ngân sách/nhân sự.
- Latency, token và chi phí chỉ khi đo được; không ước lượng rồi gắn nhãn kết quả thật.

Rò rỉ dữ liệu, vượt quyền hoặc bịa dữ kiện nghiêm trọng là lỗi chặn chấp nhận. Chốt tiêu chí và mức chấp nhận còn lại trước khi chạy; không đổi ngưỡng để hợp thức hóa kết quả. Kết luận dựa trên cả bộ case, nêu độ biến thiên và giới hạn mẫu. Mock chỉ kiểm tra hạ tầng/contract, không chứng minh chất lượng prompt hoặc tính đúng lịch sử.
