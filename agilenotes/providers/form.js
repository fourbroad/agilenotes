
var Document = require("./document"),
    Utils = require("../lib/utils");

Form = function(db) {
	Document.call(this, db);
};

Utils.extend(Form, Document);

module.exports = Form;
