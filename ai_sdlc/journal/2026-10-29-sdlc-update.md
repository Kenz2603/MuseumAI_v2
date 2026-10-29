# Nhật ký SDLC-2026-10-29 — Bổ sung bộ hướng dẫn

- Yêu cầu: tự bổ sung agent, prompt và skill phù hợp MuseumAI; được phép push GitHub sau khi hoàn tất.
- Mốc source đầu tác vụ: `da60fed`. Phạm vi: tài liệu AI-SDLC, catalog và validator của tài liệu; không sửa ứng dụng, database hoặc deploy.
- Nguồn: AGENTS.md, PROMPTS.md, ai_sdlc hiện có; config/requirements/package.json; dashboard router và test harness. Bối cảnh Azure VM/Compose dựa trên phiên triển khai đã xác minh trước đó, không kết nối cloud lại trong tác vụ này.
- Skill hỗ trợ: skill-creator; tham chiếu các skill MuseumAI hiện có. Không spawn subagent; vai trò được rà soát tuần tự trong cùng phiên.

## Quyết định và thay đổi

Giữ 6 vai trò nền tảng và 7 skill cũ, bổ sung 5 vai trò và 6 skill chuyên biệt. Không tạo agent theo từng bảng CRUD vì trùng trách nhiệm Coding/Testing. Không tự cài skill vào thư mục cá nhân hoặc cấu hình native subagent.

Thêm catalog, workflow, 4 mẫu handoff/prompt experiment/nhật ký/deployment và validator. Giữ prompt tổng 00–12; đồng bộ mapping và prompt tác vụ. Cập nhật Azure VM/Compose là bối cảnh hiện hành, Railway khi được chọn.

Tách hướng dẫn đánh giá prompt khỏi kết quả thí nghiệm. Chưa gọi Gemini thật, chưa có kết quả so sánh V1/V2/V3; không tạo số liệu giả để điền biểu mẫu.

## Tự kiểm chứng

| Kiểm tra | Bằng chứng | Kết quả |
|---|---|---|
| Catalog coverage và mapping | validate_catalog.py: 11 agent, 11 prompt, 13 skill; không có skill mồ côi | PASS |
| Frontmatter skill | quick_validate.py của skill-creator, chạy riêng cho cả 13 thư mục | PASS |
| Link/fence/table | Validator đọc ai_sdlc cùng AGENTS.md/PROMPTS.md | PASS |
| Python validator | Ruff trên ai_sdlc/scripts/validate_catalog.py | PASS |
| Rà soát tình huống | Tự đọc hướng dẫn cho AI 503, dashboard null/0, test DB và frontend-only deploy | Self-review, không phải chạy hệ thống thật |
| Build/test ứng dụng | Không đổi app source/dependency; không cần chạy lại suite ứng dụng cho tác vụ tài liệu | NOT RUN |
| AI thật, cloud, database, deploy | Ngoài phạm vi cập nhật hướng dẫn | NOT RUN |

Trong self-review phát hiện các hàng mapping bị chèn nhầm vào bảng prompt tổng do thay chuỗi quá rộng; đã dựng lại registry từ catalog và thêm kiểm tra số cột bảng để phát hiện lỗi đó. Validator sau sửa PASS.

## Hạn chế và handoff

Frontmatter/link checks chỉ xác nhận cấu trúc, không chứng minh agent luôn đưa ra quyết định đúng. Quy trình chuyên biệt chưa được forward-test độc lập trên tác vụ thật. Chưa có human review nội dung ngoài yêu cầu cho phép thực hiện tác vụ.

Người dùng tiếp tục dùng routing trong ai_sdlc/README.md; khi phát sinh nhiệm vụ thật, ghi kết quả vào nhật ký mới. Push được báo bằng commit và remote evidence ở cuối phiên, không dùng nhật ký này làm bằng chứng đã deploy ứng dụng.
