# Quyết định kiến trúc

## 2026-10-21 — Tách ba lane dữ liệu

**Quyết định:** giữ entry point ở root, chuyển toàn bộ package/icon/source vào `extensions/`, book source vào `legado/books/`, RSS vào `legado/rss/`.

**Lý do:** root trước đây trộn 248 book source, 194 zip, icon, studio và tool cũ; khó tìm, dễ sửa nhầm và dễ đưa mock vào aggregate.

**Hệ quả:**

- App vẫn đọc `plugin.json`, `sources.json` ở root.
- Deep link cũ vẫn dùng được vì entry point không đổi.
- URL raw trực tiếp tới `zips/`, `icons/` cũ sẽ chết; app dùng catalog nên không ảnh hưởng.
- `dict.zip` và các file từ điển vẫn ở root vì app tải trực tiếp.

## 2026-10-21 — Bốn source extension đang phát triển

**Quyết định:** chỉ giữ `extensions/sources/{baomoi,bilibili,bilibili-cn,seg18}`.

**Lý do:** đây là các source đang được sửa/test. 188 extension còn lại đã có zip ổn định; giữ source sẽ làm repo phình và tăng nguy cơ lệch với zip.

**Hệ quả:** muốn sửa một extension dạng zip, giải nén vào `extensions/sources/<id>/` rồi dùng studio.

## 2026-10-21 — Xoá mock book source

**Quyết định:** xoá 246 mock source; giữ 5 source thật; đưa 2 source `sangtacviet` vào `legado/books/skipped/`.

**Lý do:** mock làm `sources.json` phình, gây lỗi import và che mất source thật. Hai source `sangtacviet` chưa được dùng/kiểm chứng nên không đưa vào aggregate.

**Hệ quả:** `sources.json` chỉ còn 5 source; muốn bật lại sangtacviet thì chuyển file ra khỏi `skipped/` và rebuild.

## 2026-10-21 — Xoá `ext-novela`, dùng studio làm tool duy nhất

**Quyết định:** xoá toàn bộ `ext-novela/` (gồm `vbook-tool`), giữ `extensions/studio/`.

**Lý do:** hai tool chồng chức năng; `vbook-tool` cũ, đường dẫn Windows, không còn được dùng. `studio` đã hỗ trợ test/install/pack/scan/push.

**Hệ quả:** trước khi xoá đã cứu 4 file context sang `docs/vbook/reference/`. Các lệnh `vbook-tool` trong tài liệu cũ không còn hiệu lực; dùng `studio`.

## 2026-10-21 — Sửa web catalog theo dữ liệu

**Quyết định:** bỏ `sourcesData` hardcode và UI chọn/bulk cài mock; web fetch `plugin.json` và render 192 extension.

**Lý do:** dữ liệu hardcode lệch catalog, chứa source đã xoá và làm web phình >100 KB. Bulk install mock không còn ý nghĩa sau khi xoá mock.

**Hệ quả:** web cần HTTP server; thêm tab `Trung Quốc`; card không còn checkbox; mỗi card có nút cài và link nguồn.

## 2026-10-21 — RSS Báo Mới dùng `ruleContent` JS

**Quyết định:** tạo `legado/rss/baomoi.json` với 17 tab, `ruleDescription` rỗng, `ruleContent` JS parse `__NEXT_DATA__`, UA desktop.

**Lý do:** HTML server trả về không ổn định; dữ liệu bài nằm trong JSON Next.js. `ruleDescription` không rỗng từng làm app bỏ qua `ruleContent`.

**Hệ quả:** RSS doc nằm ở `docs/legado/rss.md`; source JSON là artifact, không hardcode nội dung bài.

## 2026-10-21 — Thêm RSS Truyện QQ

**Quyết định:** thêm `legado/rss/truyenqq.json` cho `https://truyenqqko.com`, feed chapter mới; content là ảnh chapter.

**Lý do:** extension Truyện QQ đã có trong catalog nhưng chưa có RSS; site có danh sách chapter mới và ảnh chapter tải trực tiếp.

**Hệ quả:** aggregate RSS còn 2 source; `ruleLink` trỏ thẳng chapter mới nhất; `ruleContent` parse ảnh `img.lazy` và chuẩn hoá host CDN cũ. Đã cài lên máy qua `saveRssSources` và debug trên máy: 42 item, 32 ảnh chapter.

## 2026-10-21 — Chuẩn hoá metadata extension

**Quyết định:** chuẩn hoá 137 extension không mã hoá về author `Thiên Thư Các`, description theo type (`Truyện chữ`, `Truyện Trung`, `Truyện tranh`, `Phim`), tăng version thêm 1 và đồng bộ entry root với metadata trong zip. Giữ nguyên toàn bộ metadata gốc của 55 zip có `metadata.encrypt: true`.

**Lý do:** metadata của extension mã hoá là khoá/salt giải mã; đổi author/version/description có thể làm extension crash. Không thể vừa chuẩn hoá các trường này vừa giữ extension hoạt động nếu không có khoá gốc.

**Hệ quả:** 137 extension đồng nhất; 55 extension mã hoá giữ author/version cũ. Root/zip của 137 extension khớp nhau; nội dung zip ngoài `plugin.json` không đổi. Validator pass.

## 2026-10-21 — Quy tắc cập nhật

- Book source: sửa file trong `legado/books/`, chạy `python3 scripts/catalog.py build`.
- Extension: sửa source, chạy studio `pack`; không sửa zip bằng tay.
- RSS: sửa source, cập nhật aggregate tay, chạy validator.
- Trước commit: `python3 scripts/catalog.py validate`.
