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
						ACL.acl(user, provider, "post", null, docs[0], function(error, selector){
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
					receive:function(doc, callback) {
						ACL.acl(user, provider, "get", {}, null, function(error, selector){
							if (error) return callback(error);
							Mail.receive(doc, callback);
						});
					}
				};

			}
		};
	}
	
	if(task.taskType == "interval" && !user){
		providers.getProvider(Model.ADMIN_DB).findOne({_id:task.userId}, null, null, function(error, user){
			providersWrapper = createWrapper(user, ACL, providers);
		});
	}else{
		providersWrapper = createWrapper(user, ACL, providers);
	}
	
	try{
		var self = this, handler = eval("("+task.handler+")");
		if(typeof(handler)=="function"){
			if(task.taskType == "instant"){
				handler(this.db, providersWrapper, options, function(error, result){
					callback(error, result);
				});
			}else if(task.taskType == "interval"){
				this.intervalIds[task._id] = setInterval(function(){
					handler(self.db, providersWrapper, options, function(error,result){
						error&&console.log(error);
						result && console.log(result);
					});
				},parseInt(task.delay));
				callback(null, "OK");
			}else if(task.taskType == "timeout"){
				this.timeoutIds[task._id] = setTimeout(function(){
					handler(self.db, providersWrapper, options, function(error,result){
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
