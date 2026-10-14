/* ===== game.js : ゲーム本体(カードバトル/ショップ/デッキ編成/ステータス) =====
   画面(HTML/CSS)は index.html、設定は冒頭の CONFIG にあります。 */
/*CFG_START*/
/* ============================================================
   設定(ここを書き換えるだけで名前・セリフ・画像・イベントを変更できます)
   画像・音声は index.html と同じ場所の folder フォルダに置いてください。
   無い画像は自動でダミー表示になります。
   ============================================================ */
const CONFIG={
  player:{name:'あなた'},
  titleBgm:'folder/title.mp3', // タイトル画面専用BGM(無ければ内蔵音源)
  battleBgm:['folder/battle1.mp3','folder/battle2.mp3','folder/battle3.mp3','folder/battle4.mp3','folder/battle5.mp3'], // バトルBGM(5曲からランダム再生。無い曲は自動で飛ばし、全部無ければ内蔵音源)
  useEmoji:false, // false=ユニット/カードは漢字一文字の表示(標準) / true にすると対応ブラウザでは絵文字表示になります
  // ショップ: 累計スコアのうち「所持スコア(累計-使用済み)」で購入。cardsは1枚の値段、maxCopiesは1種類あたりの購入上限
  shop:{maxCopies:3,
    cards:[{id:'priest',price:900},{id:'ninja',price:800},{id:'rage',price:1000},{id:'charge',price:1200},{id:'lancer',price:1400},{id:'archer',price:1500},{id:'recall',price:1500},{id:'rain',price:1600},{id:'freeze',price:1800},{id:'golem',price:2000},{id:'cannon',price:2200},{id:'meteor',price:2500},{id:'banner',price:2800},{id:'storm',price:3200},{id:'dragon',price:4000}],
    // 難易度補正: 「強化値E」(買ったカードの強さの合計)に応じてCPUを強化。CPU拠点HP +E×hpPer(最大hpMax) / CPUの追加ドロー率 E×xrPer (最大1枚/ターン)
    balance:{hpPer:.6,hpMax:10,xrPer:.0155},
    themes:[{id:'default',n:'ポップピンク',price:0,sw:["#ff4f9a", "#ffd6ec", "#b58cff"]},{id:'mint',n:'ミントソーダ',price:1000,sw:["#16b394", "#c9f5e8", "#5fa8ff"]},{id:'sunset',n:'サンセット',price:2000,sw:["#ff6a2e", "#ffdcbd", "#ff5f8a"]},{id:'grape',n:'グレープ',price:3000,sw:["#8a4dff", "#e2d4ff", "#ff6fb0"]},{id:'gold',n:'ゴールドラッシュ',price:8000,sw:["#e0a010", "#fff0c4", "#d9708a"]}]},
  ai:{rescue:1.8,pull:.45}, // CPUの迎撃: 自分に有利な相手が第三者を脅かしている時、その相手を叩く優先度(×rescue)と、そちらへ向かう引力(pull)
  score:{kill:100,baseDmg:30,coreTurn:300,elim:1000,win:3000,hp:50,speed:60,draw:500}, // スコア: 撃破/拠点へ1ダメージ/核支配1点/拠点陥落/勝利/残り拠点HP1あたり/残りラウンド1あたり/引き分け
  affection:{win:5,finish:3,flawless:2,draw:1,max:100}, // 勝利/拠点を自分で破壊した相手/拠点HP15以上で勝利/引き分け
  sisters:{
    a:{name:'夏海',role:'姉',
       imgs:{normal:'folder/sister_a.png',happy:'folder/sister_a_happy.png',sad:'folder/sister_a_sad.png'},
       lines:{
        start:['ふふん、本気で行くからね!','覚悟しなさいよ?','妹には負けないんだから!'],
        atk:['えいっ!','そこよ!','いただき!'],
        hurt:['きゃっ、やるじゃない!','まだまだ!','拠点を狙うなんて生意気ね!'],
        kill:['次はどいつ?','ふふ、当然ね!'],
        win:['やった、私の勝ち!','また挑戦してきてもいいわよ?'],
        lose:['く、悔しい…!今回だけよ?','次は負けないんだから!'],
        elim:['そんな…!','負けちゃった…']}},
    b:{name:'茉莉',role:'妹',
       imgs:{normal:'folder/sister_b.png',happy:'folder/sister_b_happy.png',sad:'folder/sister_b_sad.png'},
       lines:{
        start:['お手柔らかにお願いしますね。','お姉ちゃんには負けませんよ?','がんばります!'],
        atk:['えいっ。','ごめんなさい、行きますね。'],
        hurt:['わわっ、痛いです…','まだ大丈夫です!'],
        kill:['やりました!','ふふ、ありがとうございます。'],
        win:['勝てました…!うれしいです。','また一緒に遊びましょうね。'],
        lose:['負けちゃいました…。次は頑張ります。','強いですね…!'],
        elim:['ごめんなさい、ここまでです…','お姉ちゃん、あとはお願い…']}}
  },
  // 好感度が aff 以上でイベントが解放されます。中身はノベル形式で、folder/event_a1.js 〜 event_b4.js(姉=a / 妹=b)に書きます。
  // ノベルの設定は novel.html にまとめています。scene を指定すると別のシナリオ(folder/○○.js)を呼べます。
  events:{
    a:[{aff:10,title:'姉イベント1(仮)'},{aff:30,title:'姉イベント2(仮)'},{aff:55,title:'姉イベント3(仮)'},{aff:80,title:'姉イベント4(仮)'}],
    b:[{aff:10,title:'妹イベント1(仮)'},{aff:30,title:'妹イベント2(仮)'},{aff:55,title:'妹イベント3(仮)'},{aff:80,title:'妹イベント4(仮)'}]
  }
};

/* ===== データ ===== */
const ATTR=[{n:'火',pre:'炎',c:'#ef5b45'},{n:'草',pre:'森',c:'#4cc16f'},{n:'水',pre:'海',c:'#4a9be8'}];
const UT={
  scout:{pw:0,n:'斥候',g:'斥',e:'🏃',cost:1,atk:1,hp:2,mov:3,rng:1,d:'足が速い。核の奪取に向く。'},
  soldier:{pw:0,n:'兵士',g:'兵',e:'⚔️',cost:2,atk:2,hp:4,mov:2,rng:1,d:'バランスの取れた主力。'},
  knight:{pw:0,n:'騎兵',g:'騎',e:'🐎',cost:3,atk:3,hp:3,mov:3,rng:1,d:'高速で攻撃力が高い。'},
  guard:{pw:0,n:'守護者',g:'守',e:'🛡️',cost:3,atk:1,hp:7,mov:1,rng:1,d:'とても頑丈な壁役。'},
  mage:{pw:0,n:'魔導士',g:'魔',e:'🔮',cost:3,atk:2,hp:2,mov:1,rng:2,d:'射程2。距離2なら反撃を受けない。'},
  ninja:{pw:0.6,n:'忍者',g:'忍',e:'🗡️',cost:2,atk:3,hp:3,mov:4,rng:1,d:'超高速で駆け回る暗殺者。'},
  archer:{pw:0.6,n:'弓兵',g:'弓',e:'🏹',cost:3,atk:2,hp:3,mov:2,rng:2,d:'射程2。距離2なら反撃を受けない。'},
  dragon:{pw:3.6,n:'竜',g:'竜',e:'🐉',cost:6,atk:4,hp:8,mov:2,rng:1,d:'圧倒的な力を持つ伝説の竜。'},
  lancer:{pw:0.7,n:'槍騎兵',g:'槍',e:'🔱',cost:4,atk:4,hp:4,mov:3,rng:1,d:'騎兵の上位。突撃力が高い。'},
  cannon:{pw:0.9,n:'砲兵',g:'砲',e:'💣',cost:4,atk:3,hp:2,mov:1,rng:3,d:'射程3の砲撃。脆いので守ってあげよう。'},
  priest:{pw:1.2,n:'僧侶',g:'僧',e:'🙏',cost:2,atk:1,hp:3,mov:2,rng:1,ab:'regen',d:'自分のターン開始時、隣の味方(自身含む)のHPを2回復。'},
  golem:{pw:3,n:'ゴーレム',g:'岩',e:'🗿',cost:5,atk:2,hp:9,mov:1,rng:1,d:'動きは遅いが、とても頑丈。'},
  general:{pw:0,n:'将軍',g:'将',e:'👑',cost:5,atk:4,hp:7,mov:2,rng:1,d:'切り札となる最強ユニット。'}
};
const SP={
  buff:{pw:0,n:'鼓舞',g:'鼓',e:'💪',cost:1,t:'ally',d:'味方1体の攻撃力をこのターン+2。'},
  heal:{pw:0,n:'治癒',g:'癒',e:'💖',cost:2,t:'ally',d:'味方1体のHPを4回復。'},
  rally:{pw:0,n:'号令',g:'令',e:'🚩',cost:1,t:'ally',d:'味方1体を再行動可能にする。'},
  bolt:{pw:0,n:'属性弾',g:'弾',e:'⚡',cost:2,t:'enemy',d:'敵1体に3ダメージ(相性適用)。'},
  draw:{pw:0,n:'増援',g:'援',e:'🎴',cost:1,t:'none',d:'カードを2枚引く。'},
  meteor:{pw:0.6,n:'隕石',g:'隕',e:'☄️',cost:3,t:'enemy',d:'敵1体に6ダメージ(相性適用)。'},
  charge:{pw:0.4,n:'魔力供給',g:'供',e:'🔋',cost:0,t:'none',d:'エネルギーを2回復(上限7)。'},
  storm:{pw:0.6,n:'業火',g:'焔',e:'🌋',cost:4,t:'none',d:'敵ユニット全員に3ダメージ(相性適用)。'},
  rain:{pw:0.6,n:'恵雨',g:'雨',e:'🌧️',cost:3,t:'none',d:'味方全員のHPを3回復。'},
  rage:{pw:0.4,n:'狂化',g:'怒',e:'💢',cost:2,t:'ally',d:'味方1体の攻撃力をこのターン+4。'},
  freeze:{pw:0.7,n:'凍結',g:'凍',e:'❄️',cost:2,t:'enemy',d:'敵1体は次の自分のターン、行動できない。'},
  banner:{pw:0.7,n:'軍旗',g:'旗',e:'🏴',cost:4,t:'none',d:'味方全員の攻撃力を永続で+1。'},
  recall:{pw:1.1,n:'再招集',g:'還',e:'♻️',cost:2,t:'none',d:'捨て札のユニット1枚を手札に戻す。'},
  ward:{pw:0,n:'結界',g:'結',e:'💠',cost:2,t:'none',d:'自拠点にシールド+4。'}
};
const DECK_LIST=[['scout',4],['soldier',4],['knight',3],['guard',3],['mage',3],['general',2],['buff',2],['heal',2],['rally',2],['bolt',3],['draw',1],['ward',1]];
/* ---- アイコン: 絵文字(対応環境のみ)。非対応の環境では自動で漢字一文字に切り替わります ---- */
const Icon=(()=>{
  const cache={};let cx=null;
  try{const cv=document.createElement('canvas');cv.width=cv.height=44;cx=cv.getContext('2d');}catch(e){cx=null;}
  function ok(ch){
    if(Object.prototype.hasOwnProperty.call(cache,ch))return cache[ch];
    let r=false;
    try{
      if(cx){
        cx.clearRect(0,0,44,44);cx.font='30px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif';cx.textBaseline='top';cx.fillStyle='#000';cx.fillText(ch,3,3);
        const d=cx.getImageData(0,0,44,44).data;let ink=0,col=0;
        for(let i=0;i<d.length;i+=4){if(d[i+3]>40){ink++;if(Math.abs(d[i]-d[i+1])+Math.abs(d[i+1]-d[i+2])>40)col++;}}
        r=ink>30&&col>12; // 色つきで描画できた＝カラー絵文字に対応
      }
    }catch(e){r=false;}
    return cache[ch]=r;
  }
  return{ok,get(def){return(CONFIG.useEmoji!==false&&def.e&&ok(def.e))?{s:def.e,emo:true}:{s:def.g,emo:false};}};
})();
const DIRS=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
const R=3,BASE_HP=20,WIN_SCORE=6,MAXR=25,MAXU=6;
const BASEPOS=[{q:-3,r:0},{q:3,r:-3},{q:0,r:3}];
const key=(q,r)=>q+','+r;
const inBoard=(q,r)=>Math.max(Math.abs(q),Math.abs(r),Math.abs(q+r))<=R;
const dist=(a,b)=>(Math.abs(a.q-b.q)+Math.abs(a.q+a.r-b.q-b.r)+Math.abs(a.r-b.r))/2;
const CELLS=[];for(let q=-R;q<=R;q++)for(let r=-R;r<=R;r++)if(inBoard(q,r))CELLS.push({q,r,k:key(q,r)});
const CORE={q:0,r:0};

