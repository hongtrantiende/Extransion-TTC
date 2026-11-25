# Kinh nghiệm thực chiến khi tạo nguồn Legado (case study: chuyển ext Sáng Tác Việt → nguồn Legado)

Tài liệu này ghi lại **bài học thật** lúc làm nguồn, bổ sung cho `reference.md` (tra trường/cú pháp) và `examples.md` (nguồn mẫu). Đọc khi nguồn "khó": web trả JSON lạ, chặn UA, phân trang, thể loại, hay **nội dung bị mã hoá bằng JS**.

## 1. Quy trình làm việc hiệu quả (vòng lặp test–sửa)
1. **Đảo ngược endpoint trước, viết rule sau.** Mở DevTools (F12 → Network) trên trang thật, tìm API mà chính web gọi: tìm kiếm, danh mục, chi tiết, danh sách chương, nội dung. Ghi lại URL + tham số + header cần thiết.
2. **Thử endpoint ngoài app trước** (Node/`curl`/trình duyệt) để chắc nó trả đúng dữ liệu, rồi mới bỏ vào rule. Node rất handy để kiểm nhanh nhiều tham số (vd thử `?find=` vs `?findinname=`, `&p=1` vs `&p=2`).
3. **Sửa → test qua debug app → lặp.** Đừng đoán; mỗi rule chạy qua debug cho thấy đúng phần tử nào trả rỗng.
4. **Chú ý chặn tần suất (rate limit):** gọi web quá nhiều từ PC sẽ bị chặn. Khi đó **dùng debug trên chính điện thoại** (máy có IP/UA thật) thay vì spam từ PC.

## 2. Cài & test nguồn qua Dịch vụ web (không cần thao tác trên máy)
- App chạy **HTTP ở cổng `webPort` (mặc định 1122)** và **WebSocket ở `port+1` (1123)**.
- Endpoints hữu ích:
  - `POST /saveBookSource` — body là **MỘT** BookSource JSON (upsert theo `bookSourceUrl`). `POST /saveBookSources` — mảng.
  - `GET /getBookSource?url=<bookSourceUrl>` — đọc lại 1 nguồn (để sửa vòng tròn: get → đổi field → save).
  - `GET /getBookSources` — danh sách.
- **Debug qua WebSocket** `ws://<IP>:1123/bookSourceDebug`, gửi `{"tag":"<bookSourceUrl>","key":"<...>"}`. `key` quyết định chế độ:
  - URL tuyệt đối → **Info** (kèm Toc).
  - có `::` → **Explore**.
  - `++<URL>` → **Toc**. `--<URL>` → **Content**.
  - còn lại → **Search** (theo từ khoá).
- Log debug **tiếng Việt** → ghi ra file **UTF-8** rồi đọc (console Windows hay hiện `???`).
- **Lưu ý cache:** web-service ghi thẳng DB nhưng app đang chạy **cache danh sách nguồn trong bộ nhớ** → **force-close app** để UI thấy thay đổi; còn **debug WS đọc DB trực tiếp** nên thấy ngay.
- Gỡ lỗi nhanh bằng PowerShell: giữ 1 script `ws_debug.ps1` (gửi key, nhận message tới khi CLOSE). Chạy script `.ps1` và `adb` thường cần **chạy ngoài sandbox** (Access denied trong sandbox).

## 3. Những cú pháp rule hay vấp (rút ra từ STV)
- **CSS tin hơn XPath ở đây:** `@CSS:.booksearch` ăn; XPath `contains(@class,...)` trả 0 → ưu tiên CSS theo class.
- **Từ khoá tìm kiếm phải đúng tham số web dùng.** STV: web "Tìm từ khóa" gửi `findinname=` (tìm theo TÊN); dùng `find=` (tìm rộng: tên+tác giả+tóm tắt) cho kết quả **khác web**. → `searchUrl=.../searchBooks?findinname={{key}}&p={{page}}`.
- **Phân trang:** tham số là `&p=<page>` (1-based); `&skip=` **không** đổi kết quả. Cứ bỏ `&p={{page}}` vào `searchUrl`/`exploreUrl`. Fork này **không** có field `canLoadMore` trong rule — UI tự nạp trang kế tới khi `isEnd`.
- **`exploreUrl` PHẢI dùng mảng JSON** `[{"title":"..","url":".."},...]`: app **chuẩn hoá `&&` và xuống dòng thành khoảng trắng** → nếu dùng chuỗi `Tên::URL&&Tên2::URL2` thì **dính thành 1 tab**. Mảng JSON là an toàn (code có nhánh `isJsonArray`).
- **Nhãn tab dùng ASCII (không dấu):** đẩy nhãn có dấu qua **PowerShell 5.1** (`ConvertTo-Json` + `GetBytes`) gây **mã hoá kép** (`Mới` → `MÃ¡Â»Âi`). Muốn có dấu thì sửa trực tiếp trong app.
- **`baseUrl` chứ không phải `bookUrl`** trong `ruleBookInfo` (dùng `bookUrl` → `ReferenceError`).
- **Ép `String(...)`** mọi chuỗi nối truyền vào hàm `java.*` (Rhino sinh `ConsString` → `ClassCastException` khi Java cần `String`).
- **Header `Referer` bắt buộc** với API danh sách chương của STV (thiếu → HTTP 200 nhưng body rỗng).
- **Tách chuỗi tự định nghĩa:** STV trả 1 blob; separator **trường là `-/-`, separator chương là `-//-`** (dễ nhầm `/-/`). Lọc phần tử có `split('-/-').length>=3`.
- **Tóm tắt đầy đủ** nằm ở `#book-sumary`; `og:description` chỉ là bản ngắn (dòng tag). → `intro=@CSS:#book-sumary@text`.
- **Badge trên card của web = số chương, nhưng KHÔNG định vị được bằng `nth-child`:** card STV có dòng `.info` gồm các `<span>SỐ <i class="far fa-XXX"></i></span>` — `fa-eye`=lượt đọc, `fa-thumbs-up`=lượt thích, **`fa-copyright`=số chương** (đã đối chiếu 12/12 với `sajax=getchapterlist`), `fa-bookmark`/`fa-rss`=khác. Khi truyện chưa có lượt đọc thì span `fa-eye` **được bỏ hẳn** ⇒ copyright tụt từ vị trí 3 xuống 2. Luôn chọn theo icon: `span:has(i.fa-copyright)` (kèm fallback regex trên `String(result)`), và đẩy vào `wordCount` của ruleSearch/ruleExplore vì app **không vẽ được chữ lên ảnh bìa** — chỉ hiện được như một dòng chữ của card.

## 4. Khi web khoá nội dung bằng JS obfuscate (nội dung chương)
- **Bản chất:** để đọc chương phải tính `chapterkey` bằng cách **chạy đoạn JS ~250KB của web** cần API trình duyệt (`btoa/atob`, `document`, `window`, `navigator`, `localStorage`). **Rhino của `@js:` treo** khi eval đoạn đó.
- **Đọc plugin ext để hiểu thuật toán:** file `.zip` ext có `plugin.json`; nếu `"encrypt": false` thì **mã nguồn JS đọc được** → xem `chap.js`/`gen_*.js`/`crypto.js` để biết đúng luồng (đây là cách nhanh nhất để "dịch ngược" logic). Nếu obfuscate thật sự thì **đảo ngược JS của chính website** thay vì giải mã plugin.
- **Giải pháp trong app:** dùng cầu nối **`java.evalWebView(url, js)`** (thêm trong `JsExtensions.kt`) để chạy phần `eval` nặng trong **WebView thật (Chromium)** — nhanh như Node. Đây là năng lực **chung, opt-in**: `@js:` mặc định vẫn Rhino, nguồn khác không đổi; chỉ nguồn gọi `evalWebView` mới dùng.
- **Luồng STV đã kiểm chứng (ra `code:0`):**  *(trang WebView là `/404` ~0.9KB, KHÔNG phải trang chương — xem mục 4a)*
  1. `java.get` `.../io/grantcontext/context?hostid=<host>&bookid=<bookid>` (header `x-stv-transport:app`, `x-requested-with:com.sangtacviet.mobilereader`, `Referer`, `Cookie: mac_tt=true`) → lấy **script** + cookie **`readcontextid`** (qua `g.cookies()`).
  2. `java.evalWebView(base+'/404', runScript)` với `runScript`: đặt `document.createElement=undefined`, polyfill `btoa/atob`, dựng `window.app.reader`, `eval(<script>)`, trả `'__KEY__:'+window.app.reader.chapterkey`.
  3. **Ký request:** `sign = java.md5Encode('bookid='+bookid+'&c='+cid+'&h='+host+'&key='+key+'&sajax=readchapter&<salt>')`. **Bẫy chí mạng:** chuỗi ký phải **có dấu `&` trước salt** (vì `sortQuery` sinh `...readchapter&` rồi mới nối salt). Thiếu `&` → `readchapter` báo `{"code":"1","err":"Không thể xác thực kết nối"}` dù `chapterkey` hợp lệ.
  4. `java.get` `/?sajax=readchapter&h=&bookid=&c=&key=` với header `x-stv-sign=<sign>` + `Cookie: readcontextid=<rc>;...` → `{"code":"0","data":"<html>"}` → bỏ tag + **giải mã glyph** (bảng `0xE0xx→ký tự`, tức `giaiMaChuoi`).
