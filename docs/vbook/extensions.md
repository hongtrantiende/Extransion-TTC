# Viết extension VBook

## Cấu trúc source

```text
extensions/sources/<ext-id>/
├── plugin.json
├── icon.png                  # tuỳ chọn trong source; bản publish ở extensions/icons/
└── src/
    ├── config.js
    ├── home.js
    ├── genre.js
    ├── gen.js
    ├── search.js
    ├── detail.js
    ├── toc.js
    ├── chap.js
    ├── page.js               # tuỳ chọn
    └── test.json             # tuỳ chọn
```

`plugin.json` cục bộ dùng object `metadata` + `script`:

```json
{
  "metadata": {
    "name": "Báo Mới",
    "author": "Thiên Thư Các",
    "version": 3,
    "source": "https://baomoi.com",
    "description": "Đọc tin tức Báo Mới",
    "locale": "vi_VN",
    "language": "javascript",
    "type": "novel"
  },
  "script": {
    "home": "home.js",
    "genre": "genre.js",
    "gen": "gen.js",
    "search": "search.js",
    "detail": "detail.js",
    "toc": "toc.js",
    "chap": "chap.js"
  }
}
```

`plugin.json` root không cùng schema: root là `{metadata, data[]}`; mỗi entry trong `data` là bản flattened có `path`, `icon`, `type`, `version`.

## Chuẩn metadata catalog

- Extension thường: `author` là `Thiên Thư Các`.
- `description` theo `type`: `novel` → `Truyện chữ`, `chinese_novel` → `Truyện Trung`, `comic` → `Truyện tranh`, `video` → `Phim`.
- Khi cập nhật metadata hàng loạt, tăng `version` thêm 1 và đồng bộ entry root với `plugin.json` trong zip.
- Không đổi `name`, `source`, `regexp`, `icon` hoặc script khi chỉ chuẩn hoá metadata.
- **Ngoại lệ bắt buộc:** mọi zip có `metadata.encrypt: true` phải giữ nguyên metadata gốc (đặc biệt `name`, `author`, `version`, `source`, `description`, `type`). Hiện có 55 zip thuộc nhóm này; xem mục Metadata mã hoá bên dưới.

## Hợp đồng script

| File | Hàm | Input | Output |
|---|---|---|---|
| `home.js` | `execute()` | — | `Response.success({...})` hoặc array item |
| `genre.js` | `execute()` | — | danh sách thể loại/bộ lọc |
| `gen.js` | `execute(url, page)` | URL thể loại, trang | danh sách truyện + `nextPage` |
| `search.js` | `execute(key, page)` | từ khoá, trang | danh sách truyện + `nextPage` |
| `detail.js` | `execute(url)` | URL truyện | object detail có `host` |
| `toc.js` | `execute(url)` | URL truyện | mục lục chương |
| `chap.js` | `execute(url)` | URL chương | nội dung chữ |
| `page.js` | `execute(url)` | URL trang mục lục | **array URL string** |

Trả lỗi bằng `Response.error("...")`; không ném exception thô ra ngoài nếu có thể bắt.

### Detail tối thiểu

```js
return Response.success({
    name: name,
    cover: cover,
    host: "https://m.example.com",
    author: author,
    description: desc
});
```

### Page trả đúng kiểu

```js
return Response.success([
    "https://m.example.com/truyen/1/trang-2",
    "https://m.example.com/truyen/1/trang-3"
]);
```

## Rhino: luật bắt buộc

App chạy Rhino cũ. Code phải là ES5:

- Không `async/await`.
- Không optional chaining `?.`.
- Không nullish coalescing `??`.
- Không arrow function, template literal, destructuring phức tạp.
- Dùng `var` và `function`.
- Sau parse, ép chuỗi: `value + ""` hoặc `String(value)`.
- Kiểm tra null trước khi gọi method:
  ```js
  var el = doc.select("h1").first();
  var title = el ? el.text() + "" : "";
  ```
- `doc.select(...).first()` có thể null.
- Không giả định phần tử tồn tại chỉ vì selector đúng trên PC.

## Selector

- Mặc định là JSoup selector; kiểm tra cấu trúc HTML thật, không đoán.
- Dùng debug trên máy thật để xem HTML/JSON trả về.
- Nếu site render bằng JSON/Next.js, parse JSON trong JS thay vì cố bám DOM.
- Với ảnh lazy, `src` có thể là placeholder; tìm `data-src`, `data-original` hoặc JSON nguồn.

## Metadata mã hoá

Mọi extension có `metadata.encrypt: true` dùng metadata làm khoá/salt giải mã. Với các extension này:

- Không đổi `name`, `author`, `version`, `source`, `description`, `type`.
- Không pack lại, không chạy script chuẩn hoá metadata hàng loạt.
- Giữ nguyên zip gốc và entry root tương ứng; chỉ sửa khi có bản gốc và test lại trên máy thật.

Danh sách hiện tại gồm 55 zip, trong đó có `wiki-dich`/`wikicv.net`, `qmbook`, `07br`, `roads-team`. Danh sách có thể tăng; nếu extension lạ crash sau khi sửa metadata, nghi ngờ cơ chế này.

## Quy ước đặt tên

- ID/thư mục: chữ thường, không dấu, không hậu tố `-com`/`-top` nếu không cần.
- Tên hiển thị: ngắn, Latin/domain, dễ gõ.
- Icon: favicon/logo chính thức, lưu `extensions/icons/<id>.png`.
- Không dùng tên tiếng Trung làm `name` nếu không có lý do đặc biệt.

## Quy trình sửa

1. Chọn source trong `extensions/sources/` hoặc giải nén zip vào đó.
2. Sửa `src/*.js`; giữ ES5.
3. Test:
   ```bash
   cd extensions/studio && npm ci   # lần đầu
   cd ../..
   node extensions/studio/studio.js test <ext-id>
   ```
4. Kiểm tra trang 2+ nếu có phân trang.
5. Pack:
   ```bash
   node extensions/studio/studio.js pack <ext-id>
   ```
6. Chạy validator:
   ```bash
   python3 scripts/catalog.py validate
   ```
7. Commit source + zip + icon + `plugin.json`.

## Lỗi thường gặp

| Triệu chứng | Nguyên nhân thường gặp |
|---|---|
| Mục lục rỗng | `page.js` trả object thay vì string; thiếu `host`; selector toc sai |
| Chap rỗng | Nội dung nằm trong JSON; ảnh/chữ lazy; selector sai |
| App crash sau cài | Metadata mã hoá bị sửa; zip hỏng; thiếu file script |
| Trang 2 không tải | `nextPage` sai kiểu; API cần cookie/CSRF |
| Home không có cover | Site không có ảnh tĩnh; cần API/công thức |
| Sửa code mà app không đổi | Cache Rhino; tắt/bật Web Server hoặc force-stop app |
| Studio báo thiếu `jszip` | Chưa chạy `npm ci` trong `extensions/studio/` |

## Tham chiếu

- `docs/vbook/testing.md`
- `docs/vbook/reference/runtime.md`
- `docs/vbook/reference/hard-sites.md`
- `docs/vbook/reference/upstream-lessons.md`
- `docs/vbook/reference/repair.md`
