/* ============================================================
   folder/event_a1.js  ―  夏海イベント1「ふたりの帰り道」
   ノベルのシナリオです。書き方は novel.html 冒頭のコメントを参照してください。
   ・script の中身が本文(行頭が ; の行はメモ)。バッククォート ` は使わないでください。
   ============================================================ */
window.NOVEL_SCENES=window.NOVEL_SCENES||{};
window.NOVEL_SCENES['event_a1']={
  title:'夏海イベント1「ふたりの帰り道」',
  back:'index.html?go=status',     // 終了後はステータス画面へ
  backLabel:'ステータスへもどる',
  onEnd:{seen:'a1'},            // 終了で「既読(NEW消去)」にする
  script:String.raw`
@chapter 夏海イベント1
@title 夏海イベント1 | ふたりの帰り道
@bg novel_bg_a1 fade
; ↓ 背景(folder/novel_bg_a1.png)や立ち絵が無くても、仮の表示で進みます。
; ↓ この下をイベントの本文に書き換えてください(サンプルです)。
夕暮れの商店街。夏海と並んで歩く帰り道。
@show 夏海 normal center
夏海「今日はありがとう。荷物、持ってくれて助かったよ」
あなた「これくらい、いつでも言って」
@expr 夏海 happy
夏海「ふふ、頼もしいね。……ねえ、少し寄り道していかない？」
@choice 寄り道する > yes | また今度にする > no
*yes
@hearts 12
夏海「やった。実は、ずっと気になってたお店があるの」
@jump fin
*no
@expr 夏海 normal
夏海「そっか。じゃあ、また今度ね」
*fin
夏海「また一緒に帰ろうね」
@end
`
};
