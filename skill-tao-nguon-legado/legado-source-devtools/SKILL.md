---
name: legado-source-devtools
description: Quy trình ket noi dien thoai - dich vu web - adb de CAI, SUA, TEST nguon truyen Legado/Novela-MD3 tren may that. Gom bat/kiem tra Dich vu web (HTTP 1122 / WebSocket 1123), day nguon qua POST /saveBookSource, doc lai GET /getBookSource, sua vong tron get->edit->save, go loi qua WebSocket /bookSourceDebug (key: URL tuyet doi->Info, chua '::'->Explore, '++URL'->Toc, '--URL'->Content, con lai->Search), force-close app de reload cache, dung Node cho UTF-8 tieng Viet, adb install ban debug. Dung khi nguoi dung noi: ket noi may, cai nguon, sua nguon, push nguon, test/debug nguon, saveBookSource, bookSourceDebug, dich vu web, IP LAN, "nguon khong hien", "day nguon qua may".
---

# Kết nối & làm việc với nguồn Legado trên máy thật (devtools)

Skill này covers **công cụ + quy trình** (kết nối, cài, sửa, test) cho nguồn truyện trên app Legado/Novela-MD3 chạy ở điện thoại. Viết **rule** nguồn thì xem skill `legado-source-creation`.

## Bước 0 — QUAN TRỌNG NHẤT: thiết lập kết nối trước khi làm gì
Mọi thao tác cài/sửa/test đều đi qua **dịch vụ web của app trên máy**. Nếu chưa thông được cổng này thì đừng làm tiếp.
1. Xác định **IP LAN của máy** (vd `192.168.5.23`) — máy và PC phải cùng mạng WiFi.
2. **Bật Dịch vụ web** trong app: `Cài đặt → Dịch vụ web → Bật` (giữ màn hình bật). App chạy **HTTP ở `webPort` (mặc định 1122)** và **WebSocket ở `webPort+1` (1123)**.
3. **Kiểm tra thông:** mở `http://<IP>:1122/getBookSources` trên PC → thấy JSON (kể cả rỗng `源列表为空`) là OK. `Unable to connect` = service chưa bật/app bị tắt/màn hình tắt/sai IP.
4. Bật service **không cần chạm máy** (khi app bị đóng): mở app bằng adb rồi service tự chạy:
   `adb shell monkey -p <applicationId> -c android.intent.category.LAUNCHER 1`
   (không `start-foreground-service` trực tiếp được vì `WebService` không exported).

### adb (khi cần cài APK / mở app)
- Đường dẫn: `%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe`.
- `adb devices` rỗng → máy chưa kết nối. USB: cắm cáp + bật **Gỡ lỗi USB**. Không dây: `adb connect <IP>:<port>` (cần bật Gỡ lỗi qua Wi-Fi, port đổi mỗi lần).
- Cài: `adb install -r -t <apk>`. **Bản debug là app RIÊNG** (`applicationId` hậu tố `.debug`, DB trống) → phải **đẩy trọn nguồn** vào nó, không chỉ 1 field.
- `git`/`gh`/`adb` hay "Access is denied" trong sandbox → **chạy ngoài sandbox**.

## Cài / đẩy nguồn (push)
- `POST /saveBookSource` — body = **MỘT** BookSource JSON (upsert theo `bookSourceUrl`). `POST /saveBookSources` — mảng.
- `GET /getBookSource?url=<bookSourceUrl>` — đọc 1 nguồn. `GET /getBookSources` — danh sách.
- **Vòng tròn sửa an toàn (giữ nguyên các rule khác):** get → đổi vài field → save. Mẫu Node: **[scripts/source_roundtrip.mjs](scripts/source_roundtrip.mjs)**.
- **Bắt buộc dùng Node (không PowerShell 5.1) khi nguồn có nhãn tiếng Việt:** PowerShell `ConvertTo-Json` + `GetBytes` gây **mã hoá kép** (`Mới`→`MÃ¡Â»Âi`). Node `fetch` + `JSON.stringify` giữ UTF-8 đúng.
- **Ép kiểu khi build object:** nguồn lấy về là PSCustomObject; khi sửa bằng PS phải chuyển `PSObject.Properties` sang hashtable rồi `ConvertTo-Json -Depth 30`. Nhưng tốt nhất là làm trong Node.

## Sửa nguồn (edit)
- **Ưu tiên sửa trực tiếp trong app** (màn **Sửa nguồn sách**, 6 tab) với nhãn có dấu — app xử lý UTF-8 đúng.
- Hoặc get→edit→save qua dịch vụ web (dùng Node).
- Sau khi web-service ghi DB: **app đang cache danh sách nguồn trong bộ nhớ** → **force-close app** (vuốt tắt) rồi mở lại để UI thấy thay đổi. **Debug WS đọc DB trực tiếp** nên thấy ngay không cần mở lại.

## Test nguồn (debug)
- **WebSocket** `ws://<IP>:1123/bookSourceDebug`, gửi `{"tag":"<bookSourceUrl>","key":"<...>"}`. `key` quyết định target:
  - URL tuyệt đối (bắt đầu `http`) → **Info** (kèm Toc).
  - chứa `::` → **Explore** (`Nhãn::URL`).
  - `++<URL>` → **Toc**. `--<URL>` → **Content**.
  - còn lại → **Search** (theo từ khoá).
- Helper: **[scripts/ws_debug.ps1](scripts/ws_debug.ps1)** — `powershell -File ws_debug.ps1 -key '<...>'`, log ra `_wslog.txt` (UTF-8) rồi **đọc bằng Read tool** (console Windows hiện `???`/mojibake).
- **Debug in-app:** nút **Gỡ lỗi nguồn** trong màn Sửa nguồn, chọn target + nhập URL/từ khoá.
- **PC bị chặn tần suất** (~15 request) → ưu tiên test bằng debug trên máy (IP/UA thật).
- Checklist: Info ra `name/author/coverUrl/tocUrl` đủ → Toc ra chương → Content ra chữ → Search/Explore ra danh sách → cuộn phân trang.

## Lỗi kết nối thường gặp
- `Unable to connect` tới `:1122`: service tắt / màn hình tắt / sai IP / khác mạng → bật lại + giữ màn hình + kiểm `ipconfig`/IP máy.
- Đẩy xong app **không hiện** nguồn/tab mới: **force-close** app (cache bộ nhớ).
- `saveBookSource` trả `isSuccess:false`: body sai JSON (thiếu `bookSourceUrl`, escape lộn) → validate bằng Node `JSON.parse` trước khi gửi.
- Nhãn **dấu bị lỗi**: do push qua PowerShell → push lại bằng Node, hoặc sửa trong app.

## Tài liệu liên quan
- Viết rule nguồn + cú pháp + case study: skill **`legado-source-creation`** (`SKILL.md`/`reference.md`/`examples.md`/`experience.md`).
- Nguồn đã lưu để import: **`.qoder/sources/`**.
