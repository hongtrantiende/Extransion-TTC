import fs from 'fs';
const IP = '28.126.238.30:1122';
const base = JSON.parse(fs.readFileSync('/root/Extransion-TTC/legado/books/sang-tac-viet.V3-device-backup.json', 'utf8'));
const merged = fs.readFileSync('/tmp/stv_merged_rule.js', 'utf8');

const final = JSON.parse(JSON.stringify(base));
final.bookSourceName = 'Sáng Tác Việt V4';
final.ruleContent.content = merged;
final.bookSourceComment = String(final.bookSourceComment || '')
  .replace(/^Sáng Tác Việt[^\n]*/, 'Sáng Tác Việt V4 (đa tên miền + từ điển + tiếng Trung trọn vẹn).')
  + '\nTừ điển: /namesys.php?host=&book= (danh sách $中文=Tiếng Việt cộng đồng tải lên) áp lên node <i t="中文">. '
  + 'Chỉ truyện nào có danh sách mới thấy khác; kiểm chứng 2026-11-19: 2/16 truyện đầu bảng có, truyện có 212-539 mục.'
  + '\nBASES thử lần lượt và lỗi từng base được bắt riêng, nên một tên miền chết không làm hỏng cả lượt.';
final.lastUpdateTime = Date.now();
if (final.variable) console.log('!! nguồn có biến đã lưu:', JSON.stringify(final.variable).slice(0, 120));

JSON.parse(JSON.stringify(final));
const before = (await (await fetch('http://' + IP + '/getBookSources')).json()).data;
const cur = before.find(x => x.bookSourceUrl === 'https://sangtacviet.com');
console.log('nguồn hiện trên máy:', cur.bookSourceName, '| content len', cur.ruleContent.content.length, '| variable', JSON.stringify(cur.variable || ''));

const r = await fetch('http://' + IP + '/saveBookSource', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(final) });
console.log('POST /saveBookSource ->', r.status, (await r.text()).slice(0, 60));

const after = (await (await fetch('http://' + IP + '/getBookSources')).json()).data;
const now = after.find(x => x.bookSourceUrl === 'https://sangtacviet.com');
console.log('sau khi push      :', now.bookSourceName, '| content len', now.ruleContent.content.length);
console.log('content khớp bản merge :', now.ruleContent.content === merged);
console.log('từ điển có mặt         :', now.ruleContent.content.includes('namesys.php'), '| catch-per-base:', now.ruleContent.content.includes('}catch(_be)'), '| img:', now.ruleContent.content.includes('__stvImgTags'));
for (const k of ['variable', 'variableComment', 'loginUi', 'header', 'searchUrl', 'exploreUrl', 'ruleBookInfo', 'ruleToc', 'ruleExplore', 'ruleSearch', 'enabled', 'enabledExplore', 'enabledCookieJar']) {
  const a = JSON.stringify(cur[k]), b = JSON.stringify(now[k]);
  if (a !== b) console.log('  KHAC sau push @' + k + ': truoc=' + String(a).slice(0, 70) + ' sau=' + String(b).slice(0, 70));
}
fs.writeFileSync('/root/Extransion-TTC/legado/books/sang-tac-viet.json', JSON.stringify(final, null, 2) + '\n');
fs.writeFileSync('/root/Extransion-TTC/skill-tao-nguon-legado/sources/sang-tac-viet.json', JSON.stringify(final, null, 2) + '\n');
console.log('\nda ghi repo: legado/books/sang-tac-viet.json + skill-tao-nguon-legado/sources/sang-tac-viet.json');
console.log('tong so nguon tren may:', after.length);
