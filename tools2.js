// 計算系ツール（tools2.js）
function fmt(n){ return n.toLocaleString('ja-JP'); }

function initTax(){
  var price=document.getElementById('price'), rate=document.getElementById('rate'),
      mode=document.getElementById('mode'), out=document.getElementById('out');
  function calc(){
    var p=parseFloat(price.value);
    if(isNaN(p)){ out.innerHTML=''; return; }
    var r=parseFloat(rate.value)/100;
    if(mode.value==='excl'){
      var incl=Math.floor(p*(1+r)+1e-9), tax=incl-Math.floor(p);
      out.innerHTML='税込価格：<b>'+fmt(incl)+'円</b>（うち消費税 '+fmt(tax)+'円）';
    }else{
      var excl=Math.floor(p/(1+r)+1e-9), tax2=Math.floor(p)-excl;
      out.innerHTML='税抜価格：<b>'+fmt(excl)+'円</b>（うち消費税 '+fmt(tax2)+'円）';
    }
  }
  [price,rate,mode].forEach(function(el){ el.addEventListener('input',calc); el.addEventListener('change',calc); });
}

function initDiscount(){
  var price=document.getElementById('price'), pct=document.getElementById('pct'), out=document.getElementById('out');
  function calc(){
    var p=parseFloat(price.value), d=parseFloat(pct.value);
    if(isNaN(p)){ out.innerHTML=''; return; }
    if(isNaN(d)) d=0;
    var off=Math.round(p*d/100), final=p-off;
    out.innerHTML='割引後の価格：<b>'+fmt(final)+'円</b>（'+fmt(off)+'円引き）';
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
    out.innerHTML='満年齢：<b>'+age+'歳</b>（次の誕生日まであと '+days+' 日）';
  }
  [birth,asof].forEach(function(el){ el.addEventListener('input',calc); el.addEventListener('change',calc); });
}

function initDays(){
  var a=document.getElementById('a'), b=document.getElementById('b'), out1=document.getElementById('out1'),
      base=document.getElementById('base'), n=document.getElementById('n'), out2=document.getElementById('out2');
  function calc1(){
    if(!a.value||!b.value){ out1.innerHTML=''; return; }
    var d=Math.round((new Date(b.value+'T00:00:00')-new Date(a.value+'T00:00:00'))/86400000);
    out1.innerHTML='日数の差：<b>'+fmt(Math.abs(d))+'日</b>'+(d<0?'（2つ目の日付が前）':'');
  }
  function calc2(){
    if(!base.value||n.value===''){ out2.innerHTML=''; return; }
    var d=new Date(base.value+'T00:00:00'); d.setDate(d.getDate()+parseInt(n.value,10));
    out2.innerHTML='計算結果：<b>'+d.getFullYear()+'年'+(d.getMonth()+1)+'月'+d.getDate()+'日</b>';
  }
  [a,b].forEach(function(el){ el.addEventListener('change',calc1); el.addEventListener('input',calc1); });
  [base,n].forEach(function(el){ el.addEventListener('change',calc2); el.addEventListener('input',calc2); });
}

function initChars(){
  var ta=document.getElementById('in'), out=document.getElementById('out');
  function calc(){
    var t=ta.value;
    var chars=[...t].length;
    var noSpace=[...t.replace(/\s/g,'')].length;
    var lines=t==='' ? 0 : t.split(/\r\n|\r|\n/).length;
    var bytes=new Blob([t]).size;
    var sheets=(noSpace/400).toFixed(1);
    out.innerHTML='文字数：<b>'+fmt(chars)+'</b>／空白を除く：<b>'+fmt(noSpace)+'</b>／行数：<b>'+fmt(lines)+'</b>／バイト数（UTF-8）：<b>'+fmt(bytes)+'</b>／原稿用紙（400字）：約<b>'+sheets+'</b>枚';
  }
  ta.addEventListener('input',calc);
}
