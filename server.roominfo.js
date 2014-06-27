//ゲームルームの情報
var RoomInfo = function(roomId){
    this.roomId = roomId;
    this.playerList = [];
};

RoomInfo.prototype = {
  addPlayer : function(id, nickname){
    this.playerList[id] = nickname;
  },
  someMethod : function(){}
};

module.exports = RoomInfo;