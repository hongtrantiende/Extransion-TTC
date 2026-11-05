# Tham khảo: trường nguồn truyện + cú pháp rule (Legado/Novela-MD3)

Tài liệu này bám theo mã thật trong repo: `data/entities/BookSource.kt`, `data/entities/rule/*.kt`, `model/analyzeRule/AnalyzeRule.kt`.

## A. Các trường cấp nguồn (BookSource)
| Khoá JSON | Kiểu | Ý nghĩa |
|---|---|---|
| `bookSourceUrl` | String (khoá chính) | URL gốc trang, có http/https. Dùng làm định danh nguồn. |
| `bookSourceName` | String | Tên nguồn hiển thị. |
| `bookSourceGroup` | String? | Nhóm/tag, phân tách bằng `,`. |
| `bookSourceType` | Int | 0 Văn bản · 1 Âm thanh · 2 Ảnh · 3 File · 4 Video. |
| `bookUrlPattern` | String? | Regex URL chi tiết sách (để app nhận diện `bookUrl` thuộc nguồn này). |
| `customOrder` | Int | Thứ tự thủ công. |
| `enabled` | Bool | Bật nguồn. |
| `enabledExplore` | Bool | Bật tab Khám phá. |
| `jsLib` | String? | Thư viện JS nạp thêm (tên file trong `jsLib`). |
| `enabledCookieJar` | Bool? | Tự lưu/ gửi cookie mỗi request. |
| `concurrentRate` | String? | Giới hạn tần suất request, dạng `số_lần/<ms hoặc giây>` (vd `1/1000`). |
| `header` | String? | JSON header, vd `{"User-Agent":"Mozilla/5.0 ...","Referer":"..."}`. |
| `loginUrl` | String? | URL mở đăng nhập. |
| `loginUi` | String? | HTML form đăng nhập tuỳ biến. |
| `loginCheckJs` | String? | JS kiểm tra đã đăng nhập chưa (trả true/false). |
| `coverDecodeJs` | String? | JS giải mã byte ảnh bìa. |
| `bookSourceComment` | String? | Ghi chú nguồn. |
| `variableComment` | String? | Mô tả các biến tuỳ chỉnh (dùng với `{{var}}`). |
| `exploreUrl` | String? | Danh mục Khám phá (xem mục D). |
| `exploreScreen` | String? | Bộ lọc Khám phá. |
| `ruleExplore` | ExploreRule? | Quy tắc Khám phá. |
| `searchUrl` | String? | URL tìm kiếm, có `{{key}}` (xem mục D). |
| `ruleSearch` | SearchRule? | Quy tắc kết quả tìm kiếm. |
| `ruleBookInfo` | BookInfoRule? | Quy tắc trang chi tiết sách. |
| `ruleToc` | TocRule? | Quy tắc mục lục. |
| `ruleContent` | ContentRule? | Quy tắc nội dung chương. |
| `ruleReview` | ReviewRule? | Quy tắc bình luận từng đoạn. |
| `eventListener` | Bool | Bật callback JS theo sự kiện. |
| `customButton` | Bool | Nút tuỳ biến do nguồn điều khiển. |
| `homepageModules` | String? | Mảng JSON module trang chủ (key/type=banner/ranking/grid/card/filter, title, args?, url?). |

