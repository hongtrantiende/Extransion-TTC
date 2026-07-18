# Architecture Decisions Log

This document records the architectural decisions made during development.

---

## 📅 2026-07-19
### Decision: Clean Duplicate Extension Entries (Deduplication)
- **Status**: Approved & Executed.
- **Context**: The `plugin.json` in the root workspace listed 231 extensions, but only 195 unique extensions were actually loaded in Novela APK due to name slug conflicts.
- **Decision**: Programmatically deduplicate `plugin.json`, synchronize the change with the hardcoded array in `index.html` (`sourcesData`), and delete the resulting orphaned `.zip` files in `zips/` and `.png`/`.ico` files in `icons/`.
- **Consequences**:
  - `plugin.json` and `index.html` are now perfectly in sync.
  - The repository size is reduced by removing redundant `.zip` files.
  - The catalog count shown in the app matches the file content exactly.
