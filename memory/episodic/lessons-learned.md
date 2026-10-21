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

### VBook Extensions page.js Return Format
- **Discovery**: The `page.js` script (for chapter catalog pagination) must return a plain array of string URLs (e.g., `["https://m.douyinxs.com/..."]`), NOT an array of objects. Returning objects like `[{ name: ..., link: ... }]` will fail the native VBook/Legado parsing engine on the phone and result in an empty chapter list (even if the `studio.js` test pipeline passed).

### detail.js `host` Field Requirement
- **Discovery**: The book details object returned by `detail.js` must include the `host` field (e.g., `host: "https://m.douyinxs.com"`). If `host` is omitted, the phone app cannot resolve relative URLs for pagination and chapters catalog, leading to empty list screens.

### Mathematical Cover Mapping for `douyinxs`
- **Discovery**: The `抖音小说` (`douyinxs`) category list doesn't include cover image elements. However, we discovered a direct mathematical formula mapping book ID to its cover image path:
  - `coverId = Math.floor(bookId / 6) - 1`
  - `subDir = Math.floor(coverId / 1000)`
  - URL is `https://img.douyinxs.com/{subDir}/{coverId}/{coverId}s.jpg`
  This enables dynamic and fully correct cover rendering on the explore/home tab of the extension.

### Naming Conventions and Symlinking
- **Convention**: Folder names inside `extensions/` must be alphanumeric (like `douyinxs` or `qiyuedu8`) and synchronized with registry IDs. We renamed `douyinxs-com` to `douyinxs` and `qiyuedu8-top` to `qiyuedu8` to follow consistent naming without `-com` / `-top` suffixes, updated root `plugin.json` registry path mappings, packed version 6/3, and pushed to GitHub.

---

## 🛠️ Quy Chuẩn Phát Triển & Kiểm Thử VBook Extensions (Legado Fork)

Dưới đây là tổng hợp toàn bộ quy chuẩn bắt buộc và kinh nghiệm đúc kết từ việc phát triển các tiện ích nguồn truyện Trung Quốc gần đây (như `douyinxs` và `qidian`):

### 1. Đặt Tên hiển thị & Cấu trúc thư mục (Latin/Domain Only)
- **Tên hiển thị (`name`)**: Luôn sử dụng tên Latin hoặc tên miền viết tắt của nguồn (ví dụ: `douyinxs`, `qidian`). Không được dùng chữ Trung Quốc (như `抖音小说`, `起点男频`) hay các hậu tố dư thừa `-com`, `-top`. Việc này giúp người dùng dễ dàng gõ tìm kiếm nhanh trên bàn phím điện thoại.
- **Thư mục code**: Đặt tên thư mục chứa mã nguồn trong `extensions/` trùng với tên hiển thị Latin (ví dụ: `extensions/qidian/`).
- **Phẳng hóa plugin.json**: File `plugin.json` cục bộ phải ánh xạ tên file script dạng phẳng (ví dụ: `"home": "home.js"` chứ không được có tiền tố `"src/home.js"`).

### 2. Biểu tượng Tiện ích (Extension Icon)
- Bắt buộc phải tải favicon gốc chính thức từ trình duyệt hoặc trang chủ của chính nguồn đó (ví dụ: `https://www.qidian.com/favicon.ico`).
- Tệp icon phải được lưu làm `extensions/<extId>/icon.png` và sao chép ra `icons/<extId>.png` ở thư mục gốc của repository.

### 3. Ảnh bìa truyện tại Trang chủ (Explore/Home Cover)
- Trang chủ (Explore tab tải từ `home.js` -> `gen.js`) bắt buộc phải load được ảnh bìa truyện (`cover`).
- Trường hợp HTML tĩnh của nguồn không có ảnh bìa (như `douyinxs`): Phải tìm công thức tính toán toán học để map từ Book ID ra link ảnh bìa động, hoặc gọi API AJAX phụ để lấy, tránh để trống.

