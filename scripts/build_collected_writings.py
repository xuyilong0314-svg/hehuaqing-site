#!/usr/bin/env python3
from __future__ import annotations

import argparse
from datetime import datetime
from pathlib import Path

from build_personal_archive import build_source_record, load_sources


DEFAULT_ARCHIVE_DIR = Path("personal_archive")
DEFAULT_OUTPUT_NAME = "华清文字全集_总合集.md"

GROUPS: list[tuple[str, tuple[str, ...]]] = [
    ("卷一 思想母本与方法书稿", ("理论与书稿", "应用与方法")),
    ("卷二 传播表达与日常问答", ("演讲与表达", "日常问答与思考")),
    (
        "卷三 生命书写与《原上寂寞的村庄》",
        (
            "日记与自我记录",
            "原上寂寞的村庄·口述整理",
            "原上寂寞的村庄·书稿整理",
        ),
    ),
    ("卷四 诗性与文学文本", ("诗歌与文学",)),
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Compile all configured source texts into one anthology document."
    )
    parser.add_argument(
        "--archive-dir",
        default=str(DEFAULT_ARCHIVE_DIR),
        help="Directory containing sources.json and generated archive files.",
    )
    parser.add_argument(
        "--config",
        help="Optional path to the sources JSON file. Defaults to <archive-dir>/sources.json.",
    )
    parser.add_argument(
        "--output",
        help="Optional output file path. Defaults to <archive-dir>/华清文字全集_总合集.md.",
    )
    return parser.parse_args()


def group_name_for(category: str) -> str:
    for title, categories in GROUPS:
        if category in categories:
            return title
    return "卷五 其他来源"


def build_same_content_lookup(records):
    grouped = {}
    for record in records:
        grouped.setdefault(record.content_hash, []).append(record)
    return grouped


def render_index(grouped_entries: dict[str, list[tuple[int, object]]]) -> list[str]:
    lines = ["## 总目录", ""]
    for group_title, entries in grouped_entries.items():
        if not entries:
            continue
        lines.append(f"### {group_title}")
        lines.append("")
        for index, record in entries:
            lines.append(f"{index}. {record.title}")
        lines.append("")
    return lines


def render_record(
    index: int,
    record,
    same_content_lookup: dict[str, list[object]],
) -> list[str]:
    siblings = [
        sibling
        for sibling in same_content_lookup[record.content_hash]
        if sibling.path != record.path
    ]

    lines = [
        f"### {index:02d}. {record.title}",
        "",
        f"- 分类：{record.category}",
        f"- 文件类型：{record.file_type}",
        f"- 原始路径：{record.path}",
        f"- 字符数：{len(record.text)}",
    ]
    if siblings:
        sibling_titles = "、".join(sibling.title for sibling in siblings)
        lines.append(f"- 当前检测到同内容来源：{sibling_titles}")
        lines.append("- 说明：这些来源在当前磁盘副本中内容一致，但本合集仍按独立作品来源分别保留。")

    lines.extend(
        [
            "",
            "#### 正文",
            "",
            record.text,
            "",
            "---",
            "",
        ]
    )
    return lines


def main() -> int:
    args = parse_args()
    archive_dir = Path(args.archive_dir).expanduser().resolve()
    config_path = (
        Path(args.config).expanduser().resolve()
        if args.config
        else archive_dir / "sources.json"
    )
    output_path = (
        Path(args.output).expanduser().resolve()
        if args.output
        else archive_dir / DEFAULT_OUTPUT_NAME
    )

    source_entries = load_sources(config_path)
    records = [build_source_record(entry) for entry in source_entries]
    same_content_lookup = build_same_content_lookup(records)

    grouped_entries: dict[str, list[tuple[int, object]]] = {}
    for title, _ in GROUPS:
        grouped_entries[title] = []
    grouped_entries["卷五 其他来源"] = []

    for index, record in enumerate(records, start=1):
        grouped_entries.setdefault(group_name_for(record.category), []).append((index, record))

    lines = [
        "# 华清文字全集",
        "",
        f"生成时间：{datetime.now().isoformat(timespec='seconds')}",
        "",
        "## 编纂说明",
        "",
        "这是一份将当前已识别文字来源合并为单一主文档的总合集。",
        "整理原则如下：",
        "",
        "1. 保留每个来源文件作为独立作品入口。",
        "2. 若当前磁盘副本存在同内容文件，正文仍分别保留，不在这里强行合并。",
        "3. 按书系角色而不是文件格式进行分卷。",
        "",
        f"当前共收录 {len(records)} 份来源文件。",
        "",
    ]

    same_content_groups = [group for group in same_content_lookup.values() if len(group) > 1]
    if same_content_groups:
        lines.extend(
            [
                "## 当前同内容来源说明",
                "",
            ]
        )
        for group_index, group in enumerate(same_content_groups, start=1):
            titles = "、".join(item.title for item in group)
            lines.append(f"{group_index}. {titles}")
        lines.append("")

    lines.extend(render_index(grouped_entries))

    for group_title, _ in GROUPS + [("卷五 其他来源", tuple())]:
        entries = grouped_entries.get(group_title, [])
        if not entries:
            continue
        lines.extend([f"## {group_title}", ""])
        for index, record in entries:
            lines.extend(render_record(index, record, same_content_lookup))

    output_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")

    print(f"Collected writings saved to: {output_path}")
    print(f"Sources included: {len(records)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
