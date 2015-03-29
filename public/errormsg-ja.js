var ErrorMsg = {};

ErrorMsg.getMsgText = function(errorcode){
  
  var text = errorcode.toString();
  switch(errorcode)
  {
    case 10:
      text = "ログインしていません";
      break;
    case 1000:
      text = "ユーザ名が入力されていません";
      break;
    case 1005:
      text = "ユーザ名は12文字までです";
      break;
    case 1006:
      text = "使用できないユーザ名が含まれています";
      break;
    case 1007:
      text = "入力したユーザ名は既に使用されています";
      break;
    case 2000: ////reason: roomid is empty
      text = "ルームNo. が選ばれていません";
      break;
    case 2001: //reason: not logged in a robby with proper way
      text = "ロビーに入れていません";
      break;  
    case 2002: //reason: already joined in a room
      text = "既にルームに入っています";
      break;    
    case 2003: //reason: roomId doesn't exist
      text = "存在しないルームNo. が選ばれました";
      break;
    case 2004:
      text = "まだどこのルームにも入っていません";
      break;
      
    default:
      text = "原因不明のエラー(エラー番号:" + errorcode + ")";
      break;
  }
  
  return text;
};