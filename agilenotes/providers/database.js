
var Document = require("./document"),
    Utils = require("../lib/utils"),
    Model = require("../lib/model");

Database = function(db, agilenotes) {
	Document.call(this, db);
	this.agilenotes = agilenotes;
};

Utils.extend(Database, Document);

Database.prototype.insert = function(doc, options, callback) {
	var providers = this.agilenotes.get("providers");
	Database.parent.insert.call(this, doc, options, function(error, docs){
		if(error) return callback(error);
		var srcProvider = providers.getProvider(options['default']||"blank");
		srcProvider.getCollection(function(error, srcCollection) {
			if(error) return callback(error);
			function copyChunks(cursor, destChunkCollection, callback){
				cursor.nextObject(function(error, chunk){
					if(error) return callback(error);
					if(chunk){
						destChunkCollection.insert(chunk, null, function(error, chunks){
							if(error) return callback(error);
							copyChunks(cursor, destChunkCollection, callback);
						});
					}else{
						callback(null, {result:"OK"});
					}
				});
			}

			function copyFiles(srcProvider, cursor, destProvider, destFileCollection, callback){
				cursor.nextObject(function(error, file){
					if(error) return callback(error);
					if(file){
						srcProvider.getChunkCollection(function(error, srcChunkCollection){
							if(error) return callback(error);
							destProvider.getChunkCollection(function(error, destChunkCollection){
								copyChunks(srcChunkCollection.find({}), destChunkCollection, function(error, result){
									if(error) return callback(error);
									destFileCollection.insert(file,null, function(error, files){
										if(error) return callback(error);
										copyFiles(srcProvider, cursor, destProvider, destFileCollection, callback);
									});
								});
							});
						});
					}else{
						callback(null, {result:"OK"});
					}
				});
			}

			function copyDocuments(srcProvider, cursor, destProvider, destCollection, callback){
				cursor.nextObject(function(error, doc){
					if(error) return callback(error);
					if(doc){
						srcProvider.getFileCollection(function(error, srcFileCollection){
							if(error) return callback(error);
							destProvider.getFileCollection(function(error, destFileCollection){
								var sel = {"metadata.ownerId": doc._id.toString()};
								copyFiles(srcProvider, srcFileCollection.find(sel), destProvider, destFileCollection, function(error, result){
									if(error) return callback(error);
									destCollection.insert(doc, null, function(error, docs){
										if(error) return callback(error);
										copyDocuments(srcProvider, cursor,destProvider, destCollection, callback);
									});
								});
							});
						});
					}else{
						callback(null, {result:"OK"});
					}
				});
			}

			var destProvider = providers.getProvider(docs[0]._id.toString());
			destProvider.getCollection(function(error, destCollection){
				copyDocuments(srcProvider, srcCollection.find(), destProvider, destCollection, function(error, result){
					if(!error){
						providers.getProvider(docs[0]._id.toString(), Model.DATABASE).execIntervalTask(function(error, result){
							error&&console.log(error);
							result && console.log(result);
						});
					}
					callback(error, docs);
				});
			});
		});
	});
};

Database.prototype.remove = function(selector, options, callback) {
	var self = this, providers = this.agilenotes.get("providers");
	console.log(selector);
	this.findOne(selector, null, null, function(error, dbdoc){
		if(error) return callback(error);
		if(dbdoc){
			var dbid = dbdoc._id.toString();
			providers.getProvider(dbid, Model.DATABASE).clearTask(function(error, result){
				if(error) return callback(error);
				self.db.db(dbid).dropDatabase(function(error,result){
					if(error) return callback(error);
					Database.parent.remove.call(self, selector, options, function(error, result){
						callback(error, result);
					});
				});
			});
		}else{
			callback({error:"can't find database."});
		}
	});
};

Database.prototype.execIntervalTask = function(callback) {
	var self = this, providers = this.agilenotes.get("providers");
	this.find({type:Model.TASK, taskType:"interval"},null,null,function(error,data){
		if(error) return callback(error);
		var tasks = data.docs;
		for(var j = 0; j < tasks.length; j++){
			providers.getProvider(self.db.databaseName, Model.TASK).exec(null, tasks[j], null, function(error, result){
				callback(error,result);
			});
		}
	});
};

Database.prototype.clearTask = function(callback) {
	var self = this, providers = this.agilenotes.get("providers");
	this.find({type:Model.TASK, taskType:"interval"},null,null,function(error,data){
		if(data){
			var tasks = data.docs;
			for(var j = 0; j < tasks.length; j++){
				providers.getProvider(self.db.databaseName, Model.TASK).clearTask(tasks[j], null, function(error, result){	});
			}
			callback(null, "Clear tasks...");
		}else{
			callback(error);
		}
	});
};

module.exports = Database;
