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

$.widget( "an.form", {
	options: {
		mode: "browser", // "browser","edit","design"
		document: {},
		printable: true,
		actionSets: [],
		formIds:{
			text:["5080143085ac60df09000001","5092733215ca72150a000001"],
			password:["5080143085ac60df09000001"],
			checkbox:["5080143085ac60df09000001","50af2d266cec663c0a000009"],
			button:["5080143085ac60df09000001","50de596da092007b11000001"],
			datetime:["5080143085ac60df09000001","50af2da26cec663c0a00000b"],
			textarea:["5080143085ac60df09000001","50af2ca66cec663c0a000008"],
			tabsx:["5080143085ac60df09000001","51306faad58d1c129f000000"],
			file:["5080143085ac60df09000001","50ceb75ba092004120000000"],
			grid:["5080143085ac60df09000001","5089e21f2b2255080a000005"],
			jsrender:["5080143085ac60df09000001","514d0a46caa05a669e0005c8","514d0e9dcaa05a26e30001af","514d052fcaa05a669e000000","514d5ef3ac8f27413200014e"],
			radio:["5080143085ac60df09000001","50af2d626cec663c0a00000a"],
			select:["5080143085ac60df09000001","508259700b27990c0a000003"],
			box:["5080143085ac60df09000001","50de56d0a092007b11000000","50ea38efa0920073870000ef"],
		    rte:["5080143085ac60df09000001"]
		},
		wrapper:"<form/>"
	},

	_create: function() {
		var self = this, o = this.options, el = this.element;
		el.addClass("an-form");
		o.document = $.type(o.document) == "function" ? o.document(): o.document;
		$(o.document).bind("docchanged.form",function(e,doc, oldDoc){
			self.refresh();
            el.trigger("documentchanged",e,[doc,oldDoc]);
		}).bind("propchanged.form",function(e,id,value,oldValue,trans){
			self.field(id, value);
		});
		
		$.extend(this, eval("try{("+(o.form.methods||"{}")+")}catch(e){}"));

		this.refresh();
		
		el.bind("dblclick.form",function(e){
			if(o.mode == "design" && self.labelActive()){
				self.label();
			}
		});
	},

	_createOutline:function(){
		var form = this.options.form, root = this._getForm();

		function getWidget(el){
			var widget = null, type = el.attr("type");
			if(el.is(".field")){
				widget = el.data(type+"field");
			}else if(el.is(".box")){
				widget = el.data(type);
			}else if(el.is(".widget")){
				widget = el.data(type+"widget");
			}
			return widget;
		}
		
		return {
			getRoots: function(mountNodes){
				var nodes = new Array();
				nodes.push({id:"root", text:form.title||form.name||form._id, "class":"folder"});
				mountNodes(nodes);
			},
			getChildren: function(parentNode, mountNodes){
				var nodes = new Array();
				if(parentNode.id == "root"){
					root.find(".widget").each(function(){
						var $this = $(this), id = $this.attr("id");
						if($this.parent().closest(".widget").length == 0){
							nodes.push({id:id, text:id, "class":$this.is(".field")?"file":"folder", data:getWidget($this)});
						}
					});
				}else{
					root.find("#"+parentNode.id).find(".widget").each(function(){
						var $this = $(this), id = $this.attr("id");
						if($this.parent().closest(".widget").attr("id") == parentNode.id){
							nodes.push({id:id, text:id, "class":$this.is(".field")?"file":"folder", data:getWidget($this)});
						}
					});
				}
				mountNodes(nodes);
			},
			hasChildren: function(node){ return node["class"]=="folder"; },
			getId: function(node){ return node.id ? node.id : null; }
		};
	},
	
	option: function(key, value) {
		var o = this.options;
		if(key === "mode" && o.readonly){
			return;
		}else	if(key === "isValid" && value === undefined && o.mode == "edit"){
			return this.validator.form();
		}else if(key === "actionSets" && value === undefined){
			return this._createActionSets();
		}else if(key === "outline" && value === undefined){
			return this._createOutline();
		}else if(key == "content" && value == undefined){
			if(o.isDirty) this._syncFormContent();
			return o.form.content;
		}
		var ret = $.Widget.prototype.option.apply(this, arguments ); 
		return ret === undefined ? null : ret; // return null not undefined, avoid to return this dom element.
	},

	_setOption: function(key, value) {
		var o = this.options, oldValue = o[key];
		if(!equals(value,oldValue)){
			$.Widget.prototype._setOption.apply(this, arguments );
			this._handleChange(key,value,oldValue);
			this._trigger("optionchanged",null,{key:key, value:value, oldValue:oldValue});
		}
		return this; 
	},
	
	_handleChange:function(key, value, oldValue){
		var o = this.options;
		if(key === "mode" || key === "document" || key ==="form"){
			if(key === "mode"&&o.isDirty){
				this._syncFormContent();
			}else if(key === "form"){
				this.element.children("style").text(o.form.stylesheet);
				this.$form && !o.isDirty && this.$form.empty().html(o.form.content);
				if(this.rte){
					!o.isDirty && this.rte.rte("option","content",o.form.content);
					this.rte.rte("option","stylesheet", o.form.stylesheet);
				}
			}
			this.refresh();
		}else if(key === "url"){
			this.$form.find(".field.file").filefield("option","url",o.url);
			this.$form.find(".field.grid").gridfield("option","url",o.url);
		}
	},
	
	refresh:function(){
		var o = this.options;
		this["_"+o.mode] && this["_"+o.mode]();
	},
	
	_browser:function(){
		this.rte && this.rte.hide();
		if(!this.$form){
			this._createForm();
		}else {
			this.$form.show();
			this._refreshFields();
		}
	},

	_edit:function(){
		this.rte && this.rte.hide();
		if(!this.$form){
			this._createForm();
		}else{
			this.$form.show();
			this._refreshFields();
		}
	},

	_design:function(){
		this.$form && this.$form.hide();
		if(!this.rte){
			this._createRTE();
		}else{
			this.rte.show();
			this._refreshFields();
		}
	},

	field: function(id, value){
		var field = this._getForm().find("#"+id.replace(/\./g,"-")+".field"); 
		if(field.size() == 0) return;
		if(value === undefined){
			var v = null;
			field.each(function(){
				var $this = $(this), type = $this.attr("type");
				v = $this[type+"field"]("option","value");
				if(type=="radio" && v!=null) return false;
			});
			return v;
		}else{
			field[field.attr("type")+"field"]("option","value", value);
		}
	},

	showWidget:function(){
		var self = this;
		$.each(arguments,function(){
			var w = self.getWidget(this);
			w && w.widget().show();
		});
	},
	
	hideWidget:function(){
		var self = this;
		$.each(arguments,function(){
			var w = self.getWidget(this);
			w && w.widget().hide();
		});
	},

	getWidget:function(id){
		var self = this, o = this.options, widget = null;
		this._getForm().find("#"+id).each(function(){
			var $this = $(this), type = $this.attr("type"), 
			    filter = (o.mode=="design"? ".an-box:not(.raw),."+o.form.name : ".an-page,.an-form");
			$this.parent().closest(filter).each(function(){
				if($(this).is('.'+o.form.name) || this == self.element[0]){
					if($this.is(".field")){
						widget = $this.data(type+"field");
					}else if($this.is(".box")){
						widget = $this.data(type);
					}else if($this.is(".widget")){
						widget = $this.data(type+"widget");
					}					
					return false;
				}
			});
			if(widget) return false;
		});
		return widget;
	},
	
	_createForm:function(){
		var o = this.options, form = o.form, el = this.element;
		$('<style type="text/css">'+(form.stylesheet||"")+'</style>').appendTo(el);

		this.$form = $(o.wrapper).addClass(form.name).html(form.content).appendTo(el);
		
		this.validator = this.$form.validate($.extend({
			meta:"validate",
			errorPlacement: function(error, element) {
				error.insertAfter(element.closest("div.field"));
			}
		},eval("("+(form.validator||"{}")+")")));
		
		var data = {};
		data[this.widgetName] = this;
		$.each(eval("("+(o.form.actions||"[]")+")"), function(k,action){
			el.bind(action.events, data, action.handler);
		});
		
		this._refreshFields();
	},

	_createRTE:function(){
		var self = this, o = this.options, form = o.form;
		var globalCSSFiles = ["stylesheets/rte/rte-design.css",
		                      "stylesheets/jquery-ui-1.8.24.custom.css",
		                      "stylesheets/jquery.ui.timepicker.css",
		                      "stylesheets/jquery.an.menu.css",
		                      "stylesheets/jquery.an.agilegrid.css",
		                      "stylesheets/jquery.an.tree.css",
		                      "stylesheets/jquery.an.border.css",
		                      "stylesheets/jquery.an.tabsx.css",
		                      "stylesheets/jquery.an.toolbar.css",
		                      "stylesheets/jquery.an.page.css",
		                      "stylesheets/jquery.an.form.css",
		                      "stylesheets/jquery.an.editor.css",
		                      "stylesheets/jquery.an.formview.css",
		                      "stylesheets/jquery.an.widget.css",
		                      "stylesheets/jquery.an.tabsxwidget.css",
		                      "stylesheets/jquery.an.box.css",
		                      "stylesheets/jquery.an.fileinput.css",
		                      "stylesheets/jquery.an.filefield.css",
		                      "stylesheets/jquery.an.gridfield.css",
		                      "stylesheets/jquery.colorpicker.css",
		                      "stylesheets/jquery.ui.select.css",
		                      "stylesheets/rte/paddinginput.css",
		                      "stylesheets/jquery.an.rte.css",
		                      "stylesheets/base.css"],
	        globalJSFiles = ["javascripts/jquery-1.8.2.js","javascripts/jquery.scrollto.js"];

//		$.each(o.db.cssfiles||[],function(k,v){
//			globalCSSFiles.push("/dbs/"+Model.ADMINDBID+"/"+dbId+"/attachments/"+v.metadata.filepath);
//		});
//		$.each(o.db.jsfiles||[],function(k,v){
//			globalJSFiles.push("/dbs/"+Model.ADMINDBID+"/"+dbId+"/attachments/"+v.metadata.filepath);
//		});

		// Local css and javascript files in form scope(form,view,page).
		var localCSSFiles = [], localJSFiles = [];
		$.each(form.cssfiles||[],function(k,v){
			localCSSFiles.push("/dbs/"+dbId+"/forms/"+form._id+"/attachments/"+v.metadata.filepath);
		});

		$.each(form.jsfiles||[],function(k,v){
			localJSFiles.push("/dbs/"+dbId+"/forms/"+form._id+"/attachments/"+v.metadata.filepath);
		});

	    var cssfiles = [].concat(globalCSSFiles).concat(localCSSFiles), 
	          jsfiles = [].concat(globalJSFiles).concat(localJSFiles);
		
		this.rte = $("<div class = 'rte'/>").appendTo(this.element).rte({
			content:form.content,
			dbId:o.dbId,
			stylesheet:form.stylesheet,
			cssfiles: cssfiles,
			jsfiles:  jsfiles,
			cssClass:form.name,
			restore:function(form){self._refreshFields(form); },
			clean:function(form){

				form.find(".widget").each(function(){
					var $this = $(this),type = $this.attr("type"),wid;
					if($this.is(".field")){
						wid=$this.data(type+"field");
					}else if($this.is(".box")){
						wid=$this.data("box");
					}else if($this.is("[type="+type+"]")){
						wid=$this.data(type+"widget");
					}
					wid&&wid.destroy();
				});	
			},
			onload:function(){
				var sel = self.rte.rte("option","selection"), $doc = $(self.rte.rte("option","doc")); 
				$doc.bind("paste.form",function(e){
					setTimeout(function(){
						self._refreshFields();
						self.rte.rte("updatePath");
						self._trigger("change",null, self);
					},20);
				}).bind("widgetdblclick.form widgetclick.form widgetchange.form click.form",function(e, widget){
					$doc.find(".widget.selected").removeClass("selected");
					if(e.type == "widgetclick" || e.type == "widgetdblclick"){
						if(widget.selectable(e.originalEvent)){
							var el = widget.widget(); 
							el.addClass("selected");
							!$.browser.chrome&&sel.select(el[0]);
							self._trigger("widgetselect",null, widget);
						}
						self.rte.rte("updatePath");
						if(e.type=="widgetdblclick"){
							var type = widget.option("type");
							if(self.rteWidgetActive(type)) self.rteWidget(type);	
						}
					}
					self.rte.trigger(e, widget);
				});
				self._refreshFields();
				self._trigger("formcreated",null,{form:self});
			}
		}).bind("change.form contentchange.form",function(e){
			//$(this).data('rte').history();
			self.option("isDirty",true);
			setTimeout(function(){ self._trigger("change",null, self);},20);
		}).bind("newwidget.form",function(e, widget){
			e.stopImmediatePropagation();
			self.refresh();
			self.option("isDirty",true);
			setTimeout(function(){ self._trigger("change",null, self);},20);
		});
	},

	_getForm:function(){
		return this.options.mode=="design" ? $(this.rte.rte("option","doc")): this.$form;
	},
	
	_refreshFields: function(form){
		var self = this, o = this.options, doc = o.document;
		(form || this._getForm()).find(".widget").each(function(){
			var $this = $(this), id = $this.attr("id"), type = $this.attr("type");
			if(id) id = id.replace(/-/g, ".");
			if($this.is(".field")){
				var value = doc && doc.prop && doc.prop(id), field = $this.data(type+"field"); 
				if(field){
				    field.option('mode',o.mode).option('value',value);
				    field.refresh();
				}else{
					var opts = {
						dbId:o.dbId,
						parent:function(){return self;},
						value:value,
						url:o.url,
						mode:o.mode,
						optionchanged:function(e,data){
							if(data.key == "value"){
								var id = $(e.target).attr("id");
								id = id&&id.replace(/-/g,".");
								var curValue = doc.prop(id);
								if(curValue != data.value){
									doc.prop(id,data.value,data["transient"]);
								}
							}else if(data.key == "metadata" || data.key == "attributes"){
								self.option("isDirty",true);
								setTimeout(function(){ self._trigger("change",null, self);},20);
							}
						},
						resize:function(e,data){self.option("isDirty",true);}
					};

					if(type == "button"){
						$this[type+"field"]({parent:function(){return self;},label:$this.attr("label")});
					}else{
						$this[type+"field"] && $this[type+"field"](opts);
					}
				}
			}else if($this.is(".box")){
				var actions = [], id = $this.attr("id");
				$.each(o.boxToolbarActions||[],function(){
					if(this.boxName == id) actions.push(this);
				});
				if($this.is(".an-box")){
					$this.data("box").option("mode", o.mode);
				}else{
					$this.box({
						parent:function(){return self;},
						mode:o.mode,
						dbId:o.dbId,
						toolbarActions:actions,
						optionchanged:function(e,data){
							if(data.key == "metadata" || data.key == "attributes"){
								self.option("isDirty",true);
								setTimeout(function(){ self._trigger("change",null, self);},20);
							}
						}
					});
				}
			}else if($this.is("[type="+type+"]")){
				if($this.is(".an-"+type+"widget")){
					$this.data(type+"widget").option("mode",o.mode);
				}else{
					$this[type+"widget"]({
						parent:function(){return self;},
						mode:o.mode, 
						dbId:o.dbId,
						optionchanged:function(e,data){
							if(data.key == "metadata" || data.key == "attributes"){
								self.option("isDirty",true);
								setTimeout(function(){ self._trigger("change",null, self);},20);
							}
						}
					});
				}
			}
		});

		return this;
	},
	
	_createActionSets:function(){
		if(this.options.mode == "design"){
			return [this._controlActionSet(),this._formatActionSet(), this._tableActionSet()];
		}
	},

	_controlActionSet:function(){
		var actions = this.rte.rte("option","actions");
		return this._createActionSet(["properties","cleanFormat","docStructure"],actions);
	},
	
	_formatActionSet:function(){
		var actions = this.rte.rte("option","actions");
		return this._createActionSet(["bold","italic","underline","strikethrough","subscript",
		        "superscript","alignLeft","alignCenter","alignRight","alignFull","font","fontSize",
		        "format","leftToRight","rightToLeft","fontColor","backgroundColor","outdent",
		        "indent","orderedList","unorderedList","link","deleteLink","horizontalRule",
		        "blockQuote","blockElement","stopFloat","image"],actions);
	},
	
	_tableActionSet:function(){
		var actions = this.rte.rte("option","actions");
		return this._createActionSet(["table","tableProps","deleteTable","rowBefore","rowAfter","deleteRow", 
		"columnBefore","columnAfter","deleteColumn", "cellProps","mergeCells",
		"splitCells"],actions);
	},

	_createActionSet:function(actionNames, actions){
		var actionSet = {};
		$.each(actionNames, function(){
			actionSet[this] = actions[this];
		});
		return actionSet;
	},

	_syncFormContent:function(){
		var form = this.options.form;
		form.content = this.rte.rte("option","content");
		this.$form && this.$form.empty().html(form.content);
	},

	validate:function(){
		return this.validator?this.validator.form():true;
	},

	rteWidget: function(type,opts){
		this.rte && this.rte.rte("rteWidget", type, this.options.formIds[type], opts);
		return this;
	},
	
	rteWidgetActive: function(type){
		return this.rte && this.rte.rte("rteWidgetActive", type);
	},

	label:function(){
		this.rte && this.rte.rte("label");
		return this;
	},
	
	labelActive:function(){
		return this.rte && this.rte.rte("labelActive");
	},

	sourceCode:function(){
		if(this.rte){
			var mode = this.rte.rte("option", "mode");
			this.rte.rte("option", "mode", mode =="sourcecode"?"design":"sourcecode");	
		}
	},
	
	sourceCodeActive:function(){
		return this.rte && this.rte.rte("option", "mode") == "sourcecode"; 
	},
	
	handler: function(){self.option("mode",o.mode =="sourcecode"?"design":"sourcecode");},
	checked: function(){return o.mode =="sourcecode";},

	save: function(){
		var self =this, o = this.options;
		if(o.isDirty){
			this._syncFormContent();
			ModelupdateDocument(o.dbId, o.form._id,o.form,null,function(err,result){
				self.option("isDirty",false);
			});
		}
		return this;
	},

	print: function(){
		var o = this.options, docId = o.document.prop("_id"), loc = window.location, 
		      url = loc.protocol +"//"+loc.host+"/pdfs?dbid="+o.dbId+"&docid="+docId+"&formid="+o.form._id;
		print(url);
		return this;
	},

	highlightWidget: function(id, highlight){
		var w = this.getWidget(id); 
		w&&w.highlight(highlight);
		return this;
	},
	
	scrollTo: function(id, opts){
		var o = this.options;
		if(o.mode == "design"){
			var win = this.rte.rte("option","win");
			win.$("#"+id.replace(/\./g,"-")).ScrollTo(opts);
		}else{
			this.$form.find("#"+id).scrollTo(opts);
		}
	},

	destroy: function() {
		$(this.options.document).unbind(".form");
		this.element.unbind(".form").removeClass("an-form").children("style").remove();
		return $.Widget.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
