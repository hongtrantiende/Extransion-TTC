# Bài học kinh nghiệm

Tài liệu này là bản gọn, đã kiểm chứng. Log gốc nằm ở `memory/episodic/lessons-learned.md`; nếu mâu thuẫn, ưu tiên file này và kiểm tra lại trên máy thật.

## Extension VBook

### Metadata mã hoá

Mọi extension có `metadata.encrypt: true` dùng chính metadata trong `plugin.json` làm khoá/salt để giải mã file. Sửa `name`, `author`, `version`, `source`, `description` hoặc `type` có thể làm app không giải mã được và crash. Hiện có 55 zip như vậy, gồm `wiki-dich`, `qmbook`, `07br`, `roads-team`.

- Không “chuẩn hoá” metadata của extension đã mã hoá.
- Khi cập nhật, giữ nguyên zip gốc và entry root gốc.
- Không pack lại từ source nếu không có metadata khớp.
- Nếu buộc phải sửa, test lại trên máy thật ngay.

### `page.js` trả array URL

`page.js` phải trả về array chuỗi URL:

```js
["https://example.com/truyen/1/trang-2", "https://example.com/truyen/1/trang-3"]
```

Không trả array object kiểu `[{name, link}]`; engine sẽ trả mục lục rỗng dù studio test có thể vẫn qua.

### `detail.js` phải có `host`

Object detail cần `host` để app phân giải URL tương đối cho toc/chap:

```js
return Response.success({
    name: name,
    cover: cover,
    host: "https://m.example.com",
    author: author,
    description: desc
});
```

Thiếu `host` thường làm mục lục rỗng hoặc chương không tải được.

### Tên và cấu trúc

- Tên hiển thị nên là Latin/domain ngắn (`douyinxs`, `qidian`), dễ gõ trên điện thoại.
- Thư mục source trùng ID extension.
- `plugin.json` cục bộ dùng đường dẫn phẳng: `"home": "home.js"`, không phải `"src/home.js"`.
- Icon lấy từ favicon/trang chủ chính thức; lưu `extensions/icons/<id>.png`.
- Favicon thường là ICO dù đặt tên `.png`; phải decode và encode lại PNG thật, đồng thời cập nhật `icon.png` trong zip.
- Root icon và icon trong zip phải giống nhau; app có thể dùng một trong hai.

### Ảnh bìa

- Trang home/gen phải có cover; cover rỗng là lỗi UI.
- Nếu HTML không có cover, tìm API hoặc công thức ảnh.
- `douyinxs` dùng công thức:
  ```text
  coverId = floor(bookId / 6) - 1
  subDir  = floor(coverId / 1000)
  cover   = https://img.douyinxs.com/{subDir}/{coverId}/{coverId}s.jpg
  ```

### Phân trang và WAF

- `nextPage` là chuỗi số tăng dần: `String(parseInt(page, 10) + 1)`.
- Qidian có thể chặn HTML tĩnh; dùng API AJAX và token CSRF lấy từ `localCookie.getCookie("https://m.qidian.com")`.
- Cookie của extension tồn tại qua các lần chạy app; cookie/WAF cũ có thể làm server trả 500. Xoá cache hoặc dùng debug build để xoá `shared_prefs/novel_reader_prefs.xml`.
- Tadu dùng `a.bookInfo`, ảnh `data-src`, tiêu đề `h2`; trang 2 gọi `/rank/listContinue?...&pageNum=2`.

### Video stream nhiều lớp

- HHTQ: trang tập → iframe player → trang embed → iframe `data-src` → URL `.m3u8`; URL này có thể là **trang HTML player**, không phải playlist. Fetch với `Referer` đúng origin của player (`https://yanhh3d.chat/`) rồi đọc `data-obf`.
- `data-obf` là base64 JSON `{sU,pU,eK,hD}`. Dùng `pU` (playlist plain); `sU` là wrapper `#ENC-AESGCM` (AES-GCM key `eK`, IV trong dòng `#ENC-AESGCM;iv=`) và giải mã ra cùng playlist. Không trả `sU` thẳng cho player.
- Segment HHTQ là file `.png` polyglot: 120 byte PNG + prefix, MPEG-TS thật bắt đầu ở offset 271. ExoPlayer HLS có fallback `TsExtractor` và tự tìm sync byte trong buffer, nên vẫn đọc được; nếu player khác lỗi, cần proxy strip prefix.
- Trang tập có hai bộ `.ep-tile` (thuyết minh/vietsub) trùng tên; dedupe theo path và ưu tiên URL có `server=vietsub`.
- Trang tìm kiếm và `?today=1` chỉ có trang 1 (trang 2 trả 404); chặn `page > 1` thay vì ghép URL.
- `chap.js` video trả object `{data, type:"native", headers:{User-Agent, Referer}, host, timeSkip}` vì CDN cần header riêng; không trả chuỗi trần nếu stream cần `Referer`.

