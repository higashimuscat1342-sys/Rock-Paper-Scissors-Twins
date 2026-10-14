/* ============================================================
   folder/event_a4.js  ―  夏海イベント4「これからも」
   ノベルのシナリオです。書き方は novel.html 冒頭のコメントを参照してください。
   ・script の中身が本文(行頭が ; の行はメモ)。バッククォート ` は使わないでください。
   ============================================================ */
window.NOVEL_SCENES=window.NOVEL_SCENES||{};
window.NOVEL_SCENES['event_a4']={
  title:'夏海イベント4「これからも」',
  back:'index.html?go=status',     // 終了後はステータス画面へ
  backLabel:'ステータスへもどる',
  onEnd:{seen:'a4'},            // 終了で「既読(NEW消去)」にする
  script:String.raw`
@chapter 夏海イベント4
@title 夏海イベント4 | これからも
@bg novel_bg_a4 fade
; ↓ 背景(folder/novel_bg_a4.png)や立ち絵が無くても、仮の表示で進みます。
; ↓ この下をイベントの本文に書き換えてください(サンプルです)。
いつもの部屋、いつもの夜。でも今日は少しだけ特別な空気だった。
@show 夏海 normal center
夏海「あのね、ちゃんと伝えたいことがあるの」
@expr 夏海 happy
夏海「あなたがいてくれて、本当によかった。ありがとう」
@hearts 18
夏海「これからも、よろしくね」
@end
`
};
