---
name: deployment
description: Triển khai MuseumAI lên Azure VM với Docker Compose hoặc Railway theo môi trường được xác nhận, có rollback và bằng chứng domain.
---

# Deployment

Đọc [quy trình chung](../../workflow.md). Azure VM/Docker Compose với Azure PostgreSQL là bối cảnh hiện hành đã xác nhận; Railway khi được chọn, không suy luận nơi host frontend từ tài liệu cũ.

## Chuẩn bị

Xác định quyền trong phiên cho push/deploy/database; không hỏi duyệt lại hành động đã cho phép. Rà git status/diff, file/nhánh/remote, test/review. Không add toàn bộ khi có thay đổi ngoài phạm vi.

Xác minh service, thư mục và nguồn image/source. Compose, frontend Dockerfile, nginx, Caddy có thể chỉ ở server; không tự tạo/thay vì checkout thiếu. Chỉ lấy metadata cần thiết, không in toàn bộ Docker inspect/config đã resolve hay dotenv. Giữ artifact/image trước deploy để rollback.

## Azure VM / Docker Compose

Dùng SSH CLI/API được phép và đường dẫn key đã được người dùng xác nhận; không đọc/in nội dung private key. Không bỏ host-key checking khi sai fingerprint.

Frontend build source và backend image registry là các nguồn riêng. Git pull backend source không có nghĩa container backend đã cập nhật.

Chỉ đổi frontend thì build đúng service với VITE_API_URL production lúc build và thay frontend bằng `up -d --no-deps --no-build` theo tên thật. Không compose down, restart toàn stack hoặc đổi domain/volume.

Đổi backend cần xác nhận artifact/health/rollback và ENABLE_STARTUP_SEED=false cho production có dữ liệu. Không seed/migrate ngoài phạm vi. Rollback image không khôi phục schema/dữ liệu.

## Railway khi được chọn

Xác minh project/service/environment, build/runtime Variables, host/port và volume. Vite cần URL lúc build. Giữ domain/database service, không mặc định push tự deploy.

## Xác minh

Đối chiếu domain/asset status và checksum/version với artifact mới. Health 200 không chứng minh database/Gemini. So sánh ID/start time service ngoài phạm vi để phát hiện restart ngoài ý muốn.

Đăng nhập ghi login_history; CRUD ghi dữ liệu; AI thật có phí/quota. Chỉ chạy bước đã được phép. Nếu lỗi, rollback phần ảnh hưởng bằng artifact đã chuẩn bị, không xóa volume/image cũ.

Dùng [biên bản triển khai](../../templates/deployment-record.md): push/build/deploy riêng, lệnh/exit code, artifact trước/sau, verification, rollback và NOT RUN. Chỉ cập nhật agent/prompt/skill không cần deploy ứng dụng.
