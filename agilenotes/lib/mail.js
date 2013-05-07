var MailParser = require("mailparser").MailParser;
var fs = require("fs");
var mongo = require("mongodb"), BSON = mongo.BSONPure;

var providers = null;

function setProviders(pro) {
	providers = pro;
}

function _genMessage(config, doc, attachments, callback) {
	if (!config.user) {
		callback("sender user is null!", {});
	} else if (!doc.to) {
		callback("cc is null!", null);
	} else if (!doc.subject) {
		callback("subject is null !", null);
	} else {
		var message = { from : config.user, to : doc.to, subject : doc.subject, //
		headers : { 'X-Laziness-level' : 1000 },

		html : doc.content };
		if (doc.cc) {
			message.cc = doc.cc;
		}
		if (doc.bcc) {
			message.bcc = doc.bcc;
		}
		message.attachments = attachments;
		callback(false, message);
	}
}

function _saveMail(provider, doc, callback) {
	doc._create_at = new Date();
	doc.category = "inbox";
	doc.type = "51554346ac8f275f140002ae";
	provider.insert(doc, {}, function(err, data) {
		callback(err, data);
	});
};

function sendMail(dbid, config, doc, opts, callback) {
	var provider = providers.getProvider(dbid);

	var process = function() {
		_genAttachMents(provider, doc.attachments, function(err, data) {
			if (err) {
				callback(err, data);
			} else {
				_genMessage(config, doc, data, function(err, result) {
					if (err) {
						callback(err, null);
					} else {
						var cfg = config.outgoing;
						cfg.user = config.user;
						cfg.password = config.password;
						_sendMail(config.outgoing, result, function(err, data) {
							callback(err, data);
						});
					}
				});
			}
		});
	};

	if (opts && opts.save) {
		_saveMail(provider, doc, function(err, data) {
			if (err || !data) {
				callback(err || "Data Save Error!", null);
			} else {
				process();
			}
		});
	} else {
		process();
	}
}

/**
 * @param dbid
 *            database ObjectId
 * @param cid
 *            smtp mail config id
 * @param docid
 *            saved document id
 * @param opts
 *            other options
 * @param callback
 *            callback functions
 */
function _sendMailById(dbid, cid, docid, opts, callback) {
	var provider = providers.getProvider(dbid);
	if (provider) {
		provider.findOne({ _id : new BSON.ObjectID(cid) }, null, null, function(err, config) {
			if (err || !config) {
				callback(err || "config not found!", null);
			} else {
				provider.findOne({ _id : new BSON.ObjectID(docid) }, null, null, function(err, doc) {
					if (err || !doc) {
						callback(err || "doc not found!", null);
					} else {
						_sendMail(provider, config, doc, opts, callback);
					}
				});
			}
		});
	} else {
		callback("provider not found", null);
	}
}

function sendObject(req, res) {
	var postdata = req.body, params = req.params, dbid = params.dbid, docid = params.docid, q = req.query;
	var field = typeof (q.field) != 'undefined' ? JSON.parse(JSON.stringify(q.field)) : {};
	var options = typeof (q.options) != 'undefined' ? JSON.parse(JSON.stringify(q.options)) : {};
	var provider = providers.getProvider(dbid);
	if (options.update) {
		provider.update({ _id : new BSON.ObjectID(postdata._id) },
			{ "$set" : { "cid" : docid, category : "sendbox" } }, null, function(err, data) {

			});
	}

	provider.findOne({ _id : new BSON.ObjectID(docid) }, field, options, function(err, data) {
		if (err || !data) {
			res.send({ success : false, msg : err }, 200);
		} else {
			sendMail(dbid, data, postdata, options, function(err, data) {
				if (err) {
					res.send({ success : false, msg : err }, 200);
				} else {
					res.send({ success : true, msg : "OK" }, 200);
				}
			});
		}
	});
}

