/*
Goita Client view controller
*/
var client;
var _imgDic = new Array();
var _imgLoaded = false;

var _popupTime = 1.0; // 1.0 = 1000ms
var _notifyQueue = []; //message queue for popup

var hiddenStyle = {'visibility':'hidden', "height":"0px", "width":"0px", "font-size":"0", "background": "none"};
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
    drawTegoma(ctx);
  }
  var canvas2 = $("#canvas-game-field");
  if ( canvas2[0] && canvas2[0].getContext ) { 
    var ctx2 = canvas2[0].getContext("2d");
    drawGameField(ctx2, undefined, 3);
  }
};

var notifyPopupTimer = function(){
  setTimeout(function(){
    
    if(!client.hasGoshi) //５しの時は、余計なメッセージを出さない
    {
      if(_popupTime > 0){ _popupTime -= 0.1; }
      if(_popupTime <= 0)
      { 
        //if popup exists, close
        if($("#notify-popup").size() > 0)
        {
          closeNotifyPopup();
        }
        else
        {
          //checked popup is closed
          //fetch new message
          var msg = [];
          while(_notifyQueue.length > 0) //no need to lock, javascript is a single thread model 
          {
            //sleep(1000);
            console.log("fetching msg");
            msg.push(_notifyQueue.shift());
          }
          openNotifyPopup(msg, 0.7 + (msg.length * 0.3));
        }
      }
    }
    setTimeout(arguments.callee, 100);
  }, 100);
};

var stateCheckTimer = function(){
  setTimeout(function()
  {
    if(client != undefined && client != null)
    {
      var activePage = $( "body" ).pagecontainer( "getActivePage" );
      var pagename = activePage[0].attributes.getNamedItem("id").value;
      switch(pagename)
      {
        case "login-page":
          break;
        case "robby-page":
        case "room-page":
          if(client.isConnected && !client.isInRobby)
          {
            showLoginPage();
          }
          break;
      }
      if(!client.isConnected)
      {
        showLoginPage();
      }
    }
    setTimeout(arguments.callee, 5000);
  }, 5000);
};

var bindGoitaClientEvents = function(client){
  client.robbyMessageAdded = addRobbyMessage; //function(msg [, header [, type]])
  client.robbyUserChanged = updateRobbyUser; //function(userList)
  client.robbyJoined = notifyRobbyJoined; //function()
  client.robbyJoiningFailed = notifyRobbyJoinedError; //function(errorcode)
  client.gotError = notifyError; //function(errorcode)

  client.roomListReceived = updateRoomList; //function(roomlist)
  client.roomInfoChanged = updateRoomInfo;  //function(RoomInfo)
  client.roomMessageAdded = addRoomMessage; //function(msg [, header [, type]])
  client.roomJoined = notifyRoomJoined;
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
  //test
  $("#btn-test").click(function(){
    console.log("test button clicked");
    //$("body").pagecontainer("change", "#goshi-confirm-dialog"); //need some options to open dialog
    var tegomaStr = "";
    for(var i=0;i<client.tegoma.koma.length;i++)
    {
      tegomaStr += Util.getKomaText(client.tegoma.koma[i]);
    }
    $("#goshi-confirm-tegoma").text(tegomaStr);  //client.tegoma.toString()
    $("#anchor-goshi-dialog").click();
  });
  
  //ログインボタン
  $('#btn-login').click(function(){
    var loginName = $('#input-login-name').val();
    console.log("login name: ", loginName);
    client.joinRobby(loginName);
  });
  
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
    showRobbyPage();
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
  
  $("#btn-swap-seat").click(function(){
    client.swapSeats();
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
      console.log("selected koma index: " + n + " played: " + Util.getKomaText(koma));
      client.play(koma);
      
    }
    return false;
  });
  
  //駒選択 button version
  $("button","#game-input-container").click(function(){
    var no = $(this).data("no");
    var n = Number(no);
    var koma = client.tegoma.koma[n];
    console.log("selected koma index: " + n + " played: val=" + koma + " text=" + Util.getKomaText(koma));
      client.play(koma);
  });
};

