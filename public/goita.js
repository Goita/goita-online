//ユーザ情報
var UserInfo = function(id, name){
  this.id = id;
  this.name = name;
  this.roomId = null;
  this.sitting = false;
  this.ready = false;
  this.isPlaying = false;
  this.hasTurn = false;
  this.playerNo = null;
  this.active = true;
};

//駒情報（出した駒、持ち駒共通)
var KomaInfo = function(str){
  this.koma = []; //index(0-7) array of char
  if(arguments.length > 0 && str.length > 0){
    this.koma = Util.komaStrToArray(str);
  }
};
KomaInfo.prototype = {
  count : function(koma){
    if(koma == undefined || koma.length != 1)
    {
      return this.koma.length;
    }
    var c=0;
    for(var i=0;i<this.koma.length;i++)
    {
      if(this.koma[i] == koma)
      {
        c++;
      }
    }
    return c;
  },

  toString : function(){
    return this.koma.join("");
  },

  //出し駒用メソッド
  putKoma : function(koma){
    //var index = this.koma.indexOf(Util.EMPTY);
    var index = this.koma.length;
    if(index >= 8){return;}
    this.koma[index] = koma;
  },
  //手駒用メソッド
  removeKoma : function(koma){
    var index = this.koma.indexOf(koma);
    this.koma.splice(index, 1); //alternate method for remove
  },

  hasKoma : function(koma){
    return this.koma.indexOf(koma) >= 0;
  },

  isDamaDama : function(){
    //2回目の攻めから、王玉両方持っていればOK
    return this.count() < 6 && this.koma.indexOf(Util.OU) >= 0 && this.koma.indexOf(Util.GYOKU) >= 0;
  },

  //しの数
  countShi : function(){
    var count=0;
    for(var i=0;i<this.koma.length;i++){
      if(this.koma[i] == Util.SHI){
        count++;
      }
    }
    return count;
  },

  //得点が最も高い駒を返す
  findMaxPointKoma : function(){
    var max = 0;
    var temp = 0;
    var koma = Util.EMPTY;
    for(var i=0;i<this.koma.length;i++){
      //ソート済みの前提なら、一番最後の駒を見ればいいだけ。
      temp = Util.getPoint(this.koma[i]);
      if(temp > max){
        koma = this.koma[i];
        max = temp;
      }
    }
    return koma;
  },

};

//ゲームルームの情報
var RoomInfo = function(roomId){
  this.id = roomId;
  this.userList = {}; //{userid: UserInfo}
  this.game = false; //playing game
  this.round = false; //started round
  this.roundCount = 0;
  this.turn = 0;
  this.from = 0;  //attack from
  this.attack = false;  //next play is attack or block
  this.attackCount = 0;
  this.attackKoma = "";
  this.lastWonPlayer = null;
  this.ouUsed = false;
  this.goshi = false; //５し発生中
  this.rokushi = false; //６し以上で終了
  this.lastPlayedPlayerNo = 0; //the last player played koma(attack/block)
  this.swapCount = 0;
  
  //game option
  this.winningPoint = 150;
  this.defaultStartPlayer = null;

  //point[0] + point[2] = team1's total points.
  //point[1] + point[3] = team2's total points.
  //0-3 index array.
  this.player = []; //{index: UserInfo}
  this.point = [];  //{index: int}
  this.field = [];  //{index: KomaInfo }
  this.tegoma = []; //{index: KomaInfo }

  //initialize room
  for(var i=0;i<4;i++){
    this.player[i] = null;
    this.point[i] = 0;
    this.field[i] = new KomaInfo();
    this.tegoma[i] = new KomaInfo();
  }
  
  //RNG : Math.RandomとI/Fが同一なら、他のRNGと差し替え可能。
  this.rng = Math;
};

//static method
RoomInfo.initialize = function(room)
{
  if(room == undefined || room == null){return;}
  room = new RoomInfo(room.id);
};

RoomInfo.activateFunc = function(room)
{
  //mutating prototype cause very slow performance
  room.__proto__ = new RoomInfo().__proto__;
  
  //field tegoma player userList
  for(var k in room.userList)
  {
    room.userList[k].__proto__ = new UserInfo("","").__proto__;
  }
  for(var i=0;i<4;i++)
  {
    if(room.player[i] != null)
    {
      room.player[i].__proto__ = new UserInfo("","").__proto__;
    }
    room.field[i].__proto__ = new KomaInfo().__proto__;
    room.tegoma[i].__proto__ = new KomaInfo().__proto__;
  }
};