function _sendMail(config, message, callback) {
	var nodemailer = require('nodemailer');
	config.port = config.port != "Auto" ? parseInt(config.port) : 25;
	// Create a SMTP transport object
	var transport = nodemailer.createTransport("SMTP", {
	// service: 'smtp.163.com', // use well known service
	host : config.host, port : config.port, auth : { user : config.user, pass : config.password } });

	console.log('SMTP Configured');
	console.log('Sending Mail');

	transport.sendMail(message, function(error) {
		if (error) {
			console.log('Error occured');
			console.log(error.message);
			callback(error, { result : "Error occured!" });
		} else {
			callback(false, { result : 'Message sent successfully!' });
			console.log('Message sent successfully!');
		}
	});
}

// get attachments alias name, you can put the alias name in the url such as
// http://localhost/test.zip?alias=myalias.zip
function _getAlias(url) {
	var URL = require("url");
	var urlData = URL.parse(url);
	if (typeof (urlData.query) != 'undefined') {
		var arr = urlData.query.split("&");
		var query = {};
		var tmp = null;
		for ( var i in arr) {
			tmp = arr[i].split("=");
			query[tmp[0]] = typeof (tmp[1]) != 'undefined' ? tmp[1] : "";
		}

		return typeof (query["alias"]) != 'undefined' ? query["alias"] : null;
	} else {
		return null;
	}
}
/**
 * 
 * @param url :
 *            request url
 * @param alias :
 *            filename alias
 * @param callback :
 *            callback function
 */
function _getNetResources(url, callback) {
	var mod = url.substring(0, 4) == 'http' ? require("http") : require("https");
	var ret = {};
	var data_len = 0;
	mod.get(url, function(res) {
		var headers = JSON.parse(JSON.stringify(res.headers));
		if (typeof (headers['content-disposition']) != 'undefined') {
			var len = headers['content-disposition'].length - 1;
			var index = headers['content-disposition'].indexOf("filename=");
			var alias = _getAlias(url);
			if (alias) {
				ret.fileName = alias;
			} else {
				ret.fileName = headers['content-disposition'].substring(index + 10, len);
			}
		} else {
			ret.fileName = "index.html";
		}

		ret.contents = new Buffer(parseInt(headers['content-length']));

		var types = headers['content-type'].split(";");
		ret.contentType = types[0];
		ret.cid = new BSON.ObjectID();

		res.on("data", function(data) {
			data.copy(ret.contents, data_len);
			data_len += data.length;
		});
		res.on("error", function(err) {
			callback(true, err);
		});

		res.on("end", function() {
			callback(false, ret);
		});
	});
}

// is a array
function _genAttachMents(provider, doc, callback) {
	if (typeof (doc) == 'undefined') {
		callback(false, []);
	} else {
		if (doc.length > 0) {
			var ret = [];
			for ( var i = 0; i < doc.length; i++) {
				if (typeof (doc[i]) == 'string') {
					_getNetResources(doc[i], function(err, data) {
						ret.push(!err ? data : {});
					});
				} else {
					provider.findAttachmentByDocid(doc[i]._id, function(err, data) {
						if (err) {
							ret.push({});
						} else {
							ret.push({ fileName : data.filename, contents : data.currentChunk.data.buffer,
								cid : data.currentChunk.objectId, contentType : data.contentType });
						}
					});
				}
			}

			var t = setInterval(function() {
				if (ret.length == doc.length) {
					callback(false, ret);
					clearInterval(t);
				}
			}, 1000);
		} else {
			callback(false, []);
		}
	}
}

function _createTmpFile(docid, buffer, callback) {
	if (buffer.content) {
		var filename = "/tmp/" + docid;
		// fs.write(fd, buffer, offset, length, position, [callback])
		fs.writeFile(filename, buffer.content.toString(), "UTF-8", function(err, data) {
			buffer.path = filename;
			callback(err, buffer);
		});
	} else {
		callback("attachment content is empty!", "");
	}
}

