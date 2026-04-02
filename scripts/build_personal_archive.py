#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sqlite3
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any


DEFAULT_ARCHIVE_DIR = Path("personal_archive")
SUPPORTED_TEXTUTIL_SUFFIXES = {".doc", ".docx", ".odt", ".rtf", ".rtfd"}
TEXT_ENCODINGS = ("utf-8", "utf-16", "utf-16le", "utf-16be", "gb18030", "big5")


@dataclass
class SourceRecord:
    title: str
    category: str
    path: Path
    file_type: str
    size_bytes: int
    modified_at: str
    content_hash: str
    text: str


@dataclass
class ArchiveDocument:
    doc_id: str
    title: str
    category: str
    canonical_path: str
    file_type: str
    content_hash: str
    text: str
    passages: list[str]
    same_content_titles: list[str]
    same_content_paths: list[str]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build a local searchable archive from personal writing files."
    )
    parser.add_argument(
        "--archive-dir",
        default=str(DEFAULT_ARCHIVE_DIR),
        help="Directory used for the generated local archive.",
    )
    parser.add_argument(
        "--config",
        help="Optional path to the sources JSON file. Defaults to <archive-dir>/sources.json.",
    )
    return parser.parse_args()


def load_sources(config_path: Path) -> list[dict[str, Any]]:
    if not config_path.exists():
        raise FileNotFoundError(
            f"Missing sources config: {config_path}\n"
            "Create personal_archive/sources.json with a top-level 'sources' array."
        )

    payload = json.loads(config_path.read_text(encoding="utf-8"))
    sources = payload.get("sources")
    if not isinstance(sources, list) or not sources:
        raise ValueError(f"{config_path} must contain a non-empty 'sources' array.")

    return sources


def read_plain_text(path: Path) -> str:
    raw = path.read_bytes()
    for encoding in TEXT_ENCODINGS:
        try:
            return raw.decode(encoding)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="replace")


def extract_with_textutil(path: Path) -> str:
    if shutil.which("textutil") is None:
        raise RuntimeError("textutil is required to extract .docx/.rtf files on this machine.")

    result = subprocess.run(
        ["textutil", "-convert", "txt", "-stdout", str(path)],
        check=True,
        capture_output=True,
    )
    return result.stdout.decode("utf-8", errors="replace")


def normalize_text(text: str) -> str:
    text = text.replace("\ufeff", "")
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    lines = [line.rstrip() for line in text.split("\n")]

    normalized_lines: list[str] = []
    blank_pending = False
    for line in lines:
        if line.strip():
            if blank_pending and normalized_lines:
                normalized_lines.append("")
            normalized_lines.append(line)
            blank_pending = False
        else:
            blank_pending = True

    return "\n".join(normalized_lines).strip()


def compute_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def build_source_record(entry: dict[str, Any]) -> SourceRecord:
    raw_path = entry.get("path")
    if not raw_path:
        raise ValueError("Each source entry must include a 'path'.")

    path = Path(raw_path).expanduser()
    if not path.exists():
        raise FileNotFoundError(f"Source file does not exist: {path}")

    suffix = path.suffix.lower()
    if suffix in SUPPORTED_TEXTUTIL_SUFFIXES:
        extracted = extract_with_textutil(path)
    else:
        extracted = read_plain_text(path)

    normalized = normalize_text(extracted)
    stat = path.stat()
    title = str(entry.get("title") or path.stem)
    category = str(entry.get("category") or "未分类")

    return SourceRecord(
        title=title,
        category=category,
        path=path.resolve(),
        file_type=suffix.lstrip(".") or "plain",
        size_bytes=stat.st_size,
        modified_at=datetime.fromtimestamp(stat.st_mtime).isoformat(timespec="seconds"),
        content_hash=compute_hash(normalized),
        text=normalized,
    )


def split_paragraphs(text: str) -> list[str]:
    if not text:
        return []

    parts: list[str] = []
    current: list[str] = []
    for line in text.split("\n"):
        if line.strip():
            current.append(line)
            continue
        if current:
            parts.append("\n".join(current))
            current = []
    if current:
        parts.append("\n".join(current))
    return parts


