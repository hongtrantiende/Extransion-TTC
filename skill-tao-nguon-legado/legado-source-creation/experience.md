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

## 4. Khi web khoá nội dung bằng JS obfuscate (nội dung chương)
- **Bản chất:** để đọc chương phải tính `chapterkey` bằng cách **chạy đoạn JS ~250KB của web** cần API trình duyệt (`btoa/atob`, `document`, `window`, `navigator`, `localStorage`). **Rhino của `@js:` treo** khi eval đoạn đó.
- **Đọc plugin ext để hiểu thuật toán:** file `.zip` ext có `plugin.json`; nếu `"encrypt": false` thì **mã nguồn JS đọc được** → xem `chap.js`/`gen_*.js`/`crypto.js` để biết đúng luồng (đây là cách nhanh nhất để "dịch ngược" logic). Nếu obfuscate thật sự thì **đảo ngược JS của chính website** thay vì giải mã plugin.
- **Giải pháp trong app:** dùng cầu nối **`java.evalWebView(url, js)`** (thêm trong `JsExtensions.kt`) để chạy phần `eval` nặng trong **WebView thật (Chromium)** — nhanh như Node. Đây là năng lực **chung, opt-in**: `@js:` mặc định vẫn Rhino, nguồn khác không đổi; chỉ nguồn gọi `evalWebView` mới dùng.
- **Luồng STV đã kiểm chứng (ra `code:0`):**
  1. `java.get` `.../io/grantcontext/context?hostid=<host>&bookid=<bookid>` (header `x-stv-transport:app`, `x-requested-with:com.sangtacviet.mobilereader`, `Referer`, `Cookie: mac_tt=true`) → lấy **script** + cookie **`readcontextid`** (qua `g.cookies()`).
  2. `java.evalWebView(ref, runScript)` với `runScript`: đặt `document.createElement=undefined`, polyfill `btoa/atob`, dựng `window.app.reader`, `eval(<script>)`, trả `'__KEY__:'+window.app.reader.chapterkey`.
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
- **Lấy DANH SÁCH tag/thể loại lớn:** web thường nạp động qua 1 file JSON (STV: `GET /searchfaceted.json` → `{host:{category:{tên:số_lượng}}}`). Gom `category` mọi host, **giữ tên có dấu cách** (đúng bộ "Nhãn dán"), sắp theo số lượng giảm dần, lấy top N. **Slug** = `slugVietnamese(tên)`: thường là lowercase + bỏ dấu + **xoá mọi ký tự không phải chữ/số** (kể cả khoảng trắng → "Đô Thị"→`dothi`). Đọc `slugVietnamese` trong JS của web để tái tạo CHÍNH XÁC, đừng tự đoán kiểu nối `-`.
- **Tạo/push bằng Node (không phải PowerShell):** toàn bộ bước nạp JSON có tiếng Việt, tính slug, dựng `exploreUrl` mảng, và `POST /saveBookSource` nên làm trong **Node** (`fetch` + `JSON.stringify` UTF-8 chuẩn). PowerShell 5.1 sẽ làm **nhập nhằng mã hoá** nhãn có dấu.
- **Chung để "hoàn mỹ":** một nguồn tốt = (1) đảo đúng API + tham số bằng cách đọc JS web; (2) Khám phá phản ánh bộ lọc web theo nhóm + thanh ngang; (3) nhãn tiếng Việt display-name qua Node; (4) phân trang `&p={{page}}`; (5) nếu chặn bằng JS nặng → `java.evalWebView` (đã merge `main`); (6) **test từng nhóm qua debug WS** trước khi chốt.
