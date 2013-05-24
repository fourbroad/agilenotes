var Model = require("./model"),
      Utils = require("./utils");
    
// memory cache for ou and group.
var ous = {};
var groups = {};

var BSON = null;

//Authorization mode: include, inherit, current.
var ouAuthz = "include";
var groupAuthz = "inherit";
var roleAuthz = "inherit";

function setBson(bson) {
	BSON = bson;
}

function checkAuthz(user, authz){
	if(!authz) return true;
	if(!user) return false;

	function check(s, t, m){
		var reg;
		for(var i in t){
			for(var j in s){
				if(m == "include"){
					reg = new  RegExp('^'+s[j]);
					if(reg.test(t[i])){
						return true;
					}
				}else if(m == "inherit"){
					reg = new  RegExp('^'+t[i]);
					if(reg.test(s[j])){
						return true;
					}
				}else if(m == "current"){
					if(t[i] == s[j]){
						return true;
					}
				}
			}
		}
		return false;
	}

	for(var i in authz.users||[]){
		if(authz.users[i] == user._id){
			return true;
		}
	}
	if(authz.rolePaths && user._rolePaths && check(user._rolePaths, authz.rolePaths, roleAuthz)){
		return true;
	}
	if(authz.groupPaths && user._groupPaths && check(user._groupPaths, authz.groupPaths, groupAuthz)){
		return true;
	}
	
	var ou = null;
	try{
		out = user._path.match(/((.+),)[^,]+,$/)[1];
	} catch (e) {
		console.log(e);
	}
	if(authz.ouPaths && check([ou], authz.ouPaths, ouAuthz)){
		return true;
	}

	if(authz.rolePaths){
		var rolePaths = [], reg;
		if(ouAuthz == "include"){
			reg = new RegExp('^'+ou);
			for(var i in ous){
				if(reg.test(ous[i]._path) && ous[i]._rolePaths){
					rolePaths = rolePaths.concat(ous[i]._rolePaths);
				}
			}
		}else if(ouAuthz == "inherit"){
			var ids = ou.split(',');
			for(var i = 0; i < ids.length-1; i++){
				if(ous[i]._rolePaths){
					rolePaths = rolePaths.concat(ous[i]._rolePaths);
				}
			}
		}else if(ouAuthz == "current"){
			var ids = ou.split(','), id = ids[ids.length-2];
			if(ous[id]._rolePaths){
				rolePaths = rolePaths.concat(ous[id]._rolePaths);
			}
		}

		if(user._groupPaths){
			for(var i in user._groupPaths){
				if(groupAuthz == "include"){
					reg = new RegExp('^'+user._groupPaths[i]);
					for(var i in groups){
						if(reg.test(groups[i]._path) && groups[i]._rolePaths){
							rolePaths = rolePaths.concat(groups[i]._rolePaths);
						}
					}
				}else if(groupAuthz == "inherit"){
					var ids = user.groupPaths[i].split(',');
					for(var i = 0; i < ids.length-1; i++){
						if(groups[i]._rolePaths){
							rolePaths = rolePaths.concat(groups[i]._rolePaths);
						}
					}
				}else if(groupAuthz == "current"){
					var ids = user.groupPaths[i].split(','), id = ids[ids.length-2];
					if(groups[id]._rolePaths){
						rolePaths = rolePaths.concat(groups[id]._rolePaths);
					}
				}
			}
		}
		
		if(check(rolePaths, authz.rolePaths, roleAuthz)){
			return true;
		}
	}

	return false;
}

