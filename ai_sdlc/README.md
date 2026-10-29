# MuseumAI – AI-Augmented SDLC

Bộ hướng dẫn phát triển MuseumAI gồm **11 agent, 13 skill và 11 prompt tác vụ**. Vai trò là tài liệu trong repository, không phải cấu hình native subagent hay tác vụ tự chạy. Dùng [workflow.md](workflow.md) để hiểu phạm vi, quyền và handoff.

## Bắt đầu

1. Đọc yêu cầu hiện tại và [AGENTS.md](../AGENTS.md).
2. Chọn một vai trò phù hợp trong bảng dưới; đọc agent, skill và prompt tương ứng.
3. Thực hiện phần đã được cho phép, kiểm chứng và bàn giao. Không bắt tác vụ nhỏ chạy toàn pipeline.
4. Khi thay bộ hướng dẫn, cập nhật [catalog.json](catalog.json) và chạy validator.

[Catalog](catalog.json) là danh mục để kiểm tra mapping; [PROMPTS.md](../PROMPTS.md) giữ prompt tổng 00–12 và dẫn tới prompt chuyên biệt. Prompt SDLC dùng để làm phần mềm, không được tự động nạp làm system prompt của Gemini trong ứng dụng.

## Agent – Skill – Prompt

| Agent | Skill | Prompt |
|---|---|---|
| [Requirement Agent](agents/requirement-agent.md) | [Requirement Analysis](skills/requirement-analysis/SKILL.md) | [Tác vụ](prompts/requirement-prompt.md) |
| [Design Agent](agents/design-agent.md) | [UML Design](skills/uml-design/SKILL.md) | [Tác vụ](prompts/design-prompt.md) |
| [Coding Agent](agents/coding-agent.md) | [Backend Development](skills/backend-development/SKILL.md), [Frontend Development](skills/frontend-development/SKILL.md) | [Tác vụ](prompts/coding-prompt.md) |
| [Testing Agent](agents/testing-agent.md) | [Testing](skills/testing/SKILL.md) | [Tác vụ](prompts/testing-prompt.md) |
| [Critic Agent](agents/critic-agent.md) | [Code Review](skills/code-review/SKILL.md), [Requirement Analysis](skills/requirement-analysis/SKILL.md), [UML Design](skills/uml-design/SKILL.md) | [Tác vụ](prompts/critic-prompt.md) |
| [Deployment Agent](agents/deployment-agent.md) | [Deployment](skills/deployment/SKILL.md) | [Tác vụ](prompts/deployment-prompt.md) |
| [AI Engineer Agent](agents/ai-engineer-agent.md) | [AI Integration](skills/ai-integration/SKILL.md), [Prompt Evaluation](skills/prompt-evaluation/SKILL.md) | [Tác vụ](prompts/ai-engineer-prompt.md) |
| [Security Agent](agents/security-agent.md) | [Security Review](skills/security-review/SKILL.md) | [Tác vụ](prompts/security-prompt.md) |
| [Database Agent](agents/database-agent.md) | [Database Management](skills/database-management/SKILL.md) | [Tác vụ](prompts/database-prompt.md) |
| [Incident Agent](agents/incident-agent.md) | [Incident Diagnosis](skills/incident-diagnosis/SKILL.md) | [Tác vụ](prompts/incident-prompt.md) |
| [Documentation Agent](agents/documentation-agent.md) | [Technical Documentation](skills/technical-documentation/SKILL.md) | [Tác vụ](prompts/documentation-prompt.md) |

## Routing theo nhiệm vụ

| Nhiệm vụ | Vai trò chính | Bằng chứng cần |
|---|---|---|
| Yêu cầu mới/thay nghiệp vụ | Requirement → Design | UC, quyền theo action, acceptance criteria |
| Sửa frontend/backend | Coding → Testing → Critic | Diff có giới hạn, build/test và giới hạn |
| Lỗi AI 5xx, prompt/chất lượng AI | Incident / AI Engineer | Source, log an toàn, mock tái hiện; AI thật tách riêng |
| So sánh ba prompt | AI Engineer + Prompt Evaluation | Ba bản thực tế, fixture/đáp án chuẩn, tiêu chí và kết quả |
| JWT/RBAC/PII/upload | Security | Negative case, ranh giới dữ liệu, finding có bằng chứng |
| SSL/schema/Alembic/restore | Database | Graph/source, impact; test ghi trên DB test |
| GitHub/domain/release | Deployment | Quyền đã có, artifact/rollback, domain đúng bundle |
| README/báo cáo/demo/nhật ký | Documentation | Source/test/deploy evidence và hạn chế |

Các vai trò có thể được thực hiện tuần tự bởi cùng một trợ lý. Chọn skill theo tác động, không tự spawn agent hoặc thêm nghiệp vụ. Không gọi AI thật, chạy seed/migration hoặc deploy chỉ vì prompt mẫu có bước đó.

## Môi trường và ranh giới

Bối cảnh triển khai hiện hành đã xác nhận là Azure VM/Docker Compose + Caddy và Azure PostgreSQL; Railway khi được yêu cầu. Xác minh cấu hình service thực tế trước deploy, không hardcode IP/SSH key hay thông tin đăng nhập vào tài liệu.

Backend phải quyết định quyền/giá vé. UI ẩn dashboard statistic null ngoài quyền, giữ số 0 hợp lệ. Narration chỉ là draft; save là hành động nhân viên riêng. Chat HTTP 200 có thể fallback, health không chứng minh DB/AI, mock không chứng minh chất lượng nội dung.

## Biểu mẫu dùng khi cần

- [Handoff](templates/handoff.md): phạm vi, UC, diff, test và bước tiếp theo.
- [Prompt experiment](templates/prompt-experiment.md): V1/V2/V3, dữ liệu chuẩn, kết quả, tự kiểm chứng.
- [AI-SDLC log](templates/ai-sdlc-log.md): AI/con người làm gì, quyết định, bằng chứng và hạn chế.
- [Deployment record](templates/deployment-record.md): artifact trước/sau, verification và rollback.

Nhật ký cập nhật bộ hướng dẫn: [2026-10-29](journal/2026-10-29-sdlc-update.md).

Chưa có số liệu đánh giá prompt thật thì ghi NOT RUN, không điền bảng bằng kết quả giả.

## Kiểm tra bộ hướng dẫn

Từ project root, dùng Python 3.12+ của dự án:

```powershell
python ai_sdlc/scripts/validate_catalog.py
```

Validator chỉ đọc file tài liệu/catalog trong workspace, kiểm tra mapping, frontmatter, file coverage, local links và code fence; không import app, đọc dotenv, kết nối database hay gọi AI.

Skill còn được kiểm tra bằng quick_validate.py của skill-creator nếu công cụ đó có trong môi trường. Thay tài liệu không cần build/deploy lại ứng dụng và không tự cài các skill vào thư mục cá nhân.
