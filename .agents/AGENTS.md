# AGENTS.md — Master Memory Hub

> Vai trò: file trung tâm cho agent làm việc trên Extransion-TTC. Đọc file này trước khi sửa repo. Khi tài liệu và memory lệch nhau, `docs/` là nguồn chuẩn.

## Memory Loading Protocol

Bắt buộc load theo thứ tự:

1. `.agents/AGENTS.md` (file này)
2. `.agents/behavior-rules.md`
3. `docs/README.md`
4. `docs/project/architecture.md`
5. `docs/project/decisions.md`
6. `docs/project/lessons.md`
7. Tài liệu domain đang làm:
   - Extension: `docs/vbook/extensions.md`, `docs/vbook/testing.md`
   - Book source: `docs/legado/books.md`
   - RSS: `docs/legado/rss.md`
8. `memory/episodic/*` chỉ để tra lịch sử, không phải nguồn chuẩn.

Không hỏi có nên đọc không; tự load.

## Identity

Bạn là kỹ sư phần mềm full-stack của dự án, làm việc như đồng nghiệp: đọc code thật, sửa đúng chỗ, test trước khi báo xong. Giao tiếp tiếng Việt, ngắn và trực tiếp.

## Snapshot hiện tại

- Branch: `main`
- Remote: `https://github.com/hongtrantiende/Extransion-TTC.git`
- Extension: 193 entry trong `plugin.json`, 193 zip, 193 icon PNG.
- Source đang phát triển: 5 trong `extensions/sources/`.
- Book source: 5 active, 2 skipped.
- RSS: 2 active (`baomoi`, `truyenqq`).
- Tool duy nhất: `extensions/studio/`.
- `ext-novela/` và `vbook-tool` đã bị xoá; đừng tạo lại.

## Cấu trúc

```text
plugin.json                  catalog extension {metadata, data[]}
sources.json                 array 5 book source
index.html                   web catalog fetch plugin.json
extensions/sources/          5 source đang sửa
extensions/zips/             193 package
extensions/icons/            193 icon PNG
extensions/studio/           test/install/pack/scan/push
legado/books/                5 book source
legado/books/skipped/        2 source chưa dùng
legado/rss/                  Báo Mới + Truyện QQ + aggregate
docs/                        nguồn kiến thức chuẩn
memory/                      log lịch sử
scripts/catalog.py           build/validate
```

Không di chuyển `dict.zip`, `VietPhrase.txt`, `LacViet.txt`, `LuatNhan.txt`, `Name.txt`, `Pronouns.txt`, `PhienAm.txt` khỏi root.

## Quy trình chuẩn

1. Đọc docs domain + code hiện tại.
2. Sửa tối thiểu, đúng style xung quanh.
3. Test bằng lệnh phù hợp.
4. Cập nhật docs nếu có kiến thức/quyết định mới.
5. Chỉ commit khi user yêu cầu rõ.

## Extension VBook

- App chạy Rhino cũ: ES5, không `async/await`, `?.`, `??`, arrow function, destructuring phức tạp.
- Ép chuỗi sau parse: `+ ""` hoặc `String(...)`.
- Kiểm tra null trước `.text()`, `.attr()`; `doc.select(...).first()` có thể null.
- `page.js` trả array **chuỗi URL**, không trả object.
- `detail.js` phải có `host`.
- Metadata của extension mã hoá là khoá giải mã; không sửa `name/author/version/source` của các ext đó.
- Tên/thư mục Latin, không hậu tố `-com`/`-top` nếu không cần.
- `plugin.json` cục bộ: `{metadata, script}`; đường dẫn script phẳng (`home.js`).
- `plugin.json` root: `{metadata, data[]}`; mỗi entry flattened có `path`, `icon`, `type`, `version`.
- `zips/-1.zip` là placeholder hợp lệ của `m.xtyxsw.org`; không xoá.
- Tất cả 193 ext đều có icon PNG; giữ fallback web cho lỗi tải ảnh.

## Studio

Chạy từ root:

```bash
cd extensions/studio && npm ci
cd ../..
node extensions/studio/studio.js test <ext-id>
node extensions/studio/studio.js install <ext-id>
node extensions/studio/studio.js pack <ext-id>
node extensions/studio/studio.js scan [limit]
```

- `test` cần ADB + Web Server app cổng `1122`.
- `pack` tăng version, tạo zip, cập nhật entry đã có; **không** tự copy icon hay thêm entry mới.
- `push` chạy `git add .` toàn repo; không dùng nếu muốn commit chọn lọc.
- Báo cáo scan: `extensions/studio/scan_all_report.json` (ignored).

## Book source

- Sửa file trong `legado/books/`.
- Build aggregate: `python3 scripts/catalog.py build`.
- Không build file trong `skipped/`.
- `sources.json` root là array object, không phải array URL.
- Test import/tìm kiếm/toc/chap trước khi publish.

## RSS source

- `ruleDescription` rỗng nếu muốn `ruleContent` được dùng.
- Rule mặc định JSoup, bước `@`; chỉ dùng `@css:` khi cần.
- Báo Mới: 17 tab, desktop UA, parse `__NEXT_DATA__`, ảnh trong `bodys`.
- API `saveRssSources` không upsert; delete trước khi sửa source đã có.
- Debug WS chỉ test item đầu.

## Web catalog

- `index.html` fetch `plugin.json`; không hardcode `sourcesData`.
- Chạy local: `python3 -m http.server 8000`.
- `file://` sẽ không tải được catalog.
- GitHub Pages chưa bật.

## Validation

```bash
python3 scripts/catalog.py validate
node --check extensions/studio/studio.js
```

Validator kiểm tra plugin/zip/icon/book/RSS/index. Kỳ vọng hiện tại:

```text
plugin: 193 entries, 193 zips, 193 icons, 0 empty icons
books: 5 active, 2 skipped
rss: 2 active
OK: 0 errors
```

## Git

- Không commit `node_modules/`, `.env`, `*.log`, `scan_all_report.json`.
- Trước commit: `git status`, `git diff`, chạy validation.
- Không `git add .` nếu có file ngoài ý muốn.
- Không force-push, không sửa git config.
- Commit message ngắn, đúng việc.

## Cập nhật kiến thức

- Kinh nghiệm kỹ thuật mới → `docs/project/lessons.md`.
- Quyết định kiến trúc → `docs/project/decisions.md`.
- Thay đổi cấu trúc → `docs/project/architecture.md` + README.
- Log phiên dài → `memory/episodic/lessons-learned.md` / `decisions-log.md`.
- Không copy nguyên playbook dài vào nhiều file; canonical một chỗ, chỗ khác pointer.
