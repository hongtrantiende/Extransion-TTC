# Legado / Novela — RSS Source Playbook

> Kinh nghiệm thực chiến khi tạo, debug và sửa nguồn RSS cho app **Novela** (fork Legado, package `io.legato.kazusa`).
> Case study hoàn chỉnh: **Báo Mới (`https://baomoi.com`)** — site không có RSS, phải dùng rule HTML + JS đọc `__NEXT_DATA__` để lấy đúng ảnh.

---

## 1. Môi trường & endpoint

| Thứ | Giá trị |
|---|---|
| App | Novela — fork Legado (`io.legato.kazusa`) |
| Web API | `http://<IP-điện-thoại>:1122` |
| WS debug | `ws://<IP-điện-thoại>:1123/rssSourceDebug` |
| Auth | Không cần token nếu "Bảo vệ token truy cập" đang tắt |
| IP dùng trong phiên này | `192.168.99.180` (IP điện thoại có thể đổi — luôn kiểm tra lại) |

### API RSS

```http
GET  /getRssSources
GET  /getRssSource?url=<sourceUrl URL-encoded>
POST /saveRssSources      body: [ {...RssSource...} ]
POST /deleteRssSources    body: [ {"sourceUrl":"...","sourceName":"..."} ]
```

Quy tắc sống còn:

- `sourceUrl` là **khóa chính**. `saveRssSources` **không update** source đã tồn tại.
- Muốn sửa: `deleteRssSources` trước → `saveRssSources` sau.
- `deleteRssSources` cần ít nhất `sourceUrl`; thêm `sourceName` cho chắc.
- Sau khi sửa rule phải **refresh danh sách RSS** (kéo xuống) hoặc xoá/thêm lại nguồn, vì article cũ có thể còn cache `description`.

### WS debug

Gửi đúng một object, không phải array:

```json
{"tag":"https://baomoi.com"}
```

- Log trả về là text frame, kết thúc `CLOSE 1000`.
- Debug chỉ parse **item đầu tiên** của danh sách.
- Nếu `ruleDescription` trống, debug sẽ chạy luôn phần parse **trang nội dung** và in body (state 20).
- Nếu `ruleDescription` có rule, debug báo: `Có quy tắc mô tả và trang nội dung không được phân tích cú pháp`.

---

## 2. Cấu trúc `RssSource`

Các field quan trọng:

| Field | Ý nghĩa |
|---|---|
| `sourceUrl` | URL gốc, khóa chính |
| `sourceName` | Tên hiển thị |
| `sourceIcon` | Icon |
| `sourceGroup` | Nhóm |
| `enabled` | Bật/tắt |
| `enabledCookieJar` | Dùng cookie jar |
| `header` | **Chuỗi JSON** header gửi kèm |
| `sortUrl` | Danh sách tab, mỗi dòng `Tên::URL` |
| `singleUrl` | Nguồn chỉ có 1 URL |
| `articleStyle` | Layout reader (0–4) |
| `type` | `0` = web |
| `ruleArticles` | Selector từng item trong trang danh sách |
| `ruleTitle` | Tiêu đề |
| `ruleLink` | Link bài |
| `ruleImage` | Ảnh thumbnail |
| `rulePubDate` | Thời gian |
| `ruleDescription` | Mô tả ngắn — **xem cảnh báo bên dưới** |
| `ruleContent` | Rule lấy nội dung bài |
| `nextContentUrl` | Link trang nội dung tiếp theo (nếu bài chia trang) |
| `enableJs` | Bật JS của site (thường không cần) |
| `loadWithBaseUrl` | Resolve URL tương đối theo base |
| `customOrder` | Thứ tự |
| `lastUpdateTime` | Timestamp |

### ⚠️ Bẫy lớn nhất: `ruleDescription`

Luồng đọc bài trong `ReadRssViewModel`:

```text
article.description != rỗng  ->  hiển thị description (KHÔNG tải trang bài)
ngược lại, ruleContent != rỗng ->  tải link bài, parse ruleContent
ngược lại                     ->  mở webview URL gốc
```

Hệ quả:

- Muốn đọc **toàn văn** → để `ruleDescription` **trống**.
- Đặt `ruleDescription` thì list đẹp hơn nhưng bấm vào bài chỉ thấy vài dòng mô tả (hoặc trống nếu card không có mô tả).
- Đây chính là nguyên nhân lỗi "bấm bài không có nội dung" ở Báo Mới lần đầu.

---

## 3. Rule syntax — Legado không phải CSS thuần

Mặc định là **Jsoup selector**, các bước ngăn bằng `@`:

```text
class.bm-card@tag.a.0@textNodes
class.bm-card-image@tag.img.0@src
class.content-body@html
```

Các dạng cuối thường dùng:

```text
text | textNodes | ownText | href | src | html | all
```

Các prefix đặc biệt:

| Cú pháp | Ý nghĩa |
|---|---|
| `@css:.bm-card-header a` | CSS selector thật |
| `$.props.pageProps...` hoặc `@json:...` | JSONPath |
| `//div[@class="x"]` hoặc `@XPath:...` | XPath |
| `@js:\n...` | Chạy JavaScript (Rhino) |