## B. Các trường trong từng rule
### ruleSearch (SearchRule) — kế thừa danh sách
`checkKeyWord`, `bookList`, `name`, `author`, `intro`, `kind`, `lastChapter`, `updateTime`, `bookUrl`, `coverUrl`, `wordCount`.
### ruleExplore (ExploreRule)
`bookList`, `name`, `author`, `intro`, `kind`, `lastChapter`, `updateTime`, `bookUrl`, `coverUrl`, `wordCount`, `pageParam`.
> `bookList` chọn tập các phần tử sách; các trường còn lại chạy **trên từng phần tử** đó.
### ruleBookInfo (BookInfoRule)
`init` (JS chạy trước khi lấy thông tin), `name`, `author`, `intro`, `kind`, `lastChapter`, `updateTime`, `coverUrl`, `tocUrl`, `wordCount`, `canReName`, `downloadUrls`, `relatedBooks`.
### ruleToc (TocRule)
`preUpdateJs`, `chapterList`, `chapterName`, `chapterUrl`, `formatJs`, `isVolume`, `isVip`, `isPay`, `updateTime`, `nextTocUrl`.
### ruleContent (ContentRule)
`content`, `subContent` (phụ văn/lời nhạc, nối sau nội dung), `title`, `nextContentUrl` (trang kế của cùng chương), `webJs`, `sourceRegex`, `replaceRegex`, `imageStyle`, `imageDecode`, `payAction`, `callBackJs`.
### ruleReview (ReviewRule) — bình luận đoạn
`name`, `content`, `postList`, `authorName`, `filePath`, `headline`, `contentUrl`, `coverUrl`, `summary`, `resultList`, `voteCount`, `canReply` (tùy phiên bản).

## C. Cú pháp rule (AnalyzeRule)
Một rule là chuỗi; engine tách theo `&&` (nối nhiều bước) rồi từng đoạn phân tích **mode** (kiểu chọn).

### C1. Kiểu chọn (mode)
- `@Default:` / không prefix → **JSoup** (CSS selector hoặc XPath tự nhận). Kết quả là text/attr.
- `@CSS:` → CSS selector (vd `@CSS:.title`). Lấy text nếu không chỉ định attr.
- `@XPath:` → XPath (vd `@XPath://h1[@class='t']/text()`).
- `@Json:` hoặc rule bắt đầu `$` → **JsonPath** (vd `$.data.list[*].name`).
- `@Regex:` hoặc rule bắt đầu `:` → regex trên chuỗi.
- `@js:` / `{{...}}` → JavaScript (Rhino). `@put:` → lưu biến. `@get:` → đọc biến.
- Attr đặc biệt: `text()` (nội dung), `html()` (HTML trong), `textNodes()`, `ownText()`, `tag()`, `className()`, `id()`, `href`/`src` (tự lấy URL tuyệt đối theo baseUrl).

### C2. Toán tử ghép
- `||` — **dự phòng**: `A||B` → nếu A rỗng/lỗi thì dùng B.
- `&&` — **nối / lồng**: `A&&B` → B chạy trên kết quả A (hoặc nối chuỗi). Dùng để đi sâu: `@CSS:li&&@CSS:a@href`.
- `##` — **regex thay thế**: `rule##(mẫu)##(thay thế)`; `###` ở cuối để bỏ hoàn toàn (thay bằng rỗng). Vd `##\s+###` xoá khoảng trắng.
- `<` — **giá trị mặc định**: `rule<Chưa rõ` → nếu rule rỗng trả `Chưa rõ`.
- `%%` — không dùng; bỏ qua nếu thấy.

### C3. JS nội tuyến
- `{{ ... }}`: biểu thức JS nhỏ, có sẵn `result`, `baseUrl`, `java`, `String`, `RegExp`. Vd `{{result.replace(/<[^>]+>/g,'')}}`.
- `@js:` cả rule là JS, trả về giá trị. Vd `@js:baseUrl.split('/').pop()`.
- Biến toàn cục giữa các rule: `@put:ten={{...}}` rồi đọc bằng `{{ten}}` hoặc `get('ten')`.

### C4. URL & phân trang
- Trong `content`/URL rule: `<page>`, `{{page}}`, `<pageSize>`, `{{key}}` (từ khoá), `{{bookUrl}}`, `{{authorUrl}}`.
- `nextTocUrl` / `nextContentUrl`: URL trang kế (để gộp nhiều trang).
- `pageParam` (Explore): tên tham số trang khi tự động thêm vào URL khám phá.

