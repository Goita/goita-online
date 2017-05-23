//ユーザ情報 //ロビー所属時用の情報を持つ
var UserInfo = function(id, name){
  this.id = id; //socket.id
  this.name = name; //display username
  this.loginId = null; //twitter id / null:guest
  this.roomId = null; //検索する処理を省くために持たせる
  
  this.isPlaying = false; //現在ゲームに参加中
  
  this.playerNo = null; //検索する処理を省くために持たせる
  this.alive = true; //alive check
  this.active = true; //ユーザが、browserウインドウをアクティブにしていない。 browser側から通知させる？
  this.rate = 0;
  
  //UserInfoにゲームの情報を持たせない！
  //ゲームの進行に使用する情報はPlayerInfoに持たせる
};

var PlayerInfo = function() {
  this.user = null; //UserInfo
  this.hasTurn = false;
  this.sitting = false;
  this.ready = false;
  //player[0].point + player[2].point = team1's total points.
  //player[1].point + player[3].point = team2's total points.
  this.point = 0;
  this.tegoma = new KomaCollection();
  this.field = new KomaCollection();
  this.openfield = new KomaCollection();
};

PlayerInfo.activateFunc = function(player){
  player.__proto__ = PlayerInfo.prototype;
  if(player.user != null) {
    player.user.__proto__ = UserInfo.prototype;
  }
  if(player.field != null) {
    player.field.__proto__ = KomaCollection.prototype;
  }
  if(player.openfield != null) {
    player.openfield.__proto__ = KomaCollection.prototype;
  }
  if(player.tegoma != null) {
    player.tegoma.__proto__ = KomaCollection.prototype;
  }
};

PlayerInfo.prototype = {
  /**
   * get the hidden koma array(the places are indicated)
   * @returns {Array} hidden koma: the value of koma / opened koma or empty: null
   */
  getHiddenKoma : function(){
    var i, diff = [];
    if(this.field == null || this.openfield == null){
      for(i=0;i<8;i++) {
        diff[i] = null;
      }
      return diff;
    }

    //diff field and opened field
    for(i=0;i<8;i++) {
      if(this.field[i] == Util.HIDDEN) {
        diff[i] = this.openfield[i];
      }
      else{ diff[i] = null; }
    }
    return diff;
  }
};

/**
 * 駒情報（出した駒、持ち駒共通)
 * 常に空を含め、8個の要素を持つ配列で表す
 * @param {string} [komaStr=EMPTY*8]
 * @constructor
 */
var KomaCollection = function(komaStr){
  var i;
  for(i=0;i<8;i++){
    this[i] = Util.EMPTY;
  }

  if(komaStr != undefined && komaStr != null && komaStr.length > 0) {
    for(i=0;i<8;i++){
      if(i < komaStr.length) {
        this[i] = komaStr.charAt(i);
      }
    }
  }
};

//Extend KomaCollection
KomaCollection.prototype = [];
KomaCollection.constructor = KomaCollection;

/**
 * count number of koma
 * @param koma - filter to count
 * @returns {number} number of koma
 */
KomaCollection.prototype.count = function(koma) {
  var c = 0, i;
  if (koma == undefined || koma.length != 1) {
    //count all koma
    for (i = 0; i < 8; i++) {
      if (this[i] != Util.EMPTY) {
        c++;
      }
    }
    return c;
  }

  //count given koma
  for (i = 0; i < 8; i++) {
    if (this[i] == koma) {
      c++;
    }
  }
  return c;
};

/**
 * get the text of koma collection
 * @returns {string}
 */
KomaCollection.prototype.toString = function(){
  return this.join("");
};

KomaCollection.prototype.join = function(separator){
  var ret = "";
  for(var i=0;i<8;i++) {
    if(i>0) ret += separator;
    ret += Util.getKomaText(this[i]);
  }
  return ret;
};

//@overrides
KomaCollection.prototype.indexOf = function(koma){
  for(var i=0;i<8;i++) {
    if(this[i] == koma){
      return i;
    }
  }
  return -1;
};