### Lỗi kinh điển

- `.bm-card-header a` → **0 match**. Dấu cách bị hiểu thành separator, không phải descendant selector.
- Đúng: `class.bm-card-header@tag.a.0@textNodes`.
- `class.bm-card` đúng; `class.bm-card-header` đúng; `tag.a` đúng; `.0` là index.
- Luôn kiểm tra element tồn tại trước khi lấy `.text()` / `.attr()`.

---

## 4. Luồng parse & test

### 4.1 Tạo/sửa source

1. Xác định site có RSS thật không:
   - Thử `/rss`, `/feed`, `/rss.xml`, `<link rel="alternate" type="application/rss+xml">`.
   - Không có → dùng rule HTML trên trang category.
2. Fetch trang bằng **desktop UA** (mobile UA thường layout khác).
3. Xác định selector card, title, link, image, time.
4. Tạo JSON source.
5. Nếu source đã tồn tại: `deleteRssSources` → `saveRssSources`.
6. Debug WS `{"tag":"<sourceUrl>"}`.
7. Sửa rule đến khi list đúng; nếu cần full content, bỏ `ruleDescription` và test trang nội dung.
8. Mở app kiểm tra thực tế; refresh list sau khi đổi rule.

### 4.2 Test riêng rule content bằng "nguồn tạm"

Khi cần chạy thử JS content mà không muốn đụng nguồn thật:

```json
{
  "sourceUrl": "<URL bài viết>",
  "sortUrl": "Test::<URL bài viết>",
  "ruleArticles": "html",
  "ruleTitle": "tag.title.0@textNodes",
  "ruleLink": "link[rel=canonical]@href",
  "ruleDescription": "",
  "ruleContent": "@js:\n..."
}
```

- Đặt `sourceUrl` = URL bài để debug content fetch đúng bài.
- Debug sẽ in body content ra log → thấy ngay ảnh/text có đúng không.
- Xong thì `deleteRssSources` nguồn tạm.

### 4.3 Kiểm tra nhanh API

```bash
curl -s "http://192.168.99.180:1122/getRssSource?url=https%3A%2F%2Fbaomoi.com" \
  | python3 -m json.tool | head -40

curl -s -X POST -H 'Content-Type: application/json' \
  --data-binary @rss-source.json \
  http://192.168.99.180:1122/saveRssSources
```

---

## 5. Content nâng cao: JS rule & dữ liệu động

### 5.1 JS rule chạy ở đâu?

`ruleContent: "@js:\n..."` được `AnalyzeRule.evalJS` thực thi. Các binding có sẵn:

```text
src          raw body của trang bài (HTML)
result       kết quả bước trước
baseUrl      base URL
rssArticle   object bài viết
source       RssSource
cookie       CookieStore
cache        CacheManager
java         instance AnalyzeRule
```

- Dùng **ES5**: `var`, `for`, không arrow/`const`/`?.`/`??`.
- `JSON.parse` hoạt động trong Rhino của Legado (đã test thực tế).
- Kết quả cuối cùng của script là nội dung trả về (hoặc gán vào biến cuối).

### 5.2 Case study: Báo Mới lazy-load ảnh

HTML trả về chỉ có placeholder 1px:

```html
<img src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" ...>
```

URL ảnh thật nằm trong `__NEXT_DATA__`:

```text
props.pageProps.resp.data.content.bodys
  { type: "text",  content: "<p>...HTML...</p>" }
  { type: "image", content: "https://photo-baomoi.bmcdn.me/w700_r1/...jpg" }
```

Rule JS hoàn chỉnh đã dùng:

```js
var a = src.split('<script id="__NEXT_DATA__" type="application/json">');
var o = '';
if (a.length > 1) {
  var b = a[1].split('</script>')[0];
  var j = JSON.parse(b);
  var c = j.props.pageProps.resp.data.content;
  var arr = c.bodys;
  for (var i = 0; i < arr.length; i++) {
    var e = arr[i];
    if (e.type === 'text') {
      o += '<p>' + e.content + '</p>';
    } else if (e.type === 'image') {
      o += '<p><img src="' + e.content + '"/></p>';
    } else if (e.content) {
      o += '<p>' + e.content + '</p>';
    }
  }
}
if (!o) {
  var d = src.split('<meta name="description" content="');
  if (d.length > 1) o = '<p>' + d[1].split('"')[0] + '</p>';
}
o;
```

Kết quả test thật: 16 đoạn `<p>`, 2 ảnh absolute `photo-baomoi.bmcdn.me/w700...`, caption nằm ngay sau ảnh.

### 5.3 Khi nào dùng JS?

- Ảnh lazy-load, URL thật nằm trong JSON/script.
- Nội dung render client-side, DOM tĩnh rỗng.
- Cần ghép nhiều field (text + image + caption) theo đúng thứ tự.
- Cần chuẩn hoá URL tương đối → tuyệt đối.

### 5.4 Khi nào chỉ cần `@html`?

