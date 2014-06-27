//必要データの読み込み。
var RoomInfo = require('./server.roominfo');

//固定値の定義
var ROOM_COUNT = 10;

//WebSocketサーバーの定義
var port = process.env.PORT || 5110;
console.log("default port: " + port);
var io = require('socket.io').listen(port);
//io.set('transports', [ 'websocket' ]); //websocketsに限定する場合に指定。
//io.set('log level', 1);

// ロビーに居るユーザの配列 (id : nickname)
var robbyUserList = {};
//ルームに居るユーザの情報 {no : room No. , 'user' : { id : nickname }
var roomInfoList = {};
for(var i=0;i<ROOM_COUNT;i++)
{
  roomInfoList[i] = new RoomInfo(i.toString());
}

io.sockets.on('connection', function(socket) {
  // 接続が成立したことをクライアントに通知
  //socket.emit('connected');
  console.log('connected:' + socket.id);

  var callback_disconnected = function () {
    // 接続が途切れたことを通知
    socket.broadcast.emit('user left robby', {id: socket.id, username: robbyUserList[socket.id]});
    // ロビーの配列から削除
    delete robbyUserList[socket.id];
    console.log('disconnected:', socket.id);
  };

  // 接続が途切れたときのイベントリスナを定義
  socket.on('disconnect', callback_disconnected);

  // ユーザがロビーを離れたときのイベントリスナを定義(disconnectと同じ)
  socket.on('leave robby', callback_disconnected);

  // ロビーへ入るとき・戻ってきたときのイベントリスナを定義
  socket.on('enter robby', function (data){
    if(data.username){
    // ロビーのユーザ情報配列にデータを追加
    robbyUserList[socket.id] = data.username;

    // クライアントにロビーに接続できたことと、クライアントのidを通知
    socket.emit('robby entered', {id: socket.id, username: data.username });

    // クライアントにロビーにいるユーザを通知
    socket.emit('robby info', robbyUserList);

    // 他のユーザに、接続があったことを通知
    socket.broadcast.emit('user joined robby', {id: socket.id, username: data.username });
    }
  });

  // クライアントがロビー情報の再送を要求したとき
  socket.on('req robby info', function() {
    // クライアントにロビーにいるユーザを通知
    socket.emit('robby info', robbyUserList);
  });

  // クライアントからのメッセージ送信を受け取ったとき
  socket.on('send robby msg', function(data) {
    socket.broadcast.emit('push robby msg', data.msg); //to others
    socket.emit('push robby msg', data.msg); //to sender
    console.log("push message to " + data.id);
  });

  // クライアントからのイベント''の処理
  socket.on('', function(data) {
    // 自分以外の全クライアントにブロードキャストする
    socket.broadcast.emit('', data);
  });

});

console.log("server started");
