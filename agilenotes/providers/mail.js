var Document = require("./document"), 
	Utils = require("../lib/utils"), 
	MailLib = require("../lib/mail.js");

Mail = function(db) {
	Document.call(this, db);
};

Mail.receive = function(doc, callback) {
	MailLib.setProviders(this);
	MailLib.receive(doc, doc.server_type, callback);
};

Utils.extend(Mail, Document);

module.exports = Mail;
