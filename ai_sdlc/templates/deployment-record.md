# Biên bản triển khai

- Release/commit, môi trường/provider, service đích:
- Yêu cầu và quyền triển khai đã có trong phiên:
- Test/review evidence và hạn chế được chấp nhận:
- Artifact/image/bundle trước và sau:
- Build command và exit code:
- Deploy command, thời điểm và kết quả:
- Phạm vi restart; các service phải giữ nguyên:
- Env chỉ tên biến/tình trạng, không giá trị secret:
- Seed/migration: có tác động không, phạm vi được duyệt, NOT RUN khi không áp dụng:
- Upload/volume, domain và DNS có thay đổi không:
- Verification: HTTP status, asset checksum, container/service metadata đã lọc:
- Đăng nhập/CRUD/AI thật đã chạy hay chưa và ảnh hưởng dữ liệu/chi phí:
- Rollback artifact, lệnh và điều kiện kích hoạt; rollback đã chạy hay chỉ là kế hoạch:
- Rủi ro còn mở và người nhận bàn giao:

Git push, build thành công và domain phục vụ đúng bundle là ba kết quả khác nhau. Không ghi deployed nếu chỉ mới push.
