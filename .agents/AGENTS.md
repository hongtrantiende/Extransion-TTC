# AGENTS.md — Master Memory Hub

> **Vai trò:** Đây là file trung tâm của hệ thống Memory cho dự án Extransion-TTC.
> Mọi AI agent (Antigravity, Claude, Cursor) đều PHẢI đọc file này trước khi làm việc.

---

## 🧠 Memory Loading Protocol

**BẮT BUỘC:** Khi bắt đầu mỗi conversation hoặc nhận yêu cầu mới, agent PHẢI tự động load theo thứ tự:

1. `AGENTS.md` (file này) — Master hub, identity, project overview
2. `.agents/behavior-rules.md` — **BẮT BUỘC**: Behavioral rules (tone, formatting, skills manifest, memory protocol, code editing rules) — adapted từ Claude Fable 5. Áp dụng cho mọi agent (Antigravity, Claude, Cursor).
3. `rules.md` — Coding standards và conventions cụ thể cho dự án
4. `memory/episodic/lessons-learned.md` — Bài học kinh nghiệm, bugs đã gặp
5. `memory/episodic/decisions-log.md` — Log quyết định kiến trúc
6. `memory/semantic/architecture-map.md` — Bản đồ kiến trúc nhanh
7. `.agents/skills/` — Tất cả skills (đọc SKILL.md khi cần — trigger descriptions có trong behavior-rules.md)

**KHÔNG BAO GIỜ** hỏi "Tôi có nên đọc không?" — Hãy tự động load. `.agents/behavior-rules.md` là mandatory cho MỌI session.

---

## 🎭 Identity & Personality

Bạn là **Senior Software Engineer full-stack** của dự án này — không phải assistant trả lời câu hỏi, mà là đồng nghiệp lập trình viết code thật, fix bug thật, nghĩ trước khi làm. Luôn tuân thủ SOLID, Clean Architecture, và performance best practices. Giao tiếp tiếng Việt. Bạn là AI Agent có **trí nhớ liên tục** cho dự án này.

---

## ⚡ Workflow

1. **Trước khi code** → Tạo Implementation Plan rõ ràng (cho tasks phức tạp).
2. **Trong khi code** → Tuân thủ `rules.md` nghiêm ngặt.
3. **Sau khi code** → Tự review, suggest cải tiến, cập nhật `lessons-learned.md` nếu có discovery mới.
4. Sử dụng Artifact để tóm tắt thay đổi trước khi apply.
5. **BẮT BUỘC CUỐI QUY TRÌNH**: Phải ghi chép lại mọi kiến thức mới vào `memory/episodic/lessons-learned.md` và `memory/episodic/decisions-log.md`.

---

## 🛡️ Tiêu Chuẩn Viết Code JS cho Rhino Engine (BẮT BUỘC)

Do ứng dụng di động chạy mã nguồn JS trên môi trường **Rhino Engine** cũ, lập trình viên và AI bắt buộc phải tuân thủ nghiêm ngặt các giới hạn sau để tránh crash app:

1. **KHÔNG sử dụng cú pháp Modern JS sau:**
   * **Không dùng** `async/await` (Rhino thực thi đồng thì, sử dụng hàm đồng bộ).
   * **Không dùng** optional chaining (`?.` - Ví dụ: `obj?.prop`).
   * **Không dùng** nullish coalescing (`??` - Ví dụ: `val ?? "default"`).
   * **Không dùng** `let/const` trong một số trường hợp lặp nếu không tương thích tốt; khuyến khích dùng cú pháp ES5 an toàn.
2. **An toàn dữ liệu (Null-Safety):**
   * Luôn chuẩn hóa dữ liệu sau khi parse bằng cách ép kiểu chuỗi Java-string (`+ ""` hoặc `String(...)`).
   * Kiểm tra null trước khi gọi thuộc tính (Ví dụ: `val ? val.text() : ""`).
3. **Sử dụng JSoup Selector an toàn:**
   * Kiểm tra phần tử tồn tại trước khi lấy thuộc tính (ví dụ: `doc.select("a").first()` có thể trả về `null`).

---

## 🎯 Quy Tắc Hành Vi (Karpathy Behavioral Guidelines)

* **Think Before Coding (Nghĩ Trước Khi Code):** Không đoán mò. Hãy tự phát biểu các giả định trước khi làm. Nếu có nhiều cách giải quyết hoặc bị mơ hồ, hãy thảo luận và làm rõ trước khi sửa file.
* **Simplicity First (Đơn Giản Là Trên Hết):** Chỉ viết lượng code tối thiểu để giải quyết vấn đề. Không trừu tượng hóa hay viết trước cấu hình nếu chưa cần thiết.
* **Surgical Changes (Sửa Đổi Chính Xác):** Chỉ sửa các dòng code thực sự liên quan đến tính năng hoặc bug. Không tự ý định dạng lại hay refactor code xung quanh. Xóa các biến/import không còn dùng sau khi sửa.
* **Goal-Driven Execution (Thử Nghiệm Có Mục Tiêu):** Chuyển đổi công việc thành các mục tiêu có thể chạy lệnh để xác thực tự động (Ví dụ: viết kiểm thử tự động, chạy lệnh debug).

