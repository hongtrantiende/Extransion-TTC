# Ví dụ: một nguồn truyện hoàn chỉnh + walkthrough debug

## 1) Nguồn mẫu dạng HTML (đọc từ tag)
Giả sử site `https://truyen.example.com`:
- Trang chi tiết: `https://truyen.example.com/book/12345/`
- Mục lục nằm ngay trong trang chi tiết (danh sách `<dd><a>`).
- Nội dung chương: `https://truyen.example.com/book/12345/678.html`, phần thân trong `<div id="chaptercontent">`.

```json
{
  "bookSourceUrl": "https://truyen.example.com",
  "bookSourceName": "Truyen Example",
  "bookSourceGroup": "Sạc,Web",
  "bookSourceType": 0,
  "bookUrlPattern": "https://truyen\\.example\\.com/book/\\d+/?.*",
  "enabled": true,
  "enabledExplore": true,
  "enabledCookieJar": true,
  "concurrentRate": "1/800",
  "header": "{\"User-Agent\":\"Mozilla/5.0 (Windows NT 10.0; Win64; x64)\"}",
  "searchUrl": "/search.php?keyword={{key}}&page={{page}}",
  "ruleSearch": {
    "checkKeyWord": "test",
    "bookList": "@CSS:#searchlist .result",
    "name": "@CSS:h3 a@text",
    "author": "@CSS:.author@text<Khuyết danh",
    "bookUrl": "@CSS:h3 a@href",
    "coverUrl": "@CSS:.cover img@src",
    "intro": "@CSS:.intro@text",
    "lastChapter": "@CSS:.latest a@text"
  },
  "exploreUrl": "Đang đọc::/rank/reading/{{page}}.html&&Cổ đại::/list/codai/{{page}}.html&&Sắc hiệp::/list/sac_hiep/{{page}}.html",
  "ruleExplore": {
    "bookList": "@CSS:.bookbox",
    "name": "@CSS:.bookname a@text",
    "author": "@CSS:.author@text",
    "bookUrl": "@CSS:.bookname a@href",
    "coverUrl": "@CSS:.bookimg img@src",
    "intro": "@CSS:.intro@text",
    "wordCount": "@CSS:.words@text"
  },
  "ruleBookInfo": {
    "name": "@CSS:h1 .bookname@text",
    "author": "@XPath://div[@id='info']/p[1]/a/text()",
    "intro": "@CSS:#intro@text",
    "coverUrl": "@CSS:#sidebar img@src",
    "kind": "@CSS:.box_con #options .option a@text",
    "lastChapter": "@CSS:#lastchapter a@text",
    "tocUrl": ""
  },
  "ruleToc": {
    "chapterList": "@CSS:#list dd a",
    "chapterName": "text()",
    "chapterUrl": "href"
  },
  "ruleContent": {
    "content": "@CSS:#chaptercontent",
    "title": "@CSS:#content h1@text",
    "replaceRegex": "##(chưa xong|Nhấn trang sau|Hãy lưu trang|\\(hết chương\\)|truyen\\.example\\.com.*|Nhớ truy cập.*)###"
  }
}
```

Giải thích vài điểm:
- `tocUrl` để trống vì mục lục nằm cùng trang chi tiết → app dùng luôn trang `bookUrl` làm mục lục.
- `chapterName: "text()"` và `chapterUrl: "href"` chạy **trên từng phần tử** `chapterList` (JSoup mặc định).
- `@CSS:.author@text<Khuyết danh`: nếu rỗng thì lấy "Khuyết danh" (toán tử `<`).
- `replaceRegex` dùng `##...###` để **xoá** các dòng quảng cáo.

## 2) Nguồn dạng JSON API
Site trả JSON khi tìm kiếm. Đặt `header` có `Accept: application/json`, dùng `$` (JsonPath):
```json
{
  "bookSourceUrl": "https://api.example.com",
  "bookSourceName": "API Example",
  "header": "{\"Accept\":\"application/json\"}",
  "searchUrl": "https://api.example.com/search?wd={{key}}&pn={{page}}",
  "ruleSearch": {
    "bookList": "$.data.books[*]",
    "name": "$.title",
    "author": "$.author",
    "bookUrl": "@js:'https://api.example.com/book/'+result.bookId"
  },
  "ruleBookInfo": {
    "name": "$.info.title",
    "author": "$.info.author",
    "intro": "$.info.desc",
    "coverUrl": "$.info.cover",
    "tocUrl": "@js:baseUrl"
  },
  "ruleToc": {
    "chapterList": "$.chapters[*]",
    "chapterName": "$.title",
    "chapterUrl": "@js:'https://api.example.com/chapter/'+result.chapterId"
  },
  "ruleContent": {
    "content": "$.content",
    "nextContentUrl": "$.next?@js:'https://api.example.com/chapter/'+JSON.parse(result).next:''"
  }
}
```

## 3) Walkthrough debug từng bước (cách test)
Giả sử nguồn trên Info ra `name` rỗng.

