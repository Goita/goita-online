//必要データの読み込み。
var datatype = require("./server.datatype");
var validator = require("./validator");

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
  roomList[i.toString()] = new datatype.RoomInfo(i.toString());
}

io.sockets.on("connection", function(socket) {
  // 接続が成立したことをクライアントに通知
  //socket.emit("connected");
  console.log("connected:" + socket.id);

  var callback_disconnected = function () {
    // 接続が途切れたことを通知
    socket.broadcast.emit("user left robby", {id: socket.id, username: userList[socket.id].name});
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
      userList[socket.id] = new datatype.UserInfo(socket.id,username);

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
      for(var k in userList){
        console.log("tried to push private msg to " + k);
        io.to(k).emit("push robby msg", "PM:this is private message test from " + userList[socket.id].name);
      }
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
    io.emit("push robby msg", data.msg); //to everyone
    console.log("push message to " + socket.id);
  });

//ルーム関連メッセージの処理----------------------------------------------------
  // クライアントがルームから出たとき
  socket.on("leave room", function(){
    var user = userList[socket.id];
    user.roomId; //var roomId = findRoomId(user);
    roomList[user.roomId].removeUser(user);
    socket.leave(user.roomId);
    socket.emit("room left");
    console.log("user left room:" + socket.id);

    //他ユーザに通知
    socket.broadcast.to(user.roomId).emit("user left room", { username: user.name});
    socket.broadcast.to(user.roomId).emit("room info", roomList[user.roomId].toClient());
  });

  // ルームへ入るとき
  socket.on("join room", function (roomId){
    if(roomId || roomId !== ""){
      // ロビーのユーザ情報配列にデータを追加
      roomList[roomId].addUser( userList[socket.id]);
      socket.join(roomId);
      // クライアントにルームに接続できたことと、ルームIDを通知
      socket.emit("room joined", {id: roomId});

      // クライアントにルーム情報を渡す
      io.to(roomId).emit("room info", roomList[roomId].toClient());

      // 他のユーザに、接続があったことを通知
      socket.broadcast.to(roomId).emit("user joined room", {id: socket.id, username: userList[socket.id].name });

    }else{
      socket.emit("room joining failed", 2000);  //reason: roomid is empty
      return;
    }
  });

  // クライアントがルーム情報の再送を要求したとき
  socket.on("req room info", function() {
    // クライアントにルームにいるユーザを通知
    socket.emit("room info", roomList[userList[socket.id].roomId].toClient());
  });

  // クライアントからのメッセージ送信を受け取ったとき
  socket.on("send room msg", function(data) {
    io.to(userList[socket.id].roomId).emit("push room msg", data.msg); //everyone in the same room
    console.log("push message to room:" + userList[socket.id].roomId);
  });

//ゲーム準備のやりとりをするメッセージ-----------------------------------------
  // sit on
  socket.on("sit on", function(n){
    var user = userList[socket.id];
    if(roomList[user.roomId].sitUser(n, user)){
      //success sitting
      io.to(user.roomId).emit("player sat", {no: user.playerNo, username: user.name});
    }
  });

  // stand up
  socket.on("stand up", function(){
    var user = userList[socket.id];
    if(roomList[user.roomId].standUser(user)){
      //success standing
      io.to(user.roomId).emit("player stood", {no: user.playerNo, username: user.name});
    }
  });

  // set ready
  socket.on("set ready", function(){
    var user = userList[socket.id];
    var room = roomList[user.roomId];
    if(room.setUserReady(user)){
      //success to set ready
      io.to(room.id).emit("player ready", {no: user.playerNo, username: user.name});

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
            case datatype.Goita.GoshiType.GOSHI:
              var p = room.findGoshiPlayer();
              for(i=0;i<4;i++){
                if(p[0].no == i){
                  io.to(room.player[i].id).emit("goshi");
                }else{
                  io.to(room.player[i].id).emit("goshi wait");
                }
              }
              break;
            case datatype.Goita.GoshiType.ROKUSHI:
              checkFinished = true;
              break;
            case datatype.Goita.GoshiType.NANASHI:
              checkFinished = true;
              break;
            case datatype.Goita.GoshiType.HACHISHI:
              checkFinished = true;
              break;
            case datatype.Goita.GoshiType.AIGOSHI:
              checkFinished = true;
              break;
            case datatype.Goita.GoshiType.TSUIGOSHI:
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
    if(roomList[user.roomId].setUserUnready(user)){
      //success to set unready
      io.to(user.roomId).emit("player cancel ready", user.name);
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
// goshi deal again '配りなおし
// shi answer
// next round  次ラウンドに進行
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
  if(validator.isNumber(user.roomId)){
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
