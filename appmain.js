/*
Goita Client controller
*/
var server = "https://goita-online-c9-pandalabo.c9.io";
var client;

$(document).ready(function() {

  client = new GoitaClient(server);
  client.connect();

  //set event handler
  client.robbyMessageAdded = addRobbyMessage; //function(msg [, style])
  client.robbyUserChanged = updateRobbyUser;

  client.robbyJoiningFailed = notifyRobbyJoinedError; //function(errorcode)
  client.gotError = notifyError;

  client.roomListReceived = updateRoomList; //function(roomlist)
  client.roomInfoChanged = updateRoomInfo;  //function(RoomInfo)
  client.roomMessageAdded = addRoomMessage; //function(msg [, style])
  client.roomJoiningFailed = notifyRoomJoinedError; //function(errorcode)

  client.gotPrivateGameInfo = updatePrivateGameInfo; //function(KomaInfo)
  client.readyRequested = notifyRequestForReady;  //function()
  client.playRequested = notifyRequestToPlay; //function()
  client.gameStarted = notifyGameStarted; //function()
  client.gameFinished = notifyGameFinished; //function()
  client.roundStarted = notifyRoundStarted; //function()
  client.roundFinished = notifyRoundFinished; //function()
  client.komaDealedAgain = notifyDealedAgain; //function(RoomInfo)
  client.gotCommandError = notifyCommandError; //function(error)
  client.goshiDecisionRequested = confirmGoshi; //function()
  client.goshiShown = notifyGoshi; //function()

  //クライアント画面での操作に対するイベントの定義とバインディング

  //ロビーチャット送信ボタン
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

  //ルームチャット送信ボタン
  $("#input-room-msg").keydown(function(event) {
    // エンターキーで発言をサーバに送信する
    if (event.keyCode === 13) {
      client.sendRoomMessage($("#input-room-msg").val());
      $("#input-room-msg").val("");
    }
  });

  $("#btn-send-room-msg").click(function(){
    client.sendRoomMessage($("#input-room-msg").val());
    $("#input-room-msg").val("");
  });

　//ルーム参加ボタン
  $("#btn-join-room").click(function(){
    var roomid = $('#select-room-list').val();
    client.joinRoom(roomid);
  });

  //ルーム退室ボタン
  $("#btn-leave-room").click(function(){
    client.leaveRoom();
    //updateRoomInfo(null);
    //$("#room-msg-list").empty();
  });

  //プレイヤー1着席ボタン
  $("#btn-siton-player1-seat").click(function(){
    client.sitOn(0);
  });

  //プレイヤー2着席ボタン
  $("#btn-siton-player2-seat").click(function(){
    client.sitOn(1);
  });

  //プレイヤー3着席ボタン
  $("#btn-siton-player3-seat").click(function(){
    client.sitOn(2);
  });

  //プレイヤー4着席ボタン
  $("#btn-siton-player4-seat").click(function(){
    client.sitOn(3);
  });

  //退席ボタン
  $("#btn-standup-seat").click(function(){
    client.standUp();
  });

  //レディーボタン
  $("#btn-ready-game").click(function(){
    if(client.roomInfo.player[client.playerNo].ready){
      client.cancelReady();
    }else{
      client.setReady();
    }
  });

  client.joinRobby(prompt("enter your name")); //@TODO: create input function or something
});


//ごいたクライアントのイベントに登録するイベントハンドラ

//ロビーメッセージを追加
var addRobbyMessage = function(msg){
  console.log("addRobbyMessage " + msg );
  $("#robby-msg-list").append("<div class='robby-msg'>" + msg + "</div>");
};

//ロビーユーザ一覧を更新
var updateRobbyUser = function(userList){
  var list = $("#robby-user-list");
  list.empty();
  for(var id in userList){
    list.append("<div class='username'>" + userList[id].name + "</div>");
  }
};

var notifyError = function(error){
  addRobbyMessage(error);
};

var notifyRobbyJoinedError = function(error){
  addRobbyMessage("failed to join robby");
};

var updateRoomList = function(roomList){
  var list = $("#select-room-list");
  console.log(roomList);
  list.empty();
  for(var i in roomList){
    list.append("<option value='" + i +"'>" + "room #" + i.padZero(2) + "</option>");
  }
};

var updateRoomInfo = function(room){
  var i = 0; //as counter
  var no = 0; //as playerNo

  //clearRoomInfo
  console.log("clear RoomInfo");
  $("#room-name").empty();
  $("#room-user-list").empty();

  for(i=0;i<4;i++){
    no = (i+1);
    $("#player" + no +"-name").empty();
    $("#player" + no +"-ready").empty();
    $("#player" + no +"-has-turn").empty();
  }

  if(room === null){
    $("#room-name").html("---");
    $("#room-msg-list").empty();
  }

  //updateRoomInfo
  console.log("update RoomInfo");
  $("#room-name").html("room #" + room.id.padZero(2));

  var userlist = $("#room-user-list");
  for(var id in room.userList){
    userlist.append("<div class='username'>" + room.userList[id].name + "</div>");
  }
  console.log("update player info");
  for(i=0;i<4;i++){
    no = (i+1);
    if(room.player[i] === null){continue;}
    $("#player" + no +"-name").html(room.player[i].name);
    $("#player" + no +"-ready").html(room.player[i].ready ? "ready":"");
    $("#player" + no +"-has-turn").html(room.player[i].hasTurn ? "●" : "");
  }

  if(client.playerNo !==null){
    console.log("playerNo not null");
    $("#btn-ready-game").html(room.player[client.playerNo].ready ? "cancel ready" : "ready");
  }

  console.log("finish updating RoomInfo");
};

var addRoomMessage = function(msg){
  console.log("addRoomMessage " + msg );
  $("#room-msg-list").append("<div class='room-msg'>" + msg + "</div>");
};

var notifyRoomJoinedError = function(error){
  addRobbyMessage(error.toString());
};

var updatePrivateGameInfo = function(KomaInfo){

};

var notifyRequestForReady = function(){
  addRoomMessage("Readyを押して下さい。");
};

var notifyRequestToPlay = function(){
  addRoomMessage("出すコマまたはパスを選択してください。");
};

var notifyGameStarted = function(){
  addRoomMessage("ゲームが開始しました。");
};

var notifyGameFinished = function(){
  addRoomMessage("ゲームが終了しました。");
};

var notifyRoundStarted = function(){
  addRoomMessage("新しいラウンドが開始しました。");
};

var notifyRoundFinished = function(){
  addRoomMessage("ラウンドが終了しました。");
};

var notifyDealedAgain = function(roomInfo){
  addRoomMessage("駒を配り直しました。。");
};

var notifyCommandError = function(error){
  addRoomMessage("無効な選択です。" + error);
};

var confirmGoshi = function(){
  addRoomMessage("ごしの処理を選択して下さい。");
};

var notifyGoshi = function(){
  addRoomMessage("ごしが発生しました。");
};

String.prototype.padZero= function(len, c){
    var s= this, cr= c || '0';
    while(s.length< len) s= cr+ s;
    return s;
};