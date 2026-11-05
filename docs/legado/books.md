# Book source Legado

## Vị trí

```text
legado/books/*.json          source đang dùng
sources.json                 aggregate ở root
```

## Source đang dùng

| File | Tên | URL | Ghi chú |
|---|---|---|---|
| `sang-tac-viet.json` | Sáng Tác Việt | https://sangtacviet.com | chuyển từ extension TTCPEx/SangTacViet |

Ngày 2026-11-06: gỡ 5 source Trung Quốc và 2 bản nháp STV trong `skipped/`, thay bằng source Sáng Tác Việt chuyển từ extension.

## Hợp đồng dữ liệu

Mỗi file active là một **object** book source. Trường tối thiểu:

```json
{
  "bookSourceUrl": "https://example.com",
  "bookSourceName": "Example",
  "bookSourceGroup": "novel",
  "bookSourceType": 0,
  "enabled": true,
  "ruleSearch": {},
  "ruleToc": {},
  "ruleContent": {}
}
```

Không đổi `bookSourceUrl` của source đang dùng nếu không có lý do; Legado dùng URL làm định danh.

## Aggregate

`sources.json` root là **array** các object source active, được build từ các file active:

```bash
python3 scripts/catalog.py build
```

Script:

- Đọc `legado/books/*.json`.
- Bỏ qua `sources.json`.
- Ghi `sources.json` với indent 4, giữ tiếng Trung.

Không sửa `sources.json` bằng tay; sửa file nguồn rồi build.

## Import vào Legado

Cài tất cả:

```text
legado://import/importonline?src=https%3A%2F%2Fraw.githubusercontent.com%2Fhongtrantiende%2FExtransion-TTC%2Fmain%2Fsources.json
```

`bookSource` chỉ dùng khi cài một file đơn; aggregate dùng `importonline`.

Cài một source: dùng raw URL của file trong `legado/books/`.

## Thêm source

1. Tạo file `<id>.json` trong `legado/books/`.
2. Kiểm tra JSON hợp lệ và có ít nhất rule search/toc/content.
3. Build aggregate.
4. Validate:
   ```bash
   python3 scripts/catalog.py validate
   ```
5. Test import trên Legado; kiểm tra tìm kiếm, mục lục, chương.
6. Commit cả file nguồn và `sources.json`.

## Gỡ source

1. Xoá file khỏi `legado/books/`.
2. Build lại `sources.json`.
3. Validate.
4. Không để file mồ côi trong aggregate.

## Lỗi thường gặp

| Lỗi | Nguyên nhân |
|---|---|
| Import báo sai định dạng | `sources.json` không phải array object |
| Source không xuất hiện | File nằm trong `skipped/` hoặc chưa build |
| Tìm kiếm rỗng | Rule search sai/domain đổi |
| Mục lục rỗng | Rule toc sai hoặc site chặn |
| Chương rỗng | Rule content sai, nội dung JS/lazy |
| Trùng source | Cùng `bookSourceUrl` trong nhiều file |
