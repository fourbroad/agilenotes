
var mongo = require("mongodb"),
    BSON = mongo.BSONPure,
    GridStore = mongo.GridStore;

Document = function(db, collection) {
	this.db= db;
	this.collection = collection || "documents";
};

Document.prototype.getCollection= function(callback) {
	this.db.collection(this.collection, function(error, collection) {
		callback(error,collection);
	});
};

Document.prototype.getFileCollection= function(callback) {
	this.db.collection(this.collection+".files", function(error,collection){
		callback(error,collection);
	});
};

Document.prototype.getChunkCollection= function(callback) {
	this.db.collection(this.collection+".chunks", function(error,collection){
		callback(error,collection);
	});
};

Document.prototype.find = function(selector, fields, options, callback) {
	selector = selector || {};
	this.getCollection( function(error, collection) {
		if(collection){
			collection.count(selector,function(error,count){
				if( error ) callback(error);
				else{
					collection.find(selector, fields, options).toArray(function(error, docs) {
						if(error) callback(error);
						else{
							var data = {total:count, docs:docs};
							if(options && (options.skip != undefined)) data.skip = options.skip;
							if(options && (options.limit != undefined)) data.limit = options.limit;
							callback(error,data);
						}
					});
				}
			});
		}else{
			callback(error);
		}
	});
};

Document.prototype.count = function(selector, callback) {
	selector = selector || {};
	this.getCollection(function(error, collection) {
		if (collection) {
			collection.count(selector, function (error, count) {
				callback(error, count);
			});
		}
	});
};

Document.prototype.counter = function counter(name, callback) {
	this.getCollection(function(error, collection) {
		if (collection) {
		     collection.findAndModify({ key: name }, [], { $inc: { next: 1} }, { "new": true, upsert: true }, function (err, ret){
			if (err) {
				return callback(err);
		     	} else {
				return callback(null, ret.next);
			}
		     });
		}
	});
};

Document.prototype.findOne = function(selector, fields, options, callback) {
	selector = selector || {};
	this.getCollection(function(error, collection) {
		if(collection){
			collection.findOne(selector, fields, options, function(error, doc) {
				callback(error,doc);
			});
		}else{
			callback(error);
		}
	});
};

Document.prototype.insert = function(docs, options, callback) {
	this.getCollection(function(error, collection) {
		if(collection){
			options = options || {};
			options.safe = true;
			collection.insert(docs, options, function(error,docs) {
				callback(error, docs);
			});
		}else{
			callback(error);
		}
	});
};

Document.prototype.update = function(selector, fields, options, callback) {
	selector = selector || {};
	this.getCollection(function(error, collection) {
		if(collection){
			options = options || {};
//			options.upsert = true;
			options.safe = true;
			collection.update(selector, fields, options,function(error,result) {
				callback(error, result);
			});
		}else{
			callback(error);
		}
	});
};

Document.prototype.move = function(docId, parentId, callback) {
	var self = this, selector = {$or:[{_id:new BSON.ObjectID(docId)},{_id:new BSON.ObjectID(parentId)}]};
	this.getCollection(function(error, collection) {
		if(collection){
			collection.find(selector).toArray(function(error, docs){
				if(error){
					callback(error);
				}else if(docs && docs.length != 2){
					callback({error:"Error parameters."});
				}else{
					var doc = null, parentDoc = null, id=null;
					for(var i in docs){
						id = docs[i]._id.toString();
						if(id == docId) doc = docs[i];
						if(id == parentId) parentDoc = docs[i];
					}

					function moveChildren(cursor, newParentPath, oldParentPath, callback){
						cursor.nextObject(function(error, doc){
							if(doc){
								doc._path = doc._path.replace(oldParentPath, newParentPath);
								self.update({_id:doc._id}, doc, null, function(error, result){
									if(error){
										callback(error);
									}else{
										moveChildren(cursor, newParentPath, oldParentPath, callback);
									}
								});
							}else if(error){
								callback(error);
							}else{
								callback(null, {result:"OK"});
							}
						});
					}

					function moveDoc(doc, parentPath, callback){
						var id = doc._id.toString();
						if(doc._path){
							var oldPath = doc._path;
							doc._path = parentPath+id+",";
							moveChildren(collection.find({_path:{$regex:'^'+oldPath}}), doc._path, oldPath, function(error, result){
								callback(error, result);
							});
						}else{
							doc._path = parentPath+id+",";
							self.update({_id:id}, doc, null, function(error, result){
								callback(error, result);
							});
						}
					}

					if(!parentDoc._path){
						parentDoc._path = parentDoc._id.toString()+",";
						self.update({_id:parentDoc._id},parentDoc, null, function(error, result){
							moveDoc(doc, parentDoc._path, function(error, result){
								callback(error, result);
							});
						});
					}else{
						moveDoc(doc, parentDoc._path, function(error, result){
							callback(error, result);
						});
					}
				}
			});
		}else{
			callback(error);
		}
	});
};

