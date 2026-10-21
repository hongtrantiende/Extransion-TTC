# TTC Extension Studio

Bộ công cụ kiểm thử, đóng gói và phát hành extension VBook cho repo Extransion-TTC.

## Chuẩn bị

1. Cài dependency:
   ```bash
   cd extensions/studio
   npm install
   ```
2. Cắm điện thoại Android qua USB, bật **USB Debugging**.
3. Mở app VBook/Novela, bật **Web Server** (cổng test mặc định `1122`).

## Lệnh

Chạy từ thư mục repo:

```bash
node extensions/studio/studio.js test <ext-id>
node extensions/studio/studio.js install <ext-id>
node extensions/studio/studio.js pack <ext-id>
node extensions/studio/studio.js scan [limit]
node extensions/studio/studio.js push "[lời nhắn commit]"
```

- `test`: chạy deep test 4 bước trên máy thật (home → detail → toc → chap/track).
- `install`: cài nóng source hiện tại vào app để test UI.
- `pack`: tăng version, đóng gói vào `extensions/zips/<ext-id>.zip`, cập nhật entry đã có trong `plugin.json`.
- `scan`: quét home của toàn bộ extension trong catalog.
- `push`: `git add .`, commit và push `main` (cẩn thận: add toàn repo).

Với extension mới, `pack` không tự copy icon sang `extensions/icons/` và không tự thêm entry vào `plugin.json`; làm hai việc đó bằng tay.

## Đường dẫn

- Source extension: `extensions/sources/<ext-id>/`
- Package: `extensions/zips/<ext-id>.zip`
- Icon: `extensions/icons/<ext-id>.png`
- Catalog: `plugin.json` ở root repo
- Báo cáo scan: `extensions/studio/scan_all_report.json` (không commit)
