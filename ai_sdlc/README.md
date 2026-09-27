# MuseumAI – AI-Augmented SDLC

Thư mục `ai_sdlc` định nghĩa cách sử dụng AI Agent và Skill
trong quy trình phát triển MuseumAI.

## Mục tiêu

AI hỗ trợ:

- Phân tích yêu cầu.
- Thiết kế.
- Lập trình.
- Kiểm thử.
- Review.
- Deployment.

AI chỉ đóng vai trò hỗ trợ.

Con người chịu trách nhiệm kiểm tra và xác nhận các quyết định cuối cùng.

## Structure

```text
ai_sdlc/
├── agents/
│   ├── requirement-agent.md
│   ├── design-agent.md
│   ├── coding-agent.md
│   ├── testing-agent.md
│   ├── critic-agent.md
│   └── deployment-agent.md
│
├── prompts/
│   ├── requirement-prompt.md
│   ├── design-prompt.md
│   ├── coding-prompt.md
│   ├── testing-prompt.md
│   ├── critic-prompt.md
│   └── deployment-prompt.md
│
└── skills/
    ├── requirement-analysis/
    ├── uml-design/
    ├── backend-development/
    ├── frontend-development/
    ├── testing/
    ├── code-review/
    └── deployment/