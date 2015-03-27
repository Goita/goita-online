var ErrorMsg = {};

ErrorMsg.getMsgText = function(errorcode){
  
  var text = errorcode.toString();
  switch(errorcode)
  {
    case 1000:
      text = "bla-bla-bla";
      break;
    case 2000:
      break;
      
    default:
      break;
  }
  
  return text;
};