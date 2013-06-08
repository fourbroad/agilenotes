var mongo = require("mongodb"),
    providers = require("../providers"),
    BSON = mongo.BSONPure,
    fs = require('fs'),
    Model = require("../lib/model"),
    ACL = require("../lib/acl"),
    Alipay = require("../lib/alipay"),
    MailLib = require("../lib/mail"), // mail module
    MSG = require("../config/global_message").GLOBAL_MSG, // global messages
    Functions = require("../lib/common_functions"); // common functions

ACL.setBson(BSON);

// TODO: add cache for design documents on server side.
function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) { return next(); }

        res.redirect('/login');
}


//  check user login state
function login(req,res){
	
        if ( !req.user && typeof( req.session.passport.user ) === 'undefined' ){
            res.send(MSG.auth.c1502, 200);
        } else {
	        res.send(MSG.auth.c1501, 200);
        }
}


function logout(req,res){
	req.logout();
        res.clearCookie("userID");
        res.clearCookie("userName");
	res.send(MSG.auth.c1504);
}

function cleanFileField(provider, docid, fieldName, values, newValues, callback){
	if(!values || values.length <= 0){
		callback(null, newValues);
		return;
	}
	
	var value = values.shift();
	if(value._tmp){
		if(value._del){
			fs.unlink("/tmp/"+value._id, function(){
				cleanFileField(provider, docid, fieldName, values, newValues, callback);
			});
		}else{
			value.filepath = value.filepath || fieldName;
			value.filepath = value.filepath + "/"+value.filename;
			provider.createAttachment(docid, value.filepath, value.filename, value.contentType, function(error,gridStore){
				gridStore.writeFile("/tmp/"+value._id, function(error, doc){
					if(doc){
						newValues.push(doc);
					}
					fs.unlink("/tmp/"+value._id, function(){
						cleanFileField(provider, docid, fieldName, values, newValues, callback);
					});
				});
			});
		}
	}else{
		if(value._del){
			provider.deleteAttachment(docid, value.metadata.filepath, function(error,result){
				cleanFileField(provider, docid, fieldName, values, newValues, callback);
			});
		}else{
			newValues.push(value);
			cleanFileField(provider, docid, fieldName, values, newValues, callback);
		}
	}
}

function cleanFileFields(provider, docid, doc, fileFields, callback){
	if(fileFields.length <=0 ) {
		callback(null, doc);
		return;
	}
	
	var fileField = fileFields.shift(), values = eval("doc."+fileField);
	cleanFileField(provider, docid, fileField, values, [], function(error, newValues){
		eval("doc."+fileField +"="+JSON.stringify(newValues));
		cleanFileFields(provider, docid, doc, fileFields, callback);
	});
}

