/*
Goita Client controller
*/
var server = "https://goita-online-c9-pandalabo.c9.io";
var client;

//test
onload = function(){
  var canvas = $("#canvas-game-input");
  if ( canvas[0] && canvas[0].getContext ) { 
    var ctx = canvas[0].getContext("2d");
    drawTegoma(ctx);
    
  }
  
  var canvas2 = $("#canvas-game-field");
  if ( canvas2[0] && canvas2[0].getContext ) { 
    var ctx2 = canvas2[0].getContext("2d");
    drawGameField(ctx2, undefined, 3);
    
  }

};

var bindGoitaClientEvents = function(client){
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
  client.roundFinished = notifyRoundFinished; //function(RoomInfo) //非公開情報含む
  client.komaDealedAgain = notifyDealedAgain; //function(RoomInfo) //非公開情報含む
  client.gotCommandError = notifyCommandError; //function(error)
  client.goshiDecisionRequested = confirmGoshi; //function()
  client.goshiShown = notifyGoshi; //function()
};

var bindScreenEvents = function(client){
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
    if(client.roomInfo === null || client.playerNo === null){ return; }

    if(client.roomInfo.player[client.playerNo].ready){
      client.cancelReady();
    }else{
      client.setReady();
    }
  });
  
  //パスボタン
  $("#btn-game-pass").click(function(){
    if(client.roomInfo === null){ return; }
    //if(client.roomInfo.round === false ){return;}
    client.pass();
  });
  
  //駒選択エリア
  var canvas = $("#canvas-game-input");
  
  var canvasPosition = {
    x: canvas.offset().left,
    y: canvas.offset().top
  };
  
  canvas.click(function(e) {
    e.preventDefault();
    // use pageX and pageY to get the mouse position
    // relative to the browser window

    var mouse = {
        x: e.pageX - canvasPosition.x,
        y: e.pageY - canvasPosition.y
    };

    // now you have local coordinates,
    // which consider a (0,0) origin at the
    // top-left of canvas element
    //width="400" height="50"
    var n = Math.floor(mouse.x / 50); //trans mouse.x to 0-7 number
    
    if(n < client.tegoma.koma.length){
      
      var koma = client.tegoma.koma[n];
      console.log("selected koma index: " + n + " played: " + koma);
      client.play(koma);
      
    }
    return false;
  });
};

$(document).ready(function() {
  client = new GoitaClient(server);

  //set event handler
  bindGoitaClientEvents(client);

  //クライアント画面での操作に対するイベントの定義とバインディング
  bindScreenEvents(client);

  //connect and join in robby
  client.connect();
  
  if (!client.connected) 
  {
    //サーバーに接続できませんでした。とメッセージを出す。
  }
  client.joinRobby(prompt("enter your name")); //@TODO: create input function or something
});

//モバイル機器のウィンドウに対してジェスチャーを使ったすべての操作を無効にする
var cancelUserGesture = function(e) {
    if (e && e.preventDefault) { e.preventDefault(); }
    if (e && e.stopPropagation) { e.stopPropagation(); }
    return false;
};
$('#canvas-game-field').bind('touchstart', cancelUserGesture);
$('#canvas-game-field').bind('touchmove', cancelUserGesture);
$('#canvas-game-input').bind('touchstart', cancelUserGesture);
$('#canvas-game-input').bind('touchmove', cancelUserGesture);



//ごいたクライアントのイベントに登録するイベントハンドラ

//ロビーメッセージを追加
var addRobbyMessage = function(msg){
  console.log("addRobbyMessage " + msg );
  var list = $("#robby-msg-list");
  list.append("<div class='robby-msg'>" + msg + "</div>");
  list.scrollTop(list.height());
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
  if(error == 1005){
    addRobbyMessage("ユーザ名は12文字までです。");
  }
  if(error == 1006){
    addRobbyMessage("ユーザ名に使用できない記号が含まれています。");
  }
  if(error == 1007){
    addRobbyMessage("入力したユーザ名は既に使用されています。");
  }
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

  if(room === null){
    $("#room-name").html("---");
    $("#room-msg-list").empty();
    return;
  }

  //updateRoomInfo
  console.log("update RoomInfo");
  $("#room-name").html("room #" + room.id.padZero(2));

  var userlist = $("#room-user-list");
  for(var id in room.userList){
    userlist.append("<div class='username'>" + room.userList[id].name + "</div>");
  }

  if(client.playerNo !==null){
    $("#btn-ready-game").html(room.player[client.playerNo].ready ? "cancel ready" : "ready");
  }
  
  var canvas = $("#canvas-game-field");
  if ( ! canvas[0] || ! canvas[0].getContext ) { return false; }
  var ctx = canvas[0].getContext("2d");
  drawGameField(ctx, room, this.playerNo);

  console.log("finish updating RoomInfo");
};