- **HTTP ở Rhino, eval ở WebView:** `java.get` dùng OkHttp (**không CORS**), nên gọi được cả app-host khác origin. Chỉ phần `eval` script mới cần WebView.
- **Bật/tắt Việt ↔ Trung (nguồn liên tự / interlinear):** nhiều web dịch trả mỗi từ dạng `<i ... t='chữ Hán gốc' v='hán việt' ...>tiếng Việt</i>` — **chứa CẢ hai** (text trong = Việt, `t=` = Hán). Không cần gọi lại server: chỉ cần **chọn lấy phần nào**.
- **QUAN TRỌNG — biến trong fork Novela-MD3 là MỘT ô text tự do** (màn **Đặt biến nguồn** → trường `variable`), KHÔNG phải biến có tên kiểu radio. Trong `@js:` **đọc bằng `source.getVariable()`** (nguồn được bind sẵn: `bindings["source"]`), trả chuỗi thô người dùng nhập. `variableComment` chỉ là **mô tả** hiện cạnh ô đó. Nhánh trong `ruleContent` (TRƯỚC khi strip tag):
```js
var __v = (typeof source!=='undefined' && source.getVariable) ? String(source.getVariable()).toLowerCase() : '';
if (__v.indexOf('zh')>=0) data = data.replace(/<i\b[^>]*?\bt\s*=\s*['"]([^'"]*)['"][^>]*>[\s\S]*?<\/i>/gi, '$1'); // zh: giữ t= (Hán); mặc định: giữ text trong (Việt)
```
  Người dùng chỉ cần gõ `zh` vào ô biến để xem chữ Hán gốc; để trống = tiếng Việt. Đây là **thay đổi rule thuần** (không code app, không build lại); chỉ ảnh hưởng chương có nền Hán.

### 4a. STV lỗi `10002` ("Khởi động lại ứng dụng để tự cập nhật") chập chờn — ĐÃ tìm ra gốc
- **Dấu hiệu:** `DIAG ... keylen=192` rồi server trả `{"code":"10002"}`; load lại chương thì ăn.
- **Gốc:** trước đây WebView nạp **chính trang chương** → JS của trang ALSO gọi `grantcontext` (tạo context riêng) và tự tính `chapterkey` **ghi đè** lên `window.app.reader.chapterkey`. Key của trang (dài 192) đi với `readcontextid` của ta → lệch cặp → `10002`. Key do script grantcontext tự sinh luôn dài **186/188** (kiểm chứng bằng Node: 12 lần chạy, chỉ ra 186/188).
- **Fix:** cho WebView nạp **`<base>/404`** (891B, không có script nào) → chỉ còn `eval` của ta chạy, cặp `key`+`readcontextid` luôn khớp; đồng thời nhanh hơn nhiều (không tải 90KB HTML + JS + ads của trang chương).
- **Kiểm chứng thêm bằng Node** (`/tmp/race.mjs`, `e2e.mjs`): 12/12 chương `code:0` với origin nhẹ; `key` KHÔNG phụ thuộc `location` (chỉ cần đúng origin); một context dùng được cho mọi chương của cùng sách; 6 request song song không tự gây `10002`.
- **Vì sao vẫn giữ retry 2 lần:** `grantcontext` trả script ~700KB tự sinh mỗi lần; nếu request bị rớt/HANDLE timeout thì chạy lại cả cặp là đủ rẻ (~1s), không cần 4 lần.

## 5. Checklist "nguồn khó" & lỗi thường gặp
- [ ] Đã F12 tìm đúng API + tham số (đừng đoán tên tham số).
- [ ] Test API bằng Node/PC **trước**; nếu bị chặn tần suất → test bằng debug trên máy.
- [ ] `exploreUrl` dạng **mảng JSON**, nhãn **ASCII**.
- [ ] Từ khoá đúng tham số web (`findinname` vs `find`), phân trang `&p={{page}}`.
- [ ] `String(...)` cho mọi args `java.*`; `baseUrl` (không `bookUrl`) trong Info.
- [ ] Thêm `Referer`/`X-Requested-With` nếu API đòi.
- [ ] Nội dung kẹt JS → `java.evalWebView`; **kiểm tra chuỗi ký có `&` trước salt**.
- [ ] Sau khi đẩy nguồn: **force-close app** để UI reload (debug WS thì thấy ngay).

## 6. Bài học công cụ (Windows/PowerShell/sandbox/adb)
- **PowerShell 5.1:** `SearchReplace`/editor toàn file có thể **nở `\n`** trong `strings.xml` (Android) → dùng thay thế literal. File `.ps1` **không BOM** sẽ **hiểu sai ký tự ngoài ASCII** → tạo chuỗi bằng `[char]0xNNNN` hoặc đọc từ file UTF-8.
- **Kiểm tra CJK/UTF-8:** `Get-Content` cho **kết quả âm tính giả** với tiếng Việt/trung → dùng `[IO.File]::ReadAllText(path, UTF8)`.
- **`git`/`gh`/`adb`** hay bị "Access is denied" trong sandbox → chạy với **quyền ngoài sandbox**.
- **Cài APK debug:** `adb install -r -t <apk>`; bản debug là **app riêng** (`applicationId` có hậu tố `.debug`, DB trống) → phải **đẩy trọn nguồn** vào nó, không chỉ `ruleContent`.
- **Bật Dịch vụ web không cần chạm máy:** mở app bằng `monkey -p <pkg> -c android.intent.category.LAUNCHER 1`; service tự bật khi app chạy (không `start-foreground-service` trực tiếp được vì không exported).

## 7. Khám phá nâng cao: "thanh ngang" phân nhóm + dò tham số lọc
- **Thanh ngang (group header) = 1 kind `url` CHIẾM TRỌN HÀNG**, không phải `type:"text"` (kiểu `text` ở fork này là **ô nhập liệu**, không phải tiêu đề). Cách làm (học từ nguồn sudugu): đặt `style` cho kind tiêu đề: `{"layout_wrapBefore":true,"layout_flexBasisPercent":1}`. Trong `ExploreKindLayout`, `wrapBefore` hoặc `flexBasisPercent>=1.0f` → `span = maxSpan` → mục đó sang hàng mới và trải hết chiều ngang = **thanh ngang**. Vẫn clickable (mở `url` của nó).
- **Bố cục đẹp cho tab Khám phá:** mô phỏng đúng bộ lọc của web bằng các nhóm, mỗi nhóm = 1 thanh ngang + các chip bên dưới. Ví dụ STV: `☆·.☆ Trang chủ ☆·.☆` + 8 nút sắp xếp; `☆·.☆ Trạng thái ☆·.☆` + 5 nút trạng thái; `☆·.☆ Thể loại ☆·.☆` + 50 nhãn. Trang trí tiêu đề bằng ký tự (`☆·.☆ … ☆·.☆`) cho giống banner.
- **Dò tham số lọc của web (đừng đoán):** đọc JS của trang (`/search/`…). Xem `changeQuery(e)`: mỗi nhóm có `id` (minc/category/sort/type/bookstatus/tag…) và gán vào BIẾN toàn cục; rồi xem `createquery` nối biến đó vào query bằng tham số nào. STV: `sort`→`&sort=`, `category`→`&category=`, `type`→`&type=`, `tag`→`&tag=`, và **`bookstatus` gán `bstep` → `&step=`** (Tất cả="", Còn tiếp=1, Tạm ngưng=2, Hoàn thành=3, Không tạm ngưng=5). Nút nào có `data-t="<giá trị>"` chính là giá trị truyền.
- **Card của fork render `name`, `author`, `kind` VÀ `wordCount`** (+ ảnh bìa): `intro`/`lastChapter` không thấy hiện. Hệ quả thực tế đã vấp: đặt **cả** `kind` (chip "236 chương") **lẫn** `wordCount` ("236 chương") → người dùng thấy **2 chip trùng nhau** và phải gỡ. Chỉ chọn MỘT chỗ; chip nằm trong hàng thể loại (`kind`) là chỗ chắc ăn nhất vì hàng đó đã hiển thị ổn định.
- **Ghép chip trong `kind` bằng `@js:` trả chuỗi phân tách dấu phẩy** (`"236 chương,jjwxc,Còn Tiếp,…"`) — không dùng `&&` vì `&&` là toán tử của engine, và **JS trong rule tuyệt đối không được chứa `&&`/`##`/`||` ở cấp rule**. Rule `kind` dạng JS nên có 2 đường: jsoup (`result.select(...)`, đúng phạm vi từng item) và **fallback regex trên `String(result)`** phòng khi `result` không phải jsoup object.
- **Debug WS chỉ in trường của cuốn ĐẦU TIÊN** trong danh sách (`┌获取分类` xuất hiện 1 lần dù `列表大小:48`), kèm nhãn tiếng Trung. Vì vậy: dùng debug để xem CÚ PHÁP rule có chạy không, còn **đo tỷ lệ phủ thì parse HTML thật bằng Node/curl** trên ~10 tab.
- **Số chương lấy từ badge © nhưng dữ liệu không đủ cho mọi host:** STV trả `<span>236 <i class="far fa-copyright"></i></span>`; với `qidian` (và vài `fanqie`/`faloo`) web **chính nó cũng hiện 0** ⇒ rule nên **bỏ chip khi giá trị = 0** (đừng hiển thị "0 chương"). coverage thực tế theo tab: Mới cập nhật/Lượt đọc tổng 100%, Ngôn Tình 93%, Hoàn thành 87%, Mới nhập kho 77%, Khoa Huyễn 50%, Tiên Hiệp 45%, Huyền Huyễn 35%, Đô Thị 0% (toàn qidian). Muốn đủ 100% phải xin thêm API chi tiết cho từng cuốn = 48 request/trang, không đáng.
- **Lấy DANH SÁCH tag/thể loại lớn:** web thường nạp động qua 1 file JSON (STV: `GET /searchfaceted.json` → `{host:{category:{tên:số_lượng}}}`). Gom `category` mọi host, **giữ tên có dấu cách** (đúng bộ "Nhãn dán"), sắp theo số lượng giảm dần, lấy top N. **Slug** = `slugVietnamese(tên)`: thường là lowercase + bỏ dấu + **xoá mọi ký tự không phải chữ/số** (kể cả khoảng trắng → "Đô Thị"→`dothi`). Đọc `slugVietnamese` trong JS của web để tái tạo CHÍNH XÁC, đừng tự đoán kiểu nối `-`.
- **Tạo/push bằng Node (không phải PowerShell):** toàn bộ bước nạp JSON có tiếng Việt, tính slug, dựng `exploreUrl` mảng, và `POST /saveBookSource` nên làm trong **Node** (`fetch` + `JSON.stringify` UTF-8 chuẩn). PowerShell 5.1 sẽ làm **nhập nhằng mã hoá** nhãn có dấu.
- **Chung để "hoàn mỹ":** một nguồn tốt = (1) đảo đúng API + tham số bằng cách đọc JS web; (2) Khám phá phản ánh bộ lọc web theo nhóm + thanh ngang; (3) nhãn tiếng Việt display-name qua Node; (4) phân trang `&p={{page}}`; (5) nếu chặn bằng JS nặng → `java.evalWebView` (đã merge `main`); (6) **test từng nhóm qua debug WS** trước khi chốt.

