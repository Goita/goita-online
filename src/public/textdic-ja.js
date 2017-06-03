var TextDic = {
  isMyTurn : "あなたの番です"
};


var ErrorMsg = {};

ErrorMsg.getMsgText = function(errorcode){
  
  var text = errorcode.toString();
  switch(errorcode)
  {
    //サーバーとの接続時
    case 10:
      text = "ログインしていません";
      break;
      
    //ログイン・ロビー関係
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
      
    //ルーム関係
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
    case 2005:
      text = "ゲーム中は席の入替ができません";
      break;
      
    case 2501:
      text = "既に席についています";
      break;
    
    //ゲーム関係
    case 3001:
      text = "ゲームが始まっていません";
      break;
    case 3002:
      text = "不正な指示が出されました";
      break;
    case 3003:
      text = "手番ではありません";
      break;
    case 3004:
      text = "不正な指示：持っていない駒は出せません";
      break;
    case 3005:
      text = "開始手番なのでパスできません";
      break;
    case 3006:
      text = "「ごし」の確認中です";
      break;
    case 3007:
      text = "「ごし」状態ではありません";
      break;
    case 3100:
      text = "今は「王」「玉」を攻めに使えません";
      break;
    case 3101:
      text = "その駒では受けることができません";
      break;
    default:
      text = "原因不明のエラー(エラー番号:" + errorcode + ")";
      break;
  }
  
  return text;
};