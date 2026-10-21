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

### Decision: Implement 抖音小说 (douyinxs) and 奇·阅读 (qiyuedu8) Chinese extensions
- **Status**: Approved & Executed.
- **Context**: The user requested new Chinese novel extensions that have search and explore capabilities missing from the current repo.
- **Decision**: Implemented `抖音小说` (`douyinxs`) and `奇·阅读` (`qiyuedu8`).
  - Scaffolded both directories under `extensions/`.
  - Implemented dynamic cover computation for `douyinxs` (`Math.floor(id / 6) - 1`) to enable cover images on the explore/home screens.
  - Implemented paginated chapter catalog fetching utilizing `page.js` returning a plain array of string URLs and custom subpage crawling in `toc.js`.
  - Generated premium custom icons for both extensions and registered them in `icons/` and root `plugin.json` registry.
- **Consequences**:
  - `douyinxs` and `qiyuedu8` are fully functional, successfully tested on-device (fully passed testing pipelines with 1500+ chapters and 3400+ characters read), and compiled to the GitHub registry.
  - Both extensions are available in the public catalog under author `Novela` with versions 6 and 3 respectively.

### Decision: Rename new Chinese extensions to short names (douyinxs, qiyuedu8)
- **Status**: Approved & Executed.
- **Context**: The new folders were initially named `douyinxs-com` and `qiyuedu8-top`. The user chose to simplify the folder names to the short domain names `douyinxs` and `qiyuedu8` (Option 2).
- **Decision**: Cleaned up the old zip and icon versions, renamed folder names to `douyinxs` and `qiyuedu8`, updated root `plugin.json` paths and icons, rebuilt the packages (`zips/douyinxs.zip`, `zips/qiyuedu8.zip`), and pushed the changes to GitHub.
- **Consequences**:
  - Folders, zip packages, icon images, and root catalog registry indices are now fully aligned and named consistently.

### Decision: Skip Zongheng extension in favor of Tadu
- **Status**: Approved.
- **Context**: The mobile site `m.zongheng.com` returned HTTP 500 on the phone due to dirty session/WAF cookies stored in the app's persistent storage (`novel_reader_prefs.xml` under `ext_cookies_zongheng` and WebView `app_webview/Default/Cookies`). While we built the debug APK and proved that clearing the files via ADB `run-as` resolved the error, we cannot programmatically clear cookies on the user's release build. Thus, we decided to abandon Zongheng.
- **Decision**: Skip Zongheng and replace it with **Tadu (`tadu.com`)** as the 3rd Chinese extension.
- **Consequences**:
  - The Zongheng extension directory `extensions/zongheng` is scheduled for replacement/cleanup.

### Decision: Build Tadu extension (tadu)
- **Status**: In Progress.
- **Context**: Tadu (`m.tadu.com`) is a major Chinese original web novel site with no Alibaba Cloud WAF (aliyunwaf) redirections/blocks.
- **Decision**: Create the `tadu` extension under `extensions/tadu`. Use mobile URL structures `/rank` and `/category` for home/explore, `/book/<id>` for details, and `/rank/listContinue?pageNum=2` for pagination.
- **Consequences**:
  - Tadu crawler scripts are being designed and tested.

### Decision: Remove piaoyuxuan.com extension
- **Status**: Approved & Executed.
- **Context**: The extension `piaoyuxuan.com` returned HTTP 403 / dead source status.
- **Decision**: Removed `piaoyuxuan.com` extension files (`icons/piaoyuxuan.png`, `zips/piaoyuxuan.zip`, `sources/piaoyuxuan_com.json`), removed entries from `plugin.json` and `sources.json`, updated `scan_report.json` and `scan_report.md`, and pushed to GitHub.
- **Consequences**:
  - Catalog index counts updated (`plugin.json` 193 -> 192, `sources.json` 248 -> 247).

### Decision: Build Báo Mới RSS source with JS content rule
- **Status**: Approved & Executed.
- **Context**: Báo Mới has no public RSS feed. Its static article DOM lazy-loads images: `<img>` only contains a 1px base64 placeholder, while the real absolute image URLs are embedded in `__NEXT_DATA__`. A plain `class.content-body@html` rule therefore produced articles with missing images. An initial version also set `ruleDescription`, which made the reader show the short description instead of fetching the full article.
- **Decision**: Create a Legado RSS source for `https://baomoi.com` using HTML list rules (`.bm-card`) and a `@js:` content rule that parses `__NEXT_DATA__` (`props.pageProps.resp.data.content.bodys`) and rebuilds the article as `<p>` text plus `<img>` blocks in order, with a meta-description fallback. Leave `ruleDescription` empty so the reader always fetches the full content page. Use desktop `User-Agent` in the `header` JSON string. Update installed sources by `deleteRssSources` then `saveRssSources`.
- **Consequences**:
  - The Báo Mới RSS source parses 76 articles on the homepage, 17 category tabs, and article content with correct absolute images (verified through the RSS debug WebSocket and on-device).
  - The full rule-syntax and debugging knowledge is recorded in `memory/semantic/legado-rss-sources.md` and `memory/episodic/lessons-learned.md`.