def split_long_block(block: str, hard_limit: int) -> list[str]:
    if len(block) <= hard_limit:
        return [block]

    pieces: list[str] = []
    cursor = 0
    while cursor < len(block):
        end = min(len(block), cursor + hard_limit)
        slice_end = end
        if end < len(block):
            window = block[cursor:end]
            pivot = max(window.rfind("。"), window.rfind("！"), window.rfind("？"), window.rfind("\n"))
            if pivot > 0:
                slice_end = cursor + pivot + 1
        if slice_end <= cursor:
            slice_end = end
        pieces.append(block[cursor:slice_end].strip())
        cursor = slice_end
    return [piece for piece in pieces if piece]


def build_passages(text: str, target_size: int = 480, hard_limit: int = 820) -> list[str]:
    paragraphs = split_paragraphs(text)
    passages: list[str] = []
    current: list[str] = []
    current_size = 0

    def flush() -> None:
        nonlocal current_size
        if current:
            passages.append("\n\n".join(current).strip())
            current.clear()
            current_size = 0

    for paragraph in paragraphs:
        chunks = split_long_block(paragraph, hard_limit)
        for chunk in chunks:
            extra = len(chunk) + (2 if current else 0)
            if current and current_size + extra > target_size:
                flush()
            current.append(chunk)
            current_size += extra
    flush()

    if not passages and text:
        passages = split_long_block(text, hard_limit)
    return passages


def casefold_text(value: str) -> str:
    return value.casefold()


def build_documents(source_entries: list[dict[str, Any]]) -> tuple[list[ArchiveDocument], list[SourceRecord]]:
    source_records = [build_source_record(entry) for entry in source_entries]
    grouped: dict[str, list[SourceRecord]] = {}
    for record in source_records:
        grouped.setdefault(record.content_hash, []).append(record)

    documents: list[ArchiveDocument] = []
    for index, record in enumerate(source_records, start=1):
        group = grouped[record.content_hash]
        siblings = [item for item in group if item.path != record.path]
        path_hash = hashlib.sha1(str(record.path).encode("utf-8")).hexdigest()[:12]
        documents.append(
            ArchiveDocument(
                doc_id=f"doc_{index:02d}_{path_hash}",
                title=record.title,
                category=record.category,
                canonical_path=str(record.path),
                file_type=record.file_type,
                content_hash=record.content_hash,
                text=record.text,
                passages=build_passages(record.text),
                same_content_titles=[item.title for item in siblings],
                same_content_paths=[str(item.path) for item in siblings],
            )
        )

    documents.sort(key=lambda item: item.title)
    return documents, source_records


