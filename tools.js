// 共通ユーティリティ
function parseCSV(text) {
  const rows = []; let row = [], cur = '', inQ = false;
  const s = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQ) {
      if (c === '"') { if (s[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += c;
  }
  row.push(cur); rows.push(row);
  return rows.filter(r => !(r.length === 1 && r[0] === ''));
}
function toCSV(rows) {
  return rows.map(r => r.map(v => {
    v = v == null ? '' : String(v);
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }).join(',')).join('\n');
}
function download(name, text) {
  const blob = new Blob(['\uFEFF' + text], { type: 'text/plain;charset=utf-8' });
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

// CSV重複削除
function initDedupe() {
  const run = () => {
    const text = document.getElementById('in').value;
    const colSel = document.getElementById('col').value;
    const err = document.getElementById('err'); err.textContent = '';
    if (!text.trim()) { err.textContent = 'CSVが入力されていません。'; return; }
    let rows;
    try { rows = parseCSV(text); } catch (e) { err.textContent = '読み込みに失敗しました。'; return; }
    const hasHeader = document.getElementById('header').checked;
    const head = hasHeader ? rows.slice(0, 1) : [];
    const body = hasHeader ? rows.slice(1) : rows.slice();
    const ci = colSel === 'all' ? -1 : parseInt(colSel, 10);
    const seen = new Set(); const out = [];
    for (const r of body) {
      const key = ci < 0 ? r.join('\u0001') : (r[ci] ?? '');
      if (!seen.has(key)) { seen.add(key); out.push(r); }
    }
    const result = head.concat(out);
    document.getElementById('stat').textContent =
      '元の件数 ' + body.length + ' 件 → 重複を除いて ' + out.length + ' 件（' + (body.length - out.length) + ' 件を削除）';
    document.getElementById('out').textContent = toCSV(result);
    document.getElementById('dl').onclick = () => download('deduped.csv', toCSV(result));
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
  document.getElementById('toJson').onclick = () => {
    const err = document.getElementById('err'); err.textContent = '';
    const rows = parseCSV(document.getElementById('in').value);
    if (rows.length < 1) { err.textContent = 'CSVが入力されていません。'; return; }
    const head = rows[0];
    const objs = rows.slice(1).map(r => { const o = {}; head.forEach((h, i) => o[h] = r[i] ?? ''); return o; });
    const text = JSON.stringify(objs, null, 2);
    document.getElementById('out').textContent = text;
    document.getElementById('dl').onclick = () => download('converted.json', text.replace(/^\uFEFF/, ''));
  };
  document.getElementById('toCsv').onclick = () => {
    const err = document.getElementById('err'); err.textContent = '';
    let data;
    try { data = JSON.parse(document.getElementById('in').value); }
    catch (e) { err.textContent = 'JSONとして読み込めませんでした：' + e.message; return; }
    if (!Array.isArray(data) || !data.length || typeof data[0] !== 'object') {
      err.textContent = 'オブジェクトの配列（[{...}, {...}]）を入力してください。'; return;
    }
    const keys = [...new Set(data.flatMap(o => Object.keys(o)))];
    const rows = [keys].concat(data.map(o => keys.map(k => o[k] == null ? '' : (typeof o[k] === 'object' ? JSON.stringify(o[k]) : o[k]))));
    const text = toCSV(rows);
    document.getElementById('out').textContent = text;
    document.getElementById('dl').onclick = () => download('converted.csv', text);
  };
}

// JSON整形
function initJsonFormat() {
  const run = () => {
    const err = document.getElementById('err'); err.textContent = '';
    let data;
    try { data = JSON.parse(document.getElementById('in').value); }
    catch (e) { err.textContent = 'JSONとして読み込めませんでした：' + e.message; return; }
    const indent = parseInt(document.getElementById('indent').value, 10);
    const text = JSON.stringify(data, null, indent);
    document.getElementById('stat').textContent = '正しいJSONです（' + text.length + ' 文字）';
    document.getElementById('out').textContent = text;
    document.getElementById('dl').onclick = () => download('formatted.json', text.replace(/^\uFEFF/, ''));
  };
  document.getElementById('run').onclick = run;
  document.getElementById('mini').onclick = () => {
    const err = document.getElementById('err'); err.textContent = '';
    try {
      const text = JSON.stringify(JSON.parse(document.getElementById('in').value));
      document.getElementById('out').textContent = text;
      document.getElementById('dl').onclick = () => download('minified.json', text);
    } catch (e) { err.textContent = 'JSONとして読み込めませんでした：' + e.message; }
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
    const text = lines.join('\n');
    document.getElementById('stat').textContent = '元の行数 ' + before + ' 行 → ' + lines.length + ' 行';
    document.getElementById('out').textContent = text;
    document.getElementById('dl').onclick = () => download('lines.txt', text);
  };
}
