var Document = require("./document"), 
	Utils = require("../lib/utils"), 
	MailLib = require("../lib/mail.js");

Mail = function(db) {
	Document.call(this, db);
};

Mail.readmail = function(dbid, config, opts, callback) {
	MailLib.readMail(dbid, config, opts, callback);
};

Mail.sendmail = function(dbid, config, doc, opts, callback) {
	MailLib.sendMail(dbid, config, doc, opts, callback);
};

Utils.extend(Mail, Document);

module.exports = Mail;
