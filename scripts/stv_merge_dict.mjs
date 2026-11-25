import fs from 'fs';

const V2 = JSON.parse(fs.readFileSync('legado/books/sang-tac-viet.V1-device-backup.json','utf8')).ruleContent.content;
const V3 = JSON.parse(fs.readFileSync('legado/books/sang-tac-viet.V3-device-backup.json','utf8')).ruleContent.content;
const L = s => s.split(/\r?\n/);
const lv = L(V2), l3 = L(V3);

function findLine(lines, pred, what){
  const i = lines.findIndex(pred);
  if (i < 0) throw 'not found: ' + what;
  return i;
}

/* ---- block A: dictionary (namesys.php) from V2 ---- */
const aStart = findLine(lv, s => s.trim().startsWith('var _dict={}'), 'dict start');
const aHdr   = findLine(lv, s => s.includes('data=data.replace(/<header'), 'V2 header-strip');
const dictBlock = lv.slice(aStart, aHdr);            // up to but excluding the header strip
if (!dictBlock.some(s => s.includes('namesys.php'))) throw 'dict block lost namesys';
if (!dictBlock.some(s => s.includes("data=_out.join('')"))) throw 'dict block truncated';

/* ---- block B: <img> extraction + restore from V2 ---- */
const imgLine = lv.find(s => s.trim().startsWith('var __stvImgTags=[];'));
if (!imgLine) throw 'img line not found';
const restoreLine = lv.find(s => s.includes('IMG') && s.includes('parseInt(__i'));
if (!restoreLine) throw 'img restore line not found';

/* ---- block C: multi-domain __SEL from V2 ---- */
const selLine = lv.find(s => s.trim().startsWith("var __SEL='https://sangtacviet.com'"));
if (!selLine) throw '__SEL not found';

/* ---- robustness fix on V3 base: catch per base, not per attempt ---- */
const t = x => x.trim();
function lineIdx(lines, txt, from){
  const i = lines.findIndex((x, j) => j >= (from||0) && t(x) === txt);
  if (i < 0) throw 'line not found: ' + txt.slice(0, 60);
  return i;
}
function lineCount(lines, txt){ return lines.filter(x => t(x) === txt).length; }
for (const probe of [
  "var key='', rc='', base='', data='', diag='', ok=false;",
  "if(!ok){ throw 'DIAG '+diag; }",
  "for (var bi=0; bi<BASES.length && !key; bi++){",
  "base=BASES[bi];",
]) if (lineCount(l3, probe) !== 1) throw 'anchor not unique: ' + probe;
const keyLine = l3.filter(x => t(x).startsWith("if(out.indexOf('__KEY__:')===0)"));
if (keyLine.length !== 1) throw 'key line not unique';

const out = [...l3];
out.forEach((x, i) => {
  if (t(x) === "var key='', rc='', base='', data='', diag='', ok=false;")
    out[i] = "var key='', rc='', base='', data='', diag='', ok=false, _bd='', _dbg=[];";
  if (t(x) === "if(!ok){ throw 'DIAG '+diag; }")
    out[i] = "if(!ok){ throw 'DIAG '+diag+' bases='+_dbg.join(' ; '); }";
});
const biIdx = lineIdx(out, "for (var bi=0; bi<BASES.length && !key; bi++){");
const baseIdx = lineIdx(out, "base=BASES[bi];", biIdx);
out.splice(baseIdx + 1, 0, "    try{");
const keyIdx = (() => { const i = out.findIndex((x, j) => j > baseIdx && t(x).startsWith("if(out.indexOf('__KEY__:')===0)")); if (i < 0) throw 'key line lost'; return i; })();
out.splice(keyIdx + 1, 0, "    }catch(_be){ rc=''; _bd=String(_be&&_be.message?_be.message:_be); _dbg.push(base+':'+_bd.substring(0,60)); }");

/* ---- assemble: swap BASES, then splice V2-only blocks into out ---- */
const basesIdx = findLine(out, s => s.includes('var BASES=['), 'V3 BASES');
out.splice(basesIdx, 1, selLine,
  "var BASES=[__SEL,'http://14.225.254.182','https://dns1.stv-appdomain-00000001.org','http://14.225.254.182.nip.io'];");

const hdrIdx = findLine(out, s => s.includes('data=data.replace(/<header'), 'V3 header-strip');
out.splice(hdrIdx, 0, ...dictBlock);

const imgIdx = findLine(out, s => s.includes('data=data.replace(/<header'), 'header-strip after insert');
out.splice(imgIdx + 1, 0, imgLine);

const endIdx = findLine(out, s => s.trim() === 'res', 'final res');
out.splice(endIdx, 0, restoreLine);

const merged = out.join('\n');

/* ---- sanity: every feature present exactly once ---- */
const count = (s, sub) => s.split(sub).length - 1;
const fresh = { '}catch(_be)': 1, '_dbg.push': 1, 'bases=': 1, 'try{': null };
const checks = ['namesys.php', '_out.join', '__stvImgTags', 'parseInt(__i', '__SEL', 'transmode=chinese', '0xE01B', '__JOIN', 'sajax=readchapter', 'getLoginInfoMap'];
for (const k of Object.keys(fresh)) {
  if (fresh[k] === null) continue;
  const c = count(merged, k);
  if (c !== fresh[k]) throw 'fresh-code fail: ' + k + ' x' + c + ' want ' + fresh[k];
  console.log('  [new] ' + k.padEnd(16) + ' x' + c);
}
for (const k of checks) {
  const inBoth = count(V2, k) > 0 && count(V3, k) > 0;
  const want = inBoth ? count(V3, k) : count(V2, k) + count(V3, k);
  const c = count(merged, k);
  if (c !== want) throw 'sanity fail: ' + k + ' merged x' + c + ' want V2+V3 x' + want;
  console.log('  ' + k.padEnd(20) + ' x' + c + '  (V2 ' + count(V2,k) + ' + V3 ' + count(V3,k) + ')');
}
const absent = ['var __SEL', '_dict'].filter(k => count(V3,k) !== 0);
if (absent.length) throw 'unexpected: ' + absent.join(',');
/* no duplicated declarations from the inserted V2 blocks */
const mL = out.join('\n').split('\n');
const decl = ['var _dict=', 'var __stvImgTags', 'var _nodes=', 'var _nh='];
for (const d of decl) {
  const n = mL.filter(x => x.includes(d)).length;
  if (n !== 1) throw 'duplicate declaration ' + d + ' x' + n;
}
fs.writeFileSync('/tmp/stv_merged_rule.js', merged);
console.log('\nmerged rule: ' + merged.length + ' chars, ' + out.length + ' lines (V3 was ' + V3.length + '/' + l3.length + ', V2 ' + V2.length + '/' + lv.length + ')');
