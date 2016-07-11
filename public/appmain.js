/*
Goita Client view controller
*/
var client;
var isRoomInit = true;
var _imgDic = [];
var _imgLoaded = false;

var _popupTime = 1.0; // 1.0 = 1000ms
var _notifyQueue = []; //message queue for popup

var hiddenStyle = {'visibility':'hidden'};
var collapseStyle = {'visibility':'hidden', "height":"0px", "width":"0px", "font-size":"0", "background": "none"};
var visibleStyle = {'visibility':'visible'};

//initialize sound
ion.sound({
    sounds: [
        {alias:"notify_turn", name: "kotsudumi1"}
    ],

    // main config
    path: "sound/",
    preload: false,
    multiplay: true,
    volume: 1.0
});

//test
var testFunc = function(){
  var canvas = $("#canvas-game-input");
  if ( canvas[0] && canvas[0].getContext ) {
    var ctx = canvas[0].getContext("2d");
    drawTegoma(ctx, undefined);
  }

  drawGameField(undefined, 3);
};

var notifyPopupTimer = function(){

  if(_popupTime > 0){ _popupTime -= 0.1; }
  if(_popupTime <= 0) {
    //if popup exists, close
    if($("#notify-message-box").css('visibility') == 'visible') {
      closeNotifyPopup();
    }
    else {
      //checked popup is closed
      //fetch new message
      var msg = [];
      while(_notifyQueue.length > 0){ //no need to lock, javascript is a single thread model{
        //console.log("fetching msg");
        msg.push(_notifyQueue.shift());
      }
      openNotifyPopup(msg, 1 + (msg.length - 1) * 0.3);
    }
  }
  setTimeout(arguments.callee, 100);
};

var stateCheckTimer = function(){
  if(client != undefined && client != null) {
    if(client.isConnected) {
      var activePage = $( "body" ).pagecontainer( "getActivePage" );
      var pagename = activePage[0].attributes.getNamedItem("id").value;

      switch(pagename) {
        case "login-page":
          if(client.isInRobby) { showRobbyPage(); }
          break;
        case "robby-page":
          if(!client.isInRobby) { showLoginPage(); }
          if(client.roomId != null) { showRoomPage(); }
          break;
        case "room-page":
          if(!client.isInRobby) { showLoginPage(); }
          if(client.roomId == null) { showRobbyPage(); }
          break;
      }
    }
    else {
      showLoginPage();
    }
  }
  setTimeout(arguments.callee, 1000);
};

var bindGoitaClientEvents = function(client){
  //connection events
  client.gotError = notifyError; //function(errorcode)
  client.gotAlive = gotAliveMessage; //function()
  client.lostAlive = lostAliveMessage; //function()

  //robby events
  client.robbyMessageAdded = addRobbyMessage; //function(msg [, header [, type]])
  client.robbyUserChanged = updateRobbyUser; //function(userList)
  client.robbyJoined = notifyRobbyJoined; //function()
  client.robbyJoiningFailed = notifyRobbyJoinedError; //function(errorcode)

  //room events
  client.roomListReceived = updateRoomList; //function(roomList)L
  client.roomInfoChanged = updateRoomInfo;  //function(RoomInfo, isPublic)
  client.readyInfoChanged = updateReadyInfo;//function(player[])
  client.roomMessageAdded = addRoomMessage; //function(msg [, header [, type]])
  client.roomJoined = notifyRoomJoined;
  client.roomJoiningFailed = notifyRoomJoinedError; //function(errorcode)
  client.readyRequested = notifyRequestForReady;  //function()

  //game events
  client.gotPrivateGameInfo = updatePrivateGameInfo; //function(KomaInfo)
  client.playRequested = notifyRequestToPlay; //function()
  client.gameStarted = notifyGameStarted; //function()
  client.gameFinished = notifyGameFinished; //function()
  client.roundStarted = notifyRoundStarted; //function()
  client.roundFinished = notifyRoundFinished; //function(RoomInfo) //非公開情報含む
  client.komaDealtAgain = notifyDealtAgain; //function(RoomInfo) //非公開情報含む
  client.gotCommandError = notifyCommandError; //function(error)
  client.goshiDecisionRequested = confirmGoshi; //function()
  client.goshiShown = notifyGoshi; //function()
  client.goshiProceeded = notifyGoshiProceeded;
};

