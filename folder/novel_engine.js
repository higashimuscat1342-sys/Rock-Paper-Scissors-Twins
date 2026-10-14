/* ===== novel_engine.js : ノベルエンジン(通常は触らなくてOK) =====
   設定は novel.html、シナリオは folder/prologue.js・folder/event_*.js にあります。 */
/* ======================= エンジン(通常は触らなくてOK) ======================= */
const $=s=>document.querySelector(s);
/* ---- どのシナリオ(folder/○○.js)を再生するか: novel.html?scene=○○ ---- */
const Q=new URLSearchParams(location.search),SCENE_ID=Q.get('scene')||'prologue',SC=(window.NOVEL_SCENES||{})[SCENE_ID]||null;
function backUrl(){return (SC&&SC.back)||GAME.backTo;}
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function fit(){const s=Math.min(innerWidth/1280,innerHeight/720),st=$('#stage');st.style.transform=`translate(${(innerWidth-1280*s)/2}px,${(innerHeight-720*s)/2}px) scale(${s})`;}
addEventListener('resize',fit);fit();

/* ---- 保存 ---- */
let DB;
function loadDB(){try{DB=JSON.parse(localStorage.getItem(GAME.novelSaveKey)||'{}')||{};}catch(e){DB={};}
  DB.slots=DB.slots||{};DB.read=DB.read||{};DB.cfg=Object.assign({speed:2,auto:2,bgm:.5,se:.7,skipUnread:false,reduceFlash:false},DB.cfg||{});DB.cgs=DB.cgs||{};DB.autos=DB.autos||{};if(DB.auto){if(!DB.autos.prologue)DB.autos.prologue=DB.auto;delete DB.auto;}}
let dbT=0;function saveDB(now){clearTimeout(dbT);const f=()=>{try{localStorage.setItem(GAME.novelSaveKey,JSON.stringify(DB));}catch(e){}};if(now)f();else dbT=setTimeout(f,300);}
function mainSave(fn){let o={};try{o=JSON.parse(localStorage.getItem(GAME.mainSaveKey)||'{}')||{};}catch(e){o={};}fn(o);try{localStorage.setItem(GAME.mainSaveKey,JSON.stringify(o));}catch(e){}}
loadDB();
/* ショップで買ったインターフェース(配色)を反映 */
try{const mo=JSON.parse(localStorage.getItem(GAME.mainSaveKey)||'{}');document.documentElement.setAttribute('data-theme',(mo&&mo.theme)||'default');}catch(e){}

/* ---- トースト ---- */
let toastT;function toast(t,err){const e=$('#toast');e.textContent=t;e.classList.toggle('err',!!err);e.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>e.classList.remove('on'),err?4200:1700);}

/* ---- シナリオ解析 ---- */
const ops=[],labels={};
function hash(s){let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return (h>>>0).toString(36);}
function parse(src){
  const L=src.replace(/\r/g,'').split('\n');
  for(let i=0;i<L.length;i++){
    const t=L[i].trim();
    if(!t||t[0]===';'||t[0]==='；'||t.slice(0,2)==='//')continue;
    if(t[0]==='*'||t[0]==='＊'){labels[t.slice(1).trim()]=ops.length;continue;}
    if(t[0]==='@'||t[0]==='＠'){
      const p=t.slice(1).trim().split(/\s+/),cmd=(p[0]||'').toLowerCase(),args=p.slice(1);
      if(cmd==='choice'){
        const opts=[];
        const rest=t.slice(1).trim().replace(/^choice\s*/i,'');
        if(rest){rest.split('|').forEach(x=>{const k=x.split(/\s*(?:->|→|>)\s*/);if(k[0].trim())opts.push({text:k[0].trim(),to:(k[1]||'').trim()});});ops.push({t:'choice',opts,ln:i+1});continue;}
        while(i+1<L.length){
          const n=L[i+1].trim();
          if(/^[@＠]endchoice/i.test(n)){i++;break;}
          if(!n||n[0]===';'){i++;continue;}
          if(/^[-－・]/.test(n)){const b=n.slice(1).trim().split(/\s*(?:->|→)\s*/);opts.push({text:b[0],to:(b[1]||'').trim()});i++;}
          else break;
        }
        ops.push({t:'choice',opts,ln:i+1});continue;
      }
      ops.push({t:'cmd',cmd,args,raw:t,ln:i+1});continue;
    }
    let who='',text=t,q=['',''];
    const m=t.match(/^(.{1,14}?)([「『（(])([\s\S]*?)([」』）)])?$/);
    if(m&&(CHARS[m[1]]||(m[4]&&m[1].length<=8&&!/[。、，．！？!?…\s]/.test(m[1])))){who=m[1];q=[m[2],m[4]||({'「':'」','『':'』','（':'）','(':')'}[m[2]])];text=m[3];}
    ops.push({t:'text',who,text,q,ln:i+1,key:hash(who+'|'+text)});
  }
}

/* ---- 状態 ---- */
let S={pc:0,vars:{},bg:'',cg:'',bgm:'',chars:{}};
let LOG=[],mode='idle',typing=false,auto=false,skip=false,ctrlSkip=false,hidden=false,curOp=null,waitCb=null;
let tw=null,autoT=null,skipT=null,waitT=null;
const charEls={};