KomaCollection.prototype.sort = function(){
  var temp = [];
  var i;
  for(i=0;i<8;i++){
    temp[i] = this[i];
  }
  temp.sort();
  for(i=0;i<8;i++){
    this[i] = temp[i];
  }
};

KomaCollection.prototype.clear = function(){
  for(var i=0;i<8;i++){
    this.removeKomaAt(i); //this[i] = Util.EMPTY;
  }
};

/**
 * 出し駒用メソッド
 * put a koma into the field.
 * you can use this function for field
 * @param koma
 */
KomaCollection.prototype.putKoma = function(koma) {
  var index = this.indexOf(Util.EMPTY);
  if(index < 0) {return;}
  this[index] = koma;
};

/**
 * 手駒用メソッド
 * remove a koma from your tegoma
 * @param koma
 */
KomaCollection.prototype.removeKoma = function(koma) {
  var index = this.indexOf(koma);
  this[index] = Util.EMPTY;
};

/**
 * 手駒用メソッド
 * remove a koma from your tegoma
 * @param {number} index of a koma
 */
KomaCollection.prototype.removeKomaAt = function(index) {
  this[index] = Util.EMPTY;
};

KomaCollection.prototype.hasKoma = function(koma) {
  return this.indexOf(koma) >= 0;
};

/**
 * return if you have OU & GYOKU
 * ( and also is your second attack turn )
 * @returns {boolean}
 */
KomaCollection.prototype.isDamaDama = function() {
  //2回目の攻めから、王玉両方持っていればOK
  return this.count() < 6 && this.indexOf(Util.OU) >= 0 && this.indexOf(Util.GYOKU) >= 0;
};

/**
 * 得点が最も高い駒を返す
 * get the koma which has the maximum point
 * @returns {string}
 */
KomaCollection.prototype.findMaxPointKoma = function() {
  var max = 0;
  var temp = 0;
  var koma = Util.EMPTY;
  for (var i = 0; i < 8; i++) {
    //ソート済みの前提なら、一番最後の駒を見ればいいだけ。
    temp = Util.getPoint(this[i]);
    if (temp > max) {
      koma = this[i];
      max = temp;
    }
  }
  return koma;
};

KomaCollection.prototype.getKomaListExceptEmpty = function(){
  var ret = [];
  var c = 0;
  for(var i=0;i<8;i++) {
    if(this[i] != Util.EMPTY){
      ret[c] = this[i];
      c++;
    }
  }
  return ret;
};

var PlayInfo = function(playerNo, koma, hidden, tegomaIndex, fieldIndex) {
  if(arguments.length < 5) {return;}
  this.pass = koma == Util.PASS;
  this.playerNo = playerNo;
  this.koma = koma;
  this.hidden = hidden;
  this.tegomaIndex = tegomaIndex;
  this.fieldIndex = fieldIndex; // fieldIndex % 2 == 0 means block
};

var GameOption = function() {
  //game option
  this.winningPoint = 150;
  this.defaultStartPlayer = null;
  this.rating = false;
  this.time = 120;
  this.byoyomi = 10;
  this.timeExpireLosePoint = 30;
};

//ゲームルームの情報
var RoomInfo = function(roomId){
  this.id = roomId;
  this.userList = {}; //{user id: UserInfo}
  this.game = false; //playing game
  this.round = false; //started round
  this.roundCount = 0;
  this.turn = 0;
  this.from = 0;  //attack from
  this.attack = false;  //next play is attack or block
  //this.attackCount = 0;
  this.attackKoma = "";
  this.lastWonPlayer = null;
  this.ouUsed = false;
  this.goshi = false; //５し発生中
  this.goshiPlayerNo = null;
  this.rokushi = false; //６し以上で終了
  this.lastPlayedPlayerNo = 0; //the last player played koma(attack/block)
  this.swapCount = 0;
  this.kifu = [];
  this.kifuText = "";
  
  //game option
  this.option = new GameOption();
  this.winningPoint = 150;
  this.defaultStartPlayer = null;
  this.rating = false;
  this.time = 120;
  this.byoyomi = 10;
  this.timeExpireLosePoint = 30;


  //0-3 index array.
  this.player = []; //{index: UserInfo}

  //initialize room
  this.initialize();
  
  //RNG : Math.RandomとI/Fが同一なら、他のRNGと差し替え可能。
  this.RNG = Math;
};

