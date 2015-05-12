/* Goita Client Class
   handles WebSocket messages */
var GoitaClient = function(){
  //private field
  this._eventDefined = false;

  //member field
  this.socket = null;  //socket.io
  this.serverURI = null;
  this.isConnected = false;
  this.isInRobby = false;
  this.hasGoshi = false; // I have goshi;
  this.roomId = null;
  this.userName = "";
  this.userId = null;
  this.playerNo = null;
  this.userList = []; // {userid : UserInfo} -> robby
  this.roomInfo = null; //RoomInfo
  this.playerInfo = null; //PlayerInfo
  this.privatePlayerInfo = null; //PlayerInfo
  this.keepAlive = false;
  this.alive = true;
  
  this.messageHistoryLimit = 1000;
  this.robbyMessage = []; // new Array(); enqueue => push(), dequeue => shift()
  this.roomMessage = [];
  this.privateMessage = [];

  //event - inject event handler
  this.connected = fnEmpty; //function()
  this.connectFailed = fnEmpty;//function()
  this.disconnected = fnEmpty; //function()
  this.gotAlive = fnEmpty; //function() //got alive message
  this.lostAlive = fnEmpty; //function() //do not receive alive message
  this.robbyUserChanged = fnEmpty;  //function(userList)
  this.robbyMessageAdded = fnEmpty; //function(msg [, header[, type]])
  this.robbyJoined = fnEmpty; //function()
  this.robbyJoiningFailed = fnEmpty; //function(errorcode)
  this.gotError = fnEmpty;
  this.roomListReceived = fnEmpty; //function(roomlist)
  
  this.roomJoined = fnEmpty; //function({id : roomId})
  this.roomInfoChanged = fnEmpty;  //function(RoomInfo)
  this.roomMessageAdded = fnEmpty; //function(msg [, header[, type]])
  this.roomJoiningFailed = fnEmpty; //function(errorcode)
  this.gotPrivateGameInfo = fnEmpty; //function(PlayerInfo)
  this.readyRequested = fnEmpty;  //function()
  this.readyInfoChanged = fnEmpty; //function(RoomInfo)
  this.playRequested = fnEmpty; //function()
  this.gameStarted = fnEmpty; //function()
  this.gameFinished = fnEmpty; //function()
  this.roundStarted = fnEmpty; //function()
  this.roundFinished = fnEmpty; //function(RoomInfo) //非公開情報含む
  this.komaDealtAgain = fnEmpty; //function(RoomInfo) //非公開情報含む
  this.komaDealedAgainTsui = fnEmpty; //function(RoomInfo) //非公開情報含む
  this.gotCommandError = fnEmpty; //function(error)
  this.goshiDecisionRequested = fnEmpty; //function()
  this.goshiShown = fnEmpty; //function(player No.)
  this.goshiProceeded = fnEmpty; //function()
  
};