/* ===== ロジック ===== */
const T={fast:false};
const sleep=ms=>T.fast?Promise.resolve():new Promise(r=>setTimeout(r,ms));
const UI={fx(){},refresh(){},say(){},log(){}};
let S=null;
const L=t=>UI.log(t);
const pn=pid=>pid===0?CONFIG.player.name:CONFIG.sisters[pid===1?'a':'b'].name;
const uname=u=>ATTR[S.players[u.owner].attr].pre+'の'+UT[u.type].n;
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
/* ---- デッキ編成 ---- */
const DECK_SIZE=30;
const BASE_CAP={scout:4,soldier:4,knight:4,guard:4,mage:4,general:2,buff:3,heal:3,rally:3,bolt:4,draw:2,ward:2}; // 初期から使えるカードと、1デッキに入れられる上限
const defaultDeckMap=()=>{const m={};for(const [id,n] of DECK_LIST)m[id]=n;return m;};
const cardDef=id=>UT[id]||SP[id];
const cardPow=id=>{const p=(cardDef(id)||{}).pw;return p==null?0:p;};
const deckPower=m=>{let t=0;for(const id in m)t+=cardPow(id)*m[id];return t;};
const BASE_POWER=0; // pw=「そのカードを1枚入れたときの強さの増分(勝率pt換算)」。初期カードは0。deckPower=その合計
const capOf=(id,cards)=>BASE_CAP[id]!=null?BASE_CAP[id]:Math.min(CONFIG.shop.maxCopies,((cards||(typeof SAVE!=='undefined'&&SAVE?SAVE.cards:null)||{})[id])|0);
const deckTotal=m=>{let t=0;for(const id in m)t+=m[id]|0;return t;};
function deckValid(m,cards){
  if(!m||typeof m!=='object')return false;
  for(const id in m){if(!cardDef(id))return false;const n=m[id]|0;if(n<0||n>capOf(id,cards))return false;}
  return deckTotal(m)===DECK_SIZE;
}
function playerDeckMap(){return (typeof SAVE!=='undefined'&&SAVE&&SAVE.deck&&deckValid(SAVE.deck,SAVE.cards))?SAVE.deck:defaultDeckMap();}
function cpuBuff(E){const b=CONFIG.shop.balance;if(!(E>0))return{hp:0,xr:0};return{hp:Math.min(b.hpMax,Math.round(E*b.hpPer)),xr:Math.max(0,Math.min(1,E*b.xrPer))};}
function expandDeck(m){const d=[];for(const id in m)for(let i=0;i<(m[id]|0);i++)d.push(id);return d;}
function buildDeck(pid){return expandDeck(pid===0?playerDeckMap():defaultDeckMap());}
/* おまかせ編成: 買ったカードを、同じ種類(ユニット/呪文)の弱い初期カードと入れ替える */
function autoDeck(cards){
  const m=defaultDeckMap(),isU=id=>!!UT[id];
  const owned=[];for(const id in (cards||{})){if(BASE_CAP[id]==null&&cardDef(id)){for(let i=0;i<Math.min(CONFIG.shop.maxCopies,cards[id]|0);i++)owned.push(id);}}
  owned.sort((a,b)=>cardPow(b)-cardPow(a));
  for(const c of owned){
    const cand=Object.keys(m).filter(id=>BASE_CAP[id]!=null&&m[id]>0&&isU(id)===isU(c)&&cardPow(id)<cardPow(c)).sort((a,b)=>cardPow(a)-cardPow(b));
    if(!cand.length)continue;m[cand[0]]--;m[c]=(m[c]|0)+1;
  }
  for(const id of Object.keys(m))if(!m[id])delete m[id];
  return m;
}
function canCast(pid,id){
  const p=S.players[pid],mine=unitsOf(pid);
  if(id==='storm')return S.units.some(u=>u.owner!==pid);
  if(id==='rain')return mine.some(u=>u.hp<u.maxHp);
  if(id==='banner')return mine.length>0;
  if(id==='recall')return p.discard.some(c=>!!UT[c]);
  return true;
}
const CAST_NG={storm:'敵ユニットがいません',rain:'回復できる味方がいません',banner:'味方ユニットがいません',recall:'捨て札にユニットがありません'};
function newGame(attr,diff,prey){
  prey=prey||1;
  const at=[attr,0,0];at[prey]=(attr+1)%3;at[3-prey]=(attr+2)%3;
  S={players:[0,1,2].map(i=>({id:i,attr:at[i],hp:BASE_HP,maxHp:BASE_HP,shield:0,energy:0,maxEnergy:3,deck:shuffle(buildDeck(i)),hand:[],discard:[],score:0,alive:true,turns:0})),
     units:[],current:0,round:1,over:false,result:null,winner:null,reason:null,nid:1,diff,prey,elim:[],stats:{lost:0,killed:0},score:0,sb:{},busy:true};
  const E=Math.max(0,deckPower(playerDeckMap())-BASE_POWER);
  S.power=deckPower(playerDeckMap());S.buff=(typeof SAVE!=='undefined'&&SAVE&&SAVE.balance===false)?cpuBuff(0):cpuBuff(E);
  S.players.forEach(p=>{if(p.id>0){p.hp+=S.buff.hp;p.maxHp+=S.buff.hp;p.xr=S.buff.xr;}});
  S.players.forEach(p=>draw(p.id,4));
  return S;
}
function draw(pid,n){const p=S.players[pid],got=[];for(let i=0;i<n;i++){if(!p.deck.length){if(!p.discard.length)break;p.deck=shuffle(p.discard);p.discard=[];}const c=p.deck.pop();if(p.hand.length>=7){p.discard.push(c);continue;}p.hand.push(c);got.push(c);}return got;}
const unitsOf=pid=>S.units.filter(u=>u.owner===pid);
const unitAt=(q,r)=>S.units.find(u=>u.q===q&&u.r===r)||null;
function baseAt(q,r){for(let i=0;i<3;i++)if(S.players[i].alive&&BASEPOS[i].q===q&&BASEPOS[i].r===r)return i;return -1;}
function startTurn(pid){
  const p=S.players[pid];p.maxEnergy=Math.min(3+p.turns,7);p.energy=p.maxEnergy;p.turns++;p.aiActs=0;p.xa=(p.xa||0)+(p.xr||0);let xtra=0;while(p.xa>=1){p.xa-=1;xtra++;}draw(pid,1+xtra);
  const mine=unitsOf(pid);
  for(const u of mine){if(UT[u.type].ab==='regen'){for(const a of mine){if(dist(a,u)<=1&&a.hp<a.maxHp){const h=Math.min(2,a.maxHp-a.hp);a.hp+=h;UI.fx('heal',{u:a,n:h});}}}}
  mine.forEach(u=>{u.canMove=true;u.canAttack=true;u.bonus=0;if(u.frozen){u.canMove=false;u.canAttack=false;u.frozen=false;}});
}
function summonCells(pid){const b=BASEPOS[pid];return CELLS.filter(c=>dist(c,b)<=2&&!unitAt(c.q,c.r)&&baseAt(c.q,c.r)<0);}
function reachable(u){
  const out=new Map();out.set(key(u.q,u.r),0);let fr=[{q:u.q,r:u.r}];
  for(let d=1;d<=u.mov;d++){const nx=[];for(const c of fr)for(const [dq,dr] of DIRS){const q=c.q+dq,r=c.r+dr,k=key(q,r);if(!inBoard(q,r)||out.has(k))continue;if(unitAt(q,r)||baseAt(q,r)>=0)continue;out.set(k,d);nx.push({q,r});}fr=nx;}
  out.delete(key(u.q,u.r));return out;
}
function targetsFrom(u,pos){
  const res=[];
  for(const e of S.units){if(e.owner===u.owner)continue;const d=dist(pos,e);if(d>=1&&d<=u.rng)res.push({kind:'unit',u:e,d});}
  for(const p of S.players){if(p.id===u.owner||!p.alive)continue;const d=dist(pos,BASEPOS[p.id]);if(d>=1&&d<=u.rng)res.push({kind:'base',owner:p.id,d});}
  return res;
}
function mult(a,d){if((a+1)%3===d)return 1.5;if((d+1)%3===a)return .5;return 1;}
function calc(atk,aA,dA){const m=mult(aA,dA),v=atk*m;return Math.max(1,Math.ceil(v-1e-9));} // 端数は常に切り上げ(不利でも 3→2、5→3)
function killUnit(u,by){
  const i=S.units.indexOf(u);if(i<0)return;S.units.splice(i,1);
  if(u.owner===0)S.stats.lost++;if(by===0){S.stats.killed++;addScore('kill',CONFIG.score.kill);}
  UI.fx('die',{u,by});L(`${pn(u.owner)}の${uname(u)}が倒れた`);
}
function eliminate(pid,by){
  const p=S.players[pid];if(!p.alive)return;
  p.alive=false;p.hp=0;p.hand=[];p.shield=0;if(by===0)addScore('elim',CONFIG.score.elim);
  S.units.filter(u=>u.owner===pid).forEach(u=>killUnit(u,by));
  S.elim.push({pid,by});UI.fx('elim',{pid,by});L(`${pn(pid)}の拠点が陥落!`);
  checkEnd();
}
function addScore(k,v){if(!S||!v)return;v=Math.round(v);S.score+=v;S.sb[k]=(S.sb[k]||0)+v;}
function endGame(result,winner,reason){if(S.over)return;S.over=true;S.result=result;S.winner=winner;S.reason=reason;}
function checkEnd(){
  if(S.over)return true;const P=S.players;
  if(!P[0].alive){endGame('lose',null,'elim');return true;}
  const al=P.filter(p=>p.alive);
  if(al.length===1){endGame(al[0].id===0?'win':'lose',al[0].id,'elim');return true;}
  return false;
}
function timeEnd(){
  const v=S.players.map(p=>p.alive?p.hp+3*p.score:-1),top=Math.max(...v),lead=v.map((x,i)=>x===top?i:-1).filter(i=>i>=0);
  if(lead.length===1)endGame(lead[0]===0?'win':'lose',lead[0],'time');else endGame(lead.includes(0)?'draw':'lose',null,'time');
}
function moveUnit(u,q,r){u.q=q;u.r=r;u.canMove=false;UI.fx('move',{u});UI.refresh();}
function attackTarget(u,t){
  const me=S.players[u.owner],atk=u.atk+u.bonus;
  UI.fx('atk',{u,t});
  if(t.kind==='unit'){
    const e=t.u,ea=S.players[e.owner].attr,adv=mult(me.attr,ea),d=calc(atk,me.attr,ea);
    e.hp-=d;UI.fx('hit',{u:e,dmg:d,adv,from:u});L(`${pn(u.owner)}の${uname(u)}→${pn(e.owner)}の${uname(e)} ${d}ダメージ`);
    if(e.hp<=0)killUnit(e,u.owner);
    else if(t.d===1){const r=calc(e.atk,ea,me.attr);u.hp-=r;UI.fx('hit',{u,dmg:r,adv:mult(ea,me.attr),from:e});if(u.hp<=0)killUnit(u,e.owner);}
  }else{
    const o=S.players[t.owner],adv=mult(me.attr,o.attr),d=calc(atk,me.attr,o.attr),sh=Math.min(o.shield,d),real=d-sh;
    o.shield-=sh;o.hp=Math.max(0,o.hp-real);if(u.owner===0)addScore('base',real*CONFIG.score.baseDmg);
    UI.fx('base',{owner:t.owner,dmg:real,shield:sh,adv,from:u});L(`${pn(u.owner)}の${uname(u)}→${pn(t.owner)}の拠点 ${real}ダメージ`);
    if(o.hp<=0)eliminate(t.owner,u.owner);
  }
  u.canAttack=false;u.canMove=false;checkEnd();UI.refresh();
}
function summonUnit(pid,idx,cell){
  const p=S.players[pid],id=p.hand[idx],t=UT[id];
  p.energy-=t.cost;p.hand.splice(idx,1);p.discard.push(id);
  const u={id:S.nid++,owner:pid,type:id,q:cell.q,r:cell.r,atk:t.atk,hp:t.hp,maxHp:t.hp,mov:t.mov,rng:t.rng,canMove:false,canAttack:false,bonus:0};
  S.units.push(u);UI.fx('summon',{u});L(`${pn(pid)}が${uname(u)}を召喚`);UI.refresh();return u;
}
function spellTargets(pid,id){
  const t=SP[id].t;if(t==='ally')return unitsOf(pid);if(t==='enemy')return S.units.filter(u=>u.owner!==pid);return [];
}
function playSpell(pid,idx,target){
  const p=S.players[pid],id=p.hand[idx],sp=SP[id];
  p.energy-=sp.cost;p.hand.splice(idx,1);p.discard.push(id);
  L(`${pn(pid)}：${sp.n}`);UI.fx('spell',{pid,id,target});
  if(id==='buff'){target.bonus+=2;UI.fx('buff',{u:target});}
  else if(id==='heal'){const h=Math.min(4,target.maxHp-target.hp);target.hp+=h;UI.fx('heal',{u:target,n:h});}
  else if(id==='rally'){target.canMove=true;target.canAttack=true;UI.fx('buff',{u:target});}
  else if(id==='bolt'||id==='meteor'){const ta=S.players[target.owner].attr,d=calc(id==='meteor'?6:3,p.attr,ta);target.hp-=d;UI.fx('hit',{u:target,dmg:d,adv:mult(p.attr,ta),from:null});if(target.hp<=0)killUnit(target,pid);}
  else if(id==='draw'){const g=draw(pid,2);UI.fx('draw',{pid,n:g.length});}
  else if(id==='ward'){p.shield=Math.min(8,p.shield+4);UI.fx('ward',{pid});}
  else if(id==='rage'){target.bonus+=4;UI.fx('buff',{u:target});}
  else if(id==='freeze'){target.frozen=true;UI.fx('freeze',{u:target});}
  else if(id==='storm'){for(const e of S.units.filter(x=>x.owner!==pid)){const d=calc(3,p.attr,S.players[e.owner].attr);e.hp-=d;UI.fx('hit',{u:e,dmg:d,adv:mult(p.attr,S.players[e.owner].attr),from:null});if(e.hp<=0)killUnit(e,pid);}}
  else if(id==='rain'){for(const u of unitsOf(pid)){const h=Math.min(3,u.maxHp-u.hp);if(h>0){u.hp+=h;UI.fx('heal',{u,n:h});}}}
  else if(id==='banner'){for(const u of unitsOf(pid)){u.atk+=1;UI.fx('buff',{u});}}
  else if(id==='recall'){let k=-1;for(let j=p.discard.length-1;j>=0;j--){if(UT[p.discard[j]]){k=j;break;}}if(k>=0&&p.hand.length<7){p.hand.push(p.discard.splice(k,1)[0]);}}
  else if(id==='charge'){p.energy=Math.min(7,p.energy+2);UI.fx('charge',{pid});}
  UI.refresh();
}
function finishTurn(pid){
  const p=S.players[pid],cu=unitAt(CORE.q,CORE.r);
  if(cu&&cu.owner===pid){p.score++;if(pid===0)addScore('core',CONFIG.score.coreTurn);UI.fx('core',{pid,score:p.score});L(`${pn(pid)}が核を支配 (${p.score}/${WIN_SCORE})`);if(p.score>=WIN_SCORE){endGame(pid===0?'win':'lose',pid,'core');return;}}
  let n=pid;do{n=(n+1)%3;}while(!S.players[n].alive);
  if(n<=pid){S.round++;if(S.round>MAXR){timeEnd();return;}}
  S.current=n;
}