var bindScreenEvents = function(client){
  //test
  $("#btn-test").click(function(){
    console.log("test button clicked");
    var tegomaStr = "手駒情報がありません・・・";
    if( client.privatePlayerInfo != null)
      tegomaStr = client.privatePlayerInfo.tegoma.toString();
    $("#goshi-confirm-tegoma").text(tegomaStr);
    $("#anchor-goshi-dialog").click();
  });
  
  //ログインボタン
  $('#btn-login').click(function(){
    var loginName = $('#input-login-name').val();
    console.log("login name: ", loginName);
    login(loginName, undefined);
  });
  
  //ロビーチャット送信ボタン
  $("#input-robby-msg").keydown(function(event) {
    // エンターキーで発言をサーバに送信する
    if (event.keyCode == 13) {
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
    if (event.keyCode == 13) {
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
    showRobbyPage();
  });

  //プレイヤー着席ボタン //forループで設定するとクロージャの変数キャプチャがうまくいかない
  $("#btn-siton-player1-seat").click(function(){ client.sitOn(0); });
  $("#btn-siton-player2-seat").click(function(){ client.sitOn(1); });
  $("#btn-siton-player3-seat").click(function(){ client.sitOn(2); });
  $("#btn-siton-player4-seat").click(function(){ client.sitOn(3); });

  //退席ボタン
  $("#btn-standup-seat").click(function(){
    client.standUp();
  });
  
  $("#btn-swap-seat").click(function(){
    client.swapSeats();
  });

  //レディーボタン
  $("#btn-ready-game").click(function(){
    if(client.playerInfo == null){ return; }

    if(client.playerInfo.ready){
      client.cancelReady();
    }else{
      client.setReady();
    }
  });
  
  //パスボタン
  $("#btn-game-pass").click(function(){
    if(client.roomInfo == null){ return; }
    client.pass();
  });
  
  //５し選択
  $("#confirm-goshi-proceed").click(function(){
    console.log("selected goshi proceed");
    client.goshiProceed();
    $("#anchor-goshi-dialog").css(hiddenStyle);
  });
  
  $("#confirm-goshi-deal").click(function(){
    console.log("selected goshi deal again");
    client.goshiDealAgain();
    $("#anchor-goshi-dialog").css(hiddenStyle);
  });
  
  //駒選択 button version
  $("button","#game-input-container").click(function(){
    var no = $(this).data("no");
    var n = Number(no);
    client.play(n);
  });

  $("#option-show-hidden").change(function(){
    //if(this.checked) {  }
    drawGameField(client.roomInfo, client.playerNo);
  });
  
  // 棋譜生成
  $("#btn-save-kifu").click(saveKifu);
};

var loadImg = function(){
  for(var i = 0;i<10;i++) {
    var img = new Image();
    img.src = "./img/koma" + i + ".png" + "?" + new Date().getTime();
    _imgDic[i.toString()] = img;
  }

  for(var i = 1;i<10;i++) {
    var img = new Image();
    img.src = "./img/koma" + i + "dark.png" + "?" + new Date().getTime();
    _imgDic[i.toString() + "dark"] = img;
  }
  
  var emptyImg = new Image();
  emptyImg.src = "./img/komax.png" + "?" + new Date().getTime();
  _imgDic["empty"] = emptyImg;
  
  var glowImg = new Image();
  glowImg.src = "./img/koma_glow.png" + "?" + new Date().getTime();
  _imgDic["glow"] = glowImg;

  var leftImg = new Image();
  leftImg.src = "./img/left.png" + "?" + new Date().getTime();
  _imgDic["left"] = leftImg;
  var komaImg = new Image();
  
  komaImg.onload = function(){
    _imgDic["koma"] = komaImg;
    _imgLoaded = true; //とりあえず、最後の画像が読み込まれたら全部OKってことに。
  };
  komaImg.src = "./img/koma.png" + "?" + new Date().getTime();
};

function sleep(time) {
  var d1 = new Date().getTime();
  var d2 = new Date().getTime();
  while (d2 < d1 + time) {
    d2 = new Date().getTime();
   }
   return;
}

$(document).ready(function() {
  loadImg(); //画像の読み込み
  
  testFunc(); //テストコード実行 //
  if(location.host.indexOf('c9.io') < 0){ //c9.io上でのテストコードをすべて隠す
    
    //$("#btn-test").remove(); //enable for publishing
    $("#debug-text").css(collapseStyle);
  }
  $("#btn-test").remove();
  $("#debug-text").css(collapseStyle);
  //create object
  client = new GoitaClient();

  //Timer Start
  stateCheckTimer();
  notifyPopupTimer();

  //set event handler
  bindGoitaClientEvents(client);

  //クライアント画面での操作に対するイベントの定義とバインディング
  bindScreenEvents(client);
  
  resetPage(); //Reset Navigation
  //まずはログインページへ
  showLoginPage();
  
  //ひとまずここでオフライン表示を描画しておく
  var canvas = $("#canvas-offline-room");
  if ( ! canvas[0] || ! canvas[0].getContext ) { return false; }
  var ctx = canvas[0].getContext("2d");
  drawOfflineIcon(ctx);
});

//ブラウザを閉じる前に、サーバーとの接続を切る
$(window).on("beforeunload", function(){
  if(client != undefined && client != null)
  {
    client.leaveRoom();
    client.leaveRobby();
  }
});

//resize対応
//Retinaディスプレイ等できれいに表示するための処理ができてない。
//http://qiita.com/calmbooks/items/0522e8c1082629c6c4d1
$(window).on('load resize', function(){
  var cLen = 440;
  var x = 0.9;
  var ww = $(window).width() * 1.05 - 30; //IE対応? 1.05倍と、 スクロールバー対応の20px
  var wh = $(window).height() * 1.05 - 30; 
  var dpr = window.devicePixelRatio; //2ならRetina Display, Androidは1.5-3.0など・・・
  dpr = dpr < 1.0 ? 1.0 : dpr; //1.0以上に補正
  var horizontal = Math.abs(window.orientation) === 90; //iOS only ?
  var wl = Math.min(wh, ww); //horizontal ? wh : ww; //短いほうの画面幅
  var virtualLen = wl / dpr; //仮想画面幅
  var cgamearea = $("#canvas-game-field, #canvas-game-info ,#game-main");
  var msgarea = $("#notify-message-box");
  $("#debug-text").html("UA is desktop:"+ ua.isDesktop +", UA is iOS Retina:" + ua.isiOSRetina +" ww:"+ ww.toFixed(0) + " wh:" + wh.toFixed(0) + " dpr:" + dpr + " vLen:" + virtualLen.toFixed(0));
  if(wl * x < cLen && (ua.isiPhone || ua.isiOSRetina || ua.isDesktop )) //画面幅がcanvasサイズより小さいなら、調整を入れる
  {
    cgamearea.css({width: wl * x + "px", height: wl * x + "px"});
    msgarea.css({width: wl * x + "px"});
  }
  else if(false) //仮想画面幅で表示するデバイスがあればこの対応をする。今のところ対応条件不明。
  {
    cgamearea.css({width: virtualLen + "px", height: virtualLen + "px"});
    msgarea.css({width: virtualLen + "px"});
  }
  else //調整不要なら、デフォルトに戻す?
  {
    var l = cLen;
    if(dpr >= 1.5) //高DPI端末は少し大きめに表示 //意味がない？？？
    {
      l = wl * x < cLen ? wl * x : cLen;
    }
    cgamearea.css({width: l + "px", height: l + "px"});
    msgarea.css({width: l + "px"});
  }
});

var resetPage = function(){
  $("body").pagecontainer("change", "#", {allowSamePageTransition:true, reload:true});
};

var showLoginPage = function(){
  $("body").pagecontainer("change", "#login-page");
};

var showRobbyPage = function(){
  $("body").pagecontainer("change", "#robby-page", {reverse:true});
};

var showRoomPage = function(){
  $("body").pagecontainer("change", "#room-page", {transition:"slide"});
};

//msgList[] = {text: message text, header: message header, type: message type}
var openNotifyPopup = function(msgList, autoCloseTime){
  if(msgList == undefined || msgList.length == 0) {return;}
  
  //create messagebox
  var msgbox = $('#notify-message-box');
  var newMsg = $('<div id="new-notify-msg"></div>');
  for(var i = 0;i < msgList.length;i++) {
    var msg = msgList[i];
    var text = msg.text;
    var header = msg.header == undefined ? "system" : msg.header; //default: system info
    var type = msg.type == undefined ? "i" : msg.type; //default: system info
    if(msg.type == undefined){ msg.type = "i"} 
    newMsg.append('<div class="notify-msg">'
                + '<div class="msg-header ' + type +'">' + header + '</div>'
                + '<div class="msg-separator ' + type + '">' + ":" + '</div>'
                + '<div class="msg-text ' + type + '">' + text + '</div>'
              +'</div>');
  }
  msgbox.empty();
  msgbox.append(newMsg);
  _popupTime = autoCloseTime == undefined ? 1.0 : autoCloseTime;
  msgbox.css('height', newMsg[0].scrollHeight);
  msgbox.css(visibleStyle); //show messagebox
};

var closeNotifyPopup = function(){
  var msgbox = $("#notify-message-box");
  msgbox.css(hiddenStyle);
};

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
var login = function(userid, password) {
    //connect and join in robby
  client.connect();
  
  //on success to connect
  client.connected = function(){
    client.joinRobby(userid);
    console.log("joinRobby: " + userid);
  };
  //on failed to connect
  client.connectFailed = function(){
    addLoginMessage("サーバーに接続できませんでした。");
  };
  //on disconnected
  client.disconnected = function(){
    addLoginMessage("サーバーとの接続が切れました。");
    showLoginPage();
  };
};

var gotAliveMessage = function() {
  $(".notify-offline").css(collapseStyle);
};

var lostAliveMessage = function() {
  $(".notify-offline").css({'visibility':'visible', "height":"", "width":"", "font-size":"", "background": ""});
};

//最新メッセージを表示
var addNotifyMessage = function(msg){
  var text = msg.text;
  var header = msg.header == undefined ? "system" : msg.header; //default: system info

  $("#new-robby-msg").html(header + ":" + text);
  $("#new-room-msg").html(header + ":" + text);
  _notifyQueue.push(msg);
};
//ログインメッセージを追加
var addLoginMessage = function(msg){
  console.log("addLoginMessage " + msg );
  $("#login-error-msg").text(msg);
};
//ロビーメッセージを追加
var addRobbyMessage = function(msg, header, type){
  console.log("addRobbyMessage: " + type + ":" + header + ":" + msg );
  addNotifyMessage({text:msg, header:header, type:type});
  var list = $("#robby-msg-list");
  if(header == undefined) {header = "system"; type = "i"} //default: system info
  list.append('<div class="robby-msg">' 
                + '<div class="msg-header ' + type +'">' + header + '</div>'
                + '<div class="msg-separator ' + type + '">' + ":" + '</div>'
                + '<div class="msg-text ' + type + '">' + msg + '</div>'
              +'</div>');

  list.scrollTop(list[0].scrollHeight);
};

var addRoomMessage = function(msg, header, type){
  console.log("addRoomMessage: " + type + ":" + header + ":" + msg );
  addNotifyMessage({text:msg, header:header, type:type});
  var list = $("#room-msg-list");
  if(header == undefined) {header = "system"; type = "i"} //default: system info
  list.append('<div class="room-msg">'
      + '<div class="msg-header ' + type +'">' + header + '</div>'
      + '<div class="msg-separator ' + type + '">' + ":" + '</div>'
      + '<div class="msg-text ' + type + '">' + msg + '</div>'
      +'</div>');

  list.scrollTop(list[0].scrollHeight);
};

//ロビーユーザ一覧を更新
var updateRobbyUser = function(userList){
  var list = $("#robby-user-list");
  list.empty();
  for(var id in userList){
    var info = '<div class="robby-user-info">';
    
    var userName = '<div class="user-info-name">' + userList[id].name + '</div>';
    info += userName;
    
    if(userList[id].roomId != null)
    {
      var roomId = '<div class="user-info-roomid">' + userList[id].roomId.padZero(2) + '</div>';
      info += "(room#" + roomId + ")";
    }
    if(userList[id].isPlaying)
    {
      var playing = '<div class="user-info-playing">' + (userList[id].isPlaying ? "ゲーム中" : "") + '</div>';
      info += "-" + playing;
    }
    info += '</div>';
    list.append(info);
  }
};

var notifyError = function(error){
  addRobbyMessage(error, "error", "e");
  
  //general error
  if(error.toString().indexOf("error")) {
    client.leaveRobby();
    resetPage();
    showLoginPage();
  }
};

var notifyRobbyJoined = function(){
  showRobbyPage(); //メインページへ
};

var notifyRoomJoined = function(){
  //5しのボタンを非表示に。
  //TODO:ここで行うべき処理かは・・・要検討
  var a = $("#anchor-goshi-dialog");
  a.css(hiddenStyle);
  
  isRoomInit = true;
  
  showRoomPage();  //ルームページへ
};

var notifyRobbyJoinedError = function(error){
  addLoginMessage(ErrorMsg.getMsgText(error));
};

var updateRoomList = function(roomList){
  var list = $("#select-room-list");
  console.log(roomList);
  list.empty();
  for(var i in roomList){
      list.append("<option value='" + i +"' id='opt-room" + i + "'>"
          + "ルーム #" + i.padZero(2) + "</option>");
  }
};

var updateReadyInfo = function(players){
  //change ready button text
  if(client.playerNo != null){
    $("#btn-ready-game").html(players[client.playerNo].ready ? "READY取消" : "READY");
  }

  drawGameReady(players, client.playerNo);
};

var updateRoomUserInfo = function(room){
    
    $("#room-user-list").empty();
    
    if(room == null){
        return;
    }
    
    var userlist = $("#room-user-list");
    for(var id in room.userList){
        userlist.append("<div class='username'>" + room.userList[id].name + "</div>");
    }
    
    //change player1-4 button text
    //btn-siton-player1-seat
    for(i=0;i<4;i++) {
        var btn = $("#btn-siton-player" + (i+1).toString() + "-seat");
        if(room.player[i].user == null) {
            btn.html("p" + (i+1).toString());
            btn.removeAttr("disabled");
        }
        else {
            btn.html(room.player[i].user.name);
            btn.attr("disabled","disabled");
        }
    }
};

var updateRoomInfo = function(room, isPublic){
  var i; //as counter

  //clearRoomInfo
  //console.log("clear RoomInfo");
  $("#room-name").empty(); 

  if(room == null){
    $("#room-name").html("---");
    $("#room-header-name").html("ルーム");
    $("#room-msg-list").empty();
    return;
  }
  
  updateRoomUserInfo(room);

  //updateRoomInfo
  //console.log("update RoomInfo");
  $("#room-name").html("room #" + room.id.padZero(2));
  $("#room-header-name").html("ルーム #" + room.id.padZero(2));

  //ラウンドの合間（終了?READY押すまで）は盤面の描画しない
  //つまり、最初にRoomに入った時と、ラウンドの最中のみ描画
  if( isRoomInit || room.round){
      drawGameField(room, client.playerNo);
      isRoomInit = false;
  }
  //console.log("finish updating RoomInfo");
};



var notifyRoomJoinedError = function(error){
  addRobbyMessage(ErrorMsg.getMsgText(error), "error", "e");
};

var updatePrivateGameInfo = function(player){
  if(player == undefined){
    player = new PlayerInfo(); //for testing
    player.tegoma = new KomaCollection("89898989");
    //if missing tegoma info. request for newest tegoma info.
    if(client.playerNo != null)
      client.requestGameInfo();
  }
  //button version
  for(var i=0;i<8;i++){
    var btn = $("#btn-input" + i);
    //btn.html('<img src="./img/koma' + player.tegoma[i] + '.png" />');
    btn.html('<canvas id="input-tegoma' + i + '" width="48" height="48" ></canvas>');

    var canvas = $("#input-tegoma" + i);
    if ( !canvas[0] || !canvas[0].getContext ) { return false; }
    var ctx = canvas[0].getContext("2d");

    var koma = player.tegoma[i];
    if(koma == Util.EMPTY) {
      ctx.drawImage(_imgDic["empty"], 0, 0);
    }
    else{
      ctx.drawImage(_imgDic["koma"], 0, 0);
      ctx.drawImage(_imgDic[player.tegoma[i]], 0, 0);
    }

  }
};

var notifyRequestForReady = function(){
  addRoomMessage("Readyを押して下さい。","system", "i");
};

var notifyRequestToPlay = function(){
  //addNotifyMessage("出す駒またはパスを選択してください。","system", "i");
  var checked = $("#option-sound:checked").length > 0;
  if(checked) {
    var vol = $("#option-sound-volume").val();

    ion.sound.play("notify_turn", {
      volume: vol
    });
  }
};

var notifyGameStarted = function(){
  addRoomMessage("ゲームが開始しました。","system", "i");
};

var notifyGameFinished = function(){
  addRoomMessage("ゲームが終了しました。","system", "i");
};

var notifyRoundStarted = function(){
  var turnUser = client.roomInfo.player[client.roomInfo.turn].user.name;
  addRoomMessage(turnUser+" の手番で新しいラウンドが開始しました。","system", "i");
};

var notifyRoundFinished = function(room){
  var type = room.getGoshiType();
  var p = room.findGoshiPlayer();
  switch(type)
  {
    case Util.GoshiType.NO_GOSHI:
      addRoomMessage("ラウンドが終了しました。","system", "i");
      break;
    case Util.GoshiType.ROKUSHI:
      addRoomMessage((p.length > 0 ? p[0].player.user.name : "(名称不明)") + " の６しで終了しました。","system", "i");
      break;
    case Util.GoshiType.NANASHI:
      addRoomMessage((p.length > 0 ? p[0].player.user.name : "(名称不明)") + " の７しで終了しました。","system", "i");
      break;
    case Util.GoshiType.HACHISHI:
      addRoomMessage((p.length > 0 ? p[0].player.user.name : "(名称不明)") + " の８しで終了しました。","system", "i");
      break;
    case Util.GoshiType.AIGOSHI:
      addRoomMessage((p.length > 0 ? p[0].player.user.name : "(名称不明)") +" と "
                    + (p.length > 1 ? p[1].player.user.name : "(名称不明)") + " の１０しで終了しました。","system", "i");
      break;
  }

  drawGameField(room, this.playerNo);
};

var notifyDealtAgain = function(room){
  addRoomMessage("駒を配り直しました。","system", "i");
  drawGameField(room, this.playerNo);
};

var notifyCommandError = function(error){
  //erromsg-xx.js
  addRoomMessage(ErrorMsg.getMsgText(error),"error", "e");
};

var confirmGoshi = function(){
  console.log("requested to confirm goshi decision");
  addRoomMessage("５しの処理を選択して下さい。", "system", "i");

  var wait = function(){
    var tegomaStr = "手駒情報取得に失敗しました・・・";
    if(client.privatePlayerInfo != null)
      tegomaStr = client.privatePlayerInfo.tegoma.toString();
    $("#goshi-confirm-tegoma").text(tegomaStr);

    var a = $("#anchor-goshi-dialog");
    a.css(visibleStyle);
    a.click(); //perform click
    console.log("goshi confirm dialog opened");
  };

  setTimeout(wait, 1000);
  console.log("wait for closing other popup");
};

var closePopup = function(){
  var dialog = $(".ui-page-active .ui-popup-active");
  if(isAnyPopupOpen()){
    dialog.popup("close");
  }
};

var isAnyPopupOpen = function(){
  return $(".ui-page-active .ui-popup-active").length > 0;
};

var notifyGoshi = function(no){
  addRoomMessage(client.roomInfo.player[no].user.name + "が「５し」です。","system", "i");
};

var notifyGoshiProceeded = function(){
  addRoomMessage("「５し」のまま続行しました。","system", "i");
  //updateRoomInfo(client.roomInfo);
};

String.prototype.padZero = function(len, c){
    var s = this, cr = c || '0';
    while(s.length < len) s = cr + s;
    return s;
};

var drawGameReady = function(players, myNo){
  if(players == undefined){ return; }

  if(players == null){console.log("room ready info is null"); return;}
  if(myNo == null){ myNo = 0;} //it's for observer

  var canvas = $("#canvas-game-info");
  if ( ! canvas[0] || ! canvas[0].getContext ) { return false; }
  var ctx = canvas[0].getContext("2d");

  var width = 440;
  var height = 440;

  ctx.clearRect(0,0,width,height);

  var n;
  //player#1 (Me)
  n = (0+myNo)%4;
  drawReady(ctx,players[n],140, 340, 0);

  //player#2 (The right side player of my opponents)
  n = (1+myNo)%4;
  drawReady(ctx,players[n], 340, 300, -90);

  //player#3 (My partner)
  n = (2+myNo)%4;
  drawReady(ctx,players[n], 300, 100, 180);

  //player#4 (The left side player of my opponents)
  n = (3+myNo)%4;
  drawReady(ctx,players[n], 100, 140, 90);
};

var drawGameField = function(room, myNo){
  if(room == undefined){ return; }
  
  if(room == null){console.log("room is null"); return;}
  if(myNo == null){ myNo = 0;}

  var p, no, i;

  if(room.goshi) {
    room.player[room.goshiPlayerNo].field = new KomaCollection("11111"); //draw goshi
  }
  
  //６し以上で終了した場合は、上がりプレイヤーの手駒を描画
  if(room.rokushi) {
    p = room.findGoshiPlayer();
    if(p.length > 0) {
      if(p.length>1){
        //10し
        for(i=0;i< p.length;i++){
          room.player[p[i].no].field = new KomaCollection("11111"); //10し
          for(var j=0;j<5;j++) room.player[p[i].no].tegoma.removeKoma(Util.SHI);
        }
      } else{
        no = p[0].no;
        var shiCount = room.player[no].tegoma.count(Util.SHI);
        if(shiCount == 6){
          var max = room.player[no].tegoma.findMaxPointKoma();
          var maxCount = room.player[no].tegoma.count(max);
          room.player[no].field = new KomaCollection(
              Util.repeatStr(Util.SHI, shiCount)
              + Util.repeatStr(max, maxCount));
          for(i=0;i<6;i++) room.player[no].tegoma.removeKoma(Util.SHI);
          for(i=0;i<maxCount;i++) room.player[no].tegoma.removeKoma(max);
        } else{
          room.player[no].field = room.player[no].tegoma; //7し、8しは全手駒表示したらOK
          room.player[no].tegoma = new KomaCollection(); //empty
        }
      }
    }
  }

  //終了時に手駒を公開する。

  var canvas = $("#canvas-game-field");
  if ( !canvas[0] || !canvas[0].getContext ) { return false; }
  var ctx = canvas[0].getContext("2d");
  
  var width = 440;
  var height = 440;
  var komaWidth = 42;
  ctx.fillStyle="#cc9";
  ctx.fillRect(0,0,width,height);

  var showHiddenChecked = $("#option-show-hidden:checked").length > 0;
  var n;
  //player#1 (Me)
  n = (0+myNo)%4;
  drawKomaField(ctx, room.player[n].field,(n==room.lastPlayedPlayerNo), komaWidth, 130, 330, 0);
  if(room.player[n].tegoma != null){
    drawPrivateField(ctx, room.player[n].tegoma, komaWidth, 130, 330, 0);
  }
  if(room.player[n].openfield != null){
    drawHiddenField(ctx, room.player[n].getHiddenKoma(), komaWidth, 130, 330, 0);
  }else if(showHiddenChecked && client.privatePlayerInfo != null){
    drawHiddenField(ctx, client.privatePlayerInfo.getHiddenKoma(), komaWidth, 130, 330, 0);
  }
  drawPlayerInfo(ctx, room.player[n], 120, 420, 0);
  
  //player#2 (The right side player of my opponents)
  n = (1+myNo)%4;
  drawKomaField(ctx, room.player[n].field,(n==room.lastPlayedPlayerNo), komaWidth, 340, 300, -90);
  if(room.player[n].tegoma != null){
    drawPrivateField(ctx, room.player[n].tegoma, komaWidth, 340, 300, -90);
  }
  if(room.player[n].openfield != null){
    drawHiddenField(ctx, room.player[n].getHiddenKoma(), komaWidth, 340, 300, -90);
  }
  drawPlayerInfo(ctx, room.player[n], 280, 300, 0);
  
  //player#3 (My partner)
  n = (2+myNo)%4;
  drawKomaField(ctx, room.player[n].field,(n==room.lastPlayedPlayerNo), komaWidth, 310, 110, 180);
  if(room.player[n].tegoma != null){
    drawPrivateField(ctx, room.player[n].tegoma, komaWidth, 310, 110, 180);
  }
  if(room.player[n].openfield != null){
    drawHiddenField(ctx, room.player[n].getHiddenKoma(), komaWidth, 310, 110, 180);
  }
  drawPlayerInfo(ctx, room.player[n], 120, 0, 0);
  
  //player#4 (The left side player of my opponents)
  n = (3+myNo)%4;
  drawKomaField(ctx, room.player[n].field,(n==room.lastPlayedPlayerNo), komaWidth, 100, 140, 90);
  if(room.player[n].tegoma != null){
    drawPrivateField(ctx, room.player[n].tegoma, komaWidth, 100, 140, 90);
  }
  if(room.player[n].openfield != null){
    drawHiddenField(ctx, room.player[n].getHiddenKoma(), komaWidth, 100, 140, 90);
  }
  drawPlayerInfo(ctx, room.player[n], 0, 120, 0);
  
  //team point, round
  drawGameInfo(ctx, room, 150, 160, 0);
};

var drawKomaField = function(ctx, field, last, komaSize, tx, ty, r){
  ctx.translate(tx,ty);
  ctx.rotate(r*Math.PI/180);
  
  for(var i=0;i<8;i++) {
    var x = Math.floor(i/2)*komaSize;
    var y = i%2*komaSize;
    var komaCount = field.getKomaListExceptEmpty().length;
    if(i<komaCount) {
      var koma = field[i];
      ctx.drawImage(_imgDic["koma"], x, y);
      ctx.drawImage(_imgDic[koma], x, y);
      
      if(komaCount <= 6) {
        if((i==(komaCount - 1)) && last) {
          ctx.drawImage(_imgDic["glow"], x, y);
        }
      }
      else {
        if(i==5 && last)
        {
          ctx.drawImage(_imgDic["glow"], x, y);
        }
      }
    }
    else {
      ctx.drawImage(_imgDic["empty"], x, y);
    }
  }
  
  //reset transformation
  ctx.rotate(-r*Math.PI/180);
  ctx.translate(-tx,-ty);
};

var drawPrivateField = function(ctx, tegoma, komaSize, tx, ty, r){
  ctx.translate(tx,ty);
  ctx.rotate(r*Math.PI/180);

  var komaList = tegoma.getKomaListExceptEmpty();
  var komaCount = komaList.length;
  var j=0;
  for(var i=8-komaCount;i<8;i++) {
    var x = Math.floor(i/2)*komaSize;
    var y = i%2*komaSize;

    var koma = komaList[j];
    ctx.drawImage(_imgDic["left"], x, y);
    ctx.drawImage(_imgDic[koma + "dark"], x, y);
    j++;
  }

  //reset transformation
  ctx.rotate(-r*Math.PI/180);
  ctx.translate(-tx,-ty);
};

var drawHiddenField = function(ctx, hidden, komaSize, tx, ty, r){
  ctx.translate(tx,ty);
  ctx.rotate(r*Math.PI/180);

  for(var i=0;i<8;i++) {
    var x = Math.floor(i/2)*komaSize;
    var y = i%2*komaSize;

    var koma = hidden[i];
    if(koma != null)
      ctx.drawImage(_imgDic[koma + "dark"], x, y);
  }

  //reset transformation
  ctx.rotate(-r*Math.PI/180);
  ctx.translate(-tx,-ty);
};

var drawPlayerInfo = function(ctx, player, tx, ty, r){
  if(player == null || player.user == null) {return;}
  
  ctx.translate(tx,ty);
  ctx.rotate(r*Math.PI/180);
  
  ctx.font= "20px Verdana";
  ctx.fillStyle="#f66";
  if(player.hasTurn){
    var text = "★";
    ctx.fillText(text,0,14);
  }
  ctx.font= "12px Verdana";
  ctx.fillStyle="#000";
  ctx.fillText("p" + (player.user.playerNo+1).toString() + ":" + player.user.name,20,14);
  
  //reset transformation
  ctx.rotate(-r*Math.PI/180);
  ctx.translate(-tx,-ty);
};

var drawHasTurnNotification = function(ctx, tx, ty){
  ctx.translate(tx,ty);

  ctx.fillStyle="#69c";
  ctx.fillRect(0,0,160,30);

  ctx.strokeStyle="#666";
  ctx.strokeRect(0,0,160,30);

  ctx.font = "40px Verdana";
  ctx.fillStyle="#f00";
  ctx.fillText(TextDic.isMyTurn,0,16);

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
  
  var p13 = room.player[0].point + room.player[2].point;
  var p24 = room.player[1].point + room.player[3].point;
  
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

var drawOfflineIcon = function(ctx){
  ctx.fillStyle="#922";
  ctx.beginPath();
  ctx.arc(10, 10, 10, 0, Math.PI * 2.0, true);
  ctx.fill();
  ctx.fillStyle="#f66";
  ctx.beginPath();
  ctx.arc(10, 10, 8, 0, Math.PI * 2.0, true);
  ctx.fill();
};

var saveKifu = function() {
  var content = client.roomInfo.kifuText;
  var bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  var blob = new Blob([ bom, content ], { "type" : "text/plain" });

  var date = new Date();
  var filename = "goita_kifu_" + date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate() + "-" + date.getHours() + "-" + date.getMinutes() + "-" + date.getSeconds() + ".yaml";

  if (window.navigator.msSaveBlob) { 
    window.navigator.msSaveBlob(blob, filename); 

    // msSaveOrOpenBlobの場合はファイルを保存せずに開ける
    window.navigator.msSaveOrOpenBlob(blob, filename); 
  } else {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.href = URL.createObjectURL(blob);
    a.target = '_blank';
    a.download = filename;
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL();
  }
};
