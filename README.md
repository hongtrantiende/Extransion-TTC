# Extransion-TTC

Kho tiện ích mở rộng cho VBook/Novela, nguồn sách Legado và nguồn RSS Legado.

Repo được chia theo ba lane riêng: **extension**, **book source**, **RSS source**. Các file entry point vẫn nằm ở root để app và các link cũ không bị phá.

## Điểm vào

| Dùng cho | URL / file |
|---|---|
| Catalog extension VBook | `plugin.json` |
| Cài tất cả book source | `sources.json` |
| Cài tất cả RSS source | `legado/rss/sources.json` |
| Web catalog | `index.html` |

Base raw:

```text
https://raw.githubusercontent.com/hongtrantiende/Extransion-TTC/main
```

## Cấu trúc

```text
Extransion-TTC/
├── plugin.json                  # catalog 193 extension
├── sources.json                 # aggregate 5 book source
├── index.html                   # web catalog
├── VietPhrase.txt ... dict.zip  # dữ liệu app tải về, giữ root
├── extensions/
│   ├── sources/                 # 5 source đang phát triển
│   ├── zips/                    # 193 package
│   ├── icons/                   # 193 icon PNG
│   └── studio/                  # test / install / pack / push
├── legado/
│   ├── books/                   # 5 book source thật
│   │   └── skipped/             # 2 sangtacviet chưa dùng
│   └── rss/                     # Báo Mới + Truyện QQ + aggregate
├── docs/                        # kiến thức dự án
├── memory/                      # log lịch sử agent
└── .agents/                     # quy tắc agent
```

## Dùng nhanh

### 1. Thêm kho extension

```text
https://raw.githubusercontent.com/hongtrantiende/Extransion-TTC/main/plugin.json
```

Hoặc mở deep link:

```text
legado://import/extensionRepo?src=https%3A%2F%2Fraw.githubusercontent.com%2Fhongtrantiende%2FExtransion-TTC%2Fmain%2Fplugin.json
```

### 2. Cài book source

```text
legado://import/importonline?src=https%3A%2F%2Fraw.githubusercontent.com%2Fhongtrantiende%2FExtransion-TTC%2Fmain%2Fsources.json
```

Aggregate book hiện có 5 source thật trong `legado/books/`. Hai source `sangtacviet` nằm trong `skipped/` và không được đưa vào aggregate.

### 3. Cài RSS source

```text
legado://import/rssSource?src=https%3A%2F%2Fraw.githubusercontent.com%2Fhongtrantiende%2FExtransion-TTC%2Fmain%2Flegado%2Frss%2Fsources.json
```

### 4. Web catalog

`index.html` đọc `plugin.json` bằng `fetch`, nên cần chạy qua HTTP:

```bash
python3 -m http.server 8000
```

Mở `http://localhost:8000/`. Mở trực tiếp bằng `file://` sẽ không tải được catalog.

## Thêm nguồn

### Extension

1. Tạo hoặc giải nén source vào `extensions/sources/<ext-id>/`.
2. Sửa `plugin.json` cục bộ trong thư mục đó.
3. Test trên máy thật:
   ```bash
   node extensions/studio/studio.js test <ext-id>
   ```
4. Đóng gói và cập nhật catalog:
   ```bash
   node extensions/studio/studio.js pack <ext-id>
   ```

Studio tạo package trong `extensions/zips/` và tăng version của entry đã có trong `plugin.json` root. Với extension mới, vẫn phải copy icon vào `extensions/icons/` và thêm entry vào `plugin.json` bằng tay.

### Book source

1. Thêm file JSON vào `legado/books/`.
2. Rebuild aggregate:
   ```bash
   python3 scripts/catalog.py build
   ```
3. Kiểm tra:
   ```bash
   python3 scripts/catalog.py validate
   ```

### RSS source

1. Thêm hoặc sửa file trong `legado/rss/`.
2. Cập nhật `legado/rss/sources.json` thành array các source muốn cài.
3. Đọc `docs/legado/rss.md` trước khi sửa rule.

## Kiểm tra

```bash
python3 scripts/catalog.py validate
node --check extensions/studio/studio.js
```

Validator kiểm tra:
- 193 entry trong `plugin.json` và file zip tương ứng.
- Icon path tồn tại (cho phép `icon: ""`).
- Book source JSON hợp lệ trong `legado/books/`.
- RSS source JSON hợp lệ trong `legado/rss/`.
- `index.html` không còn `sourcesData` hardcode.

## Ghi chú

- `zips/` và `icons/` đã chuyển vào `extensions/`; URL raw trực tiếp kiểu cũ sẽ chết. App dùng `plugin.json` nên chỉ cần refresh catalog.
- `extensions/sources/` chỉ có 5 extension đang phát triển; 188 extension còn lại tồn tại dưới dạng zip.
- Tất cả 193 extension đều có icon PNG; web vẫn giữ fallback nếu ảnh lỗi tải.
- GitHub Pages chưa bật cho repo này; web catalog cần local server hoặc host tĩnh.
- `memory/` là log lịch sử; kiến thức chuẩn nằm trong `docs/`.
