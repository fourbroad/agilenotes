var http = require('http');
var mongo = require("mongodb"), BSON = mongo.BSONPure;
var data = JSON.stringify({ 'username': 'diccwx', 'password': '123456' });
var cookie = '';
var hostname = 'dicc2.ins24.com';
//var hostname = 'www.gzmy.com';

var headers = {
    'Host': hostname,
    'Content-Type': 'application/json',
    'User-Agent':'asdasdasd'
};

var options = {
  hostname: hostname,
  headers: headers,
  port: 80,
  path: '',
  method: 'GET'
};


var saveUserInfo = function (provider, cookie_id, username, password, callback){
  var post_data = JSON.stringify({ 'username': username, 'password': password });
   options.path = '/ah/session';
   options.method = 'POST';
   options.headers['Content-Length'] = Buffer.byteLength(post_data);
   var req = http.request(options, function(res) {
     console.log('STATUS: ' + res.statusCode);
     console.log('HEADERS: ' + JSON.stringify(res.headers));
     res.setEncoding('utf8');
     res.on('data', function (chunk) {
       chunk = JSON.parse(chunk);
       console.log(chunk);
       if ( chunk.code == 1508) {
         if (cookie_id) {
           provider.update({ _id : new BSON.ObjectID(cookie_id) },
             { "$set" : { content: JSON.stringify(res.headers['set-cookie']), login_time: new Date() } }, null, function(err, data) {
                if (err) {
                  console.log(err);
                }else {
                  chunk.cookie_id = cookie_id;
                  callback(chunk);
                }
	     });
         }else{ 
           var user_data = {};
           user_data._create_at = new Date();
           user_data.login_time = new Date();
           user_data.category = "userdata";
           user_data.username = username;
           user_data.type = "51dbc4e01097ed07eb000112";
           user_data.content = JSON.stringify(res.headers['set-cookie']);

           provider.insert(user_data, {}, function(err, data) {
              if (err) {
                console.log(err);
              }else {
                chunk.cookie_id = data[0]._id;
                callback(chunk);
              }
           });
         }
       } else {
         callback(chunk);
       }
     });
   });

   req.on('error', function(e) {
     console.log('problem with request: ' + e.message);
   });

   // write data to request body
   req.write(post_data);
   req.end();
}
var coreLogout = function (provider, cookie_id, callback ) {
  provider.remove({type: '51dbc4e01097ed07eb000112', _id: BSON.ObjectID(cookie_id)}, null, function(error, result){
   if (error){
    callback(error);
    }else {
      callback(false, result)
    }
  });
}

var coreLogin = function (provider, cookie_id, callback ) {
  provider.findOne({type: '51dbc4e01097ed07eb000112', _id: BSON.ObjectID(cookie_id)}, null, null, function(error, result){
    if (result) {
    cookie = JSON.parse(result.content);
	cookie.pop();
    callback(cookie);
    } else {
     callback(null);
    }
  }); 

}

exports.coreLogin = coreLogin;
exports.coreLogout = coreLogout;
exports.default_options = options;
exports.saveUserInfo = saveUserInfo;
