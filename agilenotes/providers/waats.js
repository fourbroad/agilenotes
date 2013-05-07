var Document = require("./document"), 
	Utils = require("../lib/utils"), 
	WaatsLib = require("../lib/waats.js");

Waats = function(db) {
	Document.call(this, db);
};

Waats.queryWaats = function(provider, config, doc, type, callback) {
	var waats = new WaatsLib(provider, config, doc, type);
	waats.query(function(err, data) {
		callback(err, data);
	});
};

Utils.extend(Waats, Document);

module.exports = Waats;