function readMail(req, res) {
	var params = req.params, dbid = params.dbid, q = req.query, docid = params.docid;
	var selector = { _id : new BSON.ObjectID(docid) }, options = q.options;
	var fields = q.fields, provider = providers.getProvider(dbid);

	res.header('Content-Type', 'application/json');

	provider["findOne"](selector, fields, options, function(err, data) {
		if (err) {
			res.send({ result : "false" }, 200);
		} else if (data) {
			var $ = require("jquery");
			data.dbid = dbid;
			data = $.extend(data, data.imcoming);
			data = $.extend(data, q);
			receive(data, data.incoming.type, function(err, retdata) {
				if (err) {
					res.send({ success : false, msg : err }, 200);
				} else {
					// 获取邮件数量
					provider["count"]({ cid : data._id }, function(error, count) {
						retdata.count = count || 0;
					});

					provider["findOne"]({ cid : data._id, "message-id" : retdata["message-id"] }, fields, options,
						function(err, tmpdat) {
							if (!tmpdat) {
								retdata.data._ownerID = data._ownerID;
								retdata.data.attachments = []; // 附件信息
								retdata.data.type = "51725c5cac8f275c93000024";
								retdata.data.cid = docid;
								provider.insert(retdata.data, {}, function(err, retresult) {
									if (err) {
										console.log(err);
									} else {
										if (retdata.attachments) {
											var attachments = retdata.attachments;
											for ( var i = 0; i < attachments.length; i++) {
												_createTmpFile(retresult[0]._id, attachments[i], function(err, data) {
													if (err) {
														console.log(err);
													} else {
														provider.createAttachment(retresult[0]._id, "mail_file/"
																+ data.fileName, data.fileName, data.contentType,
															function(err, gridStore) {
																gridStore.writeFile(data.path, function(err, data) {
																	if (err) {
																		console.log(err);
																	}
																	attachments.push(data);
																});
															});
													}
												});
											}

											// 添加附件信息
											provider.update({ "message-id" : retresult["message-id"],
												category : "inbox" }, { "$set" : { "attachments" : attachments } }, {},
												function(err, data) {
													// console.log(err);
													// console.log(data);
												});
										}
									}
								});
							}
						});
				}
			});
		}
	});

	res.send({ result : "OK" }, 200);
}

function receive(doc, server_type, callback) {
	return server_type == "IMAP" ? imapReceive(doc, callback) : pop3Receive(doc, callback);
}

