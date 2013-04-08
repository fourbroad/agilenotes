
var Document = require("./document"),
    Utils = require("../lib/utils");

OU = function(db) {
	Document.call(this, db);
};

Utils.extend(OU, Document);

module.exports = OU;
