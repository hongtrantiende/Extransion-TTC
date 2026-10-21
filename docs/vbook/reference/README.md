# Tham chiếu VBook

Bốn file trong thư mục này được cứu từ `ext-novela/vbook-tool/context/` trước khi xoá tool cũ. Chúng là tài liệu tham chiếu về engine/upstream, **không phải** mô tả cấu trúc repo hiện tại.

| File | Nội dung |
|---|---|
| `runtime.md` | Runtime, API, vòng đời extension |
| `hard-sites.md` | Các site khó, WAF, cookie, selector |
| `upstream-lessons.md` | Bài học từ upstream |
| `repair.md` | Quy trình sửa extension hỏng |

## Cách đọc

- Đọc cùng `docs/vbook/extensions.md` và `docs/vbook/testing.md`.
- Đường dẫn `ext-novela/`, `vbook-tool/`, `studio/` trong các file này là đường dẫn cũ và không còn đúng; dùng `extensions/studio/` cho công cụ hiện tại.
- Nếu tài liệu tham chiếu mâu thuẫn với hành vi app hiện tại, test trên máy thật rồi cập nhật `docs/project/lessons.md`.
- Không sửa trực tiếp các file này để ghi kinh nghiệm mới; ghi vào docs chính.
