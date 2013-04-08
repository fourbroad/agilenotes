
var Document = require("./document"),
    Utils = require("../lib/utils");

View = function(db) {
	Document.call(this, db);
};

Utils.extend(View, Document);

View.prototype.exec = function(view, options, callback) {
	try{
		var selector = eval(view.selector);
		Utils.objectId(selector);
		// TODO add fields for find operation.
		this.find(selector,null,options,function(error, data){
			callback(error, data);
		});
	}catch(e){
		callback(e);
	}
};

module.exports = View;
