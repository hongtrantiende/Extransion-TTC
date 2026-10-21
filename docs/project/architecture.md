# Kiến trúc repo

## Mục tiêu

Một repo duy nhất phục vụ ba loại dữ liệu:

1. **Extension VBook/Novela** — package zip + catalog `plugin.json`.
2. **Book source Legado** — JSON trong `legado/books/`, aggregate ở `sources.json`.
3. **RSS source Legado** — JSON trong `legado/rss/`, aggregate ở `legado/rss/sources.json`.

Root vẫn giữ các entry point cũ để app, link và thói quen sử dụng không bị phá.

## Cây hiện tại

```text
Extransion-TTC/
├── plugin.json                  # catalog extension: {metadata, data[]}
├── sources.json                 # array 5 book source đang dùng
├── index.html                   # web catalog, fetch plugin.json
├── VietPhrase.txt               # dữ liệu app tải từ root
├── LacViet.txt
├── LuatNhan.txt
├── Name.txt
├── Pronouns.txt
├── PhienAm.txt
├── dict.zip
├── extensions/
│   ├── sources/                 # 4 source đang phát triển
│   │   ├── baomoi/
│   │   ├── bilibili/
│   │   ├── bilibili-cn/
│   │   └── seg18/
│   ├── zips/                    # 192 package
│   ├── icons/                   # 192 icon PNG
│   └── studio/                  # tool test/install/pack/scan/push
├── legado/
│   ├── books/
│   │   ├── ahdzxtd.json
│   │   ├── douyinxs.json
│   │   ├── qidian.json
│   │   ├── qiyuedu8.json
│   │   ├── xshbook.json
│   │   └── skipped/             # 2 sangtacviet, không vào aggregate
│   └── rss/
│       ├── baomoi.json
│       ├── truyenqq.json
│       └── sources.json
├── docs/
├── memory/
├── scripts/
│   └── catalog.py               # build/validate catalog
└── .agents/
```

## Data flow

### Extension

```text
extensions/sources/<id>/        (source, chỉ 4 ext)
        │ studio pack
        ▼
extensions/zips/<id>.zip + extensions/icons/<id>.png
        │ studio cập nhật
        ▼
plugin.json (root)
        │ app đọc raw GitHub
        ▼
VBook/Novela tải zip và cài extension
```

- App không đọc trực tiếp `extensions/sources/`.
- `plugin.json` root là **object** có `metadata` và `data`; `data` là array 192 entry.
- Mỗi entry chứa `path` (zip URL), `icon` (icon URL), `type`, `locale`, `version` và metadata hiển thị.
- 188 extension chỉ tồn tại dưới dạng zip; muốn sửa phải giải nén vào `extensions/sources/`.

### Book source

```text
legado/books/*.json             (5 file thật)
        │ python3 scripts/catalog.py build
        ▼
sources.json (root, array 5)
        │ deep link bookSource/importonline
        ▼
Legado
```

- `legado/books/skipped/` không được build vào aggregate.
- `sources.json` root là array, không phải object.

### RSS source

```text
legado/rss/{baomoi,truyenqq}.json
        │ cập nhật tay sources.json
        ▼
legado/rss/sources.json (array 2)
        │ deep link rssSource
        ▼
Legado
```

- Mỗi RSS source là một object JSON.
- Aggregate phải là array các object source, không phải array URL.

### Web catalog

```text
index.html
  fetch('plugin.json')
  render card + deep link legado://import/extension?src=...
```

- Không còn `sourcesData` hardcode.
- Phải chạy qua HTTP vì `fetch` không hoạt động ổn định với `file://`.
- Không có build step; sửa HTML là có hiệu lực ngay.

## Entry point và hợp đồng dữ liệu

| File | Kiểu | Ai đọc |
|---|---|---|
| `plugin.json` | object `{metadata, data[]}` | app, web |
| `sources.json` | array book source | app |
| `legado/rss/sources.json` | array RSS source | app |
| `index.html` | HTML tĩnh | người dùng |
| `dict.zip`, `*.txt` | dữ liệu từ điển | app |

Không đổi kiểu của các file entry point nếu không kiểm tra lại app.

## URL và cache

Raw base:

```text
https://raw.githubusercontent.com/hongtrantiende/Extransion-TTC/main
```

- `plugin.json` được app tải qua raw GitHub.
- Zip/icon đi theo URL trong `plugin.json`, hiện nằm dưới `extensions/`.
- Raw GitHub có cache CDN; sau khi push, catalog có thể cần vài phút hoặc cần refresh cache.
- URL trực tiếp kiểu cũ `main/zips/...` và `main/icons/...` đã chết; không dùng lại.

## Điểm dễ vỡ

- Đổi `plugin.json` từ object sang array sẽ làm validator và web sai.
- Xoá `zips/-1.zip` sẽ làm `m.xtyxsw.org` hỏng; file này là placeholder hợp lệ.
- Tất cả extension đều có icon PNG; web vẫn fallback khi ảnh lỗi tải.
- `legado/books/skipped/` nằm trong cây books nhưng không được build.
- `index.html` mở bằng `file://` sẽ báo lỗi tải catalog.
- `studio.js` cần `jszip`; chạy `npm ci` trong `extensions/studio/` trước khi dùng.
- `studio.js` dùng sibling `../thienthucac-apk` khi có; nếu không có, nó fallback về `extensions/sources/`.
