
var Document = require("./document"),
    Utils = require("../lib/utils");

Role = function(db) {
	Document.call(this, db);
};

Utils.extend(Role, Document);

module.exports = Role;
