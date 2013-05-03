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

$.widget( "an.gridfield", $.an.field, {
	options: {
		mode: "browser",
		title: "",
		addItemLabel: "Add",
		editItemLabel: "Edit",
		deleteItemLabel: "Delete",
		value:[]
	},

	_create: function() {
		$.an.field.prototype._create.apply(this, arguments);
		var self = this, o = this.options, c = this.content;
		this.element.addClass("an-gridfield");
		this.titlebar = $("<div class='titlebar ui-widget-header'/>").appendTo(c);
		this.title = $("<span class='title'/>").html(o.title).appendTo(this.titlebar);
		this.toolbar = $("<span class='toolbar'/>").appendTo(this.titlebar);
		if(o.converter){
			o.converter=eval("("+o.converter+")");
			if(!$.isFunction(o.converter)){
				o.converter=function(row,col,v){
					return v;
				}
			}
		}
		var lng=window.database.local;
		if(lng&&lng!='en'){
			$.extend(o,$.i18n.gridfield);
		}
		this.grid = $("<div/>").css({top: this.titlebar.outerHeight()}).appendTo(c)
		      .agilegrid($.extend({
					dbId:o.dbId,
					cellRender: function(row, col){
						var v = "", r = o.value[row], cm = this.colModel;
						if( r ) {
							try{v = eval("r."+cm[col].name);}catch(e){};
							v = v || "";
						}
						return o.converter?o.converter(row,col,v):v;
					},
					leftHeaderRender:function(row){return row+1;},
					columnResize:function(e,data){if(o.mode == "design") self._updateMetadata();},
					optionchanged:function(e,data){if(o.mode == "design" && data.key == "colModel") self._updateMetadata();}
				},o.gridOptions));
		$.each(["addItem","editItem","deleteItem"], function(k,v){
			$("<button class='title-button'/>").attr("id",v).html(o[v+"Label"]).appendTo(self.toolbar).button().click(function(e){
				self['_'+$(e.target).closest('button').attr("id")]();
				return false;
			});
		});
	},

	_updateMetadata:function(){
		var opts = {
				colModel: this.grid.agilegrid("option","colModel"),
				totalColCount: this.grid.agilegrid("option","totalColCount")
		};
		$.extend(true, this.options.metadata, {gridfield:{gridOptions: opts}});
		return $.an.field.prototype._updateMetadata.apply(this, arguments);
	},
	
	_addItem: function(){
		this._createItemEditor(this.options.formId);
	},
	
	_editItem: function(){
		var o = this.options, row=0;
		$.each(this.grid.agilegrid("option","rowSelections"), function(k,v){
			if(v) { row = k; return false; }
		});
		this._createItemEditor(o.formId, row);
	},
	
	_deleteItem: function(){
		var o = this.options, sel = this.grid.agilegrid("option","rowSelections"), value = [];
		$.each(o.value, function(k,v){
			if(!sel[k]){
				value.push(v);
			}
		});
		this._setValue(value);
	},
	
	_setValue:function(value){
		var o = this.options;
		var oldValue = o.value;
		o.value = value;
		this.grid.agilegrid("option","rowCount", value.length).agilegrid("refresh");
		this.element.trigger("change");
		this._trigger("optionchanged",null,{key:"value", value:value, oldValue:oldValue, isTransient:o.isTransient});
	},
	
	_createItemEditor: function(formId, row){
		var self = this, o = this.options;
		o.value = o.value || [];
		$.ans.getDoc(o.dbId,formId,null,function(err,form){
			$("<div/>").dialog($.extend({
				title: form.title || form.name || form._id, 
				autoOpen: true,
				height: 500,
				width: 600,
				modal: true,
				open: function(event, ui){
					var doc = new DocWrapper(o.value[row]||{});
					$(this).form({form:form, document:doc,url:o.url,dbId:o.dbId,mode:"edit",ignoreEscape:true});
				},
				buttons:{
					"OK": function(){
						if(!(o.gridOptions.validate) || (o.gridOptions.validate && $(this).form("validate"))){
							var $this = $(this), doc = $this.form("option","document").getDoc(), value = [].concat(o.value);
							if(row !== undefined){
								value.splice(row,1,doc);
							}else{
								value.push(doc);
							}
							self._setValue(value);
							$this.dialog("close");
						}
						
					},
					"Cancel": function(){
						$(this).dialog("close"); 
					}
				},
				close:function(){
					$(this).form("destroy").remove();
				}
			},o.dialogOptions));
		});
	},
	
	_handleChange:function(key, value, oldValue){
		$.an.field.prototype._handleChange.apply(this, arguments);
		if(key === "title") this.title.html(value);
	},
	
	_browser:function(){
		var o = this.options;
		this.grid.agilegrid($.extend(true,{},{
			rowCount: (o.value&&o.value.length)||0,
			isColumnResizable: false, 
			isRowResizable: false,
			contextmenu2:false
		},o.gridOptions)).agilegrid("refresh");
		this.toolbar.hide();
	},
	
	_edit:function(){
		this._browser();
		this.toolbar.show();
	},
	
	_design:function(){
		var o = this.options;
		this.grid.agilegrid($.extend(true,{},{
			rowCount: (o.value&&o.value.length)||0,
			isColumnResizable: true,
			isRowResizable: true,
			columnEditable:true,
			contextmenu2:true
		},o.gridOptions)).agilegrid("refresh");
		this.toolbar.show();
	},
	
	destroy: function() {
		$(window).unbind("resize.an-gridfield", this._proxy);
		this.element.removeClass("an-gridfield" );
		return $.an.field.prototype.destroy.apply(this, arguments);
	}
});
})( jQuery );
