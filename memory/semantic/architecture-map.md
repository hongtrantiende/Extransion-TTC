# Repository Architecture Map

Bản đồ nhanh. Nguồn chuẩn đầy đủ: `docs/project/architecture.md`.

## Cấu trúc hiện tại

```text
Extransion-TTC/
├── plugin.json                  # {metadata, data[192]}
├── sources.json                 # array 5 book source
├── index.html                   # fetch plugin.json
├── extensions/
│   ├── sources/                 # 4 source đang phát triển
│   ├── zips/                    # 192 package
│   ├── icons/                   # 190 icon
│   └── studio/                  # tool duy nhất
├── legado/
│   ├── books/                   # 5 active + skipped/
│   └── rss/                     # baomoi + sources.json
├── docs/                        # kiến thức chuẩn
├── scripts/catalog.py           # build/validate
└── memory/                      # log lịch sử
```

## Luồng

- Extension: source → studio `pack` → `extensions/zips` + `plugin.json`.
- Book: `legado/books/*.json` → `scripts/catalog.py build` → `sources.json`.
- RSS: `legado/rss/*.json` → `legado/rss/sources.json`.
- Web: `index.html` fetch `plugin.json` → 192 card.

## Đã xoá

- `ext-novela/`, `vbook-tool/`, `sources/` mock, `scratch/`.
- `sourcesData` hardcode trong web.
- 246 mock book source.

## Cảnh báo

- `plugin.json` root là object, không phải array.
- `zips/-1.zip` là placeholder hợp lệ của `m.xtyxsw.org`.
- `uukanshu.cc`, `m.xtyxsw.org` không có icon.
- `index.html` cần HTTP server.
- Studio cần `npm ci` trước khi chạy.