## 8. Case study `novelarchive.st` — nguồn 100% API (không đụng HTML), Cloudflare dễ ăn 403
- **403 không phải do UA:** mọi `/api/*` chỉ 200 khi gửi **`Accept-Language`** (kèm UA trình duyệt + `Accept: application/json`). Thiếu là Cloudflare chặn, kể cả curl HTTP/2 hay Playwright headless. Đặt `Accept-Language` vào **`header` của nguồn** (Legado tự gửi khi tải trang/chương) **và** trong **mọi object header của `java.get` trong rule** — rule tự gọi thì Legado không nhân `header` hộ.
- **Ưu tiên API hơn parser HTML:** `searchUrl`/khám phá = `GET /api/novels?search=&fuzzy=1&sort=&status=&genres_include=&page=&per_page=` (mọi tab trả chung `{novels:[...]}`); chi tiết = `/api/novels/<id>` (có sẵn `chapter_names[]` + `total_chapters`); chương = `/api/novels/<id>/chapters/<n>` → `{novel,chapter{number,name,content},navigation}`. Thể loại lấy từ `/api/novels/genres` (659 giá trị) — **đối chiếu `value` thật**, đừng tự đặt slug.
- **Mẹo đỡ tốn 1 request:** cho `ruleToc.chapterUrl` **trỏ thẳng API chương**. Khi đóLegado tải chính JSON về, `result` đã có dữ liệu → content rule chỉ cần parse, không `java.get` lại. Chỉ khi `result` không phải JSON mới fallback gọi API (URL dạng `reader?novel=&chapter=` vẫn chạy).
- **`indexOf('"chapter"')` để nhận JSON là BẪY:** HTML của SPA chứa chữ `"chapter"` nên tưởng đã có dữ liệu → `JSON.parse` nhận nguyên trang. Luôn kiểm tra tử tế: `String(raw).trim().charAt(0)==='{'` rồi mới `JSON.parse` trong `try/catch`, và kiểm `d.chapter` tồn tại.
- **`java.get` 2 nghĩa, phân biệt bằng SỐ THAM SỐ:** `java.get(key)` (1 arg) = cache key/value của app; `java.get(url, headers)` (2 arg) = HTTP. Cache dùng chung toàn app → **gắn id vào key** (`'na_info_'+id`) để 2 truyện không đè nhau; mỗi rule tự nạp nếu cache thiếu (tự chữa khi `init` không chạy).
- **Nội dung bẩn do trang scrape:** một số truyện bị lẫn `Settings / Font Size / … / Background Color` ở đầu và đuôi quảng cáo `✦ ✦ ✦ Want to read ahead?`, lặp tiêu đề 2 lần. Strip bằng regex **cụm cố định** (đầu: `^\s*Settings\s*\n[\s\S]{0,240}?Background Color`, đuôi: `…Want to read ahead\?[\s\S]*$`), lặp tiêu đề: `^\s*(.{6,90}?)\s+\1(?=\s|$)` — **chặn bằng regex đặc trưng**, đừng xoá bừa dòng đầu/cuối.
- **Sinh rule bằng Python:** chuỗi chứa JS phải là **raw string** (`r"""…"""`). Với `"""` thường, `\n` trong regex của JS bị Python biến thành **ký tự xuống dòng thật** → regex literal đứt giữa chừng, `new Function` báo "missing /"; `\u2726` cũng bị tiêu hoá mất.
- **Check danh sách trước khi build:** `scripts/catalog.py build` gộp **mọi** `legado/books/*.json` (kể cả file backup `.orig`/`.V1-device-backup`) → muốn giữ `sources.json` đúng 3 nguồn thì **không chạy build** hoặc chuyển backup ra chỗ khác.

## 9. Case study STV "thiếu chữ" khi chuyển sang tiếng Trung — payload có nhiều bản, phải xin đúng bản
- **Bản chất lỗi:** chương của truyện convert (fanqie/shu05/…) trả về dạng **xen kẽ từng từ**: `<i h='hán việt' t='中文' v='nghĩa việt' p='loại'>tiếng Việt</i>`. Ghép `t` lại (cách làm cũ) chỉ là **dãy từ**, không phải câu: STV thường **không có segment cho hư từ** (的/了/地) và cắt đôi cụm (`合 规 性`, `刺眼 零`, `过去 终结`) → người đọc thấy "thiếu chữ". Kiểm chứng: `h` luôn ≤ `số chữ Hán trong t` (41/561 segment t dài hơn, toàn là 的/了) ⇒ **rule không làm mất gì**, mất ở dữ liệu.
- **ĐỌC JS PHÍA WEB ĐỂ TÌM THAM SỐ ẨN (mấu chốt):** tải `/qtOnline.js` + trang reader, grep `getCookie(...)`. Kết quả: `sajax=readchapter` đổi **bản trả về** theo Cookie, không cần sign lại (sign chỉ bọc `bookid/c/h/key/sajax`):
  - Cookie thường → xen kẽ `<i h t v p>` (651 tag, 1400 Hán loãng).
  - **`transmode=chinese`** → **bản Hán gốc trọn câu** (1411 Hán, dấu ，。：？！” “, đủ hư từ) — đây là thứ người dùng muốn.
  - **`foreignlang=zh`** → bản dịch tiếng Việt **thuần**, không có tag `<i>` (hay để đọc/TTS).
  - Thêm `&sty=0`/`&convert=1` vào URL → sign sai, `code:1 "Không thể xác thực kết nối"`. **Đừng đổi query**, chỉ đổi Cookie.
