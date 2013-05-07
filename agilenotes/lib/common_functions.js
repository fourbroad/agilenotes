exports.getClientIP = function(req){
	var ipAddress;
	var headers = req.headers;
	var forwardedIpsStr = headers['x-real-ip'] || headers['x-forwarded-for'];
	forwardedIpsStr ? ipAddress = forwardedIpsStr : ipAddress = null;
	if (!ipAddress) {
		ipAddress = req.connection.remoteAddress;
	}
	return ipAddress;
};

function _send_sms(mobile, message, callback) {
	var t = require("./rpcclient");
	var url = require('../config/waats').WaatsConfig.sms_core;
	// var url = "http://w.dev.com/index.html";
	var phprpc = new t.RPCClient(url);
	phprpc.call("send_sms", [ mobile, message ], true, function(err, data) {
		callback(err, data);
	});
}

/**
 * method:post params mobile string 11 params message string send messages
 */
exports.sendSms = function(req, res) {
	var q = req.body;
	if (typeof (q) != undefined && q) {
		if (q.mobile && q.message) {
			_send_sms(q.mobile, q.message, function(err, data) {
				if (err) {
					res.send({ success : false, msg : err }, 200);
				} else {
					res.send({ success : true, msg : "send sms ok!" }, 200);
				}
			});
		} else {
			res.send({ success : false, msg : "params error!" }, 200);
		}
	} else {
		res.send({ success : false, msg : "params error!" }, 200);
	}
};
