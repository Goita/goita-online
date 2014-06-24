//ゲームルームの情報
function RoomInfo(roomId){
    this.roomId = roomId;
    this.playerList = [];
}

RoomInfo.prototype.addPlayer = function(id, nickname){
    this.playerList[id] = nickname;
};

var io = require('socket.io').listen(5110);
io.set('transports', [ 'websocket' ]);

// ロビーに居るユーザの配列 (id : nickname)
var robbyUserList = {};
//ルームに居るユーザの情報 {no : room No. , 'user' : { id : nickname } 
var roomInfoList = {};
for(var i=0;i<10;i++)
{
  roomInfoList[i] = new RoomInfo(i.toString());
}

io.sockets.on('connection', function(socket) {
  // 接続が成立したことをクライアントに通知
  //socket.emit('connected');
  console.log('connected:' + socket.id);
  
  // 接続が途切れたときのイベントリスナを定義
  socket.on('disconnect', function () {
    // 接続が途切れたことを通知
    socket.broadcast.emit('user left robby', {id: socket.id, nickname: robbyUserList[socket.id]});
    // ロビーの配列から削除
    delete robbyUserList[socket.id];
    console.log('disconnected:', socket.id);
  });
  
  // ユーザがロビーを離れたときのイベントリスナを定義(disconnectと同じ・・・)
  socket.on('leave robby', function (id) {
    // 接続が途切れたことを通知
    socket.broadcast.emit('user left robby', {id: socket.id, nickname: robbyUserList[socket.id]});
    // ロビーの配列から削除
    delete robbyUserList[socket.id];
  });
  
  // ロビーへ入るとき・戻ってきたときのイベントリスナを定義
  socket.on('enter robby', function (data){
    if(data.nickname){
    // ロビーのユーザ情報配列にデータを追加
    robbyUserList[socket.id] = data.nickname;
     
    // クライアントにロビーに接続できたことと、クライアントのidを通知
    socket.emit('robby entered', { id: socket.id, nickname: data.nickname });
     
    // クライアントにロビーにいるユーザを通知
    socket.emit('robby info', robbyUserList);
     
    // 他のユーザに、接続があったことを通知
    socket.broadcast.emit('user joined　robby', { id: socket.id, nickname: data.nickname });
    }
  });
  
  // クライアントがロビー情報の再送を要求したとき
  socket.on('req robby info', function() {
    // クライアントにロビーにいるユーザを通知
    socket.emit('robby info', robbyUserList);
  });
  
  // クライアントからのメッセージ送信を受け取ったとき
  socket.on('send msg', function(msg) {
    // 自分以外の全クライアントにブロードキャストする
    socket.broadcast.emit('push msg', msg);
    socket.emit('push msg', msg);
  });

  // クライアントからのイベント''の処理
  socket.on('', function(data) {
    // 自分以外の全クライアントにブロードキャストする
    socket.broadcast.emit('', data);
  });

});

console.log("server started");
