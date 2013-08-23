var mongo = require("mongodb"),
    BSON = mongo.BSONPure,
    GridStore = mongo.GridStore,
    Document = require("./document"),
    Model = require("../lib/model"),
    Mail = require("./mail"),
    Utils = require("../lib/utils");

Task = function(db, agilenotes) {
	Document.call(this, db);
	this.agilenotes = agilenotes;
	this.intervalIds = {};
	this.timeoutIds = {};
};

Utils.extend(Task, Document);

Task.prototype.exec = function(user, task, options, callback) {
	// TODO: Non-reentrant?
	var self = this;
	if(this.intervalIds[task._id]){
		clearInterval(this.intervalIds[task._id]);
		delete this.intervalIds[task._id];
	}
	if(this.timeoutIds[task._id]){
		clearTimeout(this.timeoutIds[task._id]);
		delete this.timeoutIds[task._id];
	}

	var providers = this.agilenotes.get("providers"), ACL = this.agilenotes.get("acl"), 
	    providersWrapper = null;
	
	function createWrapper(user, ACL, providers){
		return {
			getProvider: function(db, type){
				var provider = providers.getProvider(db,type);
				return {
					find: function(selector, fields, options, callback){
						ACL.acl(user, provider, "get", selector, null, function(error, selector){
							if(error) return callback(error);
							provider.find(selector, fields, options, callback);
						});
					},
					findOne: function(selector, fields, options, callback){
						ACL.acl(user, provider, "get", selector, null, function(error, selector){
							if(error) return callback(error);
							provider.findOne(selector, fields, options, callback);
						});
					},
					insert: function(docs, options, callback){
						ACL.acl(user, provider, "post", null, typeof(docs.type) != 'undefined'? docs.type : docs[0], function(error, selector){
							if(error) return callback(error);
							provider.insert(docs, options, callback);
						});
					},
					update: function(selector, fields, options, callback){
						ACL.acl(user, provider, "put", selector, null, function(error, selector){
							if(error) return callback(error);
							provider.update(selector, fields, options, callback);
						});
					},
					remove: function(selector, options, callback){
						ACL.acl(user, provider, "delete", selector, null, function(error, selector){
							if(error) return callback(error);
							provider.remove(selector, options, callback);
						});
					},
                    move: function(docId, parentId, callback){
						ACL.acl(user, provider, "get", {}, null, function(error, selector){
							if(error) return callback(error);
							provider.move(docId, parentId, callback);
						});
					},
					counter: function(selector, callback){
						ACL.acl(user, provider, "get", selector, null, function(error, result){
							if(error) return callback(error);
							provider.counter(selector, callback);
						});
					},
					readmail:function(dbid, config, opts, callback) {
							Mail.readmail(dbid, config, opts, callback);
					},
					
					sendmail:function(dbid, config, doc, opts, callback) {
						Mail.sendmail(dbid, config, doc, opts, callback);
					},
					
					queryWaats:function(provider, config, doc, type, callback) {
						var waats = require("./waats");
						waats.queryWaats(provider, config, doc, type, callback);
					},
					
					exec: function(uid, taskid, options, callback) {
						providers.getProvider("000000000000000000000000").findOne({_id:new BSON.ObjectID(uid)}, null,  null, function(err, user) {
							if (err || !user) {
								callback(err || "data not found!", null);
							} else {
								provider.findOne({_id:new BSON.ObjectID(taskid)}, null, null, function(err, task) {
									if (err || !task) {
										callback(err || "data not found!", null);
									} else {
										self.exec(user, task, options, callback);	
									}
								});
							}
						});
					},
					alipayto:function(config, options, callback) {
						var alipay = require("./alipay");
						alipay.alipayto(config, options, callback);
					}, 
					alipayVerity:function(config, options, callback) {
						var alipay = require("./alipay");
						alipay.verity(config, options, callback);
					},
					getCache:function(key, callback) {
						var redis = self.agilenotes.get('RedisStore');
						redis.get(key, function(err, result){
							callback(err, result);
						});
					},
					setCache:function(key, value, expire, callback) {
						var redis = self.agilenotes.get('RedisStore');
						expire = expire && expire > 0 ? expire : 86400; // one day
						redis.set(key, { cookie: { maxAge: expire * 1000 }, value: value }, function(){
							callback(false, null);
						});
					}
				};

			}
		};
	}
	
	function exec(db, task, provider, options){
		try{
			var handler = eval("("+task.handler+")");
			if(typeof(handler)=="function"){
				if(task.taskType == "instant"){
					handler(db, provider, options, function(error, result){
						callback(error, result);
					});
				}else if(task.taskType == "interval"){
					self.intervalIds[task._id] = setInterval(function(){
						handler(db, provider, options, function(error,result){
							error&&console.log(error);
							result && console.log(result);
						});
					},parseInt(task.delay));
					callback(null, "OK");
				}else if(task.taskType == "timeout"){
					self.timeoutIds[task._id] = setTimeout(function(){
						handler(db, provider, options, function(error,result){
							error&&console.log(error);
							result && console.log(result);
						});
					}, parseInt(task.delay));
					callback(null, "OK");
				}
			}else{
				callback&&callback("Invalid handler.");
				console.log("Invalid handler.");
			}
		}catch(e){
			callback&&callback(e.toString());
			console.log(e.toString());
		}
	}
	
	if(task.taskType == "interval" && !user){
		providers.getProvider(Model.ADMIN_DB).findOne({_id:task.userId}, null, null, function(error, user){
			providersWrapper = createWrapper(user, ACL, providers);
			exec(self.db, task, providersWrapper,options);
		});
	}else{
		providersWrapper = createWrapper(user, ACL, providers);
		exec(this.db, task, providersWrapper,options);
	}
	
};

Task.prototype.clearTask = function(task, options, callback) {
	if(this.intervalIds[task._id]){
		clearInterval(this.intervalIds[task._id]);
		delete this.intervalIds[task._id];
	}
	if(this.timeoutIds[task._id]){
		clearTimeout(this.timeoutIds[task._id]);
		delete this.timeoutIds[task._id];
	}
	callback(null, {result:"OK"});
};

module.exports = Task;