/* ===== CPU AI ===== */
function strength(p){return p.hp+3*p.score+2*S.units.filter(u=>u.owner===p.id).length;}
/* ---- CPUの迎撃: 自分に有利な相手が第三者を脅かしている時は、優先してそちらを叩く(第三者が放置されないように) ---- */
let _thr={};
function threatens(aid,vid){
  const k=aid+'>'+vid;if(k in _thr)return _thr[k];
  const vs=S.units.filter(v=>v.owner===vid);
  return _thr[k]=S.units.some(u=>u.owner===aid&&(dist(u,BASEPOS[vid])<=4||vs.some(v=>dist(u,v)<=u.mov+u.rng+1)));
}
function rescueOn(self,aid){
  const me=S.players[self],t=S.players[aid];if(!t||!t.alive||mult(me.attr,t.attr)<=1)return false;
  const other=S.players.find(p=>p.alive&&p.id!==self&&p.id!==aid);return !!other&&threatens(aid,other.id);
}
function ownerW(tOwner,self){
  const ss=S.players.filter(p=>p.alive&&p.id!==self);if(ss.length<2)return 1;
  const a=strength(ss[0]),b=strength(ss[1]);let w=(tOwner===ss[0].id?a>=b:b>=a)?1.15:1;
  if(rescueOn(self,tOwner))w*=CONFIG.ai.rescue;
  return w;
}
function posValue(u,pos){
  const me=S.players[u.owner];let v=0;
  const onCore=pos.q===CORE.q&&pos.r===CORE.r,cu=unitAt(CORE.q,CORE.r);
  if(onCore)v+=3;else if(!(cu&&cu.owner===u.owner&&cu!==u))v-=.35*dist(pos,CORE);
  for(const p of S.players){
    if(!p.alive||p.id===u.owner)continue;
    const prey=mult(me.attr,p.attr)>1;
    v-=(prey?.45:.2)*dist(pos,BASEPOS[p.id])*(u.atk>=2?1:.5);
  }
  for(const e of S.units){
    if(e.owner===u.owner)continue;const d=dist(pos,e),ea=S.players[e.owner].attr;
    if(rescueOn(u.owner,e.owner))v-=CONFIG.ai.pull*Math.min(d,8)*(u.atk>=2?1:.5);
    if(mult(ea,me.attr)>1&&d<=e.mov+e.rng)v-=.9*calc(e.atk,ea,me.attr)*.6;
    else if(d<=1)v-=.3;
    if(dist(e,BASEPOS[u.owner])<=3)v-=.5*d;
  }
  return v;
}
function attackValue(u,t,bonus){
  const me=S.players[u.owner],atk=u.atk+u.bonus+bonus;let v=0;
  if(t.kind==='base'){
    const o=S.players[t.owner],d=calc(atk,me.attr,o.attr),real=Math.max(0,d-o.shield);
    v=real*1.3+(real>=o.hp?100:0)+(o.hp-real<=8?1.5:0)+.5;return v*ownerW(t.owner,u.owner);
  }
  const e=t.u,ea=S.players[e.owner].attr,d=calc(atk,me.attr,ea),dealt=Math.min(d,e.hp),kill=d>=e.hp;
  v=dealt+(kill?3+UT[e.type].cost*1.5:0);
  if(!kill&&t.d===1){const r=calc(e.atk,ea,me.attr);v-=Math.min(r,u.hp)*.9;if(r>=u.hp)v-=3+UT[u.type].cost*1.5;}
  if(dist(e,BASEPOS[u.owner])<=2)v+=1.5;
  return v*ownerW(e.owner,u.owner);
}
function unitOptions(u,o){
  o=o||{};const canMove=o.force||u.canMove,canAtk=o.force||u.canAttack,bonus=o.bonus||0,list=[];
  const origins=[{q:u.q,r:u.r,mv:null}];
  if(canMove)for(const k of reachable(u).keys()){const [q,r]=k.split(',').map(Number);origins.push({q,r,mv:{q,r}});}
  for(const org of origins){
    const pv=posValue(u,org);list.push({u,mv:org.mv,at:null,val:pv});
    if(canAtk)for(const t of targetsFrom(u,org))list.push({u,mv:org.mv,at:t,val:pv+attackValue(u,t,bonus)});
  }
  return list;
}
function bestAttackGain(u,o){const idle=posValue(u,u);let b=0;for(const x of unitOptions(u,o)){if(x.at)b=Math.max(b,x.val-idle);}return b;}
function summonValue(pid,id,c){
  const ut=UT[id],me=S.players[pid];let v=2+ut.cost*.45-dist(c,CORE)*.25;
  for(const e of S.units){if(e.owner===pid)continue;if(mult(S.players[e.owner].attr,me.attr)>1&&dist(c,e)<=e.mov+e.rng)v-=.6;}
  if(id==='scout')v-=.5;if(id==='general')v+=1;if(c.q===0&&c.r===0)v+=1;return v;
}
function spellCands(pid,id,i,cand){
  const me=S.players[pid],mine=unitsOf(pid),en=S.units.filter(e=>e.owner!==pid);
  if(id==='buff'){for(const u of mine){if(!u.canAttack)continue;const g=bestAttackGain(u,{bonus:2})-bestAttackGain(u,{});if(g>1)cand.push({type:'spell',pid,idx:i,target:u,val:g-.3});}}
  else if(id==='rally'){for(const u of mine){if(u.canMove&&u.canAttack)continue;const g=bestAttackGain(u,{force:true});if(g>1.5)cand.push({type:'spell',pid,idx:i,target:u,val:g*.9-.4});}}
  else if(id==='heal'){for(const u of mine){const m=u.maxHp-u.hp;if(m>=3)cand.push({type:'spell',pid,idx:i,target:u,val:Math.min(4,m)*.7+(u.hp<=2?2:0)-.1});}}
  else if(id==='bolt'||id==='meteor'){const dm=id==='meteor'?6:3;for(const e of en){const d=calc(dm,me.attr,S.players[e.owner].attr),dealt=Math.min(d,e.hp),kill=d>=e.hp;cand.push({type:'spell',pid,idx:i,target:e,val:dealt*.9+(kill?3+UT[e.type].cost*1.5:0)-.6-(id==='meteor'?.9:0)});}}
  else if(id==='rage'){for(const u of mine){if(!u.canAttack)continue;const g=bestAttackGain(u,{bonus:4})-bestAttackGain(u,{});if(g>1.2)cand.push({type:'spell',pid,idx:i,target:u,val:g-.7});}}
  else if(id==='freeze'){for(const e of en){const th=e.atk*.55+(dist(e,BASEPOS[pid])<=4?1.6:0)+(dist(e,CORE)<=2?.8:0)+UT[e.type].cost*.3;cand.push({type:'spell',pid,idx:i,target:e,val:th-.4});}}
  else if(id==='storm'){let v=0,k=0;for(const e of en){const d=calc(3,me.attr,S.players[e.owner].attr);v+=Math.min(d,e.hp)*.55+(d>=e.hp?2+UT[e.type].cost:0);k++;}if(k>=2)cand.push({type:'spell',pid,idx:i,target:null,val:v-1.2});}
  else if(id==='rain'){let m=0;for(const u of mine)m+=Math.min(3,u.maxHp-u.hp);if(m>=4)cand.push({type:'spell',pid,idx:i,target:null,val:m*.5-.4});}
  else if(id==='banner'){if(mine.length>=2)cand.push({type:'spell',pid,idx:i,target:null,val:mine.length*1.1-.8});}
  else if(id==='charge'){const oth=me.hand.filter((c,j)=>j!==i&&cardDef(c).cost>me.energy&&cardDef(c).cost<=me.energy+2);if(oth.length)cand.push({type:'spell',pid,idx:i,target:null,val:2.4});}
  else if(id==='recall'){if(me.discard.some(c=>!!UT[c])&&me.hand.length<=5)cand.push({type:'spell',pid,idx:i,target:null,val:1.7});}
  else if(id==='draw'){if(me.hand.length<=5)cand.push({type:'spell',pid,idx:i,target:null,val:1.6});}
  else if(id==='ward'){const near=en.some(e=>dist(e,BASEPOS[pid])<=3);cand.push({type:'spell',pid,idx:i,target:null,val:near?2.4:(me.shield<4?.5:.1)});}
}
function aiNextAction(pid){
  _thr={};
  const p=S.players[pid],noise=[2.2,.6,0][S.diff]||0,cand=[];
  if(unitsOf(pid).length<MAXU){
    const cells=summonCells(pid);
    p.hand.forEach((id,i)=>{const ut=UT[id];if(!ut||ut.cost>p.energy)return;for(const c of cells)cand.push({type:'summon',pid,idx:i,cell:c,val:summonValue(pid,id,c)});});
  }
  p.hand.forEach((id,i)=>{const sp=SP[id];if(!sp||sp.cost>p.energy)return;spellCands(pid,id,i,cand);});
  unitsOf(pid).forEach(u=>{
    if(!u.canMove&&!u.canAttack)return;
    const idle=posValue(u,u);let best=null;
    for(const o of unitOptions(u)){if(!o.mv&&!o.at)continue;const g=o.val-idle;if(!best||g>best.g)best={...o,g};}
    if(best&&best.g>.2)cand.push({type:'unit',pid,u,mv:best.mv,at:best.at,val:best.g+(best.at?1:0)});
  });
  if(!cand.length)return null;
  const acts=p.aiActs||0; // 今ターンの行動数。かんたんでも、最低1回は必ず動く(棒立ち防止)
  if(S.diff===0&&acts>0&&Math.random()<.12)return null;
  cand.forEach(c=>c.s=c.val+(Math.random()*2-1)*noise);
  cand.sort((a,b)=>b.s-a.s);
  if(cand[0].s<.25&&acts>0)return null;
  p.aiActs=acts+1;return cand[0];
}
async function applyAction(a){
  const pid=a.pid;
  if(a.type==='summon')summonUnit(pid,a.idx,a.cell);
  else if(a.type==='spell')playSpell(pid,a.idx,a.target);
  else if(a.type==='unit'){
    if(a.mv){moveUnit(a.u,a.mv.q,a.mv.r);if(a.at)await sleep(380);}
    if(a.at&&!S.over&&S.units.includes(a.u))attackTarget(a.u,a.at);
  }
}
/*LOGIC_END*/

/* ===== UI ===== */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const SAVE_KEY='sangoku_ban_save_v1';
/* totalScore = 全ゲームの累計スコア(のちに「お金」として使う予定。SAVE.totalScore をそのまま通貨として扱えます) */
const defSave=()=>({aff:{a:0,b:0},seen:{},st:{w:0,l:0,d:0},bgm:.5,sfx:.7,last:{attr:0,diff:1,prey:1},totalScore:0,bestScore:0,prologue:false,spent:0,cards:{},themes:{},theme:'default',deck:null,balance:true});
let SAVE=(()=>{try{return Object.assign(defSave(),JSON.parse(localStorage.getItem(SAVE_KEY)||'{}'));}catch(e){return defSave();}})();
function applyTheme(id){document.documentElement.setAttribute('data-theme',id||'default');}
applyTheme(SAVE.theme);
function wallet(){return Math.max(0,(SAVE.totalScore||0)-(SAVE.spent||0));} /* 所持スコア = 累計スコア - 使用済み */
const persist=()=>{try{localStorage.setItem(SAVE_KEY,JSON.stringify(SAVE));}catch(e){}};
function fit(){const s=Math.min(innerWidth/1280,innerHeight/720),st=$('#stage');st.style.transform=`translate(${(innerWidth-1280*s)/2}px,${(innerHeight-720*s)/2}px) scale(${s})`;}
addEventListener('resize',fit);fit();

