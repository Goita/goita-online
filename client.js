var server = 'https://goita-online-c9-pandalabo.c9.io:5110';
var nickname;
var robby;

$(document).ready(function() {

  enterRobby();
  
  $('#text').keydown(function(event) {
    // エンターキーで発言をサーバに送信する
    if (event.keyCode === 13) {
      sendRobbyMessage($('#text').val());
      $('#text').val('');
    }
  });
  
  $('#sendmsg').click(function(){
    sendRobbyMessage($('#text').val());
    $('#text').val('');
  });
});

//ロビーチャットで発言
function sendRobbyMessage(msg){
  robby.emit('send msg', msg);
}

//jqueryでメッセージを追加
function addMessage(value){
  var msg = value.replace( /[<>;]/g, '' ); //タグ記号<>と;削除
  $("#msg_list").append("<div class='msg'>" + msg + "</div>");
}

// ロビーに接続する関数
function enterRobby(){
  robby = io.connect(server);
  
  // 接続できたというメッセージを受け取ったら
  robby.on('connect', function() {
    nickname = prompt("enter your nickname");
    robby.emit('enter robby',{'nickname': nickname});
  });

  // ロビーに入ったというメッセージを受け取ったら
  robby.on('robby entered', function(data){
    robby.id = data.id;
  })

  // 他のユーザが接続を解除したら
  robby.on('user left robby', function(data) {
    console.log('user disconnected:', data.id);
    addMessage('user left:' + data.nickname);
  });
  
  // 他のユーザが接続を解除したら
  robby.on('user joined robby', function(data) {
    console.log('user joined:', data.id);
    addMessage('user joined:' + data.nickname);
  });

  // ロビーのユーザ一覧を受け取ったら
  robby.on('robby info', function(robbyUserList) {
    console.log('robby info', robbyUserList);
    $("#robby_list").empty();
    for(var id in robbyUserList){
      $("#robby_list").append("<div class='username'>" + robbyUserList[id] + "</div>");
    }
  });
  
  robby.on('push msg', function(msg) {
    addMessage(msg);
  });
  
  return robby;
}