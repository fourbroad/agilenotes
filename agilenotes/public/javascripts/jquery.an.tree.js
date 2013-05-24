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

$.widget( "an.tree", {
	options: {
		draggable: true,
		droppable: true,
		labelProvider:{
			getText: function(node){ return node.text; },
			getClass: function(node){ return node["class"];}
		}
	},

	_create: function() {
		var self = this, el = this.element, o = this.options;
		el.addClass("an-tree").empty();
		o.contentProvider = o.contentProvider || this._defaultContentProvider();
		this._loadChildren(el);
		el.delegate(".hitarea","click.tree",function(){
			var li = $(this).parent();
			self['_do'+(li.is(".expandable") ? "Expand" : "Collapse")](li);
		}).delegate("li>span","hover.tree",function(e){
			$(this).toggleClass("ui-state-hover");
			self._trigger("nodehover",e,$(this).closest("li").data("node"));
		}).delegate("li>span","click.tree contextmenu.tree",function(e){
			el.find("li>span.selected").removeClass("selected");
			$(this).addClass("selected");
			if(e.type=="click"){
				self._trigger("nodeclick",e,$(this).closest("li").data("node"));
			}else if(e.type=="contextmenu"){
				self._trigger("contextmenu",e,$(this).closest("li").data("node"));
			}
		}).delegate("li>span","dblclick.tree",function(e){
			self._trigger("nodedblclick",e,$(this).closest("li").data("node"));
		});
	},

	_defaultContentProvider: function(){
		return {
			getRoots: function(){ return []; },
			getChildren: function(parentNode){ return []; },
			hasChildren: function(node){ return false; },
			getId: function(node){ return node.id ? node.id: null;}
		};;
	},
	
	refresh: function(nodeId){
		var self = this;
		if(nodeId){
			var li = this.element.find("#"+nodeId);
			if(li.length){
				var o = this.options, lp = o.labelProvider, cp = o.contentProvider, 
				    id = li.attr("id"), parent = li.parent().closest("li");
				function mountNodes(nodes){
					var hit = null;
					for(var i in nodes){ if(id == nodes[i].id){ hit = i; break; } }
					if(hit!=null){
						li.data("node",nodes[hit]).addClass(lp.getClass(nodes[hit])).children("span")
						    .html(lp.getText(nodes[hit]));
						if(li.is(".expandable")){
							li.addClass("stale");
						}else if(li.is(".collapsable")){
							self._loadChildren(li);
						}
					}else{
						li.remove();
					}
				}

				if(parent.length){
					cp.getChildren(parent.data("node"),mountNodes);
				}else{
					cp.getRoots(mountNodes);
				}
			}
		}else{
			this._loadChildren(this.element);
		}
	},

	add:function(nodeId, node){
		this._addNode(this.element.find("#"+nodeId).children("ul"), node);	
	},
	
	"delete":function(nodeId){
		var li = this.element.find("#"+nodeId);
		if(li.is(".last")) li.prev().addClass("last");
		li.remove();
	},
	
	expand:function(nodeId){
		var li = this.element.find("#"+nodeId);
		if(li.length > 0) this._doExpand(li);
	},
	
	collapse:function(nodeId){
		var li = this.element.find("#"+nodeId);
		if(li.length >= 0) this._doCollapse(li);
	},

	_doExpand:function(li){
		if(li.is(".expandable.stale")) {
			this._loadChildren(li);
		}else if(li.is(".expandable")){
			li.children("ul").show();
			li.removeClass("expandable").addClass("collapsable");
		}
	},
	
	_doCollapse:function(li){
		if(li.is(".collapsable")){
			li.children("ul").hide();
			li.removeClass("collapsable").addClass("expandable");
		}
	},
	
	_addNode:function(parent, node){
		var self = this, o = this.options, lp = o.labelProvider, cp = o.contentProvider, 
		    id=cp.getId(node), text = lp.getText(node), li = $("<li/>").addClass(lp.getClass(node)).attr("id",id);
		if(o.checkbox){
			$("<input type='checkbox'/>").prop("checked", $.inArray(id,o.checkedNodes) !=-1).appendTo(li);
		}
		$("<span/>").addClass(lp.getClass(node)).html(text).appendTo(li);
		if(cp.hasChildren(node)){
			li.addClass("expandable stale").prepend("<div class='hitarea'/>");
			var droppable = $.type(o.droppable) == "function" ? o.droppable(node) : o.droppable;
			if(droppable){
				li.children("span").droppable({ greedy: true, hoverClass:"ui-state-hover", drop:function(event, ui ){
					self._trigger("drop",null, {source: ui.draggable.data("node"), target:node});
				}});
			}
		}
		parent.children("li.last").removeClass("last");
		li.data("node",node).addClass("last").appendTo(parent);
		
		var draggable = $.type(o.draggable) == "function" ? o.draggable(node) : o.draggable;
		if(draggable){
			li.draggable({ appendTo: "body", helper: "clone" , scroll:true, distance: 20, scrollSensitivity:100, zIndex:9999});
		}
	},
	
	_loadChildren: function(parent){
		var self = this, o = this.options, ul = parent.children("ul"), cp = o.contentProvider||this._defaultContentProvider();
		if(ul.length == 0) ul = $("<ul/>").appendTo(parent);
		
		var ids = [];
		ul.find(".collapsable").each(function(){
			ids.push($(this).attr("id"));
		});
		ul.empty();
		
		var hitarea = parent.children(".hitarea").addClass("loading");
		function mountNodes(nodes){
			$.each(nodes,function(k,v){
				self._addNode(ul,v);
			});
			
			parent.removeClass("expandable stale").addClass("collapsable");
			for(var i in ids) self.expand(ids[i]);
			hitarea.removeClass("loading");
		}
		
		if(parent[0] == this.element[0]){
			cp.getRoots(mountNodes);
		}else{
			cp.getChildren(parent.data("node"),mountNodes);
		}
	},
	
	option: function(key, value) {
		if(key == "checkedNodes" && value === undefined){
			var nodes = [];
			$("input:checked", this.element).each(function(){
				nodes.push($(this).closest("li").data("node"));
			});
			return nodes;
		}else if(key === "roots" && value === undefined){
			var roots = [];
			this.element.children("ul").children("li").each(function(){
				roots.push($(this).attr("id"));
			});
			return roots;
		}else if(key === "selectedNodes" && value === undefined){
			var nodes = [];
			this.element.find(".selected").each(function(){
				nodes.push($(this).closest("li").attr("id"));
			});
			return nodes;
		}
		
		return $.Widget.prototype.option.apply(this, arguments);
	},
	
	_setOption: function( key, value ) {
		$.Widget.prototype._setOption.apply(this, arguments );
		var self = this, el = this.element;
		if ( key === "contentProvider" ) {
			this._loadChildren(this.element);
		}else if(key === "checkedNodes"){
			$.each(value,function(k,v){
				$("#"+v + " input",self.element).prop("checked",true);
			});
		}else if(key === "selectedNodes"){
			$.each(value,function(k,v){
				el.find("li>span.selected").removeClass("selected");
				el.find("li#"+v+">span").addClass("selected");
			});
		}
		return this; 
	},
	
	destroy: function() {
		this.element.undelegate(".hitarea",".tree").undelegate("li>span",".tree").removeClass( "an-tree" );
		$.Widget.prototype.destroy.apply(this, arguments);
	}
});
})( jQuery );
