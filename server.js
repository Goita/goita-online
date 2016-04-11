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
io.set('transports', ['websocket', 'polling']); //websocketsに限定する場合に指定。c9.ioではコメントアウト
//io.set('match origin protocol', true);
//io.set("log level", 1);

server.listen(port, function () {
  console.log('Version: ' + process.version);
  console.log('Server listening at port %d', port);
});

process.on('exit', function(){
  server.close();
});
process.on('uncaughtException', function(){
  server.close();
});
process.on('SIGTERM', function(){
  server.close();
});

// Routing
app.use(express.static(__dirname + '/public'));

//var robby = new Robby();

// ロビーに居るユーザの配列
var userList = {}; //{id : UserInfo}
//ルームの情報
var roomList = {}; //{id : RoomInfo}
for(var i=0;i<ROOM_COUNT;i++)
{
  roomList[i.toString()] = new goita.RoomInfo(i.toString());
  roomList[i.toString()].RNG = new mt.MersenneTwister();
}

//bind message func to individual socket
io.sockets.on("connection", function(socket) {
  // 接続が成立したことをクライアントに通知
  // socket.ioがconnectメッセージを投げてくれる

  var disconnected = function () {
    if(!(socket.id in userList)){
      socket.broadcast.emit("robby info", userList); // クライアントにロビーにいるユーザを通知
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
    socket.broadcast.emit("user left robby", {id: socket.id, username: user.name});
    
    //robbyから除外
    socket.leave("robby");
    
    // ロビーの配列から削除
    delete userList[socket.id];
    // クライアントにロビーにいるユーザを通知
    io.to("robby").emit("robby info", userList);
    
    console.log("user: ", Object.keys(userList).length);
  };

  socket.on("alive", function() {
    var user = userList[socket.id];
    if(user == undefined){ socket.emit("error command", 10); return; } //user not logged in
    user.alive = true;
    //console.log("alive message from: " + user.name);
    socket.emit("answer alive");
  });
  
  // 接続が途切れたときのイベントリスナを定義
  socket.on("disconnect", disconnected);

//ロビー関連のメッセージ処理----------------------------------------------------
  // ユーザがロビーを離れたときのイベントリスナを定義(disconnectと同じ)
  socket.on("leave robby", disconnected);

  // ロビーへ入るとき・戻ってきたときのイベントリスナを定義
  socket.on("join robby", function (username){
    if(!username || username.length == 0){
      socket.emit("robby joining failed", 1000);  //reason: username is empty
      return;
    }

    //TODO: username.trim(space)

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
    userList[socket.id] = new goita.UserInfo(socket.id, username);

    // クライアントにロビーに接続できたことと、クライアントのidを通知
    socket.emit("robby joined", {id: socket.id, username: username });
    //ルームリストを通知
    socket.emit("room list", getArrayKeys(roomList));
    socket.join("robby");
    // クライアントにロビーにいるユーザを通知
    io.to("robby").emit("robby info", userList);
    // 他のユーザに通知
    socket.broadcast.emit("user joined robby", {id: socket.id, username: username });

    //他人のsocket.id を指定して個別メッセージを送れるが、
    //socketの接続先クライアントにはto(id)で個別メッセージを送れない。
    //したがって、  user.id == socket.id のときは, socket.to(user.id).emit ではなく、socket.emitに切り替えが必要
    //もしくは io.to(id).emit を使用する。

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
    if(user == undefined){ socket.emit("error command", 10); return; } //user not logged in
    if(msg == undefined || msg == null || msg.text == undefined || msg.text.length == 0) { return; } //just ignore
    io.to("robby").emit("push robby msg",
      {text: validator.escape(msg.text), username: user.name}); //to everyone
  });

//ルーム関連メッセージの処理----------------------------------------------------
  // クライアントがルームから出たとき
  socket.on("leave room", function(){
    var user = userList[socket.id];
    if(user == undefined){ socket.emit("error command", 10); return; } //user not logged in
    var roomId = user.roomId; //var roomId = findRoomId(user);
    if(roomId == null){ socket.emit("error command", 2004); return; } //not joined in any room
    var room = roomList[roomId];
    room.removeUser(user);
    socket.leave(roomId);
    socket.emit("room left");
    //socket.emit("room info", null);

    //他ユーザに通知
    socket.broadcast.to(roomId).emit("user left room", { username: user.name});
    socket.broadcast.to(roomId).emit("room info", room.toClient());
    
    if(room.getUserCount() == 0) {
      room.initialize();
      console.log("initialize room #" + room.id);
    }
      
    //ロビー情報を更新
    io.to("robby").emit("robby info", userList);
  });

  // ルームへ入るとき
  socket.on("join room", function (roomId){
    if(roomId == undefined || roomId == null || roomId.length == 0){
      socket.emit("room joining failed", 2000);  //reason: roomid is empty
      return;
    }
    var user = userList[socket.id];
    if(user == undefined){
      socket.emit("room joining failed", 2001); //reason: not logged in a robby with proper way
      return;
    }
    if(user.roomId != null){
      socket.emit("room joining failed", 2002); //reason: already joined in a room
      return;
    }
    if(!(roomId in roomList)){
      socket.emit("room joining failed", 2003); //reason: room doesn't exist
      return;
    }
    var room = roomList[roomId];

    // ロビーのユーザ情報配列にデータを追加
    room.addUser(user);
    socket.join(roomId);
    // クライアントにルームに接続できたことと、ルームIDを通知
    socket.emit("room joined", {id: room.id});

    // クライアントにルーム情報を渡す
    io.to(room.id).emit("room info", room.toClient());
    io.to(room.id).emit("room ready info", room.toClient().player);

    // 他のユーザに、接続があったことを通知
    socket.broadcast.to(room.id).emit("user joined room",
      {id: socket.id, username: user.name });
    
    //ロビー情報を更新
    io.to("robby").emit("robby info", userList);
  });

  // クライアントがルーム情報の再送を要求したとき
  socket.on("req room info", function() {
    var user = userList[socket.id];
    if(user == undefined){ socket.emit("error command", 10); return; } //user not logged in
    var room = roomList[user.roomId];
    if(room == undefined){ socket.emit("error command", 2004); return; } //not joined in any room
    // クライアントにルームにいるユーザを通知
    socket.emit("room info", room.toClient());
    socket.emit("room ready info", room.toClient().player);
  });

  // クライアントからのメッセージ送信を受け取ったとき
  socket.on("send room msg", function(msg) {
    var user = userList[socket.id];
    if(user == undefined){ socket.emit("error command", 10); return; } //user not logged in
    var room = roomList[user.roomId];
    if(room == undefined){ socket.emit("error command", 2004); return; } //not joined in any room
    if(msg == undefined || msg == null || msg.text == undefined || msg.text.length == 0) { return; } //just ignore
    io.to(room.id).emit("push room msg",
      {text: validator.escape(msg.text), username: user.name}); //everyone in the same room
  });

//ゲーム準備のやりとりをするメッセージ-----------------------------------------
  // sit on
  socket.on("sit on", function(n){
    var user = userList[socket.id];
    if(user == undefined){ socket.emit("error command", 10); return; } //user not logged in
    if(user.roomId == null){ socket.emit("error command", 2004); return; } //not joined in any room
    var room = roomList[user.roomId];

    if(room.sitUser(n, user)){
      //success sitting
      io.to(room.id).emit("player sat", {no: n, username: user.name});
      io.to(room.id).emit("room info", room.toClient());
      
      //ゲーム中に着席した場合、手持ち駒情報を送る
      if(room.round){
        io.to(user.id).emit("private game info", room.player[n]);
        //5しの処理選択中ならば、要求を再び送信する
        if(room.goshi && room.goshiPlayerNo == (user.playerNo + 2)%4){
          io.to(user.id).emit("goshi");
        }
      }
      //ロビー情報を更新
      io.to("robby").emit("robby info", userList);
    }else{
      socket.emit("error command", 2501); //cannot 
    }
    
  });

  // stand up
  socket.on("stand up", function(){
    var user = userList[socket.id];
    if(user == undefined){ socket.emit("error command", 10); return; } //user not logged in
    if(user.roomId == null){ socket.emit("error command", 2004); return; } //not joined in any room
    var room = roomList[user.roomId];

    
    if(room.standUser(user)){
      //success standing
      io.to(room.id).emit("player stood", {no: user.playerNo, username: user.name});
      io.to(room.id).emit("room info", room.toClient());
      io.to(room.id).emit("room ready info", room.toClient().player);

      //ロビー情報を更新
      io.to("robby").emit("robby info", userList);
    }
  });
  
  //swap seats
  socket.on("swap seats", function(){
    var user = userList[socket.id];
    if(user == undefined){ socket.emit("error command", 10); return; } //user not logged in
    if(user.roomId == null){ socket.emit("error command", 2004); return; } //not joined in any room
    var room = roomList[user.roomId];
    
    if(room.swapSeats()){
      //success swapping
      io.to(room.id).emit("room info", room.toClient());
      io.to(room.id).emit("room ready info", room.toClient().player);
    }
    else {
      socket.emit("error command", 2005); //cannot swap seats
    }
  });
  
  var goshiFunc = function(room){
    //５し判定＆処理
    var type = room.getGoshiType();
    if(goita.Util.canFinishRoundGoshiType(type)) {
      room.finishRoundByShi(type)
    }
    var checkFinished = false;
    switch(type){
      case goita.Util.GoshiType.GOSHI:
        var p = room.findGoshiPlayer();
        room.goshi = true; //５し状態
        room.goshiPlayerNo = p[0].no;
        io.to(room.id).emit("room info", room.toClient());

        //まず全員に５し発生を通知（選択者も含めとく）
        io.to(room.id).emit("goshi wait", p[0].no);

        //５し発生プレイヤーの相方に選択を求める
        io.to(room.player[(p[0].no + 2)%4].user.id).emit("goshi");
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
        io.to(room.id).emit("deal again tsuigoshi", room); //include private info
        room.dealAgain();
        io.to(room.id).emit("room info", room.toClient());
        //send private game info to each player
        for(var j=0;j<4;j++) {
          io.to(room.player[j].user.id).emit("private game info", room.player[j]);
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
    if(user == undefined){ socket.emit("error command", 10); return; } //user not logged in
    if(user.roomId == null){ socket.emit("error command", 2004); return; } //not joined in any room
    var room = roomList[user.roomId];

    if(room.setPlayerReady(user.playerNo)){
      //success to set ready
      io.to(room.id).emit("player ready", {no: user.playerNo, username: user.name});
      io.to(room.id).emit("room ready info", room.toClient().player);

      //if all players set ready, start game/round
      if(room.isAllPlayerReady()){

        //start game if it's not started yet
        if(!room.game && room.startGame()){
          io.to(room.id).emit("game started");
          
          //ロビー情報を更新
          io.to("robby").emit("robby info", userList);
        }

        //start round if it's not started yet
        if(!room.round && room.startRound()){
          io.to(room.id).emit("room info", room.toClient());
          io.to(room.id).emit("room ready info", room.toClient().player);
          io.to(room.id).emit("round started");

          //send private game info to each player
          for(var i=0;i<4;i++){
            io.to(room.player[i].user.id).emit("private game info", room.player[i]);
          }
          
          io.to(room.player[room.turn].user.id).emit("req play");

          goshiFunc(room); //check goshi

          //ロビー情報を更新
          io.to("robby").emit("robby info", userList);
        }
      }
    }
  });

  // cancel ready
  socket.on("cancel ready", function(){
    var user = userList[socket.id];
    if(user == undefined){ socket.emit("error command", 10); return; } //user not logged in
    if(user.roomId == null){ socket.emit("error command", 2004); return; } //not joined in any room
    var room = roomList[user.roomId];

    if(room.setPlayerUnready(user.playerNo)){
      //success to set unready
      io.to(user.roomId).emit("player cancel ready", user.name);
      io.to(room.id).emit("room ready info", room.toClient().player);
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
    if(user == undefined){ socket.emit("error command", 10); return; } //user not logged in
    if(user.roomId == null){ socket.emit("error command", 2004); return; } //not joined in any room
    var room = roomList[user.roomId];

    socket.emit("room info", room.toClient());
    if(user.playerNo != null) {
      socket.emit("private game info", room.player[user.playerNo]);
    }
  });

// play  コマを出す ※あがりも兼ねる
  socket.on("play", function(tegomaIndex){
    var user = userList[socket.id];
    if(user == undefined){ socket.emit("error command", 10); return; } //user not logged in
    if(user.roomId == null){ socket.emit("error command", 2004); return; } //not joined in any room
    var room = roomList[user.roomId];

    //手番を持っているプレイヤーからの要求か確認
    if(!room.isUsersTurn(user)){ socket.emit("error command", 3003); return; }
    var koma = room.player[user.playerNo].tegoma[tegomaIndex];
    var errcode = room.play(tegomaIndex);
    if(errcode != 0){ socket.emit("error command", errcode); return;}
    io.to(room.id).emit("room info", room.toClient());
    io.to(room.id).emit("played", koma); //このメッセージ不要だと思う
    socket.emit("private game info", room.player[user.playerNo]);
    if(room.isRoundFinished()){
      io.to(room.id).emit("round finished", room); //include private info
    }else{
      //request next player to play
      if(!room.attack && room.player[room.turn].user != null) {
        io.to(room.player[room.turn].user.id).emit("req play");
      }
    }

    if(room.isGameFinished()){
      io.to(room.id).emit("game finished");
    }

  });

// pass    'なし
  socket.on("pass", function(){
    var user = userList[socket.id];
    if(user == undefined){ socket.emit("error command", 10); return; } //user not logged in
    if(user.roomId == null){ socket.emit("error command", 2004); return; } //not joined in any room
    var room = roomList[user.roomId];

    //手番を持っているプレイヤーからの要求か確認
    if(!room.isUsersTurn(user)){ socket.emit("error command", 3003); return; }
    var no = room.turn; //save current turn No.

    var errcode = room.pass();
    if(errcode != 0){ socket.emit("error command", errcode); return;}

    io.to(user.roomId).emit("room info", room.toClient());
    io.to(user.roomId).emit("passed", no);

    if(room.player[room.turn].user != null) {
      io.to(room.player[room.turn].user.id).emit("req play"); //if next player is sitting, request play
    }
  });

// goshi proceed '５しのまま続行
  socket.on("goshi proceed", function(){
    var user = userList[socket.id];
    if(user == undefined){ socket.emit("error command", 10); return; } //user not logged in
    if(user.roomId == null){ socket.emit("error command", 2004); return; } //not joined in any room
    var room = roomList[user.roomId];

    if(!room.goshi) { socket.emit("error command", 3007); return; }
    room.goshi = false;
    room.goshiPlayerNo = null;
    //room.clearField();
    io.to(room.id).emit("goshi proceeded");
    io.to(room.id).emit("room info", room.toClient());
  });
  
// goshi deal again '配りなおし
  socket.on("goshi deal again", function(){
    var user = userList[socket.id];
    if(user == undefined){ socket.emit("error command", 10); return; } //user not logged in
    if(user.roomId == null){ socket.emit("error command", 2004); return; } //not joined in any room
    var room = roomList[user.roomId];

    if(!room.goshi) { socket.emit("error command", 3007); return; }
    
    io.to(room.id).emit("deal again", room); //include private info
    room.dealAgain();
    io.to(room.id).emit("room info", room.toClient());
    //send private game info to each player
    for(var i=0;i<4;i++){
      if(room.player[i].user != null){
        io.to(room.player[i].user.id).emit("private game info", room.player[i]);
      }
    }
    
    //goshi
    goshiFunc(room);
  });

});

var aliveCheckTimer = function(){
    for(var i =0; i< io.sockets.sockets.length;i++) {
      var socket = io.sockets.sockets[i];
      var id = socket.id;
      if(id in userList) {
        var user = userList[id];
        if(user.alive) {
          user.alive = false;
        }
        else {
          //user is not alive. force to logout
          socket.leave("robby");
          socket.disconnect();
          console.log("user is not alive: " + user.name);
        }
      }
    }
    
    setTimeout(arguments.callee,  2 * 30 * 1000); //30sec
};



//ユーザが所属する部屋番号を見つける
var findRoomId = function(user){
  if(user == undefined){return null;}
  
  //find user id
  for(var room in roomList)
    for(var u in room.userList){
      if(u.id == user.id){
        return room.id;
      }
    }
    return "";
};

//ユーザ情報のroomIdが正しいか確認する
//クライアントからUserInfoを受け取った場合に使用？
var validateRoomId = function(user){
  if(user == undefined){return false;}

  //find user
  if(findRoomId(user) == user.roomId){
    return true;
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

aliveCheckTimer();
console.log('server started');