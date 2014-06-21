goita-online
============

ごいたゲームのnode.js+HTMLクライアントのオンライン対戦

【参考にしたいリンク】
チャットルームとHTML側の連携（軽い説明）
http://www.tettori.net/post/852/

Socket.io 機能解説
http://jxck.hatenablog.com/entry/20110730/1312042603

ルームの作成機能（動的追加）
http://hrsh7th.hatenablog.com/entry/20120810/1344630748

ゲームサンプル
http://wise9.jp/archives/3930

【仕様】
4人分の駒状態を各プレイヤーに送信する
1プレイヤーから4プレイヤーまで。1プレイヤーと3プレイヤーが味方。2プレイヤーと4プレイヤーが味方。
駒の割り当て
0:空
1:不明
2:し
3:香
4:馬
5:銀
6:金
7:角
8:飛
a:王
b:玉

サーバーがすべての戦局判断をする。
各プレイヤーへの送信データは、1プレイヤーから4プレイヤーまでの全ての情報を羅列して、
00000000120000002313133500000000
といった32ケタの文字列を送信する。1プレイヤーごとに8ケタで、駒情報を持つ。ただし、裏向きで置いた駒は1:不明として情報を配る。
（※以降サーバー側からは、裏向きで出したプレイヤーに対しても、1:不明として情報を渡すので、裏向き駒を覗き見る機能がほしければクライアント側で記憶して実装する必要がある）

ゲームルームはとりあえず固定で#01～#10 まで作ることにする。

メッセージ一覧
≪各ネームスペース共通≫    ---------------------------------------------
◆To サーバー
connection  接続完了処理
disconnect　 切断処理

◆To クライアント
connect 接続完了処理

≪ロビー関連≫　ネームスペース なし ----------------------------------------
〈ロビー基本〉
◆To サーバー
enter robby　ロビー参加
leave robby　ロビーから抜ける(＝切断)
req robby info　ロビー情報要求

◆To クライアント
robby enterd　ロビー参加完了通知
robby info  ロビー情報通知
user joined robby   誰かがロビーに参加
user left robby　誰かが切断

〈ロビーチャット〉
◆To サーバー
send msg

◆To クライアント
push msg

〈招待機能〉
◆To サーバー
send invitation

◆To クライアント
received invitation

≪ゲームルーム関連≫　ネームスペース room + No.  -----------------------------
〈ルーム基本〉
◆To サーバー
enter room　部屋参加
leave room　部屋から抜ける
req room info　部屋情報要求

◆To クライアント
room entered　部屋参加完了通知
room info  部屋情報通知
user joined room    誰かが部屋に参加した
user left room　誰かが切断

〈ルームチャット〉
◆To サーバー
send msg

◆To クライアント
push msg

〈ゲーム設定〉
◆To サーバー
sit on
stand up
set ready
cancel ready
req game start
set game config

◆To クライアント
player sat
player stood
player ready

〈ゲーム進行〉
◆To サーバー
req game info   ゲーム状態情報を要求　※必要ないかもしれないけど、使うかはクライアント実装者に任せる
attack  '攻めゴマを出す ※あがりも兼ねる
pass    'なし
block   '受けゴマを出す　※伏せ出しも兼ねる
next round  次ラウンドに進行

◆To クライアント
game started    全員がreadyするとゲーム開始したことが通知される
game info   ゲーム状態情報通知
error command   '無効なプレイを受け取ったときの通知
game finish     規定点数に達した時に終了を通知
game abort      途中でだれかが抜けた場合（※回線切断の場合などの復帰処理は今は考えない）
played          他プレイヤーの手を通知
req play    手番プレイヤーへの通知（処理しなくてもいい）
time up     手番プレイヤーが時間切れ（ランダムで処理される）
round started   次ラウンド開始の通知（一定時間で次ラウンド強制開始もありかも）
round finished  場の非公開情報もついでに送る。
goshi   五しの処理を求める（その他のプレイヤーには



