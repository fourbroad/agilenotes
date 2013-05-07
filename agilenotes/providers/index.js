var mdb = require('mongodb'), 
    Db = mdb.Db, 
    Server = mdb.Server,
    BSON = mdb.BSONPure,
    Document = require("./document"),
    Database = require("./database"),
    Form = require("./form"),
    View = require("./view"),
    Page = require("./page"),
    Task = require("./task"),
    Category = require("./category"),
    User = require("./user"),
    OU = require("./ou"),
    Group = require("./group"),
    Role = require("./role"),
    Model = require("../lib/model"),
    Mail = require("./mail"),
    Waats = require("./waats"),
    Alipay = require("./alipay");

var agilenotes = null;
var providers = {};
var adminDb = new Db(Model.ADMIN_DB, new Server('192.168.1.40', 27017, {auto_reconnect : true, poolSize : 7}, {native_parser : false}));
var dbs = {};
dbs[Model.ADMIN_DB] = adminDb;

listDatabases = function(callback) {
	// Use the admin database for the operation
	adminDb.admin(function(err, ad) {
		if(err){
			callback(err);
		}else{
			// List all the available databases
			ad.listDatabases(callback);
		}
	});
};

function getDb(dbid) {
	if(!dbs[dbid]){
		dbs[dbid] = adminDb.db(dbid);
	}
	
	return dbs[dbid];
};

function getProvider(db, type){
	providers[db] = providers[db] || {};
	if(!providers[db][type]){
		var dbInst = getDb(db), pro = new Document(dbInst);
		switch(type){
		case Model.DATABASE:
			pro = new Database(dbInst,agilenotes);
			break;
		case Model.FORM:
			pro = new Form(dbInst);
			break;
		case Model.VIEW:
			pro = new View(dbInst);
			break;
		case Model.PAGE:
			pro = new Page(dbInst);
			break;
		case Model.TASK:
			pro = new Task(dbInst, agilenotes);
			break;
		case Model.CATEGORY:
			pro = new Category(dbInst);
			break;
		case Model.USER:
			pro = new User(dbInst);
			break;
		case Model.OU:
			pro = new OU(dbInst);
			break;
		case Model.GROUP:
			pro = new Group(dbInst);
			break;
		case Model.ROLE:
			pro = new Role(dbInst);
			break;
		case "MAIL":
			pro = new Mail(dbInst);
			break;
		case "WAATS":
			pro = new Waats(dbInst);
			break;
		case "Alipay":
			pro = new Alipay(dbInst);
			break;
		}
		providers[db][type] = pro;
	}

	return providers[db][type];
};

function openAdminDb(callback){
	adminDb.open(function(err, db){
		if(err) callback(err);
		else{
			callback(null,db);
		}
	});
};

exports.getProvider = getProvider;
exports.openAdminDb = openAdminDb;
exports.init = function init(ans){
	agilenotes = ans;
};
