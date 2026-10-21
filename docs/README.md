# Tài liệu dự án

Đây là nguồn kiến thức chuẩn của Extransion-TTC. `memory/` chỉ còn là log lịch sử; khi tài liệu và memory lệch nhau, tài liệu trong `docs/` thắng.

## Đọc theo việc đang làm

| Việc | Đọc |
|---|---|
| Hiểu repo, entry point, data flow | `project/architecture.md` |
| Tiếp tục công việc sau nhiều phiên | `project/decisions.md`, `project/lessons.md` |
| Viết/sửa extension VBook | `vbook/extensions.md` |
| Test extension trên máy thật | `vbook/testing.md` |
| Sửa book source Legado | `legado/books.md` |
| Sửa RSS source Legado | `legado/rss.md` |
| Tra cứu sâu về engine / trang khó | `vbook/reference/` |

## Nguyên tắc tài liệu

- Một chủ đề một file; không copy nguyên playbook dài vào nhiều nơi.
- Đường dẫn trong docs phải là đường dẫn hiện tại của repo.
- Kinh nghiệm mới ghi vào `project/lessons.md`; quyết định kiến trúc ghi vào `project/decisions.md`.
- Log phiên làm việc vẫn nằm trong `memory/episodic/`, nhưng không dùng làm nguồn chuẩn.
- Không ghi token, khóa API, `.env` hoặc IP riêng của máy vào docs.

## Cây tài liệu

```text
docs/
├── project/
│   ├── architecture.md
│   ├── decisions.md
│   └── lessons.md
├── vbook/
│   ├── extensions.md
│   ├── testing.md
│   └── reference/
│       ├── README.md
│       ├── runtime.md
│       ├── hard-sites.md
│       ├── upstream-lessons.md
│       └── repair.md
└── legado/
    ├── books.md
    └── rss.md
```