function validate(dbid, doc, callback){
	var provider = providers.getProvider(dbid);
	provider.findOne({_id: new BSON.ObjectID(doc.type)},null,null,function(error,meta){
		var formIds = doc.formIds ? doc.formIds : meta.forms&&meta.forms.split(","), sel = {$or:[]};
		for(var f in formIds){ sel.$or.push({_id: new BSON.ObjectID(formIds[f])}); }
		provider.find(sel, null, null,function(error, data){
		    var forms = data.docs, $ = require('jquery'), errors = [], fileFields = [];
		    require("../lib/jquery-metadata")($);
		    require("../lib/jquery-validate")($);
			$.validator.setDefaults({
				showErrors: function(map, list) {
					if(list.length<=0)return;
					$.each(list, function(index, error) {
						errors.push({ name:$(error.element).attr("name"), message:error.message });
					});
				}
			});

			for(var i in forms){
				var f = $("<form/>").append(forms[i].content);
				f.find(".field[type!=button]").each(function(){
					var $this = $(this), field = $this.attr("id"), md = $this.metadata(), 
					    input = $("<input type='text'/>").attr("name",$this.attr("name")).appendTo($this),
					    value = eval("try{doc['"+field+"']}catch(e){}");
					if(value){
						input.attr("value",value);
					}
					if(!$.isEmptyObject(md.validate)){
						input.addClass(JSON.stringify({validate:md.validate}));
					}
					if($this.attr("type") == "file"){
						fileFields.push(field);
					}
				});
				var v  = f.validate($.extend({ meta:"validate"	}, eval("("+(forms[i].validator||"{}")+")")));
				try{
					if(!v.form()) {
						break;
					}
				} catch (e) {
					console.log(e);
					break;
				}
			}
			
			if(errors.length == 0){
				callback(error, doc, fileFields);
			}else{
				callback({result:errors});
			}
		});
	});
}
function rend(req,res){
	var params = req.params, dbid = params.dbid, docid = params.docid, q = req.query, dbn = params.dbn, docn = params.docn,
		selector =q.selector, options = q.options, fields = q.fields, provider =providers.getProvider(Model.ADMIN_DB);
	res.header('Content-Type', 'text/html');
        var dbQuery = {type:Model.DATABASE, name:dbn};
        var docQuery = {name:docn};
	var reg = new  RegExp('[0-9a-f]{24}');
	if(reg.test(dbn)){
        	dbQuery = {type:Model.DATABASE, _id:new BSON.ObjectID(dbn)};
        }	
	if(reg.test(docn)){
        	docQuery = { _id:new BSON.ObjectID(docn)};
        }
		provider.findOne(dbQuery, [], {}, function(err, db){
			if (err || db == null) {
				res.render('page_404', {});
				return;
			}
			provider = providers.getProvider(db._id);
			provider.findOne(docQuery, fields, options, function(err,doc){
		                if (err || doc == null) {
				    res.render('page_404', {});
				    return;
		                }  
			        var data =  new Object();
		                data.db = db;
		                data.doc = doc;
			        var data = JSON.stringify(data, null, 10);
			        data = data.replace(/<\/script>/g, '<\\/script>');
			        res.render('page', {data: data});
			});
			
		});
}

function _parseCookie(cookieStr) {
	 var cookieValue = {};
	 var $ = require("jquery");
     if (cookieStr && cookieStr != '' && typeof(cookieStr) == 'string') {
         var cookies = cookieStr.split(';');
         var tmp = null;
         for (var i = 0; i < cookies.length; i++) {
             var cookie = $.trim(cookies[i]);
             tmp = cookie.split("=");
             cookieValue[tmp[0]] = typeof(tmp[1]) != 'undefined' ? decodeURIComponent(tmp[1]) : '';
         }
     }
     return typeof(cookieStr) == 'string' ? cookieValue : cookieStr;
}

// TODO将exec作为一项独立的操作进行授权和访问控制。
function getDoc(req,res){
	var params = req.params, dbid = params.dbid, docid = params.docid, q = req.query, dbn = params.dbn, docn = params.docn,
	    selector = q.selector, filter = q.filter, options = q.options, fields = q.fields, provider = providers.getProvider(dbid);
        if ( filter && filter != 'undefined') {
		filter = JSON.parse(filter||"{}");
		selector = { $and : [ selector, filter]};
	}
		console.log("selector =====> %j", selector);
	res.header('Content-Type', 'application/json');
	provider[docid ? "findOne" : "find"](selector, fields, options, function(error,data){
		if(options.exec){
			options.query = q;
			delete(options.query.options);
			if (options.query.selector) delete(options.query.selector);
			options.ip = Functions.getClientIP(req);
			options.method = req.method;
			options.headers = req.headers;
			if (typeof(req.headers.cookie) != 'undefined') {
				options.headers.cookie =_parseCookie(options.headers.cookie);
			}
			function process(data, response, callback){
				var doc = data.shift();
				if(doc){
					if(doc.type == Model.TASK){
						providers.getProvider(dbid, doc.type).exec(req.user, doc, options, function(error, result){
							if(error) doc.error = error;
							if(result) doc.result = result;
							response.push(doc);
							process(data, response, callback);
						});
					}else{
						response.push(doc);
						process(data, response, callback);
					}
				}else{
					callback(null, response);
				}
			};

			var response = [];
			process(docid ?[data]:data.docs, response, function(error, response){
				if (!docid) data.docs = response;
				var resp = data ? { error : data.error, result : data.result, success : (data.error ? false : true) ,msg:data.result}
						: null;
				if (options.redirect) {
					res.set('Content-Type', 'text/html');
					res.send(data.error || data.result);
				} else {
					res.send(resp
						|| error
						|| { success : false, result : "document not found or not authorized!",
							msg : "document not found or not authorized!" });
				}
			});
		}else{
			res.send(data || error || {success:false, result :"document not found or not authorized!", msg :"document not found or not authorized!"});
		}
	});
}