RoomInfo.activateFunc = function(room){
  //copy prototype
  room.__proto__ = RoomInfo.prototype;
  
  //field tegoma player userList
  for(var k in room.userList) {
    room.userList[k].__proto__ = UserInfo.prototype;
  }
  for(var i=0;i<4;i++)
  {
    if(room.player[i] != null) {
      PlayerInfo.activateFunc(room.player[i]);
    }
  }
};

RoomInfo.prototype = {

  initialize : function(){
    this.game = false;
    this.round = false;
    this.goshi = false;
    this.goshiPlayerNo = null;
    for(var i=0;i<4;i++){
      this.player[i] = new PlayerInfo();
    }
  },

  //他プレイヤーへの秘密情報を隠す
  toClient : function(){
    var copy = Object.clone(this);
    for(var i=0;i<4;i++) {
      copy.player[i].tegoma = null; //hide secret info
      copy.player[i].openfield = null;
    }

    return copy;
  },

  /**
   * ルームにユーザを加える
   * @param user
   */
  addUser : function(user){
    if(user == undefined) { return; }
    if(user in this.userList) { return; }
    this.userList[user.id] = user;
    user.roomId = this.id;
  },

  /**
   * ルームからユーザを削除する
   * @param user
   */
  removeUser : function(user){
    if(user == undefined){ return; }

    if(user.playerNo != null){
      this.standUser(user);
    }
    delete this.userList[user.id];
    user.roomId = null;
  },

  sitUser : function(n, user){
    if(n == undefined){return false;}
    if(n < 0 || n>3 || arguments.length < 2){ return false;}
    if(user == undefined || user == null){return false;}
    if(user.playerNo != null){ return false; }

    var player = this.player[n];
    player.user = user;
    player.sitting = true;
    //if(this.round) { player.ready = true; }
    user.playerNo = n;
    if(this.round){ user.isPlaying = true; }
    return true;
  },

  standUser : function(user){
    if(user == undefined || user == null || user.playerNo == null){return false;}
    var player = this.player[user.playerNo];
    player.sitting = false;
    player.ready = false;
    player.user = null;
    user.isPlaying = false;
    user.playerNo = null;
    return true;

  },
  
  swapSeats : function(){
    if(this.game){return false;}
    //move player
    /*
    1234 
    1243 34
    1423 23
    1432 34
    1342 23
    1324 34
    1234 23
    */
    var map = {0:{0:0,1:1,2:3,3:2},
                1:{0:0,1:2,2:1,3:3}};
    /* var map = {0:{0:0,1:2,2:1,3:3},
                 1:{0:0,1:1,2:3,3:2}};
    */
    var pTemp = [null, null, null, null];
    var i; //counter
    //get player and stand up from the old seat
    for(i=0;i<4;i++) {
      var user = this.player[i].user;
      pTemp[i] = user;
      this.standUser(user);
    }
    //sit on the new seat
    for(i=0;i<4;i++) {
      this.sitUser(map[this.swapCount%2][i],pTemp[i]);
    }
    this.swapCount++;
    return true;
  },

  setPlayerReady : function(playerNo){
    if(this.round){ return false;}
    if(playerNo != undefined && playerNo != null && this.player[playerNo].user != null){
      this.player[playerNo].ready = true;
      return true;
    }
    return false;
  },

  setPlayerUnready : function(playerNo){
    if(playerNo != undefined && playerNo != null && this.player[playerNo].user != null){
      this.player[playerNo].ready = false;
      return true;
    }
    return false;
  },

  /**
   * ゲーム情報の初期化
   */
  initRound : function(){
    if(this.lastWonPlayer != null){
      this.turn = this.lastWonPlayer;
    }else if(this.defaultStartPlayer != null){
      this.turn = this.defaultStartPlayer;
    }else{
      this.turn = Math.floor(this.RNG.random() * 4); //0-3 random value
      this.lastWonPlayer = this.turn; //一度ランダムで決まったら、そこからスタート
    }

    this.from = this.turn;
    this.lastPlayedPlayerNo = this.from;
    this.attack = false;
    this.ouUsed = false;
    this.goshi = false;
    this.goshiPlayerNo = null;
    this.rokushi = false;
    this.attackKoma = null;
    var komaRing = this.createKomaRing();
    for(var i=0; i<4;i++){
      this.player[i].field = new KomaCollection();
      this.player[i].openfield = new KomaCollection();
      this.player[i].tegoma = new KomaCollection(komaRing.substring(i*8,(i+1)*8));
      this.player[i].tegoma.sort();
      this.player[i].ready = false;
      this.player[i].hasTurn = false;
    }
      this.player[this.turn].hasTurn = true;
  },

  initGame : function(){
    this.roundCount = 0;
    this.lastWonPlayer = null;
    for(var i = 0; i<4;i++){
      this.player[i].point = 0;
    }
    this.initKifu();
  },

  isAllPlayerReady : function(){
    for(var i=0;i<4;i++){
      if(this.player[i] == null || !this.player[i].ready){
        return false;
      }
    }
    return true;
  },

  startGame : function(){
    if(!this.isAllPlayerReady()){return false;}
    this.initGame();
    for(var i=0;i<4;i++){
      this.player[i].user.isPlaying = true;
    }
    this.game = true;
    return true;
  },

  /**
   * starts round
   * @returns {boolean}
   */
  startRound : function(){
    if(!this.isAllPlayerReady()){ return false; }
    this.initRound();
    this.round = true;
    this.roundCount++;
    return true;
  },

  /**
   * 配り直し
   * deal tegoma again (initialize round)
   * @returns {boolean}
   */
  dealAgain : function(){
    if(!this.round){return false;}
    this.initRound();
    return true;
  },

  /**
   * finish round
   * (call from play method)
   */
  finishRound : function(){
    // 上がり駒は記録されていないので追加する
    for(var i=0; i<4; i++) {
      if(this.player[i].field.count() != 8) { continue; }
      this.kifu[this.kifu.length-1].push(this.player[i].field[7]);
    }
    // 得点加算前に棋譜を追記する
    this.appendGameKifuText();

    //得点の加算
    for(var i=0;i<4;i++){
      if(this.player[i].field.count() == 8) {
        var p = Util.getPoint(this.player[i].field[7]);
        if(this.turn == this.from && Util.isSameKoma(this.player[i].field[6], this.player[i].field[7])) {
          this.player[i].point += p * 2; //double point
        }
        else {
          this.player[i].point += p;
        }
        this.lastWonPlayer = i;
      }
      this.player[i].ready = false;
    }
    this.round = false;

    if(this.isGameFinished()){
      this.finishGame();
    }
  },

  /**
   * append Kifu Text of this game
   */
  appendGameKifuText : function() {
    var players = this.player;
    var kifu = this.kifuText;
    var point1 = players[0].point+players[2].point;
    var point2 = players[1].point+players[3].point;
    var handToString = function(player) {
      return (player.tegoma.toString() + player.openfield.toString()).split("").sort().join("");
    };
  
    kifu += " - hand:\n";
    kifu += "     p0: \"" + handToString(players[0]) + "\"\n";
    kifu += "     p1: \"" + handToString(players[1]) + "\"\n";
    kifu += "     p2: \"" + handToString(players[2]) + "\"\n";
    kifu += "     p3: \"" + handToString(players[3]) + "\"\n";
    kifu += "   uchidashi: " + this.lastWonPlayer + "\n";
    kifu += "   score: [" + point1.toString() + "," + point2.toString() +"]\n";
    kifu += "   game:\n";
    
    // ラウンドの推移を記録する
    var numToStr = { "1":"し", "2":"香", "3":"馬", "4":"銀", "5":"金", "6":"角", "7":"飛", "8":"王", "9":"王" }
    for(var i=0; i<this.kifu.length; ++i) {
      step = this.kifu[i];
      kifu += "    - [\"" + step[0] + "\",\"" + numToStr[step[1]] + "\",\"" + numToStr[step[2]] + "\"]\n";
    }
    // 記録が終わったのでリセットする
    this.kifu = [];

    this.kifuText = kifu;
  },
  
  /**
   * init Kifu
   */
  initKifu : function() {
    this.kifu = [];
    
    var players = this.player;
    var kifu = "version: 1.0\n";
    kifu += "p0: \"" + players[0].user.name + "\"\n";
    kifu += "p1: \"" + players[1].user.name + "\"\n";
    kifu += "p2: \"" + players[2].user.name + "\"\n";
    kifu += "p3: \"" + players[3].user.name + "\"\n";
    kifu += "log:\n";
    this.kifuText = kifu;
  },
  
  /**
   * finish round by more than 5 shi
   * @param type
   * @returns {boolean}
   */
  finishRoundByShi : function(type){
    if(!Util.canFinishRoundGoshiType(type)){ return false; }
    var gp = this.findGoshiPlayer();
    switch(type){
      case Util.GoshiType.ROKUSHI:
        var te = this.player[gp[0].no].tegoma;
        var pointKoma = te.findMaxPointKoma();
        var multi = te.count(pointKoma);
        if((pointKoma == Util.OU && te.hasKoma(Util.GYOKU)) || (pointKoma == Util.GYOKU && te.hasKoma(Util.OU))) {
          multi = 2;
        }
        this.player[gp[0].no].point += Util.getPoint(pointKoma) * multi;
        break;
      case Util.GoshiType.NANASHI:
        this.player[gp[0].no].point += Util.getPoint(this.player[gp[0].no].tegoma.findMaxPointKoma()) * 2;
        break;
      case Util.GoshiType.HACHISHI:
        this.player[gp[0].no].point += 100;
        break;
      case Util.GoshiType.AIGOSHI:
        this.player[gp[0].no].point += Math.ceil(this.winningPoint/2);
        this.player[gp[1].no].point += Math.ceil(this.winningPoint/2);
        break;
      default:
        return false;
    }
    this.round = false;
    this.rokushi = true;
    this.lastWonPlayer = gp[0].no; //in the AIGOSHI case, this game ends. no consideration of next start player
    for(var i=0;i<4;i++){
      this.player[i].ready = false;
    }
    if(this.isGameFinished()){
      this.finishGame();
    }
  },

  /**
   * finish game
   * call from play method
   */
  finishGame : function(){
    //get players unready
    for(var i=0;i<4;i++){
      this.player[i].ready = false;
      this.player[i].user.isPlaying = false;
    }
    this.game = false;
  },
  /**
   * returns players who have 5 or more than 5 shi
   * @returns {Array} object of {no, count, PlayerInfo}
   */
  findGoshiPlayer : function(){
    var ret = []; // playerObj{ no : playerNo, count : number of shi, player: PlayerInfo}
    for(var i=0;i<4;i++){
      if(this.player[i].tegoma != undefined && this.player[i].tegoma != null) {
        var count = this.player[i].tegoma.count(Util.SHI);
        if(count >= 5){
          ret[ret.length] = {no:i, count:count, player:this.player[i]};
        }
      }
    }
    return ret;
  },

  /**
   * 「５し」と「それ以上」の確認と処理
   * @returns {number}
   * @constructor
   */
  getGoshiType : function(){
    var p = this.findGoshiPlayer();
    if(p.length > 0){

      if(p.length >= 2){
        if((p[0].no + p[1].no) % 2 === 0){ //味方同士なら偶数になる
          //this.finishRoundByShi(Util.GoshiType.AIGOSHI, p);
          return Util.GoshiType.AIGOSHI;
        }else{
          //don't call dealAgain here.
          return Util.GoshiType.TSUIGOSHI;
        }
      }else{
        var type = Util.GoshiType.NO_GOSHI;
        switch(p[0].count){
          case 5: type = Util.GoshiType.GOSHI; break;
          case 6: type = Util.GoshiType.ROKUSHI; break;
          case 7: type = Util.GoshiType.NANASHI; break;
          case 8: type = Util.GoshiType.HACHISHI; break;
        }
        //this.finishRoundByShi(type, p);
        return type;
      }
    }
    return Util.GoshiType.NO_GOSHI;
  },

  /**
   * check if this game is finished
   * @returns {boolean}
   */
  isGameFinished : function(){
    var p1 = this.player[0].point + this.player[2].point;
    var p2 = this.player[1].point + this.player[3].point;
    return p1 >= this.winningPoint || p2 >= this.winningPoint;
  },

  /**
   * check if any player finished
   * @returns {boolean}
   */
  isRoundFinished : function(){
    if(this.rokushi){return true;} //ろくし以上で終了した
    for(var i=0;i<4;i++){
      if(this.player[i].tegoma.count() == 0){
        return true;
      }
    }
    return false;
  },

  /**
   * play current player's tegoma indicated with index
   * @param index - index of tegoma to play
   * @returns {number} error code (0: no error)
   */
  play : function(index){
    if(!this.round){ return 3001;}
    if(arguments.length < 1 || index == undefined || index == null || index < 0 || index > 7 ){ return 3002;}
    var koma = this.player[this.turn].tegoma[index];
    if(koma == undefined || koma == null || koma.length != 1 || koma == Util.EMPTY){ return 3004;}
    if(this.goshi){return 3006;}

    if(this.attack) {
      //attack
      // exceptional process: if the player has both OU & GYOKU, can play OU/GYOKU as attack
      if(koma == Util.OU || koma == Util.GYOKU){
        if(!this.ouUsed && !this.player[this.turn].tegoma.isDamaDama()){ return 3100;}
        this.ouUsed = true;
      }
      
      // 棋譜に追加
      this.kifu[this.kifu.length-1].push(koma);
      
      this.playAttackAt(index);
      this.from = this.turn;
      //this.attackCount++;
      this.attackKoma = koma;
      this.forwardTurn();
      this.attack = false;
      this.lastPlayedPlayerNo = this.from;
    }
    else {
      //block
      if(!Util.canBlock(this.attackKoma, koma)){ return 3101;} //cannot block
      if(koma == Util.OU || koma == Util.GYOKU){
        this.ouUsed = true;
      }
      
      // 棋譜に追加
      this.kifu.push( [this.turn, koma] );
      
      this.playBlock(index);
      if(this.player[this.turn].tegoma.count() == 1){
        var tegoma = this.player[this.turn].tegoma;
        var lastKoma = tegoma.getKomaListExceptEmpty()[0];
        this.playAttackAt(tegoma.indexOf(lastKoma)); //get the last koma
        this.finishRound();
        return 0;
      }
      this.attack = true;
      this.lastPlayedPlayerNo = this.turn;
    }
    return 0;
  },
  
  /**
   * private method, call from play()
   * @param index - index of tegoma to play
   */
  playBlock : function(index){
    var koma = this.player[this.turn].tegoma[index];
    //remove koma from tegoma
    this.player[this.turn].tegoma.removeKomaAt(index);
    //put koma into field
    if(this.from == this.turn && this.player[this.turn].tegoma.count() > 2){
      //hide playing when all the other players passed, but end of the game
      this.player[this.turn].field.putKoma(Util.HIDDEN);
      this.player[this.turn].openfield.putKoma(koma);
    }else{
      this.player[this.turn].field.putKoma(koma);
      this.player[this.turn].openfield.putKoma(koma);
    }
  },

  /**
   * private method, call from play()
   * @param index - index of tegoma to play
   */
  playAttackAt : function(index){
    var koma = this.player[this.turn].tegoma[index];
    //remove koma from tegoma
    this.player[this.turn].tegoma.removeKomaAt(index);
    //put koma into field
    this.player[this.turn].field.putKoma(koma);
    this.player[this.turn].openfield.putKoma(koma);
  },

  /**
   * pass current player's turn
   * @returns {number} error code (0: no error)
   */
  pass :function(){
    if(!this.game || this.attack){ return 3001;}
    if(this.from == this.turn){return 3005;}
    if(this.goshi){return 3006;}
    this.forwardTurn();
    if(this.from == this.turn){this.attackKoma = null;} //暫定的にここで攻め駒をリセット
    return 0;
  },

  isUsersTurn : function(user){
    var pNo = this.getPlayerNoByUserId(user.id);
    if(pNo < 0) { return false;} //not a player
    return this.player[pNo].hasTurn;
  },

  /**
   * create 32 koma collection in a random order
   * @returns {string} 32 koma collection
   */
  createKomaRing : function(){
    //return "11111222862373456157911144115534"; //5しテスト用
    //return "11111123286237345615791124415534"; //6しテスト用
    //return "11111122286237345615791134415534"; //6し ２倍得点テスト用
    //return "11111113286237345615791124425534"; //7しテスト用
    //return "11111111286237345615793124425534"; //8しテスト用
    //return "11111444" + "33222233" + "11111455" + "55667789"; //10しテスト用
    //return "11111444" + "11111455" + "33222233" + "55667789"; //相5しテスト用

    //1:し*10, 2:香*4, 3:馬*4, 4:銀*4, 5:金*4, 6:角*2, 7:飛*2, 8:王*1, 9:玉*1
    var src = Util.komaStrToArray("11111111112222333344445555667789");
    var dest = [];
    
    for(var i=0;i<32;i++){
      var index = Math.floor(this.RNG.random()*src.length);
      var temp = src.splice(index, 1);
      for(var j=0;j<temp.length;j++){
        dest.push(temp[j]);
      }
    }
    return dest.join("");
    //xor-shift, mersenne twister 等の乱数生成アルゴリズムを使いたいところ。
  },

  //手番を次のプレイヤーに渡す(反時計回り)
  /**
   * forward turn to next player
   */
  forwardTurn : function(){
    // must be in a game
    this.player[this.turn].hasTurn = false;
    this.turn = (this.turn+1)%4;
    this.player[this.turn].hasTurn = true;
  },

  /**
   * get player No. by given user ID
   * @param id - user ID
   * @returns {number} player No.
   */
  getPlayerNoByUserId : function(id){
    for(var i=0;i<4;i++){
      if(this.player[i].user != null && this.player[i].user.id == id) { return i; }
    }
    return -1;
  },

  /**
   * count up how many user are sitting as player
   * @returns {number} number of players
   */
  getPlayerCount : function(){
    var count = 0;
    for(var i=0;i<4;i++){
      if(this.player[i] != null)
      {
        count++;
      }
    }
    return count;
  },

  /**
   * count up how many user are joined in this room
   * @returns {number} number of user
   */
  getUserCount : function(){
    var count = 0;
    for(var user in this.userList) {
      if(this.userList.hasOwnProperty(user)){
        count++;
      }
    }
    return count;
  }
};

