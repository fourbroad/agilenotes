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
		var formIds = meta.forms&&meta.forms.split(","), sel = {$or:[]};
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
					    value = eval("try{doc."+field+"}catch(e){}");
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
// TODO将exec作为一项独立的操作进行授权和访问控制。
function getDoc(req,res){
	var params = req.params, dbid = params.dbid, docid = params.docid, q = req.query, dbn = params.dbn, docn = params.docn,
	    selector = q.selector, options = q.options, fields = q.fields, provider = providers.getProvider(dbid);
	res.header('Content-Type', 'application/json');
	provider[docid ? "findOne" : "find"](selector, fields, options, function(error,data){
		if(options.exec){
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
				if(!docid) data.docs = response;
				res.send(data || error || {success:false, result :"document not found or not authorized!", msg :"document not found or not authorized!"});
			});
		}else{
			res.send(data || error || {success:false, result :"document not found or not authorized!", msg :"document not found or not authorized!"});
		}
	});
}

//TODO 支持文档批量上传。
function postDoc(req,res){
	var params = req.params, dbid = params.dbid, doc = req.body;
	res.header('Content-Type', 'application/json');
	if(doc && doc.type){
		var q = req.query, options = q.options, provider = providers.getProvider(dbid, doc.type);
		if(typeof(doc._id)=="string") doc._id = new BSON.ObjectID(doc._id);
		validate(dbid, doc, function(error, doc, fileFields){
			if(error) {
				res.send({result:error}, 416);
			}else{
				doc._create_at = new Date();
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
							res.send(docs[0], 201);
						}
					}
				});
			}
		});
	}else{
		res.send("{'error': 'document is invalid!'}",201);
	}
}