//TODO 支持文档批量上传。
function postDoc(req,res){
	var params = req.params, dbid = params.dbid, doc = req.body,  docid = params.docid, q = req.query, options = q.options;
	res.header('Content-Type', 'application/json');
	
	var  process = function(data, response, options, callback) {
		var doc = data.shift();
		if (doc) {
			if (doc.type == Model.TASK) {
				providers.getProvider(dbid, doc.type).exec(req.user, doc, options, function(error, result) {
					if (error) doc.error = error;
					if (result) doc.result = result;
					response.push(doc);
					process(data, response, options, callback);
				});
			} else {
				response.push(doc);
				process(data, response, options, callback);
			}
		} else {
			callback(null, response);
		}
	};
	
	if (typeof(docid) != 'undefined') {
		options = options || {};
		options.query = q;
		if (typeof(options.query.options) != 'undefined') delete(options.query.options);
		options.ip = Functions.getClientIP(req);
		options.method = req.method;
		options.body = req.body;
		options.headers = req.headers;
		if (typeof(req.headers.cookie) != 'undefined') {
			options.headers.cookie =_parseCookie(options.headers.cookie);
		}

		var provider = providers.getProvider(dbid);
		provider.findOne({ _id : new BSON.ObjectID(docid) }, null, null, function(err, data) {
			if (err) {
				res.send({ success : false, result : err }, 200);
			} else {
				var response = [];
				process(docid ? [ data ] : data.docs, response, options, function(error, response) {
					if (!docid) data.docs = response;
					var resp = data ? { error : data.error, result : data.result, success : (data.error ? false : true), msg:data.result}
					: null;
					if (options.body.redirect || options.redirect) {
						res.set('Content-Type', 'text/html');
						res.send(data.error || data.result);
					} else {
							res.send(resp
									|| error
									|| { success : false, result : "document not found or not authorized!",
										msg : "document not found or not authorized!" });
					}
				});
			}
		});
	} else {
		if(doc && doc.type){
			var q = req.query, options = q.options, provider = providers.getProvider(dbid, doc.type);
			if(typeof(doc._id)=="string") doc._id = new BSON.ObjectID(doc._id);
			validate(dbid, doc, function(error, doc, fileFields){
				if(error) {
					res.send({result:error}, 416);
				}else{
					doc._create_at = new Date().toJSON();
					if(doc.type == Model.TASK && doc.taskType == "interval"){
						doc.userId = req.user._id;
					}
					doc._ownerID = req.user._id;
					
					provider.insert(doc, options, function(error,docs){
						if(error) {
							res.send(403);
						} else {
							if(fileFields.length > 0){
								cleanFileFields(provider, docs[0]._id.toString(), docs[0], fileFields, function(error, doc){
									var clone = JSON.parse(JSON.stringify(doc)), selector = {_id: doc._id};
									delete clone._id;
									provider.update(selector, {$set:clone}, null, function(error,result){
										if(error) {
											res.send(403);
										} else {
											res.send(docs[0], 201);
										}
									});
								});
							}else{
								// execute one or more task
								if (options.task) {
									var respArr = [];
									for (var i = 0; i < options.task.length; i++) {
										provider.findOne({_id:new BSON.ObjectID(options.task[i].id)}, [], {}, function(err, data) {
											var response = [];
											var opts = {query:q, headers:req.headers, method:req.method,body:options.task[i].args};
											if (typeof(req.headers.cookie) != 'undefined') {
												opts.headers.cookie =_parseCookie(opts.headers.cookie);
											}
											process([ data ] , response, opts, function(error, response) {
												data.success = data.error ? false : true;
												respArr.push(data
													|| error
													|| { success : false, result : "document not found or not authorized!",
														msg : "document not found or not authorized!" });
											});
										});
									}	
									
									var t = setInterval(function() {
										if (respArr.length >= options.task.length) {
											docs[0].result = respArr;
											clearInterval(t);
											res.send(docs[0], 201);
										};
									}, 50);
								} else {
									res.send(docs[0], 201);
								}
							}
						}
					});
				}
			});
		}else{
			res.send("{'error': 'document is invalid!'}",201);
		}
	}
}