var loadImg = function(){
  
  for(var i = 0;i<10;i++)
  {
    var img = new Image();
    img.src = "./img/koma" + i + ".png" + "?" + new Date().getTime();
    _imgDic[i.toString()] = img;
  }
  
  var emptyimg = new Image();
  emptyimg.src = "./img/koma_empty.png" + "?" + new Date().getTime();
  _imgDic["empty"] = emptyimg;
  
  var glowimg = new Image();
  glowimg.src = "./img/koma_glow.png" + "?" + new Date().getTime();
  _imgDic["glow"] = glowimg;
  
  var komaimg = new Image();
  
  komaimg.onload = function(){
    _imgDic["koma"] = komaimg;
    _imgLoaded = true; //とりあえず、最後の画像が読み込まれたら全部OKってことに。
  };
  komaimg.src = "./img/goita_koma.png" + "?" + new Date().getTime();
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
  loadImg();
  
  testFunc(); //テストコード実行 //
  if(location.host.indexOf('c9.io') < 0) //c9.io上でのテストコードをすべて隠す
  {
    
    $("#btn-test").remove(); //enable for publishing
    $("#debug-text").css(hiddenStyle);
  }
  $("#canvas-game-input").css(hiddenStyle); //もういらない
  
  //Timer Start
  stateCheckTimer();
  notifyPopupTimer();
  
  resetPage(); //Reset Navigation
  
  client = new GoitaClient(); //server);

  //set event handler
  bindGoitaClientEvents(client);

  //クライアント画面での操作に対するイベントの定義とバインディング
  bindScreenEvents(client);

  //connect and join in robby
  client.connect();
  
  if (!client.isConnected) 
  {
    //サーバーに接続できませんでした。とメッセージを出す。
    addLoginMessage("サーバーに接続できませんでした。");
  }
  
  //まずはログインページへ
  showLoginPage();
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
  var canvas = $("#canvas-game-field");
  $("#debug-text").html("UA is desktop:"+ ua.isDesktop +", UA is iOS Retina:" + ua.isiOSRetina +" ww:"+ ww.toFixed(0) + " wh:" + wh.toFixed(0) + " dpr:" + dpr + " vLen:" + virtualLen.toFixed(0));
  if(wl * x < cLen && (ua.isiPhone || ua.isiOSRetina || ua.isDesktop )) //画面幅がcanvasサイズより小さいなら、調整を入れる
  {
    canvas.css({width: wl * x + "px", height: wl * x + "px"});
  }
  else if(false) //仮想画面幅で表示するデバイスがあればこの対応をする。今のところ対応条件不明。
  {
    canvas.css({width: virtualLen + "px", height: virtualLen + "px"});
  }
  else //調整不要なら、デフォルトに戻す?
  {
    var l = cLen;
    if(dpr >= 1.5) //高DPI端末は少し大きめに表示 //意味がない？？？
    {
      l = wl * x < cLen ? wl * x : cLen;
    }
    canvas.css({width: l + "px", height: l + "px"});
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
var openNotifyPopup = function(msgList, autocloseTime){
  if(msgList == undefined || msgList.length == 0) {return;}
  //create popup
  var popup = $('<div data-role="popup" id="notify-popup" data-theme="b"></div>');
  var newmsg = $('<div id="new-notify-msg"></div>');
  for(var i = 0;i < msgList.length;i++)
  {
    var msg = msgList[i];
    var text = msg.text;
    var header = msg.header == undefined ? "system" : msg.header; //default: system info
    var type = msg.type == undefined ? "i" : msg.type; //default: system info
    if(msg.type == undefined){ msg.type = "i"} 
    newmsg.append('<div class="notify-msg">' 
                + '<div class="msg-header ' + type +'">' + header + '</div>'
                + '<div class="msg-separator ' + type + '">' + ":" + '</div>'
                + '<div class="msg-text ' + type + '">' + text + '</div>'
              +'</div>');
  }
  popup.append(newmsg);
  $(popup).appendTo($.mobile.activePage).popup();
  $( document ).on( "popupafterclose", "#notify-popup", function() {
        $( this ).remove();
    });
  
  var notify = $("#notify-popup");
  _popupTime = autocloseTime == undefined ? 1.0 : autocloseTime;
  notify.popup("open");
};

var closeNotifyPopup = function(){
  $("#notify-popup").popup("close");
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
  //list.scrollTop(list.height());
  list.scrollTop(list[0].scrollHeight);
};

//ロビーユーザ一覧を更新
var updateRobbyUser = function(userList){
  var list = $("#robby-user-list");
  list.empty();
  for(var id in userList){
    var info = '<div class="robby-user-info">';
    
    var n = '<div class="user-info-name">' + userList[id].name + '</div>';
    info += n;
    
    if(userList[id].roomId != null)
    {
      var r = '<div class="user-info-roomid">' + userList[id].roomId.padZero(2) + '</div>';
      info += "(room#" + r + ")";
    }
    if(userList[id].isPlaying)
    {
      var p = '<div class="user-info-playing">' + (userList[id].isPlaying ? "ゲーム中" : "") + '</div>';
      info += "-" + p;
    }
    info += '</div>';
    list.append(info);
  }
};

var notifyError = function(error){
  addRobbyMessage(error, "error", "e");
  
  //general error
  if(error.toString().indexOf("error"))
  {
    client.leaveRobby();
    resetPage();
    showLoginPage();
  }
};

var notifyRobbyJoined = function(){
  showRobbyPage(); //メインページへ
};

var notifyRoomJoined = function(){
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
      list.append("<option value='" + i +"' id='" + "opt-room" + i + "'>" + "ルーム #" + i.padZero(2) + "</option>");
  }
  
  //list.val(0);
  //$("#opt-room0").attr("selected");
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
    $("#room-header-name").html("ルーム");
    $("#room-msg-list").empty();
    return;
  }

  //updateRoomInfo
  console.log("update RoomInfo");
  $("#room-name").html("room #" + room.id.padZero(2));
  $("#room-header-name").html("ルーム #" + room.id.padZero(2));
  var userlist = $("#room-user-list");
  for(var id in room.userList){
    userlist.append("<div class='username'>" + room.userList[id].name + "</div>");
  }
  
  //change player1-4 button text
  //btn-siton-player1-seat
  for(i=0;i<4;i++)
  {
    var btn = $("#btn-siton-player" + (i+1).toString() + "-seat");
    if(room.player[i] == null)
    {
      btn.html("p" + (i+1).toString());
      btn.removeAttr("disabled");
    }
    else
    {
      btn.html(room.player[i].name);
      btn.attr("disabled","disabled");
    }
  }
  
  //change ready button text
  if(client.playerNo !==null){
    $("#btn-ready-game").html(room.player[client.playerNo].ready ? "READY取消" : "READY");
  }
  
  var canvas = $("#canvas-game-field");
  if ( ! canvas[0] || ! canvas[0].getContext ) { return false; }
  var ctx = canvas[0].getContext("2d");
  drawGameField(ctx, room, this.playerNo);

  console.log("finish updating RoomInfo");
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
  //var newestMsg = $(".room-msg:eq(-1)");
  list.scrollTop(list[0].scrollHeight);
};

