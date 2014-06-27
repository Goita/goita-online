/* Goita Client Class
   Implements all WebSocket messages */
var GoitaClient = function(serverURI){
  //private field
  this._eventDefined = false;

  //member field
  this.socket = null;  //socket.io
  this.serverURI = serverURI;
  this.connected = false;
  this.roomId = "";
  this.userName = "";
  this.userId = "";
  this.robbyUserList = [];

  //
  // this.robbyMessageQueue = []; // new Array(); enqueue => push(), dequeue => shift()
  // this.roomMessageQueue = [];  // use as queue

  //event //inject event handler
  this.robbyUserChanged = undefined;  //function(robbyUserList)
  this.robbyMessageAdded = undefined; //function(msg [, style])

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
    socket.on('connect', function() {
      self.connected = true;
      console.log("client connected!");
    });

    // ロビーに入ったというメッセージを受け取ったら
    socket.on('robby entered', function(data){
      console.log("entered in robby");
      socket.id = data.id;
    });

    // 他のユーザが接続を解除したら
    socket.on('user left robby', function(data) {
      console.log('user left:' + data.id);
      self.robbyMessageAdded('user left:' + data.username);
    });

    // 他のユーザが接続したら
    socket.on('user joined robby', function(data) {
      console.log('user joined:' + data.id);
      self.robbyMessageAdded('user joined:' + data.username);
    });

    // ロビーのユーザ一覧を受け取ったら
    socket.on('robby info', function(robbyUserList) {
      console.log('received robby info');
      self.robbyUserList = robbyUserList;
      self.robbyUserChanged(self.robbyUserList);
    });

    socket.on('push robby msg', function(msg) {
      console.log("received robby msg:" + msg)
      self.robbyMessageAdded(msg);
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

  enterRobby : function(name){
    this.socket.emit('enter robby',{username: name});
  },

  //ロビーチャットで発言
  sendRobbyMessage : function(msg){
    this.socket.emit('send robby msg', {id:this.socket.id, msg: msg});
  }
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