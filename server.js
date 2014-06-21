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
