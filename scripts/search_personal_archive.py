#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import sqlite3
import sys
from pathlib import Path


DEFAULT_ARCHIVE_DIR = Path("personal_archive")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Search the local personal archive built by build_personal_archive.py."
    )
    parser.add_argument("query", help="Keyword or phrase to search for.")
    parser.add_argument(
        "--archive-dir",
        default=str(DEFAULT_ARCHIVE_DIR),
        help="Directory containing the generated personal archive.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=8,
        help="Maximum number of matching passages to display.",
    )
    return parser.parse_args()


def split_terms(query: str) -> list[str]:
    return [term.casefold() for term in re.split(r"\s+", query.strip()) if term.strip()]


def count_occurrences(haystack: str, needle: str) -> int:
    return haystack.count(needle) if needle else 0


def build_snippet(text: str, term: str) -> str:
    if not term:
        return text[:180]
    lowered = text.casefold()
    start = lowered.find(term)
    if start == -1:
        return text[:180]
    left = max(0, start - 60)
    right = min(len(text), start + len(term) + 120)
    prefix = "..." if left > 0 else ""
    suffix = "..." if right < len(text) else ""
    return f"{prefix}{text[left:right]}{suffix}"


def load_rows(db_path: Path) -> tuple[dict[str, sqlite3.Row], list[sqlite3.Row]]:
    connection = sqlite3.connect(db_path)
    connection.row_factory = sqlite3.Row
    try:
        docs = {
            row["doc_id"]: row
            for row in connection.execute(
                """
                SELECT doc_id, title, title_search, category, canonical_path,
                       same_content_titles_json, same_content_titles_search
                FROM documents
                """
            )
        }
        passages = list(
            connection.execute(
                """
                SELECT doc_id, chunk_index, text, text_search
                FROM passages
                ORDER BY doc_id, chunk_index
                """
            )
        )
        return docs, passages
    finally:
        connection.close()


def main() -> int:
    args = parse_args()
    archive_dir = Path(args.archive_dir).expanduser().resolve()
    db_path = archive_dir / "index.sqlite"
    if not db_path.exists():
        print(
            f"Archive database not found: {db_path}\n"
            "Run python3 scripts/build_personal_archive.py first.",
            file=sys.stderr,
        )
        return 1

    terms = split_terms(args.query)
    if not terms:
        print("Please provide a non-empty query.", file=sys.stderr)
        return 1

    docs, passages = load_rows(db_path)
    matches: list[tuple[int, sqlite3.Row, sqlite3.Row]] = []
    full_query = args.query.strip().casefold()

    for passage in passages:
        doc = docs[passage["doc_id"]]
        combined = "\n".join(
            [
                doc["title_search"],
                doc["same_content_titles_search"],
                passage["text_search"],
            ]
        )
        if not all(term in combined for term in terms):
            continue
        score = sum(count_occurrences(combined, term) for term in terms)
        if full_query and full_query in passage["text_search"]:
            score += 3
        matches.append((score, doc, passage))

    matches.sort(
        key=lambda item: (
            -item[0],
            item[1]["title"],
            item[2]["chunk_index"],
        )
    )

    if not matches:
        print(f"No matches found for: {args.query}")
        return 0

    for index, (score, doc, passage) in enumerate(matches[: args.limit], start=1):
        same_content_titles = json.loads(doc["same_content_titles_json"])
        snippet = build_snippet(passage["text"], terms[0]).replace("\n", " ")
        print(f"{index}. {doc['title']}  [score={score}]")
        print(f"   分类: {doc['category']}")
        print(f"   路径: {doc['canonical_path']}")
        if same_content_titles:
            print(f"   同内容文件: {'、'.join(same_content_titles)}")
        print(f"   片段: 第 {passage['chunk_index']} 段")
        print(f"   摘要: {snippet}")
        print()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