var notifyRoomJoinedError = function(error){
  addRobbyMessage(ErrorMsg.getMsgText(error), "error", "e");
};

var updatePrivateGameInfo = function(tegoma){
  if(tegoma === undefined){
    tegoma = new KomaInfo("89898989"); //for testing
    
    //if missing tegoma info. request for newest tegoma info.
    if(client.playerNo != null)
      client.requestGameInfo();
  }
  //button version
  for(var i=0;i<8;i++){
    var btn = $("#btn-input" + i);
    if(i<tegoma.koma.length)
    {
      btn.html('<img src="./img/koma' + tegoma.koma[i] + '.png" />');
      btn.css({'visibility':'visible'});
    }
    else
    {
      btn.css({'visibility':'hidden'});
    }
  }
  
  //canvas version
  var canvas = $("#canvas-game-input");
  if ( ! canvas[0] || ! canvas[0].getContext ) { return false; }
  var ctx = canvas[0].getContext("2d");
  drawTegoma(ctx, tegoma);
};

var notifyRequestForReady = function(){
  addRoomMessage("Readyを押して下さい。","system", "i");
};

var notifyRequestToPlay = function(){
  //addNotifyMessage("出す駒またはパスを選択してください。","system", "i");
  var checked = $("#option-sound:checked").length > 0 ? true : false;
  if(checked)
  {
    ion.sound.play("notify_turn");
  }
};

