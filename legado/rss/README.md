# RSS sources

Mỗi file JSON (trừ `sources.json`) là một Legado RSS source. `sources.json` là aggregate để cài tất cả.

## Đang dùng

| File | Tên | Nguồn |
|---|---|---|
| `baomoi.json` | Báo Mới | https://baomoi.com |
| `truyenqq.json` | Truyện QQ | https://truyenqqko.com |

## Quy tắc

- `ruleDescription` phải để rỗng nếu muốn dùng `ruleContent`.
- Rule mặc định là JSoup, dùng `@`.
- `ruleContent` có thể là `@js:`.
- Source Báo Mới cần desktop UA và parse `__NEXT_DATA__`.
- Source Truyện QQ đọc list chapter mới và parse ảnh `img.lazy` trong content.

## Kiểm tra

```bash
python3 scripts/catalog.py validate
```

Chi tiết: `docs/legado/rss.md`.
