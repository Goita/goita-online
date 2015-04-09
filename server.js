//必要データの読み込み。
var goita = require("./public/goita");
//var validator = require("./validator");
var validator= require('validator');
var mt = require("./mt"); //MersenneTwister
//固定値の定義
var ROOM_COUNT = 21;

// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 8880;

//WebSocketサーバーの定義
//io.set('transports', ['websocket']); //websocketsに限定する場合に指定。c9.ioではコメントアウト
//io.set('match origin protocol', true);
//io.set("log level", 1);

server.listen(port, function () {
  console.log('Version: ' + process.version);
  console.log('process.env.IP/PORT: ' + process.env.IP +'/'+ process.env.PORT);
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

//

// ロビーに居るユーザの配列
var userList = {}; //{id : UserInfo}
//ルームの情報
var roomList = {}; //{id : RoomInfo. , userList : { id : UserInfo }}
for(var i=0;i<ROOM_COUNT;i++)
{
  roomList[i.toString()] = new goita.RoomInfo(i.toString());
  roomList[i.toString()].rng = new mt.MersenneTwister();
}

//bind func to socket messages
io.sockets.on("connection", function(socket) {
  // 接続が成立したことをクライアントに通知
  // socket.ioがconnectメッセージを投げてくれる

  var callback_disconnected = function () {

    if(!(socket.id in userList)){
      // クライアントにロビーにいるユーザを通知
      socket.broadcast.emit("robby info", userList);
      return;
    }

    var user = userList[socket.id];
    if(user.roomId !== null){
      var roomId = user.roomId;
      roomList[roomId].removeUser(user);
      socket.broadcast.to(roomId).emit("user left room", { username: user.name});
      socket.broadcast.to(roomId).emit("room info", roomList[roomId].toClient());
    }

    // 接続が途切れたことを通知
    socket.broadcast.emit("user left robby", {id: socket.id, username: userList[socket.id].name});
    
    //robbyから除外
    socket.leave("robby");
    
    // ロビーの配列から削除
    delete userList[socket.id];
    // クライアントにロビーにいるユーザを通知
    io.to("robby").emit("robby info", userList);
    
    console.log("user: ", Object.keys(userList).length);
  };

  // 接続が途切れたときのイベントリスナを定義
  socket.on("disconnect", callback_disconnected);

//ロビー関連のメッセージ処理----------------------------------------------------
  // ユーザがロビーを離れたときのイベントリスナを定義(disconnectと同じ)
  socket.on("leave robby", callback_disconnected);

  // ロビーへ入るとき・戻ってきたときのイベントリスナを定義
  socket.on("join robby", function (username){
    if(!username || username === ""){
      socket.emit("robby joining failed", 1000);  //reason: username is empty
      return;
    }
    
    if(username.length > 12){
      socket.emit("robby joining failed", 1005); //reason: username is too long
      return;
    }
    
    var temp = username.length;
    if(validator.escape(username).length != temp){
      socket.emit("robby joining failed", 1006); //reason: username contains invalidated charactor
      return;
    }
    
    if(existsUser(username)){
      socket.emit("robby joining failed", 1007); //reason: username already exists
      return;
    }
    
    // ロビーのユーザ情報配列にデータを追加
    userList[socket.id] = new goita.UserInfo(socket.id,username);

    // クライアントにロビーに接続できたことと、クライアントのidを通知
    socket.emit("robby joined", {id: socket.id, username: username });
    //ルームリストを通知
    socket.emit("room list", getArrayKeys(roomList));
    socket.join("robby");
    // クライアントにロビーにいるユーザを通知
    io.to("robby").emit("robby info", userList);
    // 他のユーザに通知
    socket.broadcast.emit("user joined robby", {id: socket.id, username: username });

    // テスト
    //結果 他人のsocket.id を指定して個別メッセージを送れるが、
    //socketの接続先クライアントにはto(id)で個別メッセージを送れない。
    //したがって、  user.id == socket.id のときは, socket.to(user.id).emit ではなく、socket.emitに切り替えが必要
    //もしくは io.to(id).emit を使用する。
    // for(var k in userList){
    //   io.to(k).emit("push robby msg", "PM:this is private message test from " + userList[socket.id].name);
    // }
    console.log("user: ", Object.size(userList));
  });

  // クライアントがロビー情報の再送を要求したとき
  socket.on("req robby info", function() {
    // クライアントにロビーにいるユーザを通知
    socket.emit("robby info", userList);
    socket.emit("room list", getArrayKeys(roomList));
  });

  // クライアントからのメッセージ送信を受け取ったとき
  socket.on("send robby msg", function(msg) {
    var user = userList[socket.id];
    if(user === undefined){ socket.emit("error command", 10); return; } //user not logged in
    if(msg === undefined || msg === null || msg.text === undefined || msg.text.length == 0) { return; } //just ignore
    io.to("robby").emit("push robby msg", {text: validator.escape(msg.text), username: user.name}); //to everyone
  });

//ルーム関連メッセージの処理----------------------------------------------------
  // クライアントがルームから出たとき
  socket.on("leave room", function(){
    var user = userList[socket.id];
    if(user === undefined){ socket.emit("error command", 10); return; } //user not logged in
    var roomId = user.roomId; //var roomId = findRoomId(user);
    if(roomId === null){ socket.emit("error command", 2004); return; } //not joined in any room
    var room = roomList[roomId];
    room.removeUser(user);
    socket.leave(roomId);
    socket.emit("room left");
    socket.emit("room info", null);

    //他ユーザに通知
    socket.broadcast.to(roomId).emit("user left room", { username: user.name});
    socket.broadcast.to(roomId).emit("room info", roomList[roomId].toClient());
    
    if(room.getPlayerCount() == 0)
    {
      var id = room.id;
      //goita.RoomInfo.initialize(room);
      roomList[id] = new goita.RoomInfo(id);
      console.log("initialize room#" + id);
    }
      
    //ロビー情報を更新
    io.to("robby").emit("robby info", userList);
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
      socket.emit("room joining failed", 2003); 
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
    
    //ロビー情報を更新
    io.to("robby").emit("robby info", userList);

  });

  // クライアントがルーム情報の再送を要求したとき
  socket.on("req room info", function() {
    // クライアントにルームにいるユーザを通知
    socket.emit("room info", roomList[userList[socket.id].roomId].toClient());
  });

  // クライアントからのメッセージ送信を受け取ったとき
  socket.on("send room msg", function(msg) {
    var user = userList[socket.id];
    if(user === undefined){ socket.emit("error command", 10); return; } //user not logged in
    var room = roomList[user.roomId];
    if(room === undefined){ socket.emit("error command", 2004); return; } //not joined in any room
    if(msg === undefined || msg === null || msg.text === undefined || msg.text.length == 0) { return; } //just ignore
    io.to(room.id).emit("push room msg", {text: validator.escape(msg.text), username: userList[socket.id].name}); //everyone in the same room
  });

//ゲーム準備のやりとりをするメッセージ-----------------------------------------
  // sit on
  socket.on("sit on", function(n){
    var user = userList[socket.id];
    if(user === undefined){ socket.emit("error command", 10); return; } //user not logged in
    var room = roomList[user.roomId];
    if(user.roomId === null){ socket.emit("error command", 2004); return; } //not joined in any room
    
    if(room.sitUser(n, user)){
      //success sitting
      io.to(room.id).emit("player sat", {no: n, username: user.name});
      io.to(room.id).emit("room info", room.toClient());
      
      //ゲーム中に着席した場合、手持ち駒情報を送る
      if(room.round){
        io.to(user.id).emit("private game info", room.tegoma[n]);
        
        //ロビー情報を更新
        io.to("robby").emit("robby info", userList);
      }
    }else{
      socket.emit("error command", 2501); //cannot 
    }
    
  });

  // stand up
  socket.on("stand up", function(){
    var user = userList[socket.id];
    if(user === undefined){ socket.emit("error command", 10); return; } //user not logged in
    var room = roomList[user.roomId];
    if(user.roomId === null){ socket.emit("error command", 2004); return; } //not joined in any room
    
    if(roomList[user.roomId].standUser(user)){
      //success standing
      io.to(user.roomId).emit("player stood", {no: user.playerNo, username: user.name});
      io.to(room.id).emit("room info", room.toClient());
    }
    
    //ロビー情報を更新
    io.to("robby").emit("robby info", userList);
  });
  
  //swap seats
  socket.on("swap seats", function(){
    var user = userList[socket.id];
    if(user === undefined){ socket.emit("error command", 10); return; } //user not logged in
    var room = roomList[user.roomId];
    if(user.roomId === null){ socket.emit("error command", 2004); return; } //not joined in any room
    
    if(roomList[user.roomId].swapSeats()){
      //success swapping
      io.to(room.id).emit("room info", room.toClient());
    }
    else
    {
      socket.emit("error command", 2005); //cannot swap seats
    }

  });
  
  var goshiFunc = function(room){
    //５し判定＆処理
    var type = room.Goshi();
    var checkFinished = false;
    switch(type){
      case goita.Util.GoshiType.GOSHI:
        var p = room.findGoshiPlayer();
        for(i=0;i<4;i++){
          if((p[0].no + 2)%4 == i){
            io.to(room.player[i].id).emit("goshi");
          }else{
            io.to(room.player[i].id).emit("goshi wait", p[0].no);
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
        //send private game info to each player
        for(var j=0;j<4;j++){
          io.to(room.player[j].id).emit("private game info", room.tegoma[j]);
        }
        
        //goshi
        goshiFunc(room);
        
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
  };

  // set ready
  socket.on("set ready", function(){
    var user = userList[socket.id];
    if(user === undefined){ socket.emit("error command", 10); return; } //user not logged in
    if(user.roomId === null){ socket.emit("error command", 2004); return; } //not joined in any room
    
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
          
          //ロビー情報を更新
          io.to("robby").emit("robby info", userList);
        }

        //start round if it hasn't started yet
        if(!room.round && room.startRound()){
          io.to(room.id).emit("room info", room.toClient());
          io.to(room.id).emit("round started");

          //send private game info to each player
          for(var i=0;i<4;i++){
            io.to(room.player[i].id).emit("private game info", room.tegoma[i]);
          }
          
          io.to(room.player[room.turn].id).emit("req play");

          //goshi
          goshiFunc(room);
          
          //ロビー情報を更新
          io.to("robby").emit("robby info", userList);
        }
      }
    }
  });

  // cancel ready
  socket.on("cancel ready", function(){
    var user = userList[socket.id];
    if(user === undefined){ socket.emit("error command", 10); return; } //user not logged in
    if(user.roomId === null){ socket.emit("error command", 2004); return; } //not joined in any room
    
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
    if(user === undefined){ socket.emit("error command", 10); return; } //user not logged in
    if(user.roomId === null){ socket.emit("error command", 2004); return; } //not joined in any room
    
    socket.emit("room info", roomList[user.roomId].toClient());
    if(user.playerNo != null)
    {
      socket.emit("private game info", roomList[user.roomId].tegoma[user.playerNo]);
    }
  });

// play  コマを出す ※あがりも兼ねる
  socket.on("play", function(koma){
    var user = userList[socket.id];
    if(user === undefined){ socket.emit("error command", 10); return; } //user not logged in
    if(user.roomId === null){ socket.emit("error command", 2004); return; } //not joined in any room
    
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
      if(!room.attack)
      {
        io.to(room.player[room.turn].id).emit("req play");
      }
    }

    if(room.isGameFinished()){
      io.to(room.id).emit("game finished");
    }

  });

// pass    'なし
  socket.on("pass", function(){
    var user = userList[socket.id];
    if(user === undefined){ socket.emit("error command", 10); return; } //user not logged in
    if(user.roomId === null){ socket.emit("error command", 2004); return; } //not joined in any room
    var room = roomList[user.roomId];
    
    var errcode = room.pass(user);
    if(errcode !== 0){ socket.emit("error command", errcode); return;}

    io.to(user.roomId).emit("room info", room.toClient());
    io.to(user.roomId).emit("passed", room.turn);
    
    io.to(room.player[room.turn].id).emit("req play");
  });

// goshi proceed '５しのまま続行
  socket.on("goshi proceed", function(){
    var user = userList[socket.id];
    if(user === undefined){ socket.emit("error command", 10); return; } //user not logged in
    if(user.roomId === null){ socket.emit("error command", 2004); return; } //not joined in any room
    
    var room = roomList[user.roomId];
    if(!room.goshi) { socket.emit("error command", 3007); return; }
    room.goshi = false;
  });
  
// goshi deal again '配りなおし
  socket.on("goshi deal again", function(){
    var user = userList[socket.id];
    if(user === undefined){ socket.emit("error command", 10); return; } //user not logged in
    if(user.roomId === null){ socket.emit("error command", 2004); return; } //not joined in any room
    
    var room = roomList[user.roomId];
    if(!room.goshi) { socket.emit("error command", 3007); return; }
    
    io.to(room.id).emit("deal again", room); //include private info
    room.dealAgain();
    io.to(room.id).emit("room info", room.toClient());
    //send private game info to each player
    for(var i=0;i<4;i++){
      io.to(room.player[i].id).emit("private game info", room.tegoma[i]);
    }
    
    //goshi
    goshiFunc(room);
  });

});

//ユーザが所属する部屋番号を見つける
var findRoomId = function(user){
  if(user === undefined){return null;}
  
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
  if(user === undefined){return false;}
  
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

var existsUser = function(username){
  for(var key in userList){
    if(username == userList[key].name){
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

console.log('server started');