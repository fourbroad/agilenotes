var net = require("net");

function PHPRPC_Error(errno, errstr) {
    this.Number = errno;
    this.Message = errstr;
};

PHPRPC_Error.prototype.toString = function () {
    return this.Number + ":" + this.Message;
};
PHPRPC_Error.prototype.__toString = function () {
    return this.toString();
};
PHPRPC_Error.prototype.getNumber = function () {
    return this.Number;
};
PHPRPC_Error.prototype.getMessage = function () {
    return this.Message;
};

function  RPCClient(serverURL) {this.__construct(serverURL);};
RPCClient.prototype._disconnect = function (){};
RPCClient.prototype.__construct = function (serverURL) {
    if (serverURL != '') {
        this.useService(serverURL);
    }
};

RPCClient.prototype.base64_encode = function(str) {
	if (typeof(str) == 'undefined' || !str) return "";
	return new Buffer(str).toString("base64");
};

RPCClient.prototype.lenFor = function(str) {
	var byteLen = 0, len = str.length;
	if (str) {
		for ( var i = 0; i < len; i++) {
			if (str.charCodeAt(i) > 255) {
				byteLen += 3;
			} else {
				byteLen++;
			}
		}
		return byteLen;
	} else {
		return 0;
	}
};

RPCClient.prototype.base64_decode = function(str) {
	if (typeof(str) == 'undefined' || !str) return "";
	return new Buffer(str, "base64").toString();
};

RPCClient.prototype.useService =function (serverURL, username, password) {
    this._http_version = "1.1";
    this._keep_alive = true;
    this._server = {};
    this._key = null;
    this._keylen = 128;
    this._encryptMode = 0;
    this._cookie = '';
    this._charset = 'utf-8';
    var url = require("url");
    urlparts = url.parse(serverURL);

    if (typeof(urlparts.host) == 'undefined') {
        urlparts.host = "localhost";
        urlparts.scheme = "http";
        if (typeof(urlparts.protocol) != 'undefined') {
			if (urlparts.protocol.toLowerCase() == 'https:') {
				urlparts.scheme = 'https';
			}
		}
		
		if (typeof(urlparts.port) == 'undefined') {
			if (urlparts.scheme == 'https') {
				urlparts.port = 443;
			} else {
				urlparts.port = 80;
			}
		}
    }
    
    if (typeof(urlparts.protocol) != 'undefined') {
		if (urlparts.protocol.toLowerCase() == 'https:') {
			urlparts.scheme = 'https';
		}
	}
    
    if (typeof(urlparts.port) == 'undefined') {
			if (urlparts.scheme == 'https') {
				urlparts.port = 443;
			} else {
				urlparts.port = 80;
			}
	}

    if (typeof(urlparts['query']) != 'undefined') {
        urlparts['path'] += '?' + urlparts['query'];
    }

    this._server['scheme'] = urlparts['scheme'];
    this._server['host'] = urlparts['host'];
    this._server['port'] = urlparts['port'];
    this._server['path'] = urlparts['path'];
    if (typeof(urlparts['user']) != 'undefined') this._server['user'] = urlparts['user'];
    if (typeof(urlparts['pass']) != 'undefined') this._server['pass'] = urlparts['pass'];
};

RPCClient.prototype.setKeyLength= function (keylen) {
    if (!is_null(this._key)) {
        return false;
    }
    else {
        this._keylen = keylen;
        return true;
    }
};
RPCClient.prototype.getKeyLength =function () {
    return this._keylen;
};
RPCClient.prototype.setEncryptMode = function (encryptMode) {
    if ((encryptMode >= 0) && (encryptMode <= 3)) {
        this._encryptMode = (int)(encryptMode);
        return true;
    }
    else {
        this._encryptMode = 0;
        return false;
    }
};
RPCClient.prototype.getEncryptMode =  function () {
    return this._encryptMode;
};
RPCClient.prototype.setCharset =  function (charset) {
    this._charset = charset;
};
RPCClient.prototype.getCharset=function () {
    return this._charset;
};
RPCClient.prototype.setTimeout=  function (timeout) {
    this._timeout = timeout;
};
RPCClient.prototype.getTimeout= function () {
        return this._timeout;
};