- **Rule mới (chế độ zh):** gọi lại **đúng `base/key/rc` đã có** với Cookie `transmode=chinese`; chỉ nhận khi `len>50 && /[一-鿿]/.test()`; không đạt thì **fallback về ghép `t`** (giữ nguyên hành vi cũ với truyện Việt/faloo không có bản gốc). Thêm `String(res).replace(/&#(\d+);/g,…)` + `&quot;/&apos;/&nbsp;` vì STV lưu `&#34;` nguyên văn trong `t`.
- **Bài học API web của app:** `POST /saveBookSource` **không giữ** `bookSourceVariable` (và `getBookSources` cũng không trả field này) ⇒ mỗi lần push nguồn là **mất biến ngôn ngữ người dùng đang đặt**. Hệ quả: tránh bảo "nguồn hỏng" khi người dùng báo "bấm không còn chuyển ngôn ngữ được". Cách bền: **nút `loginUi` ghi cache app** (`java.put('stv_lang','zh')`) rồi rule đọc `java.get('stv_lang')` làm công tắc — cache không mất khi push nguồn, lại tiện hơn ô "biến".
- **Chữ Hán trong `v` (25/1203)** là chú thích Trung Quốc trong nghĩa Việt — **được phép mất**, đừng rước vào rule.
- **How-to đáng dùng lại:** để chứng minh rule không mất chữ, dựng bảng so `{Hán trong payload, Hán trong output, số <i>, số tag ghép được}` cho ~14 truyện × 3 chương; chỉ khi các con số khớp mà người dùng vẫn thấy thiếu → **nghi vấn dữ liệu nguồn**, đi tìm bản trả về khác thay vì sửa regex.
- **Không phải host nào cũng có bản gốc:** với `faloo` và `qidian`, `transmode=chinese` **vẫn trả payload xen kẽ** và chèn dòng `<p>Vì vấn đề nội dung, nguồn này không hỗ trợ xem văn bản gốc.</p>`. Bẫy chết người: `__z` vẫn chứa chữ Hán nên "test có Hán" chạy qua → nếu gán luôn `data=__z` thì **mất hết chữ Hán** (tag bị strip, còn lại tiếng Việt). Bắt buộc: **áp tiếp phép ghép `t` lên chính `__z`** rồi mới quyết định, và xoá dòng thông báo khỏi output. Kiểm tra `keys` của JSON: `origin` (qidian) = URL bản gốc, `via_tl` = kiểu engine, `defaultname` = bảng riêng danh=`$灵元界=Linh Nguyên giới`.
- **Comment HTML cũng chứa `<i>`:** payload có `<!-- <i h=... t=...>...</i> -->` (đoạn `ad_content`) → ghép `t` mà không xoá comment thì **rót chữ Hán phantom vào bài**. Luôn `replace(/<!--[\s\S]*?-->/g,'')` TRƯỚC khi ghép.
- **Patch rule nhiều lần = dễ gãy ngoặc:** sau mỗi lần biến đổi chuỗi rule, chạy `node --check` trên phần JS (bỏ `@js:`) — lỗi `Unexpected end of input` (thiếu `}`) mới lộ ra khi Rhino/Node parse, còn `getBookSources` thì **luôn báo save thành công** dù rule đã hỏng. Đếm ngoặc thủ công không đáng tin vì regex literal có `{`/`}`.
- **Mã host cần đăng nhập:** `jjwxc` trả `code:12 "Vui lòng đăng nhập để đọc chương Tấn Giang"` — kể cả debug WS trên máy khi chưa có phiên hợp lệ; đừng đoán rule sai khi thấy lỗi này.

### 9a. "Vẫn ra Hán ghép" trên máy dù sandbox đã đúng — gốc nằm ở COOKIE JAR, đã fix dứt điểm
- **Hai jar, một luật:** `java.get` đi qua **OkHttp + cookie jar của app** → header `Cookie:` mà rule tự đặt **không** quyết định được bản trả về (jar của app gửi cookie nó đang nhớ, `transmode=chinese` không tới server). WebView lại có **jar riêng** (đặt được bằng `document.cookie`) → là kênh duy nhất chạy được `transmode=chinese`. Nhưng jar WebView **không có `readcontextid`** → XHR vẫn 200 mà body `{"code":"10002"}`.
- **Fix:** sinh script WebView ghi **trọn bộ cặp cookie** trước khi XHR: `transmode=chinese`, `mac_tt=true`, `cookieenabled=true` và **cả `readcontextid=<rc>`** (rc lấy từ response `grantcontext`). Điều kiện tiên quyết: `Set-Cookie` của grantcontext **không HttpOnly** (của STV chỉ có `path=/`) → `document.cookie` ghi/đè được. Sign **không** đổi khi đổi cookie (sign chỉ bọc `bookid/c/h/key/sajax`) nên tính 1 lần dùng cho cả 2 đường.
- **Bẫy nối chuỗi Python→JS:** chèn `JSON.stringify(...)` vào **giữa phần tử mảng** tạo ra `['a','b','"readcontextid=XXX"']` → tên cookie thành `"readcontextid` (kèm dấu nháy), server trả kết quả sai mà không báo lỗi. Cách an toàn: để `JSON.stringify` bọc **cả chuỗi `name=value;path=/;max-age=...`** rồi phát sinh cả câu lệnh `document.cookie="…"`; hoặc tách sẵn mảng tên rồi `+ JSON.stringify(String(...))` cho phần tử động.
- **Bắt buộc validate 2 tầng trước khi push:** (1) `node --check` trên rule (bỏ `@js:`); (2) **chạy đúng câu lệnh sinh chuỗi con** trong Node, ghi chuỗi đã sinh ra file, `node --check` file đó và grep giá trị động phải chèn vào. `POST /saveBookSource` **luôn báo thành công** kể cả rule sai cú pháp → script patch phải `sys.exit(1)` khi một trong hai tầng fail, và mọi lần push tạm (diag) phải có `finally` trả lại bản sạch + so khớp byte.
- **Test chế độ trên máy khi `variable`/`stv_lang` không đặt từ xa được:** push bản diag ép `__v='zh';` (hoặc `__v='';`) ngay sau dòng đọc biến, chạy debug WS, rồi push lại bản sạch. Đây là cách duy nhất test cả 2 chế độ mà không cần chạm máy.
- **Kết quả đo trên máy (đường WebView):** `fanqie`/`shu05` → **bản Hán gốc trọn câu** (vd shu05: 2860 chữ Hán, 514 dấu ，。：？！“”); `faloo`/`qidian` → vẫn là ghép từ vì server **từ chối** trả bản gốc, nhưng **không mất Hán** nữa; `jjwxc` → cần đăng nhập.

## 10. Việt hoá một nguồn Trung Quốc (jjwxc): dịch CHỮ HIỂN THỊ, tuyệt đối không dịch DỮ LIỆU
- **Bất biến phải giữ:** mọi `https?://…`, query param, `body`, `data:…base64Encode('筛选')`, token/keyword gửi lên server. Cách chứng minh: `re.findall(r'https?://[^\s"\'`,)}\]]+')` trên **từng field** (11 field) rồi so danh sách đã sort trước/sau ⇒ phải **bằng nhau từng phần tử**. Với explore, so cả mảng `url` của 370 tab mà generator sinh ra.
- **Đừng sửa chuỗi Trung Quốc trong source — hãy dịch ở "chok point" hiển thị.** jjwxc sinh tab bằng `createFlexBox(title, url, num)` rồi `JSON.stringify(result)`: chỉ cần chèn **trước dòng `JSON.stringify(result);`** một từ điển `__K/__V` + hàm `__tt()` và `result.forEach(b => b.title = __tt(b.title))`. Được: 370/370 tab đổi tên, **URL không đổi một byte**, không đụng `tagName=["言情",…]` (tham số tìm kiếm), không đụng `M("作者列表…")` (khoá biến). Mất ~7 KB rule (20.4 KB → 27.2 KB) nhưng an toàn hơn việc sửa literal trong 20 KB JS.
- **`__tt` thay dài-trước-ngắn-sau** (`__K` sắp theo `-len`) rồi mới ghép: `古代言情连载` → `古代言情`(6) khớp trước, `连载`(2) khớp sau. Không có thứ tự này thì `古代言情` bị `言情` ăn mất thành `古代Ngôn tình`.
- **Chèn dấu cách giữa các cụm:** mỗi lần thay, bọc giá trị bằng `String.fromCharCode(1)`; chạy xong `①①→' '`, `①→''` ⇒ `🌸古代言情连载` = "Cổ đại ngôn tình Đang ra", còn `📖 作者 📖` giữ nguyên khoảng trắng cũ.
- **Đặc tả những tên KHÔNG phải cụm từ điển:** tab ngày `今  天` (2 khoảng trắng!), `前1天…前32天`. Với chúng, chuẩn hoá `s.replace(/\s+/g,'')` rồi so `=='今天'` và `/^前[0-9]+天$/` (dùng `substring(1,len-1)`, **không** dùng `$1`).
- **Khai thác rule-level token của engine:** code nối thêm **cấm** `&&`, `##`, `<` (viết `for(var i=0;__K[i];i++)` và `if(x>=0)` thay cho `i<len`); `||` thì file gốc đã có 3 chỗ và vẫn chạy ⇒ `>`/`>=` an toàn. Kiểm bằng `count()` trước/sau khi patch.
- **Phân loại literal trong `loginUrl`/`jsLib` trước khi dịch (rất dễ dịch nhầm logic):**
  - ĐƯỢC dịch: `name:"…"` của `loginUi`, text node `>…<` trong HTML trả về, tham số đầu của `toast()/longToast()`, xâu tiêu đề `java.startBrowserAwait(url,"扫码登录",…)`.
  - KHÔNG được dịch: literal trong `includes()`, `indexOf()`, `match()`, `test()`, `==/===` (so với **dữ liệu server**, vd `message==="添加收藏分类成功！"`), trong regex, trong `base64Encode()`, `setVariable()`, và marker `请勿删除此书架数据❗️…❗️` (dữ liệu kệ sách).
  - **TRƯỜNG HỢP ĐẶC BIỆT — tên ô nhập = khoá dữ liệu:** `账号/密码/验证码(…)/token登录[…]/作者列表(…)` vừa là `name` của ô nhập trong `loginUi`, vừa là khoá `M("…")/result.get("…")` trong `jsLib`+`loginUrl`+`exploreUrl` (tổng 11 chỗ). Muốn dịch thì **phải thay cả hai bên bằng đúng một xâu đã bọc nháy** (`'"账号"' → '"Tài khoản"'`), nếu dịch một bên thì ô nhập thành vô dụng. Giá trị đã lưu theo tên cũ bị mồ côi ⇒ người dùng phải nhập lại (token trong `header`/`Map("token")` là ASCII nên không ảnh hưởng).