Document.prototype.remove = function(selector, options, callback) {
	var self = this;
	selector = selector || {};
	this.getCollection(function(error, collection) {
		if(collection){
			function removeChildren(cursor, callback){
				cursor.nextObject(function(error, doc){
					if(doc){
						self.deleteAttachment(doc._id, null, function(error, result){
							if(error){
								callback(error);
							}else{
								collection.remove({_id:doc._id}, options, function(error, result) {
									if(error){
										callback(error);
									}else{
										removeChildren(cursor, callback);
									}
								});
							}
						});
					}else if(error){
						callback(error);
					}else{
						callback(null, {result:"OK"});
					}
				});
			}

			function removeDoc(cursor, cascade, callback){
				cursor.nextObject(function(error, doc){
					if(doc){
						if(cascade&&doc._path){
							removeChildren(collection.find({_path:{$regex:'^'+doc._path}}),function(error, result){
								self.deleteAttachment(doc._id, null, function(error, result){
									if(error){
										callback(error);
									}else{
										collection.remove({_id:doc._id}, options, function(error, result) {
											if(error){
												callback(error);
											}else{
												removeDoc(cursor, cascade, callback);
											}
										});
									}
								});
							});
						}else{
							self.deleteAttachment(doc._id, null, function(error, result){
								if(error){
									callback(error);
								}else{
									collection.remove({_id:doc._id}, options, function(error, result) {
										if(error){
											callback(error);
										}else{
											removeDoc(cursor, cascade, callback);
										}
									});
								}
							});
						}
					}else if(error){
						callback(error);
					}else{
						callback(null, {result:"OK"});
					}
				});
			}

			options = options || {};
			options.save = true;
			removeDoc(collection.find(selector, null, options), options.cascade, function(error,result){
				callback(error,result);
			});
		}else{
			callback(error);
		}
	});
};

Document.prototype.findAttachment = function(docId, selector, options, callback) {
	selector["metadata.ownerId"] = docId;
	options = options || {};
	this.getFileCollection(function(error,collection){
		if(collection){
			collection.find(selector, options).toArray(function(error,result){
				callback(error,result);
			});
		}else{
			callback(error);
		}
	});
};

Document.prototype.findAttachmentByPath = function(docId, filepath, callback) {
	var self = this;
	this.getFileCollection( function(error,collection){
		if(collection){
			var selector = {"metadata.ownerId": docId, "metadata.filepath" : filepath};
			collection.findOne(selector, function(error,doc){
				if(doc){
					var gridStore = new GridStore(self.db, new BSON.ObjectID(doc._id.toString()), 'r',{root:self.collection});
					gridStore.open(function(error, gridStore) {
						callback(error, gridStore);
					});
				}else{
					callback(error);
				}
			});
		}else{
			callback(error);
		}
	});
};

Document.prototype.createAttachment = function(docId, filepath, filename, contentType, callback) {
	var metadata = {ownerId:docId, filepath:filepath};
	var self = this;
	this.deleteAttachment(docId, filepath, function(err, ret) {
		var gridStore = new GridStore(self.db, new BSON.ObjectID(), filename, 'w',{root:self.collection, content_type:contentType, metadata:metadata});
		gridStore.open(function(error, gridStore){
			callback(error, gridStore);
		});
	});
};

Document.prototype.deleteAttachment = function(docId, filepath, callback) {
	var self = this;
	this.db.collection(this.collection+".files", function(error,collection){
		if(collection){
			var selector = {"metadata.ownerId": docId};
			if(filepath) selector["metadata.filepath"] = filepath;
			collection.find(selector).toArray(function(error,result){
				if(result.length > 0){
					var gridStore = new GridStore(self.db, new BSON.ObjectID(result[0]._id.toString()), 'r',{root:self.collection});
					gridStore.open(function(error, gridStore) {
						gridStore.unlink(function(error,result){
							callback(error, result);
						});
					});
				}else{
					callback(error,result);
				}
			});
		}else{
			callback(error);
		}
	});
};

module.exports = Document;