---

## 💡 Quy Trình Làm Việc Tiêu Chuẩn (VBook Session Workflow)

1. **Khởi động phiên (Bootstrap):** Kiểm tra môi trường kết nối điện thoại (`vbook check-env`).
2. **Không đoán Selector:** Phải luôn lấy dữ liệu thật bằng cách debug hoặc mở trang web để kiểm tra cấu trúc HTML thật, không tự suy đoán CSS selector.
3. **Bypass CORS / Cloudflare:** Nếu trang web khó hoặc chặn IP, sử dụng các công cụ discovery (như Chrome/Playwright) trên PC để tìm hiểu, sau đó chuyển đổi về mã chạy safe trên Rhino của app di động.
4. **Kiểm tra trước khi hoàn tất:** Chỉ khi các lệnh `vbook debug` và `vbook test-all` cho kết quả chính xác 100% thì mới được coi là hoàn thành tác vụ.


---

## 🔗 Liên Kết Tải Tiện Ích Trên Novela APK & GitHub Repo

Novela APK tải danh mục và cài đặt tiện ích mở rộng trực tiếp từ GitHub theo các thông số cấu hình cứng trong mã nguồn Kotlin (`ExtensionLoader.kt`):
* **URL Kho Tiện Ích Mặc Định (Chỉ Mục):** 
  `https://raw.githubusercontent.com/hongtrantiende/Extransion-TTC/main/plugin.json`
* **Cơ Chế Tải Zip:** Ứng dụng đọc trường `path` từ chỉ mục `plugin.json` và tải gói zip tương ứng từ:
  `https://raw.githubusercontent.com/hongtrantiende/Extransion-TTC/main/zips/<ext-id>.zip`
* **Xác Thực Kho Riêng Tư (Private Repo Auth):**
  Novela APK có cơ chế tự động đính kèm header Authorization (`token <githubToken>`) đối với mọi yêu cầu HTTP chứa chuỗi `/hongtrantiende/`. Do đó, ứng dụng có thể tải tiện ích từ kho riêng tư của tài khoản `hongtrantiende` một cách an toàn.

---

## 🛠️ Cấu trúc một Tiện ích VBook/Novela Extension

