# 仕様

ごいたのゲーム進行はごいたライブラリの  

[goita-core-js](https://github.com/Goita/goita-core-js)

の仕様で進める。

各プレイヤーにはクライアント用に自分以外を秘匿加工した`goita-core.ThinkingInfo`のJSONを送信する。  
見学プレイヤーには全プレイヤー情報を秘匿加工した`goita-core.ThinkingInfo`のJSONを送信する。

1プレイヤーから4プレイヤーまで。1プレイヤーと3プレイヤーが味方。2プレイヤーと4プレイヤーが味方。
プレイヤー番号は1-4とするが、プログラム内部では0-3として値を管理する。  
駒の割り当ては全てごいたライブラリに従い、以下となる。

 値 | 駒の種類 
---------|----------
 0 | 空
 1 | し
 2 | 香
 3 | 馬
 4 | 銀
 5 | 金
 6 | 角
 7 | 飛
 8 | 王
 9 | 玉
 x | 裏(不明)

# 秘匿情報

秘匿情報の扱いについて。

 内容 | 駒の種類 
---------|----------
 手駒 | ゲーム参加プレイヤーは自身の手駒のみ参照可能。他のプレイヤーの手駒情報は参照不可。見学者は全ての手駒が参照不可。
 伏せ駒 | ゲーム参加プレイヤーは自身の伏せ駒のみ参照可能。他のプレイヤーの伏せ駒情報は参照不可。見学者は全ての伏せ駒が参照不可。
 手番 | 全てのプレイヤと見学者が参照可能。
 得点 | 全てのプレイヤーと見学者が参照可能。
 盤面履歴 | ゲーム参加者および、見学者全員が参照可能。ただし、伏せ駒の部分については、「伏せ駒」の秘匿の扱いに従う。
 

# 実装方針
絶対方針として、サーバーがすべての戦局判断をする。

通信内容のキャプチャリングやブラウザのデバッグ機能によって不正が行えないように、各クライアントにはマスクした情報を渡す。

# 機能

## ロビー管理
1. 全体チャットが可能
2. 個別プレイヤーへのDMが可能
3. ルーム作成機能

## ルーム管理
1. ゲーム設定をしてルームを作成
2. ルームにパスワード設定
3. ルームへ招待を送信
4. ルーム作成者がルームマスターとなる。ルームマスターが抜けた場合、最も参加が古いプレイヤーが次のルームマスターとなる
5. ルームマスターはゲーム設定を変更可能

## ゲーム設定
1. 持ち時間
2. 秒読み
3. レート下限・上限制限
4. レート無し
5. 6-8,5-5し無し
6. 5し無し
7. 手駒差解消 (選択するとレート無しになる) <※実装見送り>

## 手駒差
1. 各プレイヤーに配られた手駒の得点を合計する -> 手駒得点
2. 最も高い手駒得点と最も低い手駒得点に２倍の差 -> 手駒差あり
3. ただし、5し以上の役がある場合は手駒差を計算しない

## 試合時間・持ち時間の設定  

1. 思考時間に応じて持ち時間を減少する
2. 持ち時間を使い切ると、以降は秒読み時間が減少する (秒読みルール)
3. 秒読み時間は、次のプレイヤーに手番が移ると回復する
4. 持ち時間が0になると、パス優先ランダムで手を選択する
5. 5しの場合は、続行判断時も持ち時間を消費する(時間切れは配り直し)

持ち時間
- 10分
- 5分
- 3分
- 2分
- 1分

秒読み
- 30秒
- 20秒
- 10秒
- 5秒

## 途中落ち
- 持ち時間が残っている間は、他の参加者が座ることはできない
- 持ち時間が0ならば、他の観戦プレイヤーが座って続きを打てる
- 自分が最初に座っていた席にしか座れない
- 誰も座っていない状態で手番が回ってきたら、その手番プレイヤーの思考時間として扱う (つまり持ち時間がなくなるとパス優先ランダム)

## レーティング

1300を初期レートとする

調整目安
階級 | 数値 | 表示色
---------|----------|---------
 名人  | 2000〜 | 赤
 達人  | 1800〜 | オレンジ
 上級者 | 1600〜 | 紫
 中級者 | 1400〜 | 黄
 初級者 | 1200〜 | 緑
 初心者 | 1000〜 | シアン
 天邪鬼 |    0〜 | 白

レート移動量計算時の期待勝率  
- 0差   -> 50%勝利  
- 100差 -> 60%勝利  
- 200差 -> 70%勝利  
- 300差 -> 80%勝利  
- 400差 -> 90%勝利  
- 500差 -> 95%勝利  

レート移動基礎点 20

**レート移動量**

レート差 = (敗北ペアレート平均 - 勝利ペアレート平均)

レート差補正値 = 1 + レート差 / 500

レート移動量 = レート移動基礎点(20) * レート差補正値

レート移動量を、敗北ペアにはマイナス値として適用、勝利ペアにはプラス値として適用する

レート移動量をペアで等分配する

最終レート移動量 = レート移動量 / 2

ただし、最終レート移動量には以下の制限がかかる  
レート移動最小値 1  
レート移動最大値 20

# ログイン
- メールアドレスでの認証(非推奨)
- Twitter
- Facebook
- Google+
- Yahoo!JAPAN


# WebSocket Messages

A message event name will be `event` in `io.of("/namespace")`.

## Sockect.io event
namespace | event | description | direction
---------|----------|---------|---------
 | connection | socket.io connect event | -> server
 | disconnect | socket.io disconnect event | -> server
 | connect | connected to socket.io server | -> client
 | error | error on connection to server | -> client

## Server message
namespace | event | description | direction
---------|----------|---------|---------
 | login info | login information | -> client
 | unauthorized | not logged in | -> client
 | invalid action | server recieved an invalid message | -> client


## Lobby message

namespace | event | description | direction
---------|----------|---------|---------
lobby | req info | request lobby information | -> server
lobby | account | send login user info | -> client
lobby | info | lobby information | -> client
lobby | user joined | a user joined to lobby | -> client
lobby | user left | a user left lobby | -> client
lobby | send msg | send a chat message in lobby | -> server
lobby | recieve msg | recieve a chat message in lobby | -> client
lobby | new room | create a new room | -> server
lobby | room created | done creating a room | -> client
lobby | room removed | done remove a room | -> client
lobby | move to room | request to move to a room | -> client
lobby | recieved invitation | an invitation to a room | -> client
lobby | unauthorized | not logged in | -> client
lobby | invalid action | invalid lobby action | -> client 

## Room message
namespace | message | description | direction
---------|----------|---------|---------
room | send invitation | send an invitation to the room | -> server
room | req info | request the room information | -> server
room | info | the room information without table information | -> client
room | user joined | a user joined to the room | -> client
room | user left | a user left room | -> client
room | send msg | send a chat message in the room | -> server
room | recieve msg | recieved a chat message in the room | -> client
room | change config | request to change the room config | -> server
room | config updated | the room config has changed | -> client
room | invalid action | invalid room action | -> client 

## Table message
namespace | message | description | direction
---------|----------|---------|---------
room | player info | player sitting and ready info | -> client
room | sit on | request to sit on the table | -> server
room | stand up | request to stand up the table | -> server
room | set ready | set the user ready to begin a game/round | -> server
room | cancel ready | cancel the ready state | -> server
room | swap seats | request to swap the players' seat | -> server

** 各情報毎に分割して、変化した部分の情報のみ送信する。(通信量削減案)

## Game message
namespace | message | description | direction
---------|----------|---------|---------
room | game history info | game history | -> client
room | board info | board history | -> client
room | play | send a play move (include a pass move) | -> server
room | private board info | private hidden hand and hidden komas | -> client 
room | goshi proceed | decided to proceed with goshi | -> server
room | goshi deal again | decided to deal again | -> server
room | goshi decision | request to decide to proceed/deal | -> client
room | goshi wait | notify other player has goshi | -> client
room | goshi solve | solve goshi wait state | -> client
room | ready timer | auto-ready timer info | -> client

