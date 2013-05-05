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

$.widget( "an.box", $.an.widget, {
	options:{
		visibleButtonCount: 3,
		height: "auto",
		link: "raw" // raw, documentType, document, form, view, page
	},

	_create: function() {
		$.an.widget.prototype._create.apply(this, arguments);
		var o = this.options, el = this.element;
		el.addClass("an-box ui-corner-all").addClass(o.link == "raw"? "raw":"link").children(".title-bar").remove();
		
		this._showTitleBar(!o.hideTitleBar);
		this._showFootButtons(o.footAreaButtons||[]);
		
		el.bind("contextmenu2.box contextmenu.box",function(e){
        	if((o.contextmenu2 && e.type == "contextmenu2")
        			||(!o.contextmenu2 && e.type == "contextmenu")){
        		var actions = {};
    			if(o.mode == "design"){
    				actions["select"] = {type: "menuItem",text: "Select",handler: function(){el.trigger("click");}};
    			}
        		if(!$.isEmptyObject(actions)){
        			$(e.target).menu({
        				autoShow: true,
        				menuPosition:{ of: e, my: "left top", at: "left bottom"	},
        				actions: actions,
        				select: function(e,ui){	$(this).menu("destroy");	},
        				collapseAll: function(e){	$(this).menu("destroy");	}
        			});
        		}
        	}
        	e.preventDefault();
	    });
	},
	
	selectable:function(e){
		var o = this.options, t = e.target;
		if(o.hideTitleBar){
			return t == this.element[0];
		}else{
			return $(t).closest("div.title-bar")[0] == this.titleBar[0];
		}
	},
	
	_showTitleBar:function(show){
		var o = this.options, el = this.element;
		if(show){
			el.addClass("title-bar");
			if(!this.titleBar){
				this.titleBar = $("<div class='title-bar ui-widget-header ui-corner-top'/>").prependTo(this.element);
				this.title = $("<div class='title'/>").html(o.title).appendTo(this.titleBar);
				this.toolbar = $("<div class='toolbar'/>").appendTo(this.titleBar);
			}
			this._refreshToolbarButtons();
		}else{
			el.removeClass("title-bar");
			this.titleBar && this.titleBar.remove();
			delete this.titleBar;
		}
	},
	
	_refreshToolbarButtons: function(){
		var self = this, o = this.options, btns = o.toolbarButtons||[];
		$.each(btns, function(k,btn){
			if(k >= o.visibleButtonCount) return false;
			$("<button class='title-button'/>").appendTo(self.toolbar).button({label:btn.label}).click(function(e){
				self.element.trigger("boxtoolbarbuttonclick",[self, btn.id]);
				e.preventDefault();
				e.stopImmediatePropagation();
			});
		});
		if(btns.length > o.visibleButtonCount){
			var items = [];
			for(var i = o.visibleButtonCount; i < btns.length; i++){
				items.push({
					id: btns[i].id,
					type: "menuItem",
					text: btns[i].label,
					handler:function(){self.element.trigger("toolbarbuttonclick", [self, this.id]);},
					enabled:function(){return true;}
				});
			}
			var sysMenu = $("<button class='box-menu'/>").button({label:"Box Menu",text:false, icons:{primary: "box-menu-icon"}}).appendTo(self.toolbar);
			sysMenu.menu({
				triggerEvent:"click",
				menuPosition:{ of:sysMenu, my: "right top", at: "right bottom"},
				actions: items,
				select: function(){ $(this).menu("collapseAll");}
			}).click(function(e){e.preventDefault();}).blur(function(e){sysMenu.menu("collapseAll");});	
		}
	},
	
	_showFootButtons:function(buttons){
		var self = this, el = this.element;
		if(buttons && buttons.length > 0){
			if(!this.footArea){
				el.addClass("foot-area");
				this.footArea = $("<div class='foot-area'/>").appendTo(el);
			}else{
				this.footArea.empty();
			}
			$.each(buttons, function(k,btn){
				$("<button class='foot-button'/>").attr("id",btn.id).html(btn.label).prependTo(self.footArea).button().click(function(e){
					self.element.trigger("boxfootareabuttonclick",[self, btn.id]);
					e.preventDefault();
					e.stopImmediatePropagation();
				});
			});
		}else{
			el.removeClass("foot-area");
			this.footArea && this.footArea.remove();
			delete this.footArea;
		}
	},

	newDocument:function(typeId, opts){
		opts = opts || {};
		var self = this, o = this.options, dbId = opts.dbId || o.dbId,
		    el = $("<div class='target'/>").appendTo(this.content.empty()),
		    optsx = $.extend(true,{},opts,{
				opened:function(editor){
					var doc = editor.option("document"), title = opts.title || doc.title || doc._id;
					self._showFootButtons(opts.footAreaButtons||[]);
					self.option("title", title);
					opts.opened && opts.opened(editor);
				}
		    });
		Model.newDocument(el, dbId, typeId, optsx);
		return this;
	},

	openDocument:function(docId, opts){
		opts = opts || {};
		var self = this, o = this.options, dbId = opts.dbId || o.dbId,
	        el = $("<div class='target'/>").appendTo(this.content.empty()),
	        optsx = $.extend(true, {}, opts,{
	    		opened:function(editor){
	    			var doc = editor.option("document"), title = opts.title || doc.title || doc._id;
	    			self._showFootButtons(opts.footAreaButtons||[]);
	    			self.option("title", title);
	    			opts.opened && opts.opened(editor);
	    		}
	        });
		Model.openDocument(el, dbId, docId, optsx);
		return this;
	},
	
	saveDocument:function(opts){
		opts = opts || {};
		var widget = this.linkedWidget();
		if(widget && widget.option("isDocumentEditor")){
			widget.save(opts);
		}
		return this;
	},

	openForm:function(formId, opts){
		opts = opts || {};
		$.extend(true,opts,{isFormEditor:true});

		var self = this, o = this.options, dbId = opts.dbId || o.dbId,
	        el = $("<div class='target'/>").appendTo(this.content.empty()),
	        optsx = $.extend(true, {mode:"edit"}, opts, {
	        	opened: function(editor){
	    			var form = editor.option("currentForm"), title = opts.title || form.title || form._id;
	    			self._showFootButtons(opts.footAreaButtons||[]);
	    			self.option("title", title);
	    			opts.opened && opts.opened(editor);
	    		}
	        });
		Model.openPage(el, dbId, formId, optsx);
		return this;
	},

	openView:function(viewId, opts){
		opts = opts || {};
		var self = this, o = this.options, dbId = opts.dbId || o.dbId,
	        el = $("<div class='target'/>").appendTo(this.content.empty()),
	        optsx = $.extend(true, {}, opts, {
	        	opened: function(view){
	    			var v = view.option("view"), title = opts.title || v.title || v._id;
	    			self._showFootButtons(opts.footAreaButtons||[]);
	    			self.option("title", title);
	    			opts.opened && opts.opened(view);
	    		}	        	
	        });
		Model.openView(el, dbId, viewId, optsx);
		return this;
	},

	openPage:function(pageId, opts){
		opts = opts || {};
		$.extend(true,opts,{isPageEditor:true});
		
		var self = this, o = this.options, dbId = opts.dbId || o.dbId,
	        el = $("<div class='target'/>").appendTo(this.content.empty()),
	        optsx = $.extend(true, {mode:"edit"}, opts,{
	        	opened: function(page){
	    			var p = page.option("page"), title = opts.title || p.title || p._id;
	    			self._showFootButtons(opts.footAreaButtons||[]);
	    			self.option("title", title);
	    			opts.opened && opts.opened(page);
	    		}
	        });
		Model.openPage(el, dbId, pageId, optsx);
		return this;
	},
	
	openSideView: function(sideViewId, opts){
		opts = opts || {};
		var self = this, o = this.options, dbId = opts.dbId || o.dbId,
		    el = $("<div class='target'/>").appendTo(this.content.empty()),
		    optsx = $.extend(true, {},opts, {
		    	opened:function(sideView){
					var title = opts.title || sideView.option("title") || sideView.option("_id");
					self._showFootButtons(opts.footAreaButtons||[]);
					self.option("title", title);
					opts.opened && opts.opened(page);
				}
		    });
		Model.openSideView(el, dbId, sideViewId, optsx);
		return this;
	},

	_browser:function(){
		var o = this.options, link = o.link;
		this.option("contextmenu2", false);
		this.content[0].contentEditable = false;
		if(link && link != "raw"){
			var target = this.content.children(".target"), data = target.data(), hit = false;
			for(var i in data){
				if($.inArray(i, ["editor","gridview", "formview", "page", "sideview","outline"]) != -1){
					data[i].option("mode", "browser");
					hit = true;
				}
			}
			if(!hit){
				var opts = {dbId:o.odbId||o.dbId}, id = o.targetId;
				if(link == "documentType"){
					this.newDocument(id, opts);
				}else if(link == "document"){
					this.openDocument(id, opts);
				}else if(link == "form"){
					this.openForm(id, opts);
				}else if(link == "view"){
					this.openView(id, opts);
				}else if(link == "page"){
					this.openPage(id, opts);
				}else if(link == "sideView"){
					this.openSideView(id, opts);
				}
			}
		}
	},
	
	linkedWidget:function(){
		var data = this.content.children(".an-gridview,.an-formview,.an-page,.an-editor").data(), 
		    widget = null;
		$.each(data,function(){
			if($.inArray(this.widgetName,["editor","gridview","formview","page"]) != -1){
				widget = this;
				return false;
			}
		});
		return widget;
	},

	_edit:function(){
		var o = this.options, link = o.link;
		this.option("contextmenu2", false);
		this.content[0].contentEditable = false;
		if(link && link != "raw"){
			var target = this.content.children(".target"), data = target.data(), hit = false;
			for(var i in data){
				if(i == "editor"){
					data[i].option("mode", "edit");
					hit = true;
				}
				if($.inArray(i, ["gridview", "formview", "page", "sideview","outline"]) != -1){
					data[i].option("mode", "browser");
					hit = true;
				}
			}
			if(!hit){
				var id = o.targetId, ob = {dbId:o.odbId||o.dbId}, oe = {mode:"edit",dbId:o.odbId||o.dbId};
				if(link == "documentType"){
					this.newDocument(id, oe);
				}else if(link == "document"){
					this.openDocument(id, oe);
				}else if(link == "form"){
					this.openForm(id, oe);
				}else if(link == "view"){
					this.openView(id, ob);
				}else if(link == "page"){
					this.openPage(id, oe);
				}else if(link == "sideView"){
					this.openSideView(id, ob);
				}
			}
		}
	},
	
	_design:function(){
		var o = this.options, link = o.link;
		this._browser();
		this.option("contextmenu2", true);
		if(link == "raw"){
			this.content[0].contentEditable = true;
		}
	},

	_handleChange:function(key, value, oldValue){
		if(key === "title"){
			this.title && this.title.html(value);
		}else if(key ==="hideTitleBar"){
			this._showTitleBar(!value);
		}
		return $.an.widget.prototype._handleChange.apply(this, arguments);
	},
	
	destroy: function() {
		var o = this.options, link = o.link;
		if(link && link != "raw"){
			this.content.remove();
		}else{
			this.content.removeAttr("contenteditable");
		}
		this.titleBar&&this.titleBar.remove();
		this.footArea && this.footArea.remove();
		this.element.unbind(".box").removeClass("an-box ui-corner-all title-bar");
		return $.an.widget.prototype.destroy.apply(this, arguments);
	}
});

})( jQuery );
