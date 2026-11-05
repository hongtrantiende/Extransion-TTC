# Book sources

Mỗi file JSON là một Legado book source. Chỉ các file trong thư mục này được build vào `sources.json` ở root.

## Đang dùng

| File | Tên | Nguồn |
|---|---|---|
| `sang-tac-viet.json` | Sáng Tác Việt | https://sangtacviet.com |

## Build

```bash
python3 scripts/catalog.py build
python3 scripts/catalog.py validate
```

Chi tiết: `docs/legado/books.md`.