/* ---- 背景/CG ---- */
let bgFront='A';
function resolve(kind,name){
  if(!name)return '';
  if(/^(#|rgb|https?:|data:|\/)/i.test(name)||/^(black|white|none|stop|off)$/i.test(name)||name.indexOf('/')>=0)return name;
  const has=/\.[a-z0-9]{2,4}$/i.test(name);
  return (ASSET[kind]||'')+name+((has||kind==='bgm'||kind==='se')?'':ASSET.ext);
}
function bgCss(v){if(!v||v==='none')return 'none';v=resolve('bg',v);if(/^#|^rgb|^(black|white)$/i.test(v))return v;return `url("${v}") center/cover no-repeat,linear-gradient(135deg,#ffd0e8,#e3d2ff 55%,#c9f1ff)`;}
function setBg(v,sec){
  S.bg=v||'';const nx=bgFront==='A'?'B':'A',el=$('#bg'+nx),old=$('#bg'+bgFront);
  el.style.transition='opacity '+(sec==null?.6:sec)+'s';old.style.transition='opacity '+(sec==null?.6:sec)+'s';
  el.style.background=bgCss(v);el.style.backgroundSize='cover';
  el.classList.add('on');old.classList.remove('on');bgFront=nx;
}
function setCg(v){S.cg=(v&&v!=='off')?v:'';const c=$('#cg');if(S.cg){c.style.background=`url("${resolve('cg',S.cg)}") center/cover no-repeat`;c.classList.add('on');DB.cgs[S.cg]=1;saveDB();}else c.classList.remove('on');}

/* ---- 立ち絵 ---- */
const POS={left:25,center:50,right:75,farleft:12,farright:88,'左':25,'中':50,'右':75};
function posVal(p){if(p==null)return 50;if(POS[p]!=null)return POS[p];const n=parseFloat(String(p).replace(/^x=/,''));return isFinite(n)?n:50;}
function imgFor(name,expr){const c=CHARS[name];if(c&&c.imgs){return resolve('ch',c.imgs[expr]||c.imgs.normal||'');}return /[\/.]/.test(expr||'')?resolve('ch',expr):'';}
function showChar(name,expr,pos,instant){
  let el=charEls[name];const old=S.chars[name]||{};expr=expr||old.expr||'normal';pos=pos||old.pos||'center';
  if(!el){
    el=document.createElement('div');el.className='ch';el.style.setProperty('--c',(CHARS[name]&&CHARS[name].color)||'#ff7fbd');
    el.innerHTML=`<img alt=""><div class="ph">${esc(name)}</div>`;
    const im=el.querySelector('img');im.onerror=()=>el.classList.add('noimg');im.onload=()=>el.classList.remove('noimg');
    el.style.left=posVal(pos)+'%';el.style.opacity=0;$('#chars').appendChild(el);charEls[name]=el;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{el.style.opacity=1;}));
    if(instant){el.style.transition='none';el.style.opacity=1;}
  }
  const src=imgFor(name,expr);const im=el.querySelector('img');
  if(src){if(im.getAttribute('src')!==src)im.setAttribute('src',src);}else{im.removeAttribute('src');el.classList.add('noimg');}
  el.style.left=posVal(pos)+'%';S.chars[name]={expr,pos};
}
function hideChar(name){const el=charEls[name];if(!el)return;el.style.opacity=0;setTimeout(()=>el.remove(),450);delete charEls[name];delete S.chars[name];}
function hideAll(){Object.keys(charEls).forEach(hideChar);}
function highlight(who){Object.keys(charEls).forEach(n=>charEls[n].classList.toggle('dim',!!who&&n!==who&&!!charEls[who]));}

/* ---- 音 ---- */
let bgmA=null;
function playBgm(src){
  if(bgmA){try{bgmA.pause();}catch(e){}bgmA=null;}
  S.bgm=(src&&src!=='stop')?src:'';if(!S.bgm)return;
  const a=new Audio();a.loop=true;a.volume=DB.cfg.bgm;a.src=resolve('bgm',S.bgm);bgmA=a;const p=a.play();
  if(p&&p.catch)p.catch(()=>{ // 自動再生が止められた場合は、最初のクリック/キー入力で再生
    const retry=()=>{removeEventListener('pointerdown',retry,true);removeEventListener('keydown',retry,true);if(bgmA===a){const q=a.play();if(q&&q.catch)q.catch(()=>{});}};
    addEventListener('pointerdown',retry,true);addEventListener('keydown',retry,true);
  });
}
function playSe(src){const a=new Audio();a.volume=DB.cfg.se;a.src=resolve('se',src);const p=a.play();if(p&&p.catch)p.catch(()=>{});}

/* ---- 実行 ---- */
function clearTimers(){clearTimeout(autoT);clearTimeout(skipT);clearTimeout(waitT);if(tw){clearInterval(tw.iv);}tw=null;}
function run(){
  clearTimers();$('#choices').innerHTML='';
  while(S.pc<ops.length){
    const op=ops[S.pc];
    if(op.t==='text'){showText(op);return;}
    if(op.t==='choice'){showChoice(op);return;}
    const r=exec(op);
    if(r==='block')return;
    if(r&&r.jump!=null){S.pc=r.jump;continue;}
    S.pc++;
  }
  finishScript();
}
function cont(){S.pc++;run();}
function blockFor(sec,after){
  mode='wait';$('#more').classList.remove('on');
  let done=false;const go=()=>{if(done)return;done=true;clearTimeout(waitT);waitCb=null;if(after)after();cont();};
  waitCb=go;waitT=setTimeout(go,(skip||ctrlSkip)?Math.min(sec*1000,80):sec*1000);return 'block';
}
function num(v,d){const n=parseFloat(v);return isFinite(n)?n:d;}
function val(v){if(v==null)return '';if(/^-?\d+(\.\d+)?$/.test(v))return parseFloat(v);if(v==='true')return true;if(v==='false')return false;return v;}
/* ---- 演出(明滅など) ---- */
let FXABORT=false;
let bootCurtain=true; // 起動直後は暗転のまま。最初の文章(または暗転解除)で明るくする
function revealBoot(){if(!bootCurtain)return;bootCurtain=false;const cu=$('#curtain');cu.style.transition='opacity .5s';cu.style.opacity=0;}
const fxsleep=ms=>new Promise(r=>setTimeout(r,(skip||ctrlSkip||FXABORT)?0:ms));
function blockAsync(fn){
  mode='wait';$('#more').classList.remove('on');FXABORT=false;let done=false;
  const go=()=>{if(done)return;done=true;waitCb=null;FXABORT=false;cont();};
  waitCb=()=>{FXABORT=true;}; // クリックで演出を打ち切り
  Promise.resolve().then(fn).then(go,go);return 'block';
}
function filterCss(nm){return {blur:'blur(4px)',gray:'grayscale(1)',sepia:'sepia(.85)',dark:'brightness(.55)',red:'sepia(1) saturate(4) hue-rotate(-35deg)',pink:'saturate(1.5) hue-rotate(-15deg) brightness(1.05)'}[nm]||'none';}
function applyFx(o){
  S.filter=o.filter||'';S.zoom=o.zoom||1;S.win=o.win!==false;S.chap=o.chap||'';
  const w=$('#world');w.style.transition='none';w.style.filter=S.filter?filterCss(S.filter):'none';w.style.transform=S.zoom!==1?'scale('+S.zoom+')':'';void w.offsetWidth;w.style.transition='';
  $('#msgbox').classList.toggle('nowin',!S.win);
}
async function doFlash(n,color,gap){
  const f=$('#flash'),red=DB.cfg.reduceFlash;n=Math.max(1,Math.min(10,n|0||1));
  for(let i=0;i<n;i++){
    if(skip||ctrlSkip||FXABORT)break;
    f.style.transition='none';f.style.background=color||'#fff';f.style.opacity=red?.35:1;await fxsleep(80);
    f.style.transition='opacity '+(red?.35:.2)+'s';f.style.opacity=0;await fxsleep(red?Math.max(gap,450):gap);
  }
  f.style.transition='none';f.style.opacity=0;
}
async function doBurst(pw){
  const f=$('#flash'),w=$('#world'),red=DB.cfg.reduceFlash,cnt=4+Math.round(pw)*2,base=S.filter?filterCss(S.filter):'none';
  for(let i=0;i<cnt;i++){
    if(skip||ctrlSkip||FXABORT)break;
    const gap=Math.max(70,260-i*26);
    f.style.transition='none';f.style.background='#fff';f.style.opacity=red?.3:Math.min(1,.5+i*.1);
    w.style.filter='brightness(1.5) blur(1.5px)';
    if(i%2===0){w.style.setProperty('--sk',(6+i*1.5)+'px');w.classList.remove('shake');void w.offsetWidth;w.classList.add('shake');}
    await fxsleep(70+i*6);
    f.style.transition='opacity '+(gap/1000)+'s';f.style.opacity=red?.08:.12;w.style.filter=base;
    await fxsleep(gap);
  }
  if(!(skip||ctrlSkip||FXABORT)){f.style.transition='opacity .25s';f.style.opacity=red?.45:1;await fxsleep(450);f.style.transition='opacity '+(red?1.2:1.6)+'s';f.style.opacity=0;await fxsleep(900);}
  f.style.transition='none';f.style.opacity=0;w.style.filter=base;
}
function spawnHearts(k){
  const L=$('#fxl'),cs=['#ff7fbd','#ff4f9a','#ffd1e8','#fff','#ffb3d6'];
  for(let i=0;i<k;i++){
    const s=document.createElement('span');s.className='hrt';s.textContent=i%3?'♡':'♥';
    s.style.left=(Math.random()*1240)+'px';s.style.fontSize=(20+Math.random()*34)+'px';s.style.color=cs[i%5];
    s.style.setProperty('--d',(2.4+Math.random()*2)+'s');s.style.setProperty('--r',(Math.random()*60-30)+'deg');s.style.animationDelay=(Math.random()*1.2)+'s';
    L.appendChild(s);setTimeout(()=>s.remove(),5400);
  }
}
function exec(op){
  const a=op.args,c=op.cmd;
  switch(c){
    case 'bg':{
      if(a[1]==='fade'){const sec=num(a[2],.45);$('#ui').classList.add('fxhide');
        return blockAsync(async()=>{bootCurtain=false;const cu=$('#curtain');cu.style.transition='opacity '+sec+'s';cu.style.background='#000';cu.style.opacity=1;await fxsleep(sec*1000);setBg(a[0],0);await fxsleep(150);cu.style.transition='opacity '+sec+'s';cu.style.opacity=0;await fxsleep(sec*1000);});}
      setBg(a[0],num(a[1],.6));break;}
    case 'show':showChar(a[0],a[1]&&!POS[a[1]]&&a[2]?a[1]:(a[1]&&POS[a[1]]?undefined:a[1]),a[1]&&POS[a[1]]?a[1]:a[2]);break;
    case 'expr':showChar(a[0],a[1]);break;
    case 'move':showChar(a[0],undefined,a[1]);break;
    case 'hide':if(a[0]==='all')hideAll();else hideChar(a[0]);break;
    case 'hideall':hideAll();break;
    case 'cg':setCg(a[0]);break;
    case 'bgm':playBgm(a[0]);break;
    case 'se':case 'voice':if(a[0])playSe(a[0]);break;
    case 'wait':{let v=num(a[0],1);if(v>=20)v/=1000;return blockFor(v);}
    case 'shake':{const w=$('#world');w.style.setProperty('--sk',(9*num(a[0],1))+'px');w.style.animationDuration=num(a[1],.5)+'s';w.classList.remove('shake');void w.offsetWidth;w.classList.add('shake');break;}
    case 'flash':{const cnt=num(a[0],1),col=a[1]&&a[1][0]==='#'?a[1]:'#fff',gap=num(a[col===a[1]?2:1],250);return blockAsync(()=>doFlash(cnt,col,gap));}
    case 'burst':{const pw=Math.max(1,Math.min(3,num(a[0],2)));return blockAsync(()=>doBurst(pw));}
    case 'fadeout':{const cu=$('#curtain');cu.style.transition='opacity '+num(a[1],1)+'s';cu.style.background=a[0]||'#000';cu.style.opacity=1;break;}
    case 'fadein':{bootCurtain=false;const cu=$('#curtain');cu.style.transition='opacity '+num(a[0],1)+'s';cu.style.opacity=0;break;}
    case 'whiteout':{const cu=$('#curtain');cu.style.transition='opacity '+num(a[0],1.2)+'s';cu.style.background='#fff';cu.style.opacity=1;break;}
    case 'whitein':{bootCurtain=false;const cu=$('#curtain');cu.style.transition='opacity '+num(a[0],1.2)+'s';cu.style.opacity=0;break;}
    case 'filter':{S.filter=(a[0]&&a[0]!=='none')?a[0]:'';$('#world').style.filter=S.filter?filterCss(S.filter):'none';break;}
    case 'zoom':{const z=num(a[0],1);S.zoom=z;const w=$('#world');w.style.transition='transform '+num(a[1],.8)+'s,filter .5s';w.style.transform=z!==1?'scale('+z+')':'';setTimeout(()=>{w.style.transition='';},num(a[1],.8)*1000+50);break;}
    case 'hearts':spawnHearts(Math.max(1,Math.min(60,num(a[0],18))));break;
    case 'window':S.win=!(a[0]==='off'||a[0]==='hide');$('#msgbox').classList.toggle('nowin',!S.win);break;
    case 'chapter':S.chap=a.join(' ');break;
    case 'title':{$('#ui').classList.add('fxhide');const parts=a.join(' ').split('|');$('#chap1').textContent=(parts[0]||'').trim();$('#chap2').textContent=(parts[1]||'').trim();$('#chap').classList.add('on');
      return blockFor(2.6,()=>$('#chap').classList.remove('on'));}
    case 'jump':{if(labels[a[0]]==null){err(op,'ラベル「'+a[0]+'」がありません');break;}return {jump:labels[a[0]]};}
    case 'set':case 'add':{
      const j=a.join(' '),m=j.match(/^(\S+?)\s*(\+=|-=|=)\s*(\S+)$/);
      if(m){const v=val(m[3]);if(m[2]==='=')S.vars[m[1]]=v;else S.vars[m[1]]=(Number(S.vars[m[1]])||0)+(m[2]==='-='?-1:1)*(Number(v)||0);break;}
      if(c==='set')S.vars[a[0]]=val(a.slice(1).join(' '));else S.vars[a[0]]=(Number(S.vars[a[0]])||0)+num(a[1],0);break;}
    case 'if':{
      const m=a.join(' ').match(/^(\S+?)\s*(==|!=|>=|<=|>|<|=)\s*(\S+?)\s*(?:->|→)\s*(\S+)$/);
      if(!m){err(op,'@if の書き方: @if 変数 >= 値 -> ラベル');break;}
      const l=S.vars[m[1]]==null?0:S.vars[m[1]],r=val(m[3]);let ok=false;
      switch(m[2]){case '==':case '=':ok=l==r;break;case '!=':ok=l!=r;break;case '>=':ok=l>=r;break;case '<=':ok=l<=r;break;case '>':ok=l>r;break;case '<':ok=l<r;break;}
      if(ok){if(labels[m[4]]==null){err(op,'ラベル「'+m[4]+'」がありません');break;}return {jump:labels[m[4]]};}
      break;}
    case 'aff':{
      const ch=CHARS[a[0]],k=ch&&ch.aff?ch.aff:(a[0]==='a'||a[0]==='b'?a[0]:null),d=num(a[1],0);
      if(!k){err(op,'@aff の名前が不明です: '+a[0]);break;}
      mainSave(o=>{o.aff=o.aff||{};o.aff.a=o.aff.a||0;o.aff.b=o.aff.b||0;o.aff[k]=Math.max(0,Math.min(100,o.aff[k]+d));});
      toast(`${a[0]} 好感度 ${d>=0?'+':''}${d} 💗`);break;}
    case 'battle':{
      const AT={'火':0,'草':1,'水':2,'0':0,'1':1,'2':2},DF={'かんたん':0,'ふつう':1,'むずかしい':2,'0':0,'1':1,'2':2};
      const at=AT[a[0]]!=null?AT[a[0]]:0,df=DF[a[1]]!=null?DF[a[1]]:1,winL=a[2],loseL=a[3];
      mode='wait';waitCb=null;auto=false;skip=false;syncTools();$('#more').classList.remove('on');
      if(bgmA){try{bgmA.pause();}catch(e){}}
      const f=document.createElement('iframe');f.id='bt';f.setAttribute('allow','autoplay');
      f.src=GAME.backTo+'?embed=1&attr='+at+'&diff='+df+'&prey='+(a[4]==='2'?2:1);
      $('#stage').appendChild(f);
      const onMsg=e=>{
        if(e.source!==f.contentWindow||!e.data||!e.data.sansukumi)return;
        removeEventListener('message',onMsg);f.remove();
        if(bgmA&&S.bgm){const p=bgmA.play();if(p&&p.catch)p.catch(()=>{});}
        const r=e.data,won=r.result==='win';S.vars.score=r.score||0;S.vars.win=won?1:0;
        if(won&&winL&&labels[winL]!=null)S.pc=labels[winL];
        else if(!won&&loseL&&labels[loseL]!=null)S.pc=labels[loseL];
        else if(!won){/* 負けてラベル未指定: やり直し */}
        else S.pc++;
        run();
      };
      addEventListener('message',onMsg);
      return 'block';}
    case 'end':finishScript();return 'block';
    case 'back':location.href=backUrl();return 'block';
    default:err(op,'未定義のコマンド @'+c);
  }
  return null;
}
function err(op,m){toast(`行${op.ln}: ${m}`,true);console.warn('novel script',op.ln,m);}

/* ---- テキスト ---- */
const SPEED=[0,18,42,90,0]; // 1=遅い 2=普通 3=速い 4=一瞬
function showText(op){
  mode='text';curOp=op;S.pc=S.pc;$('#ui').classList.remove('fxhide');revealBoot();
  const ch=CHARS[op.who],np=$('#nameplate');
  np.textContent=op.who;np.style.setProperty('--nc',(ch&&ch.color)||'#ff5fa2');
  highlight(op.who);
  const plain=(op.q[0]||'')+op.text.replace(/\\n|\[br\]/g,'\n')+(op.q[1]||'');
  LOG.push({who:op.who,text:plain,c:(ch&&ch.color)||''});if(LOG.length>200)LOG.shift();
  const wasRead=!!DB.read[op.key];DB.read[op.key]=1;
  autoSnap();
  const el=$('#txt');el.textContent='';$('#more').classList.remove('on');
  const cps=[0,18,42,90,0][DB.cfg.speed]||42;
  if(DB.cfg.speed>=4||cps===0||((skip||ctrlSkip)&&(wasRead||DB.cfg.skipUnread))){el.textContent=plain;typing=false;lineDone(wasRead);return;}
  typing=true;tw={plain,i:0,acc:0,wasRead};
  tw.iv=setInterval(()=>{tw.acc+=cps*.03;const n=Math.floor(tw.acc);if(n>0){tw.acc-=n;tw.i=Math.min(plain.length,tw.i+n);el.textContent=plain.slice(0,tw.i);}if(tw.i>=plain.length){clearInterval(tw.iv);const w=tw.wasRead;tw=null;typing=false;lineDone(w);}},30);
}
function completeText(){if(!tw)return;clearInterval(tw.iv);$('#txt').textContent=tw.plain;const w=tw.wasRead;tw=null;typing=false;lineDone(w);}
function lineDone(wasRead){
  $('#more').classList.add('on');
  clearTimeout(autoT);clearTimeout(skipT);
  if(skip||ctrlSkip){
    if(wasRead||DB.cfg.skipUnread){skipT=setTimeout(()=>{if(mode==='text'&&!isModal())next();},40);}
    else{skip=false;syncTools();toast('未読の文でスキップを止めました');}
    return;
  }
  if(auto){autoT=setTimeout(()=>{if(mode==='text'&&!typing&&!isModal())next();},DB.cfg.auto*1000+($('#txt').textContent.length*35));}
}
function next(){
  if(mode==='wait'){if(waitCb)waitCb();return;}
  if(mode!=='text')return;
  if(typing){completeText();return;}
  S.pc++;run();
}

/* ---- 選択肢 ---- */
function showChoice(op){
  $('#ui').classList.remove('fxhide');revealBoot();
  mode='choice';typing=false;auto=false;skip=false;syncTools();curOp=op;
  $('#more').classList.remove('on');highlight('');
  autoSnap();
  const box=$('#choices');box.innerHTML='';
  op.opts.forEach(o=>{const b=document.createElement('button');b.className='cbtn';b.textContent=o.text;
    b.onclick=e=>{e.stopPropagation();LOG.push({who:'',text:'▶ '+o.text,sel:1});box.innerHTML='';
      if(o.to){if(labels[o.to]==null){err(op,'ラベル「'+o.to+'」がありません');S.pc++;}else S.pc=labels[o.to];}else S.pc++;
      run();};
    box.appendChild(b);});
}

/* ---- 終了 ---- */
function finishScript(){
  mode='end';clearTimers();
  const en=(SC&&SC.onEnd)||(SCENE_ID==='prologue'?{prologue:true}:{});
  mainSave(o=>{if(en.prologue)o.prologue=true;if(en.seen){o.seen=o.seen||{};o.seen[en.seen]=true;}});
  $('#e-go').textContent=(SC&&SC.backLabel)||'ゲームへ進む';
  $('#end').classList.remove('hidden');
}

/* ---- セーブ/ロード ---- */
function snapshot(){
  const lastText=(LOG.slice().reverse().find(l=>!l.sel)||{}).text||'';
  return {scene:SCENE_ID,stt:(SC&&SC.title)||SCENE_ID,pc:S.pc,vars:S.vars,bg:S.bg,cg:S.cg,bgm:S.bgm,chars:S.chars,filter:S.filter||'',zoom:S.zoom||1,win:S.win!==false,chap:S.chap||'',log:LOG.slice(-40),t:Date.now(),ex:lastText.slice(0,40),ch:curOp&&curOp.t==='text'?curOp.who:''};
}
function autoSnap(){DB.autos[SCENE_ID]=snapshot();saveDB();}
function getSlot(id){return id==='auto'?DB.autos[SCENE_ID]:DB.slots[id];}
function loadSnap(sn,id){if(!sn)return;if(sn.scene&&sn.scene!==SCENE_ID){location.href=location.pathname+'?scene='+encodeURIComponent(sn.scene)+'&load='+encodeURIComponent(id);return;}closeModal();hideStart();restore(sn);}
function restore(sn){
  clearTimers();hideAll();Object.keys(charEls).forEach(k=>{charEls[k].remove();delete charEls[k];});$('#chars').innerHTML='';
  S={pc:sn.pc,vars:JSON.parse(JSON.stringify(sn.vars||{})),bg:'',cg:'',bgm:'',chars:{},filter:'',zoom:1,win:true,chap:''};
  LOG=(sn.log||[]).slice();
  setBg(sn.bg,0);setCg(sn.cg);playBgm(sn.bgm);applyFx(sn);
  Object.keys(sn.chars||{}).forEach(n=>showChar(n,sn.chars[n].expr,sn.chars[n].pos,true));
  bootCurtain=false;$('#curtain').style.transition='none';$('#curtain').style.opacity=0;$('#chap').classList.remove('on');
  $('#end').classList.add('hidden');
  run();
}
function fmtT(t){const d=new Date(t),p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}/${p(d.getMonth()+1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;}
const SLOT_IDS=['auto','q','1','2','3','4','5','6'];
function slotLabel(id){return id==='auto'?'オートセーブ':id==='q'?'クイック':'スロット '+id;}
function openSlots(kind){
  const save=kind==='save';
  const cells=SLOT_IDS.map(id=>{
    const d=getSlot(id);
    const dis=save&&id==='auto';
    return `<button class="slot ${d?'':'empty'}" data-id="${id}" ${dis?'disabled style="opacity:.35;cursor:default"':''}><b>${slotLabel(id)}</b>${d?`<small>${fmtT(d.t)}${d.stt?' 《'+esc(d.stt)+'》':''}</small>${esc(d.chap?'['+d.chap+'] ':'')}${esc(d.ch?d.ch+'：':'')}${esc(d.ex||'')}`:'(データなし)'}</button>`;}).join('');
  openModal(`<h2>${save?'セーブ':'ロード'}</h2><div class="slots">${cells}</div><div class="btns"><button class="btn" id="m-close">閉じる</button></div>`);
  $('#m-close').onclick=closeModal;
  document.querySelectorAll('.slot').forEach(b=>b.onclick=()=>{
    const id=b.dataset.id;
    if(save){if(id==='auto')return;if(DB.slots[id]&&!confirm('このスロットに上書きしますか？'))return;if(!(curOp&&(mode==='text'||mode==='choice'))){toast('いまはセーブできません');return;}DB.slots[id]=snapshot();saveDB(true);toast('セーブしました');openSlots('save');}
    else{const d=getSlot(id);if(!d)return;loadSnap(d,id);toast('ロードしました');}
  });
}
function quickSave(){if(!(curOp&&(mode==='text'||mode==='choice')))return;DB.slots.q=snapshot();saveDB(true);toast('クイックセーブ');}
function quickLoad(){if(!DB.slots.q){toast('クイックセーブがありません');return;}loadSnap(DB.slots.q,'q');toast('クイックロード');}

/* ---- モーダル ---- */
function isModal(){return $('#modal').classList.contains('on')||!$('#start').classList.contains('hidden')||!$('#end').classList.contains('hidden');}
function openModal(html){$('#mbox').innerHTML=html;$('#modal').classList.add('on');}
function closeModal(){$('#modal').classList.remove('on');$('#mbox').innerHTML='';if(mode==='text'&&!typing)lineDone(true);}
function openLog(){
  const rows=LOG.map(l=>l.sel?`<div class="lg sel">${esc(l.text)}</div>`:`<div class="lg" style="--c:${l.c||'#ff5fa2'}">${l.who?`<b>${esc(l.who)}</b>`:''}${esc(l.text).replace(/\n/g,'<br>')}</div>`).join('')||'<div class="lg">(まだログがありません)</div>';
  openModal(`<h2>ログ</h2><div id="logbox">${rows}</div><div class="btns"><button class="btn" id="m-close">閉じる</button></div>`);
  const lb=$('#logbox');lb.scrollTop=lb.scrollHeight;$('#m-close').onclick=closeModal;
}
function openConfig(){
  const c=DB.cfg,sp=['','遅い','普通','速い','一瞬'];
  openModal(`<h2>設定</h2>
  <div class="row"><span class="lb">文字速度</span><input type="range" id="c-sp" min="1" max="4" step="1" value="${c.speed}"><span class="val" id="c-spv">${sp[c.speed]}</span></div>
  <div class="row"><span class="lb">オート待ち時間</span><input type="range" id="c-au" min="0.5" max="5" step="0.5" value="${c.auto}"><span class="val" id="c-auv">${c.auto}秒</span></div>
  <div class="row"><span class="lb">BGM音量</span><input type="range" id="c-bgm" min="0" max="100" value="${Math.round(c.bgm*100)}"></div>
  <div class="row"><span class="lb">効果音音量</span><input type="range" id="c-se" min="0" max="100" value="${Math.round(c.se*100)}"></div>
  <div class="row"><label><input type="checkbox" id="c-un" ${c.skipUnread?'checked':''}> 未読の文もスキップする</label></div>
  <div class="row"><label><input type="checkbox" id="c-rf" ${c.reduceFlash?'checked':''}> 光の明滅を弱める(フラッシュ演出を控えめに)</label></div>
  <div class="btns"><button class="btn lav" id="c-fs">全画面の切替</button><button class="btn lav" id="c-gal">CGギャラリー</button><button class="btn" id="m-close">閉じる</button></div>`);
  $('#c-sp').oninput=e=>{c.speed=+e.target.value;$('#c-spv').textContent=sp[c.speed];saveDB();};
  $('#c-au').oninput=e=>{c.auto=+e.target.value;$('#c-auv').textContent=c.auto+'秒';saveDB();};
  $('#c-bgm').oninput=e=>{c.bgm=e.target.value/100;if(bgmA)bgmA.volume=c.bgm;saveDB();};
  $('#c-se').oninput=e=>{c.se=e.target.value/100;saveDB();};
  $('#c-un').onchange=e=>{c.skipUnread=e.target.checked;saveDB();};
  $('#c-rf').onchange=e=>{c.reduceFlash=e.target.checked;saveDB();};
  $('#c-gal').onclick=()=>openGallery();
  $('#c-fs').onclick=()=>{try{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen();}catch(e){}};
  $('#m-close').onclick=closeModal;
}

/* ---- ツールボタン ---- */
function syncTools(){$('#t-auto').classList.toggle('on',auto);$('#t-skip').classList.toggle('on',skip);}
function toggleAuto(){auto=!auto;if(auto)skip=false;syncTools();if(auto&&mode==='text'&&!typing)lineDone(true);else clearTimeout(autoT);}
function toggleSkip(){skip=!skip;if(skip)auto=false;syncTools();if(skip&&mode==='text'){if(typing)completeText();else lineDone(!!DB.read[curOp&&curOp.key]);}else clearTimeout(skipT);}
function setHidden(h){hidden=h;$('#ui').classList.toggle('hide',h);}
function goBack(){if(confirm('ゲームに戻りますか？(進行状況はオートセーブされています)')){autoSnap();saveDB(true);location.href=backUrl();}}
$('#t-auto').onclick=e=>{e.stopPropagation();toggleAuto();};
$('#t-skip').onclick=e=>{e.stopPropagation();toggleSkip();};
$('#t-log').onclick=e=>{e.stopPropagation();openLog();};
$('#t-save').onclick=e=>{e.stopPropagation();openSlots('save');};
$('#t-load').onclick=e=>{e.stopPropagation();openSlots('load');};
$('#t-cfg').onclick=e=>{e.stopPropagation();openConfig();};
$('#t-hide').onclick=e=>{e.stopPropagation();setHidden(true);};
$('#t-back').onclick=e=>{e.stopPropagation();goBack();};
$('#stage').addEventListener('click',e=>{
  if(isModal())return;
  if(hidden){setHidden(false);return;}
  if(e.target.closest('#tools')||e.target.closest('.cbtn'))return;
  if(skip||auto){skip=false;auto=false;syncTools();clearTimeout(skipT);clearTimeout(autoT);return;}
  if($('#chap').classList.contains('on')){if(waitCb)waitCb();return;}
  next();
});
$('#stage').addEventListener('contextmenu',e=>{e.preventDefault();if(isModal()){if($('#modal').classList.contains('on'))closeModal();return;}setHidden(!hidden);});
$('#stage').addEventListener('wheel',e=>{if(isModal())return;if(e.deltaY<0)openLog();else if(e.deltaY>0)next();},{passive:true});
addEventListener('keydown',e=>{
  if(e.key==='Control'){ctrlSkip=true;if(mode==='text'&&!isModal()){if(typing)completeText();else lineDone(!!DB.read[curOp&&curOp.key]);}return;}
  if(!$('#start').classList.contains('hidden'))return;
  if(e.key==='Escape'){if($('#modal').classList.contains('on'))closeModal();else if(hidden)setHidden(false);return;}
  if(isModal())return;
  const k=e.key;
  if(k===' '||k==='Enter'||k==='ArrowDown'){e.preventDefault();if(hidden){setHidden(false);return;}next();}
  else if(k==='a'||k==='A')toggleAuto();
  else if(k==='s'||k==='S')toggleSkip();
  else if(k==='l'||k==='L')openLog();
  else if(k==='h'||k==='H')setHidden(!hidden);
  else if(k==='F5'){e.preventDefault();quickSave();}
  else if(k==='F9'){e.preventDefault();quickLoad();}
  else if(k==='ArrowUp')openLog();
});
addEventListener('keyup',e=>{if(e.key==='Control'){ctrlSkip=false;clearTimeout(skipT);}});

/* ---- 開始 ---- */
function hideStart(){$('#start').classList.add('hidden');}
function startNew(){hideStart();$('#end').classList.add('hidden');bootCurtain=true;{const cu=$('#curtain');cu.style.transition='none';cu.style.background='#000';cu.style.opacity=1;}$('#ui').classList.add('fxhide');LOG=[];S={pc:0,vars:{},bg:'',cg:'',bgm:'',chars:{},filter:'',zoom:1,win:true,chap:''};applyFx({});
  Object.keys(charEls).forEach(k=>{charEls[k].remove();delete charEls[k];});$('#chars').innerHTML='';setBg('',0);setCg('');playBgm('');
  run();}
$('#s-new').onclick=startNew;
$('#s-cont').onclick=()=>{const d=DB.autos[SCENE_ID];if(d){hideStart();restore(d);}};
function openGallery(){
  const list=[];Object.keys(window.NOVEL_SCENES||{}).forEach(id=>{String(NOVEL_SCENES[id].script||'').split('\n').forEach(l=>{const m=l.trim().match(/^[@＠]cg\s+(\S+)/i);if(m&&m[1]!=='off'&&list.indexOf(m[1])<0)list.push(m[1]);});});
  const cells=list.map((g,i)=>DB.cgs[g]?`<div class="th" data-g="${esc(g)}" style="background-image:url('${esc(resolve('cg',g))}')"></div>`:`<div class="th lock">？？？</div>`).join('')||'<div style="padding:20px">(シナリオに @cg がありません)</div>';
  openModal(`<h2>CGギャラリー</h2><div class="gal">${cells}</div><div class="btns"><button class="btn" id="m-close">閉じる</button></div>`);
  $('#m-close').onclick=closeModal;
  document.querySelectorAll('.gal .th[data-g]').forEach(t=>t.onclick=()=>{const v=$('#cgview');v.style.backgroundImage=`url("${resolve('cg',t.dataset.g)}")`;v.style.display='block';v.onclick=()=>{v.style.display='none';};});
}
$('#s-gal').onclick=openGallery;
$('#s-back').onclick=()=>{location.href=backUrl();};
$('#e-go').onclick=()=>{location.href=backUrl();};
$('#e-again').onclick=startNew;
$('#s-cont').disabled=!DB.autos[SCENE_ID];
if(SC){
  parse(SC.script);$('#start h1').textContent=SC.title||SCENE_ID;document.title=(SC.title||SCENE_ID)+' - さんすくみツインズ';
}else{
  $('#start h1').style.fontSize='46px';$('#start h1').textContent='シナリオが見つかりません';
  $('#start .sub').textContent='folder/'+SCENE_ID+'.js を確認してください';
  $('#s-new').style.display='none';$('#s-cont').style.display='none';$('#start').classList.remove('hidden');
}
/* ?load=番号 (1〜6 / q / auto) でそのスロットから再開 */
(function(){const q=new URLSearchParams(location.search).get('load');const d=q&&getSlot(q);if(d){hideStart();restore(d);}else if(SC){startNew();}})(); // 開始画面なし: そのままノベルを始める
window.__novel={ops,labels,get S(){return S;},LOG:()=>LOG};