### 4. Chi tiết truyện (Detail Page Cover & Host)
- Khi người dùng bấm vào chi tiết truyện (`detail.js`), kết quả trả về bắt buộc phải có:
  - Ảnh bìa truyện (`cover`).
  - Tên tác giả (`author`) và Mô tả (`description`).
  - Trường `host` (ví dụ: `host: "https://m.qidian.com"`): Cực kỳ quan trọng để hệ thống trên điện thoại phân giải các đường dẫn tương đối của mục lục và chương truyện.

### 5. Phân trang Danh sách (Explore Pagination)
- Khi người dùng vuốt danh sách truyện xuống dưới, hệ thống phải tự động tải được Trang 2, Trang 3.
- Giá trị `nextPage` trả về phải là một chuỗi số trang tăng dần: `String(parseInt(page) + 1)`.
- **Khắc phục WAF/Redirect chặn phân trang tĩnh (như Qidian)**:
  - Phải sử dụng API AJAX động thay thế cho cào HTML trang tĩnh.
  - Tận dụng đối tượng toàn cục **`localCookie`** trên điện thoại để lấy cookie chứa Token CSRF: `let cookieStr = localCookie.getCookie("https://m.qidian.com");`.
  - Cắt lấy `_csrfToken` từ chuỗi cookie này và đính kèm làm tham số truy vấn của API AJAX: `_csrfToken=TOKEN`.

### 6. Mục lục chương (TOC) & Nội dung chương (Chap)
- **TOC (`toc.js`)**: Phân tích toàn bộ liên kết chương trong trang mục lục. Đánh dấu `pay: true` đối với các chương VIP/trả phí.
- **Nội dung chương (`chap.js`)**: Lấy tất cả văn bản chương (thường nằm trong các thẻ `<p>`), loại bỏ khoảng trắng thừa và nối lại bằng ký tự xuống dòng `\n`. Hỗ trợ đệ quy/phân trang phụ trong chương nếu trang truyện gốc chia một chương thành nhiều trang nhỏ.

### 7. Quy trình Kiểm thử bắt buộc (On-Device Testing)
- **Kiểm thử Pipeline tự động**: Chạy lệnh `node studio.js test <extId>` để kiểm tra tuần tự cả 4 bước (Home -> Detail -> TOC -> Chap) trực tiếp trên trình thông dịch Rhino của điện thoại. Pipeline kiểm thử phải báo `🎉 THÀNH CÔNG!` mới được xem là hoàn thành.
- **Kiểm thử Phân trang (Page 2+)**: Viết script debug riêng (ví dụ: gửi payload chạy thử file `gen.js` với tham số `page = 2` tới endpoint `/test` của điện thoại) để xác nhận dữ liệu của trang tiếp theo được trả về chính xác trước khi xuất bản.
- **Xóa Cache điện thoại**: Khi chỉnh sửa mã nguồn JS và cài đặt lại nóng, nếu gặp lỗi không thay đổi, hãy thực hiện tắt/bật lại **Dịch vụ Web** hoặc tắt hẳn chạy ngầm ứng dụng **Novela** trên điện thoại để xóa hoàn toàn cache Classloader của Rhino.

