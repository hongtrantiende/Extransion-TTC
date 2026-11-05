# Nguồn truyện đã tạo (Legado / Novela-MD3 book sources)

Thư mục lưu các **nguồn truyện** (book source JSON) mà chúng ta đã tạo/hoàn thiện, để tái sử dụng và chia sẻ. Mỗi file là một đối tượng `BookSource` JSON hợp lệ, import trực tiếp vào app (Nguồn sách → Tải từ clipboard / nhập file), hoặc đẩy qua dịch vụ web `POST /saveBookSource`.

## Danh sách
| File | Tên nguồn | Ghi chú |
|---|---|---|
| `sang-tac-viet.json` | Sáng Tác Việt | Web sangtacviet.com. Tìm kiếm (`findinname`) + Khám phá 3 thanh ngang (Trang chủ/Trạng thái/Thể loại, 66 mục) + Thông tin (tóm tắt đủ `#book-sumary`) + Mục lục (đủ chương) + **Nội dung** (dùng `java.evalWebView` để chạy grantScript lấy `chapterkey`). Cần bản app có cầu nối `java.evalWebView` (đã merge vào `main`). |

## Cách dùng
- **Import trong app:** Nguồn sách → menu → "Tải nguồn từ bộ nhớ tạm" (sau khi copy nội dung file), hoặc nhập file.
- **Đẩy qua dịch vụ web:** bật Dịch vụ web (HTTP 1122), `POST /saveBookSource` với body là JSON của MỘT nguồn.
- **Test:** debug in-app theo target, hoặc WebSocket `ws://<IP>:1123/bookSourceDebug` (`{"tag":"<bookSourceUrl>","key":"<URL/từ khoá>"}`).