- DOM tĩnh đã có đủ text + ảnh thật.
- Ví dụ: `ruleContent: "class.content-body@html"`.
- Nhớ: `@html` trả inner HTML; nếu ảnh là placeholder thì ảnh vẫn trống.

---

## 6. Báo Mới — cấu hình tham chiếu

```json
{
  "sourceName": "Báo Mới",
  "sourceUrl": "https://baomoi.com",
  "sourceGroup": "Báo",
  "enabled": true,
  "enabledCookieJar": true,
  "enableJs": false,
  "loadWithBaseUrl": true,
  "singleUrl": false,
  "articleStyle": 0,
  "type": 0,
  "sortUrl": "Trang chủ::https://baomoi.com/\nTin mới::https://baomoi.com/tin-moi.epi\nThời sự::https://baomoi.com/thoi-su.epi",
  "ruleArticles": "class.bm-card",
  "ruleTitle": "class.bm-card-header@tag.a.0@textNodes",
  "ruleLink": "class.bm-card-header@tag.a.0@href",
  "ruleImage": "class.bm-card-image@tag.img.0@src",
  "rulePubDate": "class.content-time.0@textNodes",
  "ruleDescription": "",
  "ruleContent": "@js:\n<rule ở mục 5.2>",
  "header": "{\"User-Agent\":\"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36\",\"Referer\":\"https://baomoi.com/\"}"
}
```

Ghi chú Báo Mới:

- Không có RSS công khai; mọi `/rss/*` trả 404.
- `sortUrl` thực tế có 17 tab; tất cả dùng chung cấu trúc `.bm-card`.
- **Bắt buộc desktop UA**; mobile UA cho layout khác.
- Ảnh list: `photo-baomoi.bmcdn.me` (absolute).
- Nội dung bài: `__NEXT_DATA__` → `content.bodys`; text + image + caption.
- `ruleDescription` phải trống nếu muốn đọc full bài.

---

## 7. Bảng lỗi & cách xử lý

| Triệu chứng | Nguyên nhân | Cách sửa |
|---|---|---|
| List 0 item | CSS có dấu cách / sai syntax | Dùng Jsoup `class.x@tag.y.0@...` hoặc `@css:` |
| Bấm bài trống | `ruleDescription` có rule | Bỏ `ruleDescription`, dùng `ruleContent` |
| Content trống | Rule chọn placeholder/lazy | Dùng JS đọc JSON thật |
| Ảnh trống | `<img src="data:image/gif...">` | Lấy URL từ `__NEXT_DATA__` / `data-src` |
| Sửa rule không có tác dụng | `saveRssSources` không update | `deleteRssSources` → save lại |
| Vẫn thấy nội dung cũ | Cache article/list | Refresh list hoặc xoá/thêm lại nguồn |
| `UnknownHostException` | DNS điện thoại không resolve domain | Đổi domain/IP hoặc dùng nguồn khác |
| Debug chỉ 1 bài | Giới hạn của debug | Test thêm bằng app thật |
| Save 200 nhưng không thấy | `sourceUrl` trùng / chưa refresh | Kiểm tra `getRssSource`, refresh |

---

## 8. Checklist tạo nguồn RSS mới

- [ ] Site có RSS thật? Nếu không, xác định trang category HTML.
- [ ] Fetch bằng desktop UA, xác định selector card.
- [ ] `sourceUrl` duy nhất; `sortUrl` đúng format `Tên::URL`.
- [ ] `header` là **chuỗi JSON**, có UA + Referer nếu site chặn.
- [ ] Rule list: `ruleArticles`, `ruleTitle`, `ruleLink`, `ruleImage`, `rulePubDate`.
- [ ] Quyết định: cần full content → `ruleDescription = ""`.
- [ ] `ruleContent`: `@html` nếu DOM tĩnh; `@js:` nếu lazy/dynamic.
- [ ] Test list qua WS debug.
- [ ] Test content (nguồn tạm hoặc app thật).
- [ ] Kiểm tra ảnh absolute + load được.
- [ ] Refresh app, mở bài thật, kiểm tra text + ảnh.
- [ ] Lưu source JSON vào nơi làm việc để tái sử dụng.

---

## 9. Bài học cốt lõi

1. **Legado mặc định là Jsoup, không phải CSS** — dấu cách trong selector là bẫy chết người.
2. **`ruleDescription` quyết định có tải trang bài hay không** — muốn full content thì để trống.
3. **Debug WS chỉ test item đầu** — đừng coi đó là test toàn bộ source.
4. **`saveRssSources` không phải upsert** — luôn delete trước khi sửa.
5. **Ảnh lazy-load cần đọc đúng nguồn dữ liệu thật** (`__NEXT_DATA__`, `data-src`, API JSON), không thể tin DOM.
6. **JS rule là vũ khí cuối** khi HTML tĩnh không đủ; dùng ES5, `src` là raw body, `JSON.parse` chạy được.
7. **Test bằng chính điện thoại** — DNS, UA, cookie, WebView có thể khác hoàn toàn so với máy tính.