## Rhino và selector

- Chạy ES5: `var`, `function`; tránh `async/await`, `?.`, `??`, arrow function.
- Sau khi parse, ép về chuỗi bằng `+ ""` hoặc `String(...)`.
- Kiểm tra null trước khi gọi `.text()`, `.attr()`.
- `doc.select("a").first()` có thể là null.
- JSoup selector mặc định của Legado dùng `@` làm bước, không phải CSS đầy đủ. Ví dụ `class.bm-card@tag.a.0@textNodes`.
- CSS có dấu cách thường trả 0 kết quả; chỉ dùng `@css:` khi thật cần.
- JSONPath dùng `$.` hoặc `@json:`; XPath dùng `//` hoặc `@XPath:`.

## Đóng gói và test

- Không sửa zip bằng tay; sửa source rồi `pack`.
- Trước khi test, cài dependency studio: `cd extensions/studio && npm ci`.
- Test trên máy thật: `node extensions/studio/studio.js test <ext-id>`.
- Test phải qua home → detail → toc → chap; không chỉ kiểm tra file JS chạy trên PC.
- Nếu sửa JS mà app vẫn dùng code cũ, tắt/bật Web Server hoặc force-stop app để xoá cache Rhino.
- Novela/Legado nhận extension qua `POST /uploadExtension` (multipart zip); response `{"data":true}` nhưng `/test` vẫn có thể trả code cũ theo tên extension cho tới khi khởi động lại app.
- `/install` là endpoint của Novel Reader/VBook, không có trên Novela/Legado (trả 404); studio tự chọn `/uploadExtension` khi thấy `/getBookSources`.
- Kiểm tra trang 2+ bằng debug riêng; `nextPage` đúng chưa đủ, phải xác nhận dữ liệu trang 2.

## Book source Legado

- `sources.json` root là array object source, không phải array URL.
- Chỉ build từ `legado/books/*.json`; bỏ qua `skipped/`.
- Source chưa test không nên vào aggregate.
- Sau khi sửa, chạy `python3 scripts/catalog.py validate`.

## RSS source Legado

- Rule mặc định là JSoup, dùng `@`; không phải CSS thuần.
- `ruleDescription` không rỗng sẽ được app dùng làm nội dung và **không fetch trang bài**. Muốn đọc full content, để `ruleDescription: ""` và dùng `ruleContent`.
- `ruleContent` có thể là `@js:`; chạy trong Rhino với `src`, `baseUrl`, `rssArticle`, `source`, `cookie`, `cache`, `java`.
- Báo Mới không có RSS công khai; body nằm trong `__NEXT_DATA__`; ảnh lazy là placeholder 1px, URL thật nằm trong `props.pageProps.resp.data.content.bodys`.
- `header` trong JSON Báo Mới là **string**, không phải object.
- `POST /saveRssSources` không update source đã tồn tại; phải `deleteRssSources` trước.
- WS debug `ws://<phone>:1123/rssSourceDebug` nhận `{"tag":"<sourceUrl>"}`, chỉ test item đầu.
- Dùng desktop UA cho Báo Mới.

## Vận hành repo

- `plugin.json` root là object `{metadata, data[]}`; `data` mới là array.
- `zips/-1.zip` là placeholder hợp lệ của `m.xtyxsw.org`; không xoá.
- Tất cả extension đều có icon PNG; web vẫn fallback khi ảnh lỗi tải.
- `index.html` fetch `plugin.json`; mở qua HTTP, không mở `file://`.
- Raw GitHub có cache; sau push có thể cần chờ hoặc purge.