// php serialize
RPCClient.prototype.serialize = function(obj) {
	var type = typeof(obj);
	switch(type) {
		case 'number':
			return "i:" + obj + ";";
		case 'object':
			var result = "a:" + obj.length + ":{";
			for (var i in obj) {
				result += this.serialize(i) + this.serialize(obj[i]); 
			}
			result += "}";
			return result;
		case 'string':
			return "s:" + this.lenFor(obj) + ":\"" + obj + "\";";
		default:
			return "s:" + this.lenFor(obj) + ":\"" + obj + "\";";
	}
};

// php unserialize
RPCClient.prototype.unserialize = function(obj) {
	
};

RPCClient.prototype.call =  function (funcname, args, byRef, callback) {
        request = "phprpc_func=" + funcname;
        if (args.length > 0) {
            request += "&phprpc_args=" + this.base64_encode(this.serialize(args));
        }
        request += "&phprpc_encrypt=" + this._encryptMode;
        if (!byRef) {
            request += "&phprpc_ref=false";
        }
        request = request.replace(/\+/g, '%2B');
        result = this._post(request, 1, callback);
        if (result instanceof PHPRPC_Error) {
            return result;
        }
        
        this._warning = new PHPRPC_Error(result.phprpc_errno, this.base64_decode(result.phprpc_errstr));
        if (typeof(result.phprpc_output) != 'undefined') {
            this._output = this.base64_decode(result['phprpc_output']);
            if (this._server['version'] >= 3) {
                this._output = this._decrypt(this._output, 3);
            }
        }
        else {
            this._output = '';
        }
        if (typeof(result.phprpc_result) != 'undefined') {
            if (typeof(result.phprpc_args) != 'undefined') {
                arguments = this.unserialize(this._decrypt(this.base64_decode(result['phprpc_args']), 1));
                for (var i = 0; i < arguments.length; i++) {
                    args[i] = arguments[i];
                }
            }
            result = this.unserialize(this._decrypt(this.base64_decode(result['phprpc_result']), 2));
        }
        else {
            result = this._warning;
        }
        return result;
    };

    RPCClient.prototype.getOutput = function () {
        return this._output;
    };

    RPCClient.prototype.getWarning = function () {
        return this._warning;
    };
    
    RPCClient.prototype.Hex2Dec = function (Hexstr){
    	 var c = Hexstr.toLowerCase();
    	 switch(c){
    	  case 'f':
    	   return 15;
    	  case 'e':
    	   return 14;
    	  case 'd':
    	   return 13;
    	  case 'c':
    	   return 12;
    	  case 'b':
    	   return 11;
    	  case 'a':
    	   return 10;
    	  default:
    	   return parseInt(c);
    	 } 
    	};
    
    RPCClient.prototype._post = function (request_body, times, callback) {
    	var url = null;
    	var _this = this;
    	var connection = '';
        if (times > 2) {
            return new PHPRPC_Error(E_ERROR, "Illegal HTTP server.");
        }
        times++;
        if (this._socket == false) {
            error = this._connect();
            if (error instanceof PHPRPC_Error) {
                return error;
            }
        }
        
        url = this._server['path'];
        connection = "Connection: " + (this._keep_alive ? 'Keep-Alive' : 'close') + "\r\n" +
                      "Pragma: no-cache\r\n" +
                      "Cache-Control: no-cache\r\n";
        auth = '';
        if (typeof(this._server['user']) != 'undefined') {
            auth = "Authorization: Basic " + this.base64_encode(this._server['user'] + ":" + this._server['pass']) + "\r\n";
        }
        var cookie = '';
        if (this._cookie) {
            cookie = "Cookie: " + this._cookie + "\r\n";
        }
        content_len = request_body.length;
        request =
            "POST " + url + " HTTP/" + this._http_version + "\r\n" +
            "Host: " + this._server['host'] + ":" + this._server['port'] + "\r\n" +
            "User-Agent: PHPRPC Client 3.0 for PHP\r\n" .
            auth +
            connection +
            cookie +
            "Accept: */*\r\n" +
            "Accept-Encoding: gzip,deflate\r\n" +
            "Content-Type: application/x-www-form-urlencoded; charset=" + this._charset + "\r\n" +
            "Content-Length: " + content_len + "\r\n" +
            "\r\n" +
            request_body;
        
        console.log(request);

		var mod = this._server.port == 443 ? require('https') : require('http');
		var options = {port : this._server.port};

		var dns = require("dns");
		dns.resolve4(this._server.host, function(err, address) {
			if (err) {
				console.log(err);
			} else {
				options.hostname = address[0];
				options.path = _this._server.path;
				var req = mod.request(options, function(res) {
					res.on('data', function(data) {
			        	console.log(data.toString("UTF-8"));
			        	callback(false, data);
			        });
					
					if (res && res.statusCode == 200) {
						console.log("request success!");
					} else {
						callback("waats return response : " + res.statusCode, {});
					}
				});
				
				req.write(request);
				req.end();

				req.on('error', function(e) {
					console.error(e);
					callback(e, {});
				});
			}
		});
		
		return false;
    };
    
    String.prototype.trim= function(){  
        // 用正则表达式将前后空格
        // 用空字符串替代。
        return this.replace(/(^\s*)|(\s*$)/g, "");  
    };
    
    RPCClient.prototype._parseHeader = function (header) {
    	var match = null;
        if ((match = header.match(/HTTP\/(\d\.\d)\s+(\d+)([^(\r|\n)]*)(\r\n|)/i)) != null) {
            this._http_version = match[1];
            status = parseInt(match[2]);
            status_message = match[3];
            if ((status != 100) && (status != 200)) {
                return new PHPRPC_Error(status, status_message);
            }
        } else {
            return false;
        }
        if ((match = header.match(/X\-Powered\-By\: PHPRPC Server\/([^(\r|\n)]*)(\r\n|)/i)) != null) {
            this._server['version'] = parseFloat(match[1]);
        } else {
            return new PHPRPC_Error(E_ERROR, "Illegal PHPRPC server.");
        }
        if ((match = header.match(/Content\-Type\: text\/plain\; charset\=([^(\r|\n)]*)(\r\n|)/i)) != null) {
            this._charset = match[1];
        }
        if ((match = header.match(/\r\nSet\-Cookie\:([^(\r|\n)]*)(\r\n|)/i)) != null) {
            this._cookie = {};
            cookie = match[1].split(";");
            for (var i = 0; i < cookie.length; i++) {
            	cookie[i].trim();
                if ((cookie[i].substring(0, 5) != 'path=') &&
                    (cookie[i].substring(0, 7) != 'domain=') &&
                    (cookie[i].substring(0, 8) != 'expires=')) {
                    this._cookie.push( cookie[i]);
                }
            }
            this._cookie = this._cookie.join('; ');
        }
        if ((match = header.match(/Transfer\-Encoding\:([^(\r|\n)]*)(\r\n|)/i)) != null) {
            transfer_encoding = match[1].trim();
        }
        else {
            transfer_encoding = '';
        }
        if ((match = headers.match(/Content\-Encoding\: ([^(\r|\n)]*)(\r\n|)/i)) != null) {
            content_encoding = match[1].trim();
        }
        else {
            content_encoding = '';
        }
        if ((match = headers.match(/Content\-Length\:([^(\r|\n)]*)(\r\n|)/i)) != null) {
            content_length = parseInt(match[1].trim());
        }
        else {
            content_length = null;
        }
        if ((match = headers.match(/Connection\:([^(\r|\n)]*)(\r\n|)/i)) != null) {
            connection = match[1].trim();
        }
        else {
            connection = 'Keep-Alive';
        }
        return {'status' : status,
                     'transfer_encoding' : transfer_encoding,
                     'content_encoding' : content_encoding,
                     'content_length' : content_length,
                     'connection' : connection};
    };

exports.RPCClient = RPCClient;