var addRoomMessage = function(msg){
  console.log("addRoomMessage " + msg );
  var list = $("#room-msg-list");
  list.append("<div class='room-msg'>" + msg + "</div>");
  list.scrollTop(list.height());
};

var notifyRoomJoinedError = function(error){
  addRobbyMessage(error.toString());
};

var updatePrivateGameInfo = function(tegoma){
  var canvas = $("#canvas-game-input");
  if ( ! canvas[0] || ! canvas[0].getContext ) { return false; }
  var ctx = canvas[0].getContext("2d");
  drawTegoma(ctx, tegoma);
};

var notifyRequestForReady = function(){
  addRoomMessage("Readyを押して下さい。");
};

var notifyRequestToPlay = function(){
  addRoomMessage("出す駒またはパスを選択してください。");
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

var notifyRoundFinished = function(room){
  addRoomMessage("ラウンドが終了しました。");
  
  var canvas = $("#canvas-game-field");
  if ( ! canvas[0] || ! canvas[0].getContext ) { return false; }
  var ctx = canvas[0].getContext("2d");
  drawGameField(ctx, room, this.playerNo);
};

var notifyDealedAgain = function(room){
  addRoomMessage("駒を配り直しました。");
  
  var canvas = $("#canvas-game-field");
  if ( ! canvas[0] || ! canvas[0].getContext ) { return false; }
  var ctx = canvas[0].getContext("2d");
  drawGameField(ctx, room, this.playerNo);
};

var notifyCommandError = function(error){
  addRoomMessage("無効な選択です。" + error);
};

var confirmGoshi = function(){
  addRoomMessage("ごしの処理を選択して下さい。");
  if(confirm("駒の配り直しをしますか？")){
    client.goshiDealAgain();
  }else{
    client.goshiProceed();
  }
};

var notifyGoshi = function(){
  addRoomMessage("ごしが発生しました。");
};

String.prototype.padZero = function(len, c){
    var s= this, cr= c || '0';
    while(s.length< len) s= cr+ s;
    return s;
};

var drawGameField = function(ctx, room, myNo){
  if(room === undefined){
    room = new RoomInfo();
    room.field[0] = new KomaInfo("120456");
    room.field[1] = new KomaInfo("123489");
    room.field[2] = new KomaInfo("020407");
    room.field[3] = new KomaInfo("110101");
    room.player[0] = new UserInfo("x1", "あいうえおかきくけこ");
    room.player[0].playerNo = 0;
    room.player[0].hasTurn = true;
    room.player[1] = new UserInfo("x2", "あひ");
    room.player[1].playerNo = 1;
    room.player[1].ready = true;
    room.player[2] = new UserInfo("x3", "thunderbolt!");
    room.player[2].playerNo = 2;
    room.player[3] = new UserInfo("x4", "ああああああああああああ");
    room.player[3].playerNo = 3;
  }
  
  if(room === null){console.log("room is null"); return;}
  if(myNo ===null){ myNo = 0;}
  
  var width = 440;
  var height = 440;
  var komaWidth = 40;
  ctx.fillStyle="#cc9";
  ctx.fillRect(0,0,width,height);
  
  var n = 0;
  //palyer#1
  n = (0+myNo)%4;
  drawKomaField(ctx, room.field[n],(n==room.from), komaWidth, 140, 340, 0);
  drawPlayerInfo(ctx, room.player[n], 140, 420, 0);
  drawReady(ctx,room.player[n],140, 340, 0);
  
  //player#2
  n = (1+myNo)%4;
  drawKomaField(ctx, room.field[n],(n==room.from), komaWidth, 340, 300, -90);
  drawPlayerInfo(ctx, room.player[n], 280, 300, 0);
  drawReady(ctx,room.player[n], 340, 300, -90);
  
  //player#3
  n = (2+myNo)%4;
  drawKomaField(ctx, room.field[n],(n==room.from), komaWidth, 300, 100, 180);
  drawPlayerInfo(ctx, room.player[n], 140, 0, 0);
  drawReady(ctx,room.player[n], 300, 100, 180);
  
  //player#4
  n = (3+myNo)%4;
  drawKomaField(ctx, room.field[n],(n==room.from), komaWidth, 100, 140, 90);
  drawPlayerInfo(ctx, room.player[n], 0, 120, 0);
  drawReady(ctx,room.player[n], 100, 140, 90);
  
  //team point, round
  drawGameInfo(ctx, room, 150, 160, 0);
  
};

var drawKomaField = function(ctx, field, last, komaSize, tx, ty, r){
  ctx.translate(tx,ty);
  ctx.rotate(r*Math.PI/180);
  
  ctx.strokeStyle="#963";
  ctx.font= "30px Verdana";
  
  for(var i=0;i<field.koma.length;i++){
    var x = Math.floor(i/2)*komaSize;
    var y = i%2*komaSize;
    
    if(i==field.koma.length - 1 && last){
      ctx.fillStyle="#9fc";
    }else{
      ctx.fillStyle="#fc9";
    }
    
    ctx.fillRect(x,y,komaSize, komaSize);
    
    var text = Util.getKomaText(field.koma[i]);
    if(text === ""){
      ctx.fillStyle="#c96";
      ctx.fillRect(x,y,komaSize, komaSize);
    }
    ctx.strokeRect(x,y,komaSize, komaSize);
    ctx.fillStyle="#000";
    ctx.fillText(text,x+5,y+30);
  }
  
  //reset transformation
  ctx.rotate(-r*Math.PI/180);
  ctx.translate(-tx,-ty);
};

var drawPlayerInfo = function(ctx, player, tx, ty, r){
  if(player === null) {return;}
  
  ctx.translate(tx,ty);
  ctx.rotate(r*Math.PI/180);
  
  ctx.font= "12px Verdana";
  ctx.fillStyle="#f66";
  if(player.hasTurn){
    var text = "★";
    ctx.fillText(text,0,14);
  }
  ctx.fillStyle="#000";
  ctx.fillText("p" + (player.playerNo+1).toString() + ":" + player.name,16,14);
  
  //reset transformation
  ctx.rotate(-r*Math.PI/180);
  ctx.translate(-tx,-ty);
};

var drawReady = function(ctx, player, tx, ty, r){
  if(player === null) {return;}
  ctx.translate(tx,ty);
  ctx.rotate(r*Math.PI/180);
  
  if(player.ready){
    ctx.font= "40px Verdana";
    ctx.fillStyle="#f66";
    ctx.fillText("READY",0,40);
  }
  //reset transformation
  ctx.rotate(-r*Math.PI/180);
  ctx.translate(-tx,-ty);
};

var drawGameInfo = function(ctx, room, tx, ty, r){
  ctx.translate(tx,ty);
  ctx.rotate(r*Math.PI/180);
  ctx.fillStyle="#69c";
  ctx.fillRect(0,0,140,60);
  
  ctx.strokeStyle="#666";
  ctx.strokeRect(0,0,140,20);
  ctx.strokeRect(0,20,140,20);
  ctx.strokeRect(0,40,140,20);
  
  var p13 = room.point[0] + room.point[2];
  var p24 = room.point[1] + room.point[3];
  
  ctx.font = "14px Verdana";
  ctx.fillStyle="#000";
  ctx.fillText("player1&3: " + p13.toString(),0,16);
  ctx.fillText("player2&4: " + p24.toString(),0,20+16);
  ctx.fillText("ROUND: " + room.roundCount,0, 40+16);
  
  //reset transformation
  ctx.rotate(-r*Math.PI/180);
  ctx.translate(-tx,-ty);
};

//rotation matrix param
//ctx.setTransform(a,b,c,d,e,f)
//a	c	e
//b	d	f
//0	0	1

//[ cos(angle) -sin(angle) tx ] [ x     ]
//[ sin(angle)  cos(angle) ty ] [ y     ]
//[     0           0      1  ] [ z(=1) ]
//** tx, ty: translation of axises

//drawing method
// c = canvas context
var drawTegoma = function(ctx, tegoma){
  if(tegoma === undefined){
    tegoma = new KomaInfo("12345679"); //for testing
  }
  var width = 50 * 8;
  var height = 50;
  var komaWidth = 50;
  ctx.fillStyle="#cfc";
  ctx.fillRect(0,0,width, height);
  ctx.strokeStyle="#963";
  ctx.font= "40px Verdana";
  ctx.fillStyle="#000";
  for(var i=0;i<tegoma.koma.length;i++){
    var x = i*komaWidth;
    var y = 0;
    ctx.strokeRect(x,y,komaWidth, height);
    var text = Util.getKomaText(tegoma.koma[i]);
    ctx.fillText(text,x+5,y+40);
  }
};