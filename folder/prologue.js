/* ============================================================
   folder/prologue.js  ―  プロローグ
   ノベルのシナリオです。書き方は novel.html 冒頭のコメントを参照してください。
   ・script の中身が本文(行頭が ; の行はメモ)。バッククォート ` は使わないでください。
   ============================================================ */
window.NOVEL_SCENES=window.NOVEL_SCENES||{};
window.NOVEL_SCENES['prologue']={
  title:'プロローグ',
  back:'index.html',            // 終了後に戻るページ
  backLabel:'ゲームへ進む',
  onEnd:{prologue:true},        // 終了時に立てるフラグ
  script:String.raw`
@set love 0
@chapter プロローグ
@title プロローグ | ふたりとのはじまり
@bg novel_bg_room fade
; @bgm prologue.mp3

製作中です。

*fin
@burst 2
@hideall
@bg #ffe3f1 0
@end
`
};