/**
 * static methods for goita. ごいたに関する静的メソッド
 * @type {{EMPTY: string, HIDDEN: string, SHI: string, GON: string, BAKKO: string, GIN: string, KIN: string, KAKU: string, HISHA: string, OU: string, GYOKU: string, getKomaText: Function, getPoint: Function, canBlock: Function, repeatStr: Function, isSameKoma: Function, sortKoma: Function, komaStrToArray: Function}}
 * @return {object}
 */
var Util = {
  //CONSTANTS
  //x:空 0:不明 1:し 2:香 3:馬 4:銀 5:金 6:角 7:飛 8:王 9:玉
  /** 空 */ EMPTY : "x",
  /** 裏 */ HIDDEN : "0",
  /** し */ SHI : "1",
  /** 香 */ GON : "2",
  /** 馬 */ BAKKO : "3",
  /** 銀 */ GIN : "4",
  /** 金 */ KIN : "5",
  /** 角 */ KAKU : "6",
  /** 飛 */ HISHA : "7",
  /** 王 */ OU : "8",
  /** 玉 */ GYOKU : "9",
  /** なし */ PASS : "p",

  GoshiType : {
    NO_GOSHI : 0,
    GOSHI : 5,
    ROKUSHI : 6,
    NANASHI : 7,
    HACHISHI : 8,
    AIGOSHI : 10,
    TSUIGOSHI : 11
  },

  canFinishRoundGoshiType : function(goshiType){
    return goshiType == Util.GoshiType.ROKUSHI
      || goshiType == Util.GoshiType.NANASHI
      || goshiType == Util.GoshiType.HACHISHI
      || goshiType == Util.GoshiType.AIGOSHI;
  },

  getKomaText : function(koma){
    var ret = "";
    switch(koma){
      case this.HIDDEN:
        ret = "■";
        break;
      case this.SHI:
        ret = "し";
        break;
      case this.GON:
        ret = "香";
        break;
      case this.BAKKO:
        ret = "馬";
        break;
      case this.GIN:
        ret = "銀";
        break;
      case this.KIN:
        ret = "金";
        break;
      case this.KAKU:
        ret = "角";
        break;
      case this.HISHA:
        ret = "飛";
        break;
      case this.GYOKU:
        ret = "玉";
        break;
      case this.OU:
        ret = "王";
        break;
      default:
        break;
    }
    return ret;
  },

  /**
   * @param koma - finishing koma
   * @returns {number} point
   */
  getPoint : function(koma){
    var n = Number(koma);
    return Math.floor(n/2)*10 + 10;
  },

  /**
   * @param {string} attack - attack koma
   * @param {string} block - block koma
   * @returns {boolean} 'block koma' can block 'attack koma'
   */
  canBlock : function(attack, block){
    if(attack == null) { return true;} //最初の1手
    //if(this.from == this.turn) { return true;} //from, turnを参照できれば伏せ出しOK判定可能
    if(block == this.OU || block == this.GYOKU){
      if(attack == this.SHI || attack == this.GON){
        return false;
      }
      return true;
    }

    if(attack == block){
      return true;
    }
    return false;
  },
  
  repeatStr : function(str, n){
    if(arguments.length < 2){ n = 1}
    var ret = "";
    for(var i=0;i<n;i++){
      ret += str;
    }
    return ret;
  },

  /**
   * @param {string} koma1
   * @param {string} koma2
   * @returns {boolean}
   */
  isSameKoma : function(koma1, koma2){
    if(koma1 == undefined || koma2 == undefined){return false;}
    if(koma1 == null || koma2 == null){return false;}
    if(koma1.length != 1 || koma2.length != 1){return false;}
    return ( koma1 == koma2
          || (koma1 == Util.OU && koma2 == Util.GYOKU)
          || (koma1 == Util.GYOKU && koma2 == Util.OU) ) ;
  },

  sortKoma : function(tegomaStr){
    var str = this.komaStrToArray(tegomaStr);
    str.sort();
    var temp = str.join("");
    return temp;
  },

  /**
  * 指定した文字列を1文字ずつ配列に収めます。
  */
  komaStrToArray : function(str){
    var a = [];
    for(var i=0;i<str.length;i++){
      a[i] = str.charAt(i);
    }
    return a;
  },

  /**
   * 場を32桁の文字列で返す
   * @param room
   * @returns {string}
   */
  gameFieldToStr : function(room){
    var field ="";
    for(var i = 0;i<4;i++){ field += room.field[i].toString();}
    return field;
  },

  parseFieldStr : function(fieldStr){
    if(fieldStr == undefined || fieldStr.length != 32) {return []};
    var field = [];
    for(var i=0;i<4;i++){
      field[i] = new KomaCollection(fieldStr.substring(i*8,(i+1)*8));
    }
    return field;
  }
};

//helper
/**
 * return the number of keys the target object has
 * @param obj - target object
 * @returns {number}
 */
Object.size = function(obj) {
    var size = 0;
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

/**
 * clone object
 * @param obj
 * @returns {*}
 */
Object.clone = function(obj){
  if(obj == undefined){ obj = this; }
  var c = null; //Object.create(obj) //prototype に余計な情報が付随してくる。
  if(Array.isArray(obj)){
    c = [];
  }else{
    c = {};
  }

  for(var i in obj) {
    if(obj[i] == undefined){continue;}
    if(typeof obj[i] == "function"){ continue;}

    if(typeof(obj[i])=="object" && obj[i] != null && obj.hasOwnProperty(i))
      c[i] = Object.clone(obj[i]);
    else
      c[i] = obj[i];
  }
  return c;
};

//for node.js   (this === module.exports)
this["UserInfo"] = UserInfo;
this["KomaCollection"] = KomaCollection;
this["RoomInfo"] = RoomInfo;
this["Util"] = Util;