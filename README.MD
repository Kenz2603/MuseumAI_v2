# MuseumAI

**Hệ thống quản lý bảo tàng tích hợp trí tuệ nhân tạo (AI)**

MuseumAI là hệ thống quản lý bảo tàng được xây dựng theo kiến trúc **Frontend – Backend – Database**, hỗ trợ quản lý hiện vật, khu vực triển lãm, triển lãm, lịch triển lãm, khách tham quan, vé và phản hồi.

Hệ thống tích hợp **Google Gemini AI** nhằm hỗ trợ nhân viên bảo tàng trong việc khai thác dữ liệu, tạo nội dung thuyết minh, hỏi đáp về hiện vật và phân tích phản hồi của khách tham quan.

---

##  Mục lục

* [Giới thiệu](#-giới-thiệu)
* [Chức năng chính](#-chức-năng-chính)
* [Chức năng AI](#-chức-năng-ai)
* [Phân quyền người dùng](#-phân-quyền-người-dùng)
* [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
* [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
* [Cấu trúc dự án](#-cấu-trúc-dự-án)
* [Yêu cầu môi trường](#-yêu-cầu-môi-trường)
* [Cài đặt](#-cài-đặt)
* [Cấu hình môi trường](#-cấu-hình-môi-trường)
* [Chạy Backend](#-chạy-backend)
* [Chạy Frontend](#-chạy-frontend)
* [API và Swagger](#-api-và-swagger)
* [Tài khoản demo](#-tài-khoản-demo)
* [Kiểm thử](#-kiểm-thử)
* [Tài liệu](#-tài-liệu)
* [Định hướng phát triển](#-định-hướng-phát-triển)

---

##  Giới thiệu

Trong quá trình vận hành bảo tàng, việc quản lý hiện vật, triển lãm, khu vực trưng bày, khách tham quan và vé đòi hỏi một hệ thống quản lý tập trung.

MuseumAI được xây dựng nhằm số hóa các nghiệp vụ quản lý bảo tàng và bổ sung các chức năng AI để hỗ trợ nhân viên xử lý và khai thác thông tin.

Hệ thống hướng đến ba nhóm mục tiêu:

1. **Quản lý tập trung dữ liệu bảo tàng**
2. **Hỗ trợ nghiệp vụ cho nhân viên**
3. **Ứng dụng AI vào quá trình quản lý và cung cấp thông tin**

---

##  Chức năng chính

###  Quản lý tài khoản và phân quyền

* Đăng nhập bằng JWT
* Xác thực người dùng
* Phân quyền theo vai trò
* Bảo vệ API bằng Role-Based Access Control (RBAC)

Các vai trò trong hệ thống:

* `admin`
* `content_staff`
* `ticket_staff`
* `visitor`

---

###  Quản lý hiện vật

Hệ thống hỗ trợ:

* Thêm hiện vật
* Xem danh sách hiện vật
* Xem chi tiết hiện vật
* Cập nhật thông tin hiện vật
* Xóa hiện vật
* Quản lý thông tin mô tả
* Upload hình ảnh hiện vật

---

###  Quản lý khu vực triển lãm

Hệ thống hỗ trợ quản lý:

* Khu vực trưng bày
* Thông tin khu vực
* Sức chứa
* Trạng thái khu vực
* Mối liên hệ giữa khu vực và triển lãm

---

###  Quản lý triển lãm

Hệ thống hỗ trợ:

* Tạo triển lãm
* Cập nhật triển lãm
* Xem danh sách triển lãm
* Xem chi tiết triển lãm
* Quản lý trạng thái triển lãm
* Quản lý khu vực triển lãm

---

###  Quản lý lịch triển lãm

Cho phép quản lý:

* Thời gian bắt đầu
* Thời gian kết thúc
* Triển lãm tương ứng
* Khu vực tổ chức
* Trạng thái lịch

---

###  Quản lý vé

Hệ thống hỗ trợ nghiệp vụ vé:

* Tạo vé
* Quản lý mã vé
* Quản lý loại vé
* Quản lý giá vé
* Quản lý số lượng
* Quản lý trạng thái vé
* Tra cứu vé
* Quản lý thông tin đăng ký/tham quan

---

###  Quản lý khách tham quan

Hệ thống hỗ trợ:

* Quản lý tài khoản visitor
* Đăng ký tham quan
* Theo dõi thông tin khách
* Liên kết thông tin khách với vé và hoạt động tham quan

---

###  Quản lý phản hồi

Khách tham quan có thể gửi phản hồi về trải nghiệm.

Hệ thống hỗ trợ:

* Gửi feedback
* Lưu feedback vào database
* Quản lý feedback
* Xem nội dung phản hồi
* Phân tích feedback bằng AI

---

#  Chức năng AI

MuseumAI tích hợp **Google Gemini** để hỗ trợ các nghiệp vụ liên quan đến AI.

Model mục tiêu:

```text
gemini-3.1-flash-lite
```

###  AI Museum Assistant

AI Assistant hỗ trợ nhân viên truy vấn thông tin quản lý bảo tàng bằng ngôn ngữ tự nhiên.

Ví dụ:

```text
Có bao nhiêu hiện vật trong bảo tàng?

Có bao nhiêu triển lãm đang hoạt động?

Doanh thu từ vé hiện tại là bao nhiêu?

Có bao nhiêu khách tham quan?

Khu vực nào đang được sử dụng?
```

AI có thể sử dụng dữ liệu nghiệp vụ từ hệ thống để đưa ra câu trả lời phù hợp.

---

###  Chatbot hỏi đáp về hiện vật

Hệ thống cung cấp chức năng hỏi đáp liên quan đến hiện vật.

Người dùng có thể đặt câu hỏi về:

* Tên hiện vật
* Nguồn gốc
* Lịch sử
* Đặc điểm
* Giá trị văn hóa
* Thông tin liên quan đến hiện vật

Mục tiêu của chatbot là giúp người dùng tiếp cận thông tin bảo tàng theo hình thức hội thoại tự nhiên.

---

###  AI tạo nội dung thuyết minh

AI hỗ trợ nhân viên nội dung tạo nội dung thuyết minh cho hiện vật.

Đầu vào có thể bao gồm thông tin hiện vật.

AI tạo nội dung theo hướng:

* Dễ hiểu
* Có cấu trúc
* Phù hợp với khách tham quan
* Giữ lại thông tin quan trọng của hiện vật

Nhân viên vẫn có thể kiểm tra và chỉnh sửa nội dung trước khi sử dụng chính thức.

---

###  AI phân tích phản hồi

Hệ thống sử dụng AI để phân tích feedback của khách tham quan.

Các nội dung có thể được tổng hợp:

* Số lượng phản hồi
* Đánh giá tổng quan
* Xu hướng phản hồi
* Các vấn đề thường gặp
* Điểm tích cực
* Điểm cần cải thiện

Kết quả phân tích giúp hỗ trợ bảo tàng trong việc đánh giá trải nghiệm khách tham quan.

---

#  Phân quyền người dùng

MuseumAI sử dụng **Role-Based Access Control (RBAC)**.

| Role            | Quyền chính                                                     |
| --------------- | --------------------------------------------------------------- |
| `admin`         | Quản lý toàn hệ thống                                           |
| `content_staff` | Quản lý nội dung, hiện vật, triển lãm và chức năng AI liên quan |
| `ticket_staff`  | Quản lý khách tham quan và nghiệp vụ vé                         |
| `visitor`       | Sử dụng các chức năng dành cho khách tham quan                  |

JWT được sử dụng để xác thực request và kiểm soát quyền truy cập API.

---

#  Kiến trúc hệ thống

Hệ thống được tổ chức theo mô hình:

```text
┌─────────────────────────────┐
│          Frontend           │
│        React + Vite         │
└──────────────┬──────────────┘
               │
               │ REST API / JWT
               ▼
┌─────────────────────────────┐
│           Backend           │
│           FastAPI           │
│                             │
│  Routers                    │
│  Schemas                    │
│  Services                   │
│  Models                     │
│  Authentication / RBAC      │
└──────────────┬──────────────┘
               │
        ┌──────┴───────┐
        │              │
        ▼              ▼
┌──────────────┐ ┌──────────────┐
│ PostgreSQL   │ │ Gemini AI    │
│              │ │              │
│ Application  │ │ AI Assistant │
│ Data         │ │ Chatbot      │
│              │ │ Narration    │
│              │ │ Feedback AI  │
└──────────────┘ └──────────────┘
```

---

#  Công nghệ sử dụng

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

## Development Tools

* Visual Studio Code
* Git
* GitHub
* PowerShell
* Swagger / OpenAPI

---

#  Cấu trúc dự án

```text
MuseumAI_v2/
│
├── backend/
│   │
│   ├── app/
│   │   ├── core/
│   │   │   ├── database.py
│   │   │   ├── dependencies.py
│   │   │   └── security.py
│   │   │
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── role.py
│   │   │   ├── artifact.py
│   │   │   ├── exhibition.py
│   │   │   ├── exhibition_area.py
│   │   │   ├── ticket.py
│   │   │   └── feedback.py
│   │   │
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── artifacts.py
│   │   │   ├── exhibitions.py
│   │   │   ├── exhibition_areas.py
│   │   │   ├── tickets.py
│   │   │   ├── feedback.py
│   │   │   └── ai.py
│   │   │
│   │   ├── schemas/
│   │   │
│   │   ├── services/
│   │   │   ├── ai_assistant.py
│   │   │   └── feedback_ai.py
│   │   │
│   │   └── main.py
│   │
│   ├── alembic/
│   ├── uploads/
│   ├── .env
│   └── requirements.txt
│
├── frontend/
│   │
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
└── README.md
```

> Cấu trúc thực tế có thể được mở rộng thêm khi bổ sung module hoặc tài liệu.

---

#  Yêu cầu môi trường

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

---

#  Cài đặt

## 1. Clone repository

```powershell
git clone <repository-url>
cd MuseumAI_v2
```

---

## 2. Cài đặt Backend

Di chuyển vào thư mục backend:

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

## 3. Cấu hình PostgreSQL

Tạo database PostgreSQL cho MuseumAI.

Ví dụ:

```text
museum_ai
```

Sau đó cấu hình connection string trong file `.env`.

---

#  Cấu hình môi trường

Tạo file:

```text
backend/.env
```

Ví dụ:

```env
APP_NAME=MuseumAI
APP_VERSION=1.0.0
DEBUG=True

HOST=127.0.0.1
PORT=8000

DATABASE_URL=postgresql://postgres:<password>@localhost:5432/museum_ai

SECRET_KEY=<your-secret-key>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

GOOGLE_API_KEY=<your-google-gemini-api-key>
GEMINI_MODEL=gemini-3.1-flash-lite

CHROMA_DB_PATH=./chroma_db
UPLOAD_DIR=uploads
```

> Không commit file `.env` lên GitHub.

Nên sử dụng `.env.example` để cung cấp cấu hình mẫu mà không chứa secret thực tế.

---

#  Database Migration

Sau khi cấu hình database:

```powershell
alembic upgrade head
```

Kiểm tra migration:

```powershell
alembic current
```

---

#  Chạy Backend

Tại:

```text
MuseumAI_v2/backend
```

kích hoạt virtual environment:

```powershell
.\.venv\Scripts\Activate.ps1
```

Sau đó:

```powershell
uvicorn app.main:app --reload
```

Backend mặc định chạy tại:

```text
http://127.0.0.1:8000
```

Kiểm tra:

```text
http://127.0.0.1:8000/health
```

---

#  Chạy Frontend

Mở terminal mới:

```powershell
cd A:\MuseumAI_v2\frontend
```

Cài dependencies:

```powershell
npm install
```

Chạy development server:

```powershell
npm run dev
```

Frontend mặc định chạy tại:

```text
http://localhost:5173
```

---

#  API và Swagger

FastAPI cung cấp tài liệu API tự động.

Swagger UI:

```text
http://127.0.0.1:8000/docs
```

ReDoc:

```text
http://127.0.0.1:8000/redoc
```

Swagger có thể được sử dụng để kiểm tra:

* Authentication
* Users
* Artifacts
* Exhibitions
* Exhibition Areas
* Tickets
* Feedback
* AI
* Các REST API khác

---

#  Tài khoản demo

Hệ thống hiện có các tài khoản phục vụ kiểm thử theo role:

| Username  | Email                  | Role            |
| --------- | ---------------------- | --------------- |
| `admin`   | `admin@museumai.com`   | `admin`         |
| `content` | `content@museumai.com` | `content_staff` |
| `ticket`  | `ticket@museumai.com`  | `ticket_staff`  |
| `user01`  | `User02@museum.ai`     | `visitor`       |
| `user02`  | `User01@museum.ai`     | `visitor`       |

> **Không ghi mật khẩu thật vào README hoặc repository.**

---

#  Kiểm thử

## Kiểm tra Python syntax

Ví dụ:

```powershell
python -m py_compile app\core\dependencies.py
```

## Kiểm tra code bằng Ruff

```powershell
ruff check app
```

## Kiểm tra Backend

Khởi động:

```powershell
uvicorn app.main:app --reload
```

Sau đó kiểm tra Swagger:

```text
http://127.0.0.1:8000/docs
```

## Kiểm tra Authentication

Test:

```text
POST /api/auth/login
```

Sau khi đăng nhập thành công, sử dụng JWT để kiểm tra các endpoint yêu cầu authentication.

---

#  Bảo mật

Các thông tin nhạy cảm không được đưa trực tiếp vào source code.

Không commit:

```text
.env
*.key
*.pem
database password
Google API key
JWT secret
```

Có thể sử dụng `.gitignore`:

```gitignore
.env
.venv/
__pycache__/
*.pyc
node_modules/
dist/
chroma_db/
uploads/
```

---

#  Tài liệu dự án

Tài liệu phân tích và thiết kế được lưu trong thư mục:

```text
docs/
```

Bao gồm:

```text
docs/
├── urd/
│   └── URD.md
│
├── srs/
│   ├── SRS.md
│   └── Vision_Document.md
│
└── uml/
    └── Functional_Decomposition.md
```

Các tài liệu này mô tả yêu cầu, tầm nhìn, chức năng và thiết kế của hệ thống.

---

#  Luồng hoạt động tổng quát

```text
User
 │
 ▼
Frontend React
 │
 │ HTTP Request
 ▼
FastAPI Backend
 │
 ├── Authentication
 │
 ├── Authorization / RBAC
 │
 ├── Business Logic
 │
 ├── SQLAlchemy
 │
 ▼
PostgreSQL
 │
 └── Museum Data


AI Request
 │
 ▼
FastAPI AI Router
 │
 ▼
AI Service
 │
 ▼
Google Gemini
 │
 ▼
AI Response
 │
 ▼
Frontend
```

---

# Mục tiêu của dự án

MuseumAI hướng đến việc xây dựng một hệ thống quản lý bảo tàng hiện đại, trong đó AI không chỉ đóng vai trò chatbot mà còn được tích hợp vào các nghiệp vụ thực tế.

Các hướng ứng dụng AI chính:

```text
Quản lý dữ liệu
      │
      ▼
  MuseumAI
      │
      ├── AI Assistant
      ├── Artifact Q&A
      ├── AI Narration
      └── Feedback Analysis
```

---

# Định hướng phát triển

Một số hướng có thể tiếp tục phát triển:

* Cải thiện chất lượng câu trả lời của AI
* Bổ sung RAG cho dữ liệu hiện vật
* Tăng khả năng kiểm soát độ chính xác nội dung AI
* Bổ sung logging và monitoring
* Tăng cường kiểm thử tự động
* Container hóa hệ thống bằng Docker
* Triển khai production
* Cải thiện giao diện người dùng
* Bổ sung dashboard thống kê
* Tối ưu hiệu năng và bảo mật

---

# Tác giả

**MuseumAI**

Dự án được xây dựng với mục đích nghiên cứu, học tập và phát triển hệ thống quản lý bảo tàng có tích hợp trí tuệ nhân tạo.

---

## License

Dự án được sử dụng cho mục đích học tập và nghiên cứu.
