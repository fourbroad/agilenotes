
var Document = require("./document"),
    Utils = require("../lib/utils");

Category = function(db) {
	Document.call(this, db);
};

Utils.extend(Category, Document);

Category.prototype.remove = function(selector, options, callback) {
	options = options || {};
	options.cascade = true;
	Database.parent.remove.call(this, selector, options, function(error, result){
		callback(error, result);
	});
};

module.exports = Category;
