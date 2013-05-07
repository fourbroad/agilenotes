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

$.widget( "an.tabsxwidget", $.an.widget, {

	_create: function() {
		$.an.widget.prototype._create.apply(this, arguments);
		var self = this, o = this.options, el = this.element, c = this.content, ul = c.children("ul");
		el.addClass("an-tabsxwidget");
		if(ul.length <= 0) ul = $("<ul/>").appendTo(c);
		c.tabsx({
			tabTemplate: "<li><a href='#{href}' hidefocus='true'>#{label}</a></li>",
			destroyTabs: false,
			duration: o.duration,
			slideshow: o.slideshow,
			fxs: eval("(" + o.fx + ")"),
			mode: o.mode
		}).bind("contextmenu2.tabsxwidget contextmenu.tabsxwidget",function(e){
        	if((o.contextmenu2 && e.type == "contextmenu2")
        			||(!o.contextmenu2 && e.type == "contextmenu")){
        		var t = $(e.target), actions = {}, index = t.closest("li").index(), ul = t.closest("ul");
    			if(o.mode == "design"){
    				actions["add"] = {type: "menuItem",text: "Add Tab",handler: function(){self.insertTab(index);}};
    				if(ul.size() != 0){
        				actions["edit"] = {type: "menuItem",	text: "Edit Tab",	handler: function(){self.editTab(index);}};
        				actions["del"] = {type: "menuItem",text: "Delete Tab",handler: function(){self.removeTab(index);}};
    				}
    			}

        		if(!$.isEmptyObject(actions)){
        			t.menu({
        				autoShow: true,
        				menuPosition:{ of: e, my: "left top", at: "left bottom"	},
        				actions: actions,
        				select: function(e,ui){	$(this).menu("destroy");	},
        				collapseAll: function(e){	$(this).menu("destroy");	}
        			});
        		}
        		e.preventDefault();
        	}
		});
		
		this._updateContentHeight();
		
		if(o.mode == "design"){
			this._contentEditable(true);
		}
	},

	selectable:function(e){
		return e.target == this.content.children(".ui-tabs-nav")[0]||e.target==this.element[0];
	},
	
	select: function(id){
		this.content.tabsx("select",id);
	},
	
	_updateContentHeight:function(){
		var o = this.options, c = this.content, css = {}, ul = c.children("ul");
		if(o.minHeight){
			css["min-height"] = o.minHeight-ul.outerHeight(true)-16;
		}else if(o.height){
			css.height = o.height-ul.outerHeight(true)-16;
		}
		c.children(".ui-tabs-panel").css(css);
	},
	
	_doEditTab:function(index, isNew){
		var self = this, o = this.options, c = this.content, doc = {}, a, p;
		if(!isNew){
			a = c.children("ul").find("li").eq(index).children("a");
			doc.id = a.attr("href").substring(1);
			doc.label=a.html();
			p = c.find("#"+doc.id);
		}
		$("<div/>").dialog({
			title:isNew ? "Insert Tab" : "Edit Tab",
			height: 400,
			width: 500,
			modal: true,
			create: function(event, ui){
				var $this = $(this);
				$.ans.getDoc(o.dbId, "50a4f883d6c6603d0a000018", null, function(err,form){
					$this.editor({document:doc, forms:[form] ,dbId:o.dbId, ignoreEscape:true, mode:"edit"});
				});

			},
			buttons: {
				OK: function() {
					var $this = $(this), doc = $this.editor("option","document");
					if(isNew){
						c.tabsx("add","#"+doc.id, doc.label, index);
						self._updateContentHeight();
						c.children("#"+doc.id)[0].contentEditable=true;
					}else{
						a.attr("href","#"+doc.id).html(doc.label);
						p.attr("id", doc.id);
					}
					self.element.trigger("contentchange");
					$this.dialog("close");
				},
				Cancel: function(){ $( this ).dialog( "close" );}
			},
			close:function(e, ui){$(this).remove();}
		});
	},
	
	insertTab:function(index){
		if(index <0 || index >this.content.tabsx("length")) index = this.content.tabsx("length");
		this._doEditTab(index, true);
	},
	
	editTab:function(index){
		if(index >= 0 && index < this.content.tabsx("length")) this._doEditTab(index);
	},
	
	removeTab:function(index){
		this.content.tabsx("remove",index).trigger("contentchange");
	},
	
	_browser:function(){
		this.option("contextmenu2", false);
		this._contentEditable(false);
	},
	
	_edit:function(){
		this.option("contextmenu2", false);
		this._contentEditable(false);
	},
	
	_design:function(){
		this.option("contextmenu2", true);
		this._contentEditable(true);
	},
	
	_contentEditable:function(editable){
		this.content.children(".ui-tabs-panel").each(function(){
			this.contentEditable = editable;
		});
	},
	
	destroy: function() {
		this.content.children(".ui-tabs-panel").css({height:"", "min-height":""});
		this.content.tabsx("destroy");
		this.element.unbind(".tabsxwidget").removeClass("an-tabsxwidget");
		return $.an.widget.prototype.destroy.apply(this, arguments);;
	}
});
})( jQuery );
