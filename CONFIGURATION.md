# Cấu hình kết nối MuseumAI_v2

## Địa chỉ theo môi trường

| Thành phần | Development | Production |
|---|---|---|
| Frontend | `http://localhost:5173` | `https://www.museumai.io.vn`, `https://museumai.io.vn` |
| Backend API | `http://127.0.0.1:8000` | `https://api.museumai.io.vn` |
| PostgreSQL | Azure PostgreSQL | Azure PostgreSQL |

Frontend development và production cùng có thể truy cập dữ liệu Azure thông qua backend tương ứng. Mọi thao tác tạo, sửa hoặc xóa từ frontend local vẫn tác động database Azure đang cấu hình ở backend local.

## Frontend React/Vite

`frontend/.env.development`:

```env
VITE_API_URL=http://127.0.0.1:8000
```

`frontend/.env.production`:

```env
VITE_API_URL=https://api.museumai.io.vn
```

Hai file này chỉ chứa URL công khai và được phép quản lý cùng source code. Không đặt thông tin đăng nhập, JWT secret hoặc Gemini API key trong các file frontend hay biến `VITE_*`.

`npm run dev` sử dụng development; `npm run build` sử dụng production. Dev server giữ cổng 5173 và báo lỗi nếu cổng đã được dùng, tránh tự chuyển sang origin chưa được CORS cho phép.

`src/api/config.js` là nơi duy nhất đọc `VITE_API_URL`, loại bỏ khoảng trắng và dấu `/` cuối URL. Axios, các lời gọi Fetch và URL ảnh đều dùng cùng nguồn cấu hình. URL API là địa chỉ gốc, không thêm `/api`; từng endpoint đã có tiền tố `/api`.

Biến môi trường của tiến trình có ưu tiên cao hơn file `.env`. File `.env.development.local` hoặc `.env.production.local`, nếu có, cũng có thể ghi đè giá trị theo mode. Cần khởi động lại dev server sau khi đổi cấu hình. Với production phải build lại, vì Vite đưa URL vào bundle tại thời điểm build.

