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

### Decision: Patch and Repackage Redirected Extensions
- **Status**: Approved & Executed.
- **Context**: Several domains in `plugin.json` have changed due to redirects, causing crawl failures. Captcha protected sites (returning HTTP 403) are intentionally skipped.
- **Decision**: Programmatically extract the 10 modified zips, replace all internal/master old domains with the correct new domains, perform device test runs to verify parsing logic where possible, increment versions, rebuild the `.zip` packages, and update master indexes.
- **Consequences**:
  - The 10 redirected extensions are now updated with fresh, live domains.
  - Testing verified successful crawl pipelines on the device (e.g. `say-hentai`, `nguoi-lao-dong` parsing 8,200 chars).
  - Version increments prevent local cache mismatch on clients.

### Decision: Update Wikidich domain to live wikidichvn.com
- **Status**: Approved & Executed.
- **Context**: `wikidich.net` is offline (DNS `ENODATA`). The active service is running on `wikidichvn.com`.
- **Decision**: Extract `wikidich.zip` to `extensions/wikidich`, replace the internal domain `wikidich.com.vn` with the new active domain `wikidichvn.com`, test on-device to verify crawler capability (fully passed with 8,498 chars parsed), repackage, and update indexes.
- **Consequences**:
  - The Wikidich extension catalog entry and code now point to the live `wikidichvn.com` URL.
  - User search, toc, and chapter load on Novela client will correctly request the working server.

### Decision: Update Wikidich Convert (wikicv) domain and name to wikidich.org
- **Status**: Approved & Executed.
- **Context**: `wikicv.net` is offline/blocked. The display name of the source is `wikidich.org` while its domain link is `https://wikicv.org`.
- **Decision**: Extract `wikicv.net.zip` to folder `extensions/wikicv.net` and replace internal domains with `https://wikicv.org` in `plugin.json` (as the rest of the JS logic is encrypted and uses CONFIG_URL dynamically) and renamed the master index catalog entry name to `wikidich.org` and source to `https://wikicv.org`. Tested, repackaged, and updated version to 28.
- **Consequences**:
  - The "wikidich.org" (formerly wikicv.net) extension is now fully updated to request `https://wikicv.org`.
  - Version increment is correctly pushed to clients.