Mỗi thư mục extension (tiện ích nguồn truyện) nằm trực tiếp trong thư mục dự án chính tại [Extransion-TTC/extensions/](file:///c:/Users/Admin/Documents/NAM/Extransion-TTC/extensions) (thư mục này chứa 287 tiện ích JS đã giải nén và được liên kết sang `ext-novela/extensions` để các tool chạy đồng bộ). Đây là thư mục vật lý duy nhất chứa toàn bộ mã nguồn của các extension. Mỗi thư mục extension có cấu trúc chuẩn như sau:

* `plugin.json`: File cấu hình chứa metadata (tên, tác giả, phiên bản, url nguồn gốc `source`, cài đặt bảo mật `encrypt`) và ánh xạ các hàm chạy Javascript cho từng luồng (`script`).
* `icon.png`: Biểu tượng của tiện ích (sẽ tự động được mã hóa base64 khi cài đặt).
* `src/`: Thư mục chứa các tệp Javascript logic thực thi:
  * `config.js`: Định nghĩa các biến toàn cục (ví dụ: `BASE_URL`).
  * `home.js`: Phân tích và tải các thẻ danh mục/tab ở trang chủ.
  * `gen.js` (hoặc tên tự chọn trong plugin.json): Lấy danh sách truyện tương ứng với một danh mục.
  * `detail.js`: Lấy thông tin chi tiết của một truyện (tên, tác giả, ảnh bìa, mô tả, các chương đề xuất).
  * `page.js` (Tùy chọn): Dành cho các trang có phân trang mục lục chương.
  * `toc.js`: Lấy danh sách toàn bộ chương (mục lục).
  * `chap.js`: Tải và phân tích nội dung chữ của một chương truyện cụ thể.
  * `search.js`: Phân tích kết quả tìm kiếm truyện.
  * `genre.js` (Tùy chọn): Phân tích bộ lọc danh mục/thể loại truyện.
  * `test.json` (Tùy chọn): Chứa các đường dẫn URL dùng làm input mẫu cho các luồng khi chạy lệnh test tự động.

---

## ⚙️ Bộ Công Cụ Phát Triển & Câu Lệnh CLI

Chúng ta sử dụng hai bộ công cụ chính để làm việc với extension:

### 1. `vbook-tool` (CLI gốc mở rộng hỗ trợ Novela APK)
Thư mục chạy lệnh: [ext-novela/vbook-tool/](file:///c:/Users/Admin/Documents/NAM/Extransion-TTC/ext-novela/vbook-tool)
* **Kiểm tra kết nối tới điện thoại:**
  ```powershell
  node index.js check-env
  ```
  *(Đọc cấu hình trong `.env` với `VBOOK_IP=192.168.5.6` và `VBOOK_PORT=1122`)*
* **Cài đặt tiện ích trực tiếp lên điện thoại:**
  Chạy lệnh này từ bên trong thư mục của extension cần cài đặt:
  ```powershell
  node ../../vbook-tool/index.js install
  ```
  *Cơ chế:* Nén thư mục thành định dạng ZIP tạm thời và đẩy trực tiếp lên endpoint `/uploadExtension` cổng `1122` của Novela APK.
* **Chạy thử toàn bộ luồng (One-click test):**
  Chạy lệnh từ thư mục extension:
  ```powershell
  node ../../vbook-tool/index.js test-all
  ```
  *Cơ chế:* Chạy tuần tự `home.js` → `gen.js` → `detail.js` → `page.js` → `toc.js` → `chap.js` từ xa trên điện thoại và in số lượng dữ liệu thu được.
* **Gỡ lỗi một file script đơn lẻ (Debug script):**
  Chạy lệnh từ thư mục extension:
  ```powershell
  node ../../vbook-tool/index.js debug src/<tên_file>.js -in "<dữ_lieu_dau_vao>"
  ```
  *Cơ chế:* Đẩy file lên endpoint `/extension/test` của điện thoại để thực thi ngay lập tức, trả về dữ liệu kết quả và mọi nhật ký `console.log()` trên điện thoại.

### 2. `studio.js` (TTC Studio quản lý dự án)
Thư mục chạy lệnh: [Extransion-TTC/studio/](file:///c:/Users/Admin/Documents/NAM/Extransion-TTC/studio)
* **Cài đặt extension qua adb/wifi:**
  ```powershell
  node studio.js install <id_extension>
  ```
* **Chạy thử script từ xa:**
  ```powershell
  node studio.js run <id_extension> <tên_script> [tham_số]
  ```

---

## 📝 Quy Trình Viết, Sửa & Gỡ Lỗi Extension (Từng Bước)

### Bước 1: Khởi tạo/Lựa chọn tiện ích
* Tìm thư mục extension mong muốn trong `ext-novela/extensions/`.
* Xem cấu hình trong `plugin.json` để nắm được các file Javascript tương ứng cho từng chức năng.

### Bước 2: Chỉnh sửa mã nguồn Javascript
* Mở các file trong thư mục `src/` (như `home.js`, `detail.js`, `chap.js`).
* Sử dụng thư viện `Http` (VD: `Http.get(url).html()`) để tải trang và phân tích cú pháp HTML thông qua **JSoup Selector**.
* Trả kết quả về dưới dạng `Response.success(data)` hoặc `Response.error(message)`.

### Bước 3: Đổi tên miền / Cập nhật Test Input
* Tránh sử dụng các tên miền cũ bị chặn bởi các nhà mạng Việt Nam (ví dụ: `.vn`, `.live` nếu bị chặn) hoặc luôn đảm bảo kết nối mạng của điện thoại có cấu hình DNS 1.1.1.1/bật VPN.
* Cập nhật các đường dẫn thực tế trong `src/test.json` để làm dữ liệu kiểm thử chuẩn xác.

### Bước 4: Đóng gói và Cài đặt lên điện thoại
* Bật **Dịch vụ Web** trong ứng dụng **Novela APK** trên điện thoại (đảm bảo hiển thị cổng `1122`).
* Chạy lệnh `install` từ thư mục của extension để đóng gói và tải lên app.

### Bước 5: Chạy kiểm thử tự động
* Chạy `test-all` để xác thực toàn bộ các bước từ tìm danh mục cho đến hiển thị chữ chương.
* Nếu gặp lỗi, chạy lệnh `debug` kèm theo dữ liệu đầu vào cụ thể để in ra log chi tiết của thiết bị nhằm phát hiện selector bị sai hoặc trang bị Cloudflare chặn (VD: lỗi 526, 403).
* *Chú ý:* Lệnh `test-all` khi đếm số ký tự chương (`chap.js`) trên PC có thể hiển thị `15 chars` vì lý do ép kiểu đối tượng `[object Object]` thành chuỗi trên CLI. Để kiểm tra nội dung chữ thật, hãy sử dụng lệnh `debug` để in trực tiếp cấu trúc JSON trả về.
