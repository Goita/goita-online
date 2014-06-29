//ユーザ情報
var UserInfo = function(id, name){
  this.id = id;
  this.name = name;
  this.roomId = null;
  this.sitting = false;
  this.ready = false;
  this.isPlaying = false;
  this.playerNo = -1;
};

//駒情報（出した駒、持ち駒共通)
var KomaInfo = function(str){
  this.koma = []; //array of char
  if(arguments.length > 0 && str.length > 0){
    this.koma = Goita.komaStrToArray(str);
  }
};
KomaInfo.prototype = {
  count : function(){
    return this.koma.length;
  },
  //出し駒用メソッド
  putKoma : function(koma){
    var index = this.koma.indexOf(Goita.EMPTY);
    this.koma[index] = koma;
  },
  //手駒用メソッド
  removeKoma : function(koma){
    var index = this.koma.indexOf(koma);
    delete this.koma[index];
  },
  hasKoma : function(koma){
    return this.koma.indexOf(koma) > 0;
  },
  toString : function(){
    return this.koma.join("");
  },
};

//ゲームルームの情報
var RoomInfo = function(roomId){
    this.id = roomId;
    this.userList = []; //{index: UserInfo}
    this.game = false; //playing game
    this.round = 0;
    this.turn = 0;
    this.from = 0;  //attack from
    this.attack = false;  //next play is attack or block

    //game option
    this.winningPoint = 150;

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
      if(this === null || typeof(this) != 'object')
          return this;

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
    copy.tegoma = []; //secret info
    return copy;
  },

  //ルームにユーザを加える
  addUser : function(user){
    this.userList[user.id] = user;
    user.roomId = this.id;
    user.sitting = false;
    user.ready = false;
    user.isPlaying = false;
    user.playerNo = -1;
  },

  //ルームからユーザを削除する
  removeUser : function(user){
    delete this.userList[user.id];
    user.roomId = null;
  },

  sitUser : function(n, user){
    if(n < 0 || n>3 || arguments.length < 2){ return false;}
    if(this.player[n] !== null){
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
  initRound : function(startPlayerNo){
    this.turn = startPlayerNo;
    this.from = this.turn;
    this.attack = false;
    var komaRing = this.createKomaRing();
    for(var i = 0; i<4;i++){
      this.field[i] = new KomaInfo(Goita.EMPTY.repeat(8));
      this.tegoma[i] = new KomaInfo(komaRing.substring(i*8,8));
    }
  },

  initGame : function(){
    this.game = true;
    this.round = 0;
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
    this.initRound(Math.floor(Math.random() * 4)); //0-3 random value
    for(var i=0;i<4;i++){
      this.player[i].isPlaying = true;
    }
  },

  //call from play method
  finishGame : function(){
    //get players unready
    for(var i=0;i<4;i++){
      this.player[i].ready = false;
      this.player[i].isPlaying = false;
    }
  },

  //call from play method
  finishRound : function(){
    //得点の加算

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
      if(a.length === 0){
        return true;
      }
    }
    return false;
  },

  getGameField : function(){
    var field ="";
    for(var i = 0;i<4;i++){ field += this.field[i].koma.toString();}
    return field;
  },

  play : function(user, koma){
    if(!this.game){ return 2001;}
    if(arguments.length < 2 || koma.length != 1){ return 2002;}
    //手番を持っているプレイヤーからの要求か確認
    if(this.player[this.turn].id != user.id){ return 2003;}
    //validate that player has the koma
    if(!this.tegoma[this.turn].hasKoma(koma)){ return 2004;}
    if(this.attack)
    { //atack
      this.playAttack(koma);
      this.from = this.turn;
      if(this.tegoma[this.turn].count() === 0){
        this.finishRound();
        return 0;
      }
      this.forwardTurn();
      this.attack = false;
    }
    else
    { //block
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
    if(this.from == this.turn && this.field[this.turn].count < 6){
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
    //1:し*10, 2:香*4, 3:馬*4, 4:銀*4, 5:金*4, 6:角*2, 7:飛*2, 8:王*2, 9:玉*2
    return "11123456111234561123457811234579"; //ごしのテストとか済むまでとりあえず固定で
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

  sortKoma : function(tegoma){
    var str = this.komaStrToArray(tegoma);
    str.sort();
    var temp = str.join("");
    tegoma = temp;
    return temp;
  },

  komaStrToArray : function(komastr){
    var str = [];
    for(var i=0;i<komastr.length - 1;i++){
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