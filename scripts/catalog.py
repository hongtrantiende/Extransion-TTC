#!/usr/bin/env python3
import json
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
PLUGIN_PATH = ROOT / "plugin.json"
SOURCES_PATH = ROOT / "sources.json"
BOOKS_DIR = ROOT / "legado" / "books"
RSS_DIR = ROOT / "legado" / "rss"
ZIPS_DIR = ROOT / "extensions" / "zips"
ICONS_DIR = ROOT / "extensions" / "icons"
INDEX_PATH = ROOT / "index.html"


def load_json(path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path, payload):
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=4) + "\n",
        encoding="utf-8",
    )


def book_files():
    return sorted(
        path
        for path in BOOKS_DIR.glob("*.json")
        if path.is_file() and path.name != "sources.json"
    )


def build_sources():
    books = [load_json(path) for path in book_files()]
    write_json(SOURCES_PATH, books)
    print(f"built {SOURCES_PATH.relative_to(ROOT)} with {len(books)} book sources")


def parse_basename(url):
    if not url:
        return ""
    return Path(urlparse(url).path).name


def validate_plugin(errors, warnings):
    plugin = load_json(PLUGIN_PATH)
    if isinstance(plugin, dict):
        plugin = plugin.get("data")
    if not isinstance(plugin, list):
        errors.append("plugin.json must contain a data array")
        return 0, 0, 0

    used_zips = set()
    used_icons = set()
    empty_icons = []

    for index, item in enumerate(plugin):
        name = item.get("name") or f"entry #{index}"
        if not isinstance(item, dict):
            errors.append(f"plugin entry {index} is not an object")
            continue

        for field in ("name", "author", "path", "type"):
            if not item.get(field):
                errors.append(f"{name}: missing {field}")

        zip_name = parse_basename(item.get("path", ""))
        if not zip_name:
            errors.append(f"{name}: path has no zip filename")
        elif not (ZIPS_DIR / zip_name).is_file():
            errors.append(f"{name}: missing zip {zip_name}")
        else:
            used_zips.add(zip_name)

        icon = item.get("icon", "")
        if icon:
            icon_name = parse_basename(icon)
            if not (ICONS_DIR / icon_name).is_file():
                errors.append(f"{name}: missing icon {icon_name}")
            else:
                used_icons.add(icon_name)
        else:
            empty_icons.append(name)

    disk_zips = {path.name for path in ZIPS_DIR.glob("*.zip")}
    disk_icons = {
        path.name
        for path in ICONS_DIR.iterdir()
        if path.is_file() and path.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}
    }

    for name in sorted(disk_zips - used_zips):
        warnings.append(f"unused zip: {name}")
    for name in sorted(used_zips - disk_zips):
        errors.append(f"zip referenced but missing on disk: {name}")
    for name in sorted(disk_icons - used_icons):
        warnings.append(f"unused icon: {name}")
    for name in sorted(used_icons - disk_icons):
        errors.append(f"icon referenced but missing on disk: {name}")

    print(
        f"plugin: {len(plugin)} entries, {len(used_zips)} zips, "
        f"{len(used_icons)} icons, {len(empty_icons)} empty icons"
    )
    if empty_icons:
        print("empty icons: " + ", ".join(empty_icons))
    return len(plugin), len(used_zips), len(used_icons)


def validate_books(errors):
    files = book_files()
    if not files:
        errors.append("no book source JSON files found")
        return 0

    names = []
    for path in files:
        try:
            book = load_json(path)
        except Exception as exc:
            errors.append(f"{path.name}: invalid JSON ({exc})")
            continue
        if not isinstance(book, dict):
            errors.append(f"{path.name}: book source must be an object")
            continue
        for field in ("bookSourceName", "bookSourceUrl"):
            if not book.get(field):
                errors.append(f"{path.name}: missing {field}")
        names.append(book.get("bookSourceName", path.stem))
        rules = [book.get(key) or "" for key in ("ruleSearch", "ruleToc", "ruleContent")]
        if not any(str(rule).strip() for rule in rules):
            errors.append(f"{path.name}: no search/toc/content rules")

    aggregate = load_json(SOURCES_PATH)
    if not isinstance(aggregate, list):
        errors.append("sources.json must be a JSON array")
    elif len(aggregate) != len(files):
        errors.append(
            f"sources.json has {len(aggregate)} entries, expected {len(files)}"
        )

    skipped = sorted((BOOKS_DIR / "skipped").glob("*.json"))
    print(f"books: {len(files)} active ({', '.join(names)}), {len(skipped)} skipped")
    return len(files)


def validate_rss(errors):
    files = sorted(path for path in RSS_DIR.glob("*.json") if path.name != "sources.json")
    if not files:
        errors.append("no RSS source JSON files found")
        return 0

    for path in files:
        try:
            source = load_json(path)
        except Exception as exc:
            errors.append(f"rss/{path.name}: invalid JSON ({exc})")
            continue
        if not isinstance(source, dict):
            errors.append(f"rss/{path.name}: source must be an object")
            continue
        if not source.get("sourceName"):
            errors.append(f"rss/{path.name}: missing sourceName")
        if not source.get("sourceUrl"):
            errors.append(f"rss/{path.name}: missing sourceUrl")
        if source.get("ruleDescription", "") != "":
            errors.append(f"rss/{path.name}: ruleDescription must stay empty")
        if not str(source.get("ruleContent", "")).startswith("@js:"):
            errors.append(f"rss/{path.name}: ruleContent must start with @js:")
        if not source.get("ruleArticles"):
            errors.append(f"rss/{path.name}: missing ruleArticles")

    aggregate = load_json(RSS_DIR / "sources.json")
    if not isinstance(aggregate, list):
        errors.append("legado/rss/sources.json must be a JSON array")
    elif len(aggregate) != len(files):
        errors.append(
            f"rss/sources.json has {len(aggregate)} entries, expected {len(files)}"
        )

    print(f"rss: {len(files)} active ({', '.join(path.stem for path in files)})")
    return len(files)


def validate_index(errors):
    html = INDEX_PATH.read_text(encoding="utf-8")
    if "sourcesData" in html:
        errors.append("index.html still contains hardcoded sourcesData")
    if "fetch('plugin.json'" not in html:
        errors.append("index.html does not fetch plugin.json")
    print(f"index: {len(html)} bytes")


def validate():
    errors = []
    warnings = []

    for path in (PLUGIN_PATH, SOURCES_PATH, INDEX_PATH):
        if not path.is_file():
            errors.append(f"missing {path.relative_to(ROOT)}")
    if errors:
        return report(errors, warnings)

    validate_plugin(errors, warnings)
    validate_books(errors)
    validate_rss(errors)
    validate_index(errors)
    return report(errors, warnings)


def report(errors, warnings):
    for warning in warnings:
        print(f"WARN  {warning}")
    for error in errors:
        print(f"ERROR {error}")

    if errors:
        print(f"FAILED: {len(errors)} error(s), {len(warnings)} warning(s)")
        return 1

    print(f"OK: 0 errors, {len(warnings)} warning(s)")
    return 0


def main():
    command = sys.argv[1] if len(sys.argv) > 1 else "validate"
    if command == "build":
        build_sources()
        return 0
    if command == "validate":
        return validate()
    print("usage: python3 scripts/catalog.py [build|validate]")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
