//必要データの読み込み。
var datatype = require("./server.datatype");
var validator = require("./validator");

console.log(datatype);
//固定値の定義
var ROOM_COUNT = 10;

//WebSocketサーバーの定義
var port = process.env.PORT || 5110;
console.log("default port: " + port);
var io = require("socket.io").listen(port);
//io.set("transports", [ "websocket" ]); //websocketsに限定する場合に指定。
//io.set("log level", 1);

// ロビーに居るユーザの配列 (id : UserInfo)
var userList = [];
//ルームに居るユーザの情報 {id : RoomInfo. , userList : { id : UserInfo }}
var roomList = [];
for(var i=0;i<ROOM_COUNT;i++)
{
  roomList[i] = new datatype.RoomInfo(i.toString());
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

      // クライアントにロビーにいるユーザを通知
      socket.emit("robby info", userList);

      // 他のユーザに通知
      socket.broadcast.emit("user joined robby", {id: socket.id, username: username });
      socket.broadcast.emit("robby info", userList);
    }else{
      socket.emit("robby joining failed", 1000);  //reason: username is empty
      return;
    }
  });

  // クライアントがロビー情報の再送を要求したとき
  socket.on("req robby info", function() {
    // クライアントにロビーにいるユーザを通知
    socket.emit("robby info", userList);
  });

  // クライアントからのメッセージ送信を受け取ったとき
  socket.on("send robby msg", function(data) {
    socket.emit("push robby msg", data.msg); //to sender
    socket.broadcast.emit("push robby msg", data.msg); //to others
    console.log("push message to " + socket.id);
  });

//ルーム関連メッセージの処理----------------------------------------------------
  // クライアントがルームから出たとき
  socket.on("leave room", function(){
    var user = userList[socket.id];
    user.roomId; //var roomId = findRoomId(user);
    roomList[user.roomId].removeUser(user);
    socket.emit("room left");
    console.log("user left room:" + socket.id);

    //他ユーザに通知
    socket.broadcast.to(user.roomId).emit("user left room", { username: user.name});
    socket.broadcast.to(user.roomId).emit("room info", roomList[user.roomId]);
  });

  // ルームへ入るとき
  socket.on("join room", function (id){
    if(id || id !== ""){
      // ロビーのユーザ情報配列にデータを追加
      roomList[id].addUser( userList[socket.id]);

      // クライアントにルームに接続できたことと、ルームIDを通知
      socket.emit("room joined", {id: id});

      // クライアントにルーム情報を渡す
      socket.emit("room info", roomList[id]);

      // 他のユーザに、接続があったことを通知
      socket.broadcast.to(id).emit("user joined room", {id: socket.id, username: userList[socket.id].name });
      socket.broadcast.to(id).emit("room info", roomList[id]);
    }else{
      socket.emit("room joining failed", 2000);  //reason: roomid is empty
      return;
    }
  });

  // クライアントがルーム情報の再送を要求したとき
  socket.on("req room info", function() {
    // クライアントにルームにいるユーザを通知
    socket.emit("room info", roomList[userList[socket.id].roomId]);
  });

  // クライアントからのメッセージ送信を受け取ったとき
  socket.on("send room msg", function(data) {
    socket.emit("push room msg", data.msg); //to sender
    socket.broadcast.to(userList[socket.id].roomId).emit("push room msg", data.msg); //to others in the same room
    console.log("push message to " + socket.id);
  });

//ゲーム情報のやりとりをするメッセージ-----------------------------------------
// sit on
  socket.on("sit on", function(n){
    var user = userList[socket.id];
    if(roomList[user.roomId].sitUser(n, user)){
      //success sitting
      socket.emit("player sat", user.name);
      socket.broadcast.to(user.roomId).emit("player sat", user.name);
    }
  });
// stand up
  socket.on("stand up", function(){

  });
// set ready
  socket.on("set ready", function(){

  });
// cancel ready
  socket.on("cancel ready", function(){

  });
// req game start
  socket.on("req game start", function(){

  });
// set game config
  socket.on("set game config", function(){

  });
});

//ユーザが所属する部屋番号を見つける
var findRoomId = function(user){

  //find user id
  for(var roomInfo in roomList)
    for(var player in roomInfo.playerList){
      if(player.id == user.id){
        return roomInfo.id;
      }
    }
    return "";
};

//ユーザ情報のroomIdが正しいか確認する
//クライアントからUserInfoを受け取った場合に使用？
var validateRoomId = function(user){
  //first, trust the given info
  if(validator.isNumber(user.roomId)){
    var roomInfo = roomList[user.roomId];
    //if the roomId doesn't exist
    if(roomInfo === undefined){
      return false;
    }

    //find user
    if(findRoomId(user) !== ""){
      return true;
    }
  }
  return false;
};


console.log("server started");