var notifyGameStarted = function(){
  addRoomMessage("ゲームが開始しました。","system", "i");
};

var notifyGameFinished = function(){
  addRoomMessage("ゲームが終了しました。","system", "i");
};

var notifyRoundStarted = function(){
  var turnUser = client.roomInfo.player[client.roomInfo.turn].name;
  addRoomMessage(turnUser+" の手番で新しいラウンドが開始しました。","system", "i");
};

var notifyRoundFinished = function(room){
  RoomInfo.activateFunc(room); //
  var type = room.Goshi();
  var p = room.findGoshiPlayer();
  switch(type)
  {
    case Util.GoshiType.NO_GOSHI:
      addRoomMessage("ラウンドが終了しました。","system", "i");
      break;
    case Util.GoshiType.ROKUSHI:
      addRoomMessage(p[0].player.name + " の６しで終了しました。","system", "i");
      break;
    case Util.GoshiType.NANASHI:
      addRoomMessage(p[0].player.name + " の７しで終了しました。","system", "i");
      break;
    case Util.GoshiType.HACHISHI:
      addRoomMessage(p[0].player.name + " の８しで終了しました。","system", "i");
      break;
    case Util.GoshiType.AIGOSHI:
      addRoomMessage(p[0].player.name +" と " + p[1].player.name + " の１０しで終了しました。","system", "i");
      break;
  }
  
  var canvas = $("#canvas-game-field");
  if ( ! canvas[0] || ! canvas[0].getContext ) { return false; }
  var ctx = canvas[0].getContext("2d");
  drawGameField(ctx, room, this.playerNo);
};

var notifyDealedAgain = function(room){
  addRoomMessage("駒を配り直しました。","system", "i");
  
  var canvas = $("#canvas-game-field");
  if ( ! canvas[0] || ! canvas[0].getContext ) { return false; }
  var ctx = canvas[0].getContext("2d");
  drawGameField(ctx, room, this.playerNo);
};

var notifyCommandError = function(error){
  //TODO: errorの内容でメッセージ分けたい
  addRoomMessage(ErrorMsg.getMsgText(error),"error", "e");
};

var confirmGoshi = function(){
  addRoomMessage("５しの処理を選択して下さい。", "system", "i");
  closeNotifyPopup();
  
  var tegomaStr = "";
  for(var i=0;i<client.tegoma.koma.length;i++)
  {
    tegomaStr += Util.getKomaText(client.tegoma.koma[i]);
  }
  $("#goshi-confirm-tegoma").text(tegomaStr);
  
  var a = $("#anchor-goshi-dialog");
  a.css(visibleStyle);
  a.click();
};