- **Test generator ngoài máy:** dựng harness Node với stub `Map/M/source.getVariable/java.put/java.base64Encode/generateDateLinks` (hàm này nằm trong **`jsLib`** của nguồn, không có trong `exploreUrl` — thiếu stub là `ReferenceError`), chạy bản cũ + bản mới, in `title`/`url` ra file rồi diff. Đo được ngay: 370 tab, 0 CJK còn lại, URL y hệt.
- **Debug WS chỉ kiểm được URL của tab, không kiểm được generator:** key dạng `<title>::<URL>` → "开始访问发现页" (đúng), `<URL>::<title>` → hiểu nhầm thành **trang chi tiết**. Server 1122 **không** có endpoint nào trả danh mục khám phá (`/getExplore` = 404) ⇒ generator chỉ xác minh được bằng Node + `node --check`; đo trên máy bằng 3 tab thật: Ngôn tình 100 sách, Miễn phí hôm nay 144, Không CP+ 100.

## 11. Nguồn truyện TRANH (comic) — case study manga18fx (`bookSourceType=2`)
- **Có ext sẵn trong repo thì đọc ext trước** (`extensions/sources/<id>/plugin.json` + `src/*.js`): cho ngay `regexp` bookUrlPattern, selector detail/toc/chap, `type: "comic"`. **Nhưng phải kiểm lại từng selector trên HTML thật** — ext của manga18fx dùng `.page-break img` `data-src||src`, `ul.row-content-chapter li a.chapter-name` (đúng y như HTML sống) nhưng tab trang chủ của nó **không phân trang**, phải tự dò lại toàn bộ quy luật page.
- **Phân trang: mỗi loại trang một kiểu, đo bằng curl chứ đừng đoán.** `https://manga18fx.com/page/N` (trang chủ), `?page=N` cho `/hot-manga` (dạng đường dẫn `/hot-manga/2` → **404**), `/manga-genre/<slug>/N` cho thể loại (**không** có `/page/`; `/manga-genre/manhwa/1` ≡ `/manga-genre/manhwa`). Cách đo: fetch từng kiểu rồi đếm `class="page-item"` + so card đầu/cuối ⇒ trang 1 và 2 phải khác card đầu. Đưa `{{page}}` vào **đúng dạng của từng tab** trong exploreUrl.
- **Danh sách bị chèn "hot" vào cuối `listupd`** → 24 card trong khi 1 trang chỉ 20 truyện ⇒ `bookList: @CSS:.page-item:lt(20)` (jsoup hỗ trợ `:lt`). Dùng chung cho search + explore. Kiểm: debug phải in `列表大小:20`.
- **Nội dung chương tranh = HTML chuỗi `<img>`**: viết `content` bằng `@js:` trên **toàn văn HTML** (`result` là body), `while ((m = re.exec(b)) !== null) out.push('<p><img src="'+m[1]+'"></p>')` rồi `out.join('\n')`. App tự chuẩn hoá thành mỗi dòng một `<img src=…>` và reader đọc bình thường. Test offline bằng Node: nạp `chap.html`, đếm thẻ `<p><img` (28 → khớp 28 `<div class="page-break">`).
- **BẪY LỚN — `ruleToc.formatJs` KHÔNG phải bộ biến đổi danh sách.** Nó là JS **định dạng tiêu đề của TỪNG chương** (chạy N lần). Nhét code reverse `result.size()/get/set` vào đó ⇒ log debug `格式化标题出错, EvaluatorException: missing ; before statement` lặp đúng số chương, mà tên chương vẫn hiển thị nên **rất dễ tưởng không sao**.
- **Muốn đảo chiều mục lục (web liệt kê mới nhất trước) → làm ở `chapterList` bằng `java.getElements(<css>)`** (cầu nối này CÓ tồn tại trong fork): `@js:var els = java.getElements('.row-content-chapter li'); var out = []; for (var i = els.size() - 1; i >= 0; i--) { out.push(els.get(i)); } out;`. Vì `chapterName`/`chapterUrl` chạy trên từng phần tử nên chỉ cần đảo mảng phần tử là xong. Đo: cùng URL, trước = Chapter 324 ở đầu, sau = `首章信息 ◇章节名称:Chapter 1`, `列表大小:338` (không mất chương).
- **CSS selector có thuộc tính không nháy bị từ chối:** `@CSS:meta[name=description]` → debug in `Could not parse query '@CSS:meta[name=description]': unexpected token`. Đổi sang `@XPath://meta[@property='og:description']/@content` (cùng kiểu đã dùng thành công cho og:image).
- **Debug WS chỉ nhận MỘT phiên mỗi lần:** chạy 2 node client song song ⇒ phiên đang chạy nhận `java.io.InterruptedIOException: timeout` rồi `ECONNREFUSED` ở cổng 1123, số liệu sai cả hai. Luôn tuần tự, và kiểm `curl :1122/getBookSources` = 200 trước khi mở WS.
- Web này rất chậm (31–45 s/request, TLS hay chập chờn): `respondTime` 180000, và một lần timeout trong debug **không** phải lỗi rule — chạy lại.
- **Số đo chốt trên máy (192.168.5.6):** explore manhwa trang 1 & 2 = 20 sách/trang, khác nhau; search `secret class` = 2 sách (đúng, không lẫn 4 card hot); info = `Secret Class / Wang Kang Cheol / Adult,Comedy,Harem,Romance,Seinen,Slice of Life / Chapter 324 / intro 1 câu / og:image`; toc = 338 chương **tăng dần**; content chapter-1 ≈ 30 thẻ `<img>`, `正文页解析完成`, 0 lỗi JS.



## §12. Nguồn đổi tên miền — quy trình case study damconuong (.cool → .tech)

**Triệu chứng:** nguồn cũ hết chạy; `curl -I` vào domain cũ trả `301` → đọc header `location` ra domain mới. Người dùng cũng thường tự đưa domain mới (hỏi trước khi đoán).

**Quy trình đã chạy (2026-11-19):**
1. **Xác nhận redirect bằng số:** `curl -sI https://damconuong.cool/` → `301` + `location: https://damconuong.tech/`. Domain Cloudflare đôi khi TLS lỗi trong sandbox → retry loop `-4 --ciphers DEFAULT@SECLEVEL=1` + UA trình duyệt.
2. **Đo lại toàn bộ selector trên domain MỚI trước khi sửa** (search/toc/chapter page): lưu HTML mới vào /tmp, chạy lại từng regex/CSS trên HTML đó — đừng giả định "chỉ đổi domain thì rule vẫn ổn".
3. **Sơ đồ chống scrape giữ nguyên thì kiểm chứng chứ không đoán:** damconuong dùng token HMAC-SHA256(key,"tok", cipherPath) + AES-256-GCM(key,"enc"(token), AAD=cipherPath) — giải mã JS obfuscated của trang (lưu file JS, sửa string-table để chạy được trong Node) lấy lại thuật toán, xác nhận master key giống hệt trên .tech, rồi giải mã độc lập bằng Node webcrypto để có "đáp án" đối chiếu.
4. **403 từ API `_c` = thiếu cookie session + `X-Requested-With: XMLHttpRequest`**, không phải sai key: fetch trang chapter trước (cookie jar), rồi gọi API same-origin với XRW + `Accept: application/json` → 200.
5. **Patch domain có bất biến:** script thay `cool`→`tech` trên TẤT CẢ trường (kể cả regex escaped `damconuong\.cool` trong bookUrlPattern), assert `[u.replace('cool','tech') for u in before] == after`, `node --check` từng trường JS (strip `<js>`/`</js>` wrapper trước khi check).
6. **Đẩy máy + debug 4 mũi:** search/explore/info+toc/content qua WS `:1123/bookSourceDebug`, tag = domain mới. Đối chiếu content: số `<img>` từ rule == số page giải mã độc lập (117 == 117).
7. **CẢNH BÁO nhận diện nguồn:** đổi `bookSourceUrl` = nguồn MỚI hoàn toàn trong app; sách đã lưu dưới nguồn cũ thành mồ côi. Không xóa nguồn cũ trên máy khi chưa hỏi người dùng.

