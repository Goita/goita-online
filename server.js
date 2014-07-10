//必要データの読み込み。
var goita = require("./goita");
//var validator = require("./validator");
var validator= require('validator');

//固定値の定義
var ROOM_COUNT = 10;

//WebSocketサーバーの定義
var port = process.env.PORT || 5110;
console.log("default port: " + port);
var io = require("socket.io").listen(port);
//io.set("transports", [ "websocket" ]); //websocketsに限定する場合に指定。
//io.set("log level", 1);

// ロビーに居るユーザの配列
var userList = {}; //{id : UserInfo}
//ルームの情報
var roomList = {}; //{id : RoomInfo. , userList : { id : UserInfo }}
for(var i=0;i<ROOM_COUNT;i++)
{
  roomList[i.toString()] = new goita.RoomInfo(i.toString());
}

io.sockets.on("connection", function(socket) {
  // 接続が成立したことをクライアントに通知
  //socket.emit("connected");
  console.log("connected:" + socket.id);

  var callback_disconnected = function () {

    if(!(socket.id in userList)){
      console.log("user already disconnected:" + socket.id);
      // クライアントにロビーにいるユーザを通知
      socket.broadcast.emit("robby info", userList);
      return;
    }

    var user = userList[socket.id];
    if(user.roomId !== null){
      var roomId = user.roomId;
      roomList[roomId].removeUser(user);
      console.log("notify user left on disconnection");
      socket.broadcast.to(roomId).emit("user left room", { username: user.name});
      socket.broadcast.to(roomId).emit("room info", roomList[roomId].toClient());
    }

    // 接続が途切れたことを通知
    socket.broadcast.emit("user left robby", {id: socket.id, username: userList[socket.id].name});
    // クライアントにロビーにいるユーザを通知
    socket.broadcast.emit("robby info", userList);
    // ロビーの配列から削除
    delete userList[socket.id];
    console.log("disconnected:", socket.id);
  };

  // 接続が途切れたときのイベントリスナを定義
  socket.on("disconnect", callback_disconnected);

//ロビー関連のメッセージ処理----------------------------------------------------
  // ユーザがロビーを離れたときのイベントリスナを定義(disconnectと同じ)
  socket.on("leave robby", callback_disconnected);

  // ロビーへ入るとき・戻ってきたときのイベントリスナを定義
  socket.on("join robby", function (username){
    if(username || username !== ""){
      // ロビーのユーザ情報配列にデータを追加
      userList[socket.id] = new goita.UserInfo(socket.id,username);

      // クライアントにロビーに接続できたことと、クライアントのidを通知
      socket.emit("robby joined", {id: socket.id, username: username });
      //ルームリストを通知
      socket.emit("room list", getArrayKeys(roomList));
      // クライアントにロビーにいるユーザを通知
      io.emit("robby info", userList);
      // 他のユーザに通知
      socket.broadcast.emit("user joined robby", {id: socket.id, username: username });

      // テスト
      //結果 他人のsocket.id を指定して個別メッセージを送れるが、
      //socketの接続先クライアントにはto(id)で個別メッセージを送れない。
      //したがって、  user.id == socket.id のときは, to(user.id)emit ではなく、socket.emitに切り替えが必要
      //もしくは io.to(id).emit を使用する。
      // for(var k in userList){
      //   io.to(k).emit("push robby msg", "PM:this is private message test from " + userList[socket.id].name);
      // }
    }else{
      socket.emit("robby joining failed", 1000);  //reason: username is empty
      return;
    }
  });

  // クライアントがロビー情報の再送を要求したとき
  socket.on("req robby info", function() {
    // クライアントにロビーにいるユーザを通知
    socket.emit("robby info", userList);
    socket.emit("room list", getArrayKeys(roomList));
  });

  // クライアントからのメッセージ送信を受け取ったとき
  socket.on("send robby msg", function(data) {
    io.emit("push robby msg", validator.escape(data.msg)); //to everyone
    console.log("push message to " + socket.id);
  });

//ルーム関連メッセージの処理----------------------------------------------------
  // クライアントがルームから出たとき
  socket.on("leave room", function(){
    var user = userList[socket.id];
    var roomId = user.roomId; //var roomId = findRoomId(user);
    roomList[roomId].removeUser(user);
    socket.leave(roomId);
    socket.emit("room left");
    socket.emit("room info", null);
    console.log("user left room:" + socket.id);

    //他ユーザに通知
    console.log("notify room:" + roomId + " user left");
    socket.broadcast.to(roomId).emit("user left room", { username: user.name});
    socket.broadcast.to(roomId).emit("room info", roomList[roomId].toClient());
  });

  // ルームへ入るとき
  socket.on("join room", function (roomId){
    if(!(roomId || roomId !== "")){
      socket.emit("room joining failed", 2000);  //reason: roomid is empty
      return;
    }
    var user = userList[socket.id];
    if(user === undefined){
      socket.emit("room joining failed", 2001); //reason: not logged in a robby with proper way
      return;
    }
    if(user.roomId !== null){
      socket.emit("room joining failed", 2002); //reason: already joined in a room
      return;
    }

    if(!(roomId in roomList)){
      socket.emit("room joining failed", 2003); //reason: roomId doesn't exist
      return;
    }

    // ロビーのユーザ情報配列にデータを追加
    roomList[roomId].addUser(user);
    socket.join(roomId);
    // クライアントにルームに接続できたことと、ルームIDを通知
    socket.emit("room joined", {id: roomId});

    // クライアントにルーム情報を渡す
    io.to(roomId).emit("room info", roomList[roomId].toClient());

    // 他のユーザに、接続があったことを通知
    socket.broadcast.to(roomId).emit("user joined room", {id: socket.id, username: userList[socket.id].name });

  });

  // クライアントがルーム情報の再送を要求したとき
  socket.on("req room info", function() {
    // クライアントにルームにいるユーザを通知
    socket.emit("room info", roomList[userList[socket.id].roomId].toClient());
  });

  // クライアントからのメッセージ送信を受け取ったとき
  socket.on("send room msg", function(data) {
    io.to(userList[socket.id].roomId).emit("push room msg", validator.escape(data.msg)); //everyone in the same room
    console.log("push message to room:" + userList[socket.id].roomId);
  });

//ゲーム準備のやりとりをするメッセージ-----------------------------------------
  // sit on
  socket.on("sit on", function(n){
    var user = userList[socket.id];
    var room = roomList[user.roomId];
    if(roomList[user.roomId].sitUser(n, user)){
      //success sitting
      io.to(user.roomId).emit("player sat", {no: user.playerNo, username: user.name});
      io.to(room.id).emit("room info", room.toClient());
    }
  });

  // stand up
  socket.on("stand up", function(){
    var user = userList[socket.id];
    var room = roomList[user.roomId];
    if(roomList[user.roomId].standUser(user)){
      //success standing
      io.to(user.roomId).emit("player stood", {no: user.playerNo, username: user.name});
      io.to(room.id).emit("room info", room.toClient());
    }
  });

  // set ready
  socket.on("set ready", function(){
    var user = userList[socket.id];
    var room = roomList[user.roomId];
    if(room.setUserReady(user)){
      //success to set ready
      io.to(room.id).emit("player ready", {no: user.playerNo, username: user.name});
      io.to(room.id).emit("room info", room.toClient());

      //if all players set ready, start game/round
      if(room.isAllUserReady()){

        //start game if it hasn't started yet
        if(!room.game && room.startGame()){
          io.to(room.id).emit("game started");
        }

        //start round if it hasn't started yet
        if(!room.round && room.startRound()){
          io.to(room.id).emit("round started");
          io.to(room.id).emit("room info", room.toClient());

          //send private game info to each player
          for(var i in room.player){
            if(room.player[i].id == user.id){
              socket.emit("private game info", room.tegoma[i]);
            }else{
              socket.to(room.player[i].id).emit("private game info", room.tegoma[i]);
            }
          }

          //ごし判定＆処理
          var type = room.Goshi();
          var checkFinished = false;
          switch(type){
            case goita.Util.GoshiType.GOSHI:
              var p = room.findGoshiPlayer();
              for(i=0;i<4;i++){
                if(p[0].no == i){
                  io.to(room.player[i].id).emit("goshi");
                }else{
                  io.to(room.player[i].id).emit("goshi wait");
                }
              }
              break;
            case goita.Util.GoshiType.ROKUSHI:
              checkFinished = true;
              break;
            case goita.Util.GoshiType.NANASHI:
              checkFinished = true;
              break;
            case goita.Util.GoshiType.HACHISHI:
              checkFinished = true;
              break;
            case goita.Util.GoshiType.AIGOSHI:
              checkFinished = true;
              break;
            case goita.Util.GoshiType.TSUIGOSHI:
              io.to(room.id).emit("deal again", room); //include private info
              room.dealAgain();
              io.to(room.id).emit("room info", room.toClient());
              break;
          }

          if(checkFinished){
            if(room.isRoundFinished()){
              io.to(room.id).emit("round finished", room); //include private info
            }
            if(room.isGameFinished()){
              io.to(room.id).emit("game finished");
            }
          }
        }
      }
    }
  });

  // cancel ready
  socket.on("cancel ready", function(){
    var user = userList[socket.id];
    var room = roomList[user.roomId];
    if(roomList[user.roomId].setUserUnready(user)){
      //success to set unready
      io.to(user.roomId).emit("player cancel ready", user.name);
      io.to(room.id).emit("room info", room.toClient());
    }
  });

  // set game config
  socket.on("set game config", function(){
    //@TODO: implement
  });

//ゲームのやりとりをするメッセージ-----------------------------------------
//req game info   ゲーム状態情報を要求
  socket.on("req game info", function(){
    var user = userList[socket.id];
    socket.emit("room info", roomList[user.roomId].toClient());
    socket.emit("private game info", roomList[user.roomId].tegoma[user.playerNo]);
  });

// play  コマを出す ※あがりも兼ねる
  socket.on("play", function(koma){
    var user = userList[socket.id];
    var room = roomList[user.roomId];
    var errcode = room.play(user, koma);
    if(errcode !== 0){ socket.emit("error command", errcode); return;}

    io.to(room.id).emit("room info", room.toClient());
    socket.emit("private game info", room.tegoma[user.playerNo]);
    io.to(room.id).emit("palyed", koma);
    if(room.isRoundFinished()){
      io.to(room.id).emit("round finished", room); //include private info
    }else{
      //request next player to play
      io.to(room.player[room.turn].id).emit("req play");
    }

    if(room.isGameFinished()){
      io.to(room.id).emit("game finished");
    }

  });

// pass    'なし
  socket.on("pass", function(){
    var user = userList[socket.id];
    var errcode = roomList[user.roomId].pass(user);
    if(errcode !== 0){ socket.emit("error command", errcode); return;}

    io.to(user.roomId).emit("room info", roomList[user.roomId].toClient());
    io.to(user.roomId).emit("passed", roomList[user.roomId].turn);
  });

// goshi proceed 'ごしのまま続行
  socket.on("goshi proceed", function(){
    var room = roomList[userList[socket.id].roomId];
    room.goshi = false;
  });
// goshi deal again '配りなおし
  socket.on("goshi deal again", function(){
    var room = roomList[userList[socket.id].roomId];
    io.to(room.id).emit("deal again", room); //include private info
    room.dealAgain();
    io.to(room.id).emit("room info", room.toClient());
  });

});

//ユーザが所属する部屋番号を見つける
var findRoomId = function(user){

  //find user id
  for(var room in roomList)
    for(var player in room.playerList){
      if(player.id == user.id){
        return room.id;
      }
    }
    return "";
};

//ユーザ情報のroomIdが正しいか確認する
//クライアントからUserInfoを受け取った場合に使用？
var validateRoomId = function(user){
  //first, trust the given info
  if(validator.isNumeric(user.roomId)){
    var room = roomList[user.roomId];
    //if the roomId doesn't exist
    if(room === undefined){
      return false;
    }

    //find user
    if(findRoomId(user) !== ""){
      return true;
    }
  }
  return false;
};

var getArrayKeys = function(a){
  var list = [];
  var i = 0;
  for(var key in a){
    list[i] = key;
    i++;
  }
  return list;
};


console.log("server started");
