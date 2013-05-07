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

$.widget( "an.form", $.an.page, {
	options: {
		document: {},
		printable: true,
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
			jsrender:["5080143085ac60df09000001","514d0a46caa05a669e0005c8","514d0e9dcaa05a26e30001af","514d0825caa05a669e0002ae","514d5ef3ac8f27413200014e"],
			radio:["5080143085ac60df09000001","50af2d626cec663c0a00000a"],
			select:["5080143085ac60df09000001","508259700b27990c0a000003"],
			box:["5080143085ac60df09000001","50de56d0a092007b11000000","50ea38efa0920073870000ef"],
		    rte:["5080143085ac60df09000001"]
		},
		wrapper:"<form/>"
	},

	_create: function() {
		$.an.page.prototype._create.apply(this, arguments);
	},
	
	_initPage:function(){
		var self = this, o = this.options, el = this.element;
		el.addClass("an-form");
		
		o.cssFiles = o.cssFiles || [];
		o.cssFiles.push("stylesheets/jquery.an.form.css");
		
		o.document = $.type(o.document) == "function" ? o.document(): o.document;

		$(o.document).bind("docchanged.form",function(e,doc, oldDoc){
			self.refresh();
            el.trigger("documentchanged",e,[doc,oldDoc]);
		}).bind("propchanged.form",function(e,id,value,oldValue,trans){
			self.field(id, value);
		});
		
		el.bind("dblclick.form",function(e){
			if(o.mode == "design" && self.labelActive()){
				self.label();
			}
		});
		
		$.an.page.prototype._initPage.apply(this, arguments);
	},

	option: function(key, value) {
		var o = this.options;
		if(key === "mode" && o.readonly){
			return;
		}else if(key === "isValid" && value === undefined && o.mode == "edit"){
			return this.validator.form();
		}
		return $.an.page.prototype.option.apply(this, arguments);
	},
	
	_getWidgetObj:function(el){
		if(el.is(".field")) return el.data(el.attr("type")+"field");
		return $.an.page.prototype._getWidgetObj.apply(this, arguments);
	},
	
	_handleChange:function(key, value, oldValue){
		var o = this.options;
		if(key === "document"){
			this.refresh();
		}else if(key === "url"){
			this.$page.find(".field.file").filefield("option","url",o.url);
			this.$page.find(".field.grid").gridfield("option","url",o.url);
		}
		return $.an.page.prototype._handleChange.apply(this, arguments);
	},

	_createPage:function(){
		$.an.page.prototype._createPage.apply(this, arguments);
		this.validator = this.$page.validate($.extend({
			meta:"validate",
			errorPlacement: function(error, el) {
				error.insertAfter(el.closest("div.field"));
			}
		},eval("("+(this.options[this.widgetName].validator||"{}")+")")));
	},
	
	_refreshWidget: function(el){
		var self = this, o = this.options, type = el.attr("type");
		if(el.is(".field")){
			var id = el.attr("id"); 
			if(id) id = id.replace(/-/g, ".");
			var doc = o.document, value = doc && doc.prop && doc.prop(id), field = el.data(type+"field"); 
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
					el[type+"widget"]({parent:function(){return self;},label:el.attr("label")});
				}else{
					el[type+"field"] && el[type+"field"](opts);
				}
			}
		}else {
			$.an.page.prototype._refreshWidget.apply(this, arguments);
		}
	},

	field: function(id, value){
		var field = this._getPage().find("#"+id.replace(/\./g,"-")+".field"); 
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

	label:function(){
		this.rte && this.rte.rte("label");
		return this;
	},
	
	validate:function(){
		return this.validator?this.validator.form():true;
	},

	// TODO bug fix: 打印错误!
	print: function(){
		var o = this.options, docId = o.document.prop("_id"), loc = window.location, 
		      url = loc.protocol +"//"+loc.host+"/pdfs?dbid="+o.dbId+"&docid="+docId+"&formid="+o[this.widgetName]._id;
		print(url);
		return this;
	},

	destroy: function() {
		this.element.removeClass("an-form");
		return $.an.page.prototype.destroy.apply(this, arguments);
	}
});
})( jQuery );
