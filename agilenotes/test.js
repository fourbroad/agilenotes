var fs = require('fs');
var stat = fs.statSync("public");
var crypto = require('crypto');
var util = require("util");

var versionFile = "public/version/version.txt";

function md5file(dataObj, path, update_time) {
	var stats = fs.statSync(path);
	var md5sum = crypto.createHash('md5');
	md5sum.update(path);
	var result = md5sum.digest('hex');
	dataObj[result] = { name : path.substr(7), update_time : update_time ? update_time : (new Date(stats.mtime).toJSON()) };
	return result;
}

function getVersion() {
	if (!fs.existsSync(versionFile)) {
		return 0;
	} else {
		var data = fs.readFileSync(versionFile);
		return data ? (parseInt(data)) : 0;
	}
}

function writeVersion(ver) {
	fs.writeFileSync(versionFile, ver + "");
}

function listFiles(dataObj, path) {
	var stat = fs.statSync(path);
	if (stat.isDirectory()) {
		var data = fs.readdirSync(path);
		for ( var i = 0; i < data.length; i++) {
			if ((path + "/" + data[i]) != 'public/version') listFiles(dataObj, path + "/" + data[i]);
		}
	} else if (stat.isFile()) {
		if (path == 'public/javascripts/jquery.ans.js') {
			md5file(dataObj, path, new Date("1970-01-01").toJSON());
		} else {
			md5file(dataObj, path);
		}
	}
}

/** ************** below for mobile *********************** */

function compareData(oldData, newData) {
	var result = { add : [], modify : [], del : [] };
	if (oldData && newData) {
		var oldObj = typeof (oldData) == 'string' ? JSON.parse(oldData) : oldData;
		var newObj = typeof (newData) == 'string' ? JSON.parse(newData) : newData;
		for ( var i in oldObj) {
			if (typeof (newObj[i]) != 'undefined') {
				if ((new Date(newObj[i].update_time)) > (new Date(oldObj[i].update_time))) {
					result.modify.push(oldObj[i].name);
				}
			} else {
				result.del.push(oldObj[i].name);
			}
		}

		for ( var i in newObj) {
			if (typeof (oldObj[i]) == 'undefined') {
				result.add.push(newObj[i].name);
			}
		}
	}

	return result;
}

function compare(oldfile, newfile) {
	var oldData = fs.readFileSync(oldfile);
	var newData = fs.readFileSync(newfile);
	return compareData(oldData, newData);
}

var dataObj = {};
listFiles(dataObj, "public");
var version = getVersion();
var fileName = "public/version/" + version + ".txt";
var oldData = null;
try {
	oldData = fs.readFileSync(fileName);
} catch (e) {
	console.log(e);
}
if (oldData) {
	var result = compareData(oldData.toString("UTF-8"), dataObj);
	console.log(result);
	if (result.add.length > 0 || result.modify.length > 0 || result.del.length > 0) {
		fs.writeFileSync("public/version/" + (version + 1) + ".txt", JSON.stringify(dataObj));
		fs.writeFileSync("public/version/version.txt", (version + 1));
	}
} else {
	fs.writeFileSync("public/version/" + (version + 1) + ".txt", JSON.stringify(dataObj));
	fs.writeFileSync("public/version/version.txt", (version + 1));
}

var t = function syncDataVersion() {
	var versionFile = "data_version.txt";
	var file = new File();
	var data = file.read(versionFile);
	var dbid = "519093fbac8f2702b2000002";
	var versionId = "51abfe4cac8f2778f5000025";

	var _doSync = function(newData, newVersion) {
		var dat = file.read("data_version_data.txt");
		var _doModule = function(data, type) {
			if (type == 'del') {
				for ( var i = 0; i < data.length; i++) {
					file.deleteFile(data[i]);
				}
			} else if (type == 'modify' || type == 'add') {
				for ( var i = 0; i < data.length; i++) {
					$.ans.getDoc(dbid, data[i], null, function(err, result) {
						if (!err && result) {
							file.write(data[i] + ".json", JSON.stringify(result));
						}
					}, null);
				}
			}
		};

		if (dat) {
			var t = JSON.parse(dat);
			var oldData = {};
			if (t && t.success) {
				oldData = t.msg;
			} else {
				var cmp = compareData(oldData, newData);
				_doModule(cmp.del, "del");
				_doModule(cmp.modify, "modify");
				_doModule(cmp.add, "add");
				file.write("data_version_data.txt", newData);
				file.write(versionFile, newVersion);
			}
		}
	};

	var _readRemoteVersion = function(old) {
		$.ans.get("/dbs/" + dbid + "/" + versionId + "?options={\"exec\":1}", function(err, version) {
			if (version) {
				var result = version.result;
				if ((new Date(result._create_at)) > (new Date(old))) {
					$.ans.getDoc(dbid, result._id, function(err, doc) {
						if (!err && doc) {
							_doSync(doc.content, result._create_at);
						}
					});
				}
			}
		});
	};

	if (data) {
		var t = JSON.parse(data);
		if (t.success) {
			_readRemoteVersion(t.msg);
		} else {
			_readRemoteVersion("1970-01-01");
		}
	} else {
		_readRemoteVersion("1970-01-01");
	}
};
