# MuseumAI

## Hệ thống quản lý bảo tàng tích hợp trí tuệ nhân tạo

MuseumAI là hệ thống quản lý bảo tàng được xây dựng theo kiến trúc **Frontend – Backend – Database**, hỗ trợ số hóa và quản lý các nghiệp vụ của bảo tàng.

Hệ thống cung cấp các chức năng quản lý:

* Tài khoản và phân quyền
* Hiện vật
* Khu vực trưng bày
* Triển lãm
* Lịch triển lãm
* Khách tham quan
* Vé
* Phản hồi

Bên cạnh các chức năng quản lý truyền thống, MuseumAI tích hợp **Google Gemini AI** nhằm hỗ trợ nhân viên bảo tàng trong việc khai thác dữ liệu, tạo nội dung thuyết minh, hỏi đáp về hiện vật và phân tích phản hồi của khách tham quan.

---

## Mục lục

* [1. Giới thiệu](#1-giới-thiệu)
* [2. Chức năng chính](#2-chức-năng-chính)
* [3. Chức năng AI](#3-chức-năng-ai)
* [4. Phân quyền người dùng](#4-phân-quyền-người-dùng)
* [5. Kiến trúc hệ thống](#5-kiến-trúc-hệ-thống)
* [6. Công nghệ sử dụng](#6-công-nghệ-sử-dụng)
* [7. Cấu trúc dự án](#7-cấu-trúc-dự-án)
* [8. Yêu cầu môi trường](#8-yêu-cầu-môi-trường)
* [9. Cài đặt](#9-cài-đặt)
* [10. Cấu hình môi trường](#10-cấu-hình-môi-trường)
* [11. Database Migration](#11-database-migration)
* [12. Chạy Backend](#12-chạy-backend)
* [13. Chạy Frontend](#13-chạy-frontend)
* [14. API và Swagger](#14-api-và-swagger)
* [15. Tài khoản kiểm thử](#15-tài-khoản-kiểm-thử)
* [16. Kiểm thử](#16-kiểm-thử)
* [17. Bảo mật](#17-bảo-mật)
* [18. Tài liệu dự án](#18-tài-liệu-dự-án)
* [19. Định hướng phát triển](#19-định-hướng-phát-triển)
* [20. Tác giả](#20-tác-giả)

---

# 1. Giới thiệu

Trong quá trình vận hành bảo tàng, việc quản lý hiện vật, khu vực trưng bày, triển lãm, khách tham quan, vé và phản hồi đòi hỏi một hệ thống quản lý tập trung.

MuseumAI được xây dựng nhằm:

1. **Số hóa dữ liệu và nghiệp vụ bảo tàng.**
2. **Hỗ trợ nhân viên quản lý và khai thác dữ liệu.**
3. **Ứng dụng trí tuệ nhân tạo vào các nghiệp vụ phù hợp.**
4. **Cung cấp giao diện web và REST API phục vụ quản lý hệ thống.**

Hệ thống được thiết kế theo hướng phân tách Frontend, Backend và Database, giúp thuận tiện cho việc phát triển, kiểm thử và triển khai.

---

# 2. Chức năng chính

## 2.1. Quản lý tài khoản và xác thực

MuseumAI sử dụng JWT để xác thực người dùng và RBAC để kiểm soát quyền truy cập.

Các chức năng chính:

* Đăng nhập
* Xác thực JWT
* Kiểm tra tài khoản
* Phân quyền theo role
* Bảo vệ API
* Kiểm soát quyền truy cập từng chức năng

Các role:

* `admin`
* `content_staff`
* `ticket_staff`
* `visitor`

---

## 2.2. Quản lý hiện vật

Hệ thống hỗ trợ quản lý thông tin hiện vật:

* Thêm hiện vật
* Xem danh sách
* Xem chi tiết
* Cập nhật thông tin
* Xóa hiện vật
* Quản lý mã hiện vật
* Quản lý nguồn gốc
* Quản lý thời kỳ
* Quản lý chất liệu
* Quản lý mô tả
* Upload hình ảnh hiện vật
* Liên kết hiện vật với khu vực trưng bày
* Hỗ trợ tạo nội dung thuyết minh bằng AI

---

## 2.3. Quản lý khu vực trưng bày

Hệ thống hỗ trợ quản lý:

* Thông tin khu vực
* Sức chứa
* Trạng thái khu vực
* Quan hệ giữa khu vực và hiện vật
* Quan hệ giữa khu vực và triển lãm

---

## 2.4. Quản lý triển lãm

Các chức năng chính:

* Tạo triển lãm
* Xem danh sách triển lãm
* Xem chi tiết
* Cập nhật triển lãm
* Quản lý trạng thái
* Quản lý khu vực liên quan

---

## 2.5. Quản lý lịch triển lãm

Hệ thống hỗ trợ quản lý lịch tổ chức triển lãm:

* Thời gian bắt đầu
* Thời gian kết thúc
* Triển lãm tương ứng
* Khu vực tổ chức
* Trạng thái lịch

---

## 2.6. Quản lý khách tham quan

Hệ thống hỗ trợ:

* Quản lý tài khoản khách tham quan
* Đăng ký tham quan
* Theo dõi thông tin khách
* Liên kết khách tham quan với vé
* Quản lý hoạt động tham quan

---

## 2.7. Quản lý vé

Các chức năng nghiệp vụ vé:

* Tạo vé
* Sinh và quản lý mã vé
* Quản lý loại vé
* Quản lý giá vé
* Quản lý số lượng
* Quản lý trạng thái
* Tra cứu vé
* Liên kết vé với khách tham quan

---

## 2.8. Quản lý phản hồi

Khách tham quan có thể gửi phản hồi về trải nghiệm tại bảo tàng.

Hệ thống hỗ trợ:

* Gửi phản hồi
* Lưu phản hồi vào database
* Xem phản hồi
* Quản lý phản hồi
* Phân tích phản hồi bằng AI

---

# 3. Chức năng AI

MuseumAI tích hợp **Google Gemini AI** cho các nghiệp vụ AI.

Model mục tiêu được cấu hình:

```text
gemini-3.1-flash-lite
```

## 3.1. AI Museum Assistant

AI Museum Assistant hỗ trợ nhân viên quản lý bảo tàng truy vấn dữ liệu bằng ngôn ngữ tự nhiên.

Ví dụ:

```text
Có bao nhiêu hiện vật trong bảo tàng?

Có bao nhiêu triển lãm đang hoạt động?

Có bao nhiêu khách tham quan?

Doanh thu từ vé hiện tại là bao nhiêu?

Khu vực nào đang được sử dụng?
```

AI Assistant được thiết kế để hỗ trợ khai thác dữ liệu nghiệp vụ của hệ thống.

---

## 3.2. Chatbot hỏi đáp về hiện vật

Chatbot hỗ trợ hỏi đáp về thông tin hiện vật.

Người dùng có thể hỏi về:

* Tên hiện vật
* Nguồn gốc
* Lịch sử
* Đặc điểm
* Chất liệu
* Giá trị văn hóa
* Các thông tin liên quan

Mục tiêu là cung cấp phương thức tương tác tự nhiên để người dùng tiếp cận thông tin bảo tàng.

---

## 3.3. AI tạo nội dung thuyết minh

AI hỗ trợ nhân viên nội dung tạo nội dung thuyết minh cho hiện vật.

Đầu vào có thể bao gồm thông tin hiện vật.

Nội dung được tạo theo hướng:

* Dễ hiểu
* Có cấu trúc
* Phù hợp với khách tham quan
* Giữ lại các thông tin quan trọng

Nội dung do AI tạo ra vẫn cần được nhân viên kiểm tra và chỉnh sửa trước khi sử dụng chính thức.

---

## 3.4. AI phân tích phản hồi

AI được sử dụng để hỗ trợ phân tích phản hồi của khách tham quan.

Các nội dung có thể được tổng hợp:

* Số lượng phản hồi
* Đánh giá tổng quan
* Xu hướng phản hồi
* Điểm tích cực
* Vấn đề thường gặp
* Điểm cần cải thiện

Kết quả hỗ trợ bảo tàng đánh giá trải nghiệm khách tham quan và xác định các vấn đề cần cải thiện.

---

# 4. Phân quyền người dùng

MuseumAI sử dụng **Role-Based Access Control (RBAC)**.

| Role            | Quyền chính                                                     |
| --------------- | --------------------------------------------------------------- |
| `admin`         | Quản lý toàn hệ thống                                           |
| `content_staff` | Quản lý nội dung, hiện vật, triển lãm và chức năng AI liên quan |
| `ticket_staff`  | Quản lý khách tham quan và nghiệp vụ vé                         |
| `visitor`       | Sử dụng các chức năng dành cho khách tham quan                  |

JWT được sử dụng để xác thực request.

Backend kiểm tra role của người dùng trước khi cho phép truy cập các API yêu cầu quyền.

---

# 5. Kiến trúc hệ thống

Kiến trúc tổng quát:

```text
┌──────────────────────────────┐
│          Frontend            │
│          React + Vite        │
└──────────────┬───────────────┘
               │
               │ REST API / JWT
               ▼
┌──────────────────────────────┐
│           Backend            │
│           FastAPI            │
│                              │
│  Routers                     │
│  Schemas                     │
│  Services                    │
│  Models                      │
│  Authentication / RBAC       │
│  AI Services                 │
└──────────────┬───────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌──────────────┐  ┌──────────────┐
│ PostgreSQL   │  │ Google Gemini│
│              │  │              │
│ Museum Data  │  │ AI Services  │
└──────────────┘  └──────────────┘
```

Các thành phần chính:

* **Frontend:** giao diện người dùng.
* **Backend:** xử lý nghiệp vụ và REST API.
* **PostgreSQL:** lưu trữ dữ liệu.
* **Gemini:** xử lý các chức năng AI.
* **JWT/RBAC:** xác thực và phân quyền.

---

# 6. Công nghệ sử dụng

## Frontend

* React
* Vite
* JavaScript
* HTML5
* CSS3

## Backend

* Python
* FastAPI
* SQLAlchemy
* Pydantic
* JWT
* HTTP Bearer Authentication

## Database

* PostgreSQL

## Database Migration

* Alembic

## Artificial Intelligence

* Google Gemini API
* Gemini `gemini-3.1-flash-lite`
* ChromaDB

## Development Tools

* Visual Studio Code
* Git
* GitHub
* PowerShell
* Swagger / OpenAPI

---

# 7. Cấu trúc dự án

Cấu trúc chính của repository:

```text
MuseumAI_v2/
│
├── backend/
│   ├── app/
│   │   ├── core/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   │
│   ├── alembic/
│   │   └── versions/
│   │
│   ├── .env.example
│   ├── pyproject.toml
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── docs/
│   ├── urd/
│   ├── srs/
│   └── uml/
│
├── .gitattributes
├── .gitignore
├── README.md
└── tree.txt
```

> `tree.txt` là file hỗ trợ kiểm tra cấu trúc project. Các thư mục sinh ra trong quá trình phát triển như virtual environment, dependency cache và build output không được xem là mã nguồn chính của hệ thống.

---

# 8. Yêu cầu môi trường

## Backend

Khuyến nghị:

```text
Python 3.12+
PostgreSQL
Git
```

## Frontend

```text
Node.js
npm
```

## Công cụ phát triển

```text
Visual Studio Code
PowerShell
```

---

# 9. Cài đặt

## 9.1. Clone repository

```powershell
git clone <repository-url>
cd MuseumAI_v2
```

---

## 9.2. Cài đặt Backend

```powershell
cd backend
```

Tạo virtual environment:

```powershell
python -m venv .venv
```

Kích hoạt:

```powershell
.\.venv\Scripts\Activate.ps1
```

Cài đặt dependencies:

```powershell
pip install -r requirements.txt
```

---

## 9.3. Cài đặt Frontend

Mở terminal mới:

```powershell
cd frontend
```

Cài đặt dependencies:

```powershell
npm install
```

---

# 10. Cấu hình môi trường

Backend sử dụng file:

```text
backend/.env
```

File mẫu:

```text
backend/.env.example
```

Các biến môi trường chính:

```env
APP_NAME=MuseumAI
APP_VERSION=1.0.0
DEBUG=False

HOST=0.0.0.0
PORT=8000

DATABASE_URL=postgresql+psycopg2://username:password@host:5432/database

SECRET_KEY=CHANGE_ME
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

GOOGLE_API_KEY=CHANGE_ME
GEMINI_MODEL=gemini-3.1-flash-lite

CHROMA_DB_PATH=./chroma_db
UPLOAD_DIR=uploads
```

> Không commit `backend/.env` lên GitHub.

> Không đưa PostgreSQL password, Gemini API key hoặc JWT secret vào README hoặc source code.

---

# 11. Database Migration

Sau khi cấu hình PostgreSQL và `DATABASE_URL`, chạy:

```powershell
cd backend
alembic upgrade head
```

Kiểm tra migration hiện tại:

```powershell
alembic current
```

Alembic được sử dụng để quản lý lịch sử thay đổi database schema.

---

# 12. Chạy Backend

Tại thư mục:

```text
MuseumAI_v2/backend
```

Kích hoạt môi trường:

```powershell
.\.venv\Scripts\Activate.ps1
```

Khởi động FastAPI:

```powershell
uvicorn app.main:app --reload
```

Backend mặc định:

```text
http://127.0.0.1:8000
```

Kiểm tra API:

```text
http://127.0.0.1:8000/
```

Health check:

```text
http://127.0.0.1:8000/health
```

---

# 13. Chạy Frontend

Mở terminal mới:

```powershell
cd A:\MuseumAI_v2\frontend
```

Chạy:

```powershell
npm run dev
```

Frontend mặc định:

```text
http://localhost:5173
```

Frontend sử dụng REST API của FastAPI để giao tiếp với backend.

---

# 14. API và Swagger

FastAPI cung cấp tài liệu API tự động.

## Swagger UI

```text
http://127.0.0.1:8000/docs
```

## ReDoc

```text
http://127.0.0.1:8000/redoc
```

Swagger có thể được sử dụng để kiểm tra các nhóm API như:

* Authentication
* Users
* Artifacts
* Exhibition Areas
* Exhibitions
* Tickets
* Feedback
* AI
* Các REST API khác

---

# 15. Tài khoản kiểm thử

Hệ thống có các tài khoản phục vụ kiểm thử theo role:

| Username  | Email                  | Role            |
| --------- | ---------------------- | --------------- |
| `admin`   | `admin@museumai.com`   | `admin`         |
| `content` | `content@museumai.com` | `content_staff` |
| `ticket`  | `ticket@museumai.com`  | `ticket_staff`  |
| `user01`  | `User02@museum.ai`     | `visitor`       |
| `user02`  | `User01@museum.ai`     | `visitor`       |

> Không lưu mật khẩu trong README hoặc repository.

---

# 16. Kiểm thử

## 16.1. Kiểm tra Python syntax

Ví dụ:

```powershell
python -m py_compile app\core\dependencies.py
```

Có thể kiểm tra toàn bộ backend:

```powershell
python -m compileall app alembic
```

---

## 16.2. Kiểm tra code bằng Ruff

```powershell
ruff check .
```

Kết quả hợp lệ:

```text
All checks passed!
```

---

## 16.3. Kiểm tra Backend

Khởi động:

```powershell
uvicorn app.main:app --reload
```

Sau đó truy cập:

```text
http://127.0.0.1:8000/docs
```

---

## 16.4. Kiểm tra Authentication

Endpoint đăng nhập:

```text
POST /api/auth/login
```

Sau khi đăng nhập thành công, JWT được sử dụng để truy cập các endpoint yêu cầu authentication.

---

# 17. Bảo mật

Các thông tin nhạy cảm không được đưa trực tiếp vào repository.

Không commit:

```text
.env
*.key
*.pem
Database password
Google API key
JWT secret
```

Repository sử dụng `.gitignore` để loại bỏ các file và thư mục không nên được commit.

Đặc biệt:

```text
backend/.env
backend/uploads/
backend/chroma_db/
frontend/node_modules/
frontend/dist/
```

không phải là các thành phần cần đưa vào repository source code.

---

# 18. Tài liệu dự án

Các tài liệu phân tích và thiết kế được lưu trong:

```text
docs/
```

Các nhóm tài liệu chính:

```text
docs/
├── urd/
│
├── srs/
│
└── uml/
```

Trong đó:

* **URD:** mô tả yêu cầu người dùng.
* **SRS:** đặc tả yêu cầu phần mềm.
* **Vision Document:** tài liệu tầm nhìn hệ thống.
* **UML / Functional Decomposition:** phân rã chức năng và thiết kế hệ thống.

---

# 19. Định hướng phát triển

Một số hướng phát triển tiếp theo:

* Cải thiện chất lượng câu trả lời của AI.
* Bổ sung RAG cho dữ liệu hiện vật.
* Tăng khả năng kiểm soát độ chính xác nội dung AI.
* Bổ sung logging và monitoring.
* Tăng cường kiểm thử tự động.
* Container hóa hệ thống bằng Docker.
* Triển khai production.
* Cải thiện giao diện người dùng.
* Bổ sung dashboard thống kê.
* Tối ưu hiệu năng.
* Tăng cường bảo mật hệ thống.

---

# 20. Tác giả

## MuseumAI

Dự án được xây dựng với mục đích:

* Học tập
* Nghiên cứu
* Thực hành phát triển phần mềm
* Ứng dụng trí tuệ nhân tạo vào hệ thống quản lý bảo tàng

---

## License

Dự án được sử dụng cho mục đích học tập và nghiên cứu.