### Decision: Add Truyện QQ RSS source
- **Status**: Installed on device; debug verified.
- **Context**: Extension Truyện QQ existed (`extensions/zips/truyenqq.zip`) but `legado/rss/` only had Báo Mới. Site has no public RSS; listing is HTML and chapter content is lazy-loaded images.
- **Decision**: Add `legado/rss/truyenqq.json` with 7 tabs, `class.list_grid@tag.li` article selector, `last_chapter` as article link, and an ES5 `@js:` content rule that extracts `img.lazy` chapter images. Keep `ruleDescription` empty. Add source to `legado/rss/sources.json`.
- **Consequences**: RSS aggregate is 2 sources; each feed item opens the latest chapter with all images. Validated locally and installed to the phone via `saveRssSources`; RSS debug WebSocket returned 42 list items and 32 chapter images. List/content parsing verified on-device; visual image rendering still relies on the app WebView/source headers.

### Decision: Reorganize repo into extension, book and RSS lanes
- **Status**: Approved & executed locally; final push pending.
- **Context**: Root mixed 248 book sources, 195 zips, icons, studio and an obsolete nested `ext-novela/vbook-tool`; `index.html` hardcoded 195 mock entries and `sources.json` contained mostly mock sources.
- **Decision**: Keep root entry points (`plugin.json`, `sources.json`, `index.html`, dictionaries). Move packages/icons/studio into `extensions/`, book sources into `legado/books/`, RSS into `legado/rss/`. Keep 5 real book sources, move 2 sangtacviet to `skipped/`, remove 246 mock. Delete `ext-novela` after salvaging four reference docs. Replace web hardcode with `fetch('plugin.json')`.
- **Consequences**:
  - Catalog remains 192 extensions / 192 zips / 190 icons; two extensions intentionally have no icon at that time (later repaired).
  - Old raw URLs under `main/zips/` and `main/icons/` are gone; app reads `plugin.json`.
  - `studio` is the only tool; `vbook-tool` commands are obsolete.
  - Canonical knowledge moved to `docs/`; `scripts/catalog.py` builds/validates the aggregate.

### Decision: Normalize extension metadata without breaking encrypted sources
- **Status**: Approved, executed, and pushed in `8d203f9`.
- **Context**: The user requested all extension `plugin.json` metadata to use a consistent author and description, bump every version by one, and update GitHub. Previous investigation found that 55 zips have `metadata.encrypt: true` and use their metadata as a decryption key/salt.
- **Decision**: Normalize only the 137 non-encrypted extensions: author `Thiên Thư Các`; descriptions `Truyện chữ` (`novel`), `Truyện Trung` (`chinese_novel`), `Truyện tranh` (`comic`), `Phim` (`video`); version +1; root entries synced with zip metadata. Preserve the original `plugin.json` bytes and root entries for all 55 encrypted zips. Sync the four local source `plugin.json` files to the published metadata.
- **Consequences**:
  - 137 extensions now share one author and category description; 55 encrypted extensions retain their original authors/versions to remain loadable.
  - All non-encrypted root/zip metadata matches; all zip contents other than `plugin.json` are byte-identical to `HEAD`.
  - `python3 scripts/catalog.py validate` passes with 0 errors and 0 warnings.


### Decision: Repair malformed and missing extension icons
- **Status**: Approved, executed, and pushed in `4200fb4`.
- **Context**: The user reported extensions without icons and noticed the Bilibili Trung Quốc icon looked different. Audit found 31 files named `.png` that actually contained ICO, JPEG, or WebP data, plus two extensions with no icon at all (`uukanshu.cc`, `m.xtyxsw.org`). The Bilibili icon itself was not changed by the metadata commit; it had been replaced earlier in `2fbf83a` with the official blue logo.
- **Decision**: Decode/re-encode the 31 malformed icons as real PNG, add a favicon-based icon for `uukanshu`, add a generated mark for `m.xtyxsw.org`, sync each repaired `icon.png` into its zip, and update the two missing root icon fields. Keep the current official Bilibili icon.
- **Consequences**:
  - Catalog now has 192 icons and 0 empty icons; every zip contains a matching PNG `icon.png`.
  - All encrypted zips retain byte-identical `plugin.json`; only their icon member changed.
  - Validator reports 192 entries, 192 zips, 192 icons, 0 empty icons, 0 errors.

### Decision: Add HHTQ video extension
- **Status**: Built, tested on device, catalog updated locally; push pending.
- **Context**: User requested a VBook extension for `hhtq.io`, a Chinese-anime site with home/search/detail/TOC and multi-layer video embeds.
- **Decision**: Add `hhtq` source, icon, and zip. Home exposes "Phim mới cập nhật" (paginated) and "Tập mới hôm nay" (page 1 only). TOC dedupes server tiles and prefers vietsub. `chap.js` resolves episode iframe → embed iframe → player page → first `.m3u8`. Import as `HHTQ` version 1.
- **Consequences**: Catalog grows to 193 entries / 193 zips / 193 icons. Search and today list intentionally stop at page 1 because the site returns 404 for page 2. Full pipeline tested: 24 home items, 24 page-2 items, 7 today items, 12 search results, 9 TOC entries, m3u8 resolved.
