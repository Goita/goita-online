//仕様
//4人分の駒状態を各プレイヤーに送信する
//1プレイヤーから4プレイヤーまで。1プレイヤーと3プレイヤーが味方。2プレイヤーと4プレイヤーが味方。
//駒の割り当て
//0:空
//1:不明
//2:し
//3:香
//4:馬
//5:銀
//6:金
//7:角
//8:飛
//a:王
//b:玉

var io = require('socket.io').listen(8080);

io.sockets.on('connection', function(socket) {
  console.log('onconnection:', socket);

  // クライアントからのイベント'all'を受信する
  socket.on('all', function(data) {
    // イベント名'msg'で受信メッセージを
    // 自分を含む全クライアントにブロードキャストする
    io.sockets.emit('msg', data);
  });

  // クライアントからのイベント'others'を受信する
  socket.on('others', function(data) {
    // イベント名'msg'で受信メッセージを
    // 自分以外の全クライアントにブロードキャストする
    socket.broadcast.emit('msg', data);
  });

  socket.on('disconnect', function() {
    console.log('disconn');
  });
});