//class method
GoitaClient.prototype = {
  
  //connect to server
  connect : function(){
    //already isConnected
    if(this.isConnected) return this.socket;

    var self = this;  //capture a client instance

    var socket;
    if(this.serverURI != null)
      io.connect(this.serverURI);
    else
      socket = io.connect();
    this.socket = socket;
    
    //socketが無事取得できていればこの時点で接続確立しているはず。
    if(socket != undefined && socket != null)
    {
      console.log("got socket-client successfully");
    }
    else
    {
      this.isConnected = false;
      this.connectFailed();
    }

    //for reconnecting, no need to define events again
    if(this._eventDefined) return socket;

    //------------define events ------------------
    
    // 接続できたというメッセージを受け取ったら
    socket.on("connect", function() {
      self.isConnected = true;
      self.startKeepAliveTimer();
      console.log("client connected!");
      self.connected();
    });
    
    //切断した場合
    socket.on('disconnect', function(){
      self.isConnected = false;
      self.userId = null;
      self.isInRobby = false;
      self.roomId = null;
      self.roomInfo = null;
      self.stopKeepAliveTimer();
      console.log("client disconnected");
      self.disconnected();
    });
    
    socket.on("answer alive", function(){
      //setTimeoutと組み合わせで、一定時間で応答が来なければ、接続切れと判断するロジックを導入する
      //console.log("answer alive");
      self.alive = true;
      self.gotAlive();
    });

    //unhandled error
    socket.on("error", function(error){
      console.log("happened error: " + error);
      self.gotError(error);
    });

    // ロビーに入ったというメッセージを受け取ったら
    socket.on("robby joined", function(data){
      console.log("joined in robby");
      socket.id = data.id; //特に使う場面がないが一応
      self.userId = data.id;
      self.userName = data.username;
      self.isInRobby = true;
      self.robbyJoined();
    });

    //ロビーに入れなかった場合
    socket.on("robby joining failed", function(error){
      console.log(error);
      self.robbyJoiningFailed(error);
    });

    //ロビーから抜けた場合
    socket.on("robby left", function(){
      self.isInRobby = false;
      console.log("left robby");
    });

    // 他のユーザが接続を解除したら {id: socket.id, username: user.name }
    socket.on("user left robby", function(data) {
      console.log("user left:" + data.id);
      self.robbyMessageAdded(data.username + " がロビーから退出しました", "system", "i");
    });

    // 他のユーザが接続したら {id: socket.id, username: username }
    socket.on("user joined robby", function(data) {
      console.log("user joined:" + data.id);
      self.robbyMessageAdded(data.username + " がロビーに参加しました", "system", "i");
    });

    // ロビーのユーザ一覧を受け取ったら
    socket.on("robby info", function(userList) {
      console.log("received robby info");
      //self.playerNo = userList[self.userId].playerNo; //不要なはず
      self.userList = userList;
      self.robbyUserChanged(self.userList);
    });

    //ロビーメッセージを受け取ったら msg={text: message text, username: user name}
    socket.on("push robby msg", function(msg) {
      //console.log("received robby msg:" + msg);
      self.robbyMessage.push(new Message(msg.text, msg.username));
      self.deleteExcessMessage();
      self.robbyMessageAdded(msg.text, msg.username, "m");
    });
    
    //ルームメッセージを受け取ったら msg={text: message text, username: user name}
    socket.on("push room msg", function(msg) {
      //console.log("received room msg:" + msg.text);
      self.roomMessage.push(new Message(msg.text, msg.username));
      self.deleteExcessMessage();
      self.roomMessageAdded(msg.text, msg.username, "m");
    });

    //ルームリストを受け取ったら
    socket.on("room list", function(roomList){
      console.log("received room list");
      self.roomListReceived(roomList);
    });

    //ルーム関連-----------------------------------------------
    // ルームに入ったというメッセージを受け取ったら data={id:room id}
    socket.on("room joined", function(data){
      console.log("joined in room#" + data.id);
      self.roomId = data.id;
      self.roomJoined(data);
    });

    //ルームに入れなかった場合
    socket.on("room joining failed", function(error){
      console.log(error);
      self.roomJoiningFailed(error);
    });

    //ルームから抜けた場合
    socket.on("room left", function(){
      console.log("left room");
      self.roomId = null;
      self.roomInfo = null;
      self.playerNo = null;
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

    // ルームの情報を受け取ったら
    socket.on("room info", function(room) {
      RoomInfo.activateFunc(room);
      //clientのプロパティを更新
      self.roomInfo = room;
      self.playerNo = null;
      if(room != null){
        for(var i=0;i<4;i++){
          if(room.player[i].user != null && room.player[i].user.id == self.userId){
            self.playerNo = i;
          }
        }
      }
      if(client.playerNo != null)
        self.playerInfo = room.player[client.playerNo];
      else
        self.playerInfo = null;
      //画面にルーム情報変化を通知
      self.roomInfoChanged(self.roomInfo);
    });

    // ルームの情報(秘匿情報含む)を受け取ったら
    socket.on("room public info", function(room) {
      RoomInfo.activateFunc(room);
      //clientのプロパティを更新
      self.roomInfo = room;
      self.playerNo = null;
      if(room != null){
        for(var i=0;i<4;i++){
          if(room.player[i].user != null && room.player[i].user.id == self.userId){
            self.playerNo = i;
          }
        }
      }
      if(client.playerNo != null)
        self.playerInfo = room.player[client.playerNo];
      else
        self.playerInfo = null;
      //画面にルーム情報変化を通知
      self.roomInfoChanged(self.roomInfo);
    });

    socket.on("room ready info", function(players){
      if(client.playerNo != null)
        self.playerInfo = players[client.playerNo];
      else
        self.playerInfo = null;
      self.readyInfoChanged(players);
    });

    // game started    全員がreadyするとゲーム開始したことが通知される
    socket.on("game started",function(){
      console.log("game started");
      self.gameStarted();
    });

    // private game info ゲーム状態情報通知（自分の情報のみを受け取る。）
    socket.on("private game info",function(player){
      console.log("received private game info");
      PlayerInfo.activateFunc(player);
      self.privatePlayerInfo = player;
      self.gotPrivateGameInfo(player);
    });

    // error command   '無効なプレイを受け取ったときの通知
    socket.on("error command",function(error){
      self.gotCommandError(error);
    });

    // game finished     規定点数に達した時に終了を通知
    socket.on("game finished",function(){
      self.gameFinished();
    });

    // game aborted      途中でだれかが抜けた場合
    //（※回線切断の場合などの復帰処理は認証機能がないと無理なので、今は考えない）
    socket.on("game aborted",function(){
    });

    // played          プレイヤーの手を通知
    socket.on("played",function(koma){
    });

    // passed      パス
    socket.on("passed",function(turn){
    });

    // req play    手番プレイヤーへの通知
    socket.on("req play",function(){
      self.playRequested();
    });

    // round started   次ラウンド開始の通知（一定時間で次ラウンド強制開始もありかも）
    socket.on("round started",function(){
      self.roundStarted();
    });

    // round finished  場の非公開情報もついでに送る。
    // ろくし、ななし、はちし、相ごし、対ごしを含む
    socket.on("round finished",function(room){
      RoomInfo.activateFunc(room);
      self.roomInfo = room;
      self.privatePlayerInfo = null;
      self.roundFinished(room);
    });
    
    socket.on("goshi proceeded", function(){
      self.goshiProceeded();
    });

    // deal again 配りなおし
    socket.on("deal again",function(room){
      console.log("got deal again message");
      RoomInfo.activateFunc(room);
      self.roomInfo = room;
      self.komaDealtAgain(room);
    });

    // deal again tsuigoshi 配りなおし
    socket.on("deal again tsuigoshi",function(room){
      RoomInfo.activateFunc(room);
      self.roomInfo = room;
      self.komaDealedAgainTsui(room);
    });

    // goshi ごしの決断を求める（その他のプレイヤーにはgoshi waitを送る)
    socket.on("goshi",function(){
      console.log("got goshi message")
      self.hasGoshi = true;
      self.goshiDecisionRequested();
    });

    // goshi wait ごしの決断をしないその他のプレイヤーは判断を待つ
    socket.on("goshi wait",function(no){
      self.goshiShown(no);
    });

    // time up     手番プレイヤーが時間切れ（ランダムで処理される(パス優先)）
    socket.on("time up",function(){
      //not implemented
      //ランダム処理の内容や、処理後の次手番への移動はサーバーがやるので、
      //クライアントにはあくまで時間切れを伝えるのみ。
    });
    // kifu  ラウンド終了ごとに対戦の棋譜を通知
    socket.on("kifu",function(){
      //not implemented
    });

    //to avoid overloading event
    this._eventDefined = true;
    return socket;
  },

  //close connection
  disconnect : function(){
    this.socket.close();
    //this.isConnected = false;
    console.log("client disconnected...");
  },
  
  sendAlive : function(){
    //console.log("send alive");
    if(this.socket != undefined && this.socket != null && this.isInRobby) {
      this.socket.emit("alive");
    }
  },
  
  startKeepAliveTimer : function(){
    
    this.keepAlive = true;
    var self = this; //capture "this" as GoitaClient instance
    var task = function()
    {
      if(self.keepAlive)
      {
        return;
      }
      self.sendAlive();
      setTimeout(arguments.callee, 5000);
    };
    
    task(); //task start
    this.startCheckAliveTimer();
  },
  
  stopKeepAliveTimer : function(){
    this.keepAlive = false;
  },
  
  startCheckAliveTimer : function(){
    this.alive = true;
    var self = this;
    var task = function()
    {
      if(!self.keepAlive)
      {
        return;
      }
      
      if(self.alive)
      {
        //self.alive = false;
      }
      else
      {
        self.lostAlive();
      }
      setTimeout(arguments.callee, 10000);
    };
    task(); //task start
  },

  joinRobby : function(username){
    this.socket.emit("join robby", username);
  },

  //ロビーチャットで発言
  sendRobbyMessage : function(msg){
    this.socket.emit("send robby msg", {text: msg, username: this.userName});
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
    this.socket.emit("send room msg", {text: msg, username: this.userName});
  },

  //ルーム情報の再要求
  requestRoomInfo : function(){
    this.socket.emit("req room info");
  },

  //ルームから抜ける
  leaveRoom : function(){
    this.socket.emit("leave room");
    this.roomInfo = null;
  },

  sitOn : function(n){
    this.socket.emit("sit on", n);
  },

  standUp : function(){
    this.socket.emit("stand up");
  },
  
  swapSeats : function(){
    this.socket.emit("swap seats");
  },

  setReady : function(){
    this.socket.emit("set ready");
  },

  cancelReady : function(){
    this.socket.emit("cancel ready");
  },

  // req game info   ゲーム状態情報を要求
  requestGameInfo : function(){
    this.socket.emit("req game info");
  },

  // play  駒を出す。ゲーム状況で自動的に出し方を判断させる。ゲーム終了処理まで行って結果を返す。
  play : function(tegomaIndex){
    if(this.privatePlayerInfo == undefined || this.privatePlayerInfo == null) {return;}

    if(0 <= tegomaIndex && tegomaIndex <= 7){ //0-7

      var koma = this.privatePlayerInfo.tegoma[tegomaIndex];
      console.log("selected koma index: " + tegomaIndex + " played: val=" + koma + " text=" + Util.getKomaText(koma));
      if(koma != Util.EMPTY) {
        this.socket.emit("play", tegomaIndex);
      }

    }

  },

  // pass    'なし
  pass : function(){
    this.socket.emit("pass");
  },

  // goshi proceed 'ごしのまま続行
  goshiProceed : function(){
    console.log("send goshi proceed message");
    this.hasGoshi = false;
    this.socket.emit("goshi proceed");
  },

  // goshi deal again '配りなおし
  goshiDealAgain : function(){
    console.log("send goshi deal again message");
    this.hasGoshi = false;
    this.socket.emit("goshi deal again");
  },
  
  deleteExcessMessage : function(){
    while(this.robbyMessage.length > this.messageHistoryLimit) {
      this.robbyMessage.shift();
    }
    
    while(this.roomMessage.length > this.messageHistoryLimit) {
      this.roomMessage.shift();
    }
    
    while(this.privateMessage.length > this.messageHistoryLimit) {
      this.privateMessage.shift();
    }
  }
};

//chat message
var Message = function(msg, from)
{
  this.text = msg;
  this.from = from;
};

//empty method
var fnEmpty = function(){
  var callerName = fnEmpty.caller != null ? fnEmpty.caller.name : "root";
  console.log("unhandled event raised, caller name:" + callerName); 
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