// TODO bug fix: return empty array when accessing no authrized resource.
function putDoc(req,res){
	var params = req.params, dbid = params.dbid, docid = params.docid;
	res.header('Content-Type', 'application/json');
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
				function update(selector, fields){
					options.multi = true;
					provider.update(selector, {$set:fields}, options, function(error,result){
						if(error) {
							res.send(403);
						} else {
							doc._id = docid;
							res.send(doc, result ? 200 : 403);
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
	if(filepath && (filepath != "")){
		provider.findAttachmentByPath(docid, filepath, function(error,gridStore){
			if(gridStore && gridStore.stream){
				// Create a stream to the file
				var stream = gridStore.stream(true);
				res.setHeader("Content-Type", gridStore.contentType);
				res.setHeader("Content-length", gridStore.length);
				var baseName = gridStore.metadata.filename ? gridStore.metadata.filename : gridStore.metadata.filepath;
				var names = baseName.split("/");
				res.header("Content-Disposition", "attachment; filename=" + names[names.length - 1]);

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
	
		ACL.acl(user, provider, req.method.toLowerCase(), q.selector, doc&&doc.type, function(error, selector){
			if(error){
				res.json({error:"Not Authorized!"});
			}else{
				q.selector = selector;
				return next();
			}
		});
	}
}

function waatsRequest(req, res) {
	var params = req.params, dbid = params.dbid, docid = params.docid, q = req.query,
	/* selector = q.selector, */options = q.options, fields = q.fields, provider = providers.getProvider(dbid);

	res.header('Content-Type', 'application/json');
	var process = function(provider, configid, callback) {
		if (configid) {
			provider.findOne({ _id : new BSON.ObjectID(configid) }, {}, {}, function(err, data) {
				callback(err, data);
			});
		} else {
			callback(false, require("../config/waats").WaatsConfig);
		}
	};

	provider.findOne({ _id : new BSON.ObjectID(docid) }, fields, options, function(err, data) {
		if (err) {
			res.send({ success : false, msg : err }, 200);
		} else if (!data) {
			res.send({ success : false, msg : "Policy Data Not Found!" }, 200);
		} else {
			if (!q.type) q.type = "NSell";
			data.policyState = 'paid';
			if (data.policyState != 'paid') {
				res.send({ success : false, msg : "Policy Not Paided!" }, 200);
			} else {
				process(provider, q.configid, function(err, cfg) {
					var WaatsLib = require('../lib/waats');
					var waats = new WaatsLib(provider, cfg, data, q.type);
					waats.query(function(err, data) {
						if (err) {
							res.send({success:false, msg:err}, 200);
						} else {
							res.send({success:true, msg:"OK", policyNumber:data}, 200);
						}
					});
				});
			}
		}
	});
}

/**
 * 
 * @param req
 * @param res
 */
function mailPolicy(req, res) {
	// q.configid="5140407ccaa05a466900006c" the mail smtp config docid
	var params = req.params, dbid = params.dbid, docid = params.docid, q = req.query, options = q.options, fields = q.fields, provider = providers
			.getProvider(dbid);

	res.header('Content-Type', 'application/json');
	var process = function(data) {
		//var WaatsLib = require("../lib/waats");
		//var waats = new WaatsLib(provider, data, "");
		var waats = require("../lib/mail");
		waats.mailPolicy(provider, { _id : new BSON.ObjectID(docid) }, data, options, function(err, data) {
			if (err) {
				res.send({ success : false, msg : err }, 200);
			} else {
				res.send({ success : true, msg : data }, 200);
			}
		});
	};

	if (q.configid) {
		provider.findOne({ _id : new BSON.ObjectID(q.configid) }, fields, options, function(err, data) {
			if (err) {
				res.send({ success : false, msg : err }, 200);
			} else {
				process(data);
			}
		});
	} else {
		process(require("../config/waats").WaatsConfig);
	}
}

var payLogType = "513d8e3ed58d1c7045000665";
function pay(req, res){
        var docid = req.body._id
        , params = req.params
        , dbid = params.dbid
        , fields = req.query.fields
        , options = req.query.options;
        var provider = providers.getProvider(dbid);
        var o_id = new BSON.ObjectID(docid);

        provider.findOne({_id: o_id}, fields, options, function(err, doc){
		console.log("print doc:%j", doc);
                if (err){
                        console.log(err);
                 }else if (doc.policyState == "pending" ){
			var subject = doc.productName + " (" + doc.insureds[0].name + " 等 " + doc.insureds.length + "人)";
			var body = "";
			var totalPremium  = doc.totalPremium;
			var defaultbank = req.body.defaultbank != "undefined" ?  req.body.defaultbank : '' ;
                        var dt = new Date();
                        //var transID = doc._id.toString().substr(0,8) + dt.getMilliseconds().toString(); 
			provider.counter("transID", function(err, transID){
				var paylog = {
						 "_id": new BSON.ObjectID(),
						 "type": payLogType,
						 "payType": "Alipay",
						 "transID": transID,
						 "policyID": doc._id,
						 "value": totalPremium,
						 "ip": Functions.getClientIP(req),
						 "startTime": new Date(),
						 "code": "",
						 "memo": subject
					       };
				provider.insert(paylog, {}, function(error, logs){
					      if (error){
							return error;
						} else {
							var sURI = Alipay.alipayto(subject, body, totalPremium, defaultbank ,transID);
							res.redirect(sURI);
						}
				});
			});
		} else { 
			res.send({ success : false , msg : " policy state error "});
		}
        });
}

function paynotify(req, res){
        
        var params = req.params
        , dbid = params.dbid;

	var params=req.query;
	var trade_no = req.query.trade_no;                         
	var order_no = req.query.out_trade_no;              
	var total_fee = req.query.total_fee;               
	var subject = req.query.subject;
	var buyer_email = req.query.buyer_email;            
	var trade_status = req.query.trade_status;         
	var body = "";
        var provider = providers.getProvider(dbid);
	if(req.body != null && req.method == 'POST'){
		params = req.body;
               	var trade_no = req.body.trade_no;                         
	        var order_no = req.body.out_trade_no;              
		var total_fee = req.body.total_fee;               
		var subject = req.body.subject;
		var buyer_email = req.body.buyer_email;            
		var trade_status = req.body.trade_status;         
	}
	Alipay.AlipayNotify.verity(params,function(result){
		if(result){
			if(trade_status=="TRADE_FINISHED" || trade_status=="TRADE_SUCCESS"){
				provider.findOne({"type": payLogType, "transID": parseInt(order_no)}, [], {}, function(error, doc){
console.log('{"type": '+payLogType+', "transID": '+order_no+'}');
					if (error) {
						console.log(error);
					} else if (doc){
                                               var pid =doc.policyID + "";
						provider.update({_id: new BSON.ObjectID(pid)}, {"$set": {"policyState": "paid", "datePay": new Date()}}, {}, function(error, ret){
							console.log("update policyState: %j", ret);
							provider.findOne({_id: new BSON.ObjectID(pid)}, [], {}, function(error, pdoc){
								if (error) {
									console.log(error);
								} else if (pdoc.waats) {
									var WaatsLib = require('../lib/waats');
									var cfg = require("../config/waats").WaatsConfig;
									var waats = new WaatsLib(provider, cfg, pdoc, "NSell");
									waats.query(function(err, policyNum) {
										if (err) {
											console.log("issued policy error: %j", err);
										} else {
											provider.update({_id: new BSON.ObjectID(pid)}, {"$set": {"policyNumber": policyNum, policyState: "issued", dateIssue: new Date()}}, {}, function(error, ret){
												if (ret) {
													console.log("inssue policy success. polciyNumber: %s", policyNum);
													// send mail
													var process = function(data) {
														var mailLib = require("../lib/mail");
														mailLib.mailPolicy(provider, { _id : new BSON.ObjectID(pid) }, data, {}, function(err, data) {
															
														});
													};

													if (req.query.configid) {
														provider.findOne({ _id : new BSON.ObjectID(req.query.configid) }, fields, options, function(err, data) {
															if (err) {
																// res.send({ success : false, msg : err }, 200);
																console.log("get mail config error!");
															} else {
																process(data);
															}
														});
													} else {
														process(require("../config/waats").WaatsConfig);
													}
												} else {
													console.log("update policyNumber error");
												}
											});	
										}
									});
								} else {
									provider.counter(pdoc.productCode, function(err, serNumber){
										provider.update({_id: new BSON.ObjectID(pid)}, {"$set": {"policyNumber": pdoc.productCode + serNumber, policyState: "issued", dateIssue: new Date()}}, {}, function(error, ret){
											if (ret) {
												// send mail
												var process = function(data) {
													var mailLib = require("../lib/mail");
													mailLib.mailPolicy(provider, { _id : new BSON.ObjectID(pid) }, data, {}, function(err, data) {
														
													});
												};

												if (req.query.configid) {
													provider.findOne({ _id : new BSON.ObjectID(req.query.configid) }, fields, options, function(err, data) {
														if (err) {
															// res.send({ success : false, msg : err }, 200);
															console.log("get mail config error!");
														} else {
															process(data);
														}
													});
												} else {
													process(require("../config/waats").WaatsConfig);
												}
												console.log("inssue policy success. polciyNumber: %s", pdoc.productCode + serNumber);
											} else {
												console.log("update policyNumber error");
											}
										});
									});
								}
							});					
						});
						provider.update({transID: parseInt(order_no), "type": payLogType}, {"$set": {"successTime": new Date(), "code": trade_no}}, {}, function(error, ret){
							console.log("update payLog: %j", ret);
						});
					} else {
						console.log("can not find policy by trandsID");
					}
				});
			}
                    console.log("pay success >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
			res.end("success"); 

		} else{
                    console.log("pay fail >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
		    res.end("fail");
		}

	});
}

function requestUrl(host,path,callback){
    var http = require('http');

    var options = {
        host: '192.168.1.41',
        port: 8080,
        path: path,
        method: 'GET'
    };

    var req = http.request(options, function(res) {
        console.log("statusCode: ", res.statusCode);
        console.log("headers: ", res.headers);

        res.on('data', function(d) {
            callback(d);
        });
    });
    
    
    req.end();

    req.on('error', function(e) {
        console.error(e);
    });
};

function md5(str) {
	var crypto = require('crypto');
	var md5sum = crypto.createHash('md5');
	md5sum.update(str);
	str = md5sum.digest('hex');
	return str;
};

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

                        //alipay routes
		        agilenotes.post('/dbs/:dbid/pay', pay);
			agilenotes.get('/dbs/:dbid/payreturn', paynotify);
			agilenotes.post('/dbs/:dbid/paynotify', paynotify);

			agilenotes.get('/logout', logout);
			agilenotes.get('/login', login);
			

			agilenotes.get('/dbs/:dbid/:docid?', acl, getDoc);
			agilenotes.post('/dbs/:dbid', acl, postDoc);
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
			agilenotes.post("/dbs/:dbid/:docid/mailtest(\/?|\/*)", MailLib.getMailTest);
			agilenotes.get("/dbs/:dbid/:docid/mailtest", acl, MailLib.getMailTest);
			agilenotes.get("/dbs/:dbid/:docid/readmail", MailLib.readMailTest);
			agilenotes.post("/dbs/:dbid/:docid/sendmail(\/?|\/*)", acl, MailLib.sendObject);
			agilenotes.get("/dbs/:dbid/:docid/waats", acl, waatsRequest);
			agilenotes.get("/dbs/:dbid/:docid/mailpolicy", acl, mailPolicy);
			agilenotes.get("/:username/:email/getpwd?(\/?|\/*)", MailLib.getPwdReq);
			agilenotes.post("/:username/:email/getpwd", MailLib.getPwdReq);
			agilenotes.post("/resetPwd", MailLib.resetPwd);
			agilenotes.get('/dbn/:dbn/:docn?', acl, rend);

		}
	});
};
