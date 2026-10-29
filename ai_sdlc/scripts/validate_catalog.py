import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit


def validate(root):
    errors = []
    catalog_path = root / "catalog.json"
    data = json.loads(catalog_path.read_text(encoding="utf-8"))
    if data.get("schema_version") != 1:
        errors.append("Unsupported catalog schema_version")
    registered = {"agents": set(), "prompts": set(), "skills": set()}
    seen = set()
    skills = {}

    def register(value, category):
        path = (root / value).resolve()
        if not path.is_relative_to(root) or not path.is_file():
            errors.append(f"Invalid or missing catalog path: {value}")
        if value in registered[category]:
            errors.append(f"Duplicate {category} path: {value}")
        registered[category].add(value)
        return path

    for skill in data["skills"]:
        name = skill["id"]
        if name in skills:
            errors.append(f"Duplicate skill id: {name}")
        skills[name] = register(skill["path"], "skills")
        if skill["path"] != f"skills/{name}/SKILL.md":
            errors.append(f"Skill id/path mismatch: {name}")
    referenced_skills = set()
    for agent in data["agents"]:
        if agent["id"] in seen:
            errors.append(f"Duplicate agent id: {agent['id']}")
        seen.add(agent["id"])
        agent_path = register(agent["agent"], "agents")
        register(agent["prompt"], "prompts")
        if agent_path.stem != agent["id"]:
            errors.append(f"Agent id/path mismatch: {agent['id']}")
        if not agent["skills"]:
            errors.append(f"Agent has no skills: {agent['id']}")
        for name in agent["skills"]:
            referenced_skills.add(name)
            if name not in skills:
                errors.append(f"Unknown skill {name} for {agent['id']}")
    if referenced_skills != set(skills):
        errors.append(f"Unmapped skills: {sorted(set(skills) - referenced_skills)}")
    patterns = {"agents": "agents/*.md", "prompts": "prompts/*.md", "skills": "skills/*/SKILL.md"}
    for category, pattern in patterns.items():
        actual = {p.relative_to(root).as_posix() for p in root.glob(pattern)}
        if actual != registered[category]:
            errors.append(f"Catalog coverage mismatch in {category}: {sorted(actual ^ registered[category])}")
    for name, path in skills.items():
        if not path.is_file():
            continue
        text = path.read_text(encoding="utf-8-sig")
        match = re.match(r"\A---\n(.*?)\n---(?:\n|$)", text, re.DOTALL)
        if not match:
            errors.append(f"Missing skill frontmatter: {name}")
            continue
        fields = dict(re.findall(r"^(name|description):\s*(.+)$", match[1], re.MULTILINE))
        if fields.get("name") != name or not fields.get("description", "").strip():
            errors.append(f"Invalid skill metadata: {name}")
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", name) or len(name) >= 64:
            errors.append(f"Invalid skill name: {name}")
    documents = [*root.rglob("*.md"), root.parent / "AGENTS.md", root.parent / "PROMPTS.md"]
    for path in documents:
        text = path.read_text(encoding="utf-8-sig")
        fence = None
        table_columns = None
        for line_no, line in enumerate(text.splitlines(), 1):
            marker = re.match(r"^\s*(`{3,}|~{3,})(.*)$", line)
            if marker:
                token, tail = marker.groups()
                if fence is None:
                    fence = token
                elif token[0] == fence[0] and len(token) >= len(fence) and not tail.strip():
                    fence = None
                continue
            if fence is not None:
                continue
            if line.strip().startswith("|") and line.strip().endswith("|"):
                columns = len(re.split(r"(?<!\\)\|", line.strip())) - 2
                if table_columns is None:
                    table_columns = columns
                elif columns != table_columns:
                    errors.append(f"Inconsistent table columns: {path.relative_to(root.parent)}:{line_no}")
            else:
                table_columns = None
            for target in re.findall(r"\[[^\]\n]+\]\(([^)\n]+)\)", line):
                target = target.strip().strip("<>")
                parsed = urlsplit(target)
                if parsed.scheme or parsed.netloc or not parsed.path:
                    continue
                linked = (path.parent / unquote(parsed.path)).resolve()
                if not linked.is_relative_to(root.parent) or not linked.exists():
                    errors.append(f"Broken local link {path.relative_to(root.parent)}:{line_no}: {target}")
        if fence:
            errors.append(f"Unclosed code fence: {path.relative_to(root.parent)}")
    return data, errors


def main():
    root = Path(__file__).resolve().parents[1]
    try:
        data, errors = validate(root)
    except (OSError, ValueError, KeyError, TypeError) as exc:
        print(f"FAIL: invalid catalog or document: {exc}")
        return 1
    if errors:
        for error in errors:
            print(f"FAIL: {error}")
        return 1
    print(f"PASS: {len(data['agents'])} agents, {len(data['agents'])} prompts, {len(data['skills'])} skills; mappings, metadata, local links and fences")
    return 0


if __name__ == "__main__":
    sys.exit(main())
