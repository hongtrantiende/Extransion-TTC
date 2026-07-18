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

### Decision: Replace Wikidich Convert (wikicv.net) with version from custom registry
- **Status**: Approved & Executed.
- **Context**: The user requested to delete the `wikidich.org` rename and replace it with a verified custom registry version of "Wiki Dịch" (wikicv.org) from `https://www.vbookext.me/api/registry/vbook-175573b4.json`.
- **Decision**: Download the zip from the custom registry, extract it to `extensions/wikicv.net` (matching the original name in the catalog), update its author to `Novela` inside its metadata, bump its version to 28, rebuild the zip `wikicv.net.zip`, and update the root `plugin.json` to map name "Wiki Dịch" and source "https://wikicv.org".
- **Consequences**:
  - The repository's "Wiki Dịch" (wikicv.net) extension is now replaced with the custom registry version using `wikicv.org`.
  - Author and version increments are properly synced in the master catalog.

### Decision: Update Truyện Full (truyen-full) domain and name to truyenfull.live
- **Status**: Approved & Executed.
- **Context**: `truyenfull.today` is offline/blocked. The new working domain is `https://truyenfull.live`.
- **Decision**: Extract `truyen-full.zip` to folder `extensions/truyen-full`. Update internal domains to `https://truyenfull.live` in `plugin.json` and `src/config.js`. Update metadata name and master catalog name to `truyenfull.live` to avoid duplication. Bumped version to 14, repackaged, and uploaded to device.
- **Consequences**:
  - The "truyenfull.live" (formerly truyenfull.today) extension points to the live domain.
  - Test run passed successfully on the device for catalog and detail parsing.

### Decision: Delete 5 Obsolete Extensions
- **Status**: Approved & Executed.
- **Context**: The user requested deletion of `wevino.store`, `iq.com`, `youku.tv`, `motchillzc.cc`, and `envasion.net` because they are obsolete/dead.
- **Decision**: Wrote a deletion script, removed all 5 metadata entries from the master `plugin.json`, deleted their compiled zips from `zips/`, deleted their icon images from `icons/`, deleted their extracted folders from `extensions/`, and pushed the changes to GitHub.
- **Consequences**:
  - The catalog is now clean of these 5 obsolete extensions.
  - Disk footprint is reduced.

### Decision: Update Hentai Extensions from custom registry
- **Status**: Approved & Executed.
- **Context**: The user requested replacement of the old `hentaivietsub.com` and addition of a new `HentaiZBot` extension from `https://www.vbookext.me/api/registry/vbook-d77fb523.json`.
- **Decision**: Downloaded the custom registry zips, extracted them to `extensions/hentaivietsub-com` and `extensions/hentaizbot`, updated metadata author to `Novela`, incremented versions, packaged them, extracted/updated icons, and synced root `plugin.json` index.
- **Consequences**:
  - Updated `HentaiVietsub.com` and new `HentaiZBot` are now available in the master catalog.
  - Both carry correct `Novela` authorship metadata.







