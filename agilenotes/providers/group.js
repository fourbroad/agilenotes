
var Document = require("./document"),
    Utils = require("../lib/utils");

Group = function(db) {
	Document.call(this, db);
};

Utils.extend(Group, Document);

module.exports = Group;
