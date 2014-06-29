/*
Goita Client controller
*/
var server = "https://goita-online-c9-pandalabo.c9.io";
var client;

$(document).ready(function() {

  client = new GoitaClient(server);
  client.connect();

  //set event handler
  client.robbyMessageAdded = addRobbyMessage;
  client.robbyUserChanged = updateRobbyUser;

  $("#input-robby-msg").keydown(function(event) {
    // エンターキーで発言をサーバに送信する
    if (event.keyCode === 13) {
      client.sendRobbyMessage($("#input-robby-msg").val());
      $("#input-robby-msg").val("");
    }
  });

  $("#btn-send-robby-msg").click(function(){
    client.sendRobbyMessage($("#input-robby-msg").val());
    $("#input-robby-msg").val("");
  });

  client.joinRobby(prompt("enter your name")); //@TODO: create input function
});

//ロビーメッセージを追加
var addRobbyMessage = function(value){
  console.log("addRobbyMessage " + value );
  var msg = value.replace( /[<>;]/g, "" ); //タグ記号<>と;削除
  $("#robby-msg-list").append("<div class='robby-msg'>" + msg + "</div>");
};

//ロビーユーザ一覧を更新
var updateRobbyUser = function(robbyUserList){
  var list = $("#robby-user-list");
  list.empty();
  for(var id in robbyUserList){
    list.append("<div class='username'>" + robbyUserList[id] + "</div>");
  }
};