function pop3Receive(doc, callback) {
	try {
		doc.port = 995;
		var currentmsg = 0;
		var username = doc.user, password = doc.password;
		var POP3Client = require("node-poplib");
		var client = new POP3Client(doc.port, doc.host, { tlserrs : false, enabletls : true, debug : false });

		client.on("error", function(err) {
			if (err.errno === 111)
				console.log("Unable to connect to server");
			else console.log("Server error occurred");

			console.log(err);
		});

		client.on("connect", function() {
			console.log("CONNECT success");
			client.login(username, password);
		});

		client.on("invalid-state", function(cmd) {
			console.log("Invalid state. You tried calling " + cmd);
		});

		client.on("locked", function(cmd) {
			console.log("Current command has not finished yet. You tried calling " + cmd);
		});

		client.on("connect", function() {
			console.log("CONNECT success");
			client.auth(username, password);
		});

		client.on("login", function(status, rawdata) {
			if (status) {
				console.log("LOGIN/PASS success");
				client.list();
			} else {
				console.log("LOGIN/PASS failed");
				client.quit();
			}
		});
		// Data is a 1-based index of messages, if there are any messages
		client.on("list", function(status, msgcount, msgnumber, data, rawdata) {
			if (status === false) {
				console.log("LIST failed");
				client.quit();

			} else {
				console.log("LIST success with " + msgcount + " element(s)");
				if (msgcount > 0) {
					currentmsg = 1;
					client.retr(currentmsg);
				} else {
					client.quit();
				}
			}
		});

		client
				.on(
					"retr",
					function(status, msgnumber, data, rawdata) {
						if (status === true) {
							console.log("RETR success " + msgnumber);
							currentmsg += 1;
							var mailparser = new MailParser({ debug : false, streamAttachments : false,
								defaultCharset : "UTF-8" });

							mailparser
									.on(
										"end",
										function(mail_object) {
											mail_object.category = "inbox";
											mail_object.user = doc.user;
											mail_object.date = mail_object.headers.date;
											mail_object.to = mail_object.headers.to ? mail_object.headers.to : doc.user;
											mail_object.from = mail_object.headers.from;
											mail_object["message-id"] = mail_object.headers["message-id"] ? mail_object.headers["message-id"]
													: md5(mail_object.from + mail_object.date);

											var t = {};
											t.data = mail_object;
											t.data.content = mail_object.html ? mail_object.html : mail_object.text;
											t.attachments = mail_object.attachments;
											delete (t.data.attachments);
											delete (t.data.text);
											delete (t.data.html);

											callback(false, t);
										});

							mailparser.write(data);
							mailparser.end();

						} else {
							console.log("RETR failed for msgnumber " + msgnumber);
							client.rset();
						}
					});

		client.on("dele", function(status, msgnumber, data, rawdata) {
			if (status === true) {
				console.log("DELE success for msgnumber " + msgnumber);
				client.quit();
			} else {
				console.log("DELE failed for msgnumber " + msgnumber);
				client.quit();
			}
		});

		client.on("quit", function(status, rawdata) {

			if (status === true)
				console.log("QUIT success");
			else console.log("QUIT failed");

		});
	} catch (e) {
		console.log(e);
	}
}

function imapReceive(doc, callback) {
	var inbox = require("inbox");

	var client = inbox.createConnection(false, doc.host, { secureConnection : true,
		auth : { user : doc.user, pass : doc.password } });
	client.connect();

	client
			.on(
				"connect",
				function() {
					client
							.openMailbox(
								"INBOX",
								function(error, info) {
									if (error) { return callback(error, info); }
									client
											.listMessages(
												doc.count,
												doc.limit,
												function(err, messages) {
													messages
															.forEach(function(message) {
																var messageStream = client
																		.createMessageStream(message.UID);

																var mailparser = new MailParser(
																	{ debug : false, streamAttachments : false,
																		defaultCharset : "UTF-8" });

																messageStream.pipe(mailparser, {
																	write : function(data) {
																		// console.log(data);
																	}, end : true });

																mailparser
																		.on(
																			"end",
																			function(mail_object) {
																				mail_object.category = "inbox";
																				mail_object.user = doc.user;
																				mail_object.date = mail_object.headers.date;
																				mail_object.to = mail_object.headers.to ? mail_object.headers.to
																						: doc.user;
																				mail_object.from = mail_object.headers.from;
																				mail_object["message-id"] = mail_object.headers["message-id"] ? mail_object.headers["message-id"]
																						: md5(mail_object.from
																								+ mail_object.date);

																				var t = {};
																				t.data = mail_object;
																				t.data.content = mail_object.html ? mail_object.html
																						: mail_object.text;
																				t.attachments = mail_object.attachments;
																				delete (t.data.attachments);
																				delete (t.data.text);
																				delete (t.data.html);

																				callback(false, t);
																			});
															});
												});

								});
				});
}

/**
 * support footer and header, here we only support navite url params as: docid:
 * document id dbid: database id formid: form id viewid: view id pageid: page id
 * for example: if we want to print the url :
 * http://localhost:8080/page.html?dbid=5122f1b9e675275e69000000&formid=51385b90caa05a3dcb0000e0
 * as content, and we want to add footer, and then we send params from url
 * params such as
 * footer={dbid:"5122f1b9e675275e69000000",formid:"51383c54caa05a7947000024"}
 * here if footer or header dbid is not defined, we use global dbid; then full
 * url is :
 * http://localhost:8080/page.html?dbid=5122f1b9e675275e69000000&formid=51385b90caa05a3dcb0000e0&footer={dbid:"5122f1b9e675275e69000000",formid:"51383c54caa05a7947000024"}
 */