1. Dán JSON vào app (Nguồn sách → thêm/tải từ clipboard), mở **Sửa nguồn sách**.
2. Bấm nút **Gỡ lỗi nguồn** (đầu màn), chọn target **Info**, dán URL chi tiết thật: `https://truyen.example.com/book/12345/`.
3. Đọc log: dòng `ruleBookInfo.name` cho thấy selector `@CSS:h1 .bookname@text` trả `""`.
4. Mở trang đó trên trình duyệt PC → F12 → tìm thẻ chứa tên truyện → thấy nó là `<h1><span class="title">Tên</span></h1>`.
5. Sửa rule thành `name: "@CSS:h1 .title@text"` (hoặc `@XPath://h1//text()`), lưu.
6. Debug lại target Info → `name` đã ra đúng → chuyển sang target **Toc** (nhập cùng URL) kiểm `chapterList/chapterName/chapterUrl`.
7. Target **Content**: nhập URL một chương → kiểm `content` sạch quảng cáo (nếu còn rác, chỉnh `replaceRegex`).
8. Target **Search**: nhập từ khoá `test` → kiểm `bookList` + `bookUrl`.
9. Bật **Dịch vụ web** (Cài đặt → Dịch vụ web) rồi mở `http://<IP-máy>:<cổng>/` trên PC để debug tương tự nhưng gõ rule thoải mái trên bàn phím — tiện khi rule dài.
10. Khi cả 5 target đều ra đúng → quay lại danh sách nguồn → **Kiểm tra/Xác minh** nguồn (app tự mở 1 sách + 1 chương thật) → thấy "hợp lệ".

## 4) Ghi chú fork Novela-MD3
- Màn "Sửa nguồn sách" là Compose với 6 tab: **Cơ bản / Tìm kiếm / Khám phá / Thông tin / Chương / Nội dung** (`BookSourceEditTab`), có nút **Gỡ lỗi nguồn** và menu (đăng nhập, tìm kiếm, cookie, tự hoàn thành, sao chép/dán nguồn, đặt biến nguồn).
- Debug in-app dùng `Debug.startDebug(scope, source, key)` với key là URL/từ khoá; bản web dùng WebSocket (`BookSourceDebugWebSocket`) nhận `{"tag":"<bookSourceUrl>","key":"<URL>"}`.
- Sau khi tạo xong, có thể **Xuất nguồn** (JSON) để chia sẻ hoặc import hàng loạt.

## 5) Nguồn thật: Sáng Tác Việt (khám phá 3 thanh ngang + nội dung qua `java.evalWebView`)
Bản hoàn chỉnh lưu ở **`.qoder/sources/sang-tac-viet.json`**. Điểm đáng học:
- **searchUrl**: `https://sangtacviet.com/io/searchtp/searchBooks?findinname={{key}}&p={{page}}` (tìm theo TÊN = `findinname`, khớp ô "Tìm từ khóa" của web).
- **exploreUrl = mảng JSON** ExploreKind, 3 **thanh ngang** (kind `style:{layout_wrapBefore:true,layout_flexBasisPercent:1}`) mỗi thanh kèm chip:
```json
[
  {"title":"☆·.☆ Trang chủ ☆·.☆","url":"https://sangtacviet.com/io/searchtp/searchBooks?find=&sort=update&tag=&p={{page}}","style":{"layout_wrapBefore":true,"layout_flexBasisPercent":1}},
  {"title":"Mới cập nhật","url":".../searchBooks?find=&sort=update&tag=&p={{page}}"},
  {"title":"☆·.☆ Trạng thái ☆·.☆","url":".../searchBooks?find=&p={{page}}","style":{"layout_wrapBefore":true,"layout_flexBasisPercent":1}},
  {"title":"Hoàn thành","url":".../searchBooks?find=&step=3&p={{page}}"},
  {"title":"☆·.☆ Thể loại ☆·.☆","url":".../searchBooks?find=&p={{page}}","style":{"layout_wrapBefore":true,"layout_flexBasisPercent":1}},
  {"title":"Đô Thị","url":".../searchBooks?find=&tag=dothi&p={{page}}"}
]
```
  (sort: new/update/view/viewweek/viewday/like/following/bookmarked; trạng thái `&step=`: 1=Còn tiếp,2=Tạm ngưng,3=Hoàn thành,5=Không tạm ngưng; thể loại `&tag=` = `slugVietnamese(tên)` bỏ cả khoảng trắng; tag lấy từ `GET /searchfaceted.json`.)
- **ruleContent.content** = `@js:` chạy `java.get` grantcontext → `java.evalWebView(ref, runScript)` (eval grantScript lấy `chapterkey`; `runScript` đặt `document.createElement=undefined` + polyfill `btoa/atob`) → `java.md5Encode('bookid=..&c=..&h=..&key=..&sajax=readchapter&<salt>')` (**có `&` trước salt**) → `java.get` readchapter → bỏ tag + giải mã glyph. **Ép `String(...)`** mọi args `java.*`. Xem `experience.md` mục 4.
- **Cài/test bằng Node** (không PowerShell) để nhãn tiếng Việt không bị mã hoá kép: `fetch` getBookSource → sửa `exploreUrl`/`bookSourceName` → `POST /saveBookSource`.