/* ---- 合成サウンド ---- */
const Snd=(()=>{
  let ctx=null,mst,sfxG,bgmG,mode=null,step=0,next=0;const vol={bgm:.5,sfx:.7};let tmp3=null,tmp3ok=false,want=null;let bPool=null,bCur=null,bLast=null,bState='idle';
  const mtof=m=>440*Math.pow(2,(m-69)/12);
  function init(){apply();
    if(ctx){if(ctx.state==='suspended')ctx.resume();return;}
    try{ctx=new(window.AudioContext||window.webkitAudioContext)();}catch(e){ctx=null;return;}
    mst=ctx.createGain();mst.gain.value=.8;mst.connect(ctx.destination);
    sfxG=ctx.createGain();sfxG.connect(mst);bgmG=ctx.createGain();bgmG.connect(mst);setVol();
    setInterval(sched,100);
  }
  function setVol(b,s){if(b!=null)vol.bgm=b;if(s!=null)vol.sfx=s;if(tmp3)tmp3.volume=Math.min(1,vol.bgm);if(bCur)bCur.volume=Math.min(1,vol.bgm);if(!ctx)return;sfxG.gain.value=vol.sfx;bgmG.gain.value=vol.bgm*.35;}
  function tone(f,d,type,v,o){
    if(!ctx)return;o=o||{};const t=ctx.currentTime+(o.delay||0),os=ctx.createOscillator(),g=ctx.createGain();
    os.type=type||'sine';os.frequency.setValueAtTime(f,t);
    if(o.slide)os.frequency.exponentialRampToValueAtTime(Math.max(20,f+o.slide),t+d);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v||.2,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+d);
    os.connect(g);g.connect(o.dest||sfxG);os.start(t);os.stop(t+d+.03);
  }
  function noise(d,v,f,o){
    if(!ctx)return;o=o||{};const t=ctx.currentTime+(o.delay||0),n=Math.floor(ctx.sampleRate*d),b=ctx.createBuffer(1,n,ctx.sampleRate),a=b.getChannelData(0);
    for(let i=0;i<n;i++)a[i]=Math.random()*2-1;
    const s=ctx.createBufferSource();s.buffer=b;const fl=ctx.createBiquadFilter();fl.type=o.type||'lowpass';fl.frequency.value=f;
    const g=ctx.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);
    s.connect(fl);fl.connect(g);g.connect(o.dest||sfxG);s.start(t);
  }
  const BG={title:{bpm:76,roots:[57,53,60,55],arp:[0,7,12,7,15,12,7,3],lead:'triangle',every:2},
            battle:{bpm:112,roots:[57,53,48,55],arp:[0,3,7,12,7,3,10,7],lead:'square',every:1}};
  function sched(){
    if(!ctx||!mode)return;const c=BG[mode],sd=60/c.bpm/2;
    if(next<ctx.currentTime)next=ctx.currentTime+.05;
    while(next<ctx.currentTime+.35){
      const bar=Math.floor(step/8)%c.roots.length,i=step%8,root=c.roots[bar],t=next-ctx.currentTime;
      if(i%c.every===0)tone(mtof(root+12+c.arp[i]),sd*1.6,c.lead,c.lead==='square'?.05:.09,{delay:t,dest:bgmG});
      if(i===0||(mode==='battle'&&i===4))tone(mtof(root-12),sd*3,'sine',.3,{delay:t,dest:bgmG});
      if(mode==='battle'&&i%2===1)noise(.04,.06,7000,{delay:t,dest:bgmG,type:'highpass'});
      step++;next+=sd;
    }
  }
  function loadTitle(){
    if(!CONFIG.titleBgm)return;
    tmp3=new Audio(CONFIG.titleBgm);tmp3.loop=true;tmp3.preload='auto';tmp3.volume=Math.min(1,vol.bgm);
    tmp3.addEventListener('canplay',()=>{tmp3ok=true;apply();});
    tmp3.addEventListener('error',()=>{tmp3ok=false;tmp3=null;apply();});
  }
  /* ---- バトルBGM: CONFIG.battleBgm の中からランダム再生。曲が終わったら次のランダム曲へ ---- */
  function stopB(){if(bCur){const a=bCur;bCur=null;try{a.pause();}catch(e){}}}
  function pickBattle(){
    if(want!=='battle')return;
    if(!bPool)bPool=(CONFIG.battleBgm||[]).slice();
    if(!bPool.length){bState='none';stopB();apply();return;}
    let c=bPool.filter(x=>x!==bLast);if(!c.length)c=bPool;
    const src=c[Math.floor(Math.random()*c.length)];bLast=src;
    stopB();
    const a=new Audio();a.preload='auto';a.volume=Math.min(1,vol.bgm);bCur=a;bState='try';
    a.addEventListener('error',()=>{bPool=(bPool||[]).filter(x=>x!==src);if(bCur!==a)return;bCur=null;pickBattle();});
    a.addEventListener('ended',()=>{if(bCur!==a)return;pickBattle();});
    a.addEventListener('playing',()=>{if(bCur===a)bState='ok';});
    a.src=src;const p=a.play();if(p&&p.catch)p.catch(()=>{});
  }
  function shuffleBattle(){if(want==='battle'){bState='idle';apply();}}
  function apply(){
    const useMp3=want==='title'&&tmp3ok&&tmp3;
    if(tmp3){if(useMp3){const p=tmp3.play();if(p&&p.catch)p.catch(()=>{});}else{tmp3.pause();if(want!=='title')tmp3.currentTime=0;}}
    if(want==='battle'){
      if(bState==='idle')pickBattle();
      else if(bCur&&bCur.paused&&bState!=='none'){const p=bCur.play();if(p&&p.catch)p.catch(()=>{});}
    }else if(bState!=='idle'){stopB();bState='idle';}
    const useB=want==='battle'&&bState!=='none'; // 読み込み中は無音。全曲だめなら内蔵音源にフォールバック
    const nm=(useMp3||useB)?null:want;if(nm!==mode){mode=nm;step=0;next=0;}
  }
  function bgm(m){want=m;apply();}
  const sfx={
    click(){tone(880,.05,'square',.1);},
    select(){tone(520,.07,'triangle',.2);tone(780,.08,'triangle',.18,{delay:.05});},
    err(){tone(150,.14,'square',.15);},
    turn(){tone(660,.1,'sine',.2);tone(880,.16,'sine',.2,{delay:.1});},
    summon(){tone(300,.28,'sawtooth',.14,{slide:500});tone(900,.2,'sine',.15,{delay:.13});noise(.2,.08,3000,{type:'highpass'});},
    move(){noise(.12,.12,800);tone(200,.1,'sine',.1);},
    hit(){noise(.15,.3,1800);tone(160,.15,'square',.18,{slide:-90});},
    crit(){noise(.18,.35,2400);tone(180,.18,'square',.2,{slide:-90});tone(1200,.12,'square',.1,{slide:-600,delay:.02});},
    weak(){tone(220,.12,'sine',.15);noise(.08,.1,900);},
    baseHit(){noise(.3,.4,900);tone(90,.3,'sawtooth',.25,{slide:-50});},
    guard(){tone(500,.25,'sine',.2);tone(750,.25,'triangle',.15,{delay:.04});},
    die(){tone(400,.4,'sawtooth',.13,{slide:-300});noise(.3,.18,600);},
    heal(){[600,800,1000].forEach((f,i)=>tone(f,.16,'sine',.18,{delay:i*.09}));},
    spell(){tone(700,.3,'triangle',.18,{slide:700});tone(1400,.2,'sine',.1,{delay:.15});},
    core(){[523,659,784].forEach((f,i)=>tone(f,.2,'triangle',.2,{delay:i*.08}));},
    win(){[523,659,784,1047,784,1047].forEach((f,i)=>tone(f,.28,'triangle',.22,{delay:i*.14}));},
    lose(){[392,349,311,262].forEach((f,i)=>tone(f,.4,'sawtooth',.12,{delay:i*.22}));},
    draw(){tone(500,.08,'triangle',.15);tone(700,.08,'triangle',.15,{delay:.08});}
  };
  loadTitle();
  return{init,setVol,bgm,sfx,vol,shuffleBattle};
})();
document.addEventListener('pointerdown',()=>Snd.init());
(function(){const d=document.getElementById('deco');if(!d)return;const ch=['♡','✦','★','♥','✿'],co=['#ff7fbd','#ffd23a','#7fd0ff','#b58cff','#fff'];
for(let i=0;i<18;i++){const e=document.createElement('span');e.textContent=ch[i%ch.length];
e.style.cssText=`left:${Math.random()*100}%;--s:${14+Math.random()*26}px;--c:${co[i%co.length]};--d:${7+Math.random()*7}s;--dl:${-Math.random()*12}s`;d.appendChild(e);}})();
Snd.setVol(SAVE.bgm,SAVE.sfx);

/* ---- 共通UI ---- */
function show(id){$$('.screen').forEach(e=>e.classList.add('hidden'));$('#'+id).classList.remove('hidden');Snd.bgm(id==='game'?'battle':'title');}
function openModal(html,cls){const m=$('#modal');m.innerHTML=`<div class="mbox ${cls||''}">${html}</div>`;m.classList.remove('hidden');}
function closeModal(){$('#modal').classList.add('hidden');$('#modal').innerHTML='';}
let toastT;
function toast(t,ms){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>e.classList.remove('on'),ms||1600);}
function banner(t,c){const b=$('#banner');b.textContent=t;b.style.setProperty('--ac',c);b.classList.remove('on');void b.offsetWidth;b.classList.add('on');}
function portErr(img,key){const n=CONFIG.sisters[key].imgs.normal;if(!img.dataset.f&&!img.src.endsWith(n)){img.dataset.f=1;img.src=n;}else img.remove();}
function portInner(key,mood){const s=CONFIG.sisters[key];return `<img src="${s.imgs[mood]||s.imgs.normal}" alt="" onload="this.parentNode.classList.add('ok')" onerror="portErr(this,'${key}')"><span class="pf">${s.role}</span>`;}
function portrait(key,cls,id){return `<div class="portrait live ${cls||''}" data-key="${key}" ${id?`id="${id}"`:''}>${portInner(key,'normal')}</div>`;}
function setMood(key,mood){$$(`#game .portrait[data-key=${key}]`).forEach(p=>{p.classList.remove('ok');p.innerHTML=portInner(key,mood);});}

/* ---- タイトル ---- */
function bootTitle(){
  $('#tp-a').innerHTML=portrait('a','cut');$('#tp-b').innerHTML=portrait('b','cut');
}
$('#b-shop').onclick=()=>{Snd.sfx.click();shopTab='cards';renderShop();show('shop');};
/* プロローグ(novel.html)へ。http(s)で開いている場合は先に存在確認し、404なら探した場所を表示します */
function openNovel(scene){
  const q='?scene='+encodeURIComponent(scene||'prologue');
  const cands=[NOVEL_FILE,'novel/novel.html','story/novel.html'].filter((v,i,a)=>a.indexOf(v)===i);
  if(!/^https?:$/.test(location.protocol)){location.href=cands[0]+q;return;}
  (async()=>{
    for(const c of cands){try{const r=await fetch(c,{method:'HEAD',cache:'no-store'});if(r.ok){location.href=c+q;return;}}catch(e){}}
    alert('ノベル用の novel.html が見つかりません(404)。\nindex.html と同じフォルダに novel.html を置いてください。\n\n探した場所:\n'+cands.map(c=>new URL(c,location.href).href).join('\n'));
  })();
}
$('#b-pro').onclick=()=>{Snd.sfx.click();persist();setTimeout(()=>openNovel('prologue'),120);};
$('#b-free').onclick=()=>{Snd.sfx.click();renderSelect();show('select');};
$('#b-aff').onclick=()=>{Snd.sfx.click();renderAff();show('affection');};
$('#b-rule').onclick=()=>{Snd.sfx.click();openRules();};
$('#b-set').onclick=()=>{Snd.sfx.click();openSettings();};
$('#a-back').onclick=()=>{Snd.sfx.click();show('title');};
$('#s-back').onclick=()=>{Snd.sfx.click();show('title');};

/* ---- フリーモード設定 ---- */
let selAttr=SAVE.last.attr,selDiff=SAVE.last.diff,selPrey=SAVE.last.prey||1;
const FLAV=['燃え盛る炎の軍勢。','大地に根ざす森の軍勢。','静かに満ちる海の軍勢。'];
function renderSelect(){
  $('#attrcards').innerHTML=ATTR.map((a,i)=>`<div class="acard ${i===selAttr?'on':''}" data-i="${i}" style="--ac:${a.c}"><div class="big">${a.n}</div><div class="nm">${a.pre}の軍勢</div><p>${FLAV[i]}</p><div class="rel">${a.n}は ${ATTR[(i+1)%3].n} に強く、${ATTR[(i+2)%3].n} に弱い</div></div>`).join('');
  $('#preyrow').innerHTML=[1,2].map(i=>`<button class="seg ${i===selPrey?'on':''}" data-i="${i}">${CONFIG.sisters[i===1?'a':'b'].role}(${CONFIG.sisters[i===1?'a':'b'].name})に有利</button>`).join(' ');
  const at=[selAttr,0,0];at[selPrey]=(selAttr+1)%3;at[3-selPrey]=(selAttr+2)%3;
  $('#vsinfo').innerHTML=[1,2].map(i=>{const s=CONFIG.sisters[i===1?'a':'b'],a=ATTR[at[i]],rel=mult(selAttr,at[i])>1?'あなたが有利':'あなたが不利';
    return `<div class="vsc" style="border-color:${a.c}"><b style="color:${a.c}">${s.role} ${s.name}　${a.n}属性</b><br>${rel}（${mult(selAttr,at[i])>1?'相手に×1.5 / 相手から×0.5':'相手に×0.5 / 相手から×1.5'}）</div>`;}).join('');
  {
    const dm=playerDeckMap(),custom=!!(SAVE.deck&&deckValid(SAVE.deck,SAVE.cards)),E=Math.max(0,deckPower(dm)),bf=cpuBuff(E),on=SAVE.balance!==false;
    $('#deckinfo').innerHTML=`<span>デッキ<b>${custom?'カスタム':'初期デッキ'}</b></span><span>強化値<b>${E.toFixed(1)}</b></span><span>強さ補正<button class="seg ${on?'on':''}" data-b="1">ON</button><button class="seg ${on?'':'on'}" data-b="0">OFF</button></span><span class="bf">${E>0?(on?`CPU: 拠点HP+${bf.hp} / 追加ドロー${Math.round(bf.xr*100)}%`:'補正なし(CPUは通常のまま)'):'補正なし'}</span><button class="btn sm lav" id="s-deck">デッキ編成</button>`;
  }
  $('#diff').innerHTML=['かんたん','ふつう','むずかしい'].map((d,i)=>`<button class="seg ${i===selDiff?'on':''}" data-i="${i}">${d}</button>`).join(' ');
}
$('#attrcards').onclick=e=>{const c=e.target.closest('.acard');if(!c)return;selAttr=+c.dataset.i;Snd.sfx.select();renderSelect();};
$('#preyrow').onclick=e=>{const c=e.target.closest('.seg');if(!c)return;selPrey=+c.dataset.i;Snd.sfx.select();renderSelect();};
$('#diff').onclick=e=>{const c=e.target.closest('.seg');if(!c)return;selDiff=+c.dataset.i;Snd.sfx.select();renderSelect();};
$('#deckinfo').onclick=e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.id==='s-deck'){Snd.sfx.click();openDeck('select');return;}
  if(b.dataset.b!=null){SAVE.balance=b.dataset.b==='1';persist();Snd.sfx.select();renderSelect();}
};
$('#s-start').onclick=()=>{Snd.sfx.click();startGame();};

