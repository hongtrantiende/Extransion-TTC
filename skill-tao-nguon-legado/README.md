# Skill tạo nguồn truyện Legado (book source)

Bộ tài liệu + công cụ + nguồn mẫu để **tạo, sửa, test nguồn truyện** cho app Legado /
Novela-MD3 / Extransion — thiết kế để một AI agent (Qoder, Claude Code, Copilot…) hoặc
người dùng đọc là làm theo được ngay.

## Cấu trúc

```
skill-tao-nguon-legado/
├── legado-source-creation/     # SKILL chính: hiểu 6 tab "Sửa nguồn sách", cú pháp rule, cách test
│   ├── SKILL.md                #   luồng dữ liệu bookUrl→tocUrl→chapterUrl→content, rule css/xpath/json/regex,
│   │                           #   ||, &&, ##, @put/get, {{js}}, java.evalWebView (engine trình duyệt)
│   ├── reference.md            #   danh mục đầy đủ trường BookSource + rule + định dạng searchUrl/exploreUrl
│   ├── examples.md             #   nguồn mẫu hoàn chỉnh + ví dụ debug từng bước
│   └── experience.md           #   kinh nghiệm thực chiến + case study Sáng Tác Việt (JS obfuscate, ext→Legado)
├── legado-source-devtools/     # SKILL quy trình: kết nối máy thật để cài/sửa/test nguồn
│   ├── SKILL.md                #   dịch vụ web (HTTP 1122 / WS 1123), saveBookSource, bookSourceDebug,
│   │                           #   adb, vòng tròn get→edit→save, lỗi mã hoá tiếng Việt
│   └── scripts/
│       ├── source_roundtrip.mjs  # Node: get → sửa field → save (giữ UTF-8 nhãn tiếng Việt)
│       └── ws_debug.ps1            # WebSocket debug nguồn, log UTF-8 ra file
└── sources/                    # Nguồn đã hoàn thiện, import dùng luôn
    ├── README.md               #   cách import / đẩy qua dịch vụ web / test
    └── sang-tac-viet.json      #   Sáng Tác Việt: search + explore 3 nhóm + toc + content (dùng java.evalWebView)
```

## Dùng với AI agent

Copy 2 thư mục skill vào thư mục skill của agent rồi gọi bằng slash command hoặc mô tả
nhiệm vụ ("tạo nguồn cho trang xyz", "push nguồn sang máy", "test nguồn bằng dịch vụ web"):

- Qoder: `.qoder/skills/` hoặc `.agents/skills/` (repo này dùng `.agents/skills/`).
- Claude Code: `.claude/skills/`.
- Repo Legado/Novela-MD3 gốc: `.agents/skills/legado-source-creation`, `.agents/skills/legado-source-devtools`.

## Dùng cho người

1. **Muốn có nguồn mới:** mở `legado-source-creation/SKILL.md` → làm theo mục "Luồng dữ liệu"
   + "Checklist test một nguồn mới", tra cú pháp ở `reference.md`.
2. **Muốn cài nguồn vào điện thoại:** bật *Dịch vụ web* trong app (Cài đặt → Dịch vụ web),
   làm theo `legado-source-devtools/SKILL.md` (POST `/saveBookSource` — nhớ chạy bằng Node,
   đừng dùng PowerShell 5.1 vì sẽ hỏng dấu tiếng Việt).
3. **Nguồn mẫu chạy ngay:** `sources/sang-tac-viet.json` — copy nội dung → app → Nguồn sách →
   "Tải nguồn từ bộ nhớ tạm". Lưu ý: phần nội dung chương dùng cầu nối `java.evalWebView`
   (chỉ có ở bản Novela-MD3 fork từ 2026-10 trở lên); bản khác sẽ chạy được search/explore
   nhưng không lấy được chương.

## Kiểm thử nguồn nhanh (tóm tắt)

| Cách | Ở đâu | Khi nào |
|---|---|---|
| Gỡ lỗi nguồn trong app | màn Sửa nguồn sách → Gỡ lỗi | từng rule, xem log từng bước |
| WebSocket debug | `ws://<IP máy>:1123/bookSourceDebug` | agent/PC điều khiển từ xa |
| Dịch vụ web | `http://<IP máy>:1122/` (SourceDebug, saveBookSource) | cài/sửa/push nguồn hàng loạt |
| Kiểm tra nguồn | danh sách Nguồn sách → Kiểm tra | sống/chết hàng loạt |
