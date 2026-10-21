# Bài học kinh nghiệm

Tài liệu này là bản gọn, đã kiểm chứng. Log gốc nằm ở `memory/episodic/lessons-learned.md`; nếu mâu thuẫn, ưu tiên file này và kiểm tra lại trên máy thật.

## Extension VBook

### Metadata mã hoá

Một số extension (`wiki-dich`, `qmbook`, `07br`, `roads-team`) dùng chính metadata trong `plugin.json` làm khoá/salt để giải mã file. Sửa `name`, `author`, `version` hoặc `source` có thể làm app không giải mã được và crash.

- Không “chuẩn hoá” metadata của extension đã mã hoá.
- Khi cập nhật, giữ nguyên zip gốc và metadata gốc.
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
- 2 extension không có icon: `uukanshu.cc`, `m.xtyxsw.org`; web phải fallback.
- `index.html` fetch `plugin.json`; mở qua HTTP, không mở `file://`.
- Raw GitHub có cache; sau push có thể cần chờ hoặc purge.