/* ---- 盤面 ---- */
const HS=40,NS='http://www.w3.org/2000/svg';
const px=(q,r)=>({x:HS*Math.sqrt(3)*(q+r/2),y:HS*1.5*r});
function hexPts(cx,cy,s){let p=[];for(let i=0;i<6;i++){const a=(60*i-30)*Math.PI/180;p.push((cx+s*Math.cos(a)).toFixed(1)+','+(cy+s*Math.sin(a)).toFixed(1));}return p.join(' ');}
function el(tag,at,parent){const e=document.createElementNS(NS,tag);for(const k in at)e.setAttribute(k,at[k]);if(parent)parent.appendChild(e);return e;}
let gCells,gBases,gUnits,gFx;const cellEls=new Map(),unitEls=new Map(),baseEls=[];
let sel=null;
function buildBoard(){
  const svg=$('#board');svg.innerHTML='';svg.setAttribute('viewBox','-250 -228 500 456');
  cellEls.clear();unitEls.clear();baseEls.length=0;
  gCells=el('g',{},svg);gBases=el('g',{},svg);gUnits=el('g',{},svg);gFx=el('g',{},svg);
  for(const c of CELLS){
    const {x,y}=px(c.q,c.r),core=c.q===0&&c.r===0,g=el('g',{class:'cell'+(core?' core':''),'data-k':c.k},gCells);
    el('polygon',{points:hexPts(x,y,HS-1.5)},g);cellEls.set(c.k,g);
    if(core){const t=el('text',{class:'corelab',x,y:y+8},g);t.textContent='核';}
  }
  BASEPOS.forEach((b,i)=>{
    const {x,y}=px(b.q,b.r),a=ATTR[S.players[i].attr],g=el('g',{class:'base','data-base':i,transform:`translate(${x},${y})`},gBases);
    el('polygon',{class:'bp',points:hexPts(0,0,HS-1),fill:a.c+'55',stroke:a.c},g);
    el('polygon',{class:'shd',points:hexPts(0,0,HS+3),style:'display:none'},g);
    const bi=Icon.get({g:'城',e:'🏰'});const t=el('text',bi.emo?{y:1,'font-size':25,fill:'#000',class:'emo'}:{y:-2,'font-size':20,fill:'#fff'},g);t.textContent=bi.s;
    const h=el('text',{y:17,'font-size':13,fill:'#fff'},g);g._hp=h;g._shd=g.querySelector('.shd');
    baseEls[i]=g;
  });
}
function makeUnitEl(u){
  const g=el('g',{class:'unit','data-unit':u.id},gUnits),a=ATTR[S.players[u.owner].attr];
  el('circle',{class:'ring',r:HS*.72},g);
  const tok=el('g',{class:'tok'},g);
  el('circle',{r:HS*.58,fill:a.c,stroke:u.owner===0?'#fff':'#8a2b66','stroke-width':3},tok);
  const img=el('image',{href:`folder/unit_${u.type}.png`,x:-HS*.58,y:-HS*.58,width:HS*1.16,height:HS*1.16,style:'clip-path:circle(50%)'},tok);
  img.addEventListener('error',()=>img.remove());
  const ic=Icon.get(UT[u.type]);const t=el('text',{class:ic.emo?'glyph emo':'glyph',y:ic.emo?10:8},tok);t.textContent=ic.s;
  el('circle',{class:'bdg',cx:-HS*.5,cy:HS*.45,r:11},tok);el('circle',{class:'bdg',cx:HS*.5,cy:HS*.45,r:11,style:'fill:#7a1830'},tok);
  g._atk=el('text',{class:'bdt',x:-HS*.5,y:HS*.45+4},tok);g._hp=el('text',{class:'bdt',x:HS*.5,y:HS*.45+4},tok);
  return g;
}
function syncUnits(){
  if(!S)return;const ids=new Set(S.units.map(u=>u.id));
  for(const u of S.units){
    let g=unitEls.get(u.id);const {x,y}=px(u.q,u.r);
    if(!g){g=makeUnitEl(u);unitEls.set(u.id,g);g.style.transform=`translate(${x}px,${y}px)`;g.classList.add('born');setTimeout(()=>g.classList.remove('born'),500);}
    g.style.transform=`translate(${x}px,${y}px)`;
    g._atk.textContent=u.atk+u.bonus;g._hp.textContent=Math.max(0,u.hp);
    g.classList.toggle('done',u.owner===0&&S.current===0&&!u.canMove&&!u.canAttack);g.classList.toggle('frz',!!u.frozen);
  }
  for(const [id,g] of [...unitEls]){if(!ids.has(id)){g.classList.add('dying');unitEls.delete(id);setTimeout(()=>g.remove(),520);}}
  S.players.forEach((p,i)=>{const b=baseEls[i];if(!b)return;b._hp.textContent=p.alive?p.hp:'×';b._shd.style.display=p.shield>0?'block':'none';b.style.opacity=p.alive?1:.25;});
}
function computeSel(){
  if(!sel)return;
  if(sel.mode==='unit'){const u=sel.u;sel.mv=u.canMove?new Set(reachable(u).keys()):new Set();sel.targets=u.canAttack?targetsFrom(u,u):[];}
  else if(sel.mode==='summon')sel.sm=new Set(summonCells(0).map(c=>c.k));
}
function refreshBoard(){
  cellEls.forEach(g=>g.classList.remove('mv','sm'));unitEls.forEach(g=>g.classList.remove('tg','sel'));baseEls.forEach(g=>g.classList.remove('tg'));
  if(!sel)return;
  if(sel.mode==='unit'&&(!S.units.includes(sel.u)||(!sel.u.canMove&&!sel.u.canAttack))){sel=null;return;}
  computeSel();
  if(sel.mode==='unit'){
    sel.mv.forEach(k=>cellEls.get(k)&&cellEls.get(k).classList.add('mv'));
    sel.targets.forEach(t=>{if(t.kind==='unit'){const g=unitEls.get(t.u.id);g&&g.classList.add('tg');}else baseEls[t.owner].classList.add('tg');});
    const g=unitEls.get(sel.u.id);g&&g.classList.add('sel');
  }else if(sel.mode==='summon')sel.sm.forEach(k=>cellEls.get(k).classList.add('mv','sm'));
  else if(sel.mode==='spell')sel.tg.forEach(id=>{const g=unitEls.get(id);g&&g.classList.add('tg');});
}
function floatAt(q,r,txt,col){const {x,y}=px(q,r),t=el('text',{x,y:y-6,fill:col,class:'float'},gFx);t.textContent=txt;setTimeout(()=>t.remove(),1000);}

/* ---- パネル ---- */
function buildPanels(){
  const A=ATTR[S.players[0].attr];
  $('#left').innerHTML=`<div class="pnl" id="pn0" style="--ac:${A.c}"><div class="ph"><span class="attrb">${A.n}</span><b>${CONFIG.player.name}</b></div>
   <div class="hpbar"><i id="hp0"></i><span id="hpt0"></span></div>
   <div class="row"><span>エネルギー</span><span id="en0"></span></div>
   <div class="row"><span>核</span><span id="sc0"></span></div><div class="row sm" id="cnt0"></div></div>
   <div class="pnl" id="info"></div><div class="pnl" id="log" style="flex:1"></div>`;
  $('#right').innerHTML=[1,2].map(i=>{const k=i===1?'a':'b',s=CONFIG.sisters[k],a=ATTR[S.players[i].attr];
    return `<div class="pnl sis" id="pn${i}" style="--ac:${a.c}">${portrait(k)}<div class="bubble" id="bb${i}"></div>
     <div class="ph"><span class="attrb">${a.n}</span><b>${s.role} ${s.name}</b></div>
     <div class="hpbar"><i id="hp${i}"></i><span id="hpt${i}"></span></div>
     <div class="row"><span>核</span><span id="sc${i}"></span></div><div class="row sm" id="cnt${i}"></div></div>`;}).join('');
  $('#chips').innerHTML=S.players.map((p,i)=>`<span class="chip" id="chip${i}" style="--ac:${ATTR[p.attr].c}">${i===0?CONFIG.player.name:CONFIG.sisters[i===1?'a':'b'].name}（${ATTR[p.attr].n}）</span>`).join('');
  $('#info').innerHTML=defaultInfo();
}
const defaultInfo=()=>`<b>属性相性</b><br>火 ➜ 草 ➜ 水 ➜ 火<br>有利 ×1.5 / 不利 ×0.5（端数切り上げ）<br><span style="opacity:.7">ユニットにカーソルを合わせると詳細を表示</span>`;
function unitInfo(u){
  const a=ATTR[S.players[u.owner].attr],t=UT[u.type],m=u.owner===0?null:mult(S.players[0].attr,S.players[u.owner].attr);
  return `<b style="color:${a.c}">${uname(u)}</b>（${pn(u.owner)}）<br>攻${u.atk+u.bonus} 体${u.hp}/${u.maxHp} 移${u.mov}${u.rng>1?' 射'+u.rng:''}<br>${t.d}`+(u.frozen?'<br><b>【凍結中】次のターン行動できません</b>':'')+(m?`<br>あなたの攻撃: ×${m}`:'');
}
function updatePanels(){
  if(!S)return;
  S.players.forEach((p,i)=>{
    const pn_=$('#pn'+i);if(!pn_)return;
    pn_.classList.toggle('act',S.current===i&&!S.over&&p.alive);pn_.classList.toggle('dead',!p.alive);
    $('#hp'+i).style.width=(100*p.hp/p.maxHp)+'%';$('#hpt'+i).textContent=`拠点 ${p.hp}/${p.maxHp}`+(p.shield?`  結界+${p.shield}`:'');
    $('#sc'+i).innerHTML=Array.from({length:WIN_SCORE},(_,k)=>`<span class="pip ${k<p.score?'on':''}"></span>`).join('');
    $('#cnt'+i).textContent=`ユニット ${unitsOf(i).length}/${MAXU}　手札 ${p.hand.length}　山札 ${p.deck.length}`;
    const c=$('#chip'+i);c.classList.toggle('on',S.current===i&&!S.over);c.classList.toggle('dead',!p.alive);
  });
  const p0=S.players[0];$('#en0').innerHTML=Array.from({length:7},(_,k)=>`<span class="orb ${k<p0.energy?'on':''}" style="${k>=p0.maxEnergy?'opacity:.25':''}"></span>`).join('')+` <b>${p0.energy}</b>`;
  $('#round').textContent=`ラウンド ${Math.min(S.round,MAXR)}/${MAXR}`;
  const sv=$('#scv'),stx=S.score.toLocaleString();if(sv.textContent!==stx){sv.textContent=stx;sv.classList.remove('pop');void sv.offsetWidth;sv.classList.add('pop');}
}
function cardHTML(id,i,p){
  const u=UT[id],s=SP[id],c=(u||s).cost,A=ATTR[S.players[0].attr];
  const st=u?`攻${u.atk} 体${u.hp} 移${u.mov}${u.rng>1?' 射'+u.rng:''}`:'呪文';
  const no=c>p.energy||S.current!==0||S.busy?'no':'',on=sel&&sel.idx===i&&sel.mode!=='unit'?'sel':'';
  return `<div class="card ${u?'':'sp'} ${no} ${on}" data-i="${i}" style="--ac:${A.c}"><div class="cost">${c}</div><div class="nm">${u?A.pre+'の':''}${(u||s).n}</div>
   <div class="art"><img src="folder/card_${id}.png" onload="this.parentNode.classList.add('ok')" onerror="this.remove()"><b class="g ${Icon.get(u||s).emo?'emo':''}">${Icon.get(u||s).s}</b></div><div class="st">${st}</div><div class="ds">${(u||s).d}</div></div>`;
}
function renderHand(){const p=S.players[0];$('#hand').innerHTML=p.hand.map((id,i)=>cardHTML(id,i,p)).join('');}
function updateButtons(){$('#endturn').disabled=S.busy||S.current!==0||S.over;}

