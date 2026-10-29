---
name: technical-documentation
description: Viết README, báo cáo kỹ thuật, kịch bản demo, ma trận truy vết và nhật ký AI-SDLC MuseumAI dựa trên bằng chứng.
---

# Technical Documentation

Đọc [quy trình chung](../../workflow.md). Xác định người đọc, phiên bản và loại tài liệu trước khi viết. Dùng Markdown trong repository nếu người dùng không yêu cầu định dạng khác.

## Nội dung cần đối chiếu

README: mục tiêu bảo tàng, UC001–UC012, role, cách chạy local, biến môi trường chỉ tên/mẫu không secret, kiểm thử, triển khai theo provider thực tế, dữ liệu upload, hạn chế và liên kết tài liệu.

Báo cáo kỹ thuật: requirement → use case → thiết kế/ERD/UML → source → test → review → deploy. Tách thành phần đã có, đề xuất và chưa kiểm chứng; không mô tả model/config cũ như trạng thái hiện tại. Dashboard, ticket pricing và AI human review phải khớp source.

Demo: chọn role, hiện vật/feedback tổng hợp và kết quả mong đợi; tạo thuyết minh dừng ở bản nháp trước khi lưu. Ghi rõ demo đăng nhập/CRUD có thể ghi dữ liệu; không hướng dẫn dùng production khi chưa được phép.

AI-SDLC: dùng [nhật ký](../../templates/ai-sdlc-log.md) và [thí nghiệm prompt](../../templates/prompt-experiment.md). Ghi phần con người/AI thực hiện, đề xuất bị loại, tự kiểm chứng, sai sót và giới hạn; không dựng lại lịch sử không có bằng chứng.

## Chất lượng và bàn giao

Kiểm tra links, đường dẫn, command theo đúng shell và môi trường. Không chạy lệnh ghi database chỉ để xác nhận tài liệu. Các bước deploy/backup trong tài liệu là hướng dẫn, không phải bằng chứng đã thực hiện.

Không đưa private key, username/password thật, token, nội dung khách tham quan hay raw prompt chứa PII vào báo cáo. Thay bằng fixture hoặc tham chiếu bằng chứng đã khử dữ liệu. Nêu warning và NOT RUN liên quan đến kết luận, không tuyên bố mọi test PASS nếu chỉ build frontend.