### 🍪 Cookie Persistence & Mobile WAF Challenge Issues (Zongheng & Tadu)
- **Discovery**: In Legado/Novela, extension cookies are persistent across app process runs. They are stored inside `shared_prefs/novel_reader_prefs.xml` under `<string name="ext_cookies_<extId>">` and inside Android WebView storage `./app_webview/Default/Cookies`.
- **Constraint**: If Zongheng's mobile site (`m.zongheng.com`) returns HTTP 500 on the phone but 200 on PC, it is because Zongheng's server detects stale session/WAF cookies stored in the phone's CookieJar and crashes. 
- **Debug workflow**: Since release builds (`io.legato.kazusa`) are not debuggable, we cannot use ADB `run-as` to delete cookie storage files. Wiping cookies via `localCookie.setCookie` doesn't clear them fully due to domain/wildcard mismatches. The only way is to clear the cache manually in the app settings, or switch to a debug build (`io.legato.kazusa.debug`) and run `adb shell run-as io.legato.kazusa.debug rm -f shared_prefs/novel_reader_prefs.xml` followed by a force-stop and restart.
- **Tadu Selector Patterns**:
  - Tadu (`m.tadu.com`) is a great alternative Chinese site with no WAF redirections.
  - Category list selector uses `a.bookInfo` for elements, `img` attribute `data-src` for cover, `h2` for title, and `div.info div` for category/tags.
  - Page 2 is fetched from the AJAX endpoint `/rank/listContinue?readLike=0&countType=hour72&pageNum=2`.

---

## 📅 2026-10-21

### Legado/Novela RSS Sources — syntax, content flow, lazy images

- **Rule syntax**: Legado RSS rules default to **Jsoup selector**, not raw CSS. Use `@` as the step separator with a final `text/textNodes/ownText/href/src/html/all`, e.g. `class.bm-card@tag.a.0@textNodes`. A CSS selector containing spaces (`.bm-card-header a`) returns 0 matches; use `@css:` only when CSS is really needed. JSONPath is `$.` / `@json:`; XPath is `//` / `@XPath:`.
- **Full content trap**: `ReadRssViewModel` shows `article.description` as the article body when it is non-empty and **does not fetch the content page**. To read the full article, leave `ruleDescription` empty and use `ruleContent`. This was the cause of the "tap article, blank content" bug on Báo Mới.
- **API is not upsert**: `POST /saveRssSources` does not update an existing `sourceUrl`. Always `POST /deleteRssSources` (array of `{sourceUrl, sourceName}`) before saving changes. After changing rules, refresh the RSS list (or delete/re-add) because article objects may keep the old description.
- **WS debug**: `ws://<phone>:1123/rssSourceDebug` expects `{"tag":"<sourceUrl>"}` (an object, not an array). It parses only the first list item; with `ruleDescription` empty it also parses the content page and prints the body (`state 20`), ending with `CLOSE 1000`. It is a first-item smoke test, not a full-source test.
- **Lazy images**: Báo Mới returns `<img src="data:image/gif;base64,1px...">` in the static DOM; the real URLs live in `__NEXT_DATA__` at `props.pageProps.resp.data.content.bodys` (`type: "text"` / `"image"`, `content` holds the real absolute image URL). `class.content-body@html` only returns placeholders. The fix is a `@js:` content rule that parses `__NEXT_DATA__` and rebuilds `<p>` / `<img>` in order, with a meta-description fallback.
- **JS content rules**: `@js:` runs in Rhino with bindings `src` (raw page body), `result`, `baseUrl`, `rssArticle`, `source`, `cookie`, `cache`, `java`. Use ES5 (`var`, `for`); `JSON.parse` works. The script's final value is the content. For lazy/dynamic sites this is the reliable escape hatch.
- **Content test trick**: Create a temporary RSS source with `sourceUrl` and `sortUrl` both set to a sample article URL, `ruleArticles: "html"`, `ruleTitle: "tag.title.0@textNodes"`, `ruleLink: "link[rel=canonical]@href"`, `ruleDescription: ""`, and the JS `ruleContent`. The debug then fetches that article and prints the generated HTML, so the content rule can be verified before touching the real source.
- **Site specifics**: Báo Mới has no public RSS (`/rss/*` → 404); it needs a desktop `User-Agent` and HTML rules. The article body JSON is in `__NEXT_DATA__`; list cards use `.bm-card`, `.bm-card-header a`, `.bm-card-image img`, `.content-time`. `header` is a JSON **string**, not an object.
- **Reference**: full playbook at `memory/semantic/legado-rss-sources.md`.