/* ---- UI連携 ---- */
const lastSay={};
function say(pid,type,force){
  if(pid===0)return;const key=pid===1?'a':'b',now=Date.now();
  if(!force&&now-(lastSay[pid]||0)<3500)return;
  const arr=CONFIG.sisters[key].lines[type];if(!arr||!arr.length)return;
  const b=$('#bb'+pid);if(!b)return;lastSay[pid]=now;
  b.textContent=arr[Math.floor(Math.random()*arr.length)];b.classList.add('on');clearTimeout(b._t);b._t=setTimeout(()=>b.classList.remove('on'),2600);
  const mood={hurt:'sad',elim:'sad',lose:'sad',kill:'happy',win:'happy',atk:'happy'}[type];
  if(mood){setMood(key,mood);clearTimeout(b._m);if(type!=='elim'&&type!=='lose'&&type!=='win')b._m=setTimeout(()=>setMood(key,'normal'),2400);}
}
UI.say=say;
UI.log=t=>{const l=$('#log');if(!l)return;const d=document.createElement('div');d.textContent=t;l.appendChild(d);while(l.children.length>9)l.firstChild.remove();};
UI.refresh=()=>{if(!S||$('#game').classList.contains('hidden'))return;syncUnits();refreshBoard();updatePanels();renderHand();updateButtons();};
UI.fx=(t,d)=>{
  if(!$('#game')||$('#game').classList.contains('hidden'))return;
  const flash=(u)=>{const g=unitEls.get(u.id);if(g){g.classList.add('hit');setTimeout(()=>g.classList.remove('hit'),320);}};
  switch(t){
    case 'summon':Snd.sfx.summon();break;
    case 'move':Snd.sfx.move();break;
    case 'atk':if(d.u.owner!==0&&Math.random()<.4)say(d.u.owner,'atk');break;
    case 'hit':{
      const col=d.adv>1?'#ffd166':d.adv<1?'#a9b4e8':'#ff6b81';
      floatAt(d.u.q,d.u.r,'-'+d.dmg+(d.adv>1?'!':''),col);flash(d.u);
      d.adv>1?Snd.sfx.crit():d.adv<1?Snd.sfx.weak():Snd.sfx.hit();break;}
    case 'base':{
      const b=BASEPOS[d.owner],g=baseEls[d.owner];
      if(d.dmg>0)floatAt(b.q,b.r,'-'+d.dmg+(d.adv>1?'!':''),d.adv>1?'#ffd166':'#ff6b81');
      if(d.shield>0)floatAt(b.q,b.r+.5,'ガード-'+d.shield,'#8be9ff');
      g.classList.add('hit');setTimeout(()=>g.classList.remove('hit'),320);
      d.dmg>0?Snd.sfx.baseHit():Snd.sfx.guard();
      if(d.owner!==0)say(d.owner,'hurt');break;}
    case 'die':Snd.sfx.die();if(d.by&&d.by!==0)say(d.by,'kill');break;
    case 'spell':Snd.sfx.spell();if(d.pid!==0)toast(`${pn(d.pid)}：${SP[d.id].n}`,1100);break;
    case 'buff':Snd.sfx.guard();floatAt(d.u.q,d.u.r,'↑','#ffe29a');break;
    case 'heal':Snd.sfx.heal();floatAt(d.u.q,d.u.r,'+'+d.n,'#7dffbf');break;
    case 'draw':Snd.sfx.draw();break;
    case 'ward':Snd.sfx.guard();break;
    case 'freeze':Snd.sfx.guard();floatAt(d.u.q,d.u.r,'凍結','#8be9ff');break;
    case 'charge':Snd.sfx.core();if(d.pid===0)toast('エネルギー +2',1000);break;
    case 'core':Snd.sfx.core();toast(`${pn(d.pid)}が核を支配！ ${d.score}/${WIN_SCORE}`);break;
    case 'elim':if(d.pid!==0)say(d.pid,'elim',true);toast(`${pn(d.pid)}の拠点が陥落！`,2200);break;
  }
};

/* ---- 操作 ---- */
$('#board').addEventListener('click',e=>{
  if(!S||S.busy||S.over||S.current!==0)return;
  const ue=e.target.closest('[data-unit]'),be=e.target.closest('[data-base]'),ce=e.target.closest('[data-k]');
  if(ue){const u=S.units.find(x=>x.id==ue.dataset.unit);if(u)clickUnit(u);}
  else if(be)clickBase(+be.dataset.base);
  else if(ce)clickCell(ce.dataset.k);
  else{sel=null;UI.refresh();}
});
$('#board').addEventListener('mouseover',e=>{
  if(!S)return;const ue=e.target.closest('[data-unit]'),info=$('#info');if(!info)return;
  const u=ue&&S.units.find(x=>x.id==ue.dataset.unit);info.innerHTML=u?unitInfo(u):defaultInfo();
});
function clickUnit(u){
  if(sel&&sel.mode==='spell'){if(sel.tg.has(u.id))castSpell(sel.idx,u);else Snd.sfx.err();return;}
  if(sel&&sel.mode==='unit'&&u.owner!==0){const t=sel.targets.find(x=>x.kind==='unit'&&x.u===u);if(t){doAttack(sel.u,t);return;}}
  if(u.owner===0){
    if(sel&&sel.mode==='unit'&&sel.u===u)sel=null;
    else if(u.canMove||u.canAttack){sel={mode:'unit',u};Snd.sfx.select();}
    else{toast('このユニットは行動済みです');Snd.sfx.err();}
    UI.refresh();return;
  }
  sel=null;UI.refresh();
}
function clickBase(owner){
  if(sel&&sel.mode==='unit'){const t=sel.targets.find(x=>x.kind==='base'&&x.owner===owner);if(t){doAttack(sel.u,t);return;}}
  sel=null;UI.refresh();
}
function clickCell(k){
  if(sel&&sel.mode==='summon'&&sel.sm.has(k)){const [q,r]=k.split(',').map(Number);const idx=sel.idx;sel=null;summonUnit(0,idx,{q,r,k});return;}
  if(sel&&sel.mode==='unit'&&sel.mv.has(k)){const [q,r]=k.split(',').map(Number);moveUnit(sel.u,q,r);return;}
  sel=null;UI.refresh();
}
function doAttack(u,t){sel=null;attackTarget(u,t);afterPlayerAction();}
function castSpell(idx,target){sel=null;playSpell(0,idx,target);afterPlayerAction();}
function afterPlayerAction(){if(S.over){finishGame();}else UI.refresh();}
$('#hand').addEventListener('click',e=>{
  const c=e.target.closest('.card');if(!c||!S||S.busy||S.over||S.current!==0)return;
  const i=+c.dataset.i,p=S.players[0],id=p.hand[i],cost=(UT[id]||SP[id]).cost;
  if(cost>p.energy){toast('エネルギーが足りません');Snd.sfx.err();return;}
  if(sel&&sel.mode!=='unit'&&sel.idx===i){sel=null;UI.refresh();return;}
  if(UT[id]){
    if(unitsOf(0).length>=MAXU){toast(`ユニットは最大${MAXU}体までです`);Snd.sfx.err();return;}
    sel={mode:'summon',idx:i};computeSel();if(!sel.sm.size){toast('召喚できるマスがありません');sel=null;Snd.sfx.err();UI.refresh();return;}
    toast('自拠点の近く(2マス以内)に召喚できます');
  }else{
    const sp=SP[id];
    if(!canCast(0,id)){toast(CAST_NG[id]||'いまは使えません');Snd.sfx.err();return;}
    if(sp.t==='none'){castSpell(i,null);return;}
    const tg=spellTargets(0,id);if(!tg.length){toast('対象がいません');Snd.sfx.err();return;}
    sel={mode:'spell',idx:i,tg:new Set(tg.map(u=>u.id))};toast('対象を選んでください');
  }
  Snd.sfx.select();UI.refresh();
});
$('#endturn').onclick=()=>{if(!S||S.busy||S.over||S.current!==0)return;Snd.sfx.click();endTurnFlow();};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('#modal').classList.contains('hidden'))closeModal();else if(sel){sel=null;UI.refresh();}}});
$('#b-menu').onclick=()=>{Snd.sfx.click();openModal(`<h2>メニュー</h2><div class="btns"><button class="btn" id="m-resume">再開</button><button class="btn" id="m-quit">あきらめてタイトルへ</button></div>`);
  $('#m-resume').onclick=closeModal;$('#m-quit').onclick=()=>{closeModal();S=null;sel=null;show('title');};};

/* ---- ターン進行 ---- */
function startGame(){
  SAVE.last={attr:selAttr,diff:selDiff,prey:selPrey};persist();
  newGame(selAttr,selDiff,selPrey);sel=null;for(const k in lastSay)delete lastSay[k];
  show('game');Snd.shuffleBattle();buildBoard();buildPanels();syncUnits();UI.refresh();
  setTimeout(()=>{if(S){say(1,'start',true);setTimeout(()=>S&&say(2,'start',true),1000);}},600);
  beginTurn(0);
}
async function beginTurn(pid){
  const G=S;S.current=pid;startTurn(pid);UI.refresh();
  banner(`${pn(pid)}のターン`,ATTR[S.players[pid].attr].c);Snd.sfx.turn();
  if(pid===0){S.busy=false;UI.refresh();return;}
  S.busy=true;UI.refresh();await sleep(900);
  let guard=0;
  while(S===G&&!S.over&&guard++<40){
    const a=aiNextAction(pid);if(!a)break;
    await applyAction(a);if(S!==G)return;await sleep(480);
  }
  if(S!==G)return;
  if(S.over){finishGame();return;}
  await sleep(250);if(S!==G)return;endTurnFlow();
}
function endTurnFlow(){
  S.busy=true;sel=null;finishTurn(S.current);UI.refresh();
  if(S.over){finishGame();return;}
  beginTurn(S.current);
}

/* ---- 結果 ---- */
function finishGame(){
  if(S.fin)return;S.fin=true;S.busy=true;const G=S;
  const cf=CONFIG.affection,g={a:0,b:0};
  if(S.result==='win'){g.a+=cf.win;g.b+=cf.win;if(S.players[0].hp>=15){g.a+=cf.flawless;g.b+=cf.flawless;}S.elim.forEach(e=>{if(e.by===0)g[e.pid===1?'a':'b']+=cf.finish;});SAVE.st.w++;}
  else if(S.result==='draw'){g.a+=cf.draw;g.b+=cf.draw;SAVE.st.d++;}
  else SAVE.st.l++;
  const cs=CONFIG.score;
  if(S.result==='win'){addScore('win',cs.win);addScore('hp',Math.max(0,S.players[0].hp)*cs.hp);addScore('speed',Math.max(0,MAXR-S.round)*cs.speed);}
  else if(S.result==='draw')addScore('draw',cs.draw);
  SAVE.totalScore=(SAVE.totalScore||0)+S.score;S.newBest=S.score>(SAVE.bestScore||0);if(S.newBest)SAVE.bestScore=S.score;
  const old={a:SAVE.aff.a,b:SAVE.aff.b},unlocked=[];
  for(const k of ['a','b']){SAVE.aff[k]=Math.min(cf.max,SAVE.aff[k]+g[k]);CONFIG.events[k].forEach((ev,i)=>{if(old[k]<ev.aff&&SAVE.aff[k]>=ev.aff)unlocked.push({k,i,ev});});}
  persist();
  if(S.result==='win'){Snd.sfx.win();[1,2].forEach(i=>say(i,'lose',true));}
  else if(S.result==='lose'){Snd.sfx.lose();if(S.winner>0)say(S.winner,'win',true);}
  setTimeout(()=>{if(S!==G)return;showResult(g,old,unlocked);},1500);
}
let LASTRES=null;
function showResult(g,old,unl){
  LASTRES=[g,old,unl];
  const R={win:['勝利','res-win'],lose:['敗北','res-lose'],draw:['引き分け','res-draw']}[S.result];
  const why={elim:S.result==='win'?'姉妹の拠点を陥落させた！':'あなたの拠点が陥落した…',core:S.winner===0?'核を支配して勝利した！':`${pn(S.winner)}が核を支配した…`,time:'時間切れ判定（拠点HP＋核×3）'}[S.reason]||'';
  const SBL={kill:'撃破',base:'拠点ダメージ',core:'核の支配',elim:'拠点陥落',win:'勝利ボーナス',hp:'残り拠点HP',speed:'スピード',draw:'引き分け'};
  const sbH=Object.keys(S.sb).filter(k=>S.sb[k]).map(k=>`<span>${SBL[k]||k} <b>${S.sb[k].toLocaleString()}</b></span>`).join('');
  const scoreH=`<div class="scorebox"><div class="sc-main">SCORE <b>${S.score.toLocaleString()}</b>${S.newBest?' <em>NEW RECORD!</em>':''}</div><div class="sc-sub">${sbH||'<span>—</span>'}</div><div class="sc-tot">累計スコア <b>${(SAVE.totalScore||0).toLocaleString()}</b></div></div>`;
  const affH=['a','b'].map(k=>{const s=CONFIG.sisters[k];return `<div class="affc">${portrait(k)}<div style="flex:1"><b>${s.role} ${s.name}</b><br>好感度 ${old[k]} → <b style="color:#ff9ec4">${SAVE.aff[k]}</b> ${g[k]?`(+${g[k]})`:''}<div class="abar"><i style="width:${SAVE.aff[k]}%"></i></div></div></div>`;}).join('');
  const evH=unl.map(u=>`<button class="evb new" data-k="${u.k}" data-i="${u.i}">★ 新イベント解放：${u.ev.title}<small>クリックでノベルを見る</small></button>`).join('');
  openModal(`<div class="${R[1]} res-big">${R[0]}</div><div>${why}</div><div style="margin-top:6px;font-size:13px;opacity:.7">ターン ${S.players[0].turns} ／ 撃破 ${S.stats.killed} ／ 失ったユニット ${S.stats.lost}</div>${scoreH}
   <div class="affrow">${affH}</div><div style="max-width:600px;margin:10px auto 0" id="newev">${evH}</div>
   ${EMBED?'<div class="btns"><button class="btn gold" id="r-cont">つづける</button></div>':''}<div class="btns" ${EMBED?'style="display:none"':''}><button class="btn gold" id="r-again">もう一度</button><button class="btn" id="r-sel">設定へ</button><button class="btn" id="r-shop">ショップ🛒</button><button class="btn" id="r-title">タイトルへ</button></div>`);
  if($('#r-cont'))$('#r-cont').onclick=()=>{try{parent.postMessage({sansukumi:1,result:S.result,score:S.score,total:SAVE.totalScore},'*');}catch(e){}};
  $('#r-again').onclick=()=>{closeModal();startGame();};
  $('#r-shop').onclick=()=>{closeModal();S=null;shopTab='cards';renderShop();show('shop');};
  $('#r-sel').onclick=()=>{closeModal();S=null;renderSelect();show('select');};
  $('#r-title').onclick=()=>{closeModal();S=null;show('title');};
  $('#newev').onclick=e=>{const b=e.target.closest('.evb');if(b)openEvent(b.dataset.k,+b.dataset.i);};
}



