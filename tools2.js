// 計算系ツール（tools2.js）
function fmt(n){ return n.toLocaleString('ja-JP'); }

function initTax(){
  var price=document.getElementById('price'), rate=document.getElementById('rate'),
      mode=document.getElementById('mode'), round=document.getElementById('round'), out=document.getElementById('out');
  function R(x){
    if(round.value==='round') return Math.round(x);
    if(round.value==='ceil') return Math.ceil(x-1e-9);
    return Math.floor(x+1e-9);
  }
  function calc(){
    var p=parseFloat(price.value);
    if(isNaN(p)){ out.innerHTML=''; return; }
    var r=parseFloat(rate.value)/100;
    if(mode.value==='excl'){
      var tax=R(p*r), incl=p+tax;
      out.innerHTML='税込価格：<b>'+fmt(incl)+'円</b>（うち消費税 '+fmt(tax)+'円）';
    }else{
      var excl=R(p/(1+r)), tax2=p-excl;
      out.innerHTML='税抜価格：<b>'+fmt(excl)+'円</b>（うち消費税 '+fmt(tax2)+'円）';
    }
  }
  [price,rate,mode,round].forEach(function(el){ el.addEventListener('input',calc); el.addEventListener('change',calc); });
}

function initDiscount(){
  var price=document.getElementById('price'), pct=document.getElementById('pct'), out=document.getElementById('out');
  function calc(){
    var p=parseFloat(price.value), d=parseFloat(pct.value);
    if(isNaN(p)){ out.innerHTML=''; return; }
    if(isNaN(d)) d=0;
    var off=Math.round(p*d/100), final=p-off;
    var msg='割引後の価格：<b>'+fmt(final)+'円</b>（'+fmt(off)+'円引き）';
    if(d>100) msg+='<br>※割引率が100%を超えているため、割引後の価格がマイナスになっています。';
    if(d<0) msg+='<br>※割引率がマイナスです（値引きではなく上乗せの計算になっています）。';
    out.innerHTML=msg;
  }
  document.querySelectorAll('[data-pct]').forEach(function(b){
    b.addEventListener('click',function(){ pct.value=b.getAttribute('data-pct'); calc(); });
  });
  [price,pct].forEach(function(el){ el.addEventListener('input',calc); });
}

function initAge(){
  var birth=document.getElementById('birth'), asof=document.getElementById('asof'), out=document.getElementById('out');
  var today=new Date(); asof.value=today.toISOString().slice(0,10);
  function calc(){
    if(!birth.value){ out.innerHTML=''; return; }
    var b=new Date(birth.value+'T00:00:00'), a=new Date((asof.value||today.toISOString().slice(0,10))+'T00:00:00');
    var age=a.getFullYear()-b.getFullYear();
    var md=(a.getMonth()-b.getMonth())||(a.getDate()-b.getDate());
    if(md<0) age--;
    var next=new Date(a.getFullYear(), b.getMonth(), b.getDate());
    if(next<a) next=new Date(a.getFullYear()+1, b.getMonth(), b.getDate());
    var days=Math.round((next-a)/86400000);
    var total=Math.round((a-b)/86400000);
    out.innerHTML='満年齢：<b>'+age+'歳</b>（次の誕生日まであと '+days+' 日）<br>生まれてから：<b>'+fmt(total)+'日</b>';
  }
  [birth,asof].forEach(function(el){ el.addEventListener('input',calc); el.addEventListener('change',calc); });
}