**Số đo chốt trên máy (192.168.5.6, tag `https://damconuong.tech/`):** search `thu ky` = 30 kết quả; explore Mới cập nhật = 30 sách; info+toc = 22 chương; content chapter-22 = 117 `<img>` khớp 117 page giải mã độc lập. Copy repo `legado/books/damconuong.json` đã patch.

## §13. Cơ chế rule của fork (Novela MD3) — đốn ngã bằng test nguồn giả trên máy

Case study mangaball.com (2026-11-19), nguồn API-JSON thuần (bookSourceType=2). Site Next.js client-render, toàn bộ dữ liệu nằm ở API `/api/v1` không cần auth:
- Tìm kiếm/khám phá: `GET /title/search-advanced?keyword=&page=&limit=&included_tags=<ObjectId tag>&adult_mode=all|only_18|no_18&sort=rating_average|latest_chapter_at&order=desc`; `included_tags` NHẬN ObjectId (lấy từ `GET /tag/get-grouped`), truyền tên tag → 0 kết quả.
- Mới cập nhật/thêm: `GET /title/recently-updated|recently-added?page=&limit=&adult_mode=`.
- Chi tiết sách: `GET /title/detail/<id>`; mục lục: `GET /title/chapter-listing?title_id=&group_by=flat&sort_order=asc&limit=1000&page=1&language=vi` (language nhận danh sách phẩy, OR giữa các ngôn ngữ; `language=all` gộp cả es/pt-br rác).
- Ảnh chapter: `GET /chapter-detail?chapter_id=<id>` → `data.chapter.pages` = mảng URL (ruleContent `$.data.chapter.pages[*]` là đủ — Legado tự bọc `<img>` cho nguồn type=2).
- Ảnh host chikorita.red-and-blue.net CHẶN thiếu Referer (trả trang lỗi Cloudflare 4KB thay vì ảnh) → header nguồn cần `Referer: https://mangaball.com/`; host imggo.net thì không cần gì đặc biệt. Một số file cũ trên imggo rỗng 0-byte (etag size 0) — lỗi dữ liệu của site, không phải rule.

**Bài học cơ chế rule — cô lập bằng nguồn test giả (tag `site/t3`, `site/t5`, `site/t6`), đừng đoán:**
1. `chapterList` dạng `<js>CODE</js>REST`: REST chạy trên NỘI DUNG GỐC của trang, JS output KHÔNG được nạp cho REST (chứng minh: JS literal trả chuỗi `<a>` hợp lệ vẫn → 0 phần tử trong 4ms; nguồn damconuong vẫn chạy vì `tag.a` trên trang gốc tình cờ ra đúng 22 anchor — JS của nó thực ra là dead code).
2. `chapterList` dạng `@js:` trả mảng JS: list chạy tốt (266 phần tử) NHƯNG field rule `@js:` trên từng phần tử chuỗi nhận `result = null` trên fork này → tránh.
3. Thiết kế ổn định cho nguồn API: **`ruleBookInfo.tocUrl` = `@js:` trả chuỗi URL** (parse id từ `result`/`baseUrl`, đếm vi vs en qua `java.ajax`, ưu tiên vi), rồi `ruleToc.chapterList = $.data[*]`, `chapterName = $.name||$.number`, `chapterUrl = ...?chapter_id={{$.id}}` — toàn primitive đã chứng minh (template `{{$.field}}` hoạt động: gongzicp dùng sẵn).
4. `bookList = $.data[*]` hoạt động bình thường; `init: $.data` trong ruleBookInfo OK.
5. bookList/kind: `$.author[*].name` join nhiều dòng, `$.tags[*].name` join phẩy — ổn.
6. Dọn nguồn test trên máy: `POST /deleteBookSources` với body `[{"bookSourceUrl":"..."}]` (mảng object, không phải mảng string); `deleteBookSource?url=` không ăn.

Số đo chốt trên máy: search `childhood` 30 kết quả; explore 18+ = 30; info+toc 266 chương (en) / vi-first cho title có vi; content chapter vi 60 ảnh, es 7 ảnh, khớp số `pages` API. Nguồn lưu `legado/books/mangaball.json`.

## §14. Ảnh URL mã hoá q5_ (XOR keystream SHA-256) — case study dualeotruyenkf.com

Case study dualeotruyenkf.com (2026-11-19), nguồn comic type=2, HTML PHP + Cloudflare. Điểm đặc biệt: URL ảnh chương bị obfuscate bằng token `q5_...`, site tự ghi chú thuật toán trong inline JS (`/tmp/dl_v5.js` là bản dump nguyên văn):

- Token: `.../uploads/<date>/q5_<base64url("V5|nonce|salt|mac|base64(cipher)")>.<ext>` — decode base64url phần filename, split `|` 5 phần.
- `OBF_SECRET = 'dualeo_url_v5_M4nP_2026_Z7cL'`; keystream = nối các block SHA-256 của `SECRET + '|STREAM|' + nonce + '|' + salt + '|' + counter` (counter từ 0) đến đủ độ dài cipher.
- `name = cipher XOR keystream` (ASCII) → URL thật = dir + name + ext. `mac` (HMAC-SHA256) chỉ để validate, bỏ qua được. Ảnh decode không cần header đặc biệt.
- Ảnh chương nằm ở 2 chỗ, phải lấy theo THỨ TỰ document: `<img data-img="URL q5">` (src = placeholder gif) và `<svg class="chapter-svg-random" data-svg-img="URL q5">`, cộng trang đầu eager-load dạng `src` trực tiếp (lọc theo host `imgdualeo1.com/upbia|uploads` để loại avatar/banner).
- Search: form đúng là `/tim-kiem?key=<kw>` (lấy từ `/js/process.js`, KHÔNG phải `?keyword=` — param sai trả về top_day tĩnh); server bỏ `&page=`, tối đa 5 kết quả.
- TOC nằm nguyên trên trang sách, MỚI NHẤT TRƯỚC → đảo bằng `chapterList = "@js:" + jsoup`:
  `var doc = Packages.org.jsoup.Jsoup.parse(String(result)); var els = doc.select('div.chapter-item'); var arr=[]; for (var i=els.size()-1;i>=0;i--) arr.push(els.get(i)); arr;` — mảng **Element Java** (không phải chuỗi) ăn được trên fork này: field rule `tag.a.0@text` chạy đúng trên từng phần tử (289 chương, phần tử đầu = Chapter 1). Đây là cách đảo TOC an toàn thay cho `<js>REST` (§13.1).
- ruleContent = `@js:` + SHA-256/basе64 **pure JS ES5** (~60 dòng, tự cài cả hai — không đụng `Packages.*` để khỏi lệ thuộc trình chạy): hoạt động y hệt khi test bằng Node (`eval(rule)` giữ completion value như Rhino). Chú ý: JS cuối hàm KHÔNG cần `return` — `@js:` của Rhino trả completion value của dòng cuối; test Node bằng `new Function` thì KHÔNG (function body không propagate completion) — harness phải bọc `eval`.
- Bẫy build script Python: `{"title": name, "url": u, **BAR}` với BAR chứa `"title": ""` làm XÓA SẠCH title mọi tab → tab trắng không tên trên app. Header nhóm tab chuẩn (theo mẫu mangaball đã chốt): `{"title": "🔥 NHÓM", "url": "", "style": {"layout_wrapBefore": true, "layout_flexBasisPercent": 1}}`, tab thường `{"title": ..., "url": ...}` không style.
- SaveBookSource: body phải là MỘT object JSON (mảng object → "Chuyển đổi nguồn thất bại" — khác với deleteBookSources cần mảng object).

Số đo chốt trên máy (192.168.5.6, tag `https://dualeotruyenkf.com/`): search `em be` = 5; explore Manhwa/Hentai/Top Ngày/Mới cập nhật = 36 sách/trang (khớp 36 card HTML); info Trai Có Lồn = tên/author MeowTime Team/23 kind/cover biatruyen + toc 289 chương (Chapter 1 đầu), em-be-va-dai-ca 57 chương; content chapter-180.1 = 25 ảnh, chapter-1 = 35 ảnh, URL decode khớp 100% chạy Node độc lập, ảnh đầu tải 200 image/webp 158–184KB. Nguồn lưu `legado/books/dualeotruyenkf.json`.

## §15. "Từ điển" của STV chạy ở trình duyệt — muốn có trong app phải tự tái hiện (V2 → V3 → V4)