/* ---- デッキ編成 ---- */
let DK=null,deckFrom='select';
function deckOrder(){
  const isU=id=>!!UT[id],baseU=['scout','soldier','knight','guard','mage','general'],baseS=['buff','heal','rally','bolt','draw','ward'];
  const shop=CONFIG.shop.cards.map(c=>c.id),by=(a,b)=>cardDef(a).cost-cardDef(b).cost||cardPow(a)-cardPow(b);
  return baseU.concat(baseS,shop.filter(isU).sort(by),shop.filter(id=>!isU(id)).sort(by));
}
function openDeck(from){DK=Object.assign({},playerDeckMap());deckFrom=from||'select';renderDeck();show('deck');}
function renderDeck(){
  const tot=deckTotal(DK),E=deckPower(DK),bf=cpuBuff(E),on=SAVE.balance!==false;
  let u=0,sp=0;const cv=[0,0,0,0,0,0,0,0];
  Object.keys(DK).forEach(id=>{const n=DK[id]|0,c=Math.min(7,cardDef(id).cost);cv[c]+=n;if(UT[id])u+=n;else sp+=n;});
  const mx=Math.max.apply(null,cv.concat([1]));
  $('#deckbar').innerHTML=`<span class="${tot===DECK_SIZE?'ok':'ng'}">デッキ<b>${tot}</b>/ ${DECK_SIZE}</span><span>ユニット<b>${u}</b>呪文<b>${sp}</b></span><span>強化値<b>${E.toFixed(1)}</b></span><span>CPU補正<b style="font-size:13px">${E>0&&on?`HP+${bf.hp} / ドロー${Math.round(bf.xr*100)}%`:'なし'}</b></span><span>コスト分布<span id="curve">${cv.map((n,c)=>`<i title="コスト${c}${c===7?'以上':''}: ${n}枚" style="height:${Math.max(2,Math.round(n/mx*26))}px"></i>`).join('')}</span></span>`;
  $('#deckgrid').innerHTML=deckOrder().map(id=>{
    const d=cardDef(id),isU=!!UT[id],base=BASE_CAP[id]!=null,cap=capOf(id,SAVE.cards),n=DK[id]|0,ic=Icon.get(d);
    const st=isU?`攻${d.atk} 体${d.hp} 移${d.mov}${d.rng>1?' 射'+d.rng:''}`:'呪文';
    const ctl=(!base&&cap===0)?'ショップで購入':`<button data-id="${id}" data-act="-" ${n>0?'':'disabled'}>−</button><b>${n} / ${cap}</b><button data-id="${id}" data-act="+" ${(n<cap&&tot<DECK_SIZE)?'':'disabled'}>＋</button>`;
    return `<div class="dk ${isU?'':'sp'} ${n>0?'has':''} ${base?'':'shop'} ${(!base&&cap===0)?'lock':''}" title="${esc2(d.n+'：'+d.d)}"><div class="top"><span class="cost">${d.cost}</span><span class="nm">${d.n}</span><span class="gl">${ic.s}</span></div><div class="st">${st}</div><div class="ds">${d.d}</div><div class="ctl">${ctl}</div></div>`;
  }).join('');
}
function esc2(t){return String(t).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');}
$('#deckgrid').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  const id=b.dataset.id,n=DK[id]|0;
  if(b.dataset.act==='+'){if(deckTotal(DK)>=DECK_SIZE||n>=capOf(id,SAVE.cards)){Snd.sfx.err();return;}DK[id]=n+1;}
  else{if(n<=0)return;DK[id]=n-1;if(!DK[id])delete DK[id];}
  Snd.sfx.select();renderDeck();
});
$('#dk-reset').onclick=()=>{Snd.sfx.click();DK=defaultDeckMap();renderDeck();toast('初期デッキに戻しました');};
$('#dk-auto').onclick=()=>{Snd.sfx.click();DK=autoDeck(SAVE.cards);renderDeck();toast('買ったカードを自動で入れました');};
$('#dk-back').onclick=()=>{Snd.sfx.click();show(deckFrom);if(deckFrom==='select')renderSelect();else renderShop();};
$('#dk-save').onclick=()=>{
  if(deckTotal(DK)!==DECK_SIZE){toast(`デッキを${DECK_SIZE}枚にしてください（いま ${deckTotal(DK)} 枚）`,1800);Snd.sfx.err();return;}
  const def=defaultDeckMap(),same=Object.keys(def).length===Object.keys(DK).length&&Object.keys(def).every(k=>DK[k]===def[k]);
  SAVE.deck=same?null:Object.assign({},DK);persist();Snd.sfx.core();toast('デッキを保存しました');
  show(deckFrom);if(deckFrom==='select')renderSelect();else renderShop();
};
$('#sh-deck').onclick=()=>{Snd.sfx.click();openDeck('shop');};

/* ---- ショップ ---- */
let shopTab='cards';
function renderShop(){
  const w=wallet(),mx=CONFIG.shop.maxCopies;
  $('#wallet').innerHTML=`<span class="main">所持スコア<b>${w.toLocaleString()}</b></span><span>累計スコア<b>${(SAVE.totalScore||0).toLocaleString()}</b></span><span>使用済み<b>${(SAVE.spent||0).toLocaleString()}</b></span>`;
  $$('#shoptabs .seg').forEach(b=>b.classList.toggle('on',b.dataset.t===shopTab));
  const g=$('#shopgrid');
  if(shopTab==='cards'){
    g.innerHTML=CONFIG.shop.cards.slice().sort((a,b)=>a.price-b.price).map(it=>{
      const d=UT[it.id]||SP[it.id],u=UT[it.id],have=(SAVE.cards&&SAVE.cards[it.id])||0,full=have>=mx,can=w>=it.price&&!full,ic=Icon.get(d);
      const meta=u?`コスト${d.cost}　攻${d.atk} 体${d.hp} 移${d.mov}${d.rng>1?' 射'+d.rng:''}`:`呪文　コスト${d.cost}`;
      return `<div class="shopit ${full?'maxed':''}"><div class="ic ${ic.emo?'emo':''}">${ic.s}</div><div class="nm">${d.n}</div><div class="meta">${meta}</div><div class="ds">${d.d}</div><div class="ow">所持 ${have} / ${mx}</div><button class="btn sm gold" data-buy="${it.id}" ${can?'':'disabled'}>${full?'上限です':it.price.toLocaleString()+' で購入'}</button></div>`;}).join('');
    const tot=Object.keys(SAVE.cards||{}).reduce((a,k)=>a+(SAVE.cards[k]|0),0);
    $('#shopnote').textContent=`購入したカードは「デッキ編成」で入れ替えて使えます（所持している種類: ${Object.keys(SAVE.cards||{}).filter(k=>SAVE.cards[k]>0).length} / ${CONFIG.shop.cards.length}、合計 ${tot} 枚）。`;
  }else{
    g.innerHTML=CONFIG.shop.themes.map(t=>{
      const own=t.price===0||(SAVE.themes&&SAVE.themes[t.id]),cur=(SAVE.theme||'default')===t.id,can=own||w>=t.price;
      return `<div class="shopit ${cur?'cur':''}"><div class="nm" style="margin-top:6px">${t.n}</div><div class="sw">${t.sw.map(c=>`<i style="background:${c}"></i>`).join('')}</div><div class="ds">${own?(cur?'いまの見た目です。':'購入済みです。'):'ゲーム全体の配色が変わります。'}</div><div class="ow">${own?'所持':'未購入'}</div><button class="btn sm gold" data-theme="${t.id}" ${(!can||cur)?'disabled':''}>${cur?'使用中':own?'これを使う':t.price.toLocaleString()+' で購入'}</button></div>`;}).join('');
    $('#shopnote').textContent='購入したインターフェースは、いつでも切り替えられます。';
  }
}
$('#shoptabs').addEventListener('click',e=>{const b=e.target.closest('.seg');if(!b)return;Snd.sfx.click();shopTab=b.dataset.t;renderShop();});
$('#shopgrid').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.buy){
    const it=CONFIG.shop.cards.find(x=>x.id===b.dataset.buy);if(!it)return;const d=UT[it.id]||SP[it.id];
    if((SAVE.cards[it.id]|0)>=CONFIG.shop.maxCopies||wallet()<it.price){Snd.sfx.err();return;}
    if(!confirm(`「${d.n}」を ${it.price.toLocaleString()} スコアで購入しますか？`))return;
    SAVE.spent=(SAVE.spent||0)+it.price;SAVE.cards[it.id]=(SAVE.cards[it.id]|0)+1;persist();Snd.sfx.core();toast(`${d.n} を購入しました。「デッキ編成」で入れ替えて使えます`,2200);renderShop();
  }else if(b.dataset.theme){
    const t=CONFIG.shop.themes.find(x=>x.id===b.dataset.theme);if(!t)return;
    const own=t.price===0||SAVE.themes[t.id];
    if(!own){if(wallet()<t.price){Snd.sfx.err();return;}if(!confirm(`「${t.n}」を ${t.price.toLocaleString()} スコアで購入しますか？`))return;SAVE.spent=(SAVE.spent||0)+t.price;SAVE.themes[t.id]=1;Snd.sfx.core();}
    else Snd.sfx.select();
    SAVE.theme=t.id;applyTheme(t.id);persist();toast(`${t.n} を適用しました`);renderShop();
  }
});
$('#sh-back').onclick=()=>{Snd.sfx.click();show('title');};

/* ---- 好感度・イベント ---- */
function renderAff(){
  const st=SAVE.st,pl=st.w+st.l+st.d;
  $('#statbar').innerHTML=`<div class="sb"><span>累計スコア<b>${(SAVE.totalScore||0).toLocaleString()}</b></span><span>所持スコア<b>${wallet().toLocaleString()}</b></span><span>最高スコア<b>${(SAVE.bestScore||0).toLocaleString()}</b></span><span>戦績<b>${st.w}勝 ${st.l}敗 ${st.d}分</b></span><span>プレイ回数<b>${pl}</b></span></div>`;
  $('#afcols').innerHTML=['a','b'].map(k=>{const s=CONFIG.sisters[k],a=SAVE.aff[k];
    const evs=CONFIG.events[k].map((ev,i)=>{const open=a>=ev.aff;
      return open?`<button class="evb" data-k="${k}" data-i="${i}">▶ ${ev.title}${SAVE.seen[k+(i+1)]?'':' <b style="color:var(--gold)">NEW</b>'}<small>好感度 ${ev.aff} で解放済み</small></button>`
                 :`<div class="evb lock">🔒 ？？？<small>好感度 ${ev.aff} で解放</small></div>`;}).join('');
    return `<div class="afcol">${portrait(k)}<div class="inf"><h2 style="font-size:24px;margin:0">${s.role} ${s.name}</h2><div style="margin:6px 0">好感度 <b style="color:#ff9ec4;font-size:20px">${a}</b> / ${CONFIG.affection.max}</div><div class="abar"><i style="width:${a}%"></i></div>${evs}</div></div>`;}).join('');
  $('#afcols').insertAdjacentHTML('afterend','');
}
$('#afcols').onclick=e=>{const b=e.target.closest('.evb:not(.lock)');if(b)openEvent(b.dataset.k,+b.dataset.i);};
function openEvent(k,i){const ev=CONFIG.events[k][i];persist();openNovel(ev.scene||('event_'+k+(i+1)));} // ノベル(novel.html + folder/event_○○.js)を開く

