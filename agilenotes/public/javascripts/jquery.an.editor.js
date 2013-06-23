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

$.widget( "an.editor", {
	options: {
		printable: true,
		mode: "browser",
		document: {},
		forms: [],
		actionSets: [],
		parseDot: true,
		isDocDirty: false
	},

	_create: function() {
		this.element.addClass("an-editor");
		var self = this, o = this.options, el = this.element, doc = o.document, docType = doc.type, forms = {};
		this.doc = new DocWrapper(doc, o.parseDot);
		var id = doc._id; 
		if(id) o.url = "/dbs/"+o.dbId+"/"+id+"/attachments";

		if(o.forms.length <= 1) el.addClass("tabs-nav-hide");
		if(o.design && (docType==Model.FORM||docType==Model.PAGE||docType==Model.VIEW)){
			forms[doc._id+"-design"] = doc;
		}
		$.each(o.forms||[],function(k,v){
			forms[v._id] = v; 
		});

		el.append("<ul />").tabsx({
			tabTemplate: "<li><a href='#{href}' hidefocus='true'>#{label}</a></li>",
			show: function(event, ui) {
				var $p = $(ui.panel), id = $p.attr("id"), d = forms[id], type = d.type;
				if($p.is(".an-form,.an-page,.an-view")){
					var data = $p.data();
					for(var i in data){
						if($.inArray(i, ["form","page","gridview","formview","customview","view","mobilelistview"]) != -1){
							if(!o.design || !(/-design$/.test(id))) data[i].option("mode", o.mode);
							data[i].option("mobile", o.mobile);
							self._trigger("tabshow",event, data[i]);
							break;
						}
					}
				}else{
					var opt ={
							dbId:o.dbId,
							mode:(o.design && /-design$/.test(id)) ? "design" : o.mode,
							ignoreEscape:o.ignoreEscape,
							change:function(){ 
								o.change&&o.change();
							},
							mobile:o.mobile,
							readOnly:o.readOnly,
							widgetselect: o.widgetselect,
							optionchanged:function(e,data){
								if(data.key == "isDirty"){
									if(data.value){
										self.option("isFormDirty",true);
									}else{
										var isFormDirty = false;
										el.tabsx("option","panels").each(function(){
											var data = $(this).data();
											for(var i in data){
												if($.inArray(i, ["form","page","gridview","formview","customview","view","mobilelistview"]) != -1){ 
													isFormDirty = data[i].option("isDirty");
													if(isFormDirty) break;
												}
											}
										});
										self.option("isFormDirty",isFormDirty);
									}
								}else if(data.key == "mode"){
									self.option(data.key, data.value);
								}
								
							}
					    };
					if(type == Model.FORM){
						$p.form($.extend(true, {
							form: d, 
							document:(o.design && /-design$/.test(id)) ? {} : function(){return self.doc;},
							url:o.url,
							editor:self,
							create:function(){self._trigger("tabcreated",event, $(this).data("form")); }
						}, opt));
					}else if (type == Model.PAGE){
						$p.page($.extend(true,{
							page:d, 
							create:function(){ self._trigger("tabcreated",event, $(this).data("page")); }
						},opt));
					}else if (type == Model.VIEW){
						var vt = d.viewType||"gridview", vt = vt.toLowerCase();
						
						vt = (vt == "customizedview"?"view":vt);
						
						var optsx = {
							    view: d,
							    create:function(){ self._trigger("tabcreated",event, $(this).data(vt)); }
						    };
						if(vt == "formview"||vt == "customview"||vt == "mobilelistview") optsx.form = o.form;
						$p[vt]($.extend(true,optsx,opt));
					}
				}
			}
		});
		$.each(forms||[],function(k,v){
			el.tabsx("add","#"+k, v.title);
		});

		if(o.tabsPosition == "bottom"){
			el.addClass("tabs-bottom").children(".ui-tabs-nav, .ui-tabs-nav > *")
			    .removeClass("ui-corner-all ui-corner-top" ).addClass("ui-corner-bottom" );
		}

		el.attr('tabIndex', -1).css('outline', 0).keydown(function(e){
			var form=self._currentForm();
			if(e.keyCode === $.ui.keyCode.ESCAPE && !o.ignoreEscape &&!e.isDefaultPrevented()&&form.validate()){
				e.preventDefault();
				self.option("mode", "browser");
				form.option("mode", "browser");
			}
		}).bind("dblclick.form",function(e){
			var form=self._currentForm();
			if(o.mode == "browser"&&!o.readOnly){
				self.option("mode","edit");
				form.option("mode","edit");
			}
		});

		$(this.doc).bind("propchanged.editor",function(e,id,value,oldValue,trans){
			if(!trans) self.option("isDocDirty", true);
			if(o.design && (docType==Model.FORM||docType==Model.PAGE||docType==Model.VIEW)){
				var docId = doc._id+"-design", dd= $.extend(true, {}, doc);
				el.children("#"+docId+".ui-tabs-panel").each(function(){
					var $this = $(this);
					if($this.is(".an-form,.an-page,.an-view")){
						var data = $this.data();
						for(var i in data){
							if($.inArray(i, ["form","page"]) != -1){
								$this[i]("option",i,dd);
							}else if($.inArray(i, ["gridview","formview","customview","view","mobilelistview"]) != -1){
								$this[i]("option","view",dd);
							}
						}
					}
				});
			}
			self._trigger("docpropchanged",e, {id:id, value:value,oldValue:oldValue, "transient":trans});
		});
		
		$(document).bind("documentChanged.editor", function(e,data){
			var ds = $.isArray(data)?data:[data], id;
			for(var i in ds){
				id = ds[i]._id;
				if(id == o.document._id){
					$.extend(true, o.document, ds[i]);
					el.children(".ui-tabs-panel").each(function(){
						var $this = $(this);
						$this.is(".an-form")&&$this.form("refresh");
					});
				}
				if(forms[id] || forms[id+"-design"]){
					if(forms[id+"-design"]) id = id+"-design";
					forms[id] = $.extend(true, {}, ds[i]);
					for(var j in o.forms){
						if(o.forms[j]._id == ds[i]._id){
							o.forms[j] = forms[id];
							break;
						}
					}
					el.children("#"+id+".ui-tabs-panel").each(function(){
						var $this = $(this);
						if($this.is(".an-form,.an-page,.an-view")){
							var data = $this.data();
							for(var i in data){
								if($.inArray(i, ["form","page"]) != -1){
									$this[i]("option",i,forms[id]);
								}else if($.inArray(i, ["gridview","formview","customview","view","mobilelistview"]) != -1){
									$this[i]("option","view",forms[id]);
								}
							}
						}

					});
				}
			}
		}).bind("documentDeleted.editor",function(e,data){
			var ds = $.isArray(data)?data:[data], id;
			for(var i in ds){
				id = ds[i]._id;
				if(forms[id] || forms[id+"-design"]){
					if(forms[id+"-design"]) id = id+"-design";
					for(var j in o.forms){
						if(o.forms[j]._id == ds[i]._id){
							o.forms.splice(j,1);
							delete forms[id];
							el.tabsx("remove",id);
							break;
						}
					}
				}
			}
		});
	},
	
	_validate:function(){
		var self = this,valid=true;
		this.element.tabsx("option","panels").each(function(){
			var data = $(this).data();;
			for(var i in data){
				if($.inArray(i, ["form","page"]) != -1&&data[i].option("mode")!="design"&&!data[i].option("isValid")){
					self.element.tabsx("select", data[i].option("form")._id);
					valid=false;
					return false;
				}
			}
		});
		return valid;
	},
	
	save: function(opts){
		opts = opts || {};
		var self = this, o = this.options, dbId = o.dbId, valid = true;
		this.element.tabsx("option","panels").each(function(){
			var data = $(this).data();;
			for(var i in data){
				if($.inArray(i, ["form","page"]) != -1){
					if(data[i].option("isDirty")){
						if(data[i].option(i)._id == o.document._id){
							o.document.content = data[i].option("content");
							data[i].option("isDirty", false);
							o.isDocDirty = true;
						}else{
							data[i].save();	
						}
					}
					if(opts.validate && valid && form.option("mode")!="design"){
						valid = form.option("isValid");
						if(!valid){
							self.element.tabsx("select", form.option("form")._id);
						}
					}
				}else if($.inArray(i, ["gridview","formview","customview","view","mobilelistview"]) != -1){
					if(data[i].option("isDirty")){
						if(data[i].option("view")._id == o.document._id){
							o.document.options = $.extend(true,o.document.options, data[i].option("viewOptions"));
							data[i].option("isDirty", false);
							o.isDocDirty = true;
						}else{
							data[i].save();	
						}
					}
				}
			}
		});
		this.option("isFormDirty",false);
		
		if(valid && o.isDocDirty) {
			var doc = this._getDocument(),opNew={options:{}},tags=false;
			
			if ($.type(opts.beforesave) == "function") {
				opts.beforesave(doc); // here you can change the doc values
			}

			if (o.formIds) {
				doc.formIds=o.formIds;
			}
			
			if(o.task||opts.task){
				opNew["options"]["task"]=o.task||opts.task;
				tags=true;
			}

			if(o.isNew){
				var def = o["default"]&&o["default"]._id;
				
				if(def){
					opNew["options"]["default"]=def;
					tags=true;
				}
				Model.postDocument(dbId, doc, tags?opNew:null, function(err,result){
					if(!err){
						delete o.isNew;
						$.extend(o.document, result);
						self.option("option","url", "/dbs/"+dbId+"/"+doc._id+"/attachments");
						self.option("isDocDirty",false);
					}
					if($.type(opts.saved) == "function"){
						opts.saved(err, doc,true);
					}else{
						o.saved&&o.saved(err, doc,true);
					}
				});
			}else{
				Model.updateDocument(dbId,doc._id,doc,tags?opNew:null, function(err,result){
					if(!err){
						$.extend(o.document, result);
						self.option("isDocDirty",false);
					}
					if($.type(opts.saved) == "function"){
						opts.saved(err, doc,true);
					}else{
						o.saved&&o.saved(err, doc,true);
					}
				});
			}
		}
	},
	_getDocument:function(){
		var o = this.options,doc = $.extend(true,{},o.document);
		$.each(o.forms,function(){
			$(this.content).find(".field[transient=true]").each(function(){
				var $this = $(this), id = $this.attr("id");
				if(id){
					id = id.replace(/-/g,".");
					if($this.attr("transient")){
						try{delete eval("doc."+id)}catch(e){};
					}
				};
			});
		});
		return doc;
	},
	print: function(){
		this._currentForm().print();
	},
	option: function(key, value){
		var self = this, o = this.options;
		if(key === "actionSets" && value === undefined){
			var cf = this._currentForm(); 
			return cf&&cf.option("actionSets");
		}else if(key === "outline" && value === undefined){
			var form = this._currentForm();
			if(form) return form.option("outline");
		}else if(key === "document" && value === undefined){
			return this._getDocument();
		}else	if(key === "namedValues" && value === undefined){
			var nv = {};
			$.each(o.forms,function(k,form){
				$(form.form).find(".field:not(.button)").each(function(){
					var id = $(this).attr("id");
					if(id){
						id = id.replace(/-/g,".");
						nv[id] = self.doc.prop(id);
					}
				});
			});
			return nv;
		}else if(key == "currentForm" && value == undefined){
			return this._currentForm();
		}else if (key=="isValid"&&value==undefined){
			return this._validate();
		}
		var ret = $.Widget.prototype.option.apply(this, arguments ); 
		return ret === undefined ? null : ret; // return null not undefined, avoid to return this dom element.
	},
	
	_setOption: function(key, value){
		var oldValue = this.options[key];
		if(!equals(value,oldValue)){
			$.Widget.prototype._setOption.apply(this, arguments );
			if(key === "document"){
				this.doc.setDoc(value);
				this._setOption("isDocDirty",false);
			}else if(key === "url"){
				this.element.tabsx("option","panels").each(function(){
					$(this).form("option",key,value);
				});
			}else if(key === "mode"){
				this._currentForm().option(key,value);
			}
			this._trigger("optionchanged",null,{key:key,value:value,oldValue:oldValue});
		}
		return this;
	},

	getForm: function(id){
		var o = this.options;
		if(o.design && (id == o.document._id)) id = id+"-design";
		var data = this.element.tabsx("panel", id).data();
		for(var i in data){
			if($.inArray(i, ["form","page","gridview","formview","customview","view","mobilelistview"]) != -1) return data[i]; 
		}
		return null;
	},
	
	_currentForm:function(){
		var data = $(this.element.tabsx("option","selectedPanel")).data();
		for(var i in data){
			if($.inArray(i, ["form","page","gridview","formview","customview","view","mobilelistview"]) != -1) return data[i]; 
		}
		return null;
	},
	
	refresh:function(){
		this._currentForm().refresh();
		return this;
	},
	
	highlightWidget: function(id, highlight){
		return this._currentForm().highlightWidget(id, highlight);
	},
	
	destroy: function() {
		$(document).unbind(".editor");
		this.element.tabsx("destroy").removeClass("an-editor tabs-bottom")
		      .unbind(".editor").undelegate(".an-form",".editor").empty();
		$.Widget.prototype.destroy.apply(this, arguments);
	}
});
})( jQuery );