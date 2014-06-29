/* Goita Client Class
   Implements all WebSocket messages */
var GoitaClient = function(serverURI){
  //private field
  this._eventDefined = false;

  //member field
  this.socket = null;  //socket.io
  this.serverURI = serverURI;
  this.connected = false;
  this.isInRobby = false;
  this.roomId = "";
  this.userName = "";
  this.userId = "";
  this.userList = [];
  this.roomInfo = null;
  this.tegoma = "";

  // ネットワーク負荷軽減が必要なら、逐次送信をやめてキューを使う
  // this.robbyMessageQueue = []; // new Array(); enqueue => push(), dequeue => shift()
  // this.roomMessageQueue = [];  // use as queue

  //event - inject event handler
  this.robbyUserChanged = undefined;  //function(robbyUserList)
  this.robbyMessageAdded = undefined; //function(msg [, style])
  this.robbyJoiningFailed = undefined; //function(errorcode)

  this.roomInfoChanged = undefined;  //function(RoomInfo)
  this.roomMessageAdded = undefined; //function(msg [, style])
  this.roomJoiningFailed = undefined; //function(errorcode)

};

//class method
GoitaClient.prototype = {

  //connect to server
  connect : function(callback){
    //already connected
    if(this.connected) return this.socket;

    var self = this;  //capture a client instance

    var socket = io.connect(this.serverURI);
    this.socket = socket;

    //for reconnecting, it doesn't need to define event again
    if(this._eventDefined) return socket;

    //以下、メッセージの実装
    // 接続できたというメッセージを受け取ったら
    socket.on("connect", function() {
      self.connected = true;
      console.log("client connected!");
    });

    //予定外のエラー
    socket.on("error", function(error){
      console.log("happend error: " + error);
    });

    // ロビーに入ったというメッセージを受け取ったら
    socket.on("robby joined", function(data){
      console.log("joined in robby");
      socket.id = data.id; //特に使う場面がないが一応
      self.isInRobby = true;
    });

    //ロビーに入れなかった場合
    socket.on("robby joining failed", function(error){
      console.log(error);
      self.robbyJoiningFailed(error);
    });

    //ロビーから抜けた場合
    socket.on("robby left", function(){
      console.log("left robby");
    });

    // 他のユーザが接続を解除したら
    socket.on("user left robby", function(data) {
      console.log("user left:" + data.id);
      self.robbyMessageAdded("user left:" + data.username);
    });

    // 他のユーザが接続したら
    socket.on("user joined robby", function(data) {
      console.log("user joined:" + data.id);
      self.robbyMessageAdded("user joined:" + data.username);
    });

    // ロビーのユーザ一覧を受け取ったら
    socket.on("robby info", function(robbyUserList) {
      console.log("received robby info");
      self.robbyUserList = robbyUserList;
      self.robbyUserChanged(self.robbyUserList);
    });

    socket.on("push robby msg", function(msg) {
      console.log("received robby msg:" + msg);
      self.robbyMessageAdded(msg);
    });

    //ルーム関連-----------------------------------------------
    // ルームに入ったというメッセージを受け取ったら
    socket.on("room joined", function(data){
      console.log("joined in room");
    });

    //ルームに入れなかった場合
    socket.on("room joining failed", function(error){
      console.log(error);
      self.roomJoiningFailed(error);
    });

    //ルームから抜けた場合
    socket.on("room left", function(){
      console.log("left room");
      self.roomInfo = null;
    });

    // ルームの他のユーザが接続を解除したら
    socket.on("user left room", function(data) {
      console.log("user left:" + data.username);
      self.roomMessageAdded("user left:" + data.username);
    });

    // ルームに他のユーザが接続したら
    socket.on("user joined room", function(data) {
      console.log("user joined:" + data.username);
      self.roomMessageAdded("user joined:" + data.username);
    });

    // ルームのユーザ一覧を受け取ったら
    socket.on("room info", function(roomInfo) {
      console.log("received room info");
      self.roomInfo = roomInfo;
      self.roomUserChanged(self.roomInfo);
    });

    //ルームメッセージを受け取ったら
    socket.on("push room msg", function(msg) {
      console.log("received room msg:" + msg);
      self.roomMessageAdded(msg);
    });
    this._eventDefined = true;
    return socket;
  },

  //close connection
  disconnect : function(){
    this.socket.close();
    this.connected = false;
    console.log("client disconnected...");
  },

  joinRobby : function(name){
    this.socket.emit("join robby",{username: name});
  },

  //ロビーチャットで発言
  sendRobbyMessage : function(msg){
    this.socket.emit("send robby msg", { msg: msg});
  },

  //ロビー情報の再要求
  requestRobbyInfo : function(){
    this.socket.emit("req robby info");
  },

  //ロビーから抜けるだけ。※名称変更して入りなおすときに使えるかも？
  leaveRobby : function(){
    this.socket.emit("leave robby");
  },

  joinRoom : function(id){
    this.socket.emit("join room",id);
  },

  //ルームチャットで発言
  sendRoomMessage : function(msg){
    this.socket.emit("send robby msg", { msg: msg});
  },

  //ルーム情報の再要求
  requestRoomInfo : function(){
    this.socket.emit("req room info");
  },

  //ルームから抜ける
  leaveRoom : function(){
    this.socket.emit("leave room");
  },

};

// The .bind method from Prototype.js
if (!Function.prototype.bind) { // check if native implementation available
  Function.prototype.bind = function(){
    var fn = this, args = Array.prototype.slice.call(arguments),
        object = args.shift();
    return function(){
      return fn.apply(object,
        args.concat(Array.prototype.slice.call(arguments)));
    };
  };
}