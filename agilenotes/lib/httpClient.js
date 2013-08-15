Httpclient = function(url) {
	// global _SERVER;
	this.port = 80; // socket port
	this.host = 'dicc2.ins24.com'; // host www.example.net
	this.path = '/ah/pdf_printer/policies/1000189171'; // PATH /foo.php
	this.scheme = '';
	this.argument = ''; // ?foo=bar&foo1=bar
	this.post_data = ''; // foo=bar&foo1=bar
	this.request_header = ''; // header sent to server
	this.cookie_array = []; // array('ssid' => 'ssid', 'foo' => 'bar')
	this.response_data = ''; // data returned from server
	this.response_header = ''; // header data from server
	this.response_body = '';
	this.response_status = 0;
	this.response_len = 0;
	this.headers = { 'Content-Type' : 'application/x-www-form-urlencoded' };
	this.time_out = 10;
};

Httpclient.prototype.http_header = function(name, value) {
	this.headers[name] = value;
};

Httpclient.prototype.default_header = function() {
	this.headers = { 'Content-Type' : 'application/x-www-form-urlencoded' };
};

// 以get方法获取数据
Httpclient.prototype.get = function(url, params, callback) {
	queryString = '';
	if (params) {
		for ( var k in params) {
			queryString += k + "=" + encodeURI(params[k]) + "&";
		}
		if (url.indexOf("?") == -1) {
			url += '?';
		}
		url += queryString.substr(0, queryString.length - 1);
	}

	this.parseUrl(url);
	this.request_header = this.get_request_header(this.host, this.path);
	// exit(this.request_header);
	this.sent_request(callback);
};

Httpclient.prototype.post = function(url, post_data) {
	this.parseUrl(url, post_data);
	this.request_header = this.post_request_header(this.host, this.path, post_data);
	this.sent_request();
};

