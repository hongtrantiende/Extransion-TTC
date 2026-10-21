# Book source Legado

## Vị trí

```text
legado/books/*.json          5 source đang dùng
legado/books/skipped/*.json  2 source chưa dùng
sources.json                 aggregate ở root
```

## Source đang dùng

| File | Tên | URL | Ghi chú |
|---|---|---|---|
| `ahdzxtd.json` | 华东看书 | http://www.ahdzxtd.com/ | nguồn Trung Quốc |
| `douyinxs.json` | 抖音小说 | https://m.douyinxs.com/ | cover lấy bằng công thức |
| `qidian.json` | 起点男频 | https://m.qidian.com | có thể cần cookie/CSRF |
| `qiyuedu8.json` | 奇·阅读 | https://novel.qiyuedu8.top | nhóm 飞卢/刺猬猫 |
| `xshbook.json` | 小说虎 | https://m.xshbook.com/ | nguồn Trung Quốc |

Các source này được giữ từ bộ cũ; trạng thái hoạt động phụ thuộc site và chưa được test lại toàn bộ trong lần tái cấu trúc ngày 2026-10-21.

## Source bỏ qua

`legado/books/skipped/`:

- `sangtacviet_legado.json` — Sáng Tác Việt Pro (Legado JSON), `https://sangtacviet.pro`
- `sang_tac_viet_pro_legado.json` — Sáng Tác Việt Pro (STV Pro Legado), `http://103.82.20.93`

Hai file này là **array 1 object**, không phải object đơn. Chưa đưa vào aggregate vì chưa kiểm chứng/chưa muốn publish.

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

`sources.json` root là **array** 5 object, được build từ các file active:

```bash
python3 scripts/catalog.py build
```

Script:

- Đọc `legado/books/*.json`.
- Bỏ qua `skipped/` và `sources.json`.
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

## Bật lại source skipped

1. Chuyển file ra khỏi `skipped/`.
2. Nếu file là array, lấy object đầu tiên hoặc đổi validator cho phù hợp; hiện validator yêu cầu object.
3. Build + validate.
4. Test trước khi commit.

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