Tham khảo: [Vite: Env Variables and Modes](https://vite.dev/guide/env-and-mode).

## Backend và Azure PostgreSQL

Backend và Alembic sử dụng chung `Settings` và `DATABASE_URL`. File `.env` được đọc từ thư mục `backend`, không phụ thuộc thư mục làm việc. Biến môi trường của tiến trình, bao gồm Variables trên Railway, được ưu tiên hơn `backend/.env`.

Thông số đích:

| Tham số | Giá trị |
|---|---|
| Driver | `postgresql+psycopg2` |
| Host | `museumai-postgres-student.postgres.database.azure.com` |
| Port | `5432` |
| Database | `museum_ai_v2` |
| SSL | `sslmode=require` trong query của `DATABASE_URL` |

Nhập username và mật khẩu qua secret Variables của Railway hoặc `backend/.env` đã được Git ignore. Mã hóa URL các ký tự đặc biệt trong username/mật khẩu trước khi ghép chuỗi kết nối. Không sao chép giá trị thật vào tài liệu, source code hay log. Mẫu không chứa thông tin đăng nhập thật nằm trong `backend/.env.example`.

SQLAlchemy giữ `pool_pre_ping=True`. Cả engine ứng dụng và engine Alembic nhận nguyên cấu hình kết nối từ biến môi trường, bao gồm `sslmode=require`; không thêm thông tin đăng nhập vào `alembic.ini`.

Giữ nguyên các secret đang dùng: `SECRET_KEY`, `GOOGLE_API_KEY` và thông tin đăng nhập database. `DEBUG` phải là giá trị boolean hợp lệ, ví dụ `True` hoặc `False`; production đặt `False`. Nếu tiến trình có sẵn `DEBUG=release`, cần bỏ biến đó khỏi terminal dùng để chạy backend hoặc đặt lại thành boolean trước khi khởi động. Không thay đổi biến hệ thống toàn máy chỉ để chạy dự án.

Tham khảo: [Pydantic Settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/), [SQLAlchemy PostgreSQL SSL](https://docs.sqlalchemy.org/en/20/dialects/postgresql.html#ssl-connections).

## CORS

Các origin mặc định được phép:

```json
["http://localhost:5173", "https://www.museumai.io.vn", "https://museumai.io.vn"]
```

Có thể đặt `CORS_ORIGINS` bằng một JSON array trong môi trường backend. Nếu Railway đã có biến này, phải cập nhật giá trị hiện có để phù hợp vì biến đó ghi đè mặc định trong code. Production có thể chỉ giữ hai origin HTTPS của frontend nếu không cần truy cập từ frontend local.

Không thêm dấu `/` cuối origin. Không thêm domain API vào danh sách chỉ vì backend được triển khai tại đó. Cấu hình giới hạn phương thức ở `GET`, `HEAD`, `POST`, `PUT`, `DELETE`, `OPTIONS` và header ở `Authorization`, `Content-Type`, `Accept`, không dùng wildcard.

## Ảnh và tệp upload

`UPLOAD_DIR` được dùng chung cho API upload và static route `/uploads`. Giá trị tương đối như `uploads` được tính từ thư mục `backend`; giá trị tuyệt đối được giữ nguyên để dùng volume Railway.

Frontend giải quyết các đường dẫn như `/uploads/example.jpg` hoặc `uploads/example.jpg` theo URL backend. Các URL ảnh HTTP/HTTPS tuyệt đối hiện có được giữ nguyên. Không sửa bản ghi ảnh trong database.

Khôi phục PostgreSQL không tự chuyển các file ảnh. Khi triển khai, cần giữ dữ liệu upload và volume hiện có; nếu dùng Railway Volume, đặt `UPLOAD_DIR` theo mount path thực tế. Không thay đổi mount path hoặc di chuyển/xóa file khi chưa xác định vị trí dữ liệu hiện có.

## Railway và tên miền Mắt Bão

Chưa có `railway.toml`, `railway.json`, `nixpacks.toml`, Dockerfile hoặc Procfile trong repository tại thời điểm chỉnh sửa. Cấu hình trên dashboard Railway chưa được truy cập hoặc thay đổi. Giữ nguyên service, custom domain và DNS hiện có.

Đối chiếu thủ công cấu hình dịch vụ trước lần triển khai tiếp theo:

| Dịch vụ | Root directory | Build | Start |
|---|---|---|---|
| Backend | `backend` | `pip install -r requirements.txt` | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Frontend | `frontend` | `npm ci && npm run build` | `npm run start` |

Các lệnh dùng `$PORT` theo môi trường Linux trên Railway. Không đưa lệnh Alembic hoặc seed bổ sung vào pre-deploy/start command trong đợt đồng bộ cấu hình này.

Các Variables cần đối chiếu:

| Dịch vụ | Biến | Cấu hình |
|---|---|---|
| Backend | `DATABASE_URL` | Trỏ Azure theo thông số bên trên, có `sslmode=require`; đặt trực tiếp dưới dạng secret hoặc qua biến tham chiếu đúng nguồn Azure |
| Backend | `DEBUG` | `False` |
| Backend | `CORS_ORIGINS` | JSON array các origin frontend được phép, nếu muốn ghi đè mặc định |
| Backend | `SECRET_KEY`, `GOOGLE_API_KEY` | Giữ nguyên secret hiện có |
| Backend | `UPLOAD_DIR` | Giữ thư mục/volume chứa ảnh hiện có |
| Frontend | `VITE_API_URL` | `https://api.museumai.io.vn`, có sẵn trong môi trường build |

Nếu `DATABASE_URL` đang tham chiếu PostgreSQL cũ của Railway, cần đổi nguồn tham chiếu sang cấu hình Azure, không xóa dịch vụ database cũ trong tác vụ này. Kiểm tra firewall/network Azure cho phép kết nối từ dịch vụ backend Railway; không tự mở truy cập cho mọi địa chỉ.

Giữ nguyên custom domain `api.museumai.io.vn` cho backend và các domain frontend đang gắn trên Railway. Không đổi bản ghi Mắt Bão nếu domain hiện đang hoạt động. Cần build và triển khai lại frontend sau khi cập nhật Variables; thay đổi biến ở runtime không sửa bundle đã build.

Endpoint `/health` hiện chỉ báo ứng dụng đang chạy, không xác nhận kết nối database.

## Trạng thái database và kiểm thử

Theo thông tin đã cung cấp, Azure đã khôi phục 11 bảng và 22 bản ghi; revision hiện tại là `cd69094a22b9`. Source migration hiện có kết thúc ở revision này. Không tạo/sửa migration, không chạy upgrade, downgrade, stamp hoặc lệnh ghi database trong tác vụ cấu hình.

Backend hiện có logic seed role/admin trong startup. Logic này được giữ nguyên. Việc khởi động backend có thể ghi dữ liệu, nên cần tính đến trước bước kiểm thử có yêu cầu chỉ đọc.

Chưa chạy build, lint, test, API request, kết nối database hoặc khởi động ứng dụng trong đợt chỉnh sửa này. Chỉ bắt đầu kiểm thử tổng thể sau khi người dùng xác nhận.
