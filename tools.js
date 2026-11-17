// 共通ユーティリティ
function parseCSV(text, delim) {
  delim = delim || ',';
  const rows = []; let row = [], cur = '', inQ = false;
  const s = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQ) {
      if (c === '"') { if (s[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === delim) { row.push(cur); cur = ''; }
    else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += c;
  }
  row.push(cur); rows.push(row);
  return rows.filter(r => !(r.length === 1 && r[0] === ''));
}
function toCSV(rows, delim) {
  delim = delim || ',';
  return rows.map(r => r.map(v => {
    v = v == null ? '' : String(v);
    return (v.indexOf(delim) >= 0 || /["\n]/.test(v)) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }).join(delim)).join('\n');
}
function download(name, text, bom) {
  const body = (bom === false ? '' : '\uFEFF') + text;
  const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function readFile(input, cb) {
  const f = input.files && input.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => cb(String(r.result));
  r.readAsText(f);
}
function copyText(text, btn) {
  const done = () => {
    if (!btn) return;
    const orig = btn.textContent;
    btn.textContent = 'コピーしました';
    setTimeout(() => { btn.textContent = orig; }, 1600);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else fallbackCopy(text, done);
}
function fallbackCopy(text, done) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch (e) { /* 失敗時は無視 */ }
  ta.remove();
  done();
}
function delimOf(id) {
  const el = document.getElementById(id);
  if (!el) return ',';
  return el.value === 'tab' ? '\t' : el.value;
}

// CSV重複削除
function initDedupe() {
  const run = () => {
    const text = document.getElementById('in').value;
    const colSel = document.getElementById('col').value;
    const err = document.getElementById('err'); err.textContent = '';
    if (!text.trim()) { err.textContent = 'CSVが入力されていません。'; return; }
    const delim = delimOf('delim');
    let rows;
    try { rows = parseCSV(text, delim); } catch (e) { err.textContent = '読み込みに失敗しました。'; return; }
    const hasHeader = document.getElementById('header').checked;
    const head = hasHeader ? rows.slice(0, 1) : [];
    const body = hasHeader ? rows.slice(1) : rows.slice();
    const ci = colSel === 'all' ? -1 : parseInt(colSel, 10);
    const trimKey = document.getElementById('trimkey').checked;
    const noCase = document.getElementById('nocase').checked;
    const norm = v => { let k = String(v == null ? '' : v); if (trimKey) k = k.trim(); if (noCase) k = k.toLowerCase(); return k; };
    const seen = new Set(); const out = [];
    for (const r of body) {
      const key = ci < 0 ? r.map(norm).join('\u0001') : norm(r[ci]);
      if (!seen.has(key)) { seen.add(key); out.push(r); }
    }
    const result = head.concat(out);
    document.getElementById('stat').textContent =
      '元の件数 ' + body.length + ' 件 → 重複を除いて ' + out.length + ' 件（' + (body.length - out.length) + ' 件を削除）';
    document.getElementById('out').textContent = toCSV(result, delim);
    document.getElementById('dl').onclick = () => download('deduped.csv', toCSV(result, delim));
    document.getElementById('copy').onclick = e => copyText(toCSV(result, delim), e.target);
  };
  document.getElementById('run').onclick = run;
  document.getElementById('file').onchange = e => readFile(e.target, t => document.getElementById('in').value = t);
  document.getElementById('colnum').onchange = e => {
    const v = e.target.value;
    document.getElementById('col').innerHTML =
      '<option value="all">行全体</option>' +
      Array.from({ length: parseInt(v, 10) || 0 }, (_, i) => '<option value="' + i + '">' + (i + 1) + '列目</option>').join('');
  };
}

// CSV⇔JSON変換
function initCsvJson() {
  document.getElementById('file').onchange = e => readFile(e.target, t => document.getElementById('in').value = t);
  const typed = v => {
    if (v === '') return '';
    if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(v)) return Number(v);
    if (v === 'true') return true;
    if (v === 'false') return false;
    if (v === 'null') return null;
    return v;
  };
  document.getElementById('toJson').onclick = () => {
    const err = document.getElementById('err'); err.textContent = '';
    const delim = delimOf('delim');
    const rows = parseCSV(document.getElementById('in').value, delim);
    if (rows.length < 1) { err.textContent = 'CSVが入力されていません。'; return; }
    const useTypes = document.getElementById('types').checked;
    const head = rows[0];
    const objs = rows.slice(1).map(r => { const o = {}; head.forEach((h, i) => o[h] = useTypes ? typed(r[i] ?? '') : (r[i] ?? '')); return o; });
    const text = JSON.stringify(objs, null, 2);
    document.getElementById('out').textContent = text;
    document.getElementById('dl').onclick = () => download('converted.json', text, false);
    document.getElementById('copy').onclick = e => copyText(text, e.target);
  };
  document.getElementById('toCsv').onclick = () => {
    const err = document.getElementById('err'); err.textContent = '';
    let data;
    try { data = JSON.parse(document.getElementById('in').value); }
    catch (e) { err.textContent = 'JSONとして読み込めませんでした：' + e.message; return; }
    if (!Array.isArray(data) || !data.length || typeof data[0] !== 'object') {
      err.textContent = 'オブジェクトの配列（[{...}, {...}]）を入力してください。'; return;
    }
    const delim = delimOf('delim');
    const keys = [...new Set(data.flatMap(o => Object.keys(o)))];
    const rows = [keys].concat(data.map(o => keys.map(k => o[k] == null ? '' : (typeof o[k] === 'object' ? JSON.stringify(o[k]) : o[k]))));
    const text = toCSV(rows, delim);
    document.getElementById('out').textContent = text;
    document.getElementById('dl').onclick = () => download('converted.csv', text);
    document.getElementById('copy').onclick = e => copyText(text, e.target);
  };
}

// JSON整形
function sortKeysDeep(v) {
  if (Array.isArray(v)) return v.map(sortKeysDeep);
  if (v && typeof v === 'object') {
    const o = {};
    Object.keys(v).sort().forEach(k => { o[k] = sortKeysDeep(v[k]); });
    return o;
  }
  return v;
}
function jsonErrPos(input, e) {
  const m = /position\s+(\d+)/i.exec(e.message || '');
  if (!m) return '';
  const pos = parseInt(m[1], 10);
  const upto = String(input).slice(0, pos);
  const line = upto.split('\n').length;
  const col = pos - upto.lastIndexOf('\n');
  return '（' + line + '行目・' + col + '文字目あたり）';
}
function initJsonFormat() {
  const parse = () => JSON.parse(document.getElementById('in').value);
  const run = () => {
    const err = document.getElementById('err'); err.textContent = '';
    let data;
    try { data = parse(); }
    catch (e) { err.textContent = 'JSONとして読み込めませんでした：' + e.message + jsonErrPos(document.getElementById('in').value, e); return; }
    if (document.getElementById('sortkeys').checked) data = sortKeysDeep(data);
    const indent = parseInt(document.getElementById('indent').value, 10);
    const text = JSON.stringify(data, null, indent);
    document.getElementById('stat').textContent = '正しいJSONです（' + text.length + ' 文字）';
    document.getElementById('out').textContent = text;
    document.getElementById('dl').onclick = () => download('formatted.json', text, false);
    document.getElementById('copy').onclick = ev => copyText(text, ev.target);
  };
  document.getElementById('run').onclick = run;
  document.getElementById('mini').onclick = () => {
    const err = document.getElementById('err'); err.textContent = '';
    try {
      let data = parse();
      if (document.getElementById('sortkeys').checked) data = sortKeysDeep(data);
      const text = JSON.stringify(data);
      document.getElementById('out').textContent = text;
      document.getElementById('dl').onclick = () => download('minified.json', text, false);
      document.getElementById('copy').onclick = ev => copyText(text, ev.target);
    } catch (e) { err.textContent = 'JSONとして読み込めませんでした：' + e.message + jsonErrPos(document.getElementById('in').value, e); }
  };
}

// 行の重複削除・並べ替え
function initLines() {
  document.getElementById('run').onclick = () => {
    let lines = document.getElementById('in').value.split(/\r?\n/);
    const before = lines.length;
    if (document.getElementById('trim').checked) lines = lines.map(s => s.trim());
    if (document.getElementById('noempty').checked) lines = lines.filter(s => s !== '');
    if (document.getElementById('dedupe').checked) lines = [...new Set(lines)];
    const sort = document.getElementById('sort').value;
    if (sort === 'asc') lines.sort((a, b) => a.localeCompare(b, 'ja'));
    if (sort === 'desc') lines.sort((a, b) => b.localeCompare(a, 'ja'));
    if (sort === 'numasc') lines.sort((a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0));
    if (sort === 'numdesc') lines.sort((a, b) => (parseFloat(b) || 0) - (parseFloat(a) || 0));
    if (sort === 'reverse') lines.reverse();
    const text = lines.join('\n');
    document.getElementById('stat').textContent = '元の行数 ' + before + ' 行 → ' + lines.length + ' 行';
    document.getElementById('out').textContent = text;
    document.getElementById('dl').onclick = () => download('lines.txt', text);
    document.getElementById('copy').onclick = e => copyText(text, e.target);
  };
}
