var BSON = require("mongodb").BSONPure;
    
exports.extend = function extend(Child, Parent) {  
	var F = function(){};  
	F.prototype = Parent.prototype;  
	Child.prototype = new F();  
	Child.prototype.constructor = Child;  
	Child.parent = Parent.prototype;  
};

exports.objectId = function objectId(selector){
	for(var n in selector){
		if(n == "_id"){
			try{selector[n] = new BSON.ObjectID(selector[n]);}catch(e){};
		}else if(typeof(selector[n]) == "object"){
			objectId(selector[n]);
		}
	}
};
