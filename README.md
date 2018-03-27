# goita-online

ごいたのオンライン対戦サーバーと簡易 HTML クライアント

## Install

1.Install dependencies.

```sh
cd goita-online
yarn install
```

## Run and Test

docker コマンドと docker-compose コマンドを導入しておくこと。

本番環境の起動

```sh
docker-compose -f docker-compose.prod.yml up
```

開発時環境の起動

```sh
yarn install
yarn run build
docker-compose up
```

NOTE: 開発時は高速化のため、ローカルの編集中ファイルと同期して起動する設定なので、ローカルでのパッケージインストールとビルドが必要

テストの実行

```sh
docker-compose run --rm goita-online /bin/bash -c "yarn test"
```

## SPECIFICATIONs

[SPECIFICATION.md を参照](./SPECIFICATION.md)

## TODOs

[TODO.md を参照](./TODO.md)

## MEMO

【参考にしたいリンク】チャットルームと HTML 側の連携（軽い説明）
http://www.tettori.net/post/852/

Socket.io 機能解説
http://jxck.hatenablog.com/entry/20110730/1312042603

ルームの作成機能（動的追加）
http://hrsh7th.hatenablog.com/entry/20120810/1344630748

チャットルームサンプル
https://github.com/raineroviir/react-redux-socketio-chat

ゲームサンプル
http://wise9.jp/archives/3930

Twitter 認証したくなったら、Socket.io-Express3.x-session
http://qiita.com/noenoe/items/04cc16b6835d349374f9
http://jxck.hatenablog.com/entry/20110809/1312847290
書籍「サーバサイド JavaScript 　 Node.js 入門」
http://creator.cotapon.org/articles/node-js/node_js-oauth-twitter

https://www.codementor.io/tips/0217388244/sharing-passport-js-sessions-with-both-express-and-socket-io

## Acknowledgement

http://en.soundeffect-lab.info
https://cloudconvert.com/
http://jdlm.info/articles/2016/03/06/lessons-building-node-app-docker.html