- Web áp từ điển SAU khi đã có `data`: `/hanviet.js` (`hanvietdic`: 16.838 mục chữ → âm Hán Việt, 233 KB) + `/qtOnline.js` (engine: `excute()` → `replaceName()` → `replaceVietphrase()` …). `ruleContent` của app chỉ nhận `data` thô ⇒ **mọi bước web làm thêm phải tự làm lại trong rule**, không có "công tắc" phía server.
- Nguồn dữ liệu theo truyện mà rule xin được **không cần key anti-bot**: `GET /namesys.php?host=<host>&book=<bookid>` → bảng HTML, ô `<div>` chứa các dòng `$中文=Tiếng Việt`. Engine web còn hiểu `@vi=中文` (replaceByNode), `#…` (pinyin), `~…` (DSL); bản rule chỉ nhận `$`/`#` nên **bỏ qua dòng `@`** (đo thật: 1 truyện có 212 dòng `$` + 22 dòng `@`).
- Hai nguồn web dùng mà app **không bao giờ lấy được**: `defaultname` (nằm trong response `readchapter`, phải có key) và `localStorage[host+bookid]` — danh sách tên do `analyzer` tự học dần (ngưỡng ≥4 với họ ghép, ≥8 với chữ trong `surns`). Nên những tên kiểu "máy học" thì không tái hiện offline được.
- `data` có cấu trúc `<i t="中文">bản convert thô</i>` (`t` = tiếng Trung, trong = bản convert). Từ điển **phải khớp trên `t`**, cấm replace chuỗi trên text tiếng Việt (sẽ ăn substring trong từ đã Việt hoá). Thuật toán: gom node, kéo khoá dài dần tối đa 8 node, lấy khớp dài nhất, xuất value **nguyên văn** (không chỉnh hoa/thường — web đã ghi sẵn hoa trong danh sách).
- Đo 2026-11-19 (máy `28.126.238.30`): 16 truyện mới cập nhật → chỉ **2/16** có namesys (212 và 539 mục), 14 cái còn lại trả 0 byte. Kết luận quan trọng để không báo oan: "nguồn không áp từ điển" với truyện không có danh sách là **đúng theo thiết kế**, không phải lỗi.
- Vì sao bản fix (V3) mất từ điển: khi viết lại `ruleContent` để sửa "thiếu chữ tiếng Trung", người ta **quên port** 3 khối của bản cũ — namesys, xử lý `<img>` (`__stvImgTags`), và `__SEL` đa tên miền. Bài học: trước khi ghi đè một rule lớn, diff **từng field** với bản cũ và liệt kê tính năng bị mất.
- Lỗi check cực đắt: `Object.keys(new Set([...]))` luôn trả `[]` (Set không có own enumerable key) → mọi kết luận "hai bản giống nhau, không khác field" từ code kiểu này là **rỗng**. Phải dùng `[...set]`, hoặc deep-walk như `scripts/stv_field_diff.mjs`.
- Gốc của "lâu lâu 获取正文失败": vòng `for (bi…)` nằm **trong một `try` bao cả attempt**, nên base đầu tiên chết (ECONNREFUSED với `sangtacviet.com` ở mạng bloque, hoặc timeout 30s với `…182.nip.io`) là cả lượt bỏ, các base còn lại không được thử. Sửa: `try/catch` **bên trong** vòng per-base, ghi `_dbg.push(base+':'+msg)` và nối vào DIAG để lần sau đọc là biết base nào chết.
- Bản ghép V4 = nền V3 + 3 khối trên + per-base catch, 12.272 ký tự. Kiểm chứng trên máy thật: **6/6** chương chế độ Việt khớp **từng byte** với V2 (nguồn cũ có từ điển), **3/3** chương chế độ Trung khớp từng byte với V3, và khác biệt V3→V4 xuất hiện đúng tại các mục từ điển: `指挥`→sai sử, `林屿`→Lâm Tự, `苏山`→Tô Sơn, `苏峰`→Tô Phong, `苏阳`→Tô Phương, `王春桃`→Vương Xuân Đào.
- Quy trình A/B/C an toàn không đụng nguồn đang dùng: tạo nguồn tạm có `bookSourceUrl` riêng (`https://stv-merge-test.local/`), debug WS `--<URL chương>` với từng tag, so byte, rồi xoá bằng `POST /deleteBookSources` (mảng object). Debug WS chỉ chạy **tuần tự**, và nhớ `node --check` rule sau mỗi lần ghép.

## §16. Nguồn VIDEO (`bookSourceType=4`) — chốt xem site có phát được trong app KHÔNG, trước khi viết rule (case hhtq.sh)

**Vì sao phải kiểm tra trước:** app phát video bằng ExoPlayer, tức `ruleContent.content` bắt buộc phải trả về **một URL mà một trình HTTP thường (OkHttp) mở ra được media**. Site nào chặn đường đó thì mọi rule đều vô nghĩa — khác hoàn toàn nguồn chữ/tranh (chỉ cần lấy được `data`).

**Quy trình 4 bước (đã chạy thật trên hhtq.sh, 2026-11-20):**
1. **Vẽ chuỗi phát**: trang tập → endpoint player của theme → `iframe` → trang embed → file JS của embed. Halim Movies (WP): `GET /player/player.php?action=dox_ajax_player&post_id=<id>&chapter_st=<tap-N>&type=<server>&sv=<n>` trả đúng thẻ `<iframe src=…>`; `type` lấy từ `data-type` của `#halim-ajax-list-server .get-eps`. Đo: cả 8 `type` (tiktik/pro/vip4k/vip4k_v2/tiktm/pro_tm/vip4ktm/vip4ktm_v2) và `sv=2` **đều về cùng một host** `streamfree.vip/embed/v|vt/<vid>` ⇒ không có server "sạch" để lách.
2. **Đọc JS của host phát bằng deobfuscate tĩnh** (javascript-obfuscator: `a0_XXXX(h,'key')` + mảng string tự xoay): chạy riêng 2 hàm decoder trong `vm`, **quét vòng xoay bằng cách chấm điểm ASCII** (offset đúng của `app.15de130c.js` là **295**, 80/80 chuỗi hợp lệ), rồi thay textual toàn bộ 4.283 lời gọi → ra mã đọc được. Chuỗi ra quyết định: `urlvm-*`, `program-url-machine`, `wrapperURL`, `licenseUrl`, `url.streamingkeydelivery`, `#ENC-AESGCM`, `HKDF`, `capnp` ⇒ **có DRM**, không phải "chỉ giấu URL".
3. **Chạy thật bằng Chromium headless** (Playwright, bản `chrome-linux-arm64`; `executablePath` trỏ thẳng file `chrome`, vì headless-shell arm64 không tải về được). **Bắt buộc phải hoá trang**: `delete navigator.webdriver` + `no-op mọi hàm console`, nếu không trang embed rơi vào vòng lặp chống DevTools (`log → clear` vô hạn, không ever fetch playlist). Sau khi qua cửa: xem được toàn bộ request.
4. **Đo 3 câu hỏi sống còn** (kết quả trên hhtq.sh):
   - *Playlist có mã hoá không?* `GET /hls/<uuid>.m3u8?vid=&dt=&snonce=&cnonce=&hash=&uid=&ct=&fc=` trả `#EXTM3U\n#ENC-AESGCM;iv=…\n#EXT-X-B65:0-…` (66.849 byte) ⇒ **JS tự giải mã**, bản thường (53.067 byte) chỉ xuất hiện khi **video element** xin bằng `Range: bytes=0-` (native HLS).
   - *URL có dùng lại được không?* curl lại đúng URL đó: lần đầu còn trả lời (thiếu UA → `404 page not found`), lần sau **404 hết** ⇒ URL **one-shot, gắn nonce**.
   - *Media có DRM không?* bản playlist thường khai `#EXT-X-KEY:METHOD=SAMPLE-AES,KEYFORMAT="urn:uuid:2dfa3a2e-bb7a-447d-a7b1-3d15b81f5b62",KEYID=…,URI="data:text/plain;base64,VVNLRA…"` — khối `USKD` nhúng sẵn `url.streamingkeydelivery` + `xsm1`. Đây là **FairPlay-style DRM**: trình duyệt giải bằng WASM/JS, iOS xin license, **ExoPlayer không có CDM/decryptor ⇒ hết đường**.

**Kết luận cho hhtq.sh:** lớp dữ liệu thì rất dễ (WP REST `wp-json/wp/v2/posts?search=&categories=&page=` mở, `search` lọc thật; 202 tập của Phàm Nhân Tu Tiên nằm sẵn trong HTML với `data-post-id`/`data-ep`/`data-sv`), **nhưng không làm nguồn video được**. Đừng đầu tư tiếp vào việc viết lại VM: kể cả sinh đúng URL one-shot thì còn license + từng phân đoạn mang token do VM tính (`Unsupported segment URL payload`), mà app thì không chạy nổi một proxy giải mã.

