var nodecurl = require('node-curl');
var qs = require('querystring');
var url = 'chartis2.ins24.com/ah/session';
var cookieFile = 'node-curl-cookie.txt';
var header = [];
header.push('Content-Type:application/json');
var filestrs = '{"password" : "zttzzt", "username" : "zaitu"}';
var default_options = {
                USERAGENT: 'agilesnotes-curl',
                HttpHEADER: header,
                COOKIEFILE: cookieFile,
                COOKIEJAR: cookieFile
        }
var coreLogin = function (callback){
	var curloptions = {};
	curloptions.POST = true;
	curloptions.POSTFIELDS = filestrs;
	var curl = nodecurl.create(default_options);
	curl.reset();
	curl.debug = true;
	curl(url, curloptions, function(err) {
		console.info(this.status);
		console.info('-----');
		console.info(this.body);
		console.info('-----');
		console.info(this.info('SIZE_DOWNLOAD'));

		curl.close();
		if (err){
		  callback(err, null);
		}else{
		  callback();
		}
	});
}
exports.coreLogin = coreLogin;
exports.default_options = default_options;
exports.curl = nodecurl;