/* ---- ルール・設定 ---- */
function openRules(){
  openModal(`<h2>あそびかた</h2>
  <h3>目的</h3><ul><li>姉妹2人の拠点（HP20）を壊す、または <b>核（中央）</b> を占拠して <b>6点</b> 取れば勝ち。</li><li>25ラウンドで決着しない時は「拠点HP＋核の点×3」が高い人の勝ち。</li></ul>
  <h3>三すくみ</h3><ul><li>火 ➜ 草 ➜ 水 ➜ 火。有利な相手には ×1.5、不利な相手には ×0.5。端数はどちらも<b>切り上げ</b>です（例：不利でも攻撃3→2、5→3。最低1）。拠点への攻撃にも適用されます。</li><li>つまり3人それぞれに「得意な相手」と「苦手な相手」がいます。1人を追い詰めすぎると、残りの1人が有利になります。</li></ul>
  <h3>ターンの流れ</h3><ul><li>毎ターン、エネルギーが回復（3から始まり最大7）してカードを1枚引きます。</li><li>ユニットカードは、自分の拠点から2マス以内に召喚できます（召喚したターンは動けません）。</li><li>各ユニットは1ターンに「移動1回（移動力まで）」→「攻撃1回」ができます。攻撃すると移動はできません。</li><li>隣接して攻撃すると<b>反撃</b>を受けます。魔導士は射程2で、距離2からなら反撃されません。</li><li>核の上に自分のユニットがいる状態でターンを終えると +1点。</li></ul>
  <h3>操作</h3><ul><li>カードをクリック → 光ったマス（や対象）をクリックで使用。</li><li>ユニットをクリック → 青いマスへ移動、赤く光る敵をクリックで攻撃。Escで選択解除。</li></ul>
  <h3>デッキ編成と強さ補正</h3><ul><li>デッキは<b>30枚ちょうど</b>。「ゲームプレイ」または「ショップ」の<b>デッキ編成</b>で、初期カードとショップで買ったカードを入れ替えられます。</li><li>強いカードを入れるほど「強化値」が上がり、CPUの拠点HPと手札の引きが少しずつ強化されます（<b>強さ補正</b>）。手応えを保つための仕組みで、ゲームプレイ画面でON/OFFできます。</li></ul>
  <h3>コツ</h3><ul>
  <li><b>まずは核（中央）</b>。核に乗ったままターンを終えるだけで1点、6点で勝ちです。序盤は安いユニットで先に取りにいきましょう。</li>
  <li><b>相性は先に確認</b>。自分が不利な相手の近くで無防備に立たず、有利な相手から崩すと楽になります。</li>
  <li><b>射程2以上は反撃されません</b>（魔導士・弓兵・砲兵）。守護者やゴーレムなどの壁役を前に置いて、後ろから撃つのが強力です。</li>
  <li><b>3人戦は「強い人が狙われる」</b>。リードしている時は突っ込みすぎず、核と拠点を守りましょう。逆に、2人が争っている間に漁夫の利を狙うのも手です。</li>
  <li><b>エネルギーは使い切らなくてOK</b>。次のターンに高コストを出すために温存するのも有効です。手札は最大7枚で、あふれたカードは捨てられます。</li>
  <li><b>呪文の使いどころ</b>：鼓舞・狂化は「これで倒せる」時に、凍結は核を取っている敵に、業火は敵が複数いる時に。僧侶・恵雨は長期戦で効きます。</li>
  <li><b>デッキの目安</b>：コスト1〜2を10枚前後、コスト4以上は多くても8枚ほど。強いカードばかりだと、序盤に動けず負けやすくなります。</li></ul>
  <h3>スコア</h3><ul><li>ゲーム中、撃破・拠点へのダメージ・核の支配などでスコアが入ります。勝つとさらにボーナス（残り拠点HP・スピード）が加算されます。</li><li>1ゲームのスコアとは別に、全ゲームの<b>累計スコア</b>が記録されます。ここから使った分を引いた「所持スコア」で、ショップのカードや見た目を買えます。</li></ul>
  <h3>好感度</h3><ul><li>勝つと姉妹の好感度が上がり、一定値でイベント（ノベル形式）が解放されます（「ステータス💗」から見られます）。</li></ul>
  <div class="btns"><button class="btn" id="rl-close">閉じる</button></div>`,'rules');
  $('#rl-close').onclick=closeModal;
}
/* ---- セーブデータ 引継ぎ / 完全削除 ---- */
const XFER_ID='sansukumi-twins',XFER_PREFIX='STW1:',NOVEL_KEY='sangoku_novel_save_v1',NOVEL_FILE='novel.html';
function saveToText(){let nv=null;try{nv=localStorage.getItem(NOVEL_KEY);}catch(e){}return JSON.stringify({game:XFER_ID,ver:2,exported:new Date().toISOString(),save:SAVE,novel:nv});}
function cleanNovel(t){if(typeof t!=='string'||t.length>800000)return null;try{const o=JSON.parse(t);return(o&&typeof o==='object')?t:null;}catch(e){return null;}}
function sanitizeSave(raw){
  const d=defSave(),mx=CONFIG.affection.max,cl=(v,a,b)=>{v=Number(v);return isFinite(v)?Math.max(a,Math.min(b,v)):null;};
  if(!raw||typeof raw!=='object')return null;
  if(raw.aff&&typeof raw.aff==='object'){['a','b'].forEach(k=>{const v=cl(raw.aff[k],0,mx);if(v!=null)d.aff[k]=Math.round(v);});}
  if(raw.seen&&typeof raw.seen==='object'){Object.keys(raw.seen).forEach(k=>{if(raw.seen[k])d.seen[k]=true;});}
  if(raw.st&&typeof raw.st==='object'){['w','l','d'].forEach(k=>{const v=cl(raw.st[k],0,1e6);if(v!=null)d.st[k]=Math.round(v);});}
  const ts=cl(raw.totalScore,0,1e12),bs=cl(raw.bestScore,0,1e12);if(ts!=null)d.totalScore=Math.round(ts);if(bs!=null)d.bestScore=Math.round(bs);if(raw.prologue)d.prologue=true;
  const sp=cl(raw.spent,0,1e12);if(sp!=null)d.spent=Math.round(sp);
  if(raw.cards&&typeof raw.cards==='object'){Object.keys(raw.cards).forEach(k=>{if(UT[k]||SP[k]){const v=cl(raw.cards[k],0,CONFIG.shop.maxCopies);if(v)d.cards[k]=Math.round(v);}});}
  const tids=CONFIG.shop.themes.map(t=>t.id);
  if(raw.themes&&typeof raw.themes==='object'){Object.keys(raw.themes).forEach(k=>{if(tids.includes(k)&&raw.themes[k])d.themes[k]=1;});}
  if(typeof raw.theme==='string'&&tids.includes(raw.theme)&&(raw.theme==='default'||d.themes[raw.theme]))d.theme=raw.theme;
  if(raw.deck&&typeof raw.deck==='object'){const dm={};Object.keys(raw.deck).forEach(k=>{if(cardDef(k)){const v=Math.round(Number(raw.deck[k])||0);if(v>0)dm[k]=v;}});if(deckValid(dm,d.cards))d.deck=dm;}
  if(raw.balance===false)d.balance=false;
  const b=cl(raw.bgm,0,1),f=cl(raw.sfx,0,1);if(b!=null)d.bgm=b;if(f!=null)d.sfx=f;
  if(raw.last&&typeof raw.last==='object'){['attr','diff','prey'].forEach(k=>{const v=cl(raw.last[k],0,9);if(v!=null)d.last[k]=Math.round(v);});}
  return d;
}
function parseSaveText(t){
  t=String(t||'').trim();if(!t)throw new Error('empty');
  if(t.indexOf(XFER_PREFIX)===0){try{t=decodeURIComponent(escape(atob(t.slice(XFER_PREFIX.length).replace(/\s+/g,''))));}catch(e){throw new Error('code');}}
  let o;try{o=JSON.parse(t);}catch(e){throw new Error('json');}
  const raw=(o&&o.save&&typeof o.save==='object')?o.save:o;
  if(o&&o.game&&o.game!==XFER_ID)throw new Error('game');
  const r=sanitizeSave(raw);if(!r)throw new Error('data');return {save:r,novel:cleanNovel(o&&o.novel)};
}
function applyImport(w){SAVE=w.save;applyTheme(SAVE.theme);persist();if(w.novel!=null){try{localStorage.setItem(NOVEL_KEY,w.novel);}catch(e){}}Snd.setVol(SAVE.bgm,SAVE.sfx);toast('データを読み込みました');openSettings();}
function fullDelete(){
  try{localStorage.removeItem(SAVE_KEY);localStorage.removeItem(NOVEL_KEY);}catch(e){}
  SAVE=defSave();applyTheme('default');Snd.setVol(SAVE.bgm,SAVE.sfx);
}
function downloadText(name,text){
  const blob=new Blob([text],{type:'application/json'});
  if(navigator.msSaveBlob){navigator.msSaveBlob(blob,name);return;}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);
}
function openSettings(){
  openModal(`<h2>設定</h2><div class="setrow">BGM　<input type="range" id="v-bgm" min="0" max="100" value="${Math.round(SAVE.bgm*100)}"></div>
  <div class="setrow">効果音　<input type="range" id="v-sfx" min="0" max="100" value="${Math.round(SAVE.sfx*100)}"></div>
  <div class="setsec"><h3>データの引継ぎ</h3>
   <p>好感度・累計スコア・戦績・プロローグのセーブ・音量を、ファイルまたはコードで別の端末やブラウザへ引き継げます。</p>
   <div class="btns"><button class="btn sm" id="x-exp">ファイルに書き出す</button><button class="btn sm" id="x-imp">ファイルから読み込む</button></div>
   <div class="btns" style="margin-top:6px"><button class="btn sm" id="x-code">引継ぎコードを表示</button><button class="btn sm" id="x-in">コードを入力して読み込む</button></div>
   <input type="file" id="x-file" accept=".json,.txt,application/json,text/plain" style="display:none">
   <div id="x-area"></div></div>
  <div class="setsec danger"><h3>データの完全削除</h3>
   <p>このゲームの保存データ(好感度・累計スコア・戦績・プロローグのセーブ・設定)をこのブラウザから完全に消去します。元に戻せません。必要なら先に書き出してください。</p>
   <div class="btns"><button class="btn sm danger" id="x-del">すべて削除する</button></div></div>
  <div class="setrow" style="font-size:12px;opacity:.7;margin-top:16px">開発用（イベント確認用）</div>
  <div class="btns" style="margin-top:4px"><button class="btn sm" id="d-a">${CONFIG.sisters.a.name}の好感度 +10</button><button class="btn sm" id="d-b">${CONFIG.sisters.b.name}の好感度 +10</button></div>
  <div class="btns"><button class="btn" id="st-close">閉じる</button></div>`,'set');
  $('#v-bgm').oninput=e=>{SAVE.bgm=e.target.value/100;Snd.setVol(SAVE.bgm,null);persist();};
  $('#v-sfx').oninput=e=>{SAVE.sfx=e.target.value/100;Snd.setVol(null,SAVE.sfx);persist();Snd.sfx.click();};
  $('#d-a').onclick=()=>{SAVE.aff.a=Math.min(100,SAVE.aff.a+10);persist();toast(`${CONFIG.sisters.a.name}: ${SAVE.aff.a}`);};
  $('#d-b').onclick=()=>{SAVE.aff.b=Math.min(100,SAVE.aff.b+10);persist();toast(`${CONFIG.sisters.b.name}: ${SAVE.aff.b}`);};
  const area=$('#x-area');
  $('#x-exp').onclick=()=>{Snd.sfx.click();const d=new Date(),p=n=>String(n).padStart(2,'0');
    downloadText(`sansukumi-twins-save-${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}.json`,saveToText());toast('書き出しました');};
  $('#x-imp').onclick=()=>{Snd.sfx.click();$('#x-file').value='';$('#x-file').click();};
  $('#x-file').onchange=e=>{const f=e.target.files&&e.target.files[0];if(!f)return;const rd=new FileReader();
    rd.onload=()=>{try{const r=parseSaveText(rd.result);if(confirm('現在のデータを、読み込んだデータで上書きします。よろしいですか？'))applyImport(r);}catch(er){toast('読み込めませんでした(正しいセーブファイルではありません)',2600);}};
    rd.onerror=()=>toast('ファイルを読み込めませんでした',2400);rd.readAsText(f);};
  $('#x-code').onclick=()=>{Snd.sfx.click();let code='';try{code=XFER_PREFIX+btoa(unescape(encodeURIComponent(saveToText())));}catch(e){}
    area.innerHTML='<textarea id="x-ta" readonly></textarea><div class="btns"><button class="btn sm" id="x-copy">コピー</button></div>';
    const ta=$('#x-ta');ta.value=code;ta.onfocus=()=>ta.select();ta.select();
    $('#x-copy').onclick=()=>{ta.select();let ok=false;try{ok=document.execCommand('copy');}catch(e){}
      if(!ok&&navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(code).then(()=>toast('コピーしました'),()=>toast('コピーできませんでした。手動でコピーしてください',2400));}
      else toast(ok?'コピーしました':'コピーできませんでした。手動でコピーしてください',ok?1600:2400);};};
  $('#x-in').onclick=()=>{Snd.sfx.click();
    area.innerHTML='<textarea id="x-ta" placeholder="ここに引継ぎコードを貼り付け"></textarea><div class="btns"><button class="btn sm gold" id="x-go">このコードで読み込む</button></div>';
    $('#x-ta').focus();
    $('#x-go').onclick=()=>{try{const r=parseSaveText($('#x-ta').value);if(confirm('現在のデータを、コードのデータで上書きします。よろしいですか？'))applyImport(r);}catch(er){toast('コードが正しくありません',2400);}};};
  $('#x-del').onclick=()=>{
    if(!confirm('保存データ(好感度・累計スコア・戦績・プロローグのセーブ・設定)をすべて削除します。\nこの操作は元に戻せません。よろしいですか？'))return;
    if(!confirm('本当に完全削除しますか？(最終確認)'))return;
    fullDelete();toast('すべてのデータを削除しました',2200);openSettings();};
  $('#st-close').onclick=closeModal;
}

/* ---- 起動 ---- */
bootTitle();show('title');
/* ノベル(novel.html)から @battle で呼ばれた埋め込みモード: タイトルを飛ばして即バトル開始し、結果を親ページへ返す */
const EMBED=new URLSearchParams(location.search).get('embed')==='1';
{const go=new URLSearchParams(location.search).get('go');if(go==='status'){renderAff();show('affection');}} // ノベルのイベント終了後はステータス画面へ戻る
if(EMBED){
  document.body.classList.add('embed');
  const q=new URLSearchParams(location.search);
  selAttr=Math.max(0,Math.min(2,+q.get('attr')||0));selDiff=Math.max(0,Math.min(2,q.has('diff')?+q.get('diff'):1));selPrey=(+q.get('prey')===2)?2:1;
  startGame();
}