// TODO bug fix: return empty array when accessing no authrized resource.
function putDoc(req,res){
	var params = req.params, dbid = params.dbid, docid = params.docid;
	res.header('Content-Type', 'application/json');
	var  process = function(data, response, options, callback) {
		var doc = data.shift();
		if (doc) {
			if (doc.type == Model.TASK) {
				providers.getProvider(dbid, doc.type).exec(req.user, doc, options, function(error, result) {
					if (error) doc.error = error;
					if (result) doc.result = result;
					response.push(doc);
					process(data, response, options, callback);
				});
			} else {
				response.push(doc);
				process(data, response, options, callback);
			}
		} else {
			callback(null, response);
		}
	};
	if(docid){
		var q = req.query, options = q.options, selector = q.selector,doc = req.body, 
		    provider = providers.getProvider(dbid, doc.type);
		validate(dbid, doc, function(error, doc, fileFields){
			if(error) {
				res.send({result:errors}, 416);
			}else{
				delete doc._id;
				if(doc.type == Model.TASK && doc.taskType == "interval"){
					doc.userId = req.user._id;
				}
				doc._update_at = new Date().toJSON();
				function update(selector, fields){
					options.multi = true;
					provider.update(selector, {$set:fields}, options, function(error,result){
						if(error) {
							res.send(403);
						} else {
							doc._id = docid;
							if (options.task) {
								var respArr = [];
								for (var i = 0; i < options.task.length; i++) {
									var response = [];
									var opts = {query:q, headers:req.headers, method:req.method,body:options.task[i].args};
									if (typeof(req.headers.cookie) != 'undefined') {
										opts.headers.cookie =_parseCookie(opts.headers.cookie);
									}
									provider.findOne({_id:new BSON.ObjectID(options.task[i].id)}, [], {}, function(err, data) {
										process([ data ] , response, opts, function(error, response) {
											data.success = data.error ? false : true;
											respArr.push(data
												|| error
												|| { success : false, result : "document not found or not authorized!",
													msg : "document not found or not authorized!" });
										});
									});
								}	
								
								var t = setInterval(function() {
									if (respArr.length >= options.task.length) {
										doc.result = respArr;
										clearInterval(t);
										res.send(doc, result ? 200 : 403);
									};
								}, 50);
							} else {
								res.send(doc, result ? 200 : 403);
							}
						}
					});
				}

				if(fileFields.length > 0){
					cleanFileFields(provider, docid, doc, fileFields, function(error, doc){
						update(selector, doc);
					});
				}else{
					update(selector, doc);
				}
			}
		});
	}else{
		res.send(404);
	}
}

function delDoc(req,res){
	var params = req.params, dbid = params.dbid, q = req.query, options = q.options, selector = q.selector;
	res.header('Content-Type', 'application/json');
	providers.getProvider(dbid).update(selector, {$set:{_deleted: true}}, options, function(error,result){
		if(result) {
			res.send({result:"OK"}, 200);
		} else {
			res.send(403);
		}
	});
}