## D. Định dạng exploreUrl / searchUrl
### exploreUrl (tab Cơ bản)
Có 2 cách khai báo:
1) **Kiểu chuỗi** `Nhãn::URL&&Nhãn2::URL2` (`::` tách nhãn/URL, `&&` tách mục).
2) **Mảng JSON ExploreKind** (KHUYẾN NGHỊ cho fork này): `[{"title":"..","url":".."},...]`.
> Lưu ý: fork này **chuẩn hoá `&&` và xuống dòng thành khoảng trắng** khi lưu → kiểu chuỗi dễ **dính lại thành 1 tab**; dùng **mảng JSON** cho an toàn.
- **Thanh ngang phân nhóm:** thêm kind tiêu đề chiếm trọn hàng: `{"title":"☆ Thể loại ☆","url":"<url>","style":{"layout_wrapBefore":true,"layout_flexBasisPercent":1}}`. Trong `ExploreKindLayout`, `wrapBefore`/`flexBasisPercent>=1` → `span=maxSpan` → full-width. (`type:"text"` KHÔNG phải tiêu đề — nó là ô nhập.)
- Trong URL dùng `{{page}}`/`<page>` để phân trang; có thể `@js:` để tạo URL động.
### searchUrl (tab Cơ bản)
```
/search.php?q={{key}}&page={{page}}
```
- `{{key}}` = từ khoá người dùng nhập; `{{page}}` = trang. Nhiều URL tìm kiếm nối bằng `&&`.
- Có thể thêm `name::url` để chọn nguồn tìm kiếm con.

## E. header / cookie / biến
- `header` là **JSON string**: `{"User-Agent":"...","Referer":"https://...","Cookie":"a=1"}`.
- `enabledCookieJar=true` để app tự giữ cookie sau khi đăng nhập.
- `variableComment` mô tả biến; người dùng nhập giá trị trong "Đặt biến nguồn", tham chiếu bằng `{{tenBien}}`.

## F. Quy trình tạo nguồn chuẩn (từng bước)
```
1. Mở trang web truyện trên trình duyệt PC → F12 (Elements/Network).
2. bookSourceUrl = gốc domain; bookUrlPattern = regex URL 1 truyện.
3. ruleBookInfo: chọn name/author/coverUrl/tocUrl (tocUrl = link "Danh sách chương").
4. ruleToc: chapterList = node lặp; chapterName; chapterUrl = href.
5. ruleContent: content = vùng nội dung (vd @CSS:#chaptercontent); replaceRegex xoá quảng cáo.
6. ruleSearch + searchUrl: bookList = node kết quả; name; bookUrl.
7. ruleExplore + exploreUrl (tuỳ chọn).
8. Paste vào app → Debug từng target → sửa đến khi không rỗng.
```

## G. Lỗi thường gặp → cách sửa
- Info ra rỗng: selector `tocUrl` sai hoặc trang cần JS → dùng `webJs`/`init` hoặc `@js:`.
- Toc ra 1 chương: `chapterList` chọn quá hẹp → nới selector, hoặc dùng `formatJs` dựng mảng.
- Content lẫn quảng cáo: thêm `replaceRegex` = `##mẫu###`.
- 403/lỗi UA: đặt `header` User-Agent trình duyệt thật + `Referer`; bật cookie; đặt `concurrentRate`.
- Ảnh bìa 404: trang cần `Referer` cho ảnh → đặt trong `header`; hoặc `coverDecodeJs`.
- Khám phá **chỉ hiện 1 tab**: do `&&`/xuống dòng bị chuẩn hoá thành khoảng trắng → dùng **mảng JSON** `[{title,url}]`.
- Muốn **thanh ngang** chia nhóm trong Khám phá: kind tiêu đề có `style:{"layout_wrapBefore":true,"layout_flexBasisPercent":1}` (không dùng `type:"text"`).
- Nội dung kẹt (mã `10002`/treo) do web bắt chạy JS nặng → dùng **`java.evalWebView(url, js)`** (cần app có cầu nối; `@js:` Rhino sẽ treo khi eval script lớn).
