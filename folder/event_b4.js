/* ============================================================
   folder/event_b4.js  ―  茉莉イベント4「とっておきの場所」
   ノベルのシナリオです。書き方は novel.html 冒頭のコメントを参照してください。
   ・script の中身が本文(行頭が ; の行はメモ)。バッククォート ` は使わないでください。
   ============================================================ */
window.NOVEL_SCENES=window.NOVEL_SCENES||{};
window.NOVEL_SCENES['event_b4']={
  title:'茉莉イベント4「とっておきの場所」',
  back:'index.html?go=status',     // 終了後はステータス画面へ
  backLabel:'ステータスへもどる',
  onEnd:{seen:'b4'},            // 終了で「既読(NEW消去)」にする
  script:String.raw`
@chapter 茉莉イベント4
@title 茉莉イベント4 | とっておきの場所
@bg novel_bg_b4 fade
; ↓ 背景(folder/novel_bg_b4.png)や立ち絵が無くても、仮の表示で進みます。
; ↓ この下をイベントの本文に書き換えてください(サンプルです)。
茉莉が案内してくれたのは、町が一望できる丘の上だった。
@show 茉莉 happy center
茉莉「ここね、私のとっておきの場所なの。他の人には内緒だよ」
あなた「いい景色だね」
@expr 茉莉 normal
茉莉「あなたにだけ、教えたかったんだ」
@hearts 18
茉莉「これからも、よろしくね」
@end
`
};
