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

$.widget( "an.sideview", {
	
	_create: function() {
		var self = this, o = this.options, el = this.element;
		
		$('<style type="text/css">'+(o.stylesheet||"")+'</style>').appendTo(el);
		$.extend(this, eval("try{("+(o.methods||"{}")+")}catch(e){}"));
		var data = {};
		data[this.widgetName] = this;
		$.each(eval("("+(o.actions||"[]")+")"), function(k,action){
			el.bind(action.events, data, action.handler);
		});
		
		this.element.tree({
			checkbox:o.checkbox,
			checkedNodes: o.checkedNodes,
			contentProvider:{
				getRoots: function(mountNodes){
					var sel = {$or:[]};
					$.each((o.roots&&o.roots.split(","))||[], function(){ sel.$or.push({_id:this}); });
					$.ans.getDoc(o.dbId,null,{selector:sel},function(err,data){
						var nodes = [];
						$.each(data.docs||[], function(k, root){
							nodes.push({ id: root._id, text: root.title, data: root, "class": "folder root" });
						});
						mountNodes(nodes);
					});
				},
				getChildren: function(parentNode,mountNodes){
					var d = parentNode.data, sel = {_path:{$regex:'^'+d._path+'[^,]+,$'}}; 
					if(o.showUser&&(d.type == Model.GROUP)){
						sel = {$or:[sel,{type:Model.USER, _groupPaths:d._path}]};
					}else if(!o.showUser){
						sel = {$and:[sel,{type:{$ne:Model.USER}}]};
					}

					$.ans.getDoc(o.dbId,null,{selector:sel},function(err,data){
						var nodes = [];
						$.each(data.docs, function(k, doc){
							nodes.push({ id: doc._id, text: doc.title, data: doc, parent:parentNode, "class": (doc.type == Model.CATEGORY||doc.type == Model.OU||doc.type == Model.GROUP||doc.type == Model. ROLE) ? "folder":"file"});
						});
						mountNodes(nodes);
					});
				},
				hasChildren: function(node){
					var type = node.data.type;
					return type == Model.CATEGORY|| type == Model.OU||type == Model.GROUP||type == Model.ROLE;
				},
				getId: function(node){
					return node.id ? node.id : null;
				}
			},
			nodeclick:o.nodeclick,
			nodedblclick:o.nodedblclick,
			contextmenu: o.contextmenu,
			drop:function(e,data){self._trigger("drop",null, data);}
		});

		$(document).bind("documentCreated.sideview documentChanged.sideview documentDeleted.sideview", function(e,data){
			$.each($.isArray(data)?data:[data], function(k,v){
				if(e.type == "documentCreated" && v._path){
					var ids = v._path.split(","), id = ids[ids.length-3];
					self.refresh(id);
				}else{
					self.refresh(v._id);
					self.refresh(Model.GROUP_ROOT); // TODO: optimize the refreshing of sideview GROUP_ROOT.
				}
			});
		});
	},

	option: function(key, value) {
		var el = this.element;
		if(key == "checkedNodes" && value === undefined){
			return el.tree("option", "checkedNodes");
		}else if(key === "roots" && value === undefined){
			return el.tree("option", "roots");
		}else if(key === "selectedNodes" && value === undefined){
			return el.tree("option", "selectedNodes");
		}
		
		return $.Widget.prototype.option.apply(this, arguments);
	},
	
	refresh: function(nodeId){
		this.element.tree("refresh",nodeId);
	},
	
	add:function(nodeId, node){
		this.element.tree("add",nodeId, node).tree("refresh", node.id);
	},
	
	"delete": function(nodeId){
		this.element.tree("delete",nodeId);
	},
	
	expand:function(nodeId){
		this.element.tree("expand",nodeId);
	},
	
	collapse:function(nodeId){
		this.element.tree("collapse",nodeId);
	},
	
	destroy: function() {
		$(document).unbind(".sideview");
		$.Widget.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );