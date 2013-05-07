var Document = require("./document"), Utils = require("../lib/utils"), AlipayLib = require("../lib/alipay.js").Alipay;

Alipay = function(db) {
	Document.call(this, db);
};

Alipay.alipayto = function(config, options, callback) {
	var alipay = new AlipayLib(config);
	callback(false, alipay.alipayto(options.subject, options.body, options.totalPremium, options.defaultbank,
			options.transID));
};

Alipay.verity = function(config, options, callback) {
	var alipay = new AlipayLib(config);
	alipay.verity(options, function(data) {
		callback(data);
	});
};

Utils.extend(Alipay, Document);

module.exports = Alipay;
