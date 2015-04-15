goita-online
============

1. install node_modules.
cd goita-online
npm install

2. if you need, change server application port in "server.js"

ごいたゲームのnode.js+HTMLクライアントのオンライン対戦

更新予定
最初の受けゴマが消えて、以降、ずれた位置に駒が表示される
手駒にはソートしておくってあげる？　見送り
６し、７し、８しなどのメッセージ表示してあげる
さらに、こまをオープンする


【参考にしたいリンク】
チャットルームとHTML側の連携（軽い説明）
http://www.tettori.net/post/852/

Socket.io 機能解説
http://jxck.hatenablog.com/entry/20110730/1312042603

ルームの作成機能（動的追加）
http://hrsh7th.hatenablog.com/entry/20120810/1344630748

チャットルームサンプル
http://www.sitepoint.com/chat-application-using-socket-io/

ゲームサンプル
http://wise9.jp/archives/3930

HTML5 Canvasの入力処理
http://www.ibm.com/developerworks/jp/web/library/wa-games/

Twitter認証したくなったら、Socket.io-Express3.x-session
https://gist.github.com/pxsta/3931831
http://jxck.hatenablog.com/entry/20110809/1312847290
書籍「サーバサイドJavaScript　Node.js入門」
http://creator.cotapon.org/articles/node-js/node_js-oauth-twitter

HTMLタグ サニタイズ用
https://github.com/chriso/validator.js

【仕様】
4人分の駒状態を各プレイヤーに送信する
1プレイヤーから4プレイヤーまで。1プレイヤーと3プレイヤーが味方。2プレイヤーと4プレイヤーが味方。
駒の割り当て
x:空
0:不明
1:し
2:香
3:馬
4:銀
5:金
6:角
7:飛
8:王
9:玉

サーバーがすべての戦局判断をする。
各プレイヤーへの送信データは、1プレイヤーから4プレイヤーまでの全ての情報を羅列して、
--------12------23131335--------
といった32ケタの文字列を送信するなど、最小限のデータにとどめれば、通信量を抑えることができるが、のちの課題。
現在は部屋情報クラスの内容をそのまま渡す。(各プレイヤーの秘匿情報だけマスクする)
1プレイヤーごとに8ケタで、駒情報を持つ。ただし、裏向きで置いた駒は 0:不明として情報を配る。
（※以降サーバー側からは、裏向きで出した本人プレイヤーに対しても、1不明として情報を渡すので、裏向き駒を覗き見る機能がほしければクライアント側で記憶して実装する必要がある）

ゲームルームはとりあえず固定で#01～#10 まで作ることにする。

途中落ちの対処
<基本方針>
・他の観戦プレイヤーが座って続きを打てる。
・誰も座っていない状態で手番が回ってきたら、パス。攻めの選択中であれば、手駒からランダムで出す。
・ゲーム中に席を立ったり、ルームから出た場合、他プレイヤーが席について、引き継ぐことが可能。

レーティング機能
つけたいなー。 チーム戦なのでどうレートを動かすかも考えないと
まずはDB

PlayOK でやってるようなことは一通りできたらいいな。
ログイン - TwitterのOAuthで 
Express Redis? の連携で。

メッセージ一覧
<<各ネームスペース共通>>    ---------------------------------------------
◆To サーバー
connection  接続完了処理
disconnect　 切断処理

◆To クライアント
connect 接続完了処理
error 何らかのエラー発生

<<ロビー関連>>　ネームスペース なし ----------------------------------------
〈ロビー基本〉
◆To サーバー
join robby　ロビー参加
leave robby　ロビーから抜ける(＝切断)
req robby info　ロビー情報要求

◆To クライアント
robby joined　ロビー参加完了通知
robby joining failed ロビー参加失敗
robby left  ロビーから抜けた
robby info  ロビー情報通知
room list ルームのリスト通知
user joined robby   誰かがロビーに参加
user left robby　誰かが切断

〈ロビーチャット〉
◆To サーバー
send robby msg

◆To クライアント
push robby msg

〈招待機能〉
◆To サーバー
send invitation

◆To クライアント
received invitation

<<ゲームルーム関連>> ネームスペース No -----------------------------------
〈ルーム基本〉
◆To サーバー
join room　部屋参加 function(roomId)
leave room　部屋から抜ける
req room info　部屋情報要求

◆To クライアント
room joined　部屋参加完了通知
room joining failed  部屋参加失敗
room info  部屋情報通知
user joined room    誰かが部屋に参加した
user left room　誰かが切断

〈ルームチャット〉
◆To サーバー
send room msg

◆To クライアント
push room msg

〈ゲーム設定〉
◆To サーバー
sit on
stand up
set ready
cancel ready
set game config
swap seats

◆To クライアント
player sat
player stood
player ready
player cancel ready


〈ゲーム進行〉
◆To サーバー
req game info   ゲーム状態情報を要求　※必要ないかもしれないけど、使うかはクライアント実装者に任せる
play  駒を出す。ゲーム状況で自動的に出し方を判断させる。ゲーム終了処理まで行って結果を返す。
pass    'なし

goshi proceed 'ごしのまま続行
goshi deal again '配りなおし

◆To クライアント
game started    全員がreadyするとゲーム開始したことが通知される
public game info　　ゲーム終了後に全員の持ち駒をオープンするとかする場合に使う？
private game info ゲーム状態情報通知（各プレイヤーの秘匿情報を渡す。公開情報はとりあえずRoomInfoで渡す）
error command   '無効なプレイを受け取ったときの通知
game finished     規定点数に達した時に終了を通知
played          プレイヤーの手を通知
passed      パス
req play    手番プレイヤーへの通知（処理しなくてもいい）
time up     手番プレイヤーが時間切れ（ランダムで処理される）（未実装）
round started   次ラウンド開始の通知（一定時間で次ラウンド強制開始もありかも）
round finished  場の非公開情報もついでに送る。//ろくし、ななし、はちし、相ごし、対ごしを含む
deal again 配りなおし
goshi ごしの決断を求める（その他のプレイヤーにはgoshi waitを送る)
goshi wait ごしの決断をしないその他のプレイヤーは判断を待つ
kifu  ラウンド終了ごとに対戦の棋譜を通知（未実装）





[Special Thanks]
http://en.soundeffect-lab.info
cloudconvert.com