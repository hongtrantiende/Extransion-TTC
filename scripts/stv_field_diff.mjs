import fs from 'fs';
const dev = JSON.parse(fs.readFileSync('/tmp/dev2.json', 'utf8')).data.find(d => d.bookSourceUrl === 'https://sangtacviet.com'); // V2 hiện trên máy
const v3 = JSON.parse(fs.readFileSync('/root/Extransion-TTC/legado/books/sang-tac-viet.V3-device-backup.json', 'utf8'));
const repo = JSON.parse(fs.readFileSync('/root/Extransion-TTC/legado/books/sang-tac-viet.json', 'utf8'));

function walk(a, b, path, out) {
  const keys = [...new Set([...Object.keys(a || {}), ...Object.keys(b || {})])].sort();
  for (const k of keys) {
    const p = path ? path + '.' + k : k;
    const x = a ? a[k] : undefined, y = b ? b[k] : undefined;
    const xs = typeof x === 'object' && x !== null, ys = typeof y === 'object' && y !== null;
    if (xs && ys) walk(x, y, p, out);
    else if (JSON.stringify(x) !== JSON.stringify(y)) out.push([p, x, y]);
  }
  return out;
}
function show(label, a, b) {
  const d = walk(a, b, '', []);
  console.log('\n===== ' + label + ' — ' + d.length + ' field khác =====');
  for (const [p, x, y] of d) {
    const sx = JSON.stringify(x), sy = JSON.stringify(y);
    if (sx && sy && sx.length > 90 && sy.length > 90 && sx.length === sy.length) {
      let i = 0; while (i < sx.length && sx[i] === sy[i]) i++;
      console.log('  ' + p.padEnd(22) + 'differ@' + i);
      console.log('      A: …' + sx.slice(Math.max(0, i - 30), i + 90));
      console.log('      B: …' + sy.slice(Math.max(0, i - 30), i + 90));
    } else console.log('  ' + p.padEnd(22) + 'A=' + String(sx).slice(0, 110) + '\n' + ' '.repeat(p.length + 24) + 'B=' + String(sy).slice(0, 110));
  }
}
show('V2 (máy, có từ điển)  vs  V3 (backup)', dev, v3);
show('V3 backup vs repo sang-tac-viet.json', v3, repo);