// 解释url地址等
Httpclient.prototype.parseUrl = function(url, post_data) {
	var matchs = /^((\w+):\/\/)?((\w+):?(\w+)?@)?([^\/\?:]+):?(\d+)?(\/?[^\?#]+)?\??([^#]+)?#?(\w*)/.exec(url);
	if (matchs) {
		this.port = matchs[7] ? matchs[7] : 80;
		this.host = matchs[6];
		this.path = matchs[8];
		this.argument = matchs[9];
		this.scheme = matchs[10];
		this.post_data = post_data;
	}
};

// 执行http请求
Httpclient.prototype.sent_request = function(callback) {
	var self = this;
	this.response_data = this.socket_open(this.host, this.port, this.request_header, function() {
		self.response_header = self.get_response_header(self.response_data);
		self.cookie_array = self.get_cookie(self.response_header);
		self.response_body = self.get_response_body(self.response_data);
		callback();
	});
};

// 用GET方法请求数据
Httpclient.prototype.get_request_header = function(host, path) {
	return this.get_common_headers("GET", host, path);
};

// 用POST方法请求数据
Httpclient.prototype.post_request_header = function(host, path, post_data) {
	this.http_header("Content-Length", strlen(post_data));

	return this.get_common_headers("POST", host, path).post_data;
};

// 用PUT方法请求数据
Httpclient.prototype.put = function(url, dat) {
	this.parseUrl(url, dat);
	this.request_header = this.get_put_headers(this.host, this.path, dat);
	this.sent_request();
};

// 用DELETE方法请求数据
Httpclient.prototype.del = function(url, dat) {
	this.parseUrl(url, dat);
	this.request_header = this.get_delete_headers(this.host, this.path, dat);
	this.sent_request();
};

// 获取put请求的请求头
Httpclient.prototype.get_put_headers = function(host, path, dat) {
	this.http_header("Content-Length", dat.length);

	return get_common_headers("PUT", host, path).dat;
};

// 获取delete方法时的请求头
Httpclient.prototype.get_delete_headers = function(host, path, dat) {
	this.http_header("Content-Length", dat.length);

	return this.get_common_headers("DELETE", host, path).dat;
};

// http请求头， 可用GET， POST， PUT， DELETE， HEAD
Httpclient.prototype.get_common_headers = function(method, host, path) {
	var req = path;
	if (this.argument) {
		if (path.indexOf("?") != -1) {
			req += this.argument;
		} else {
			req += '?' + this.argument;
		}
	}

	var header = '';
	header += method + " " + req + " HTTP/1.1";
	header += "\r\n";
	header += "Host: " + host;
	header += "\r\n";
	header += "User-Agent: Mozilla/5.0 (X11; Linux i686; rv:12.0) Gecko/20100101 Firefox/12.0";
	// header="User-Agent: "._SERVER['HTTP_USER_AGENT'];
	header += "\r\n";
	header += "Accept: */*";
	header += "\r\n";
	header += "Keep-Alive: " + this.time_out;
	header += "\r\n";
	header += "Connection: close";
	header += "\r\n";
	header += "Pragma: no-cache";
	header += "\r\n";
	header += "Cache-Control: no-cache";
	header += "\r\n";
	header += "Cookie: " + this.cookie_to_text(this.cookie_array);
	header += "\r\n";
	if (this.headers) {
		for ( var i in this.headers) {
			header += i + ": " + this.headers[i];
			header += "\r\n";
		}
	}
	header += "\r\n";

	return header;
};

Httpclient.prototype.cookie_to_text = function(cookie_array) {
	/*
	 * var cookie_to_text = ''; for ( var i in cookie_array) { cookie_to_text +=
	 * i + '=' + cookie_array[i]; }
	 */
	return (cookie_array && cookie_array instanceof Array) ? cookie_array.join() : '';
};

Httpclient.prototype.socket_open = function(host, port, header, callback) {
	var net = require("net");
	var socket = new net.Socket();
	var bufferArray = [], self = this, nread = 0;
	socket.setTimeout(30000);
	socket.setNoDelay(true);
	socket.connect(port, host);
	socket.on("connect", function(handle) {
		socket.write(header, "UTF-8", function(res) {

		});
	});
	socket.on("error", function(e) {
		self.response_data = "";
	});

	socket.on("data", function(chunk) {
		bufferArray.push(chunk);
		nread += chunk.length;
	});

	socket.on("end", function(res) {
		socket.destroy();
		self.response_data = bufferArray;
		self.response_len = nread;
		callback();
	});
};

Httpclient.prototype.get_response_header = function(response) {
	// header=explode( "\r\n\r\n" , response,2);
	var header = response[0].toString("UTF-8").split("\r\n\r\n");
	var result = {};
	if (header) {
		var sp = header[0].split("\r\n");
		for ( var i = 0; i < sp.length; i++) {
			var t = sp[i].split(": ");
			if (t.length > 1) {
				result[t[0]] = t[1];
			} else {
				this.response_status = parseInt(t[0]);
			}
		}
	}

	return result;
};

Httpclient.prototype.get_cookie = function(header) {
	return header['Set-Cookie'];
};

Httpclient.prototype.set_cookie = function(cookie) {
	this.cookie_array = cookie;
};

Httpclient.prototype.get_response_body = function(response) {
	var getStartIndex = function(header, response, len, bufferLenArray) {
		var start = len - parseInt(header['Content-Length']), offset = response[0].length;
		for ( var i = 0; i < response.length; i++) {
			if (start < offset) {
				bufferLenArray[0] = offset - start;
				return i;
			} else if (start == offset) {
				return i + 1;
			} else {
				offset += response[i].length;
			}
		}
	};

	var result = [];
	if (this.response_header['Content-Length'] > 0) {
		var bufferLenArray = [ 0 ];
		var index = getStartIndex(this.response_header, this.response_data, this.response_len, bufferLenArray);
		if (bufferLenArray[0] > 0) {
			var start = this.response_data[index].length - bufferLenArray[0];
			var buffer = new Buffer(bufferLenArray[0] + 1);
			this.response_data[index].copy(buffer, 0, start - 1);
			result.push(buffer);
		}

		for ( var i = (index + 1); i < this.response_data.length; i++) {
			result.push(this.response_data[i]);
		}
	}

	return result;
};

Httpclient.prototype.getRedirectScript = function(url) {
	return '<script>window.location.href="' + url + '";';
};

exports.httpClient = Httpclient;