def reset_directory(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def write_text_exports(archive_dir: Path, documents: list[ArchiveDocument]) -> None:
    texts_dir = archive_dir / "texts"
    if texts_dir.exists():
        shutil.rmtree(texts_dir)
    texts_dir.mkdir(parents=True, exist_ok=True)

    for document in documents:
        export_path = texts_dir / f"{document.doc_id}.txt"
        export_path.write_text(document.text, encoding="utf-8")


def write_manifest(
    archive_dir: Path,
    documents: list[ArchiveDocument],
    source_records: list[SourceRecord],
) -> None:
    same_content_group_count = len({record.content_hash for record in source_records if sum(item.content_hash == record.content_hash for item in source_records) > 1})
    same_content_document_count = sum(
        1 for record in source_records if sum(item.content_hash == record.content_hash for item in source_records) > 1
    )
    manifest = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "source_count": len(source_records),
        "unique_document_count": len(documents),
        "same_content_group_count": same_content_group_count,
        "same_content_document_count": same_content_document_count,
        "documents": [
            {
                "doc_id": document.doc_id,
                "title": document.title,
                "category": document.category,
                "canonical_path": document.canonical_path,
                "file_type": document.file_type,
                "content_hash": document.content_hash,
                "char_count": len(document.text),
                "passage_count": len(document.passages),
                "same_content_titles": document.same_content_titles,
                "same_content_paths": document.same_content_paths,
            }
            for document in documents
        ],
    }
    (archive_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def build_database(archive_dir: Path, documents: list[ArchiveDocument], source_records: list[SourceRecord]) -> None:
    db_path = archive_dir / "index.sqlite"
    if db_path.exists():
        db_path.unlink()

    connection = sqlite3.connect(db_path)
    try:
        connection.executescript(
            """
            PRAGMA journal_mode = WAL;
            CREATE TABLE documents (
                doc_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                title_search TEXT NOT NULL,
                category TEXT NOT NULL,
                canonical_path TEXT NOT NULL,
                file_type TEXT NOT NULL,
                content_hash TEXT NOT NULL,
                char_count INTEGER NOT NULL,
                passage_count INTEGER NOT NULL,
                same_content_titles_json TEXT NOT NULL,
                same_content_titles_search TEXT NOT NULL,
                same_content_paths_json TEXT NOT NULL,
                generated_at TEXT NOT NULL
            );

            CREATE TABLE source_files (
                source_id TEXT PRIMARY KEY,
                doc_id TEXT NOT NULL REFERENCES documents(doc_id),
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                path TEXT NOT NULL,
                file_type TEXT NOT NULL,
                size_bytes INTEGER NOT NULL,
                modified_at TEXT NOT NULL,
                is_canonical INTEGER NOT NULL
            );

            CREATE TABLE passages (
                passage_id INTEGER PRIMARY KEY AUTOINCREMENT,
                doc_id TEXT NOT NULL REFERENCES documents(doc_id),
                chunk_index INTEGER NOT NULL,
                text TEXT NOT NULL,
                text_search TEXT NOT NULL,
                char_count INTEGER NOT NULL,
                UNIQUE(doc_id, chunk_index)
            );

            CREATE INDEX idx_source_files_doc_id ON source_files(doc_id);
            CREATE INDEX idx_passages_doc_id ON passages(doc_id);
            """
        )

        generated_at = datetime.now().isoformat(timespec="seconds")
        source_lookup = {str(source.path): source for source in source_records}
        for document in documents:
            sibling_titles = document.same_content_titles
            sibling_paths = document.same_content_paths
            connection.execute(
                """
                INSERT INTO documents (
                    doc_id, title, title_search, category, canonical_path, file_type,
                    content_hash, char_count, passage_count, same_content_titles_json, same_content_titles_search,
                    same_content_paths_json, generated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    document.doc_id,
                    document.title,
                    casefold_text(document.title),
                    document.category,
                    document.canonical_path,
                    document.file_type,
                    document.content_hash,
                    len(document.text),
                    len(document.passages),
                    json.dumps(sibling_titles, ensure_ascii=False),
                    casefold_text("\n".join(sibling_titles)),
                    json.dumps(sibling_paths, ensure_ascii=False),
                    generated_at,
                ),
            )

            source = source_lookup[document.canonical_path]
            source_id = f"{document.doc_id}_src_1"
            connection.execute(
                """
                INSERT INTO source_files (
                    source_id, doc_id, title, category, path, file_type,
                    size_bytes, modified_at, is_canonical
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    source_id,
                    document.doc_id,
                    source.title,
                    source.category,
                    str(source.path),
                    source.file_type,
                    source.size_bytes,
                    source.modified_at,
                    1,
                ),
            )

            for chunk_index, passage in enumerate(document.passages, start=1):
                connection.execute(
                    """
                    INSERT INTO passages (doc_id, chunk_index, text, text_search, char_count)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (
                        document.doc_id,
                        chunk_index,
                        passage,
                        casefold_text(passage),
                        len(passage),
                    ),
                )

        connection.commit()
    finally:
        connection.close()


def build_search_page(archive_dir: Path, documents: list[ArchiveDocument], source_records: list[SourceRecord]) -> None:
    same_content_group_count = len({record.content_hash for record in source_records if sum(item.content_hash == record.content_hash for item in source_records) > 1})
    same_content_document_count = sum(
        1 for record in source_records if sum(item.content_hash == record.content_hash for item in source_records) > 1
    )
    docs_payload = [
        {
            "doc_id": document.doc_id,
            "title": document.title,
            "title_search": casefold_text(document.title),
            "category": document.category,
            "canonical_path": document.canonical_path,
            "same_content_titles": document.same_content_titles,
            "same_content_titles_search": casefold_text("\n".join(document.same_content_titles)),
            "same_content_paths": document.same_content_paths,
            "char_count": len(document.text),
            "passage_count": len(document.passages),
        }
        for document in documents
    ]
    passages_payload = [
        {
            "doc_id": document.doc_id,
            "chunk_index": chunk_index,
            "text": passage,
            "text_search": casefold_text(passage),
        }
        for document in documents
        for chunk_index, passage in enumerate(document.passages, start=1)
    ]

    data = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "source_count": len(source_records),
        "unique_document_count": len(documents),
        "same_content_group_count": same_content_group_count,
        "same_content_document_count": same_content_document_count,
        "documents": docs_payload,
        "passages": passages_payload,
    }

    html = """<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>个人文字资料库</title>
  <style>
    :root {
      --bg: #f6f1e8;
      --card: rgba(255, 251, 244, 0.92);
      --line: #d4c7b6;
      --text: #2e241b;
      --muted: #6a5c4c;
      --accent: #8c4f2e;
      --accent-soft: rgba(140, 79, 46, 0.12);
      --shadow: 0 18px 36px rgba(79, 52, 33, 0.12);
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Songti SC", "STSong", "Noto Serif CJK SC", serif;
      color: var(--text);
      background:
        radial-gradient(circle at top, rgba(244, 221, 196, 0.75), transparent 35%),
        linear-gradient(160deg, #f9f3eb 0%, #f3ebdf 45%, #efe4d5 100%);
      min-height: 100vh;
    }

    main {
      max-width: 1080px;
      margin: 0 auto;
      padding: 56px 20px 72px;
    }

    .hero {
      background: linear-gradient(135deg, rgba(255, 250, 245, 0.94), rgba(249, 240, 228, 0.9));
      border: 1px solid rgba(159, 126, 100, 0.18);
      border-radius: 28px;
      padding: 30px;
      box-shadow: var(--shadow);
      backdrop-filter: blur(12px);
    }

    h1 {
      margin: 0 0 10px;
      font-size: clamp(2rem, 4vw, 3.2rem);
      line-height: 1.1;
      letter-spacing: 0.02em;
    }

    .subtitle, .meta, .doc-meta, .empty, .tip {
      color: var(--muted);
    }

    .subtitle {
      margin: 0;
      font-size: 1.02rem;
      line-height: 1.7;
      max-width: 780px;
    }

    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 18px;
      font-size: 0.95rem;
    }

    .pill {
      border: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.55);
      border-radius: 999px;
      padding: 8px 14px;
    }

    .search-shell {
      margin-top: 24px;
      display: grid;
      gap: 12px;
    }

    .search-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    input[type="search"] {
      flex: 1 1 520px;
      min-width: 260px;
      border: 1px solid rgba(127, 100, 74, 0.35);
      border-radius: 18px;
      padding: 16px 18px;
      font: inherit;
      font-size: 1rem;
      background: rgba(255, 255, 255, 0.86);
      color: var(--text);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
    }

    button {
      border: none;
      border-radius: 16px;
      padding: 14px 18px;
      font: inherit;
      cursor: pointer;
      background: var(--accent);
      color: #fff7f0;
      box-shadow: 0 10px 24px rgba(140, 79, 46, 0.2);
    }

    button.secondary {
      background: rgba(255, 255, 255, 0.8);
      color: var(--text);
      border: 1px solid rgba(127, 100, 74, 0.24);
      box-shadow: none;
    }

    .results {
      margin-top: 24px;
      display: grid;
      gap: 16px;
    }

    .card {
      background: var(--card);
      border: 1px solid rgba(159, 126, 100, 0.18);
      border-radius: 22px;
      padding: 22px;
      box-shadow: 0 14px 30px rgba(80, 57, 35, 0.08);
    }

    .card h2 {
      margin: 0 0 8px;
      font-size: 1.25rem;
      line-height: 1.35;
    }

    .doc-meta {
      margin: 0 0 14px;
      font-size: 0.92rem;
      line-height: 1.7;
      word-break: break-all;
    }

    .snippet {
      margin: 0;
      line-height: 1.85;
      white-space: pre-wrap;
      font-size: 1rem;
    }

    mark {
      background: rgba(215, 166, 75, 0.35);
      color: inherit;
      border-radius: 0.3em;
      padding: 0 0.08em;
    }

    .empty {
      padding: 32px 10px 10px;
      text-align: center;
      font-size: 1rem;
    }

    @media (max-width: 720px) {
      main { padding: 28px 16px 48px; }
      .hero { padding: 22px; border-radius: 22px; }
      .card { padding: 18px; }
      button { width: 100%; }
    }
  </style>
</head>
<body>
  <main>
    <section class="hero">
      <h1>个人文字资料库</h1>
      <p class="subtitle">这是一个本地离线搜索页，收录了你当前导入的文字材料。输入关键词后，会直接返回命中的文本片段、来源标题和原始路径。</p>
      <div class="meta" id="summary"></div>
      <div class="search-shell">
        <div class="search-row">
          <input id="query" type="search" placeholder="输入关键词，例如：愿景、本光、立命、课程、诗" autocomplete="off">
          <button id="search">搜索</button>
          <button id="clear" class="secondary">清空</button>
        </div>
        <div class="tip">提示：支持中文短词直接检索；如果输入多个词，会返回同时命中这些词的片段。</div>
      </div>
    </section>
    <section class="results" id="results"></section>
  </main>
  <script id="archive-data" type="application/json">__ARCHIVE_DATA__</script>
  <script>
    const data = JSON.parse(document.getElementById("archive-data").textContent);
    const docsById = Object.fromEntries(data.documents.map((doc) => [doc.doc_id, doc]));
    const summary = document.getElementById("summary");
    const results = document.getElementById("results");
    const queryInput = document.getElementById("query");

    summary.innerHTML = [
      `<span class="pill">来源文件 ${data.source_count} 份</span>`,
      `<span class="pill">入库文档 ${data.unique_document_count} 份</span>`,
      `<span class="pill">同内容组 ${data.same_content_group_count} 组</span>`,
      `<span class="pill">同内容文件 ${data.same_content_document_count} 份</span>`,
      `<span class="pill">生成时间 ${escapeHtml(data.generated_at)}</span>`
    ].join("");

    function escapeHtml(value) {
      return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
    }

    function splitTerms(raw) {
      return raw.trim().toLocaleLowerCase().split(/\\s+/).filter(Boolean);
    }

    function countOccurrences(haystack, needle) {
      if (!needle) return 0;
      let count = 0;
      let fromIndex = 0;
      while (true) {
        const found = haystack.indexOf(needle, fromIndex);
        if (found === -1) return count;
        count += 1;
        fromIndex = found + Math.max(needle.length, 1);
      }
    }

    function pickSnippet(text, term) {
      if (!term) return text.slice(0, 180);
      const lower = text.toLocaleLowerCase();
      const firstIndex = lower.indexOf(term);
      if (firstIndex === -1) return text.slice(0, 180);
      const start = Math.max(0, firstIndex - 60);
      const end = Math.min(text.length, firstIndex + Math.max(term.length, 1) + 120);
      const prefix = start > 0 ? "..." : "";
      const suffix = end < text.length ? "..." : "";
      return `${prefix}${text.slice(start, end)}${suffix}`;
    }

    function highlight(text, terms) {
      let html = escapeHtml(text);
      const uniqueTerms = [...new Set(terms)].sort((a, b) => b.length - a.length);
      for (const term of uniqueTerms) {
        if (!term) continue;
        const pattern = new RegExp(term.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&"), "gi");
        html = html.replace(pattern, (match) => `<mark>${match}</mark>`);
      }
      return html;
    }

    function renderEmpty(message) {
      results.innerHTML = `<div class="empty">${escapeHtml(message)}</div>`;
    }

    function searchArchive(rawQuery) {
      const terms = splitTerms(rawQuery);
      if (!terms.length) {
        const docCards = data.documents
          .slice()
          .sort((a, b) => a.title.localeCompare(b.title, "zh-Hans-CN"))
          .map((doc) => `
            <article class="card">
              <h2>${escapeHtml(doc.title)}</h2>
              <p class="doc-meta">分类：${escapeHtml(doc.category)}<br>路径：${escapeHtml(doc.canonical_path)}<br>篇幅：${doc.char_count} 字符 / ${doc.passage_count} 段</p>
              <p class="snippet">${doc.same_content_titles.length ? `同内容文件：${escapeHtml(doc.same_content_titles.join("、"))}` : "这份文档目前没有检测到同内容文件。"}</p>
            </article>
          `)
          .join("");
        results.innerHTML = docCards;
        return;
      }

      const matches = [];
      for (const passage of data.passages) {
        const doc = docsById[passage.doc_id];
        const combined = `${doc.title_search}\\n${doc.same_content_titles_search}\\n${passage.text_search}`;
        if (!terms.every((term) => combined.includes(term))) {
          continue;
        }
        const score = terms.reduce((total, term) => total + countOccurrences(combined, term), 0);
        const exactBoost = passage.text_search.includes(rawQuery.trim().toLocaleLowerCase()) ? 3 : 0;
        matches.push({ doc, passage, score: score + exactBoost });
      }

      matches.sort((left, right) => right.score - left.score || left.doc.title.localeCompare(right.doc.title, "zh-Hans-CN") || left.passage.chunk_index - right.passage.chunk_index);

      if (!matches.length) {
        renderEmpty(`没有找到与“${rawQuery.trim()}”相关的片段。`);
        return;
      }

      results.innerHTML = matches.slice(0, 60).map(({ doc, passage }) => {
        const snippet = pickSnippet(passage.text, terms[0]);
        const siblingText = doc.same_content_titles.length ? `同内容文件：${doc.same_content_titles.join("、")}<br>` : "";
        return `
          <article class="card">
            <h2>${escapeHtml(doc.title)}</h2>
            <p class="doc-meta">分类：${escapeHtml(doc.category)}<br>${siblingText}原始路径：${escapeHtml(doc.canonical_path)}<br>片段：第 ${passage.chunk_index} 段</p>
            <p class="snippet">${highlight(snippet, terms)}</p>
          </article>
        `;
      }).join("");
    }

    document.getElementById("search").addEventListener("click", () => searchArchive(queryInput.value));
    document.getElementById("clear").addEventListener("click", () => {
      queryInput.value = "";
      searchArchive("");
      queryInput.focus();
    });
    queryInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        searchArchive(queryInput.value);
      }
    });
    queryInput.addEventListener("input", () => {
      const value = queryInput.value.trim();
      if (!value) {
        searchArchive("");
      }
    });

    searchArchive("");
  </script>
</body>
</html>
"""

    serialized = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
    (archive_dir / "search.html").write_text(
        html.replace("__ARCHIVE_DATA__", serialized),
        encoding="utf-8",
    )


def main() -> int:
    args = parse_args()
    archive_dir = Path(args.archive_dir).expanduser().resolve()
    config_path = Path(args.config).expanduser().resolve() if args.config else archive_dir / "sources.json"

    reset_directory(archive_dir)
    source_entries = load_sources(config_path)
    documents, source_records = build_documents(source_entries)
    write_text_exports(archive_dir, documents)
    write_manifest(archive_dir, documents, source_records)
    build_database(archive_dir, documents, source_records)
    build_search_page(archive_dir, documents, source_records)

    print(f"Archive built in {archive_dir}")
    print(f"Sources: {len(source_records)}")
    print(f"Archive documents: {len(documents)}")
    print(f"Same-content files: {sum(1 for document in documents if document.same_content_titles)}")
    print(f"Open: {archive_dir / 'search.html'}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # pragma: no cover - CLI error path
        print(f"Error: {exc}", file=sys.stderr)
        raise SystemExit(1)
