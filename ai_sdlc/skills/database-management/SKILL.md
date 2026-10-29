---
name: database-management
description: Phân tích SQLAlchemy, Alembic, PostgreSQL SSL và kế hoạch migration/khôi phục MuseumAI; không mặc định thực thi production.
---

# Database Management

Đọc [quy trình chung](../../workflow.md). Bắt đầu từ `core/config.py`, `core/database.py`, `models/`, `schemas/`, `alembic/env.py`, `alembic/versions/`.

## Phân loại thay đổi

Đổi hostname, biến môi trường hay SSL không phải thay schema. Cả ứng dụng và Alembic phải dùng cùng nguồn cấu hình. Xác nhận SSL Azure qua tham số phù hợp driver mà không in toàn bộ URL; biến môi trường tiến trình có thể ghi đè dotenv.

Thay schema cần Alembic revision, kiểm tra graph/head, dữ liệu hiện có, FK, unique, nullability, default, precision và API/schema liên quan. Không tự sinh migration rồi chạy lên Azure. Không hardcode revision head trong hướng dẫn dài hạn; đọc graph của phiên bản đang xử lý.

## Tính đúng dữ liệu

Giữ Decimal cho tiền, giá vé backend và ngữ nghĩa trạng thái vé trong tính doanh thu. Kiểm tra transaction/rollback, cập nhật đồng thời, xóa có tham chiếu, visitor-user linkage và timezone/cận ngày. Không đổi quy tắc doanh thu hay trạng thái để sửa số liệu mà thiếu xác nhận nghiệp vụ.

Startup seed có thể ghi roles/users, concurrent startup có thể xung đột unique; đăng nhập ghi login_history. Xác định sequence sau restore có thể gây lỗi khi thêm mới, nhưng không gọi nextval hoặc sửa sequence trên production trong một bước kiểm tra chỉ đọc.

## Thực thi và handoff

Dùng database test tách biệt cho migration/CRUD; kiểm tra upgrade trên dữ liệu mẫu, rollback khi khả thi và tác động dữ liệu. Lệnh metadata online vẫn cần đúng quyền và đúng đích. Khi chưa được phép chạy, báo NOT RUN cùng lệnh dự kiến và điều kiện cần.

Backup phải gắn schema, dữ liệu và file upload/volume; khôi phục PostgreSQL không khôi phục ảnh. Rollback image không hoàn tác schema. Với thay đổi có nguy cơ mất dữ liệu, ghi kế hoạch backup/restore, thời gian gián đoạn và xác nhận phạm vi trước khi thực thi. Đầu ra là phân tích/migration local/biên bản kiểm tra phù hợp, không tự tạo dump production.
