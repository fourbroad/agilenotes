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

$.widget( "an.rte", {
	options: {
		doctype: '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">',
		cssFiles: [],
		jsFiles: [],
		mode: "design", // "design","sourcecode"
		lang: 'en',
		absoluteURLs: true,
		styleWithCSS: false,
		history:[],
		undoable:false,
		redoable:false,
		formIds:{
			standard:"5080143085ac60df09000001",
			link: "508251eb0b27990c0a000001",
			image:"5082d29f0b27990c0a000005",
			table:"5085f383eeeac1e909000001",
			cell:"5086b873eeeac1e909000002",
			tabsx:["5080143085ac60df09000001","51306faad58d1c129f000000"]
		}
	},

	_create: function() {
		var self = this, o = this.options, el = this.element;
		el.addClass("an-rte").empty();
		this.url = this._parseURL(window.location.href);
		this.lang = (''+o.lang);
		o.iframe = $('<iframe/>').addClass("container").attr({frameborder:0}).appendTo(el);

		o.win = o.iframe[0].contentWindow;
		var doc = (o.doc = o.win.document);
		
		if(o.resizable) el.resizable();
		this.source = $("<textarea class='content'/>").appendTo(el);
		this.source[o.mode=="sourcecode"?"show":"hide"]();

		o.actions = this._createActions();
		
		$(o.win).bind("focus.rte blur.rte",function(e){
			self._trigger(e.type, e, el);
		});
		
		$(doc).bind('dragend.rte', function(e) {
			setTimeout(function() {
				try {
					o.win.focus();
					sel.moveToBookmark(sel.getBookmark());
					self.updatePath();
				} catch(e) { }
			}, 200);
		});
		
		o.iframe.load(function(){
			var body = $(this).contents().find("body")[0];
			// make iframe editable.
			if ($.browser.msie) {
				body.contentEditable = true;
			} else {
				try {
					body.contentEditable = true; 
					//doc.designMode = "on";
					doc.execCommand('styleWithCSS', false, o.styleWithCSS);
				}catch(e){}
			}
			
			if (o.mobile) {
				var iself = this;
				this.width = "100%";
				setTimeout(function() {
					var bHeight = iself.contentWindow.document.body.scrollHeight;
					var dHeight = iself.contentWindow.document.documentElement.scrollHeight;
					var height = Math.max(bHeight, dHeight);
					iself.height = height; 
				}, 500);
			}

			self.$body = $(body);
			if(o.cssClass) self.$body.addClass(o.cssClass);
			//o.history.push(self.$body.html());
			//self.htStep=o.history.length-1;
			o.onload&&o.onload();
			o.restore && o.restore(self.$body);
			self._restore();
		});
		
		/* put content into iframe */
		var html = '<html xmlns="http://www.w3.org/1999/xhtml"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />';
		$.each(o.cssFiles, function() {
			html += "<link rel='stylesheet' type='text/css' href='"+this+"'/>";
		});
		$.each(o.jsFiles,function(){
			html +="<script type='text/javascript' language='javascript' src='"+this+"'></script>";
		});
		
		/*if (o.mobile && o.modelType === 'page') {
			html += '<script src="javascripts/jquery.mobile-1.3.1.js"></script>\
				<link rel="stylesheet" href="stylesheets/jquery.mobile-1.3.1.min.css" type="text/css">';
		}*/
		html += '<style id="stylesheet" type="text/css">'+(o.stylesheet||"")+'</style>';

		doc.open();
		doc.write(o.doctype+html+'</head><body>'+$.trim(o.content||"")+'</body></html>');
		doc.close();

		o.dom       = new rteDom(this);
		o.selection = new rteSelection(this);
		this.showToolbar(o.showToolbar);
		this.source.bind("change.rte keyup.rte",function(e){
			e.preventDefault();
			e.stopImmediatePropagation();
			self.element.trigger("change");
		}).bind('keydown.rte', function(e) { // on tab press - insert \t and prevent move focus
			if (e.keyCode == $.ui.keyCode.TAB) {
				e.preventDefault();
				if ($.browser.msie) {
					var r = document.selection.createRange();
					r.text = "\t"+r.text;
					this.focus();
				} else {
					var value = this.value, before = value.substr(0, this.selectionStart), 
					    after = value.substr(this.selectionEnd);
					this.value = before+"\t"+after;
					this.setSelectionRange(before.length+1, before.length+1);
				}
			}
		});

		/* update buttons on click and keyup */
		var mouseStatus = null;
		$(doc).bind('keydown.rte', function(e) {
			var sel = o.selection;
			if (e.keyCode == 13) {  // Enter
				var n = sel.getNode();
				if (o.dom.selfOrParent(n, /^PRE$/)) {
					sel.insertNode(o.doc.createTextNode("\r\n"));
				} else if ($.browser.safari && e.shiftKey) {
					sel.insertNode(o.doc.createElement('br'));
				}
			}
			if (e.keyCode == 32 && $.browser.opera) { // Space
				sel.insertNode(o.doc.createTextNode(" "));
			}
			
			if ((e.keyCode>=48 && e.keyCode <=57) || e.keyCode==61 || e.keyCode == 109
				|| (e.keyCode>=65 && e.keyCode<=90) || (e.keyCode>=188&&e.keyCode<=190) 
				|| e.keyCode==191 || (e.keyCode>=219 && e.keyCode<=222) 
				|| e.keyCode == 8 || e.keyCode == 46 || e.keyCode == 32 || e.keyCode == 13) {
				self.element.trigger("change");
			}
			if ((e.keyCode >= 8 && e.keyCode <= 13) || (e.keyCode>=32 && e.keyCode<= 40) 
					|| e.keyCode == 46 || (e.keyCode >=96 && e.keyCode <= 111)
					||(e.keyCode == 65)&&(e.metaKey || e.ctrlKey)) {
				self.updatePath();
			}
			self.element.trigger(e);
		}).bind("contextmenu.rte",function(e){
			e.preventDefault();
			e.stopImmediatePropagation();
			var offset = o.iframe.offset(), pageX = offset.left+e.clientX, pageY = offset.top+e.clientY,
			      ev = $.extend($.Event(),{type:"contextmenu2",pageX:pageX,pageY:pageY});
			$(doc).find(e.target).trigger(ev);
		}).bind('paste.rte', function(e) {
			if (o.denyPaste) {
				e.stopPropagation();
				e.preventDefault();
			}
		}).bind("mousedown.rte",function(e){
			mouseStatus = "down";
		}).bind("mousemove.rte",function(e){
			if(mouseStatus == "down"){
				mouseStatus = "moving";
			}
			self.element.trigger(e);
		}).bind('mouseup.rte dblclick.rte', function(e){
			if(mouseStatus == "moving" || e.type == "dblclick"){
				mouseStatus = null;
				self.element.trigger("selectionChanged");
			}
			self.updatePath();
			self.element.trigger(e);
		}).bind("click.rte newwidget.rte contentchange.rte",function(e){
			self.element.trigger(e);
		}).bind("treenodeclick.rte",function(e,node){
			self.element.trigger(e,node);
		});
		if ($.browser.msie) {
			$(doc).bind('keyup.rte', function(e) {
				var sel = o.selection;
				if (e.keyCode == 86 && (e.metaKey||e.ctrlKey)) { // Ctrl + v
					sel.saveIERange();
					o.content  = self.$body.html();
					sel.restoreIERange();
					self.$body.mouseup();
					self.updatePath();
				}
			});
		}
		
		if ($.browser.safari) {
			$(doc).bind('click.rte', function(e) {
				content.find('.rte-webkit-hl').removeClass('rte-webkit-hl');
				if (e.target.nodeName == 'IMG') {
					$(e.target).addClass('rte-webkit-hl');
				}
			}).bind('keyup.rte', function(e) {
				content.find('.rte-webkit-hl').removeClass('rte-webkit-hl');
			});
		}
		
		
		o.win.focus();
	},
	
	option: function( key, value ) {
		if(/^can.*/.test(key)){
			this.options[key] = this['_'+key]?this['_'+key]():false;
		}
		if(key === "actionSets" && value === undefined){
			return this._createActionSets();
		}else	if(key === "content" && value === undefined){
			return this._getContent();
		}
		return $.Widget.prototype.option.apply(this, arguments );
	},
	
	_setOption: function( key, value ) {
		var o = this.options, oldValue = this.option(key);
		if(!equals(value,oldValue)){
			$.Widget.prototype._setOption.apply(this, arguments );
			if(key == "mode"){
				if(value == "design"){
					o.iframe.show();
					this.$body.html(this.source.hide().val());
					o.restore && o.restore(this.$body);
					this._restore();
					o.win.focus();
				}else {
					o.clean && o.clean(this.$body);
					this._clean();
					this.source.val(this.$body.html()).show();
					o.iframe.hide();
					if ($.browser.msie) {
						// @todo
					} else {
						this.source[0].setSelectionRange(0, 0);
					}
				}
			}else if(key == "content"){
				if(o.mode == "design"){
					this.$body.html(value);
				}else if(o.mode == "sourcecode"){
					this.source.val(value);
				}
			}else if(key == "stylesheet"){
				$(o.doc).find("#stylesheet").text(value);
			}else	if(key == "height"){
				this.element.css("height",value);				
			}else if(key == "width"){
				this.element.css("width",value);				
			}else if(key == "showToolbar"){
				this.showToolbar(value);
			}else if(key == "path"){
				this.toolbar && this.toolbar.toolbar("refresh");
			}
			this._trigger("optionchanged",null,{key:key, value:value, oldValue:oldValue});
		}
		return this; 
	},
	history:function(){
		var self=this,o=self.options,ht=o.history;
		if(o.mode=="design"){
			clearTimeout(o.historyT);
			o.historyT=setTimeout(function(){
				ht.push(self._getContent());
				self.htStep=ht.length-1;
				self.option("undoable",true);
			},400);
		}
	},
	undo:function(){
		var self=this,ht=self.options.history;
		if(ht.length<=1)return ;
		self.htStep=self.htStep-1;
		if(self.htStep<0){
			self.htStep=0;
		}
		self.$body.html(ht[self.htStep]);
		self._restore();
		self.option("redoable",true);
		self.htStep==0&&self.option("undoable",false);
	},
	redo:function(){
		var self=this,ht=self.options.history;
		if(ht.length<=1)return ;
		self.htStep++;
		if(self.htStep>(ht.length-1)){
			self.htStep=ht.length-1;
		}
		self.$body.html(ht[self.htStep]);
		self._restore();
		self.option("undoable",true);
		(self.htStep==ht.length-1)&&self.option("redoable",false);
		
	},
	showToolbar: function(show){
		if(show){
			if(!this.toolbar){
				var self = this, o = this.options;
				this.toolbar = $("<div/>").toolbar({actionSets: this._createActionSets()}).prependTo(this.element);
				function adjustHeight(){
					if(self.toolbar.is(":visible")){
						var height = self.element.height()-self.toolbar.outerHeight(true);
						o.iframe.css({height: height});
						self.source.css({height: height});
					}
				}
				adjustHeight();
				this._proxy = $.proxy(function(e){ adjustHeight(); },this);
				$(window).bind("resize.rte", this._proxy);
			}
		}else{
			if(this.toolbar){
				$(window).unbind("resize.rte", this._proxy);
				this.toolbar.remove();
				delete this.toolbar;
			}
		}
	},
	
	_getContent:function(){
		var o = this.options, content = o.content;
		if(o.mode == "design" && this.$body){
			o.clean && o.clean(this.$body);
			this._clean();
			content = this.$body.html();
			o.restore && o.restore(this.$body);
			this._restore();
		}else if(o.mode == "sourcecode"){
			content = this.source.val();
		}
		return content;
	},
	_clean:function(){
		$('table',this.$body).each(function(){
			if($(this).data('resizable')){
				$(this).data('resizable').destroy();
			}
		});
		$("img",this.$body).unbind('dblclick');
		
		this.$body.find(".widget[type=tabsx]").each(function(){
			var tw = $(this).data("tabsxwidget");
			if(tw) tw.destroy();
		});
	},
	_restore:function(){
		var self = this, o = this.options, ids = o.formIds, sel = o.selection;
		$('table',this.$body).resizable({
			stop: function(e, ui) {
				self.element.trigger("contentchange");
				e.preventDefault();
				e.stopImmediatePropagation();
			}
		});
		$("img",this.$body).each(function(){
			var img =this;
			$(this).dblclick(function(){
				var attrs=attributes(img);
				attrs['width']=$(img).css('width').replace(/px/g,'');
				attrs['height']=$(img).css('height').replace(/px/g,'');
				self._showDialog("Image", attrs, [ids.standard,ids.image], function(attrs){
					$.each(attrs, function(k,v){
						if(k=='width'||k=='height'){
							v = $.trim(v)?$img.css(k,v):$img.removeAttr(k); 
						}else{
							v = $.trim(v)?$img.attr(k,v):$img.removeAttr(k);
						}
					});
					if(!img.parentNode) sel.insertNode(img);
					self.element.trigger("contentchange");
				});
			});
		});
		
		this.$body.find(".widget[type=tabsx]").each(function(){
			var $this = $(this);
			if($this.is(".an-tabsxwidget")){
				$this.data("tabsxwidget").option("mode",o.mode);
			}else{
				$this.tabsxwidget({
					parent:function(){return self;},
					mode:o.mode, 
					dbId:o.dbId,
					optionchanged:function(e,data){
						if(data.key == "metadata" || data.key == "attributes"){
							self.element.trigger("contentchange");
						}
					}
				});
			}
		});
	},
	_createActionSets:function(){
		var o = this.options, mode = o.mode;
		if(mode == "design"){
			return [this._controlActionSet(), this._formatActionSet(),
			        this._tableActionSet(), this._widgetActionSet(), this._modeActionSet()];
		}else if(mode == "sourcecode"){
			return [this._modeActionSet()];
		}
	},
	
	_controlActionSet:function(){
		return this._createActionSet(["properties","cleanFormat"]);
	},
	
	_formatActionSet:function(){
		return this._createActionSet(["bold","italic","underline","strikethrough","subscript",
		        "superscript","alignLeft","alignCenter","alignRight","alignFull","font","fontSize",
		        "format","leftToRight","rightToLeft","fontColor","backgroundColor","outdent",
		        "indent","orderedList","unorderedList","link","deleteLink","horizontalRule",
		        "blockQuote","blockElement","stopFloat","image"]);
	},
	
	_tableActionSet:function(){
		return this._createActionSet(["table","tableProps","deleteTable","rowBefore","rowAfter","deleteRow", 
		"columnBefore","columnAfter","deleteColumn", "cellProps","mergeCells",
		"splitCells"]);
	},

	_widgetActionSet:function(){
		return this._createActionSet(["tabsx"]);
	},
	
	_modeActionSet:function(){
		return this._createActionSet(["sourcecode"]);
	},

	_createActionSet:function(as){
		var actions = this.options.actions, actionSet = {};
		$.each(as, function(){
			actionSet[this] = actions[this];
		});
		return actionSet;
	},
	
	// do cut, copy, paste.
	_doCCP: function(op){
			this.addHistory();
			try {
				this.options.doc.execCommand(op, false, null);
			} catch (e) {
				if ($.browser.mozilla){
					var s = ' Ctl + C';
					if (op == 'cut') {
						s = ' Ctl + X';
					} else if (op == 'paste') {
						s = ' Ctl + V';
					}
					$("<div class='rte-dialog'/>").dialog({
						title:"Warning",
						height: 260,
						width: 380,
						modal: true,
						open: function(event, ui){
							$(this).append('This operation is disabled in your browser on security reason. Use shortcut instead.'+': '+s);
						},
						buttons: { OK: function() {$(this).dialog( "close" );} },
						close: function(e, ui){$(this).remove();}
					});
				}else{
					window.console.log('commands failed: '+op);
				}
			}
			this.updatePath();
	},
	
	_canCCP: function(op){
		var o = this.options,ret = false;
		try{
			ret = o.mode == "design" && o.doc.queryCommandEnabled(op);
		}catch (e) {
		};
		return ret;
	},
	
	_canCut: function(){
		return this._canCCP("cut");
	},

	_canCopy: function(){
		return this._canCCP("copy");
	},
	
	_canPaste: function(){
		return this._canCCP("paste");
	},
	
	cut: function(){
		this._doCCP("cut");
	},
	
	copy: function(){
		this._doCCP("copy");
	},
	
	paste: function(){
		this._doCCP("paste");
	},
	
	updatePath: function(cleanCache){
		var o = this.options,sel = o.selection, dom = o.dom;
		cleanCache && sel.cleanCache();
		var n    = sel.getNode(),	 p = dom.parents(n, '*'), rtl = o.rtl, sep  = rtl ? ' &laquo; ' : ' &raquo; ', path = '', i;
		
		function _name(n) {
			var name = n.nodeName.toLowerCase();
			n = $(n);
			if (name == 'img' || name == "div") {
				if(n.is(".widget")){
					var id = n.attr("id");
					if(id) id = id.replace(/-/g,".");
					name = id +" ("+n.attr("type")+")";
				}
			}
			return name;
		}

		if (n && n.nodeType == 1 && n.nodeName != 'BODY') {
			p.unshift(n);
		}

		if (!rtl) {
			p = p.reverse();
		}

		for (i=0; i < p.length; i++) {
			path += (i>0 ? sep : '')+_name(p[i]);
		}
		
		return this.option("path", path);
	},
	
	removeFormat: function(){
		this.options.doc.execCommand("removeformat", false, null);
		return this;
	},
	
    bold: function(){
    	this.options.doc.execCommand("bold", false, null);
		this.element.trigger("contentchange");
		return this;
    },
    
	italic: function(){
    	this.options.doc.execCommand("italic", false, null);
		this.element.trigger("contentchange");
    	return this;
    },
    
	underline: function(){
    	this.options.doc.execCommand("underline", false, null);
		this.element.trigger("contentchange");
    	return this;
    },
    
	strikethrough: function(){
    	this.options.doc.execCommand("strikethrough", false, null);
		this.element.trigger("contentchange");
		return this;
    },
    
	subscript: function(){
    	this.options.doc.execCommand("subscript", false, null);
		this.element.trigger("contentchange");
		return this;
    },
    
	superscript: function(){
    	this.options.doc.execCommand("superscript", false, null);
		this.element.trigger("contentchange");
		return this;
    },
    
    align: function(dir){
    	var o = this.options, s = o.selection.selected({collapsed:true, blocks : true, tag : 'div'}),
		l = s.length;
		while (l--) {
			o.dom.filter(s[l], 'textNodes') && $(s[l]).css('text-align', dir);
		}
		this.element.trigger("contentchange");
		return this;
	},
	
	leftToRight: function(){
		var o = this.options, dom = o.dom,sel = o.selection, n = sel.getNode();
		if ($(n).attr('dir') == 'ltr' || $(n).parents('[dir="ltr"]').length || $(n).find('[dir="ltr"]').length) {
			$(n).removeAttr('dir');
			$(n).parents('[dir="ltr"]').removeAttr('dir');
			$(n).find('[dir="ltr"]').removeAttr('dir');
		} else {
			if (dom.is(n, 'textNodes') && dom.is(n, 'block')) {
				$(n).attr('dir', 'ltr');
			} else {
				$.each(dom.parents(n, 'textNodes'), function(i, n) {
					if (dom.is(n, 'block')) {
						$(n).attr('dir', 'ltr');
						return false;
					}
				});
			}
		}
		this.element.trigger("contentchange");
		return this;
	},
	
	rightToLeft: function(){
		var o = this.options, dom = o.dom, n = o.selection.getNode();
		if ($(n).attr('dir') == 'rtl' || $(n).parents('[dir="rtl"]').length || $(n).find('[dir="rtl"]').length) {
			$(n).removeAttr('dir');
			$(n).parents('[dir="rtl"]').removeAttr('dir');
			$(n).find('[dir="rtl"]').removeAttr('dir');
		} else {
			if (dom.is(n, 'textNodes') && dom.is(n, 'block')) {
				$(n).attr('dir', 'rtl');
			} else {
				$.each(dom.parents(n, 'textNodes'), function(i, n) {
					if (dom.is(n, 'block')) {
						$(n).attr('dir', 'rtl');
						return false;
					}
				});
			}
		}
		this.element.trigger("contentchange");
		return this;
	},

    outdent: function(){
    	var o = this.options, sel = o.selection, dom = o.dom;
		function find(n) {
			function checkNode(n) {
				var ret = {type : '', val : 0}, s;
				if ((s = dom.attr(n, 'style'))) {
					ret.type = s.indexOf('padding-left') != -1
						? 'padding-left'
						: (s.indexOf('margin-left') != -1 ? 'margin-left' : '');
					ret.val = ret.type ? parseInt($(n).css(ret.type))||0 : 0;
				}
				return ret;
			}
			
			var n = sel.getNode(), ret = checkNode(n);
			if (ret.val) {
				ret.node = n;
			} else {
				$.each(dom.parents(n, '*'), function() {
					ret = checkNode(this);
					if (ret.val) {
						ret.node = this;
						return ret;
					}
				});
			}
			return ret;
		};
		
		var v = find();
		if (v.node) {
			$(v.node).css(v.type, (v.val>40 ? v.val-40 : 0)+'px');
			this.updatePath();
		}
		this.element.trigger("contentchange");
		return this;
	},

    indent: function(){
    	var o = this.options, sel = o.selection, dom = o.dom, doc = o.doc,
    	    nodes = sel.selected({collapsed : true, blocks : true, wrap : 'inline', tag : 'p'});
    	
		function indent(n) {
			var css = /(IMG|HR|TABLE|EMBED|OBJECT)/.test(n.nodeName) ? 'margin-left' : 'padding-left';
			var val = dom.attr(n, 'style').indexOf(css) != -1 ? parseInt($(n).css(css))||0 : 0;
			$(n).css(css, val+40+'px');
		}
		
		for (var i=0; i < nodes.length; i++) {
			if (/^(TABLE|THEAD|TFOOT|TBODY|COL|COLGROUP|TR)$/.test(nodes[i].nodeName)) {
				$(nodes[i]).find('td,th').each(function() {
					indent(this);
				});
			} else if (/^LI$/.test(nodes[i].nodeName)) {
				var n = $(nodes[i]);
				$(doc.createElement(nodes[i].parentNode.nodeName))
					.append($(doc.createElement('li')).html(n.html()||'')).appendTo(n.html('&nbsp;'));
			} else {
				indent(nodes[i]);
			}
		};
		this.updatePath();
		this.element.trigger("contentchange");
		return this;
	},
	
	orderedList: function(){
		this.options.doc.execCommand("insertorderedlist", false, null);
		this.updatePath();
		this.element.trigger("contentchange");
		return this;
	},

    unorderedList: function(){
		this.options.doc.execCommand("insertunorderedlist", false, null);
		this.updatePath();
		this.element.trigger("contentchange");
		return this;
    },

    _showDialog:function(title, attrs, formIds, callback,openCallBack){
    	var self = this, o = this.options, sel = o.selection, bm = sel.getBookmark();
    	sel.saveIERange();
		$("<div class='rte-dialog'/>").dialog({
			title:title,
			height: 400,
			width: 500,
			modal: true,
			create: function(event, ui){
				var $this = $(this);
				Model.getPages(o.dbId, formIds, function(err, forms){
					if(forms){
						$this.editor({document:attrs, forms:forms, dbId:o.dbId, mode:"edit", ignoreEscape:true});
					}
				});
			},
			buttons: {
				OK: function() {
					var $this = $(this);
					sel.moveToBookmark(bm);
					callback($this.editor("option","document"));
					self.updatePath();
					$this.dialog("close");
				},
				Cancel: function(){ $( this ).dialog( "close" );}
			},
			open : function(event, ui){
				if(typeof openCallBack == 'function'){
					openCallBack();
				}
			},
			close : function(e, ui) {sel.removeBookmark(bm); $.browser.msie && sel.restoreIERange(); $(this).remove();}
		});
    },
    
	link: function(){
		var self = this, o = this.options, sel = o.selection, dom = o.dom, doc = o.doc, 
		      n = sel.getNode(), link = dom.selfOrParentLink(n), ids = o.formIds;
		function isLink(n) { return n.nodeName == 'A' && n.href; }
		if (!link) {
			sn = $.browser.msie ? sel.selected() : sel.selected({wrap : false});
			if (sn.length) {
				for (var i=0; i < sn.length; i++) {
					if (isLink(sn[i])) {
						link = sn[i];
						break;
					}
				};
				if (!link) {
					link = dom.parent(sn[0], isLink) || dom.parent(sn[sel.length-1], isLink);
				}
			}
		}
		link = link || doc.createElement('a');
		this._showDialog("Link", attributes(link), [ids.standard,ids.link], function(attrs){
			var href = self._absoluteURL(attrs.href), fakeURL, img = n.nodeName == 'IMG' ? n : null;
			if (img && img.parentNode) {
				link = $(doc.createElement('a')).attr('href', href);
				dom.wrap(img, link[0]);
			} else if (!link.parentNode) {
				fakeURL = '#--el-editor---'+Math.random();
				doc.execCommand('createLink', false, fakeURL);
				link = $('a[href="'+fakeURL+'"]', doc).each(function() {
					var $this = $(this);
					if (!$.trim($this.html()) && !$.trim($this.text())) {
						$this.replaceWith($this.text()); 
					}
				});
			}
			attrs.href = href;
			link = $(link);
			$.each(attrs, function(k,v){ v = $.trim(v)?link.attr(k,v):link.removeAttr(k); });
			img && sel.select(img);
		});
		this.element.trigger("contentchange");
		return this;
	},
    
	blockQuote: function(){
    	var o = this.options, sel = o.selection, dom = o.dom, n, nodes;
		if (sel.collapsed() && (n = dom.selfOrParent(sel.getNode(), /^BLOCKQUOTE$/))) {
			$(n).replaceWith($(n).html());
		} else {
			nodes = sel.selected({wrap : 'all', tag : 'blockquote'});
			nodes.length && sel.select(nodes[0], nodes[nodes.length-1]);
		}
		this.updatePath();
		this.element.trigger("contentchange");
		return this;
	},
	
	blockElement:function(){
    	var o = this.options, sel = o.selection, dom = o.dom, n, nodes;
		if (sel.collapsed()) {
			n = dom.selfOrParent(sel.getNode(), /^DIV$/);
			if (n) {
				$(n).replaceWith($(n).html());
			}
		} else {
			nodes = sel.selected({wrap : 'all', tag : 'div'});
			nodes.length && sel.select(nodes[0], nodes[nodes.length-1]);
		}
		this.updatePath();
		this.element.trigger("contentchange");
		return this;
	},

    stopFloat: function(){
    	var o = this.options, sel = o.selection, dom = o.dom, doc = o.doc;
		function find() {
			if (sel.collapsed()) {
				var n = dom.selfOrParent(sel.getEnd(), /^DIV$/);
				if (n && (dom.attr(n, 'clear') || $(n).css('clear') != 'none')) {
					return n;
				}
			}
		};
		
		var n = find();
		if (n) {
			n = $(n);
			if (!n.children().length && !$.trim(n.text()).length) {
				n.remove();
			} else {
				n.removeAttr('clear').css('clear', '');
			}
		} else {
			sel.insertNode($(doc.createElement('div')).css('clear', 'both')[0], true);
		}
		this.updatePath();
		this.element.trigger("contentchange");
		return this;
	},
	
    deleteTable: function(){
    	$(this.options.dom.parent(this.options.selection.getNode(), /^TABLE$/)).remove();
		this.updatePath();
		this.element.trigger("contentchange");
		return this;
	},
	
	insertTableRow: function(param){
		var o = this.options, dom = o.dom,sel = o.selection, n  = sel.getNode(), doc = o.doc,
		    c  = dom.selfOrParent(n, /^(TD|TH)$/), r  = dom.selfOrParent(c, /^TR$/),
		    mx = dom.tableMatrix(dom.selfOrParent(c, /^TABLE$/));

		if (c && r && mx) {
			var before =  'before'== param, ro = $(r).prevAll('tr').length, cnt = 0, mdf = [];
			function _find(x, y) {
				while (y>0) {
					y--;
					if (mx[y] && mx[y][x] && mx[y][x].nodeName) {
						return mx[y][x];
					}
				}
			}
			
			for (var i=0; i<mx[ro].length; i++) {
				if (mx[ro][i] && mx[ro][i].nodeName) {
					var cell    = $(mx[ro][i]);
					var colspan = parseInt(cell.attr('colspan')||1);
					if (parseInt(cell.attr('rowspan')||1) > 1) {
						if (before) {
							cnt += colspan;
						} else {
							mdf.push(cell);
						}
					} else {
						cnt += colspan;
					}
				} else if (mx[ro][i] == '-') {
					cell = _find(i, ro);
					cell && mdf.push($(cell));
				}
			}
			var row = $(doc.createElement('tr'));
			for (var i=0; i<cnt; i++) {
				row.append('<td>&nbsp;</td>');
			}
			if (before) {
				row.insertBefore(r);
			} else {
				row.insertAfter(r);
			}
			$.each(mdf, function() {
				$(this).attr('rowspan', parseInt($(this).attr('rowspan')||1)+1);
			});
			this.updatePath();
		}				
		this.element.trigger("contentchange");
		return this;
	},

    deleteRow: function(){
    	var o = this.options,sel = o.selection, dom = o.dom, n = sel.getNode(), 
    	    c = dom.selfOrParent(n, /^(TD|TH)$/), r = dom.selfOrParent(c, /^TR$/),
    	    tb = dom.selfOrParent(c, /^TABLE$/), mx = dom.tableMatrix(tb);

		if (c && r && mx.length) {
			if (mx.length==1) {
				$(tb).remove();
				this.updatePath();
			}
			var mdf = [], ro = $(r).prevAll('tr').length;
			function _find(x, y) {
				while (y>0) {
					y--;
					if (mx[y] && mx[y][x] && mx[y][x].nodeName) {
						return mx[y][x];
					}
				}
			}

			// move cell with rowspan>1 to next row
			function _move(cell, x) {
				y = ro+1;
				var sibling= null;
				if (mx[y]) {
					for (var _x=0; _x<x; _x++) {
						if (mx[y][_x] && mx[y][_x].nodeName) {
							sibling = mx[y][_x];
						}
					};

					cell = cell.remove();
					if (sibling) {
						cell.insertAfter(sibling);
					} else {
						cell.prependTo($(r).next('tr').eq(0));
					}
				}
			}

			function _cursorPos(column) {
				for (var i = 0; i<column.length; i++) {
					if (column[i] == c) {
						return i<column.length-1 ? column[i+1] : column[i-1];
					}
				}
			}

			for (var i=0; i<mx[ro].length; i++) {
				var cell = null;
				var move = false;
				if (mx[ro][i] && mx[ro][i].nodeName) {
					cell = mx[ro][i];
					move = true;
				} else if (mx[ro][i] == '-' && (cell = _find(i, ro))) {
					move = false;
				}
				if (cell) {
					cell = $(cell);
					var rowspan = parseInt(cell.attr('rowspan')||1);
					if (rowspan>1) {
						cell.attr('rowspan', rowspan-1);
						move && _move(cell, i, ro);
					} 
				}
			};

			var _c = _cursorPos(dom.tableColumn(c));
			if (_c) {
				sel.selectContents(_c).collapse(true);
			}

			$(r).remove();
		}
		this.updatePath();
		this.element.trigger("contentchange");
		return this;
	},
	
	insertTableColumn: function(param){
		var o=this.options,doc = o.doc, dom=o.dom,sel=o.selection, 
		    cells = dom.tableColumn(sel.getNode(), false, true);
		if (cells.length) {
			$.each(cells, function() {
				var $this = $(this);
				var cp = parseInt($this.attr('colspan')||1);
				if (cp >1) {
					$this.attr('colspan', cp+1);
				} else {
					var c = $(doc.createElement(this.nodeName)).html('&nbsp;');
					if (param == 'before') {
						c.insertBefore(this);
					} else {
						c.insertAfter(this);
					}
				}
			});
		}				
		this.updatePath();
		this.element.trigger("contentchange");
		return this;
	},

    deleteColumn: function(){
    	var o=this.options,sel=o.selection,dom=o.dom, n = sel.getNode(), 
    	    c = dom.selfOrParent(n, /^(TD|TH)$/), prev  = $(c).prev('td,th')[0],
    	    next  = $(c).next('td,th')[0], tb = dom.parent(n, /^TABLE$/),
    	    cells = dom.tableColumn(n, false, true);

		if (cells.length) {
			$.each(cells, function() {
				var $this = $(this), cp = parseInt($this.attr('colspan')||1);
				if ( cp>1 ) {
					$this.attr('colspan', cp-1);
				} else {
					$this.remove();
				}
			});
			dom.fixTable(tb);
			if (prev || next) {
				sel.selectContents(prev ? prev : next).collapse(true);
			}
		}				
		this.updatePath();
		this.element.trigger("contentchange");
		return this;
	},

    mergeCells: function(){
    	var o=this.options,sel=o.selection,dom=o.dom, cells = null, 
    	    c1 = dom.selfOrParent(sel.getStart(), /^(TD|TH)$/), 
    	    c2 = dom.selfOrParent(sel.getEnd(), /^(TD|TH)$/);		
		if (c1 && c2 && c1!=c2 && $(c1).parents('table')[0] == $(c2).parents('table')[0]) {
			cells = [c1, c2];
		}
		
		if (cells) {
			var _s  = dom.indexOf($(cells[0]).parent('tr')[0]),
			    _e  = dom.indexOf($(cells[1]).parent('tr')[0]),
			    ro  = Math.min(_s, _e), // row offset
			    rl  = Math.max(_s, _e) - ro + 1, // row length
			    _c1 = dom.tableColumn(cells[0], true, true), _c2 = dom.tableColumn(cells[1], true),
			    _i1 = $.inArray(cells[0], _c1.column), _i2 = $.inArray(cells[1], _c2.column),
			    colBegin = _c1.info.offset[_i1] < _c2.info.offset[_i2]  ? _c1 : _c2,
			    colEnd   = _c1.info.offset[_i1] >= _c2.info.offset[_i2] ? _c1 : _c2,
			    length   = 0, target   = null, html     = '';
			$($(cells[0]).parents('table').eq(0).find('tr').get().slice(ro, ro+rl)).each( function(i) {
					var _l = html.length, accept = false;
					$(this).children('td,th').each(function() {
						var $this   = $(this), inBegin = $.inArray(this, colBegin.column),
						    inEnd   = $.inArray(this, colEnd.column);
						
						if (inBegin!=-1 || inEnd!=-1) {
							accept = inBegin!=-1 && inEnd==-1;
							var len = parseInt($this.attr('colspan')||1);
							if (i == 0) {
								length += len;
							}
							
							if (inBegin!=-1 && i>0) {
								var delta = colBegin.info.delta[inBegin], cell;
								if (delta>0) {
									if ($this.css('text-align') == 'left') {
										cell = $this.clone(true);
										$this.html('&nbsp;');
									} else {
										cell = $this.clone().html('&nbsp;');
									}
									cell.removeAttr('colspan').removeAttr('id').insertBefore(this);
									if (delta>1) {
										cell.attr('colspan', delta);
									}
								}
							}
							
							if (inEnd!=-1) {
								var delta = colEnd.info.delta[inEnd], cell;
								if (len-delta>1) {
									var cp = len-delta-1;
									if ($this.css('text-align') == 'right') {
										cell = $this.clone(true);
										$this.html('&nbsp;');
									} else {
										cell = $this.clone().html('&nbsp;');
									}
									cell.removeAttr('colspan').removeAttr('id').insertAfter(this);
									if (cp>1) {
										cell.attr('colspan', cp);
									}
								}
							}
							if (!target) {
								target = $this;
							} else {
								html += $this.html();
								$this.remove();
							}
						} else if (accept) {
							if (i == 0) {
								length += parseInt($this.attr('colspan')||1);
							}
							html += $this.html();
							$this.remove();
						}
					});
					html += _l!=html.length ? '<br/>' : '';
				});

			target.removeAttr('colspan').removeAttr('rowspan').html(target.html()+html);
			if (length>1) {
				target.attr('colspan', length);
			}
			if (rl>1) {
				target.attr('rowspan', rl);
			}
			// sometimes when merge cells with different rowspans we get "lost" cells in rows 
			// this add cells if needed
			dom.fixTable($(cells[0]).parents('table').get(0));
		}
		this.updatePath();
		this.element.trigger("contentchange");
		return this;
	},

    splitCells: function(){
    	var o=this.options,sel=o.selection,dom=o.dom, doc = o.doc, 
    	    n = dom.selfOrParent(sel.getNode(), /^(TD|TH)$/);
		if (n) {
			var colspan = parseInt(dom.attr(n, 'colspan')), rowspan = parseInt(dom.attr(n, 'rowspan'));
			if (colspan>1 || rowspan>1) {
				var cnum = colspan-1, rnum = rowspan-1, tb = dom.parent(n, /^TABLE$/), tbm  = dom.tableMatrix(tb);
				if (cnum) {
					for (var i=0; i<cnum; i++) {
						$(doc.createElement(n.nodeName)).html('&nbsp;').insertAfter(n);
					}
				}
				if (rnum) {
					var ndx  = dom.indexesOfCell(n, tbm), rndx = ndx[0], cndx = ndx[1];
					for (var r=rndx+1; r < rndx+rnum+1; r++) {
						var cell = null;
						if (!tbm[r][cndx].nodeName) {
							if (tbm[r][cndx-1].nodeName) {
								cell = tbm[r][cndx-1];
							} else {
								for (var i=cndx-1; i>=0; i--) {
									if (tbm[r][i].nodeName) {
										cell =tbm[r][i];
										break;
									}
								}
							}
							if (cell) {
								for (var i=0; i<= cnum; i++) {
									$(doc.createElement(cell.nodeName)).html('&nbsp;').insertAfter(cell);
								}
							}
						}
					};
				}
				$(n).removeAttr('colspan').removeAttr('rowspan');
				dom.fixTable(tb);
			}
		}
		this.updatePath();
		this.element.trigger("contentchange");
		return this;
	},
	
	fontColor: function(c){
		var o =  this.options, sel = o.selection;
		if (!sel.collapsed()) {
			var nodes = sel.selected({collapse : false, wrap : 'text'});
			$.each(nodes, function() {
				if (/^(THEAD|TBODY|TFOOT|TR)$/.test(this.nodeName)) {
					$(this).find('td,th').each(function() {
						$(this).css('color', c).find('*').css('color', '');
					});
				} else {
					$(this).css('color', c).find('*').css('color', '');
				}
			});
			this.updatePath();
			this.element.trigger("contentchange");
		}
		return this;
	},
	
	backgroundColor:function(c){
		var o = this.options, sel = o.selection;
		if (!sel.collapsed()) {
			var nodes = sel.selected({collapse : false, wrap : 'text'});
			$.each(nodes, function() {
				if (/^(THEAD|TBODY|TFOOT|TR)$/.test(this.nodeName)) {
					$(this).find('td,th').each(function() {
						$(this).css('background-color', c).find('*').css('background-color', '');
					});
				} else {
					$(this).css('background-color', c).find('*').css('background-color', '');
				}
			});
			this.updatePath();
			this.element.trigger("contentchange");
		}
		return this;
	},
	
	font: function(size){
		var o = this.options, sel = o.selection, nodes = sel.selected({filter : 'textContainsNodes'});
		$.each(nodes, function() {
			$this = /^(THEAD|TFOOT|TBODY|COL|COLGROUP|TR)$/.test(this.nodeName) ? $(this).find('td,th') : $(this);
			$(this).css('font-family', size).find('[style]').css('font-family', '');
		});
		this.updatePath();
		this.element.trigger("contentchange");
		return this;
	},
	
	fontSize: function(size){
		var o = this.options, nodes = o.selection.selected({filter : 'textContainsNodes'});
		$.each(nodes, function() {
			$this = /^(THEAD|TFOOT|TBODY|COL|COLGROUP|TR)$/.test(this.nodeName) ? $(this).find('td,th') : $(this);
			$this.css('font-size', size).find("[style]").css('font-size', '');
		});
		this.updatePath();
		this.element.trigger("contentchange");
		return this;
	},
	
	format: function(v){
		var o = this.options, sel = o.selection, dom = o.dom, doc = o.doc;
		function f(n, tag) {
			function replaceChilds(p) {
				$(p).find('h1,h2,h3,h4,h5,h6,p,address,pre').each(function() {
					$(this).replaceWith($(this).html());
				});
				return p;
			}
			
			if (/^(LI|DT|DD|TD|TH|CAPTION)$/.test(n.nodeName)) {
				!dom.isEmpty(n) && dom.wrapContents(replaceChilds(n), tag);
			} else if (/^(UL|OL|DL|TABLE)$/.test(n.nodeName)) {
				dom.wrap(n, tag);
			} else {
				!dom.isEmpty(n) && $(replaceChilds(n)).replaceWith( $(doc.createElement(tag)).html($(n).html()));
			}
		}
		
		var tag = v.toUpperCase(),	i, n, $n, c = sel.collapsed(), bm = sel.getBookmark(),
			nodes = sel.selected({ collapsed : true, blocks:true, filter : 'textContainsNodes', wrap:'inline', tag:'span'}),
			l = nodes.length, s = $(nodes[0]).prev(), e = $(nodes[nodes.length-1]).next();
		while (l--) {
			n = nodes[l];
			$n = $(n);
			if (tag == 'DIV' || tag == 'SPAN') {
				if (/^(H[1-6]|P|ADDRESS|PRE)$/.test(n.nodeName)) {
					$n.replaceWith($(doc.createElement('div')).html($n.html()||''));
				}
			} else {
				if (/^(THEAD|TBODY|TFOOT|TR)$/.test(n.nodeName)) {
					$n.find('td,th').each(function() { f(this, tag); });
				} else if (n.nodeName != tag) {
					f(n, tag);
				}
			}
		}

		sel.moveToBookmark(bm);
		this.updatePath();
		this.element.trigger("contentchange");
		return this;
	},
	
	deleteLink:function(){
		var o = this.options, sel = o.selection, dom = o.dom, doc = o.doc, n = sel.getNode(), l = dom.selfOrParentLink(n);
		function isLink(n) { return n.nodeName == 'A' && n.href; }
		if (l) {
			sel.select(l);
			doc.execCommand('unlink', false, null);
		} else {
			sel = $.browser.msie ? sel.selected() : sel.selected({wrap : false});
			if (sel.length) {
				for (var i=0; i < sel.length; i++) {
					if (isLink(sel[i])) {
						l = sel[i];
						break;
					}
				};
				if (!l) {
					l = dom.parent(sel[0], isLink) || dom.parent(sel[sel.length-1], isLink);
				}
			}
		}
		this.updatePath();
		this.element.trigger("contentchange");
		return this;
	},

	horizontalRule: function(){
		var o = this.options, sel = o.selection, n = sel.getEnd(),doc = o.doc;
		n = (n&&(n.nodeName=="HR"))? n : doc.createElement('hr');
		this._showDialog("Horizontal Rule", attributes(n), [o.formIds.standard], function(attrs){
			var $n = $(n);
			$.each(attrs, function(k,v){ v = $.trim(v)?$n.attr(k,v):$n.removeAttr(k); });
			if(!$n.parent().length) sel.insertNode(n);
		});
		this.element.trigger("contentchange");
		return this;
    },
	
	properties: function(){
		var self = this, o = this.options, sel = o.selection, n = sel.getNode();
		if (n.nodeType == 3)  n = n.parentNode;
		if(n.nodeType != 1 || n.nodeName == 'BODY') return;
		this._showDialog("Standard Properties", attributes(n), [o.formIds.standard], function(attrs){
			var $n = $(n);
			$.each(attrs, function(k,v){ v = $.trim(v)?$n.attr(k,v):$n.removeAttr(k); });
			self.element.trigger("contentchange");
		});
		return this;
	},

    image: function(){
    	var self = this, o = this.options, sel = o.selection, img = sel.getEnd(),doc = o.doc, ids = o.formIds;
    	if($(img).is('.widget,:not(img)')) img = doc.createElement('img');
    	if(img['width'] && $(img).attr('style')){
    		img['width'] = img.offsetWidth;
			$(img).attr('style',$(img).attr('style').replace(/width:\s*\d+px/,'width:' + img.offsetWidth + 'px'));
		}
		if(img['height'] && $(img).attr('style')){
			img['height'] = img.offsetHeight;
			$(img).attr('style',$(img).attr('style').replace(/height:\s*\d+px/,'height:' + img.offsetHeight + 'px'));
		}
		
		var as = attributes(img),
			oldValue = $.extend(true,{},as);
    	this._showDialog("Image", attributes(img), [ids.standard,ids.image], function(attrs){
    		var $img = $(img);
    		if(attrs['width'] && attrs['style']){
				attrs['style'] = attrs['style'].replace(/width:\s*\d+px/,'width:' + attrs['width'] + 'px');
			}
			if(attrs['height'] && attrs['style']){
				attrs['style'] = attrs['style'].replace(/height:\s*\d+px/,'height:' + attrs['height'] + 'px');
			}
			$.each(attrs, function(k,v){
				v = $.trim(v)?$img.attr(k,v):$img.removeAttr(k);
			});
			if(!img.parentNode) sel.insertNode(img);
			self.element.trigger("contentchange");
			
			/*$img.resizable({
				stop: function(event, ui) {
					self.element.trigger("contentchange");
					event.preventDefault();
					event.stopImmediatePropagation();
			    },
				create:function(){
					$img.parent().css('position','relative');
				}
			});*/
			if(!equals(attrs,oldValue)){
				self.element.trigger("contentchange");
			}
			$img.dblclick(function(){
				var attrs=attributes(img);
				attrs['width']=$(img).css('width').replace(/px/g,'');
				attrs['height']=$(img).css('height').replace(/px/g,'');
				self._showDialog("Image", attrs, [ids.standard,ids.image], function(attrs){
					$.each(attrs, function(k,v){
						if(k=='width'||k=='height'){
							v = $.trim(v)?$img.css(k,v):$img.removeAttr(k); 
						}else{
							v = $.trim(v)?$img.attr(k,v):$img.removeAttr(k);
						}
					});
					if(!img.parentNode) sel.insertNode(img);
					self.element.trigger("contentchange");
				});
			});
    	});
		return this;
    },

	rteWidget: function(type, formIds, opts){
    	var o = this.options, sel = o.selection, n = sel.getStart(), $n = $(n);
    	if(!$n.is('.widget[type='+type+']')){
    		$n = $("<div class='widget'/>").attr("type",type).css((opts&&opts.style)||{});
    		$n.toggleClass("field", $.inArray(type,["text","checkbox", "radio","select", "datetime",
    		                                          "textarea", "file","grid","jsrender","password","rte", "search",
    		                                          "toggle", "listview","customhtml"])!=-1);
    		$n.toggleClass("box", $.inArray(type,["box","editor", "page","view"])!=-1);
    		n = $n.get(0);
    	}
    	var oldmd = $.extend(true,opts,$n.getMetadata()), oldattrs = attributes(n),
       	      title = type.substring(0,1).toUpperCase()+type.substring(1) + " Properties";
    	if(oldattrs.id) oldattrs.id = oldattrs.id.replace(/-/g,".");
 		this._showDialog(title, $.extend({},oldmd,oldattrs), formIds, function(attrs){
			var md = {};
			if($n.is(".field") && attrs[type+"field"]){
				md[type+"field"] = attrs[type+"field"];
				delete attrs[type+"field"];
			}else if($n.is("[type=widget]")){
				md.widget = attrs.widget;
				delete attrs.widget;
			}else if($n.is("[type=box]")){
				md.box = attrs.box;
				delete attrs.box;
				if(oldmd&&oldmd.box&&!(oldmd.box.link == md.box.link && md.box.link == "raw")) $n.children('.content').empty();
			}else if($n.is("[type=tabsx]")){
				md.tabsxwidget = attrs.tabsxwidget;
				delete attrs.tabsxwidget;
			}else if($n.is("[type=button]")){
				md.buttonwidget = attrs.buttonwidget;
				delete attrs.buttonwidget;
			}else if($n.is(".box") && attrs[type+"box"]){
				md[type+"box"] = attrs[type+"box"];
				delete attrs[type+"box"];
			}else if($n.is(".widget") && attrs[type+"widget"]){
				md[type+"widget"] = attrs[type+"widget"];
				delete attrs[type+"widget"];
			}
			if(!equals(md, oldmd)){
				$n.setMetadata(md);
				$n.trigger("metadatachanged",[md, oldmd]);
			}
			if(!equals(attrs, oldattrs)){
				if(attrs.id) attrs.id = attrs.id.replace(/\./g,"-");
				$.each(attrs, function(k,v){ v = $.trim(v)?$n.attr(k,v):$n.removeAttr(k); });
				if($n.parent().length==0) {
					sel.insertNode(n);
					$n.trigger("newwidget",[n]);
				}else{
					$n.trigger("attributeschanged",[attrs, oldattrs]);
				}
			}
		});
		return this;
	},

	rteWidgetActive: function(type){
		var n = this.options.selection.getEnd();
		if(n&&n.nodeName == "DIV"){
			return $(n).is('.widget[type='+type+']'); 
		}
    	return false;
	},
	
    _alignEnable: function(){
    	var o = this.options;
    	if(o.mode != "design") return false;
    	var s = o.selection.getNode(); 
    	return s&&s.nodeName == 'BODY' ? s : o.dom.selfOrParent(s, 'textNodes')||(s&&s.parentNode && s.parentNode.nodeName == 'BODY' ? s.parentNode : null) ? true : false;
    },

    _alignActive: function(align){
    	var o = this.options;
    	if(o.mode != "design") return false;
    	var s = o.selection.getNode(),
    	     n = s.nodeName == 'BODY' ? s : o.dom.selfOrParent(s, 'textNodes')||(s.parentNode && s.parentNode.nodeName == 'BODY' ? s.parentNode : null);
    	return $(n).css('text-align') == align;
    },
    
    _commandEnabled: function(cmd){
    	var o = this.options, enabled = false;
    	try{
    		enabled = (o.mode == "design") && o.doc.queryCommandEnabled(cmd); 
    	}catch(e){};
    	return enabled;
    },
    
    _commandState: function(cmd){
    	var o = this.options, state = false;
    	try{state = (o.mode == "design") && o.doc.queryCommandState(cmd);}catch(e){};
    	return state;
    },
    
    _directionActive:function(dir){
		var $n = $(this.options.selection.getNode());
		return $n.attr('dir') == dir || $n.parents('[dir='+dir+']').length || $n.find('[dir='+dir+']').length;
    },
    
    _colorEnable:function(element, color){
    	var o = this.options;
		if(o.mode != "design") return false;
		var n = o.selection.getNode();
		if(n){
			var c = $(n.nodeType != 1 ? n.parentNode : n).css(color);
			element.data("select").val(this._color2Hex(''+c)||(color=="color"?"#000000":"#FFFFFF"));
			return true;
		}
		return false;
    },
    
    _fontEnable:function(action){
    	var o = this.options;
    	if(o.mode != "design") return false;
		var n = o.selection.getNode();
		if(n){
			if (n.nodeType != 1) n = n.parentNode;
			var v = $(n).css('font-family');
			v = v ? v.toString().toLowerCase().replace(/,\s+/g, ',').replace(/'|"/g, '') : '';
			action.element.data("select").val(action.src[v] ? v : '');
			return true;
		}
		return false;
    },
    
    _fontSizeEnable:function(action){
    	var o = this.options;
		if(o.mode != "design") return false;
		var n = o.selection.getNode();
		action.element.data("select").val((m = o.dom.attr(n, 'style').match(/font-size:\s*([^;]+)/i)) ? m[1] : '');
		return true;
    },
    
    _formatEnable:function(action){
    	var o = this.options;
    	if(o.mode != "design") return false;
		var n = o.dom.selfOrParent(o.selection.getNode(), /^(H[1-6]|P|ADDRESS|PRE)$/);
		action.element.data("select").val(n ? n.nodeName.toLowerCase() : 'span');
		return true;
    },
    
    _outdentEnable:function(){
    	var o = this.options;
		if(o.mode != "design") return false;
		
		var sel = o.selection, dom = o.dom;
		function checkNode(n) {
			var ret = {type : '', val : 0}, s;
			if ((s = dom.attr(n, 'style'))) {
				ret.type = s.indexOf('padding-left') != -1 ? 'padding-left'
						: (s.indexOf('margin-left') != -1 ? 'margin-left' : '');
				ret.val = ret.type ? parseInt($(n).css(ret.type))||0 : 0;
			}
			return ret;
		}

		var n = sel.getNode(), outdent = checkNode(n), node = null;
		if (outdent.val) {
			node = n;
		} else {
			$.each(dom.parents(n, '*'), function() {
				outdent = checkNode(this);
				if (outdent.val) {
					node = this;
				}
			});
		}
		return node ? true: false;
    },
    
    _linkEnable:function(){
    	var o = this.options;
		if(o.mode != "design") return false;
		var sel = o.selection, n = sel.getNode();
		if(n){
			var dom = o.dom;
			return dom.selfOrParentLink(n) 
				|| dom.selectionHas(sel, function(n) { return n.nodeName == 'A' && n.href; })
				|| !sel.collapsed() || n.nodeName == 'IMG';
		}
		return false;
    },
    
    _linkActive:function(){
    	var o = this.options, sel = o.selection;
		if(o.mode != "design") return false;
		var n = sel.getNode();
		if(n){
			var dom = o.dom;
			return dom.selfOrParentLink(n)
					|| dom.selectionHas(sel, function(n) { return n.nodeName == 'A' && n.href; });
		}
		return false;
    },

	_deleteLinkEnable:function(){
		var o = this.options, sel = o.selection;
		if(o.mode != "design") return false;
		var n = sel.getNode();
		if(n){
			var dom = o.dom;
			return dom.selfOrParentLink(n)
					|| dom.selectionHas(sel, function(n) { return n.nodeName == 'A' && n.href; });
		}
		return false;
	},
	
	_blockQuoteEnable:function(){
		var o = this.options;
		if(o.mode != "design") return false;
		var sel = o.selection,dom = o.dom;
		if (!sel.collapsed())  return true;
		return dom.selfOrParent(sel.getNode(), /^BLOCKQUOTE$/);
	},

	_blockElementEnable:function(){
		var o = this.options;
		if(o.mode != "design") return false;
		var sel = o.selection,dom = o.dom;
		return !sel.collapsed() || dom.selfOrParent(sel.getNode(), /^DIV$/);
	},
	
	_blockElementActive:function(){
		var o = this.options;
		if(o.mode != "design") return false;
		var sel = o.selection,dom = o.dom;
		return sel.collapsed() && dom.selfOrParent(sel.getNode(), /^DIV$/);
	},

	_stopFloatActive:function(){
		var o = this.options;
		if(o.mode != "design") return false;
		var sel = o.selection, dom = o.dom;
		if (!sel.collapsed()) return false;
		var n = dom.selfOrParent(sel.getEnd(), /^DIV$/);
		return n && (dom.attr(n, 'clear') || $(n).css('clear') != 'none');
	},

	_propertiesEnable:function(){
		var o = this.options, sel = o.selection,n = sel.getNode();
		if(o.mode != "design") return false;
		if (n && n.nodeType == 3) {
			n = n.parentNode;
		}
		n = (n&&n.nodeType == 1 && n.nodeName != 'BODY') ? n : null;
		return n ? true : false;	        		
	},

	_imageActive:function(){
		var o = this.options;
		if(o.mode != "design") return false;
		var n = o.selection.getEnd();
		if(n){
			var $n = $(n);
			return n.nodeName == 'IMG' && !$n.is('.widget') && !$n.is('.rte-media');
		}
		return false;
	},

	_tablePropsEnable:function(){
		var o = this.options;
		if(o.mode != "design") return false;
		var sel = o.selection, dom = o.dom;
		return dom.selfOrParent(sel.getNode(), /^TABLE$/); 
	},

	_deleteTableEnable:function(){
		var o = this.options;
		if(o.mode != "design") return false;
		var sel = o.selection, dom = o.dom;
		return dom.parent(sel.getNode(), /^TABLE$/);
	},
	
	_rowBeforeEnable:function(){
		var o = this.options;
		if(o.mode != "design") return false;
		var sel = o.selection,dom = o.dom;
		return dom.selfOrParent(sel.getNode(), /^TR$/);
	},
	
	_rowAfterEnable:function(){
		var o = this.options;
		if(o.mode != "design") return false;
		var sel = o.selection, dom = o.dom;
		return dom.selfOrParent(sel.getNode(), /^TR$/);
	},
	
	_deleteRowEnable:function(){
		var o = this.options;
		if(o.mode != "design") return false;
		var sel = o.selection, dom = o.dom;
		return dom.selfOrParent(sel.getNode(), /^TR$/);
	},
	
	_columnBeforeEnable:function(){
		var o = this.options;
		if(o.mode != "design") return false;
		var sel = o.selection,dom = o.dom;
		return dom.selfOrParent(sel.getNode(), /^(TD|TH)$/);
	},
	
	_columnAfterEnable:function(){
		var o = this.options;
		if(o.mode != "design") return false;
		var sel = o.selection, dom = o.dom;
		return dom.selfOrParent(sel.getNode(), /^(TD|TH)$/);
	},
	
	_deleteColumnEnable:function(){
		var o = this.options;
		if(o.mode != "design") return false;
		var sel = o.selection, dom = o.dom;
		return dom.selfOrParent(sel.getNode(), /^(TD|TH)$/);
	},	

	_cellPropsEnable:function(){
		var o = this.options;
		if(o.mode != "design") return false;
		var sel = o.selection, dom = o.dom;
		return dom.parent(sel.getNode(), /^TABLE$/);
	},
	
	_mergeCellsEnable:function(){
		var o = this.options;
		if(o.mode != "design") return false;
		var sel = o.selection, dom = o.dom,
		      c1 = dom.selfOrParent(sel.getStart(), /^(TD|TH)$/),
		      c2 = dom.selfOrParent(sel.getEnd(), /^(TD|TH)$/);
		return c1 && c2 && c1!=c2 && $(c1).parents('table').get(0) == $(c2).parents('table').get(0);
	},
	
	_splitCellsEnable:function(){
		var o = this.options;
		if(o.mode != "design") return false;
		var sel = o.selection, dom = o.dom,
		      n = dom.selfOrParent(sel.getNode(), /^(TD|TH)$/);
		return n && (parseInt(dom.attr(n, 'colspan'))>1 || parseInt(dom.attr(n, 'rowspan'))>1);
	},
	
	_parseURL: function(url) {
		var reg = /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
		var u   = url.match(reg);
		var ret = {};
		$.each(["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"], function(i) {
			ret[this] = u[i];
		});
		if (!ret.host.match(/[a-z0-9]/i)) {
			ret.host = '';
		}
		return ret;
	},
	
	_absoluteURL: function(url) {
		var baseURL = this.url.protocol+'://'+(this.url.userInfo ?  parts.userInfo+'@' : '')+this.url.host+(this.url.port ? ':'+this.url.port : '');
		var path    = !this.url.file ? this.url.path : this.url.path.substring(0, this.url.path.length - this.url.file.length);
		
		url = $.trim(url);
		if (!url) return '';
		if (url[0] == '#') 	return url;

		var u = this._parseURL(url);
		if (!u.host && !u.path && !u.anchor) {
			//this.rte.log('Invalid URL: '+url)
			return '';
		}
		if (!this.options.absoluteURLs) return url;
		if (u.protocol) {
			//this.rte.log('url already absolute: '+url);
			return url;
		}
		if (u.host && (u.host.indexOf('.')!=-1 || u.host == 'localhost')) {
			//this.rte.log('no protocol');
			return this.url.protocol+'://'+url;
		}
		if (url[0] == '/') {
			url = baseURL+url;
		} else {
			if (url.indexOf('./') == 0) {
				url = url.substring(2);
			}
			url = baseURL+path+url;
		}
		return url;
	},

	_color2Hex : function(c) {
		var colors = {
				aqua    : '#00ffff',
				black   : '#000000',
				blue    : '#0000ff',
				fuchsia : '#ff00ff',
				gray    : '#808080',
				green   : '#008000',
				lime    : '#00ff00',
				maroon  : '#800000',
				navy    : '#000080',
				olive   : '#808000',
				orange  : '#ffa500',
				purple  : '#800080',
				red     : '#ff0000',
				silver  : '#c0c0c0',
				teal    : '#008080',
				white   : '#fffffff',
				yellow  : '#ffff00'
		};
		// rgb color regexp
		var rgbRegExp = /\s*rgb\s*?\(\s*?([0-9]+)\s*?,\s*?([0-9]+)\s*?,\s*?([0-9]+)\s*?\)\s*/i;
		// regexp to detect color in border/background properties
		var colorsRegExp = /aqua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|orange|purple|red|silver|teal|white|yellow|rgb\s*\([^\)]+\)/i;

		var m;
		c = c||'';
		if (c.indexOf('#') === 0) {
			return c;
		}
		
		function hex(s) {
			s = parseInt(s).toString(16);
			return s.length > 1 ? s : '0' + s; 
		};
		
		if (colors[c]) {
			return colors[c];
		}
		if ((m = c.match(rgbRegExp))) {
			return '#'+hex(m[1])+hex(m[2])+hex(m[3]);
		}
		return '';
	},

	_trimEventCallback: function(c) {
		c = c ? c.toString() : '';
		return $.trim(c.replace(/\r*\n/mg, '').replace(/^function\s*on[a-z]+\s*\(\s*event\s*\)\s*\{(.+)\}$/igm, '$1'));
	},
	
	_toPixels : function(num) {
		var m = num.match(/([0-9]+\.?[0-9]*)\s*(px|pt|em|%)/);
		if (m) {
			num  = m[1];
			unit = m[2];
		} 
		if (num[0] == '.') {
			num = '0'+num;
		}
		num = parseFloat(num);

		if (isNaN(num)) {
			return '';
		}
		var base = parseInt($(document.body).css('font-size')) || 16;
		switch (unit) {
			case 'em': return parseInt(num*base);
			case 'pt': return parseInt(num*base/12);
			case '%' : return parseInt(num*base/100);
		}
		return num;
	},
	
	_parseStyle: function(s) {
		var st = {}, t, n, v, p;
		if (typeof(s) == 'string' && s.length) {
			$.each(s.replace(/&quot;/gi, "'").split(';'), function(i, str) {
				if ((p = str.indexOf(':')) !== -1) {
					n = $.trim(str.substr(0, p));
					v = $.trim(str.substr(p+1));
					if (n == 'color' || n == 'background-color') {
						v = v.toLowerCase();
					}
					if (n && v) {
						st[n] = v;
					}
				}
			});
		}
		return st;
	},
	
	/**
	 * Encode entities in string
	 *
	 * @param   String
	 * @return  String
	 **/
	_encode: function(s) {
		/**
		 * entities map
		 **/
		var entities = {'&' : '&amp;', '"' : '&quot;', '<' : '&lt;', '>' : '&gt;'};
		/**
		 * entities regexp
		 **/
		var entitiesRegExp = /[<>&\"]/g;
		
		var e = entities;
		return (''+s).replace(entitiesRegExp, function(c) {
			return e[c];
		});
	},

	_edittable: function(create){
		var o = this.options, sel = o.selection, dom = o.dom, doc = o.doc, ids = o.formIds,self = this;
		var table = create ? doc.createElement('table'):dom.selfOrParent(sel.getNode(), /^TABLE$/);
		table = table||doc.createElement('table');
		if(table['width'] && $(table).attr('style')){
			table['width'] = table.offsetWidth;
			$(table).attr('style',$(table).attr('style').replace(/width:\s*\d+px/,'width:' + table.offsetWidth + 'px'));
		}
		if(table['height'] && $(table).attr('style')){
			table['height'] = table.offsetHeight;
			$(table).attr('style',$(table).attr('style').replace(/height:\s*\d+px/,'height:' + table.offsetHeight + 'px'));
		}
		var as = attributes(table);
		if(create){
			$.extend(as,{rows:2,columns:2,_isNew:true});
		}
		var oldValue = $.extend(true,{},as);

		this._showDialog("Table", as, [ids.standard, ids.table], function(attrs){
			var $table = $(table);
			if (!$table.parents().length) {
				var r = parseInt(attrs.rows)|| 0;
				var c = parseInt(attrs.columns) || 0;
				if (r<=0 || c<=0)  return;
				var b = $(doc.createElement('tbody')).appendTo(table);
				for (var i=0; i < r; i++) {
					var tr = '<tr>';
					for (var j=0; j < c; j++) {
						tr += '<td>&nbsp;</td>';
					}
					b.append(tr+'</tr>');
				};
			} else {
				$table.removeAttr('width').removeAttr('border').removeAttr('cellspacing')
					.removeAttr('cellpadding').removeAttr('frame').removeAttr('rules')
					.removeAttr('style');
			}
			delete attrs.rows;
			delete attrs.columns;
			delete attrs._isNew;
			
			if(attrs['width'] && attrs['style']){
				attrs['style'] = attrs['style'].replace(/width:\s*\d+px/,'width:' + attrs['width'] + 'px');
			}
			if(attrs['height'] && attrs['style']){
				attrs['style'] = attrs['style'].replace(/height:\s*\d+px/,'height:' + attrs['height'] + 'px');
			}
			$.each(attrs, function(k,v){ v = $.trim(v)?$table.attr(k,v):$table.removeAttr(k);});
			if(!table.parentNode) sel.insertNode(table);
			$table.resizable({
				stop: function(e, ui) {
					self.element.trigger("contentchange");
					e.preventDefault();
					e.stopImmediatePropagation();
			    }
			});
			if(!equals(attrs,oldValue)){
				self.element.trigger("contentchange");
			}
		});
		return this;
	},
	
	_cellProperties:function(){
		var self = this, o = this.options, sel = o.selection, dom = o.dom, ids = o.formIds;
		var cell = dom.selfOrParent(sel.getNode(), /^(TD|TH)$/);
		if (!cell) {
			return;
		}

		var $cell = $(cell), as = attributes(cell);
		$.extend(as,{
			type:cell.nodeName.toLowerCase(),
			width:$cell.css('width') || $cell.attr('width'),
			height:$cell.css('height') || $cell.attr('height')
		});
		this._showDialog("Cell", as, [ids.standard, ids.cell], function(attrs){
			var target = $cell;
			switch (attrs.apply) {
				case 'row':
					target = $cell.parent('tr').children('td,th');
					break;
				case 'column':
					target = $(dom.tableColumn(cell));
					break;
				case 'table':
					target = $cell.closest('table').find('td,th');
					break;
			}
			delete attrs.apply;
			
			if (cell.nodeName.toLowerCase() != attrs.type){
				$.each(target.get(), function() {
						$(this).replaceWith($('<'+attrs.type+' />').html($(this).html()));
				});
			} 
			delete attrs.type;
			self.element.trigger("contentchange");
			$.each(attrs, function(k,v){ v = $.trim(v)?target.attr(k,v):target.removeAttr(k);});
		});
		return this;
	},
	
	addClass: function(selector, cls){
		this.$body.find(selector).addClass(cls);
	},
	
	removeClass:function(selector, cls){
		this.$body.find(selector).removeClass(cls);
	},
	
	toggleClass:function(selector, cls, tag){
		this.$body.find(selector).toggleClass(cls,tag);
	},

	_createActions: function(){
		var self = this, o = this.options;
	    var actions = {
		    properties:{
		    	type: "button",
		    	label: "Properties",
		    	icons: {primary: "ui-icon-css"},
		    	handler: function(){self.properties();},
		    	enabled:function(){return self._propertiesEnable();}
		    },
	    	cleanFormat:{
	    		type: "checkbox",
	    		label: "Clean Format",
	    		icons: {primary: "ui-icon-clean-format"},
	    		handler: function(){self.removeFormat();},
	    		enabled: function(){return self._commandEnabled("removeformat");},
	    		checked: function(){return self._commandState("removeformat");}
	    	},
	    	bold:{
	        	type: "checkbox",
	        	label: "Bold",
	    		icons: {primary: "ui-icon-bold"},
	        	handler: function(){self.bold();},
	    		enabled: function(){return self._commandEnabled("bold");},
	    		checked: function(){return self._commandState("bold");}
	    	},
	    	italic:{
	        	type: "checkbox",
	        	label: "Italic",
	    		icons: {primary: "ui-icon-italic"},
	        	handler: function(){self.italic();},
	    		enabled: function(){return self._commandEnabled("italic");},
	    		checked: function(){return self._commandState("italic");}
	    	},
	    	underline:{
	        	type: "checkbox",
	        	label: "Underline",
	    		icons: {primary: "ui-icon-underline"},
	        	handler: function(){self.underline();},
	    		enabled: function(){return self._commandEnabled("underline");},
	    		checked: function(){return self._commandState("underline");}
	    	},
	    	strikethrough:{
	        	type: "checkbox",
	        	label: "Strikethrough",
	    		icons: {primary: "ui-icon-strikethrough"},
	        	handler: function(){self.strikethrough();},
	    		enabled: function(){return self._commandEnabled("strikethrough");},
	    		checked: function(){return self._commandState("strikethrough");}
	    	},
	    	subscript:{
	        	type: "checkbox",
	        	label: "Subscript",
	    		icons: {primary: "ui-icon-subscript"},
	        	handler: function(){self.subscript();},
	    		enabled: function(){return self._commandEnabled("subscript");},
	    		checked: function(){return self._commandState("subscript");}
	    	},
	    	superscript:{
	        	type: "checkbox",
	        	label: "Superscript",
	    		icons: {primary: "ui-icon-superscript"},
	        	handler: function(){self.superscript();},
	    		enabled: function(){return self._commandEnabled("superscript");},
	    		checked: function(){return self._commandState("superscript");}
	    	},
	    	alignLeft:{
	        	name: "align",
	        	type: "radio",
	        	label: "Align left",
	    		icons: {primary: "ui-icon-align-left"},
	        	handler: function(){self.align("left");},
	        	enabled: function(){return self._alignEnable();},
	        	checked: function(){return self._alignActive("left");}
	    	},
	    	alignCenter:{
	        	name: "align",
	        	type: "radio",
	        	label: "Align center",
	    		icons: {primary: "ui-icon-align-center"},
	        	handler: function(){self.align("center");},
	        	enabled: function(){return self._alignEnable();},
	        	checked: function(){return self._alignActive("center");}
	    	},
	    	alignRight:{
	        	name: "align",
	        	type: "radio",
	        	label: "Align right",
	    		icons: {primary: "ui-icon-align-right"},
	        	handler: function(){self.align("right");},
	        	enabled: function(){return self._alignEnable();},
	        	checked: function(){return self._alignActive("right");}
	    	},
	    	alignFull:{
	        	name: "align",
	        	type: "radio",
	        	label: "Align full",
	    		icons: {primary: "ui-icon-align-full"},
	        	handler: function(){self.align("justify");},
	        	enabled: function(){return self._alignEnable();},
	        	checked: function(){return self._alignActive("justify");}
	    	},
	    	leftToRight:{
	    		name: "direction",
	        	type: "radio",
	        	label: "Left to right",
	    		icons: {primary: "ui-icon-left-to-right"},
	        	handler: function(){self.leftToRight();},
	        	checked: function(){return self._directionActive('ltr');}
	    	},
	    	rightToLeft:{
	    		name: "direction",
	        	type: "radio",
	        	label: "Right to left",
	    		icons: {primary: "ui-icon-right-to-left"},
	        	handler: function(){self.rightToLeft();},
	        	checked: function(){return self._directionActive('rtl');}
	    	},
	    	fontColor:{
	        	type: "colorPicker",
	        	label: "Font color",
	    		icons: {primary: "ui-icon-font-color"},
	    		handler  : function(c){ self.fontColor(c); },
	    		enabled : function(){ return self._colorEnable(this.element, "color"); }
	    	},
	    	backgroundColor:{
	        	type: "colorPicker",
	        	label: "Background color",
	        	color : "#FFFFFF",
	    		icons: {primary: "ui-icon-background-color"},
	    		handler  : function(c) {self.backgroundColor(c);},
	    		enabled : function(){ return self._colorEnable(this.element, "background-color"); }
	    	},
	    	font:{
	        	type     : "select",
	        	label  : "Font",
	    		tpl      : '<span style="font-family:%val">%label</span>',
	    		src      : {
	    			''                                                                    : 'Font',
	    			'andale mono,sans-serif'                                  : 'Andale Mono',
	    			'arial,helvetica,sans-serif'                                  : 'Arial',
	    			'arial black,gadget,sans-serif'                            : 'Arial Black',
	    			'book antiqua,palatino,sans-serif'                      : 'Book Antiqua',
	    			'comic sans ms,cursive'                                     : 'Comic Sans MS',
	    			'courier new,courier,monospace'                       : 'Courier New',
	    			'georgia,palatino,serif'                                      : 'Georgia',
	    			'helvetica,sans-serif'                                          : 'Helvetica',
	    			'impact,sans-serif'                                             : 'Impact',
	    			'lucida console,monaco,monospace'                  : 'Lucida console',
	    			'lucida sans unicode,lucida grande,sans-serif'     : 'Lucida grande',
	    			'tahoma,sans-serif'                                           : 'Tahoma',
	    			'times new roman,times,serif'                            : 'Times New Roman',
	    			'trebuchet ms,lucida grande,verdana,sans-serif'  : 'Trebuchet MS',
	    			'verdana,geneva,sans-serif'                               : 'Verdana'
	    		},
	    		select   : function(size) {self.font(size);},
	    		enabled  : function() {return self._fontEnable(this);}
	    	},
	    	fontSize:{
	        	type     : "select",
	        	label: "Font size",
	    		labelTpl : '%label',
	    		tpl : '<span style="font-size:%val;line-height:1.2em">%label</span>',
	    		src : {
	    			''         : 'Font size',
	    			'xx-small' : 'Small (8pt)', 
	    			'x-small'  : 'Small (10px)', 
	    			'small'    : 'Small (12pt)', 
	    			'medium'   : 'Normal (14pt)',
	    			'large'    : 'Large (18pt)',
	    			'x-large'  : 'Large (24pt)',
	    			'xx-large' : 'Large (36pt)'
	    		},
	    		select   : function(size) {self.fontSize(size);},
	    		enabled: function(){return self._fontSizeEnable(this);}
	    	},
	    	format:{
	        	type: "select",
	        	label: "Format",
	    		labelTpl : '%label',
	    		tpls     : {'' : '%label'},
	    		src      : {
	    			'span'    : 'Format',
	    			'h1'      : 'Heading 1',
	    			'h2'      : 'Heading 2',
	    			'h3'      : 'Heading 3',
	    			'h4'      : 'Heading 4',
	    			'h5'      : 'Heading 5',
	    			'h6'      : 'Heading 6',
	    			'p'       : 'Paragraph',
	    			'address' : 'Address',
	    			'pre'     : 'Preformatted',
	    			'div'     : 'Normal (DIV)'
	    		},
	    		select   : function(v) {self.format(v);	},
	    		enabled  : function(){return self._formatEnable(this);}
	    	},
	    	outdent:{
	        	type: "button",
	        	label: "Outdent",
	    		icons: {primary: "ui-icon-outdent"},
	        	handler: function(){self.outdent();},
	        	enabled: function(){return self._outdentEnable();}
	    	},
	    	indent:{
	        	type: "button",
	        	label: "Indent",
	    		icons: {primary: "ui-icon-indent"},
	        	handler: function(){self.indent();}
	    	},
	    	orderedList:{
	        	type: "button",
	        	label: "Ordered list",
	    		icons: {primary: "ui-icon-ordered-list"},
	        	handler: function(){self.orderedList();},
	    		enabled: function(){return self._commandEnabled("insertorderedlist");},
	    		checked: function(){return self._commandState("insertorderedlist");}
	    	},
	    	unorderedList:{
	        	type: "button",
	        	label: "Unordered List",
	    		icons: {primary: "ui-icon-unordered-list"},
	        	handler: function(){self.unorderedList();},
	    		enabled: function(){return self._commandEnabled("insertunorderedlist");},
	    		checked: function(){return self._commandState("insertunorderedlist");}
	    	},
	    	link:{
	        	type: "checkbox",
	        	label: "Link",
	    		icons: {primary: "ui-icon-link"},
	        	handler: function(){self.link();},
	        	enabled:function(){return self._linkEnable();},
	        	checked: function(){return self._linkActive();}
	    	},
	    	deleteLink:{
	        	type: "checkbox",
	        	label: "Delete Link",
	    		icons: {primary: "ui-icon-del-link"},
	        	handler: function(){self.deleteLink();	},
	        	enabled: function(){return self._deleteLinkEnable();},
	        	checked: function(){return self._deleteLinkEnable();}
	    	},
	    	horizontalRule:{
	        	type: "checkbox",
	        	label: "Horizontal rule",
	    		icons: {primary: "ui-icon-horizontal-rule"},
	        	handler: function(){self.horizontalRule();},
	        	checked:function(){ return o.mode == "design" && o.selection.getEnd() &&o.selection.getEnd().nodeName == 'HR';} 
	    	},
	    	blockQuote:{
	        	type: "checkbox",
	        	label: "Block quote",
	    		icons: {primary: "ui-icon-block-quote"},
	        	handler: function(){self.blockQuote();},
	    		enabled: function(){return self._blockQuoteEnable();},
	    		checked: function(){return self._blockQuoteEnable();}
	    	},
	    	blockElement:{
	        	type: "checkbox",
	        	label: "Block element (DIV)",
	    		icons: {primary: "ui-icon-block-element"},
	        	handler: function(){self.blockElement();},
	        	enabled: function(){return self._blockElementEnable();},
	        	checked: function(){return self._blockElementActive();}
	    	},
	    	stopFloat:{
	        	type: "checkbox",
	        	label: "Stop element floating",
	    		icons: {primary: "ui-icon-stop-float"},
	        	handler: function(){self.stopFloat();},
	        	checked: function(){return self._stopFloatActive();}
	    	},
	    	image:{
	        	type: "checkbox",
	        	label: "Image",
	    		icons: {primary: "ui-icon-image"},
	        	handler: function(){self.image();},
	        	checked: function(){return self._imageActive();}
	    	},
	    	table:{
	        	type: "button",
	        	label: "Table",
	    		icons: {primary: "ui-icon-table"},
	        	handler: function(){self._edittable(true);}
	    	},
	    	tableProps:{
	        	type: "button",
	        	label: "Table properties",
	    		icons: {primary: "ui-icon-table-props"},
	        	handler: function(){self._edittable();},
	        	enabled: function(){return self._tablePropsEnable();}
	    	},
	    	deleteTable:{
	        	type: "button",
	        	label: "Delete table",
	    		icons: {primary: "ui-icon-del-table"},
	        	handler: function(){self.deleteTable();},
	        	enabled: function(){return self._deleteTableEnable();}
	    	},
	    	rowBefore:{
	        	type: "button",
	        	label: "Insert row before",
	    		icons: {primary: "ui-icon-row-before"},
	        	handler: function(){self.insertTableRow("before");},
	        	enabled: function(){return self._rowBeforeEnable();}
	    	},
	    	rowAfter:{
	        	type: "button",
	        	label: "Insert row after",
	    		icons: {primary: "ui-icon-row-after"},
	        	handler: function(){self.insertTableRow("after");},
	        	enabled: function(){return self._rowAfterEnable();}
	    	},
	    	deleteRow:{
	        	type: "button",
	        	label: "Delete row",
	    		icons: {primary: "ui-icon-del-row"},
	        	handler: function(){self.deleteRow();},
	        	enabled: function(){return self._deleteRowEnable();}
	    	},
	    	columnBefore:{
	        	type: "button",
	        	label: "Insert column before",
	    		icons: {primary: "ui-icon-col-before"},
	        	handler: function(){self.insertTableColumn("before");},
	        	enabled: function(){return self._columnBeforeEnable();}
	    	},
	    	columnAfter:{
	        	type: "button",
	        	label: "Insert column after",
	    		icons: {primary: "ui-icon-col-after"},
	        	handler: function(){self.insertTableColumn("after");},
	        	enabled: function(){return self._columnAfterEnable();}
	    	},
	    	deleteColumn:{
	        	type: "button",
	        	label: "Delete column",
	    		icons: {primary: "ui-icon-del-column"},
	        	handler: function(){self.deleteColumn();},
	        	enabled: function(){return self._deleteColumnEnable();}
	    	},
	    	cellProps:{
	        	type: "button",
	        	label: "Table cell properties",
	    		icons: {primary: "ui-icon-cell-props"},
	        	handler: function(){self._cellProperties();},
	        	enabled: function(){return self._cellPropsEnable();}
	    	},
	    	mergeCells:{
	        	type: "button",
	        	label: "Merge table cells",
	    		icons: {primary: "ui-icon-merge-cells"},
	        	handler: function(){self.mergeCells();},
	        	enabled: function(){return self._mergeCellsEnable();}
	    	},
	    	splitCells:{
	        	type: "button",
	        	label: "Split table cells",
	    		icons: {primary: "ui-icon-split-cells"},
	        	handler: function(){self.splitCells();},
	        	enabled: function(){return self._splitCellsEnable();}
	    	},
	    	tabsx:{
	        	type: "checkbox",
	        	label: "Tabsx",
	    		icons: {primary: "ui-icon-tabsx"},
	        	handler: function(){self.rteWidget("tabsx", o.formIds.tabsx, {style:{width:400,height:300}});},
	        	checked: function(){return self.rteWidgetActive("tabsx");}
	    	},
	    	sourcecode:{
	        	type: "checkbox",
	        	label: "Source Code",
	    		icons: {primary: "ui-icon-sourcecode"},
	        	handler: function(){self.option("mode",o.mode =="sourcecode"?"design":"sourcecode");},
	        	checked: function(){return o.mode =="sourcecode";},
	        	enabled:function(){return true;}
	    	}
	    };
	    
	    $.each(actions, function(){
	    	this.text = false;
	    	if(!this.enabled){
	    		this.enabled = function(){
	    			return o.mode == "design";
	    		};
	    	}
	    });
	    
	    return actions;
	},
	
	destroy: function() {
		var o = this.options, doc = o.doc;
		o.history=[];
		this.toolbar && this.toolbar.remove();
		this.source.unbind(".rte");
		$(doc).unbind(".rte");
		this.$body.unbind('.rte');
		$(o.win).unbind(".rte");
		$(window).unbind("resize.rte", this._proxy);
		this.element.removeClass( "an-rte" );
		return $.Widget.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
