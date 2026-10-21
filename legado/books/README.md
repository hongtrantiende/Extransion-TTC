# Book sources

Mỗi file JSON là một Legado book source. Chỉ các file trong thư mục này (không tính `skipped/`) được build vào `sources.json` ở root.

## Đang dùng

| File | Tên | Nguồn |
|---|---|---|
| `ahdzxtd.json` | 华东看书 | http://www.ahdzxtd.com/ |
| `douyinxs.json` | 抖音小说 | https://m.douyinxs.com/ |
| `qidian.json` | 起点男频 | https://m.qidian.com |
| `qiyuedu8.json` | 奇·阅读 | https://novel.qiyuedu8.top |
| `xshbook.json` | 小说虎 | https://m.xshbook.com/ |

## Bỏ qua

`skipped/` chứa 2 source Sáng Tác Việt chưa publish. Không được build vào aggregate.

## Build

```bash
python3 scripts/catalog.py build
python3 scripts/catalog.py validate
```

Chi tiết: `docs/legado/books.md`.
