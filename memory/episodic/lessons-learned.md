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

### VBook Extension Domain Update & Test Loop
- **Discovery**: When resolving domain name updates for extensions, the domain inside the packaged ZIP (e.g. in `plugin.json` and `src/config.js` of the extension itself) might differ from the domain recorded in the master repo index `plugin.json`.
- **Workflow**: A script `patch_ext.js` was written to unpack target extensions to `extensions/`, scan for both CLI-passed old domain and internally recorded domains, replace all matching occurrences with the new domain in all `.js` and `plugin.json` files, run device tests via `node studio.js test <extId>`, and pack them back via `node studio.js pack <extId>` (updating versions in local and master indices).
- **Result**: Successfully updated 10 redirected extensions (including `say-hentai`, `cmanga`, `qmbook`, `07br`, `roads-team`, `80qishu`, `ac-qq`, `anime-hay`, `nguoi-lao-dong`, and `ptwxz`). Extensions with HTTP 403 (Captcha) were skipped as requested.

### wikidich.net / wikidichvn.com Domain Mapping Test
- **Discovery**: `wikidich.net` does not have active IPv4 DNS A records (`ENODATA`), while the current live version is `wikidichvn.com`. 
- **Fix**: Extracted `wikidich.zip` to `extensions/wikidich`, updated internal domains from `wikidich.com.vn` to `wikidichvn.com` in `plugin.json` and `src/config.js`, tested successfully on device (parsed 8,498 characters from a sample book chapter), packed and updated version to 2.

### wikicv.net (wikicv) Domain Mapping Update
- **Discovery**: `wikicv` (Wikidich Convert) is a separate version of the extension from `wikidichvn.com`. The original display name is `Wiki Dịch` and its working domain is `https://wikicv.org` (verified active).
- **Fix**: Deleted the custom `wikidich.org` rename and downloaded the verified `wikicv` extension from the custom vbookext registry `https://www.vbookext.me/api/registry/vbook-175573b4.json`. Extracted to `extensions/wikicv.net`, updated the author inside its `plugin.json` metadata to `Novela`, packed as `zips/wikicv.net.zip` with version 28, and updated the root catalog `plugin.json` to match.

### truyenfull.today (truyen-full) Domain Mapping Update
- **Discovery**: `truyenfull.today` is offline/blocked. The new active domain name is `https://truyenfull.live`.
- **Fix**: Extracted `truyen-full.zip` to folder `extensions/truyen-full`. Replaced the internal domain `https://truyenfull.today` with the new active domain `https://truyenfull.live` in `plugin.json` and `src/config.js`. Renamed the extension entry display name to `truyenfull.live` inside local metadata and master `plugin.json` to prevent catalog duplicates, bumped version to 14, and repackaged.

### Deleted Obsolete Extensions
- **Fix**: Removed the following 5 obsolete/unreachable extensions from the catalog (`plugin.json` at root), deleted their compiled zip files from `zips/`, and deleted their cached icon files from `icons/`:
  - `wevino.store` (`anime-hay.zip`)
  - `iq.com` (`iqiyi.zip`)
  - `youku.tv` (`youku.zip`)
  - `motchillzc.cc` (`motchill-1.zip`)
  - `envasion.net` (`motchill.zip`)

### Hentai Extensions Update
- **Fix**: Deleted/overwrote the old `hentaivietsub.com` extension with the verified version downloaded from the custom registry `https://www.vbookext.me/api/registry/vbook-d77fb523.json`. Added the new `HentaiZBot` extension from the same registry. Both extensions were extracted locally to `extensions/`, the metadata author updated to `Novela`, and packaged to `zips/hentaivietsub-com.zip` and `zips/hentaizbot.zip` respectively. Extracted and mapped the icons to `icons/` and updated `plugin.json` at root.

### Encrypted Extensions Metadata Constraint
- **Discovery**: Encrypted extensions (e.g. `Wiki Dịch`/`wikicv.net`, `qmbook`, `07br`, `roads-team`) use metadata fields (such as `name`, `author`, `version`, or `source`) as a key/salt for decrypting files in the VBook/Legado client. Modifying `plugin.json` inside the zip or root catalog to change author/version/name breaks the decryption and causes the extension to crash/fail to load.
- **Fix**: Preserved the exact original zip and matching metadata (`name: "Wiki Dịch"`, `author: "vBook"`, `version: 27`) for `wikicv.net.zip`.








