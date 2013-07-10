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


var saveUserInfo = function (provider, username, password, callback){
  var post_data = JSON.stringify({ 'username': username, 'password': password });
  
   options.path = '/ah/session';
   options.method = 'POST';
   options.headers['Content-Length'] = Buffer.byteLength(post_data);
   //console.log(options);
   var req = http.request(options, function(res) {
     console.log('STATUS: ' + res.statusCode);
     console.log('HEADERS: ' + JSON.stringify(res.headers));
     res.setEncoding('utf8');
     res.on('data', function (chunk) {
       var user_data = {};
       user_data._create_at = new Date();
       user_data.category = "userdata";
       user_data.username = username;
       user_data.type = "51dbc4e01097ed07eb000112";
       user_data.content = JSON.stringify(res.headers['set-cookie']);
       provider.insert(user_data, {}, function(err, data) {
          var res = {};
          res.core_msg = chunk;
          res.cookie_id = data[0]._id;
          console.log(res);
	  callback(res);
       });
     });
   });

   req.on('error', function(e) {
     console.log('problem with request: ' + e.message);
   });

   // write data to request body
   req.write(data);
   req.end();
}

var coreLogin = function (provider, cookie_id, callback ) {
  provider.findOne({type: '51dbc4e01097ed07eb000112', _id: BSON.ObjectID(cookie_id)}, null, null, function(error, result){
    if (result) {
    cookie = JSON.parse(result.content);
console.log(cookie);
    callback(cookie);
    } else {
     
    }
  }); 

}

exports.coreLogin = coreLogin;
exports.default_options = options;
exports.saveUserInfo = saveUserInfo;
