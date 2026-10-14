/* ============================================================
   folder/event_b1.js  ―  茉莉イベント1「ゲームセンター」
   ノベルのシナリオです。書き方は novel.html 冒頭のコメントを参照してください。
   ・script の中身が本文(行頭が ; の行はメモ)。バッククォート ` は使わないでください。
   ============================================================ */
window.NOVEL_SCENES=window.NOVEL_SCENES||{};
window.NOVEL_SCENES['event_b1']={
  title:'茉莉イベント1「ゲームセンター」',
  back:'index.html?go=status',     // 終了後はステータス画面へ
  backLabel:'ステータスへもどる',
  onEnd:{seen:'b1'},            // 終了で「既読(NEW消去)」にする
  script:String.raw`
@chapter 茉莉イベント1
@title 茉莉イベント1 | ゲームセンター
@bg novel_bg_b1 fade
; ↓ 背景(folder/novel_bg_b1.png)や立ち絵が無くても、仮の表示で進みます。
; ↓ この下をイベントの本文に書き換えてください(サンプルです)。
休日のゲームセンター。茉莉に手を引かれて、奥のクレーンゲームの前へ。
@show 茉莉 happy center
茉莉「ねえ見て見て！　あのぬいぐるみ、絶対取りたいの！」
あなた「よし、任せて」
@shake 1
@expr 茉莉 normal
茉莉「あっ、惜しい！　もう一回！」
@expr 茉莉 happy
茉莉「えへへ、一緒にやると楽しいね」
@hearts 10
@end
`
};
