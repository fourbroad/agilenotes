/*!
 * Agile Notes 1.0
 *
 * Copyright 2013, Sihong Zhu and other contributors
* Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
* and GPL (http://www.opensource.org/licenses/gpl-license.php) version 2 licenses.
* This software is not distributed under version 3 or later of the GPL.
 *
 * http://agilemore.com/agilenotes
 */

(function( $, undefined ) {

$.widget( "an.authorization", $.ui.dialog, {
	options: {
		title: "Authorization",
		westWidth: 220,
		width: 620,
		height: 480,
		forms:[]
	},

	_create: function() {
		$.ui.dialog.prototype._create.apply(this, arguments);
		var el = this.element.addClass("an-authorization");
		this.west = $("<div class='west'/>").appendTo(el);
		this.organization = $("<div class='organization ui-corner-all'/>").appendTo(this.west);
		this.center = $("<div class='center'/>").appendTo(el);
		this.operation = $("<div class='operation ui-corner-all'><h4 class='title'/></div>").appendTo(this.center);
		this.content = $("<div class='content'/>").appendTo(this.operation);
	},
	
	_init:function(){
		$.ui.dialog.prototype._init.apply(this, arguments);
		var self = this, o = this.options;
		this.element.border({west:{selector:".west", width:o.westWidth, resizable:true }, center:{selector:".center" }});
		this.organization.sideview({
			dbId:o.dbId, 
			roots: Model.OU_ROOT+","+ Model.GROUP_ROOT+","+Model.ROLE_ROOT,
			nodeclick:function(e,node){
				var doc = node.data;
				self.center.find(".title").html(doc.title||doc.name||doc._id);
				self.content.editor({
					document: self._getACLAuthz(doc), 
					forms: o.forms, 
					dbId: o.dbId, 
					mode: "edit", 
					ignoreEscape: true,
					docpropchanged:function(e,data){ self._updateDocument(doc, data); }
				});
			}
		});
		o.resize = function(){self.element.border("refresh");};
	},

	_getACLAuthz: function(actor){
		var o = this.options, doc = o.document, path = (actor.type==Model.USER?actor._id: actor._path), 
		    paths = null, aclAuthz = {title: doc.title||doc.name||doc._id, typeName:"Document"}, 
		    pathsName = this._getPathsName(actor), acl = doc._acl, authz = doc._authz, 
		    get, post, put, del;
		if(acl){
			paths = acl.get && acl.get[pathsName]; 
			get = paths && ($.inArray(path, paths)!=-1)? true : false;
			paths = acl.put && acl.put[pathsName];
			put = paths && ($.inArray(path, paths)!=-1)? true : false;
			paths = acl["delete"] && acl["delete"][pathsName];
			del = paths && ($.inArray(path, paths)!=-1)? true : false;
			aclAuthz._acl = {get:get, put:put, "delete":del};
		}

		if(doc.type == Model.META){
			aclAuthz.typeName = Model.typeName(doc._id) || "Document";
			if(authz){
				paths = authz.post && authz.post[pathsName];
				post = paths && ($.inArray(path, paths)!=-1)? true : false;
				paths = authz.get && authz.get[pathsName]; 
				get = paths && ($.inArray(path, paths)!=-1)? true : false;
				paths = authz.put && authz.put[pathsName];
				put = paths && ($.inArray(path, paths)!=-1)? true : false;
				paths = authz["delete"] && authz["delete"][pathsName];
				del = paths && ($.inArray(path, paths)!=-1)? true : false;
				aclAuthz._authz = {get:get, post:post, put:put, "delete":del};
			}
		}
		
		return aclAuthz;
	},

	_updateDocument:function(actor, data){
		var doc = this.options.document, ids = data.id.split("."), list = doc[ids[0]] = doc[ids[0]] || {},  
		    method = list[ids[1]] = list[ids[1]] || {}, pathsName = this._getPathsName(actor), 
		    paths = method[pathsName] = method[pathsName]||[], 
		    path = (actor.type==Model.USER?actor._id: actor._path), index = $.inArray(path, paths);
		if(data.value && (index == -1)){
			paths.push(path);
		}else if(!data.value && index != -1){
			paths.splice(index, 1);
			if(paths.length <= 0){
				delete method[pathsName];
				if($.isEmptyObject(method)){
					delete list[ids[1]];
					if($.isEmptyObject(list)){
//						delete doc[ids[0]];
					}
				}
			}
		}
	},

	_getPathsName:function(actor){
		var pathsName = null;
		if(actor.type == Model.USER){
			pathsName = "users";
		}else	if(actor.type == Model.OU){
			pathsName = "ouPaths";
		}else if(actor.type == Model.GROUP){
			pathsName = "groupPaths";
		}else if(actor.type == Model.ROLE){
			pathsName = "rolePaths";
		}
		return pathsName;
	},
	
	destroy: function() {
		this.element.border("destroy").removeClass("an-authorization");
		$.ui.dialog.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
