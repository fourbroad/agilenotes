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

$.widget( "an.workbench", {
	options: {
		westWidth: 320,
		eastWidth: 260,
		westViews: "",
		eastViews: "",
		sideViews: [{id:"50faab53a092004045000001", anchor:"west"}],
		openedDocuments:[]
	},

	_create: function() {
		this.element.addClass("an-workbench");
		var self = this, o = this.options;
		document.title=o.title || "Agile Notes";
		this.element.border({
			north:{selector:".north", height:28},
			west:{selector:".west", width:0, resizable:false},
			east:{selector:".east", width:0, resizable:false},
			south:{selector:".south", height:18},
			center:{selector:".center"},
			optionchanged:function(e,data){
				if(data.key == "west" || data.key == "east"){
					if(data.value.width) o[data.key+"Width"] = data.value.width;
					self._saveOptions();
				}
			}
		});
		
		$(["center","west","east"]).each(function(k,v){
			var node = $("#"+v+"-tabs",self.element);
			node.tabsx({
				tabTemplate: "<li><a href='#{href}' hidefocus='true'>#{label}</a> <span class='ui-icon ui-icon-close'>Remove Tab</span></li>",
				showTabsContextMenu:true,
				add: function(e, ui ) { if(v == "center") node.tabsx('select', '#' + ui.panel.id); },
				show: function(e, ui) {
					var panel = $(ui.panel), editor;
					$.each(["editor","gridview", "formview", "page"], function(k,v){
						editor = panel.data(v); 
						if(editor) {
							var title = editor.option('title');
							document.title = o.title +" - "+title;
							self.reloadToolbar();
							self._notifyOutline();
							return false;
						}
					});
				},
				remove: function(e, ui) {
					if(v == "center"){
						if(node.tabsx("length") == 0){
							document.title = o.title;;
							self.reloadToolbar();
							self._notifyOutline();
						}
						self._afterCloseEditor({workbench:self, id:$(ui.panel).attr("id")});
					}else if(v == "west" || v == "east"){
						var id = $(ui.panel).attr("id"), index = -1;
						$.each(o.sideViews, function(k,sv){
							if(id == sv.id && v == sv.anchor){
								index = k;
								return false;
							}
						});
						o.sideViews.splice(index,1);
						self._saveOptions();

						if(node.tabsx("length") == 0){
							self.element.border("option",v,{width:0, resizable:false});
						}
					}
				}
			});
			
			node.delegate("span.ui-icon-close", "click", function(){
				var index = $("li", node).index( $(this).parent());
				var saveBtn=self.toolbar.find('button[title="Save"]');
				if(!saveBtn.attr('disabled')&&$("li", node).eq(index).hasClass('ui-tabs-selected')){
					showDialog('Confirm', 'Do you want to save the changes?',{buttons:[{
						text: "OK",
						handler: function(dialog){
							saveBtn.trigger('click');
							node.tabsx("remove", index);
							dialog.close();
						}
					},{
						text: "Cancel",
						handler: function(dialog){
							node.tabsx("remove", index);
							dialog.close();
						}
					}]});
					return ;
				}
				node.tabsx("remove", index);
			});
			
			self[v+"Tabs"] = node;
		});
		this.statusBar = $(".south",self.element);

		this.element.ajaxComplete(function(event,request, settings){
			switch(request.status){
			case 401:
				self._login();
				break;
			default:
				break;
			}
		});
		
		// load validate methods. 
		$.ans.getDoc(o.dbId, null, {selector:{type:Model.VALIDATE_METHOD}},function(err,data){
			if(err){
				console.log("Load validate methods error: " + err);
			}else{
				$.each(data.docs,function(){
					$.validator.addMethod(this.name, eval("(0,"+this.handler+")"), this.message);
				});
			}
		});

		// load actions of document.
		this._loadActions(function(){
			self._initMainToolbar();
			// load opened documents.
			$.each(o.openedDocuments||[], function(){self[this.method](this.id, this.options);});
			// load side views.
			$.each(o.sideViews, function(){ self.showSideView(this.id, this.anchor, this.options); });
		});
		
		this.element.bind("rteoptionchanged.workbench",function(e, data){
			if(data.key == "path"){
				self.statusBar.html(data.value);
				self.toolbar.toolbar("refresh");
			}else if(data.key == "undoable"||data.key == "redoable"){
				self.toolbar.toolbar("refresh");
			}
        }).bind("selectionChanged.workbench",function(e){
			self.toolbar.toolbar("refresh");
        });
		
		this._proxy = $.proxy(function(e){
			if(e.target===window){
				if(this.toolbar.toolbar("option","isEmpty")){
					$(this.element).border("option",{
						north : { height : "0" }
					});
				}else{
					var height = this.toolbar.outerHeight(true);
					$(this.element).border("option",'north',{height:height ? height : 0});
				}
			}
		},this);
		$(window).bind("resize.workbench", this._proxy);

		$(document).bind("documentChanged.workbench documentCreated.workbench", function(e,data){
			var hit = false;
			$.each($.isArray(data)?data:[data], function(k,v){
				self.centerTabs.find("a[href^=#"+v._id+"]").html(v.title);
				if(v.type == Model.ACTION){ hit = true; }
			});
			if(hit) self._loadActions(function(){ self._initMainToolbar(); });
		}).bind("documentDeleted.workbench",function(e,data){
			$.each($.isArray(data)?data:[data], function(k,v){
				self.centerTabs.find("a[href^=#"+v._id+"]").each(function(){
					var href = $(this).attr("href");
					if(href){
						self.centerTabs.tabsx("remove",href.substring(1));
					}
				});
			});
			self._loadActions(function(){ self._initMainToolbar(); }); // TODO 优化工具条的刷新。
		});

		window.workbench = this;
	},

	_afterOpenEditor:function(data){
	    var o = this.options, hit = false;
	    o.openedDocuments = o.openedDocuments||[];
	    $.each(o.openedDocuments, function(){
	    	if(this.id == data.id && this.method == data.method) hit = true;
	    });
	    if(!hit && !(data.options&&data.options.isNew)){
	    	o.openedDocuments.push(data);
		    this._saveOptions();
	    }
	},

	_afterCloseEditor:function(data){
		var o = this.options, m = data.id.match(/([^-]+)-([^-]+)/), index = -1,
		type = m[2].substring(0,1).toUpperCase()+m[2].substring(1);
		$.each(o.openedDocuments, function(k,v){
			if(v.method == ("open"+type) && v.id == m[1]){
				index = k;
				return false;
			}
		});
		o.openedDocuments.splice(index,1);
		this._saveOptions();
	},
	
	_afterShowSideView:function(data){
		var o = this.options, hit = false;
		$.each(o.sideViews,function(){
			if(this.id == data.id && this.anchor == data.anchor) hit = true;
		});
	    if(!hit){
	    	o.sideViews.push(data);
		    this._saveOptions();
	    }
	},
	
	_loadActions:function(afterLoad){
		var self = this, o = this.options, sel = {$or:[]};
		this.startNewActions = [];
		this.toolbarGlobalActions = [];
		this.toolbarHeaderActions = [];
		this.toolbarMiddleActions = [];
		this.toolbarTailActions = [];
		this.showSideViewActions = [];
		this.documentClickActions = [];
		this.documentDoubleClickActions = [];
		this.categoryContextMenuNewActions = []; // New of context menu.
		this.documentContextMenuCenterActions = []; // Center of context menu.
		this.documentContextMenuTopActions = []; // Top of context menu.
		this.documentContextMenuBottomActions = []; // Bottom of context menu.
		$.each(["startNew","toolbarGlobal","toolbarHeader","toolbarMiddle","toolbarTail",
		        "showSideView","documentClick", "documentDoubleClick", 
		        "categoryContextMenuNew","documentContextMenuCenter", 
		        "documentContextMenuTop", "documentContextMenuBottom"], function(){
			sel.$or.push({type:Model.ACTION, extendPoint:this});
		});
		$.ans.getDoc(o.dbId, null, {selector:sel},function(err,data){
			if(err){
				console.log("Load Actions Error","Load actions error: "+err);
			}else{
				$.each(data.docs,function(){
					self[this.extendPoint+"Actions"].push(this);
				});
				afterLoad();
			}
		});
	},
	
	_initMainToolbar:function(){
		var self = this, o = this.options;
		
		// Set up start menu actions
		var startActions = [], children = [];

		// Add new Actions.
		$.each(this.startNewActions, function(k,v){
    		children.push({
    				id: k,
    				type:"menuItem",
    				text:v.title||v.name||k,
    				handler:eval("(0,"+(v.handler||"function(){}")+")"),
    				enabled:eval("(0,"+(v.enabled||"function(){return false;}")+")")
    		});
		});
		if(this.startNewActions.length > 0) children.push({type:"seperator"});
		children.push({
			id: "others",
			type: "menuItem",
			text: "Others ...",
			handler:function(){
				$("<div class='workbench'/>").dialog({
					title:"New Document",
					height: 460,
					width: 320,
					modal: true,
					create: function(event, ui){
						var $this = $(this);
						$this.sideview({
							dbId:o.dbId, 
							roots:Model.META_ROOT,
							docdblclick:function(e,doc){ self.newDocument(doc._id);$this.dialog("close"); }
						});
						setTimeout(function(){ $this.sideview("expand", Model.META_ROOT); },200);
					},
					buttons: {
						OK: function() {
							var $this= $(this), docIds = $this.sideview("option","selectedNodes");
							$.each(docIds,function(){self.newDocument(this); });
							$this.dialog( "close" );
						},
						Cancel: function() { $( this ).dialog( "close" );}
					},
					close: function(e, ui){$(this).remove();}
				});
			},
			enabled:function(){return true;}
		});
		startActions.push({ type:"submenu", text:"New", children:children});

		// Add show side view actions.
		children = [];
		$.each(this.showSideViewActions, function(k,v){
    		children.push({
    				id: k,
    				type:"menuItem",
    				text:v.title||v.name||k,
    				handler:eval("(0,"+(v.handler||"function(){}")+")"),
    				enabled:eval("(0,"+(v.enabled||"function(){return false;}")+")")
    		});
		});
		if(this.showSideViewActions.length > 0) children.push({type:"seperator"});
		children.push({
			id: "others",
			type:"menuItem",
			text:"Others ...",
			handler:function(){
				$("<div class='workbench'/>").dialog({
					title:"Show Side View",
					height: 460,
					width: 320,
					modal: true,
					create: function(event, ui){
						var $this = $(this);
						$this.sideview({
							dbId:o.dbId, 
							roots: Model.SIDE_VIEW_ROOT,
							docdblclick:function(e,doc){ self.showSideView(doc._id);$this.dialog("close"); }
						});
						setTimeout(function(){ $this.sideview("expand", Model.SIDE_VIEW_ROOT); },200);
					},
					buttons: {
						OK: function() {
							var $this= $(this);
							$.each($this.sideview("option","selectedNodes"),function(){ self.showSideView(this); });
							$this.dialog( "close" );
						},
						Cancel: function() { $( this ).dialog( "close" );}
					},
					close: function(e, ui){$(this).remove();}
				});
			},
			enabled:function(){return true;}
		});
		startActions.push({ type:"submenu", text:$.i18n["showSideView"], children:children});
		startActions.push({type:"seperator"});
		startActions.push({id:"login", type:"menuItem", text:"Login ...",handler:function(){self._login();},enabled:function(){return true;}});
		startActions.push({id:"logout", type:"menuItem", text:"Logout",handler:function(){self._logout();},enabled:function(){return true;}});

    	// Set up global actions.
    	var globalActions = {};
    	$.each(this.toolbarGlobalActions, function(k,v){ // 'cut','copy','paste','undo','redo'
    		globalActions[v._id] = {
    			_id: v._id,
    			type: "button",
    			label: v.title || v.name,
    			text: false,
    			icons: {primary: "ui-icon-"+v.name},
    			handler: eval("(0,"+(v.handler||"function(){}")+")"),
    			enabled: eval("(0,"+(v.enabled||"function(){return false;}")+")")
    		};
    		if(v.icon && (v.icon.length > 0)&& v.icon[0].metadata){
    			globalActions[v._id].iconFile = "/dbs/"+o.dbId+"/"+v._id+"/attachments/"+v.icon[0].metadata.filepath;
    		}
    	});

    	if(this.toolbar) this.toolbar.remove();
    	this.toolbar = $("<div id='main' class='ui-corner-all'/>").appendTo($(".north",self.element)).toolbar({
			startAction:{
				startAction:{
					type: "button",
					label: "Agile Notes",
					icons: { primary: "ui-icon-home", secondary: "ui-icon-triangle-1-s" },
					actions:startActions,
					enabled:function(){return true;}
				}
			},
			globalActionSet:globalActions
		});
    	this.reloadToolbar();
	},

	reloadToolbar: function(){	
		var _this=this;
		clearTimeout(_this.time);
		_this.time=setTimeout(function(){
			console.log("reloadToolbar............................!");

			var editor = _this.currentEditor(), actionSets = [];
			if(editor){
				function createActionSet(actions, context){
					var actionSet = {};
					$.each(actions, function(k,v){
						filter = eval("(0,"+(v.filter||"function(){return true}")+")");
						if(filter(context)){
							actionSet[v._id] = {
								_id: v._id,
								type: v.actionType || "button",
								label:v.title || v.name,
								text: false,
								icons:{primary: "ui-icon-"+v.name},
								iconFile:v.icon,
								handler: eval("(0,"+(v.handler||"function(){}")+")"),
								enabled: eval("(0,"+(v.enabled||"function(){return false;}")+")"),
								checked: eval("(0,"+(v.checked||"function(){return false;}")+")")
							};
							if(v.icon && (v.icon.length > 0)&& v.icon[0].metadata){
								actionSet[v._id].iconFile = "/dbs/"+context.dbId+"/"+v._id+"/attachments/"+v.icon[0].metadata.filepath;
							}
						}
					});
					return actionSet;
				}
				
				var tas = editor.widget().data("toolbarActions"), dbId = editor.widget().data("dbid")||_this.options.dbId, 
					context = {editor:editor, dbId:dbId}, ass = editor.option('actionSets'), actionSet = {}, filter;
				actionSet = createActionSet((tas&&tas.toolbarHeaderActions)||_this.toolbarHeaderActions, context);
				if(!$.isEmptyObject(actionSet)) actionSets.push(actionSet);
				if($.isArray(ass)) actionSets = actionSets.concat(ass);
				actionSet = createActionSet((tas&&tas.toolbarHeaderActions)||_this.toolbarMiddleActions, context);
				if(!$.isEmptyObject(actionSet)) actionSets.push(actionSet);
				actionSet = createActionSet((tas&&tas.toolbarHeaderActions)||_this.toolbarTailActions, context);
				if(!$.isEmptyObject(actionSet)) actionSets.push(actionSet);
			}
			_this.toolbar.toolbar("option","actionSets", actionSets);
			if(_this.toolbar.toolbar("option","isEmpty")){
				_this.element.border("option",'north',{height:"0"});
			}else{
				var height = _this.toolbar.outerHeight(true);
				_this.element.border("option",'north',{height:height ? height :"0"});
			}
		},900);
	},
	
	currentEditor:function(){
		var panel = $(this.centerTabs.tabsx("option","selectedPanel")), data = panel.data(), editor = null;
		$.each(data||{}, function(k,v){
			if($.inArray(k,["editor","gridview","formview","customview","page"]) != -1){
				editor = v;
				return false;
			}
		});
		return editor;
	},

	_saveOptions:function(){
		var o = this.options, opts = {};
		if(o.openedDocuments.length) opts.openedDocuments = o.openedDocuments;
		if(o.westWidth) opts.westWidth = o.westWidth;
		if(o.eastWidth) opts.eastWidth = o.eastWidth;
		if(o.sideViews.length) opts.sideViews = o.sideViews;
		$.cookie(o.dbId, $.toJSON(opts));
	},
	
	_login:function(){
		var o = this.options;
		var login=function($this){
			$.ans.login($this.editor("option","document"),function(err,result,real){
				if(real.success){
					window.location.reload();
				}else{
					showDialog("Login Failed","Login failed: "+ real.msg);
				}
				$this.dialog( "close" );
			});
		}
		$("<div class='workbench'/>").dialog({
			title:"Login",
			height: 260,
			width: 380,
			modal: true,
			create: function(event, ui){
				var $this = $(this);
				$.ans.getDoc(o.dbId, "50accac59555dbe125000002", null, function(err,form){
					if(err){
						console.log("Load Form Error", "Load form error: "+err);
					}else{
						$this.editor({document:{}, forms:[form] ,dbId:o.dbId, mode:"edit", ignoreEscape:true});
					}
				});
				$this.bind("keyup",function(e){
					if(e.keyCode==$.ui.keyCode.ENTER){
						login($(this));
					}
				});
			},
			buttons: {
				OK: function() {
					login($(this));
				},
				Cancel: function() { $( this ).dialog( "close" );}
			},
			close: function(e, ui){$(this).remove();}
		});
	},
	
	_logout:function(){
		$.ans.logout(function(err,result){window.location.reload();});
	},
	
	showSideView:function(viewId, anchor, opts){
		var self = this, o = this.options, dbId = (opts&&opts.dbId) || o.dbId;
		$.ans.getDoc(dbId, viewId, null, function(err, sideView){
			if(err){
				console.log("Load view "+viewId+"error: "+err);
			}else{
				if(sideView && sideView.category == "treeView"){
					if(dbId != o.dbId){
						var sel = {$or:[]}, actions = {};
						actions.documentClickActions = [];
						actions.documentDoubleClickActions = [];
						actions.categoryContextMenuNewActions = []; // New of context menu.
						actions.documentContextMenuCenterActions = []; // Center of context menu.
						actions.documentContextMenuTopActions = []; // Top of context menu.
						actions.documentContextMenuBottomActions = []; // Bottom of context menu.
						$.each(["documentClick", "documentDoubleClick", "categoryContextMenuNew", 
						        "documentContextMenuCenter", "documentContextMenuTop",
						        "documentContextMenuBottom"], function(){
							sel.$or.push({type:Model.ACTION, extendPoint:this});
						});
						$.ans.getDoc(dbId, null, {selector:sel},function(err,data){
							if(err){
								console.log("Load actions error:"+err);
							}else{
								$.each(data.docs,function(){
									actions[this.extendPoint+"Actions"].push(this);
								});
								self._doShowSideView(sideView, anchor||"west", actions, opts);
							}
						});
					}else{
						self._doShowSideView(sideView, anchor||"west", null, opts);
					}
				}else if(sideView && sideView.category == "outline"){
					self._doShowOutline(sideView, anchor||"east", opts);
				}
			}
		});
		
	},
	
	_docClick:function(context, actions){
		var filter, action = {};
		$.each(actions, function(k,v){
			filter = eval("(0,"+(v.filter||"function(){return true}")+")");
			if(filter(context)){
				$.extend(true,action,v);
				action.context = context;
				action.handler = eval("(0,"+(v.handler||"function(){}")+")");
				action.handler();
				return false;
			}
		});
	},

	_docDblClick:function(context, actions){
		var filter, action = {}, hit = false;
		$.each(actions, function(k,v){
			filter = eval("(0,"+(v.filter||"function(){return true}")+")");
			if(filter(context)){
				$.extend(true, action, v);
				action.context = context;
				action.handler = eval("(0,"+(v.handler||"function(){}")+")");
				action.handler();
				hit = true;
				return false;
			}
		});
		if(!hit) this.openDocument(context.document._id, {dbId:context.dbId});
	},
	
	_docContextMenuActions:function(inActions, context, outActions){
		function addAction(v){
			filter = eval("(0,"+(v.filter||"function(){return true}")+")");
			if(filter(context)){
				outActions.push({ type:"menuItem", text: v.title, context:context, handler:eval("(0,"+(v.handler||"function(){}")+")") });
			}
		}
		$.each((inActions&&inActions.documentContextMenuTopActions) || this.documentContextMenuTopActions, function(k,v){addAction(v);});
		if(outActions.length > 0) outActions.push({type:"seperator"});
		$.each((inActions&&inActions.documentContextMenuCenterActions) || this.documentContextMenuCenterActions, function(k,v){addAction(v);});
		if(outActions.length >= 1&&outActions[outActions.length-1].type != "seperator") outActions.push({type:"seperator"});
		$.each((inActions&&inActions.documentContextMenuBottomActions) || this.documentContextMenuBottomActions, function(k,v){addAction(v);});
		if(outActions.length>=1&&outActions[outActions.length-1].type == "seperator") outActions.pop();
		return outActions;
	},
	
	_doShowSideView: function(sideView, anchor, actions, opts){
		var self = this, o = this.options, title = sideView.title||sideView.name||sideView._id, 
		    dbId = (opts&&opts.dbId) || o.dbId, tabs = this[anchor+"Tabs"], id = sideView._id, 
		    el = this.element, panel = tabs.find("#"+id);
		if(panel.size() > 0) return;
		
		var a = el.border("option",anchor);
		if(!a.width) el.border("option",anchor, {width:o[anchor+"Width"], resizable:o[anchor+"Width"]>0});

		tabs.tabsx("add","#"+id, title);
		var sv = $("#"+id, tabs).sideview($.extend({
			dbId:dbId,
			drop:function(e,data){
				var $this = $(this), s = data.source.data, t = data.target.data;
				if(s._path == (t._path + s._id+",")) return;
				$.ans.getDoc(dbId, "50d820e0a09200787e000000",{options:{exec:true, docId:s._id, parentId:t._id}},function(err, result){
					if(!err){
						$this.sideview("delete", s._id).sideview("add", t._id, data.source);
					}
					self.statusBar.html("Move " + s.name+" "+(err||result));
				});
			},
			nodeclick: function(e, node){
				var doc = node.data, context = {dbId:dbId, sideview: sv.sideview("option","sideview"), document:doc },
				      as = (actions&&actions.documentClickActions)||self.documentClickActions;
				self._docClick(context, as);
			},
			nodedblclick:function(e,node){
				var doc = node.data, context = {dbId:dbId, sideview: sv.sideview("option","sideview"), document:doc },
				    as = (actions&&actions.documentDoubleClickActions) || self.documentDoubleClickActions;
				self._docDblClick(context, as);
			},
			contextmenu: function(e,node){
				e.preventDefault();
				e.stopImmediatePropagation();
				var doc = node.data, oe = e.originalEvent, outActions = [], 
				    rootId = $(e.currentTarget).closest("li.root").attr("id"), filter, 
				    context = { dbId: dbId, document: doc, rootId : rootId, parent: (node.parent && node.parent.data)||null, sideview: sv.data("sideview")};
				if(doc.type == Model.CATEGORY || doc.type == Model.OU || doc.type == Model.GROUP || doc.type == Model.ROLE){
					var children = [];
					$.each((actions&&actions.categoryContextMenuNewActions)||self.categoryContextMenuNewActions, function(k,v){
						filter = eval("(0,"+(v.filter||"function(){return true}")+")");
						if(filter(context)){
							children.push({type:"menuItem", text: v.title, context:context, handler:eval("(0,"+(v.handler||"function(){}")+")")});
						}
					});
					if(!$.isEmptyObject(children)){
						outActions.push({ type: "submenu", text: "New", children:children});
					}
				}
				outActions = self._docContextMenuActions(actions,context, outActions);
				if(outActions.length > 0){
					$(oe.target).menu({
						autoShow: true,
						menuPosition:{of: oe},
						actions: outActions,
						select: function(e,ui){ $(this).menu("destroy"); },
						collapseAll: function(e){ $(this).menu("destroy"); }
					});
				}
			},
			create:function(e,data){
				self._afterShowSideView({id:sideView._id, anchor: anchor, options:opts});
			}
		}, sideView, opts));
	},

	_doShowOutline: function(sideView, anchor, opts){
		var self = this, o = this.options, title = sideView.title||sideView.name||sideView._id, 
		    tabs = this[anchor+"Tabs"], id = sideView._id, el = this.element, panel = tabs.find("#"+id);
		if(panel.size() > 0) return;

		var a = el.border("option",anchor), editor = this.currentEditor();
		if(!a.width) el.border("option",anchor, {width:o[anchor+"Width"], resizable:o[anchor+"Width"]>0});

		tabs.tabsx("add","#" + id, title).children("#"+id).outline({
			contentProvider: editor ? editor.option('outline'): null,
			create:function(e,data){
				self._afterShowSideView({id:sideView._id, anchor: anchor, options:opts});
			},
			nodehover: function(e, node){
				var widget = node.data;
				widget && widget.highlight();
				e.preventDefault();
			},
			nodeclick: function(e, node){
				var widget = node.data;
				widget&&widget.scrollTo({ onlyIfOutside: true, offsetTop: 100, offsetLeft: 100 });
			},
			nodedblclick:function(e, node){
				var widget = node.data;
				widget&&widget.widget().dblclick();
			}
		});		
	},
	
	authorization:function(docId, opts){
		var o = this.options, dbId = (opts&&opts.dbId) || o.dbId;
		$.ans.getDoc(dbId, docId, null,function(err,doc){
			if(err){
				console.log("Load document "+docId+" error: "+err);
			}else{
				var sel;
				if(doc.type == Model.META){
					sel = {$or:[{_id:"a417d20f9fa10c25dad56974"},{_id:"e2922e5edc79a1b28c0199e9"}]};
				}else{
					sel = {_id:"a417d20f9fa10c25dad56974"};
				}
				$.ans.getDoc(Model.ADMINDBID, null, {selector:sel},function(err,data){
					if(err){
						console.log("Load forms error: "+err);
					}else{
						$("<div/>").authorization({
							title: "Authorization - "+(doc.title||doc.name||doc._id),
							dbId:Model.ADMINDBID,
							document:doc,
							forms:data.docs,
							buttons:[{
								text: "Save",
								click: function(){
									var $this = $(this), doc = $this.authorization("option","document");
									Model.updateDocument(dbId, doc._id, doc, null, function(err,result){
										if(err) console.log("Save authorization error: "+err);
										$this.authorization("close");
									});
								}
							},{
								text: "Cancel",
								click: function(){ $(this).authorization("close"); }
							}],
							close: function(e, ui){$(this).remove();}
						});
					}
				});				
			}
		});
	},
	
	execute: function(doc, opts){
		var self = this, o = this.options, dbId = (opts&&opts.dbId)||o.dbId;
		$.ans.getDoc(dbId, doc._id,{options:{exec:true}},function(err, doc){
			if(opts.notify){
				self.statusBar.html("Execute " + doc.name+" "+(doc.result||doc.error));
			}
		});
	},
	
	_notifyOutline:function(){
		$(window).trigger($.Event("outline",{workbench:this})); 
	},
	
	_notifyWidgetSelect:function(widget){
		$(window).trigger($.Event("widgetselect",{workbench:this}),widget);
	},
	
	newDocument:function(typeId, opts){
		opts = opts || {};
		var self = this, o = this.options, dbId = opts.dbId || o.dbId, id = new ObjectId().toString(),
		    title = opts.title||id, pid = id,
		    optsx = $.extend(true,{
			    id: id,
			    tabsPosition:"bottom",
			    optionchanged:function(e,data){
			    	if(data.key == "isDocDirty"||data.key == "isFormDirty"){
			    		self.toolbar.toolbar("refresh");
			    	}else if(data.key == "mode"){
			    		self.reloadToolbar(); 
			    	}
			    },
			    change:function(e,form){self._notifyOutline();},
			    tabshow:function(e,target){self.reloadToolbar(); self._notifyOutline();},
			    tabcreated:function(e,target){self.reloadToolbar(); self._notifyOutline();},
				saved:function(err,doc,bl){
					var type={"000000000000000000000001":"openDocument","000000000000000000000002":"openForm","000000000000000000000003":"openView","000000000000000000000004":"openPage"};
					var data={method:type[doc.type], id:doc._id};
					if(bl){
						self.options.openedDocuments.push(data);
						self._saveOptions();
					}
				}
		    },opts);
		if(typeId == Model.FORM){
			pid = pid+"-form";
			optsx.isFormEditor = true; 
		}else if(typeId == Model.PAGE){
			pid = pid+"-page";
			optsx.isPageEditor = true; 
		}else if(typeId == Model.VIEW){
			pid = pid+"-view";
		}else{
			pid = pid+"-document";
		}
		var el = this.centerTabs.tabsx("add","#"+pid, title).children("#"+pid);
		optsx.opened = function(editor){
			document.title = o.title +" - "+title;
			self.reloadToolbar();
	    	opts.opened && opts.opened(editor);
		};
		Model.newDocument(el, dbId, typeId, optsx);
	},
	
	copyDocument:function(docId, opts){
		opts = opts || {};
		var self = this, o = this.options, dbId = opts.dbId || o.dbId;
		$.ans.getDoc(dbId, docId, null, function(err,doc){
			if(err){
				console.log("Load document "+docId+" error: "+err);
			}else{
				self.newDocument(doc.type,$.extend(true,{"default":doc, title:doc.title||doc.name},opts));
			}
		});
	},

	openDocument: function(docId, opts){
		opts = opts || {};

		var self = this, o = this.options, dbId = opts.dbId || o.dbId, tabs = this.centerTabs,
		    pid = docId+"-document"; 
		if(tabs.tabsx("panel", pid).size() > 0){
			tabs.tabsx("select", pid);
			return;
		}

		function doOpenDoc(el, dbId, docId, opts){
			var optsx = $.extend(true,{
			    id: docId,
			    tabsPosition:"bottom",
			    optionchanged:function(e,data){
			    	if(data.key == "isDocDirty"||data.key == "isFormDirty"){
			    		self.toolbar.toolbar("refresh");
			    	}else if(data.key == "mode"){
			    		self.reloadToolbar(); 
			    	}
			    },
			    change:function(e,form){self._notifyOutline();},
			    tabshow:function(e,target){self.reloadToolbar(); self._notifyOutline();},
			    tabcreated:function(e,target){self.reloadToolbar(); self._notifyOutline();}
		    },opts);
			optsx.opened = function(editor){
				var doc = editor.option("document"), title = doc.title || doc.name || docId;
				tabs.find(".ui-tabs-nav>li>a[href=#"+pid+"]").html(title);
				document.title = o.title +" - "+title;
				self._afterOpenEditor({method:"openDocument", id:docId, options:opts});
		    	opts.opened && opts.opened(editor);
			};
			Model.openDocument(el, dbId, docId, optsx);
		}

		var el = tabs.tabsx("add","#"+pid, "...").children("#"+pid);
		if(dbId != o.dbId){
			Model.loadToolbarActions(dbId, function(err, toolbarActions){
				if(err){
					showDialog("Load Toolbar Actions", "Load toolbar actions: "+err);
				}else{
					el.data("toolbarActions",toolbarActions).data("dbId", dbId);
				}
				doOpenDoc(el, dbId, docId, opts);
			});
		}else{
			doOpenDoc(el, dbId, docId, opts);
		}
	},
	
	openForm:function(formId, opts){
		opts = opts || {};
		$.extend(true,opts,{isFormEditor:true});

		var self = this, o = this.options, dbId = opts.dbId || o.dbId, tabs = this.centerTabs,
		    pid = formId+"-form"; 
		if(!opts.preview && tabs.tabsx("panel",pid).size() > 0){
			tabs.tabsx("select",pid);
			return;
		}
		
		function doOpenForm(el, dbId, formId, opts){
			var optsx = $.extend(true,{
				tabsPosition:"bottom",
			    optionchanged:function(e,data){
			    	if(data.key == "isDocDirty" || data.key == "isFormDirty"){
			    		self.toolbar.toolbar("refresh");
			    	}else if(data.key == "mode"){
			    		self.reloadToolbar(); 
			    	}
			    },
			    widgetselect:function(e,widget){self._notifyWidgetSelect(widget);},
			    change:function(e,form){self._notifyOutline();},
			    tabshow:function(e,target){self.reloadToolbar(); self._notifyOutline();},
			    tabcreated:function(e,target){self.reloadToolbar(); self._notifyOutline();}
	        },opts);
			optsx.opened = function(editor){
				var doc = editor.option("document"), title = doc.title || doc.name || formId;
				tabs.find(".ui-tabs-nav>li>a[href=#"+pid+"]").html(title);
				document.title = o.title +" - "+title;
				self._afterOpenEditor({method:"openForm", id:formId, options:opts});
		    	opts.opened && opts.opened(editor);
			};
			Model.openPage(el, dbId, formId, optsx);
		}
		
		var el = null;
		if(!opts.preview){
			el= this.centerTabs.tabsx("add","#"+pid, "...").children("#"+pid);
		}
		if(dbId != o.dbId){
			Model.loadToolbarActions(dbId, function(err, toolbarActions){
				if(err){
					showDialog("Load Toolbar Actions", "Load toolbar actions: "+err);
				}else{
					el.data("toolbarActions",toolbarActions).data("dbId", dbId);
				}
				doOpenForm(el, dbId, formId, opts);
			});
		}else{
			doOpenForm(el, dbId, formId, opts);
		}
		
		return this;
	},

	openPage:function(pageId, opts){
		opts = opts || {};
		$.extend(true,opts,{isPageEditor:true});
		
		var self = this, o = this.options, dbId = opts.dbId || o.dbId, tabs = this.centerTabs,
		    pid = pageId+"-page"; 
		if(!opts.preview && tabs.tabsx("panel",pid).size() > 0){
			tabs.tabsx("select",pid);
			return;
		}
		
		function doOpenPage(el, dbId, pageId, opts){
			var optsx = $.extend(true,{
				tabsPosition:"bottom",
			    optionchanged:function(e,data){
			    	if(data.key == "isFormDirty"){
			    		self.toolbar.toolbar("refresh");
			    	}else if(data.key == "mode"){
			    		self.reloadToolbar(); 
			    	}
			    },
			    widgetselect:function(e,widget){self._notifyWidgetSelect(widget);},
			    change:function(e,form){self._notifyOutline();},
			    tabshow:function(e,target){self.reloadToolbar(); self._notifyOutline();},
			    tabcreated:function(e,target){self.reloadToolbar(); self._notifyOutline();}
	        },opts);
			optsx.opened = function(editor){
				var doc = editor.option("document"), title = doc.title || doc.name || doc._id;
				tabs.find(".ui-tabs-nav>li>a[href=#"+pid+"]").html(title);
				document.title = o.title +" - "+title;
				self._afterOpenEditor({method:"openPage", id:pageId, options:opts});
		    	opts.opened && opts.opened(editor);
			};
			Model.openPage(el, dbId, pageId, optsx);
		}
		
		var el = null;
		if(!opts.preview){
			el= this.centerTabs.tabsx("add","#"+pid, "...").children("#"+pid);
		}
		if(dbId != o.dbId){
			Model.loadToolbarActions(dbId, function(err, toolbarActions){
				if(err){
					showDialog("Load Toolbar Actions", "Load toolbar actions: "+err);
				}else{
					el.data("toolbarActions",toolbarActions).data("dbId", dbId);
				}
				doOpenPage(el, dbId, pageId, opts);
			});
		}else{
			doOpenPage(el, dbId, pageId, opts);
		}
		
		return this;
	},
	
	openView:function(viewId, opts){
		opts = opts || {};

		var self = this, o = this.options, dbId = opts.dbId || o.dbId, tabs = this.centerTabs, 
		    pid = viewId+"-view", el = tabs.tabsx("panel", pid); 
		if(el.size() > 0){
			tabs.tabsx("select", pid);
			if(el.is(".an-editor") && opts.mode != "design"){
				el.editor("destroy");
			} else if (el.is(".an-formview, .an-gridview, .an-customview") && opts.mode == "design"){
				var data = el.data();
				for(var i in data){
					if($.inArray(i, ["formview", "gridview", "customview"]) != -1) data[i].destroy();
				}
			}else{
				return;
			}
		}else{
	        el = tabs.tabsx("add","#"+pid, "...").children("#"+pid), sel = {$or:[]}, actions = {};
		}

		function doOpenView(el, dbId, viewId, actions, opts){
			var optsx = $.extend(true,{
				tabsPosition:"bottom",
		        optionchanged:function(e,data){
		        	if(data.key == "isDocDirty"||data.key == "isFormDirty"){
		        		self.toolbar.toolbar("refresh"); 
		        	}else if(data.key == "mode"){
		        		self.reloadToolbar();
		        	}
		        },
		        tabshow:function(e,target){self.reloadToolbar(); self._notifyOutline();},
		        tabcreated:function(e,target){self.reloadToolbar(); self._notifyOutline();}
		    },opts);
			
			var tas = {};
			$.each(["Header","Middle", "Tail"],function(){
				var name = "toolbar"+this+"Actions"; 
				if(actions[name]) tas[name] = actions[name];
			});
			tas = $.isEmptyObject(tas) ? undefined : tas;
			el.data("toolbarActions",tas).data("dbId", dbId);
			$.each(actions.editorEventActions||[], function(k,action){
				var handler = eval("(0,"+(action.handler||"function(){}")+")");
				el.bind(action.events, function(e){
					handler.apply(self, arguments);
				});
			});
			
			optsx.opened = function(editor){
				var view = editor;
				if(editor.widgetName == "editor") view = editor.getForm(viewId);
				var v = view.option("view"), title = v.title || v.name || viewId, viewType = v.viewType||"gridview";
				tabs.find(".ui-tabs-nav>li>a[href=#"+pid+"]").html(title);
				document.title = o.title +" - "+ title;
				viewType = viewType.toLowerCase();
				view.option("docclick",function(e, doc){
		        	var context = {dbId:dbId, view:el.data(viewType), document:doc },
		        	as = actions.documentClickActions || self.documentClickActions;
		        	self._docClick(context, as);
				});
				view.option("docdblclick",function(e, doc){
		        	var context = {dbId:dbId, view:el.data(viewType), document:doc },
		        	as = actions.documentDoubleClickActions || self.documentDoubleClickActions;
		        	self._docDblClick(context, as);
				});
				view.option("contentActions",function(doc){
		        	var context = {dbId:dbId, view:el.data(viewType), document:doc };
		        	return self._docContextMenuActions(actions, context, []);
				});
				self.reloadToolbar();
				self._afterOpenEditor({method:"openView", id:viewId, options:opts});
		    	opts.opened && opts.opened(view);
			};
			Model.openView(el, dbId, viewId, optsx);
		}

		if(dbId != o.dbId){
			$.each(["toolbarHeader", "toolbarMiddle","toolbarTail","documentClick", 
			        "documentDoubleClick", "documentContextMenuCenter", 
			        "documentContextMenuTop", "documentContextMenuBottom", "editorEvent"], function(){
				var s = {type:Model.ACTION, extendPoint:this};
				if(this == "editorEvent") s.targetId = viewId;
				sel.$or.push(s);
				actions[this+"Actions"] = [];
			});
			$.ans.getDoc(dbId, null, {selector:sel},function(err,data){
				if(err){
					console.log("Load actions error: "+err);
				}else{
					$.each(data.docs,function(){
						actions[this.extendPoint+"Actions"].push(this);
					});
					doOpenView(el, dbId, viewId, actions, opts);
				}
			});
		}else{
			sel = {type:Model.ACTION, viewId: viewId, extendPoint:"editorEvent"};
			$.ans.getDoc(dbId, null, {selector:sel},function(err,data){
				if(err){
					console.log("Load actions error: "+err);
				}else{
					actions.editorEventActions = data.docs;
					doOpenView(el, dbId, viewId, actions, opts);
				}
			});
		}
		
		return this;
	},

	openDatabase: function(dbId, opts){
        window.open("workbench.html?dbid="+dbId);
        return this;
	},

	removeDocument:function(doc, opts){
		opts = opts || {};
		var dbId = (opts&&opts.dbId) || this.options.dbId, 
		    targetName = doc.title||doc.name||doc._id, title = "Remove "+ targetName, 
		    message = "Are you sure to remove "+targetName;
		message += (doc.type == Model.CATEGORY) ? " and all its child nodes?" : "?";
		showDialog(title, message,{buttons:[{
			text: "OK",
			handler: function(dialog){
				if(doc.type == Model.CATEGORY){
					Model.deleteDocument(dbId, null, {selector:{_path:{$regex: "^"+doc._path}}},function(err,result){
						if(err){
							console.log("Remove document error: "+err);
						}else{
							if($.type(opts.removed)=="function") opts.removed();
						}
					});
				}else{
					Model.deleteDocument(dbId, doc._id, null,function(err,result){
						if(err){
							console.log("Remove document error: "+err);
						}else{
							if($.type(opts.removed)=="function") opts.removed();
						}
					});
				}
				dialog.close();
			}
		},{
			text: "Cancel",
			handler: function(dialog){dialog.close();}
		}]});
		
		return this;
	},

	joinInGroup:function(userId, opts){
		var o = this.options, dbId = (opts&&opts.dbId)||o.dbId;
		$.ans.getDoc(dbId,userId,null,function(err,user){
			if(err){
				console.log("Load user document "+userId+" error: "+err);
			}else{
				$("<div class='workbench'/>").dialog({
					title:"Join In Group",
					height: 460,
					width: 320,
					modal: true,
					create: function(event, ui){
						var $this = $(this), ids = [];
						$.each(user._groupPaths||[], function(k,v){
							var a = v.split(",");
							ids.push(a[a.length-2]);
						});
						$this.sideview({dbId:dbId, roots: Model.GROUP_ROOT, checkbox: true, checkedNodes:ids});
						setTimeout(function(){ $this.sideview("expand", Model.GROUP_ROOT); },200);
						
					},
					buttons: {
						OK: function() {
							var $this= $(this), nodes = $this.sideview("option","checkedNodes");
							user._groupPaths = [];
							$.each(nodes||[], function(k,node){ user._groupPaths.push(node.data._path); });
							Model.updateDocument(dbId, userId, user, null,function(err,result){
								if(err) console.log("Join in group error: "+err);
								$this.dialog("close");
							});
						},
						Cancel: function() { $( this ).dialog( "close" );}
					},
					close:function(e, ui){$(this).remove();}
				});
			}
		});
		return this;
	},
	
	quitGroup: function(userId, groupId, opts){
		var o = this.options, dbId = (opts&&opts.dbId)||o.dbId;
		$.ans.getDoc(dbId,userId,null,function(err,user){
			if(err){
				console.log("Load user document "+userId+" error: "+err);
			}else{
				var paths = [];
				$.each(user._groupPaths||[], function(k, path){
					var matcher = new RegExp(groupId+",$");
					if(!matcher.test(path)) paths.push(path);
				});
				user._groupPaths = paths;
				Model.updateDocument(dbId, userId, user, null,function(err,result){
					if(err) console.log("Quit group error: "+ err); 
				});
			}
		});
		return this;
	},
	
	assignRole:function(docId, opts){
		var o = this.options, dbId = (opts&&opts.dbId)||o.dbId;
		$.ans.getDoc(dbId,docId,null,function(err,doc){
			if(err){
				console.log("Load document "+docId+" error: "+ err);
			}else{
				$("<div class='workbench'/>").dialog({
					title:"Assign Roles",
					height: 460,
					width: 320,
					modal: true,
					create: function(event, ui){
						var $this = $(this), ids = [];
						$.each(doc._rolePaths||[], function(k,v){
							var a = v.split(",");
							ids.push(a[a.length-2]);
						});
						$this.sideview({dbId:dbId, roots: Model.ROLE_ROOT, checkbox: true, checkedNodes:ids});
						setTimeout(function(){ $this.sideview("expand", Model.ROLE_ROOT); },200);
					},
					buttons: {
						OK: function() {
							var $this= $(this), nodes = $this.sideview("option","checkedNodes"),
							    paths = doc._rolePaths = [];
							$.each(nodes||[], function(k,node){ paths.push(node.data._path); });
							Model.updateDocument(dbId, docId, doc, null,function(err,result){
								if(err) console.log("Assign role error:" + err);
								$this.dialog("close");
							});
						},
						Cancel: function() { $( this ).dialog( "close" );}
					},
					close: function(){$(this).remove();}
				});
			}
		});
		
		return this;
	},
	
	destroy: function() {
	    this.element.border("destroy");
		$(window).unbind("resize.workbench", this._proxy);
		$(document).unbind(".workbench");
		this.element.removeClass("an-workbench");
		return $.Widget.prototype.destroy.apply(this, arguments );
	}
});
})( jQuery );
