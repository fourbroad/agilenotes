var MailParser = require("mailparser").MailParser;
var fs = require("fs");
var mongo = require("mongodb"), BSON = mongo.BSONPure;

var providers = null;

var g_server_host = "hwdev.ins24.com";

function setProviders(pro) {
	providers = pro;
}

function _getPageData(q, callback) {
	var dbid = q.dbid, docid = q.docid, formid = q.formid, viewid = q.viewid, pageid = q.pageid;
	var url = "http://" + g_server_host + "/page.html?dbid=" + dbid;
	if (docid) url += "&docid=" + docid;
	if (formid) url += "&formid=" + formid;
	if (viewid) url += "&viewid=" + viewid;
	if (pageid) url += "&pageid=" + pageid;
	var spawn = require('child_process').spawn;
	var fileName = "/tmp/" + docid;
	var data = spawn('wget', [ url, "-O", fileName ]); // "--javascript-delay","1000",
	data.on('exit', function(code) {
		if (code != 0) {
			callback(err, "");
		} else {
			var fs = require("fs");
			fs.readFile(fileName, "UTF-8", function(err, data) {
				fs.unlink(fileName);
				callback(err, data);
			});
		}
	});
}

function _genMessage(provider, opts, callback) {
	if (!opts.from) {
		callback("sender user is null!", {});
	} else if (!opts.cc) {
		callback("cc is null!", null);
	} else if (!opts.subject) {
		callback("subject is null !", null);
	} else {
		var message = { from : opts.from, to : opts.cc, bcc : opts.bcc, subject : opts.subject, //
		headers : { 'X-Laziness-level' : 1000 },

		html : opts.content, };
		message.attachments = [];
		_genAttachMents(provider, opts.attachments, message.attachments, function(err, data) {
			if (!err) {
				message.mailbox = "SENDBOX"; // defaul is SENDBOX
				callback(false, message);
			}
		});
	}
}

function sendObject(req, res) {
	var postdata = req.body;
	postdata.cc = "lichengzhang@ins24.com";
	postdata.subject = "test00001";
	var provider = providers.getProvider(postdata.dbid);

	_getPageData(postdata, function(err, result) {
		if (err) {
			res.send(500);
		} else {
			_genMessage(provider, postdata, function(err, data) {
				if (err) {
					res.send({ result : err }, 200);
				} else {
					sendMail(postdata, data, function(err, data) {
						res.send(data || err || { result : "no authorized" }, 200);
					});
				}
			});
		}
	});
}