RoomInfo.prototype = {
  //clone object
  clone : function(obj){
    if(obj === undefined){ obj = this; }
    var c = null; //Object.create(obj) //__proto__ に余計な情報が付随してくる。
    if(Array.isArray(obj)){
      c = [];
    }else{
      c = {};
    }
    
    for(var i in obj) {
      if(typeof obj[i] == "function"){ continue;}

      if(typeof(obj[i])=="object" && obj[i] !== null && obj.hasOwnProperty(i))
          c[i] = this.clone(obj[i]);
      else
          c[i] = obj[i];
    }
    return c;
  },

  //他プレイヤーへの秘密情報を隠す
  toClient : function(){
    var copy = this.clone();

    copy.tegoma = []; //hide secret info
    return copy;
  },

  //場を32桁の文字列で返す
  getGameField : function(){
    var field ="";
    for(var i = 0;i<4;i++){ field += this.field[i].koma.toString();}
    return field;
  },

  //ルームにユーザを加える
  addUser : function(user){
    this.userList[user.id] = user;
    user.roomId = this.id;
  },

  //ルームからユーザを削除する
  removeUser : function(user){
    if(user === undefined){ return; }

    if(user.sitting){
      this.standUser(user);
    }
    delete this.userList[user.id];
    user.roomId = null;
  },

  sitUser : function(n, user){
    if(user == null){return false;}
    if(n < 0 || n>3 || arguments.length < 2){ return false;}
    if(user.playerNo !== null){ return false; }
    if(this.player[n] === null){
      this.player[n] = user;
      user.sitting = true;
      user.playerNo = n;
      if(n==this.turn){
        user.hasTurn = true;
      }
      if(this.round){
        user.isPlaying = true;
      }
      return true;
    }
    return false;
  },

  standUser : function(user){
    if(user == null){return false;}
    for(var i=0;i<4;i++){
      if(this.player[i] !== null && this.player[i].id == user.id){
        this.player[i] = null;
        user.sitting = false;
        user.ready = false;
        user.isPlaying = false;
        user.playerNo = null;
        user.hasTurn = false;
        return true;
      }
    }
    return false;
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
    */
    var map = {0:{0:0,1:2,2:1,3:3},
               1:{0:0,1:1,2:3,3:2}
              };
    var pTemp = [null, null, null, null];
    var i = 0; //counter
    //get player and stand up from the old seat
    for(i=0;i<4;i++)
    {
      var user = this.player[i];
      pTemp[i] = user;
      this.standUser(user);
    }
    //sit on the new seat
    for(i=0;i<4;i++)
    {
      this.sitUser(map[this.swapCount%2][i],pTemp[i]);
    }
    this.swapCount++;
    return true;
  },

  setUserReady : function(user){
    if(this.round){ return false;}
    for(var i=0;i<4;i++){
      if(this.player[i] !== null && this.player[i].id == user.id){
        this.player[i].ready = true;
        return true;
      }
    }
    return false;
  },

  setUserUnready : function(user){
    for(var i=0;i<4;i++){
      if(this.player[i] !== null && this.player[i].id == user.id){
        this.player[i].ready = false;
        this.player[i].hasTurn = false;
        return true;
      }
    }
    return false;
  },

  //ゲーム情報の初期化
  initRound : function(){
    if(this.lastWonPlayer !== null){
      this.turn = this.lastWonPlayer;
    }else if(this.defaultStartPlayer !== null){
      this.turn = this.defaultStartPlayer;
    }else{
      this.turn = Math.floor(this.rng.random() * 4); //0-3 random value
      this.lastWonPlayer = this.turn; //一度ランダムで決まったら、そこからスタート
    }

    this.from = this.turn;
    this.lastPlayedPlayerNo = this.from;
    this.attack = false;
    this.ouUsed = false;
    this.goshi = false;
    this.rokushi = false;
    this.attackCount = 0;
    this.attackKoma = null;
    var komaRing = this.createKomaRing();
    for(var i=0; i<4;i++){
      this.field[i] = new KomaInfo(); //new KomaInfo(Util.repeatStr(Util.EMPTY, 8));
      this.tegoma[i] = new KomaInfo(komaRing.substring(i*8,(i+1)*8));
      if(this.player[i] != null)
      {
        this.player[i].ready = false;
        this.player[i].hasTurn = false;
      }
    }
    if(this.player[this.turn] != null)
      this.player[this.turn].hasTurn = true;
  },

  initGame : function(){
    this.roundCount = 0;
    this.lastWonPlayer = null;
    //this.point = {0:0, 1:0, 2:0, 3:0};
    for(var i = 0; i<4;i++){
      this.point[i] = 0;
    }
  },

  isAllUserReady : function(){
    for(var i=0;i<4;i++){
      if(this.player[i] === null || !this.player[i].ready){
        return false;
      }
    }
    return true;
  },

  startGame : function(){
    if(!this.isAllUserReady()){return false;}
    this.initGame();
    for(var i=0;i<4;i++){
      this.player[i].isPlaying = true;
    }
    this.game = true;
    return true;
  },

  //call from play method
  finishGame : function(){
    //get players unready
    for(var i=0;i<4;i++){
      this.player[i].ready = false;
      this.player[i].isPlaying = false;
    }
    this.game = false;
  },

  startRound : function(){
    if(!this.isAllUserReady()){return false;}
    this.initRound();
    this.round = true;
    this.roundCount++;
    return true;
  },

  //配り直し
  dealAgain : function(){
    if(!this.round){return false;}
    this.initRound();
    return true;
  },

  //call from play method
  finishRound : function(){
    //得点の加算
    for(var i=0;i<4;i++){
      if(this.tegoma[i].count() === 0){
        var p = Util.getPoint(this.field[i].koma[7]);
        if(this.field[i].koma[6] != this.field[i].koma[7]){
          this.point[i] += p;
        }else{  //double point
          this.point[i] += p * 2;
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

  //private method
  finishRoundByShi : function(type, gp){
    switch(type){
      case Util.GoshiType.ROKUSHI:
        var te = this.tegoma[gp[0].no];
        var pointKoma = te.findMaxPointKoma();
        var multi = te.count(pointKoma);
        this.point[gp[0].no] += Util.getPoint(pointKoma) * multi;
        break;
      case Util.GoshiType.NANASHI:
        this.point[gp[0].no] += Util.getPoint(this.tegoma[gp[0].no].findMaxPointKoma()) * 2;
        break;
      case Util.GoshiType.HACHISHI:
        this.point[gp[0].no] += 100;
        break;
      case Util.GoshiType.AIGOSHI:
        this.point[gp[0].no] += Math.ceil(this.winningPoint/2);
        this.point[gp[1].no] += Math.ceil(this.winningPoint/2);
        break;
      default:
        return false;
    }
    this.round = false;
    this.rokushi = true;
    this.lastWonPlayer = gp[0].no;
    for(var i=0;i<4;i++){
      this.player[i].ready = false;
    }
    if(this.isGameFinished()){
      this.finishGame();
    }
  },

  findGoshiPlayer : function(){
    var ret = []; // playerObj{ no : playerNo, count : number of shi}
    for(var i=0;i<4;i++){
      var count = this.tegoma[i].countShi();
      if(count >= 5){
        ret[ret.length] = {no:i, count:count, player:this.player[i]};
      }
    }
    return ret;
  },

  //５しの確認と処理
  Goshi : function(){
    var p = this.findGoshiPlayer();
    if(p.length > 0){
      this.goshi = true; //５し状態

      //@TODO: 勝敗処理
      if(p.length >= 2){
        if((p[0].no + p[1].no) % 2 === 0){ //味方同士なら偶数になる
          this.finishRoundByShi(Util.GoshiType.AIGOSHI, p);
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
        this.finishRoundByShi(type, p);
        return type;
      }
    }
    return Util.GoshiType.NO_GOSHI;
  },

  isGameFinished : function(){
    var p1 = this.point[0] + this.point[2];
    var p2 = this.point[1] + this.point[3];
    if(p1 >= this.winningPoint || p2 >= this.winningPoint){
      return true;
    }
    return false;
  },

  isRoundFinished : function(){
    if(this.rokushi){return true;} //ろくし以上で終了した
    for(var i=0;i<4;i++){
      if(this.tegoma[i].count() === 0){
        return true;
      }
    }
    return false;
  },

  play : function(user, koma){
    if(!this.round){ return 3001;}
    if(arguments.length < 2 || koma == null || koma.length != 1){ return 3002;}
    //手番を持っているプレイヤーからの要求か確認
    if(this.player[this.turn].id != user.id){ return 3003;}
    //validate that player has the koma
    if(!this.tegoma[this.turn].hasKoma(koma)){ return 3004;}
    if(this.goshi){return 3006;}

    if(this.attack)
    { //atack
      //@TODO: if first OU/GYOKU hasn't been played, can't play OU/GYOKU as attack
      // exception: if the player has both OU & GYOKU, can play OU/GYOKU as attack
      if(koma == Util.OU || koma == Util.GYOKU){
        if(!this.ouUsed && !this.tegoma[this.turn].isDamaDama()){ return 3100;}
        this.ouUsed = true;
      }
      this.playAttack(koma);
      this.from = this.turn;
      // if(this.tegoma[this.turn].count() === 0){
      //   this.finishRound();
      //   return 0;
      // }
      this.attackCount++;
      this.attackKoma = koma;
      this.forwardTurn();
      this.attack = false;
      this.lastPlayedPlayerNo = this.from;
    }
    else
    { //block
      //
      if(!Util.canBlock(this.attackKoma, koma)){ return 3101;} //cannot block
      if(koma == Util.OU || koma == Util.GYOKU){
        this.ouUsed = true;
      }
      this.playBlock(koma);
      if(this.tegoma[this.turn].count() === 1){
        this.playAttack(this.tegoma[this.turn].koma[0]);
        this.finishRound();
        return 0;
      }
      this.attack = true;
      this.lastPlayedPlayerNo = this.turn;
    }
    
    return 0;
  },
  //private method, call from play()
  playBlock : function(koma){
    //remove koma from tegoma
    this.tegoma[this.turn].removeKoma(koma);
    //put koma into field
    if(this.from == this.turn && this.tegoma[this.turn].count() > 2){
      //hide playing when all the other players passed, but end of the game
      this.field[this.turn].putKoma(Util.HIDDEN);
    }else{
      this.field[this.turn].putKoma(koma);
    }
  },
  //private method, call from play()
  playAttack : function(koma){
    //remove koma from tegoma
    this.tegoma[this.turn].removeKoma(koma);
    this.field[this.turn].putKoma(koma);
  },

  pass :function(user){
    if(!this.game || this.attack){ return 3001;}
    //手番を持っているプレイヤーからの要求か確認
    if(this.player[this.turn].id != user.id){ return 3003;}
    if(this.from == this.turn){return 3005;}
    if(this.goshi){return 3006;}
    this.forwardTurn();
    if(this.from == this.turn){this.attackKoma = null;} //暫定的にここで攻め駒をリセット
    return 0;
  },

  createKomaRing : function(){
    return "11111122286237345615791114415534"; //テスト用
    
    //1:し*10, 2:香*4, 3:馬*4, 4:銀*4, 5:金*4, 6:角*2, 7:飛*2, 8:王*1, 9:玉*1
    var src = Util.komaStrToArray("11111111112222333344445555667789");
    var dest = [];
    
    for(var i=0;i<32;i++){
      var index = Math.floor(this.rng.random()*src.length);
      var temp = src.splice(index, 1);
      for(var j=0;j<temp.length;j++){
        dest.push(temp[j]);
      }
    }
    return dest.join("");
    //return "11112222623234561579111421523411"; //５しのテストとか済むまでとりあえず固定で
    //xor-shift, mersenne twister 等の乱数生成アルゴリズムを使いたいところ。
  },

  //手番を次のプレイヤーに渡す(反時計回り)
  forwardTurn : function(){
    this.player[this.turn].hasTurn = false;
    this.turn = (this.turn+1)%4;
    this.player[this.turn].hasTurn = true;
  },

  getPlayerNoByUserId : function(id){
    for(var i=0;i<4;i++){
      if(this.player[i] != null && this.player[i].id == id)
      {
        return i;
      }
    }
    return null;
  },
  
  getPlayerCount : function(){
    var count = 0;
    for(var i=0;i<4;i++){
      if(this.player[i] != null)
      {
        count++;
      }
    }
    return count;
  }

};

//static methods for goita. ごいたに関する静的メソッド
var Util = {
  //CONSTANTS
  //x:空 0:不明 1:し 2:香 3:馬 4:銀 5:金 6:角 7:飛 8:王 9:玉
  EMPTY : "x",
  HIDDEN : "0",
  SHI : "1",
  GON : "2",
  BAKKO : "3",
  GIN : "4",
  KIN : "5",
  KAKU : "6",
  HISHA : "7",
  OU : "8",
  GYOKU : "9",

  //goshi pattern
  GoshiType : {
    NO_GOSHI : 0,
    GOSHI : 5,
    ROKUSHI : 6,
    NANASHI : 7,
    HACHISHI : 8,
    AIGOSHI : 10,
    TSUIGOSHI : 11
  },

  getKomaText : function(koma){
    var ret = "";
    switch(koma){
      case this.HIDDEN:
        ret = "";
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

  getPoint : function(koma){
    var n = Number(koma);
    //return Math.floor(n/2)*10 + 10;
    var p = 0;
    switch(n){
      case 1: //し
        p = 10;
        break;
      case 2: //香
      case 3: //馬
        p = 20;
        break;
      case 4: //銀
      case 5: //金
        p = 30;
        break;
      case 6: //角
      case 7: //飛
        p = 40;
        break;
      case 8: //王
      case 9: //玉
        p = 50;
        break;
    }
    return p;
  },

  canBlock : function(attack, block){
    if(attack === null) { return true;} //最初の1手
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

  sortKoma : function(tegomaStr){
    var str = this.komaStrToArray(tegomaStr);
    str.sort();
    var temp = str.join("");
    tegomaStr = temp;
    return temp;
  },

  komaStrToArray : function(str){
    var a = [];
    for(var i=0;i<str.length;i++){
      a[i] = str.charAt(i);
    }
    return a;
  },
};

//helper
Object.size = function(obj) {
    var size = 0;
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

//for node.js   (this === module.exports)
this["UserInfo"] = UserInfo;
this["KomaInfo"] = KomaInfo;
this["RoomInfo"] = RoomInfo;
this["Util"] = Util;