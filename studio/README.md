# TTC Extension Studio 📱🛠

Bộ công cụ tối ưu hóa quy trình phát triển, kiểm thử thực tế và phân phối các tiện ích mở rộng (VBook Extensions) cho ứng dụng **Novel Reader**.

## Giới thiệu
Bộ công cụ này giao tiếp trực tiếp với thiết bị Android (qua cáp USB & cổng ADB) và ứng dụng **Novel Reader** trên máy để chạy kiểm thử code thực tế trên môi trường thật, loại bỏ hoàn toàn các lỗi sai khác về DNS, mạng di động hoặc các lớp bảo mật nâng cao (như Cloudflare) vốn khó kiểm thử giả lập trên PC.

## Chuẩn bị
1. Cài đặt các gói phụ thuộc (chỉ cần chạy một lần):
   ```bash
   npm install
   ```
2. Cắm điện thoại Android vào PC qua cáp USB và đảm bảo đã kích hoạt **USB Debugging** (Gỡ lỗi USB) trong cài đặt Nhà phát triển.
3. Mở ứng dụng **Novel Reader** trên điện thoại, đi tới **Cài đặt** -> bật **Bắt đầu máy chủ test** (hoặc **Developer Mode**).

## Lệnh sử dụng

### 1. Kiểm thử sâu 4 bước trên điện thoại (`test`)
```bash
node studio.js test <ext-id>
```
*Ví dụ*: `node studio.js test anime-hay`
Chạy tuần tự: Trang chủ -> Chi tiết -> Mục lục -> Nội dung chương/phim và in log chi tiết.

### 2. Cài đặt nóng tiện ích vào ứng dụng (`install`)
```bash
node studio.js install <ext-id>
```
*Ví dụ*: `node studio.js install anime-hay`
Cài nhanh code hiện tại của bạn vào bộ nhớ đệm trên app điện thoại để test giao diện trực quan.

### 3. Đóng gói & Nâng phiên bản tự động (`pack`)
```bash
node studio.js pack <ext-id>
```
*Ví dụ*: `node studio.js pack anime-hay`
Tự động tăng phiên bản (+1) và nén zip lưu vào `zips/<ext-id>.zip`.

### 4. Đẩy bản vá lên GitHub (`push`)
```bash
node studio.js push "[lời nhắn commit]"
```
*Ví dụ*: `node studio.js push "Vá lỗi Anime Hay"`
Đẩy toàn bộ thay đổi (bao gồm cả mã nguồn công cụ và các tiện ích đóng gói mới) lên GitHub.

### 5. Dò quét lỗi hàng loạt (`scan`)
```bash
node studio.js scan [limit]
```
*Ví dụ*: `node studio.js scan`
Kiểm tra nhanh trang chủ của toàn bộ tiện ích trong catalog để phát hiện các nguồn lỗi/đổi miền.
