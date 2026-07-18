# Lessons Learned & Discoveries

This log tracks lessons learned, resolved bugs, and database or configuration patterns discovered during work.

---

## 📅 2026-07-19
### Deduplication and De-duplication in Novela APK
- **Issue**: Novela APK loaded only 195 extensions out of 231 registered in `plugin.json`.
- **Cause**: The Kotlin code in `ExtensionViewModel.kt` groups the catalog entries by normalized slug:
  `allExts.groupBy { it.name.toSlug() }.map { list.maxByOrNull { it.version } ?: list.first() }`
  There were 25 groups of duplicates in `plugin.json` (such as `alicesw.com`, `truyenfull.today`, etc.), leading to duplicate entries being dropped, reducing the list from 231 to exactly 195 items.
- **Resolution**: Ran a deduplication script to filter duplicate items out of `plugin.json` and sync the hardcoded `sourcesData` in `index.html` to have only 195 unique extensions. The script kept the highest version, scored zip paths to select the cleanest, and cleaned up orphaned `.zip` files under `zips/` and orphaned `.png` files under `icons/`.
