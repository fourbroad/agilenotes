var http = require('http');
var data = JSON.stringify({ 'username': 'zaitu', 'password': 'zttzzt' });
var cookie = '';
var hostname = 'chartis2.ins24.com';

var headers = {
    'Host': hostname,
    'Content-Type': 'application/json'
};

var options = {
  hostname: hostname,
  headers: headers,
  port: 80,
  path: '',
  method: 'GET'
};

var coreLogin = function (callback){
   options.path = '/ah/session';
   options.method = 'POST';
   options.headers['Content-Length'] = Buffer.byteLength(data);
   console.log(options);
   var req = http.request(options, function(res) {
     console.log('STATUS: ' + res.statusCode);
     console.log('HEADERS: ' + JSON.stringify(res.headers));
     res.setEncoding('utf8');
     res.on('data', function (chunk) {
       //console.log('BODY: ' + chunk);
       // record the cookie
       callback(res.headers['set-cookie']);
     });
   });
   
   req.on('error', function(e) {
     console.log('problem with request: ' + e.message);
   });
   
   // write data to request body
   req.write(data);
   req.end();
};

exports.coreLogin = coreLogin;
exports.default_options = options;