/**
 * 
 * "--page-height", "297mm", "--page-width", "210mm", "--margin-top", "20",
 * "--margin-bottom", "40", "--footer-html", footer,"--header-html", header, "
 * --redirect-delay", 1000, // delay one second for javascript render
 * url,pdfFileName
 */
// require("../lib/jsrender");
// var footer =
// "http://localhost:8080/page.html?dbid=5122f1b9e675275e69000000&formid=51383c54caa05a7947000024";
// var header =
// "http://localhost:8080/page.html?dbid=5122f1b9e675275e69000000&formid=51385b90caa05a3dcb0000e0";
function pdfDownload(req, res) {
	var q = req.query, dbid = q.dbid, docid = q.docid;
	var pdfFileName = "/tmp/" + docid + ".pdf";

	var fs = require("fs");
	if (fs.existsSync(pdfFileName)) {
		fs.unlinkSync(pdfFileName);
	}

	var spawn = require('child_process').spawn;
	var util = require('util');
	var params = _parsePdfParams(req.headers.host, dbid, pdfFileName, q);
	var pdf = spawn('wkhtmltopdf', params);
	pdf.on('exit', function(code) {
		if (code != 0) {
			util.log('Failed: ' + code);
			res.send(500);
		} else {
			res.download(pdfFileName, function(err) {
				if (err) res.send(500); // internal server error
			});
		}
	});
}

function md5(str) {
	var crypto = require('crypto');
	var md5sum = crypto.createHash('md5');
	md5sum.update(str);
	str = md5sum.digest('hex');
	return str;
};

function _parsePdfParams(host, dbid, pdfFileName, doc) {
	var _genHeaderFooter = function(baseurl, m_dbid, doc) {
		if (typeof (doc) == 'string') doc = eval("(" + doc + ")");
		var ret = baseurl + "&dbid=" + (doc.dbid ? doc.dbid : m_dbid);
		if (doc.docid) ret += "&docid=" + doc.docid;
		if (doc.formid) ret += "&formid=" + doc.formid;
		if (doc.viewid) ret += "&viewid=" + doc.viewid;
		if (doc.pageid) ret += "&pageid =" + doc.pageid;

		return ret;
	};

	var baseurl = "http://" + host + "/page.html?";
	var url = _genHeaderFooter(baseurl, dbid, doc);

	var params = [ "--disable-smart-shrinking", "--ignore-load-errors" ];
	if (doc.header) {
		params.push("--margin-top");
		var header = doc.header;
		if (typeof (header) == 'string') header = eval("(" + doc.header + ")");
		var header_margin = header.margin;
		if (typeof (header_margin) != undefined && parseInt(header_margin) > 0) {
			params.push(header_margin);
		} else {
			params.push("30");
		}
		params.push("--header-html");
		params.push(_genHeaderFooter(baseurl, dbid, doc.header));
	}

	if (doc.footer) {
		params.push("--margin-bottom");
		var footer = doc.footer;
		if (typeof (doc.footer) == 'string') footer = eval("(" + doc.footer + ")");
		var footer_margin = footer.margin;
		if (typeof (footer_margin) != undefined && parseInt(footer_margin) > 0) {
			params.push(footer_margin);
		} else {
			params.push("40");
		}
		params.push("--footer-html");
		params.push(_genHeaderFooter(baseurl, dbid, doc.footer));
	}

	params.push("--redirect-delay");
	params.push("2000"); // delay 2 seconds for javascript render
	params.push(url);
	params.push(pdfFileName);

	console.log(params);

	return params;
}

exports.readMail = readMail;
exports.setProviders = setProviders;
exports.receive = receive;
exports.sendObject = sendObject; // 发送邮件外部接口
exports.pdfDownload = pdfDownload;
exports.sendMail = sendMail;
