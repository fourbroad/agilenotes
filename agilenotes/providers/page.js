
var Document = require("./document"),
    Utils = require("../lib/utils");

Page = function(db) {
	Document.call(this, db);
};

Utils.extend(Page, Document);

module.exports = Page;