// 日本の祝日（祝日法ベースで算出。振替休日・国民の休日を含む。1980〜2099年が対象）
var _holidayCache={};
function jpHolidays(year){
  if(_holidayCache[year]) return _holidayCache[year];
  var set={};
  function key(m,d){ return m+'/'+d; }
  function add(m,d){ set[key(m,d)]=true; }
  function nthMonday(m,n){ var dt=new Date(year,m-1,1); var off=(8-dt.getDay())%7; return 1+off+(n-1)*7; }
  // 固定日
  add(1,1); add(2,11); add(2,23); add(4,29); add(5,3); add(5,4); add(5,5);
  add(8,11); add(11,3); add(11,23);
  // ハッピーマンデー
  add(1,nthMonday(1,2)); add(7,nthMonday(7,3)); add(9,nthMonday(9,3)); add(10,nthMonday(10,2));
  // 春分・秋分（近似式、1980〜2099年）
  var t=year-1980;
  add(3, Math.floor(20.8431+0.242194*t)-Math.floor(t/4));
  add(9, Math.floor(23.2488+0.242194*t)-Math.floor(t/4));
  // 振替休日（祝日が日曜なら、祝日でない最も近い後日）
  var base=Object.keys(set).map(function(k){ var p=k.split('/'); return new Date(year, +p[0]-1, +p[1]); });
  base.forEach(function(dt){
    if(dt.getDay()===0){
      var nx=new Date(dt);
      do { nx.setDate(nx.getDate()+1); } while(set[key(nx.getMonth()+1, nx.getDate())]);
      add(nx.getMonth()+1, nx.getDate());
    }
  });
  // 国民の休日（平日が祝日に挟まれた場合）
  for(var m=1;m<=12;m++){
    var dim=new Date(year,m,0).getDate();
    for(var d=2;d<dim;d++){
      if(set[key(m,d)]) continue;
      var dow=new Date(year,m-1,d).getDay();
      if(dow===0||dow===6) continue;
      if(set[key(m,d-1)] && set[key(m,d+1)]) add(m,d);
    }
  }
  _holidayCache[year]=set;
  return set;
}
function isBizDay(dt){
  var dow=dt.getDay();
  if(dow===0||dow===6) return false;
  return !jpHolidays(dt.getFullYear())[(dt.getMonth()+1)+'/'+dt.getDate()];
}
var WDAYS=['日','月','火','水','木','金','土'];
function fmtDate(dt){
  return dt.getFullYear()+'年'+(dt.getMonth()+1)+'月'+dt.getDate()+'日（'+WDAYS[dt.getDay()]+'）';
}

function initDays(){
  var a=document.getElementById('a'), b=document.getElementById('b'), out1=document.getElementById('out1'),
      base=document.getElementById('base'), n=document.getElementById('n'), biz=document.getElementById('biz'), out2=document.getElementById('out2');
  function calc1(){
    if(!a.value||!b.value){ out1.innerHTML=''; return; }
    var da=new Date(a.value+'T00:00:00'), db=new Date(b.value+'T00:00:00');
    var d=Math.round((db-da)/86400000);
    var lo=da<=db?da:db, hi=da<=db?db:da;
    var bizCount=0, cur=new Date(lo);
    while(cur<=hi){ if(isBizDay(cur)) bizCount++; cur.setDate(cur.getDate()+1); }
    out1.innerHTML='日数の差：<b>'+fmt(Math.abs(d))+'日</b>'+(d<0?'（2つ目の日付が前）':'')+
      '<br>その間の営業日（土日・祝日を除く、両端を含む）：<b>'+fmt(bizCount)+'日</b>';
  }
  function calc2(){
    if(!base.value||n.value===''){ out2.innerHTML=''; return; }
    var d=new Date(base.value+'T00:00:00');
    var num=parseInt(n.value,10);
    if(isNaN(num)){ out2.innerHTML=''; return; }
    if(biz.checked && num!==0){
      var step=num>0?1:-1, left=Math.abs(num);
      while(left>0){ d.setDate(d.getDate()+step); if(isBizDay(d)) left--; }
    }else{
      d.setDate(d.getDate()+num);
    }
    out2.innerHTML='計算結果：<b>'+fmtDate(d)+'</b>'+(biz.checked?'（営業日計算）':'');
  }
  [a,b].forEach(function(el){ el.addEventListener('change',calc1); el.addEventListener('input',calc1); });
  [base,n,biz].forEach(function(el){ el.addEventListener('change',calc2); el.addEventListener('input',calc2); });
}

function initChars(){
  var ta=document.getElementById('in'), out=document.getElementById('out');
  function calc(){
    var t=ta.value;
    var chars=[...t].length;
    var noSpace=[...t.replace(/\s/g,'')].length;
    var noNewline=[...t.replace(/\r\n|\r|\n/g,'')].length;
    var words=(t.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)||[]).length;
    var lines=t==='' ? 0 : t.split(/\r\n|\r|\n/).length;
    var bytes=new Blob([t]).size;
    var sheets=(noSpace/400).toFixed(1);
    out.innerHTML='文字数：<b>'+fmt(chars)+'</b>／空白を除く：<b>'+fmt(noSpace)+'</b>／改行を除く：<b>'+fmt(noNewline)+'</b>／単語数（英数字）：<b>'+fmt(words)+'</b>／行数：<b>'+fmt(lines)+'</b>／バイト数（UTF-8）：<b>'+fmt(bytes)+'</b>／原稿用紙（400字）：約<b>'+sheets+'</b>枚';
  }
  ta.addEventListener('input',calc);
}
