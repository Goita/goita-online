//ユーザ情報
var UserInfo = function(id, name){
  this.id = id;
  this.name = name;
  this.roomId = null;
  this.sitting = false;
  this.ready = false;
  this.isPlaying = false;
  this.playerNo = null;
  this.active = true;
};

//駒情報（出した駒、持ち駒共通)
var KomaInfo = function(str){
  this.koma = []; //index(0-7) array of char
  if(arguments.length > 0 && str.length > 0){
    this.koma = Goita.komaStrToArray(str);
  }
};
KomaInfo.prototype = {
  count : function(){
    return this.koma.length;
  },

  toString : function(){
    return this.koma.join("");
  },

  //出し駒用メソッド
  putKoma : function(koma){
    var index = this.koma.indexOf(Goita.EMPTY);
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
    return this.koma.indexOf(Goita.OU) >= 0 && this.koma.indexOf(Goita.GYOKU) >= 0;
  },

  //しの数
  countShi : function(){
    var count=0;
    for(var i=0;i<this.koma.length;i++){
      if(this.koma[i] == Goita.SHI){
        count++;
      }
    }
    return count;
  },

  //得点が最も高い駒を返す
  findMaxPointKoma : function(){
    var max = 0;
    var temp = 0;
    var koma = Goita.EMPTY;
    for(var i=0;i<this.koma.length();i++){
      //ソート済みの前提なら、一番最後の駒を見ればいいだけ。
      temp = Goita.getPoint(this.koma[i]);
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
    this.goshi = false;

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
    }
};
RoomInfo.prototype = {
  //clone object
  clone : function(){
      if(this === null || typeof(this) != 'object'){
          return this;
      }
      var temp = this.constructor(); // changed

      for(var key in this){
        if(this.hasOwnProperty(key)){ //copy only own property
          temp[key] = this.clone(this[key]);
        }
      }
      return temp;
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
    if(user.sitting){
      this.standUser(user);
    }
    delete this.userList[user.id];
    user.roomId = null;
  },

  sitUser : function(n, user){
    if(n < 0 || n>3 || arguments.length < 2){ return false;}
    if(this.player[n] === null){
      this.player[n] = user;
      user.sitting = true;
      user.playerNo = n;
      return true;
    }
    return false;
  },

  standUser : function(user){
    for(var i=0;i<4;i++){
      if(this.player[i].id == user.id){
        this.player[i] = null;
        user.sitting = false;
        user.ready = false;
        user.isPlaying = false;
        user.playerNo = null;
        return true;
      }
    }
    return false;
  },

  getUserReady : function(user){
    for(var i=0;i<4;i++){
      if(this.player[i].id == user.id){
        this.player[i].ready = true;
        return true;
      }
    }
    return false;
  },

  getUserUnready : function(user){
    for(var i=0;i<4;i++){
      if(this.player[i].id == user.id){
        this.player[i].ready = false;
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
      this.turn = Math.floor(Math.random() * 4); //0-3 random value
    }

    this.from = this.turn;
    this.attack = false;
    this.ouUsed = false;
    this.goshi = false;
    this.attackCount = 0;
    var komaRing = this.createKomaRing();
    for(var i = 0; i<4;i++){
      this.field[i] = new KomaInfo(Goita.EMPTY.repeat(8));
      this.tegoma[i] = new KomaInfo(komaRing.substring(i*8,8));
    }
  },

  initGame : function(){
    this.roundCount = 0;
    this.lastWonPlayer = null;
    this.point = {0:0, 1:0, 2:0, 3:0};
    for(var i = 0; i<4;i++){
      this.point[i] = 0;
    }
  },

  isAllUserReady : function(){
    for(var i=0;i<4;i++){
      if(!this.player[i].ready){return false;}
      return true;
    }
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
        var p = Goita.getPoint(this.field[i].koma[7]);
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
      case Goita.GoshiType.ROKUSHI:
        this.point[gp[0].no] = Goita.getPoint(this.tegoma[gp[0].no].findMaxPointKoma());
        break;
      case Goita.GoshiType.NANASHI:
        this.point[gp[0].no] = Goita.getPoint(this.tegoma[gp[0].no].findMaxPointKoma()) * 2;
        break;
      case Goita.GoshiType.HACHISHI:
        this.point[gp[0].no] = 100;
        break;
      case Goita.GoshiType.AIGOSHI:
        this.point[gp[0].no] = this.winningPoint;
        this.point[gp[1].no] = this.winningPoint;
        break;
      default:
        return false;
    }
    this.round = false;
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
        ret[ret.length()] = {no:i, count:count};
      }
    }
    return ret;
  },

  //ごしの確認と処理
  Goshi : function(){
    var p = this.findGoshiPlayer();
    if(p.length() > 0){
      this.goshi = true;

      //@TODO: 勝敗処理
      if(p.length() >= 2){
        if((p[0].no + p[1].no) % 2 === 0){ //味方同士なら偶数になる
          this.finishRoundByShi(Goita.GoshiType.AIGOSHI);
          return Goita.GoshiType.AIGOSHI;
        }else{
          //doesn't call dealAgain here.
          return Goita.GoshiType.TSUIGOSHI;
        }
      }else{
        var type = Goita.GoshiType.NO_GOSHI;
        switch(p[0].count){
          case 5: type = Goita.GoshiType.GOSHI; break;
          case 6: type = Goita.GoshiType.ROKUSHI; break;
          case 7: type = Goita.GoshiType.NANASHI; break;
          case 8: type = Goita.GoshiType.HACHISHI; break;
        }
        this.finishRoundByShi(type, p);
        return type;
      }
    }
    return Goita.GoshiType.NO_GOSHI;
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
    for(var a in this.tegoma){
      if(a.count() === 0){
        return true;
      }
    }
    return false;
  },

  play : function(user, koma){
    if(!this.round){ return 2001;}
    if(arguments.length < 2 || koma.length != 1){ return 2002;}
    //手番を持っているプレイヤーからの要求か確認
    if(this.player[this.turn].id != user.id){ return 2003;}
    //validate that player has the koma
    if(!this.tegoma[this.turn].hasKoma(koma)){ return 2004;}

    if(this.attack)
    { //atack
      //@TODO: if first OU/GYOKU hasn't been played, can't play OU/GYOKU as attack
      // exception: if the player has both OU & GYOKU, can play OU/GYOKU as attack
      if(koma == Goita.OU || koma == Goita.GYOKU){
        if(!this.ouUsed && !this.tegoma[this.turn].isDamaDama()){ return 2100;}
      }
      this.playAttack(koma);
      this.from = this.turn;
      if(this.tegoma[this.turn].count() === 0){
        this.finishRound();
        return 0;
      }
      this.attackCount++;
      this.attackKoma = koma;
      this.forwardTurn();
      this.attack = false;
    }
    else
    { //block
      //
      if(!Goita.canBlock(this.attackKoma, koma)){ return 2101;} //cannot block
      if(koma == Goita.OU || koma == Goita.GYOKU){
        this.ouUsed = true;
      }
      this.playBlock(koma);
      if(this.tegoma[this.turn].count() === 1){
        this.playAttack(this.tegoma[this.turn].koma[0]);
        this.finishRound();
        return 0;
      }
      this.attack = true;
    }
  },
  //private method, call from play()
  playBlock : function(koma){
    //remove koma from tegoma
    this.tegoma[this.turn].removeKoma(koma);
    //put koma into field
    if(this.from == this.turn && this.tegoma[this.turn].count() > 2){
      //hide playing when all the other players passed, but end of the game
      this.field[this.turn].putKoma(Goita.HIDDEN);
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
    if(!this.game || this.attack){ return 2001;}
    //手番を持っているプレイヤーからの要求か確認
    if(this.player[this.turn].id != user.id){ return 2003;}
    if(this.from == this.turn){return 2005;}
    this.forwardTurn();
    return 0;
  },

  createKomaRing : function(){
    //1:し*10, 2:香*4, 3:馬*4, 4:銀*4, 5:金*4, 6:角*2, 7:飛*2, 8:王*1, 9:玉*1
    return "11123456111234561123457811234579"; //ごしのテストとか済むまでとりあえず固定で
    //xor-shift, mersenne twister 等の乱数生成アルゴリズムを使いたいところ。
  },

  //手番を次のプレイヤーに渡す(反時計回り)
  forwardTurn : function(){
    this.turn++;
    if(this.turn >3){ this.turn = 0; }
  },

};

//static methods for goita. ごいたに関する静的メソッド
var Goita = {
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

  sortKoma : function(tegomaStr){
    var str = this.komaStrToArray(tegomaStr);
    str.sort();
    var temp = str.join("");
    tegomaStr = temp;
    return temp;
  },

  komaStrToArray : function(komastr){
    var str = [];
    for(var i=0;i<komastr.length && i<8;i++){
      str[i] = komastr.charAt(i);
    }
    return str;
  },
};

//for node.js   (this === module.exports)
this["UserInfo"] = UserInfo;
this["KomaInfo"] = KomaInfo;
this["RoomInfo"] = RoomInfo;
this["Goita"] = Goita;