function getAttachment(req,res){
	var params = req.params, dbid = params.dbid, docid = params.docid, filepath = params[1],
	    q = req.query,options = q.options, provider = providers.getProvider(dbid);
	var iconv = require('iconv-lite');
	if(filepath && (filepath != "")){
		provider.findAttachmentByPath(docid, filepath, function(error,gridStore){
			if(gridStore && gridStore.stream){
				// Create a stream to the file
				var stream = gridStore.stream(true);
				res.setHeader("Content-Type", gridStore.contentType);
				res.setHeader("Content-length", gridStore.length);
				var baseName = gridStore.metadata.filename ? gridStore.metadata.filename : gridStore.metadata.filepath;
				var names = baseName.split("/");
				var str = iconv.decode(names[names.length - 1], 'iso-8859-1'); //return unicode string from iso-8859-1 encoded bytes
				var buf = iconv.encode(str, 'utf-8');//return utf-8 encoded bytes from unicode string
				var userAgent = req.headers['user-agent'].toLowerCase();
				if (userAgent.indexOf("msie") != -1) {
					buf = encodeURI(names[names.length - 1]);
				}
				res.header("Content-Disposition", "attachment; filename=" + buf);

				// Register events
				stream.on("data", function(chunk) { res.write(chunk); });
				stream.on("end", function() { res.end(); });
				stream.on("close", function() { });
			}else{
				res.send(403);
			}
		});
	}else{
		var selector = q.selector;
		provider.findAttachment(docid, selector, options, function(error,result){
			res.send(result||403);
		});
	}
}

function postAttachment(req,res){
	var params = req.params, dbid = params.dbid, docid = params.docid, 
	    path = params[1] ? params[1] +"/":"", attachment = req.files.attachment;
	if(attachment){
		providers.getProvider(dbid).createAttachment(docid, path+attachment.filename, attachment.mime, function(error,gridStore){
			gridStore.writeFile(attachment.path, function(err, doc){
				res.send(doc||403);
			});
		});
	}else{
		res.send(403);
	}
}

function delAttachment(req,res){
	var params = req.params, dbid = params.dbid, docid = params.docid; filename = params[1];
	if(docid && filename){
		providers.getProvider(dbid).deleteAttachment(docid, filename, function(error,result){
			res.send(result||403);
		});
	}else{
		res.send(403);
	}
}

function getTempFile(req,res){
	res.download("/tmp/"+req.params.file, function(err){
		if(err) res.send(500);  //internal server error
	});
}

function postTempFile(req,res){
	var file = req.files.file;
    res.json({_id:file.path.split("/")[2], filename: file.name, contentType:file.mime, length:file.size});
}

function acl(req,res,next){
	var params = req.params, dbid = params.dbid, user = req.user, q = req.query, 
	    doc = req.body, docid = params.docid, dbn = params.dbn, docn = params.docn,	provider = providers.getProvider(Model.ADMIN_DB);
	var reg = new  RegExp('[0-9a-f]{24}');
	if(reg.test(dbn)||dbid){
                dbid = dbn ? dbn : dbid;
		provider = providers.getProvider(dbid);
		process();
       } else {
		dbQuery = {type:Model.DATABASE, name:dbn};
		provider.findOne(dbQuery, [], {}, function(err, db){
			if (err || db == null) {
				res.render('page_404', {});
				return;
			}
			provider = providers.getProvider(db._id);
			process ();
		});
	}
	function process (){
		q.selector = JSON.parse(q.selector||"{}");
		q.options = JSON.parse(q.options||"{}");
		if(docid) q.selector["_id"] = docid;
	
		ACL.acl(user, provider, req.method.toLowerCase(), q.selector, doc&&doc.type || doc && docid, function(error, selector){
			if(error){
				res.json({error:"Not Authorized!"});
			}else{
				q.selector = selector;
				return next();
			}
		});
	}
}

