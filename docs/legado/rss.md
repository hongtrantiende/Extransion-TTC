# RSS source Legado

## Vị trí

```text
legado/rss/baomoi.json       source Báo Mới
legado/rss/truyenqq.json     source Truyện QQ
legado/rss/sources.json      aggregate 2 source
```

Import tất cả:

```text
legado://import/rssSource?src=https%3A%2F%2Fraw.githubusercontent.com%2Fhongtrantiende%2FExtransion-TTC%2Fmain%2Flegado%2Frss%2Fsources.json
```

## Báo Mới

- `sourceUrl`: `https://baomoi.com`
- 17 tab trong `sortUrl` (Trang chủ, Tin mới, Thời sự, Thế giới, Kinh tế, ...).
- `ruleArticles`: `class.bm-card`
- `ruleTitle`: `class.bm-card-header@tag.a.0@textNodes`
- `ruleLink`: `class.bm-card-header@tag.a.0@href`
- `ruleImage`: `class.bm-card-image@tag.img.0@src`
- `rulePubDate`: `class.content-time.0@textNodes`
- `ruleDescription`: `""`
- `ruleContent`: `@js:` parse `__NEXT_DATA__`
- `header`: JSON **string** chứa User-Agent desktop và Referer.

Báo Mới không có RSS công khai (`/rss/*` trả 404). Nguồn dùng HTML + JSON Next.js.

## Truyện QQ

- `sourceUrl`: `https://truyenqqko.com`
- 7 tab: Mới cập nhật, Top ngày, Top tuần, Top tháng, Truyện mới, Truyện full, Yêu thích.
- `ruleArticles`: `class.list_grid@tag.li`
- `ruleTitle`: `class.book_name@tag.a.0@text`
- `ruleLink`: `class.last_chapter@tag.a.0@href` — trỏ thẳng chapter mới nhất.
- `ruleImage`: `class.book_avatar@tag.img.0@src`
- `rulePubDate`: `""`
- `ruleDescription`: `""`
- `ruleContent`: `@js:` parse `img.lazy` và trả `<img>` cho từng trang.
- `header`: desktop UA + Referer.

Mỗi article là **một truyện, link tới chapter mới nhất**, không phải trang detail. Mở article sẽ thấy toàn bộ ảnh chapter. Nếu site đổi CDN, cập nhật các cặp host trong `ruleContent`.

Đã smoke-test 2026-10-21 với HTML chapter thật: 42 item ở list, 31 ảnh chapter. Đã cài lên máy và debug qua WebSocket: list 42 item, content 32 ảnh.

## Rule syntax

Rule mặc định của Legado RSS là **JSoup selector**, không phải CSS thuần:

```text
class.bm-card@tag.a.0@textNodes
class.last_chapter@tag.a.0@href
```

- `@` là bước tiếp theo.
- Bước cuối thường là `text`, `textNodes`, `ownText`, `href`, `src`, `html`, `all`.
- CSS có dấu cách (`.bm-card-header a`) thường trả 0; chỉ dùng `@css:` khi thật cần.
- JSONPath: `$.` hoặc `@json:`.
- XPath: `//` hoặc `@XPath:`.

## Bẫy `ruleDescription`

`ReadRssViewModel` dùng `article.description` làm nội dung bài nếu nó **không rỗng**, và không fetch trang content.

Vì vậy:

- Muốn đọc full bài: `ruleDescription: ""`.
- Dùng `ruleContent` để lấy nội dung.
- Nếu `ruleDescription` có text, app sẽ hiển thị text đó và bỏ qua content.

## `ruleContent` JS

`@js:` chạy trong Rhino với các binding:

| Binding | Ý nghĩa |
|---|---|
| `src` | HTML/body thô của trang |
| `result` | Giá trị trung gian |
| `baseUrl` | URL gốc |
| `rssArticle` | Article hiện tại |
| `source` | Source object |
| `cookie` | Cookie |
| `cache` | Cache |
| `java` | Java bridge |

Dùng ES5 (`var`, `for`). Giá trị cuối của script là nội dung trả về.

Báo Mới:

- Static DOM có ảnh lazy dạng `data:image/gif;base64,...` 1px.
- URL ảnh thật nằm trong `props.pageProps.resp.data.content.bodys`.
- `bodys` là array `{type: "text"|"image", content: "..."}`.
- Rebuild `<p>` và `<img>` theo đúng thứ tự.
- Fallback: meta description nếu không có body.

Dạng rút gọn:

```js
var a = src.split('<script id="__NEXT_DATA__" type="application/json">');
var out = "";
if (a.length > 1) {
  var json = JSON.parse(a[1].split("</script>")[0]);
  var bodys = json.props.pageProps.resp.data.content.bodys;
  for (var i = 0; i < bodys.length; i++) {
    var e = bodys[i];
    if (e.type === "text") out += "<p>" + e.content + "</p>";
    else if (e.type === "image") out += '<p><img src="' + e.content + '"/></p>';
  }
}
out;
```

Không copy nguyên đoạn trên nếu schema site đổi; kiểm tra `__NEXT_DATA__` thật.

## API lưu source

- `POST /saveRssSources` **không upsert** theo `sourceUrl`.
- Muốn sửa source đã có: `POST /deleteRssSources` với array `{sourceUrl, sourceName}` trước, rồi save lại.
- Sau khi đổi rule, refresh danh sách RSS hoặc xoá/thêm lại vì article cũ có thể giữ description cũ.

## Debug

WebSocket:

```text
ws://<phone>:1123/rssSourceDebug
```

Payload:

```json
{"tag": "<sourceUrl>"}
```

Lưu ý:

- Là object, không phải array.
- Chỉ parse item đầu tiên.
- Với `ruleDescription` rỗng, debug còn fetch content page và in body (`state 20`).
- Kết thúc `CLOSE 1000`.
- Đây là smoke test item đầu, không phải test toàn source.

## Test content rule

Tạo source tạm:

```json
{
  "sourceName": "RSS Content Test",
  "sourceUrl": "<sample-article-url>",
  "sortUrl": "<sample-article-url>",
  "ruleArticles": "html",
  "ruleTitle": "tag.title.0@textNodes",
  "ruleLink": "link[rel=canonical]@href",
  "ruleDescription": "",
  "ruleContent": "@js: ..."
}
```

Debug source tạm để xem HTML sinh ra trước khi sửa source thật.

## Thêm/sửa source

1. Sửa file trong `legado/rss/`.
2. Cập nhật `legado/rss/sources.json` thành array object source.
3. Chạy:
   ```bash
   python3 scripts/catalog.py validate
   ```
4. Import/test trên Legado.
5. Kiểm tra: list có bài, mở bài có nội dung, ảnh không phải placeholder, tab đổi đúng.

## Lỗi thường gặp

| Lỗi | Nguyên nhân |
|---|---|
| List rỗng | `sortUrl` sai, `ruleArticles` sai, site chặn UA |
| Mở bài trắng | `ruleDescription` không rỗng; `ruleContent` lỗi |
| Ảnh 1px | Ảnh lazy; chưa parse JSON bodys |
| Rule JS không chạy | Thiếu `@js:`; syntax ES6; JSON schema đổi |
| Sửa source không có tác dụng | API không upsert; cần delete trước |
| Debug chỉ trả item đầu | Giới hạn của WS debug, không phải lỗi source |

Nguồn tham chiếu đầy đủ (lịch sử): `memory/semantic/legado-rss-sources.md`.
