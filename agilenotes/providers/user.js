
var Document = require("./document"),
    Utils = require("../lib/utils");

User = function(db) {
	Document.call(this, db);
};

Utils.extend(User, Document);

module.exports = User;