function sendMail(config, message, callback) {
	var nodemailer = require('nodemailer');

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

// is a array
function _genAttachMents(provider, obj, attachments, callback) {
	if (obj) {
		var file = null;
		for ( var i = (obj.length - 1); i >= 0; i--) {
			file = obj[i];
			provider['findAttachmentByPath'](file.metadata.ownerId, file.metadata.filepath, function(err, data) {
				attachments
						.push({ fileName : data.filename, contents : data.currentChunk.data.buffer, cid : file._id });

				callback(obj.length == 1 ? false : true, attachments);
				obj.pop();
				_genAttachMents(provider, obj, attachments, callback);
			});
			// console.log(file);
		}
	}
}

function getMailTest(req, res) {
	/**
	 * service - an optional well known service identifier ("Gmail", "Hotmail"
	 * etc., see Well known Services for a list of supported services) to
	 * auto-configure host, port and secure connection settings host - hostname
	 * of the SMTP server (defaults to "localhost", not needed with service)
	 * port - port of the SMTP server (defaults to 25, not needed with service)
	 * secureConnection - use SSL (default is false, not needed with service).
	 * If you're using port 587 then keep secureConnection false, since the
	 * connection is started in insecure plain text mode and only later upgraded
	 * with STARTTLS name - the name of the client server (defaults to machine
	 * name) auth - authentication object as {user:"...", pass:"..."} or
	 * {XOAuth2: {xoauth2_options}} or {XOAuthToken: "base64data"} ignoreTLS -
	 * ignore server support for STARTTLS (defaults to false) debug - output
	 * client and server messages to console maxConnections - how many
	 * connections to keep in the pool (defaults to 5)
	 */

	/**
	 * if options.save is defined, we will store mail content in our database,
	 * otherwise only send mail
	 */
	var params = req.params, dbid = params.dbid, q = req.query, selector =
	/*
	 * { category:"mail_send_config", sender:q.sender }
	 */
	q.selector, options = q.options, fields = q.fields, provider = providers.getProvider(dbid);
	// mailbox type , here only accept SENDBOX or DRAF, if not these, forces
	// SENDBOX, please attention
	var mailbox = q.mailbox ? q.mailbox : "SENDBOX";
	if (mailbox != "SENDBOX" && mailbox != "DRAF") mailbox = "SENDBOX";

	res.header('Content-Type', 'application/json');
	provider["findOne"](selector, fields, options, function(error, data) {
		if (options && options.exec) {
			function process(data, response, callback) {
				var doc = data.shift();
				if (doc) {
					if (doc.type == Model.TASK) {
						providers.getProvider(dbid, doc.type).exec(req.user, doc, options, function(error, result) {
							if (error) doc.error = error;
							if (result) doc.result = result;
							response.push(doc);
							process(data, response, callback);
						});
					} else {
						response.push(doc);
						process(data, response, callback);
					}
				} else {
					callback(null, response);
				}
			}

			var response = [];
			process(response, function(error, response) {
				res.send(data || error);
			});
		} else {
			_genMessage(provider, req.body, function(err, data) {
				if (err) {
					res.send({ result : err }, 200);
				} else {
					sendMail(req.body, data, function(err) {
						if (err) {
							res.send({ result : err.message }, 200);
						} else {
							res.send({ result : "OK" }, 200);
						}
					});
				}
			});
		}
	});
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

function readMailTest(req, res) {
	res.send({ result : BSON.ObjectID() }, 200);
	return;
	var params = req.params, dbid = params.dbid, q = req.query;
	var selector = { category : "mail_recv_config", user : q.user }, options = q.options;
	var fields = q.fields, provider = providers.getProvider(dbid);

	res.header('Content-Type', 'application/json');

	provider["findOne"](selector, fields, options, function(err, data) {
		if (err) {
			res.send({ result : "false" }, 200);
		} else if (data) {
			data.dbid = dbid;
			data.type_id = params.docid;
			receive(data, data.server_type, function(err, retdata) {
				if (err) {
					res.send({ result : "false" }, 200);
				} else {
					// 获取邮件数量
					provider["count"](selector, function(error, count) {
						retdata.count = count || 0;
					});

					provider["findOne"]({ category : "mail_recv_content", user : q.user,
						"message-id" : data["message-id"] }, fields, options, function(err, tmpdat) {
						if (!tmpdat) {
							retdata.data.attachments = []; // 附件信息
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
															+ data.fileName, data.fileName, data.contentType, function(
															err, gridStore) {
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
											category : "mail_recv_content" }, { "attachments" : attachments }, {},
												function(err, data) {
													console.log(err);
													console.log(data);
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
	return server_type == "imap" ? imapReceive(doc, callback) : pop3Receive(doc, callback);
}

function formatDate(date) {
	var d = new Date(date);
	return (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear() + " " + d.getHours() + ":" + d.getMinutes();
}

function pop3Receive(doc, callback) {
	try {
		console.log(doc);
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

		client.on("retr",
				function(status, msgnumber, data, rawdata) {
					if (status === true) {
						console.log("RETR success " + msgnumber);
						currentmsg += 1;
						var mailparser = new MailParser({ debug : false, streamAttachments : false,
							defaultCharset : "UTF-8" });

						mailparser.on("end", function(mail_object) {
							console.log(mail_object);
							mail_object.category = "mail_recv_content";
							mail_object.user = doc.user;
							var i = 0, from_data = '', to_data = '';
							for (i = 0; i < mail_object.from.length; i++) {
								from_data += mail_object.from[i].name ? mail_object.from[i].name + "<"
										+ mail_object.from[i].address + ">" : mail_object.from[i].address;
								from_data += ",";
							}

							for (i = 0; i < mail_object.to.length; i++) {
								to_data += mail_object.to[i].name ? mail_object.to[i].name + "<"
										+ mail_object.to[i].address + ">" : mail_object.to[i].address;
								to_data += ",";
							}

							mail_object.from_data = from_data;
							mail_object.to_data = to_data;
							mail_object.date = formatDate(mail_object.headers.date);
							mail_object["message-id"] = mail_object.headers["message-id"];
							mail_object.type = doc.type_id;

							var t = {};
							t.data = mail_object;
							t.data.html = mail_object.html ? mail_object.html : mail_object.text;
							t.attachments = mail_object.attachments;
							delete (t.data.attachments);
							delete (t.data.text);

							callback(false, t);
							client.retr(currentmsg);
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

	client.on("connect", function() {
		client.openMailbox("INBOX", function(error, info) {
			if (error) { return callback(error, info); }

			// client.listMessages(-1, doc.receive_limit,function(err, messages)
			client.listMessages(doc.count, doc.receive_limit, function(err, messages) {
				messages.forEach(function(message) {
					var messageStream = client.createMessageStream(message.UID);

					var mailparser = new MailParser({ debug : false, streamAttachments : false,
						defaultCharset : "UTF-8" });

					messageStream.pipe(mailparser, { write : function(data) {
						// console.log(data);
					}, end : true });

					mailparser.on("end", function(mail_object) {
						if (!mail_object.from) { return callback("mail content empty!", {}); }

						mail_object.category = "mail_recv_content";
						mail_object.user = doc.user;
						var i = 0, from_data = '', to_data = '';
						for (i = 0; i < mail_object.from.length; i++) {
							from_data += mail_object.from[i].name ? mail_object.from[i].name + "<"
									+ mail_object.from[i].address + ">" : mail_object.from[i].address;
							from_data += ",";
						}

						for (i = 0; i < mail_object.to.length; i++) {
							to_data += mail_object.to[i].name ? mail_object.to[i].name + "<"
									+ mail_object.to[i].address + ">" : mail_object.to[i].address;
							to_data += ",";
						}

						mail_object.from_data = from_data;
						mail_object.to_data = to_data;
						mail_object.date = formatDate(mail_object.headers.date);
						mail_object["message-id"] = mail_object.headers["message-id"];
						mail_object.type = doc.type_id;

						var t = {};
						t.data = mail_object;
						t.data.html = mail_object.html ? mail_object.html : mail_object.text;
						t.attachments = mail_object.attachments;
						delete (t.data.attachments);
						delete (t.data.text);

						console.log(mail_object);

						callback(false, t);
					});
				});
			});

		});
	});
}

function mailPolicy(provider, selector, fields, options, callback) {
	var fs = require('fs');
	var buffer = null;
	var defaultValues = null;
	var _getSendTo = function(doc) {
		var ret = "";
		if (typeof(doc.phMail) != 'undefined') {
			ret += doc.phMail + ',';
		}
		
		if (typeof(doc.hwMail) != 'undefined') {
			ret += doc.hwMail + ',';
		}
		
		if (typeof(doc.personalMail) != 'undefined') {
			ret += doc.personalMail;
		}
		
		return ret;
	};
	provider.find(selector, {}, options, function(err, data) {
		if (data && data.total > 0) {
			var i = 0;
			var doc = {};
			for (; i < data.docs.length; i++) {
				doc = data.docs[i];
				provider.findOne({ _id : new BSON.ObjectID(doc.type) }, {}, {}, function(err, data) {
					if (data) {
						defaultValues = eval("(" + data.defaultValues + ")");
						var printTemplate = defaultValues.printTemplate;
						printTemplate.docid = doc._id;
						savePdf(provider.db.databaseName, printTemplate, function(err, pdfFileName) {
							if (err == 0) {
								buffer = fs.readFileSync(pdfFileName);
								getDoc(provider, printTemplate.contentid,
										function(htmlData) {
											doc.username = doc.phName;
											doc.issuedDate = doc.dateIssue;
											// console.log(doc);
											doc.g_server_url = g_server_host;
											var message = {
												from : fields.sender + "<" + fields.user + ">",
												to : _getSendTo(doc),
												subject : printTemplate.subject ? replace(printTemplate.subject, doc)
														: "美亚电子保单", //
												headers : { 'X-Laziness-level' : 1000 },
												html : replace(htmlData, doc),
												attachments : [ { fileName : doc._id + ".pdf", contents : buffer,
													cid : doc._id } ] };

											var nodemailer = require('nodemailer');
											// Create a SMTP transport object
											var transport = nodemailer.createTransport("SMTP", { host : fields.host,
												port : fields.port,
												auth : { user : fields.user, pass : fields.password } });

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
										});
							}
						});
					}
				});
			}
		} else {
			callback(err, data);
		}
	});
}

function getDoc(provider, docid, callback) {
	if (docid) {
		provider.findOne({ _id : new BSON.ObjectID(docid) }, {}, {}, function(err, data) {
			callback(data ? data.content : "");
		});
	} else {
		callback("");
	}
}

/**
 * 
 * @param dbid
 * @param doc { //
 *            _id:"", //dbid:"", formid:"51402428ac8f270210000094", //viewid:"",
 *            //pageid:"", footer:{ //dbid:"",
 *            formid:"514024caac8f270210000125", //viewid:"", //pageid:"", },
 *            header:{ //dbid:"", formid:"514024fbac8f270210000192",
 *            //viewid:"", //pageid:"", } }
 * @param callback
 */
function savePdf(dbid, doc, callback) {
	var pdfFileName = "/tmp/" + doc.docid + ".pdf";
	var fs = require("fs");
	if (fs.existsSync(pdfFileName)) {
		fs.unlinkSync(pdfFileName);
	}
	
	var params = _parsePdfParams(dbid, pdfFileName, doc);
	var spawn = require('child_process').spawn;
	var pdf = spawn('wkhtmltopdf', params);
	pdf.on('exit', function(code) {
		callback(code, pdfFileName);
	});
};

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
	var params = _parsePdfParams(dbid, pdfFileName, q);
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

function replace(txt, data) {
	for ( var i in data) {
		if (txt.indexOf('{{' + i + '}}') > 0) {
			txt = txt.replace(new RegExp("{{" + i + "}}", "gm"), data[i]);
		}
	}

	return txt;
}

// forgot password request
function getPwdReq(req, res) {
	var params = req.params, provider = providers.getProvider("000000000000000000000000");
	var q = req.query, configid = q.configid, dbid = q.dbid;
	if (params.username && params.email) {
		provider.findOne({ username : params.username, type: "000000000000000000000006" }, {}, {}, function(err, data) {
			if (data) {
				if (data.hwMail && data.hwMail == params.email) {
					_getDefaultConfig(dbid, configid, function(err, config) {
						if (err) {
							res.send({ success : false, msg : err }, 200);
						} else {
							var time = new Date().getTime();
							var insert_arr = { category : "reset_password_req",
								expire : new Date().setTime(time + 3 * 86400 * 1000), username : params.username,
								email : params.email, sign : md5(params.username + "_" + params.email) ,
								type: data._id};
							provider.insert(insert_arr, {}, function(err, result) {
								if (err) {
									res.send({ success : false, msg : err });
								} else {
									// 51554346ac8f275f140002ae mail type
									provider = providers.getProvider(dbid);
									provider.findOne({type:"51554346ac8f275f140002ae"}, {}, {}, function (err, mailData) {
										var date = new Date();
										var doc = data;
										doc.year = date.getFullYear();
										doc.month = date.getMonth() < 9 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1);
										doc.day = date.getDate();
										doc.url = _getResetPasswordLink(q, result[0]._id, insert_arr.sign);
										var message = { from : config.sender + "<" + config.user + ">", to : data.hwMail,
												subject : mailData ? mailData.subject : "重置密码",
												html : mailData ? replace(mailData.content, doc) :
													_getResetPasswordLink(q, result[0]._id, insert_arr.sign) };
											sendMail(config, message, function(err, ret) {
												if (err) {
													res.send({ success : false, msg : err });
												} else {
													res.send({ success : true,
														msg : "重置密码邮件已发送到您的邮箱，请注意查收!" },
															200);
												}
											});
									});
								}
							});
						}
					});
				} else {
					res.send({ success : false, msg : "用户名或者邮箱不匹配!" }, 200);
				}
			} else {
				res.send({ success : false, msg : "用户名或者邮箱不匹配!" }, 200);
			}
		});
	} else {
		res.send({ success : false, msg : "用户名或者邮箱不匹配!" }, 200);
	}
}

// get mailconfig from configid or default smtp config
function _getDefaultConfig(dbid, configid, callback) {
	if (dbid && configid) {
		var provider = providers.getProvider(dbid);
		provider.findOne({ _id : new BSON.ObjectID(configid) }, {}, {}, function(err, data) {
			callback(err, data);
		});
	} else {
		var data = require("../config/waats").WaatsConfig;
		callback(false, data);
	}
}

function _getResetPasswordLink(q, docid, sign) {
	var process = function(q, docid, sign) {
		var ret =  "http://" + g_server_host + "/page.html?dbid=" + q.dbid + "&formid=";
		ret += q.formid + "&_id=" + docid + "&sign=" + sign;
		
		return ret;
	};
	var ret = "<a href=" + process(q, docid, sign) + " target='_blank'>" + process(q, docid, sign) + "</a>";
	return ret;
}

function md5(str) {
	var crypto = require('crypto');
	var md5sum = crypto.createHash('md5');
	md5sum.update(str);
	str = md5sum.digest('hex');
	return str;
};

// reset password
/**
 * method:POST URL:/resetPwd?forgot=1
 * params：{oldpwd:"oldpwd",newpwd:"newpwd",renewpwd:"renewpwd"} data type：JSON
 * return：success－＞{success:true, msg:"OK"}；fail－＞{success:false, msg:"reason"}
 */
function resetPwd(req, res) {
	var q = req.query;
	var provider = providers.getProvider("000000000000000000000000");

	if (q.docid && q.sign) {
		provider.findOne({ _id : new BSON.ObjectID(q.docid) }, {}, {}, function(err, data) {
			if (err) {
				res.send({ success : false, msg : err }, 200);
			} else if (typeof(data) != 'undefined' && data){
				var time = data.expire;
				if (time < (new Date().getTime())) {
					res.send({ success : false, msg : "已过期!" }, 200);
					return false;
				}

				var md5_sign = md5(data.username + "_" + data.email);
				if (md5_sign == data.sign) {
					try {
						var params = req.body;
						if (params && params.newpwd != undefined && params.newpwd == params.renewpwd) {
							var update_arr = {"$set":{password:md5(params.renewpwd)}};
							provider.update({ _id : data.type }, update_arr, {}, function(err, result) {
								if (err) {
									res.send({ success : false, msg : err }, 200);
								} else {
									res.send({ success : true, msg : "OK" }, 200);
								}
								
								provider.update({_id : data._id}, {"$set":{expire:0}}, {}, function(uerr, udata){});
							});
						} else {
							res.send({ success : false, msg : "参数错误!" }, 200);
						}
					} catch (e) {
						res.send({ success : false, msg : e.message }, 200);
					}
					// res.send({ result : true, msg : "OK" }, 200);
				} else {
					res.send({ success : false, msg : "签名错误!" }, 200);
				}
			} else {
				res.send({ success : false, msg : "已过期!" }, 200);
				return false;
			}
		});
	} else if (q.forgot) {
		try {
			// var params = eval("(" + req.body + ")");
			var params = req.body;
			if (params.oldpwd && params.newpwd && params.renewpwd) {
				var user = req.session.passport.user;
				if (!user || user == undefined) {
					res.send({ success : false, msg : "please login!" }, 200);
				} else {
					provider.findOne({ username : user, type: "000000000000000000000006" }, {}, {}, function(err, data) {
						if (err) {
							res.send({ success : false, msg : err }, 200);
						} else {
							if (data.password == md5(params.oldpwd) && params.newpwd == params.renewpwd) {
								provider.update({ _id : data._id }, {"$set":{ password : md5(params.newpwd) }}, {},
										function(err, data) {
											if (err) {
												res.send({ success : false, msg : err }, 200);
											} else {
												res.send({ success : true, msg : "OK" }, 200);
											}
										});
							} else {
								res.send({ success : false, msg : "原密码错误或者新密码两次输入不匹配!" }, 200);
							}
						}
					});
				}
			}
		} catch (e) {
			res.send({ success : false, msg : e.message }, 200);
		}
	} else {
		res.send({ success : false, msg : "参数错误!" }, 200);
	}
}

function _parsePdfParams(dbid, pdfFileName, doc) {
	var _genHeaderFooter = function(baseurl, m_dbid, doc) {
		if (typeof (doc) == 'string') doc = eval("(" + doc + ")");
		var ret = baseurl + "&dbid=" + (doc.dbid ? doc.dbid : m_dbid);
		if (doc.docid) ret += "&docid=" + doc.docid;
		if (doc.formid) ret += "&formid=" + doc.formid;
		if (doc.viewid) ret += "&viewid=" + doc.viewid;
		if (doc.pageid) ret += "&pageid =" + doc.pageid;

		return ret;
	};

	var baseurl = "http://" + g_server_host + "/page.html?";
	var url = _genHeaderFooter(baseurl, dbid, doc);

	var params = ["--disable-smart-shrinking", "--ignore-load-errors"];
	if (doc.header) {
		params.push("--margin-top");
		var header = doc.header;
		if (typeof(header) == 'string') header = eval("(" + doc.header + ")");
		var header_margin = header.margin;
		if (typeof(header_margin) != undefined && parseInt(header_margin) > 0) {
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
		if (typeof(doc.footer) == 'string') footer = eval("(" + doc.footer + ")");
		var footer_margin = footer.margin;
		if (typeof(footer_margin) != undefined && parseInt(footer_margin) > 0) {
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

exports.readMailTest = readMailTest;
exports.getMailTest = getMailTest;
exports.setProviders = setProviders;
exports.receive = receive;
exports.sendObject = sendObject; // 发送类似于view, page, document_type的数据
exports.mailPolicy = mailPolicy;
exports.getPwdReq = getPwdReq;
exports.resetPwd = resetPwd;
exports.pdfDownload = pdfDownload;
