---
name: legado-source-creation
description: Tạo và chỉnh sửa nguồn truyện (book source) cho Legado/Novela-MD3 — giải thích từng mục trong màn "Sửa nguồn sách" (6 tab Cơ bản, Tìm kiếm, Khám phá, Thông tin, Chương, Nội dung), cú pháp rule (css/xpath/json/regex, @, ||, &&, ##, <, @put/get, {{js}}, $ jsonpath, :: trong exploreUrl), cách các bước liên kết với nhau, và cách test nguồn (debug trong app theo target, dịch vụ web qua IP LAN, kiểm tra nguồn). Có sẵn cầu nối `java.evalWebView(url, js)` để nguồn cần chạy JS nặng/obfuscate bằng engine trình duyệt (WebView). Dùng khi người dùng nói tạo nguồn truyện, sửa nguồn, ruleBookInfo/ruleToc/ruleContent/ruleSearch/ruleExplore, bookSourceUrl, "gỡ lỗi nguồn", hoặc cần test nguồn Legado.
---

# Tạo nguồn truyện Legado / Novela-MD3

Một **nguồn truyện** (book source) là một đối tượng JSON mô tả cách đọc một website truyện: tìm ở đâu, mở trang nào, lấy tên/tác giả/bìa ở đâu, liệt kê chương ra sao, và trích nội dung thế nào. Engine `AnalyzeRule` của app diễn giải các "rule" (chuỗi quy tắc) để cào dữ liệu từ HTML/JSON.

## Khi nào dùng skill này
- Người dùng muốn tạo mới / sửa một nguồn truyện cho app Legado/Novela-MD3.
- Cần hiểu một mục trong màn **Sửa nguồn sách** để làm gì.
- Cần viết đúng cú pháp rule hoặc debug khi nguồn trả về rỗng/sai.

## Luồng dữ liệu của một nguồn (cách các mục liên kết)
```
Khám phá (exploreUrl + ruleExplore)  ┐
                                     ├─> bookUrl (URL trang chi tiết) ─> ruleBookInfo ─> tocUrl
Tìm kiếm (searchUrl + ruleSearch)    ┘                                        │
                                                                              v
                                                    ruleToc (danh sách chương) ─> mỗi chapterUrl
                                                                              │
                                                                              v
                                                        ruleContent (nội dung chương)
```
- **Điểm neo chính là `bookUrl`**: URL chi tiết sách khớp với `bookUrlPattern` (regex) để app biết đây là sách của nguồn này.
- `ruleBookInfo.tocUrl` cho biết mở URL nào để lấy **mục lục**; `ruleToc.chapterUrl` cho URL từng chương; `ruleContent.content` lấy nội dung từ URL chương đó.
- Mọi URL tương đối được giải theo `baseUrl` của trang đang đọc → thường chỉ cần lấy `href` tương đối, app tự nối tuyệt đối.

## 6 tab trong "Sửa nguồn sách" và các mục chính
> Tên trường là khoá JSON thật (khớp `BookSource.kt` + `data/entities/rule/*.kt`). Xem **[reference.md](reference.md)** cho danh mục đầy đủ + ý nghĩa từng trường.

### 1) Cơ bản (Base)
- `bookSourceUrl` — **khoá chính**, URL gốc của trang (vd `https://truyen.example.com`). Bắt buộc, có http/https.
- `bookSourceName` — tên hiển thị của nguồn.
- `bookSourceGroup` — nhóm/tag (phân loại bằng dấu `,`).
- `bookSourceType` — 0 Văn bản, 1 Âm thanh, 2 Ảnh, 3 File, 4 Video (thường = 0).
- `bookUrlPattern` — regex nhận diện URL chi tiết sách (vd `https://truyen\.example\.com/book/\d+`).
- `enabled` / `enabledExplore` — bật nguồn / bật tab Khám phá.
- `header` — request header (JSON, vd `{"User-Agent":"..."}`).
- `jsLib` — thư viện JS nạp thêm. `enabledCookieJar` — tự lưu cookie. `concurrentRate` — giới hạn tốc độ (vd `0/1000` = mỗi 1000ms 1 request).
- `loginUrl` / `loginUi` / `loginCheckJs` — đăng nhập. `coverDecodeJs` — giải mã ảnh bìa.
- `variableComment` — mô tả biến tuỳ chỉnh. `bookSourceComment` — ghi chú.
- `exploreUrl` + `ruleExplore` — danh mục Khám phá. `searchUrl` + `ruleSearch` — Tìm kiếm.

### 2) Tìm kiếm (Search) — `ruleSearch`
Dùng khi người dùng gõ từ khoá. Các trường: `bookList` (chọn mảng sách), rồi trong mỗi phần tử: `name`, `author`, `intro`, `kind`, `lastChapter`, `updateTime`, `bookUrl`, `coverUrl`, `wordCount`. Thêm `checkKeyWord` (từ khoá thử để kiểm tra nguồn). `searchUrl` ở tab Cơ bản chứa `{{key}}` để chèn từ khoá.

### 3) Khám phá (Explore) — `ruleExplore`
Cấu trúc `bookList` + các trường giống Search (không có `checkKeyWord`), thêm `pageParam`. **`exploreUrl` (tab Cơ bản) nên dùng mảng JSON** `[{"title","url"},...]` (fork này **chuẩn hoá `&&` và xuống dòng thành khoảng trắng** nên chuỗi `Tên::URL&&…` dễ **dính thành 1 tab**). Muốn có **thanh ngang phân nhóm**: thêm kind tiêu đề chiếm trọn hàng bằng `style:{"layout_wrapBefore":true,"layout_flexBasisPercent":1}` (KHÔNG dùng `type:"text"` — kiểu đó là ô nhập). Chi tiết + ví dụ: **[experience.md](experience.md) mục 7**.

### 4) Thông tin (Info) — `ruleBookInfo`
Đọc trang chi tiết sách: `init` (js chạy trước), `name`, `author`, `intro`, `kind`, `lastChapter`, `updateTime`, `coverUrl`, `tocUrl` (URL mục lục — rất quan trọng), `wordCount`, `canReName`, `downloadUrls`, `relatedBooks`.

### 5) Chương (Toc) — `ruleToc`
Đọc mục lục: `chapterList` (mảng chương), `chapterName`, `chapterUrl`, `isVolume` (có phải mục cấp cha?), `nextTocUrl` (phân trang mục lục), `formatJs`, `preUpdateJs`, `isVip`, `isPay`, `updateTime`.

### 6) Nội dung (Content) — `ruleContent`
Đọc nội dung mỗi chương: `content` (phần thân chính), `title`, `subContent`, `nextContentUrl` (nối nhiều trang 1 chương), `replaceRegex` (xoá rác), `webJs`, `sourceRegex`, `imageStyle`, `imageDecode`, `payAction`, `callBackJs`.

## Cú pháp rule cốt lõi (viết tắt — chi tiết ở reference.md)
- **Kiểu chọn** bằng prefix: `@CSS:`, `@XPath:`, `@Json:` (hoặc bắt đầu `$`), `@Regex:` (hoặc bắt đầu `:`), `@Default:` (JSoup, mặc định). Ví dụ `@XPath://div[@class='txt']/text()`.
- **`||`** = dự phòng: `rule1||rule2` (rule1 rỗng thì dùng rule2).
- **`&&`** = nối/nhiều bước: `rule1&&rule2` (nối kết quả, hoặc chọn lồng nhau).
- **`##`** = regex thay thế: `rule##(mẫu)##(thay thế)###` (bỏ phần tử thừa).
- **`<`** = giá trị mặc định: `rule<mặc định`.
- **`$`** = JsonPath cho dữ liệu JSON (vd `$.data.list[*].title`).
- **`{{ ... }}`** = JS nội tuyến; **`@js:`** = toàn bộ rule là JS. Trong JS có `result`, `baseUrl`, `java.*`.
- **`@put:` / `get('k')`** = lưu/đọc biến trung gian.
- URL: `{{key}}` từ khoá, `<page>`/`{{page}}` trang, `{{bookUrl}}`...

## Cách TEST nguồn (3 cách)
1. **Debug trong app (khuyên dùng):** Trong màn Sửa nguồn có nút **Gỡ lỗi nguồn** (`debug_source`), hoặc từ danh sách nguồn chọn **Phân tích/Gỡ lỗi**. Chọn **target**: `Search` / `Explore` / `Info` / `Toc` / `Content`, nhập **URL** (hoặc từ khoá với Search), chạy → xem log từng bước rule trả về gì để sửa.
2. **Dịch vụ web qua IP LAN:** Bật **Dịch vụ web** trong app (Cài đặt → Dịch vụ web / Web service), app chạy HTTP+WebSocket (ktor) trên máy. Mở trình duyệt trên PC tới `http://<IP-máy>:<cổng>/` → trang **SourceDebug** chạy đúng luồng debug ở trên (gửi `{tag:<bookSourceUrl>, key:<URL>}`). Đây là cách "test bằng IP mạng / dịch vụ web".
3. **Kiểm tra nguồn (check):** Từ danh sách nguồn → **Kiểm tra/Xác minh** để app tự tìm `checkKeyWord`, mở thử 1 sách + 1 chương, đánh dấu nguồn sống/chết.

### Checklist test một nguồn mới
```
- [ ] bookSourceUrl + bookUrlPattern khớp URL thật của trang
- [ ] Search: searchUrl có {{key}}; ruleSearch.bookList + name + bookUrl ra đúng
- [ ] Info: ruleBookInfo.name/author/coverUrl + ĐẶC BIỆT tocUrl ra đúng
- [ ] Toc: chapterList + chapterName + chapterUrl ra danh sách chương
- [ ] Content: content lấy được nội dung, replaceRegex sạch rác
- [ ] Explore (nếu có): exploreUrl dạng Tên::URL&&... + ruleExplore.bookList
- [ ] Chạy Debug từng target, không bước nào trả về rỗng
```

## Mẹo & lỗi thường gặp
- Kết quả rỗng ở Info/Toc thường do **selector sai** hoặc **thiếu tocUrl** → mở Debug target Info xem `tocUrl`.
- Trang trả JSON: dùng `@Json:`/`$` và đặt `header` có `Accept: application/json`; `bookSourceType` vẫn 0 nếu là truyện chữ.
- Website chặn UA: đặt `header` với `User-Agent` trình duyệt; bật `enabledCookieJar`; cần thì `concurrentRate` để tránh bị chặn.
- URL tương đối: app tự nối theo `baseUrl`, nên chỉ cào `href` thô; nếu cần tuyệt đối chủ động dùng `@js:` + `java.net.URL`.
- Ảnh bìa lỗi: dùng `coverDecodeJs`/`imageDecode`.

## Nguồn cần engine trình duyệt (java.evalWebView)
Vài web (vd Sáng Tác Việt) lấy nội dung bằng cách **chạy một đoạn JS nặng/obfuscate của chính web** (tính `chapterkey`, giải mã font, token...) mà engine **Rhino** của `@js:` chạy quá chậm/treo. App có sẵn cầu nối **`java.evalWebView(url, js)`**: nạp `url` (origin) vào một **WebView thật** (engine Chromium) rồi chạy `js` và trả kết quả chuỗi. Đây là năng lực **chung, opt-in** — `@js:` mặc định vẫn Rhino, chỉ nguồn nào chủ động gọi mới dùng.
- Chữ ký: `java.evalWebView(String url, String js): String` — `js` là mã JS chạy trong trình duyệt; giá trị biểu thức cuối cùng (chuỗi) được trả về.
- Trong `js` có sẵn `window/document/navigator/location/localStorage/btoa/atob/XMLHttpRequest` (môi trường trình duyệt thật) → eval được script obfuscate nhanh.
- HTTP vẫn nên làm ở Rhino bằng `java.get/java.post` (OkHttp, **không CORS**); chỉ đẩy phần `eval` script sang WebView. Muốn gọi API **cùng origin** thì nạp WebView tại origin đó (tránh CORS).
- **Ép `String(...)`** cho mọi giá trị nối chuỗi truyền vào hàm `java.*` (Rhino trả `ConsString` → `ClassCastException` nếu không ép).
- Ví dụ thật (Sáng Tác Việt): `java.get` lấy `grantcontext` (script + cookie `readcontextid`) → `java.evalWebView(ref, runScript)` để `eval(script)` lấy `chapterkey` (runScript đặt `document.createElement=undefined`, polyfill `btoa/atob`, đọc `window.app.reader.chapterkey`) → `java.md5Encode` ký (`bookid=..&c=..&h=..&key=..&sajax=readchapter&<salt>` — **có dấu `&` trước salt**) → `java.get` `readchapter`.

## Tài liệu tham khảo
- **Kinh nghiệm thực chiến + case study STV/ext→Legado** (vòng lặp test–sửa, cài/test qua dịch vụ web, các cú pháp hay vấp, nguồn kẹt JS obfuscate, checklist nguồn khó): **[experience.md](experience.md)**
- Danh mục trường đầy đủ + cú pháp rule chi tiết + định dạng `exploreUrl`/`searchUrl`: **[reference.md](reference.md)**
- Nguồn mẫu hoàn chỉnh + ví dụ debug từng bước: **[examples.md](examples.md)**
