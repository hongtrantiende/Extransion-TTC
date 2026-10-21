# Test extension trên máy thật

## Chuẩn bị

1. Cài Node.js và Android platform-tools (`adb`).
2. Cài dependency studio:
   ```bash
   cd extensions/studio
   npm ci
   ```
3. Cắm điện thoại Android, bật **USB debugging**, chấp nhận RSA key.
4. Mở VBook/Novela, bật **Dịch vụ Web** (cổng `1122`).
5. Kiểm tra ADB:
   ```bash
   adb devices
   ```
6. Chạy lệnh từ root repo, không cần `cd` vào source.

## Lệnh

```bash
node extensions/studio/studio.js test <ext-id>
node extensions/studio/studio.js install <ext-id>
node extensions/studio/studio.js pack <ext-id>
node extensions/studio/studio.js scan [limit]
```

### `test`

- Chạy pipeline trên điện thoại: home → (tab/gen nếu có) → detail → toc → chap.
- Dùng ADB forward `tcp:1122`.
- Chỉ coi là đạt khi pipeline in `THÀNH CÔNG` và số liệu từng bước hợp lý.
- Extension `youtube` được bỏ qua tự động vì cần thao tác tìm kiếm trong app.

### `install`

- Đóng gói source hiện tại và cài nóng vào app để kiểm tra UI.
- Dùng khi cần xem tab, ảnh bìa, mục lục, chapter trên app thật.

### `pack`

- Tăng `metadata.version` trong `plugin.json` cục bộ lên 1.
- Cập nhật `version` trong entry khớp ở `plugin.json` root (nếu tìm thấy).
- Tạo `extensions/zips/<ext-id>.zip` gồm `plugin.json`, `icon.png`, `src/*.js`.
- **Không** tự copy icon sang `extensions/icons/` và **không** tự thêm entry mới vào catalog. Việc đó làm tay.
- **Không** pack extension có `metadata.encrypt: true`; metadata là khoá giải mã nên pack lại sẽ làm hỏng extension.

### `scan`

- Quét catalog và test nhanh từng extension.
- Báo cáo: `extensions/studio/scan_all_report.json` (đã ignore, không commit).
- Có thể giới hạn số lượng: `scan 10`.

## Quy trình đạt

1. Sửa source.
2. `test` pass trên máy thật.
3. Kiểm tra thủ công UI: home cover, detail, toc, chap, phân trang.
4. `pack`.
5. Nếu extension mới: thêm entry vào `plugin.json` root và copy icon vào `extensions/icons/`.
6. `python3 scripts/catalog.py validate`.
7. Commit.

## Kiểm tra phân trang

`nextPage` đúng chưa đủ. Phải xác nhận trang 2 có dữ liệu:

- Dùng `debug`/test riêng với `gen.js` và `page=2`.
- Kiểm tra danh sách không rỗng và URL truyện khác trang 1.
- Với site cần cookie/CSRF, test lại sau khi app đã có cookie.

## Cache Rhino

Nếu sửa JS mà app vẫn chạy code cũ:

1. Tắt/bật lại Dịch vụ Web.
2. Hoặc force-stop app rồi mở lại.
3. Cài lại extension.
4. Nếu vẫn cũ, xoá cache app.

## Lỗi thường gặp

| Lỗi | Xử lý |
|---|---|
| `Cannot find module 'jszip'` | `cd extensions/studio && npm ci` |
| ADB forward thất bại | Kiểm tra cáp, USB debugging, `adb devices` |
| Không kết nối server | Bật Dịch vụ Web trong app; kiểm tra cổng 1122 |
| Test home rỗng | Selector sai, site chặn, hoặc cần UA/cookie |
| Test pass nhưng app rỗng | `page.js` sai kiểu; thiếu `host`; cache Rhino |
| Chap chỉ vài ký tự | CLI đếm `[object Object]`; xem JSON debug thật |
| Trang 2 không tải | `nextPage` sai; API cần token/cookie |

## Lưu ý

- Không dùng `studio push` cho commit có chủ đích: lệnh đó `git add .` toàn bộ repo.
- Không commit `node_modules/`, `.env`, log hoặc `scan_all_report.json`.
- Chỉ có 4 source trong `extensions/sources/`; muốn test extension khác phải giải nén zip tương ứng vào đó trước.