function acl(user, provider, method, selector, type, callback){
	if(selector){
		selector._deleted = selector._deleted || {$exists:false};
		Utils.objectId(selector);
	}
	if(user&&user.username == "root") {callback(null, selector);return;}
	
	switch(method){
	case "post":
		// console.log(BSON);
		provider.findOne({_id: new BSON.ObjectID(type)}, null, null, function(error, meta){
			if(meta){
				if(meta._authz && meta._authz.post){
					if(checkAuthz(user, meta._authz.post)){
						callback(null, selector);
					}else{
						callback({error:"Not Authorized!"});
					}
				}else{
					callback(null, selector);
				}
			}else{
				callback({error:"Not Authorized!"});
			}
		});
		break;
	case "get":
		if (selector.category == "policy") {
				selector._ownerID = user._id;
			};
	case "put":
	case "delete":
		provider.find({type:Model.META}, null, null, function(error, data){
			var metas = data.docs, allow = [];
			for (var i in metas){
				if(metas[i]._authz && metas[i]._authz[method]){
					if(checkAuthz(user, metas[i]._authz[method])){
						allow.push(metas[i]._id+"");
					}
				}else{
					allow.push(metas[i]._id+"");
				}
			}
			var id = user&&user._id.toString(), ouPath = user && user._path.match(/((.+),)[^,]+,$/)[1]||"", 
			    groupPaths = user && user._groupPaths||[], rolePaths = user && user._rolePaths||[],
			    or = [], json;
			json = {type:{$in:allow}}, 
			json["_acl."+method] = {$exists:false}, 
			or.push(json);
			
			json = {};
			json["_acl."+method+".users"] = id||"__unkown"; 
			or.push(json);
			
			json = {};
			if(ouAuthz == "include"){
				json["_acl."+method+".ouPaths"] = ouPath ? {$regex: "^"+ouPath}:"__unkown"; 
			}else if(ouAuthz == "inherit"){
				var pa = [], p = ouPath, m;
				while(p){
					pa.push('^'+p+'$');
					m = p.match(/((.+),)[^,]+,$/);
					p = m && m[1];
				}
				json["_acl."+method+".ouPaths"] = pa.length ? {$regex:pa.join('|')} : "__unkown"; 
			}else if(ouAuthz == "current"){
				json["_acl."+method+".ouPaths"] = ouPath?ouPath : "__unkown"; 
			}
			
			or.push(json);
			
			json = {};
			if(groupAuthz == "include"){
				json["_acl."+method+".groupPaths"] = groupPaths ? {$regex:"^"+groupPaths.join("|^")}:"__unkown"; 
			}else if(groupAuthz == "inherit"){
				var pa = [], p, m;
				for(var i in groupPaths){
					p = groupPaths[i];
					while(p){
						pa.push('^'+p+'$');
						m = p.match(/((.+),)[^,]+,$/);
						p = m && m[1];
					}
				}
				json["_acl."+method+".groupPaths"] = pa.length ? {$regex:pa.join('|')} : "__unkown"; 
			}else if(groupAuthz == "current"){
				json["_acl."+method+".groupPaths"] =groupPaths ? {$elemMatch:{$in:groupPaths}} : "__unkown"; 
			}
			or.push(json);
			
			json = {};
			if(roleAuthz == "include"){
				json["_acl."+method+".rolePaths"] = rolePaths ? {$regex:"^"+rolePaths.join("|^")} : "__unkown"; 
			}else if(roleAuthz == "inherit"){
				var pa = [], p,m;
				for(var i in rolePaths){
					p = rolePaths[i];
					while(p){
						pa.push('^'+p+'$');
						m = p.match(/((.+),)[^,]+,$/);
						p = m && m[1];
					}
				}
				json["_acl."+method+".rolePaths"] = pa.length ? {$regex:pa.join('|')} : "__unkown"; 
			}else if(roleAuthz == "current"){
				json["_acl."+method+".rolePaths"] = rolePaths?{$elemMatch:{$in:rolePaths}}:"__unkown"; 
			}
			or.push(json);
			
			callback(null, {$and:[selector,{$or:or}]});
		});
		break;
	default:
		callback(null,selector);
	    break;
	}
}

exports.setBson = setBson;
exports.checkAuthz = checkAuthz;
exports.acl = acl;
exports.init = function init(os, gs, oz, gz, rz){
	ous = os;
	groups = gs;
	ouAuthz = oz;
	groupAuthz = gz;
	roleAuthz = rz;
};
