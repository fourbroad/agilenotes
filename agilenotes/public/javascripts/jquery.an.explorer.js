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

$.widget( "an.explorer", $.an.tree, {
	
	_create: function() {
		$.an.tree.prototype._create.apply(this, arguments);
		var self = this;
		$(document).bind("documentCreated.explorer documentChanged.explorer documentDeleted.explorer", function(e,data){
			$.each($.isArray(data)?data:[data], function(k,v){
				if(e.type == "documentCreated" && v._path){
					var ids = v._path.split(","), id = ids[ids.length-3];
					self.refresh(id);
				}else{
					self.refresh(v._id);
					self.refresh(Model.GROUP_ROOT); // TODO: optimize the refreshing of explorer GROUP_ROOT.
				}
			});
		});
	},

	_defaultContentProvider: function(){
		var o = this.options;
		return {
			getRoots: function(mountNodes){
				var sel = {$or:[]};
				$.each(o.roots, function(){ sel.$or.push({_id:this}); });
				$.ans.getDoc(o.dbId,null,{selector:sel},function(err,data){
					var nodes = [];
					$.each(data.docs||[], function(k, root){
						nodes.push({ id: root._id, text: root.title, data: root, "class": "folder root" });
					});
					mountNodes(nodes);
				});
			},
			getChildren: function(parentNode,mountNodes){
				var d = parentNode.data, sel; 
				if(d._id == Model.EXTENSION_ROOT){
					sel = {type:Model.EXTENSION_POINT};
				}else if(d.type==Model.EXTENSION_POINT){
					sel = {extensionPoint:d._id};
				}else{
					sel = {_path:{$regex:'^'+d._path+'[^,]+,$'}};
					if(o.showUser&&(d.type == Model.GROUP)){
						sel = {$or:[sel,{type:Model.USER, _groupPaths:d._path}]};
					}else if(!o.showUser){
						sel = {$and:[sel,{type:{$ne:Model.USER}}]};
					}
				}

				$.ans.getDoc(o.dbId,null,{selector:sel},function(err,data){
					var nodes = [];
					$.each(data.docs, function(k, doc){
						nodes.push({ id: doc._id, text: doc.title, data: doc, parent:parentNode, "class": (doc.type == Model.CATEGORY||doc.type == Model.OU||doc.type == Model.GROUP||doc.type == Model. ROLE||doc.type==Model.EXTENSION_POINT) ? "folder":"file"});
					});
					mountNodes(nodes);
				});
			},
			hasChildren: function(node){
				var type = node.data.type;
				return type == Model.CATEGORY|| type == Model.OU||type == Model.GROUP||type == Model.ROLE||type==Model.EXTENSION_POINT;
			},
			getId: function(node){
				return node.id ? node.id : null;
			}
		};
	},
	
	destroy: function() {
		$(document).unbind(".explorer");
		$.an.tree.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );