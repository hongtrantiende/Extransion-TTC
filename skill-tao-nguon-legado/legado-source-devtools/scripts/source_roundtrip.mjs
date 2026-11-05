// Vong tron SUA NGUON an toan qua dich vu web: get -> deep-merge patch -> save -> verify.
// Giu nguyen cac rule khong lien quan (chi de chap cac field co trong patch).
// Dung Node (KHONG PowerShell) de UTF-8 tieng Viet khong bi ma hoa kep.
//
// Cach dung:
//   node source_roundtrip.mjs <IP> <bookSourceUrl> <patchFile.json>
// Vi du:
//   node source_roundtrip.mjs 192.168.5.23 https://sangtacviet.com patch.json
// patch.json (phan doi, long tinh):
//   { "bookSourceName": "Sáng Tác Việt", "exploreUrl": "[...mang JSON...]" }
import fs from 'node:fs';

const ip = process.argv[2] || '192.168.5.23';
const url = process.argv[3] || 'https://sangtacviet.com';
const patchFile = process.argv[4];
const base = 'http://' + ip + ':1122';

function deepMerge(target, src) {
  for (const k of Object.keys(src)) {
    const v = src[k];
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if (!target[k] || typeof target[k] !== 'object') target[k] = {};
      deepMerge(target[k], v);
    } else {
      target[k] = v;
    }
  }
  return target;
}

const g = await fetch(base + '/getBookSource?url=' + encodeURIComponent(url));
const gj = await g.json();
if (!gj.data) { console.error('KHONG TIM THAY nguon tren may (kiem tra IP/dich vu web/bookSourceUrl).'); process.exit(1); }

let data = gj.data;
if (patchFile) {
  const patch = JSON.parse(fs.readFileSync(patchFile, 'utf8'));
  data = deepMerge(data, patch);
}

const save = await fetch(base + '/saveBookSource', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(data),
});
console.log('SAVE:', JSON.stringify(await save.json()));

const v = await fetch(base + '/getBookSource?url=' + encodeURIComponent(url));
const d = (await v.json()).data;
console.log('VERIFY name=' + d.bookSourceName + ' | searchUrl=' + d.searchUrl);
console.log('NOTE: luc app dang mo -> FORCE-CLOSE app de UI reload nguon (debug WS thi doc DB live).');
