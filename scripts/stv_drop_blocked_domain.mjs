import fs from 'fs';
const IP = '28.126.238.30:1122';
const KEEP = 'http://14.225.254.182';
const OLD = 'https://sangtacviet.com';
const src = JSON.parse(fs.readFileSync('/root/Extransion-TTC/legado/books/sang-tac-viet.json', 'utf8'));

const touched = [];
function strip(o, path) {
  for (const k of Object.keys(o)) {
    const v = o[k], p = path ? path + '.' + k : k;
    if (p === 'bookSourceUrl') continue;                 // shelf keys books by this: must stay
    if (typeof v === 'string') {
      if (v.includes(OLD)) { o[k] = v.split(OLD).join(KEEP); touched.push(p); }
    } else if (v && typeof v === 'object') strip(v, p);
  }
  return touched;
}
strip(src, '');

/* loginUi: one domain option only */
const ui = JSON.parse(src.loginUi);
ui[0].chars = [KEEP];
ui[0].default = KEEP;
ui[0].viewName = "'Tên miền'";
src.loginUi = JSON.stringify(ui);

/* ruleContent: BASES without the blocked domain and without the slow nip.io */
let c = src.ruleContent.content;
const basesRe = /var BASES=\[[^\]]*\];/;
if (!basesRe.test(c)) throw 'BASES line not found';
c = c.replace(basesRe, "var BASES=[__SEL,'" + KEEP + "','https://dns1.stv-appdomain-00000001.org'];");
if (c.includes('nip.io')) throw 'nip.io still present';
/* relative <img> must follow the base that actually answered, not a hardcoded domain */
const imgOld = "__u='" + KEEP + "/'+__u.replace";
if (!c.includes(imgOld)) throw 'img fallback anchor not found: ' + JSON.stringify(c.substr(c.indexOf('__u=') - 60, 160));
c = c.replace(imgOld, "__u=String(base)+'/'+__u.replace");
src.ruleContent.content = c;

/* comment prose */
src.bookSourceComment = 'Sáng Tác Việt V4.1 (từ điển + tiếng Trung trọn vẹn, BỎ tên miền sangtacviet.com).\n'
  + 'Lý do bỏ: trên mạng của máy đo 2026-11-19, sangtacviet.com phân giải về 127.0.0.1 -> ConnectException ở bước app tự tải trang chương (chết TRƯỚC khi rule chạy), '
  + 'nên mọi URL truyện còn mang miền đó đều không đọc được. Miền dùng: ' + KEEP + ' (2,1s/chương).\n'
  + 'Đổi tên miền: mở "Đăng nhập" của nguồn -> chọn "Tên miền".\n'
  + 'Từ điển: /namesys.php?host=&book= (dòng $中文=Tiếng Việt) áp lên node <i t="中文">; chỉ truyện có danh sách mới thấy khác (đo: 2/16 truyện, 212–539 mục).\n'
  + 'Sách cũ trên kệ mang URL sangtacviet.com vẫn chết — mở lại từ Tìm kiếm/Khám phá để lấy URL miền mới.';
src.lastUpdateTime = Date.now();

JSON.parse(JSON.stringify(src));
const res = fs.readFileSync('/tmp/stv_merged_rule.js', 'utf8');
console.log('field đã改写 miền:', touched.join(', '));
console.log('số lần "sangtacviet.com" còn lại (chỉ được là bookSourceUrl + prose):',
  JSON.stringify(src).split('sangtacviet.com').length - 1, '| trong ruleContent:', c.split('sangtacviet.com').length - 1);
console.log('BASES:', basesRe.exec(c)[0]);
console.log('__SEL:', /var __SEL=[^;]*;/.exec(c)[0]);
fs.writeFileSync('/tmp/stv_v41.json', JSON.stringify(src, null, 2) + '\n');
fs.writeFileSync('/tmp/stv_v41_rule.js', c);
const r = await fetch('http://' + IP + '/saveBookSource', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(src) });
console.log('POST /saveBookSource ->', r.status, (await r.text()).slice(0, 50));
const now = (await (await fetch('http://' + IP + '/getBookSources')).json()).data.find(x => x.bookSourceUrl === OLD);
console.log('trên máy:', now.bookSourceName, '| content len', now.ruleContent.content.length, '| khớp bản gửi:', now.ruleContent.content === c);
console.log('còn miền cũ trong các field gọi server:', ['searchUrl', 'exploreUrl', 'header'].map(k => k + '=' + (now[k].includes(OLD) ? 'CÒN' : 'sạch')).join(', '));
fs.writeFileSync('/root/Extransion-TTC/legado/books/sang-tac-viet.json', JSON.stringify(now, null, 2) + '\n');
fs.writeFileSync('/root/Extransion-TTC/skill-tao-nguon-legado/sources/sang-tac-viet.json', JSON.stringify(now, null, 2) + '\n');
const agg = JSON.parse(fs.readFileSync('/root/Extransion-TTC/sources.json', 'utf8'));
agg[agg.findIndex(x => x.bookSourceUrl === OLD)] = now;
fs.writeFileSync('/root/Extransion-TTC/sources.json', JSON.stringify(agg, null, 4) + '\n');
console.log('đã cập nhật repo + sources.json');
