//number validation
var isNumber = function(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

var isUsername = function(name){
  return true;
};

//for node.js   (this === module.exports)
this["isNumber"] = isNumber;
this["isUsername"] = isUsername;

//for browser
var validator = {
  isNumber : isNumber,
  isUsername : isUsername
};