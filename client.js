var socket = io.connect('http://localhost:8080');
var timer;

$(document).ready(function() {
  $('#text').keydown(function(event) {
    // エンターキーで発言をサーバに送信する
    if (event.keyCode === 13) {
      // イベント名'all'でメッセージをサーバに送信する
      socket.emit('all', {
        action: 'post',
        user: $('#user').val(),
        css: $('#css').val(),
        text: $('#text').val()
      });

    // タイピング中というステータスをサーバに送信する
    } else {
      // イベント名'others'でメッセージをサーバに送信する
      socket.emit('others', {
        action: 'typing',
        user: $('#user').val()
      });
    }
  });

  // サーバからのイベント'msg'を受信する
  socket.on('msg', function(data) {
    switch (data.action) {
      case 'post': // 発言の描画
        $('<li></li>').text(data.user + ': ' + data.text)
                      .attr('style', data.css)
                      .appendTo('body');
        break;
      case 'typing': // タイピング中ステータスの描画
        $('#typing').text(data.user + 'さんがタイピング中です...');
        clearTimeout(timer);
        timer = setTimeout(function() { $('#typing').empty(); }, 3000);
        break;
    }
  });
});