**Tiêu chuẩn chọn site video cho Legado (rút ra từ ca này, làm trước khi hứa hẹn với user):** lấy 1 URL playlist nghi được, chạy `curl -A "<UA trình duyệt>" -e "<referer>"` **hai lần liên tiếp**:
- lần 1 phải trả `#EXTM3U` **không** có `#ENC-`/`#EXT-X-KEY` lạ (chỉ chấp nhận `METHOD=AES-128` chuẩn hoặc không key),
- lần 2 vẫn còn trả lời (không one-shot),
- rồi `curl` bừa 1 phân đoạn `.ts`/`.m4s` bằng đúng header đó → phải ra bytes media (`47` lặp mỗi 188 byte với TS, hoặc `ftyp/mdat` với MP4).
Đủ 3 dấu này thì ExoPlayer ăn, nguồn video mới có cửa. Thiếu 1 dấu là phải báo user ngay, đừng viết rule.

## §17. Nguồn VIDEO đầu tiên chạy được (bookSourceType=4) — case study novela.pages.dev / phimapi.com (2026-11-21)

Site là React SPA (không cào HTML); toàn bộ dữ liệu nằm ở API mở **`https://phimapi.com`** — gom được bằng cách tải bundle JS của SPA (`/assets/index-*.js`) rồi tìm `apiOrigin`. Không cần UA/cookie/Referer.

- Tìm kiếm: `GET /v1/api/tim-kiem?keyword=<kw>&page=<n>` → `data.items[*]` (24 mục/trang, `params.pagination.totalItems`).
- Danh sách: `/v1/api/danh-sach/{phim-bo|phim-le|phim-chieu-rap|hoat-hinh|tv-shows|phim-moi-cap-nhat}?page=`; thể loại `/v1/api/the-loai/<slug>?page=`; quốc gia `/v1/api/quoc-gia/<slug>?page=`; năm `/v1/api/nam/<year>?page=`. Danh sách thể loại/quốc gia: `/v1/api/the-loai`, `/v1/api/quoc-gia` (không `?page`). `sortField=view` **bị bỏ qua**, `phim-hot`/`vo-truyen` → 0 mục ⇒ chỉ tạo tab từ slug có thật.
- Chi tiết: `GET /phim/<slug>` (KHÔNG phải `/v1/api/...`) → `{movie, episodes:[{server_name, server_data:[{name, slug, filename, link_embed, link_m3u8}]}]}`. `link_m3u8` là playlist HLS **trực tiếp** → đó chính là thứ nhét vào `ruleContent.content`.
- Ảnh: `data.APP_DOMAIN_CDN_IMAGE = https://phimimg.com`; **`tim-kiem` trả URL tuyệt đối, mọi endpoint `danh-sach/the-loai/quoc-gia/nam` trả tương đối** (đo 10/10 endpoint, 24/24 mục mỗi endpoint) → `ruleSearch.coverUrl = $.poster_url||$.thumb_url`, còn `ruleExplore.coverUrl = https://phimimg.com/{{$.thumb_url}}`.

**Cổng §16 pass** (đo trước khi viết rule): `curl` master playlist 2 lần → 200, size 99 (không one-shot, không header đặc biệt); variant `3500kb/hls/index.m3u8` chỉ có `#EXT-X-KEY:METHOD=NONE`; segment `.ts` 340.844 B = 1813 gói 188 B, head `47 40 11 10`. Đo trên 2 host khác nhau (`a.kvp726.com` và `s6.kkphimplayer6.com`) để chắc không phải ăn may.

**Cơ chế rule đã chốt bằng debug trên máy (`28.71.102.53`, 4 mũi WS :1123):**
- `@js:` cho `chapterList` trả **chuỗi `JSON.stringify(array)`** → app ném `java.lang.ClassCastException: java.lang.String cannot be cast to java.util.List` tại `AnalyzeRule.getElements` (khớp cảnh báo §13.2 — lần này tái hiện chính xác, đừng dây dưa). Phải dùng JSONPath thuần.
- `chapterList: "$.episodes[*].server_data[*]"` (wildcard lồng) hoạt động: 42/42 chương cho phim 2 server, 1/1 cho phim lẻ.
- **`##` hỗ trợ backref `$1`**: `chapterName: "$.filename##^.* - ([^-]+ - [^-]+)$##$1##"` → "Vietsub - Tập 01". Lý do phải lấy từ `filename`: phần tử `server_data` KHÔNG có `server_name`, mà các server trùng tên tập (đo 1.299 tập/50 phim: 7/50 phim đa server, `link_m3u8` đủ 1299/1299, `filename` đủ 1299/1299, đuôi khớp 1.229/1.299 = 94.6%, nhãn suy ra gần như không trùng — 1/1.299). Không khớp thì rơi lại cả `filename` (dài nhất đo được 30 ký tự) nên vẫn an toàn.
- `&&` giữa 2 rule tuyệt đối trên CÙNG phần tử = **nối kết quả bằng dấu phẩy** (chứ không lồng nhau): `kind: "$.quality&&$.lang&&$.year"` → log ra `FHD,Vietsub,2023`.
- Nguồn video thì `ruleContent.content: "@js:String(baseUrl)"` là đủ: app vẫn GET playlist (~60KB) rồi trả lại đúng URL để ExoPlayer phát — debug in `获取正文内容` = URL m3u8.
- `tocUrl: "@js:String(baseUrl)"` (chỉ cần trỏ lại trang chi tiết) — `baseUrl` chứ không phải `bookUrl` (§3).

**Hai lỗi nhỏ khi đẩy nguồn:** `checkKeyWord` đặt ở gốc nguồn bị app **nuốt mất** — phải nằm trong `ruleSearch`. `respondsTime/comment/options` cũng bị bỏ; app tự thêm `customButton/eventListener/respondTime/weight`. Sau khi sửa, deep-diff repo↔device = 0 khác biệt.

**Copy-paste được:** mọi site có SPA + API JSON hở đều đi theo khuôn này: (1) tải bundle, đọc `apiOrigin`; (2) đo endpoint nào trả ảnh tương đối vs tuyệt đối; (3) chạy cổng §16 trên 2 host; (4) TOC bằng JSONPath thuần, tên chương suy từ field chuỗi nếu phần tử con thiếu ngữ cảnh cha; (5) `content` = `@js:String(baseUrl)`.

### §17.1 Mục lục CHIA KHỐI theo server (isVolume) — đo trên máy 135.62.101.85, 2026-11-21

User request: "làm thành từng danh mục, có cái vietsub có cái thuyết minh". Legado có `ruleToc.isVolume`: thêm dòng tiêu đề vào chính danh sách chương.

- **Cách trả danh sách lai (có dòng tiêu đề) mà không vỡ `ClassCastException`:** `@js:` phải trả **`java.util.List` THẬT**, dựng bằng `new Packages.java.util.ArrayList()`; mỗi phần tử là `new Packages.java.util.LinkedHashMap()` rồi `.put('name',..)`. Vì `getElements` cast sang `List<*>`, còn rule JSONPath trên từng phần tử (`$.name`, `$.link_m3u8`, `$.vol`) đọc được Map (Jayway coi Map là JSON node). Rhino của fork cho truy cập `Packages.java.util.*` bình thường (ES5-only: không arrow/`let`/template literal). Mảng JS thường hoặc chuỗi `JSON.stringify` đều KHÔNG đạt.
- **BẪY CHÍ MẠNG — app khử trùng lặp chương theo URL:** dòng tiêu đề dùng chung `link_m3u8` với tập đầu ⇒ bị loại. Bằng chứng số: 42 tập + 2 tiêu đề trùng URL → `列表大小:44` nhưng `目录总数:42` (mất đúng 2 dòng tiêu đề); khi cho 2 tiêu đề dùng chung 1 URL sentinel → `目录总数:43` (mất 1); khi mỗi tiêu đề có URL riêng → `目录总数:44` ✔. Kết luận: `列表大小` là số dòng rule trả ra, `目录总数` là số chương sau khi khử trùng theo URL — **hai số này chính là máy đo "dòng tiêu đề có sống không" mà không cần nhìn UI**.
- **Chọn URL cho dòng tiêu đề:** `URL_tập_1 + '?tap=vol' + i` — unique nên không bị khử, và nếu người dùng chạm phải vẫn phát đúng tập 1 (CDN `kkphimplayer*` bỏ qua query thừa, đã curl: `?tap=vol0` vẫn 200 size 99).
- App tự chọn chương đầu KHÔNG phải volume khi mở (debug `++URL` in `获取章节名称` = `Tập 01`, dù `首章信息` là dòng `Vietsub`) → `isVolume` được tôn trọng ở tầng dữ liệu. Còn adapter có *vẽ* dòng đó thành tiêu đề khối (đậm/không bấm được) hay vẽ như chương thường thì **chỉ nhìn trên máy mới biết** — đã hỏi user, đừng khẳng định thay.
- Bản phẳng vẫn giữ được trong generator (`FLAT=1`) và là lối lùi an toàn nếu UI không hợp khối.