var notifyGoshi = function(no){
  addRoomMessage(client.roomInfo.player[no].name + "が「５し」です。","system", "i");
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
  
  if(room.goshi)
  {
    RoomInfo.activateFunc(room);
    var p = room.findGoshiPlayer();
    var n = p[0].no;
    room.field[n] = new KomaInfo("11111000"); //draw goshi
  }
  
  //６し以上で終了した場合は、全員の手駒をfieldに表示する
  if(room.rokushi)
  {
    if(room.tegoma.length>=4)
    {
      for(var i=0;i<4;i++)
      {
        room.field[i] = room.tegoma[i];
      }
    }
  }
  
  
  var width = 440;
  var height = 440;
  var komaWidth = 42;
  ctx.fillStyle="#cc9";
  ctx.fillRect(0,0,width,height);
  
  var n = 0;
  //player#1 (Me)
  n = (0+myNo)%4;
  drawKomaField(ctx, room.field[n],(n==room.lastPlayedPlayerNo), komaWidth, 130, 330, 0);
  drawPlayerInfo(ctx, room.player[n], 120, 420, 0);
  drawReady(ctx,room.player[n],140, 340, 0);
  
  //player#2 (The right side player of my opponents)
  n = (1+myNo)%4;
  drawKomaField(ctx, room.field[n],(n==room.lastPlayedPlayerNo), komaWidth, 340, 300, -90);
  drawPlayerInfo(ctx, room.player[n], 280, 300, 0);
  drawReady(ctx,room.player[n], 340, 300, -90);
  
  //player#3 (My partner)
  n = (2+myNo)%4;
  drawKomaField(ctx, room.field[n],(n==room.lastPlayedPlayerNo), komaWidth, 310, 110, 180);
  drawPlayerInfo(ctx, room.player[n], 120, 0, 0);
  drawReady(ctx,room.player[n], 300, 100, 180);
  
  //player#4 (The left side player of my opponents)
  n = (3+myNo)%4;
  drawKomaField(ctx, room.field[n],(n==room.lastPlayedPlayerNo), komaWidth, 100, 140, 90);
  drawPlayerInfo(ctx, room.player[n], 0, 120, 0);
  drawReady(ctx,room.player[n], 100, 140, 90);
  
  //team point, round
  drawGameInfo(ctx, room, 150, 160, 0);
  
};

var drawKomaField = function(ctx, field, last, komaSize, tx, ty, r){
  ctx.translate(tx,ty);
  ctx.rotate(r*Math.PI/180);
  
  // ctx.strokeStyle="#963";
  // ctx.font= "30px Verdana";
  
  // for(var i=0;i<field.koma.length;i++){
  //   var x = Math.floor(i/2)*komaSize;
  //   var y = i%2*komaSize;
    
  //   if(i==field.koma.length - 1 && last){
  //     ctx.fillStyle="#9fc";
  //   }else{
  //     ctx.fillStyle="#fc9";
  //   }
    
  //   ctx.fillRect(x,y,komaSize, komaSize);
    
  //   var text = Util.getKomaText(field.koma[i]);
  //   if(text === ""){
  //     ctx.fillStyle="#c96";
  //     ctx.fillRect(x,y,komaSize, komaSize);
  //   }
  //   ctx.strokeRect(x,y,komaSize, komaSize);
  //   ctx.fillStyle="#000";
  //   ctx.fillText(text,x+5,y+30);
  // }
  
  for(var i=0;i<8;i++)
  {
    var x = Math.floor(i/2)*komaSize;
    var y = i%2*komaSize;
    var komaCount = field.koma.length;
    if(i<komaCount)
    {
      var koma = field.koma[i];
      ctx.drawImage(_imgDic[koma], x, y);
      
      if(komaCount <= 6)
      {
        if((i==(komaCount - 1)) && last)
        {
          ctx.drawImage(_imgDic["glow"], x, y);
        }
      }
      else
      {
        if(i==5 && last)
        {
          ctx.drawImage(_imgDic["glow"], x, y);
        }
      }
    }
    else
    {
      ctx.drawImage(_imgDic["empty"], x, y);
    }
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
    tegoma = new KomaInfo("89898989"); //for testing
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