module.exports = function(agilenotes){
	providers.init(agilenotes);
	providers.openAdminDb(function(error, db){
		if(db){
			var ous = {}, groups = {};
			
			ouAuthz = agilenotes.get("ou_authz");
			groupAuthz = agilenotes.get("group_authz");
			roleAuthz = agilenotes.get("role_authz");

			var provider = providers.getProvider(Model.ADMIN_DB);
			provider.find({type:Model.OU}, null, null, function(error,data){
				var docs = data.docs;
				for(var i in docs){
					ous[i] = docs[i];
				}
			});

			provider.find({type:Model.GROUP}, null, null, function(error,data){
				var docs = data.docs;
				for(var i in docs){
					groups[i] = docs[i];
				}
			});
			
			ACL.init(ous, groups, ouAuthz, groupAuthz,roleAuthz);
			agilenotes.set("acl", ACL);

			provider.find({type:Model.DATABASE, _deleted:{$exists:false}},null,null,function(error,data){
				if(data){
					var dbDocs = data.docs;
					for(var i = 0; i < dbDocs.length; i++){
						providers.getProvider(dbDocs[i]._id.toString(), Model.DATABASE).execIntervalTask(function(error, result){
							error&&console.log(error);
							result && console.log(result);
						});
					}
				}else{
					console.log(error);
				}
			});

			var passport = agilenotes.get("passport");

			agilenotes.get('/', function(req, res){res.redirect('/page.html?dbid='+Model.ADMIN_DB);});
			agilenotes.get('/admin',function(req,res){res.redirect('/workbench.html?dbid='+Model.ADMIN_DB);});

			agilenotes.post('/login', function(req, res, next) { passport.authenticate('local',function (err, user, message){
						if (message){
							res.send( MSG.auth.c1503, 200);
						} else {
							 req.logIn(user, function(err) {
							      if (err) {  res.send({success : false ,code : 500, msg: err});}
								res.setHeader("Set-Cookie", ["userID="+ user._id, "userName=" + user.username ]);
								if (user.isFirstLogin == 1) {
									MSG.auth.c1501.isFirstLogin = 1;
									provider.update({_id:user._id},{"$set": {"isFirstLogin" : 0}}, {}, function(error, ret){});
								} else {
									MSG.auth.c1501.isFirstLogin = 0;
								}
								res.send(MSG.auth.c1501, 200);
	
							});
						}
					})(req, res, next);});

			agilenotes.get('/logout', logout);
			agilenotes.get('/login', login);
			

			agilenotes.get('/dbs/:dbid/:docid?', acl, getDoc);
			agilenotes.post('/dbs/:dbid/:docid?', acl, postDoc);
			agilenotes.put('/dbs/:dbid/:docid?', acl, putDoc);
			agilenotes.del('/dbs/:dbid/:docid?', acl, delDoc);

			// TODO add acl for attachments.
			agilenotes.get('/dbs/:dbid/:docid/attachments(\/?|\/*)', getAttachment);
			agilenotes.post('/dbs/:dbid/:docid/attachments(\/?|\/*)', postAttachment);
			agilenotes.del('/dbs/:dbid/:docid/attachments(\/?|\/*)', delAttachment);

			agilenotes.get('/tmp/:file', getTempFile);
			agilenotes.post('/tmp', postTempFile);

			MailLib.setProviders(providers);
			agilenotes.get('/pdfs', MailLib.pdfDownload);

			agilenotes.set('providers', providers);
                        
			
			// agilenotes.get('/mailtest', getMailTest);
			agilenotes.get("/dbs/:dbid/:docid/readmail(\/?|\/*)", acl, MailLib.readMail);
			agilenotes.post("/dbs/:dbid/:docid/sendmail(\/?|\/*)", MailLib.sendObject);
			
			// sms module
			agilenotes.post("/sms", Functions.sendSms);

		}
	});
};
