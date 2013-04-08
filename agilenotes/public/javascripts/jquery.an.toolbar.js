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

$.widget( "an.toolbar", {
	options: {},

	_create: function() {
		this.element.addClass("an-toolbar");
		var o = this.options;
		if(o.startAction || o.globalActionSet || o.actionSets){ 
			this.element.empty();
			this._createActionSets();
			this.refresh();
		}
	},
	
	_createActionSets:function(){
		var self = this, o = this.options, ass = [];
		if(o.startAction) ass.push(o.startAction);
		if(o.globalActionSet) ass.push(o.globalActionSet);
		ass = ass.concat(o.actionSets||[]);
		this.actionSets = ass;
		$.each(ass,function(i,j){
			$.each(j,function(k,v){
				var node = null;
				switch(v.type){
				case "button":
					if(k == "startAction"){
						v.element = $("<button class='action start-menu'/>").button({
							label:v.label,
							icons: { primary: "ui-icon-home", secondary: "ui-icon-triangle-1-s"}
						}).prependTo(self.element);
						v.element.menu({
							triggerEvent:"click",
							menuPosition:{ of: v.element, my: "left top", at: "left bottom" },
							actions: v.actions,
							select: function(){ $(this).menu("collapseAll"); }
						});						
					}else{
						v.element = $("<button class='action'/>").button({
					    	label:v.label,
					    	text: v.text,
					    	icons: v.icons
					    }).appendTo(self.element).click(function(e){
					    	if(v.handler) v.handler(e);
							e.preventDefault();
							e.stopImmediatePropagation();
					    });
					}
				    break;
				case "checkbox":{
					var input = $("<input class='action' type='checkbox' id = '"+new ObjectId().toString()+"'/>").appendTo(self.element);
					$("<label for='"+input.attr("id")+"' class='action'></label>").insertAfter(input);
					v.element = input.button({
				    	label:v.label,
				    	text: v.text,
				    	icons: v.icons
				    }).click(function(e){
				    	if(v.handler) v.handler(e);
						e.preventDefault();
						e.stopImmediatePropagation();
				    });
				}
				    break;
				case "radio":{
					var input = $("<input class='action' type='radio' name = '"+v.name+"' id = '"+new ObjectId().toString()+"'/>").appendTo(self.element);
					$("<label for='"+input.attr("id")+"' class='action'></label>").insertAfter(input);
					v.element = input.button({
				    	label:v.label,
				    	text: v.text,
				    	icons: v.icons
				    }).click(function(e){
				    	if(v.handler) v.handler(e);
						e.preventDefault();
						e.stopImmediatePropagation();
				    });
				}
					break;
				case "select":
					node = $("<acronym class='action'/>").attr("title", v.label)
					.elSelect({
						labelTpl : v.labelTpl,
						tpl      : v.tpl,
						select   : v.select,
						src      : v.src
					}).appendTo(self.element);
					node.data("select", node);
					v.element = node;
				    break;
				case "colorPicker":
					node = $("<button class='action'/>").button({
				    	label:v.label,
				    	text: v.text,
				    	icons: v.icons				    	
					}).appendTo(self.element).ColorPicker({color:v.color,handler  : v.handler});
					node.data("select", node);
					v.element = node;
				    break;
				default:
					break;
				}
				if(v.iconFile){
					var icon;
					if(v.type == "checkbox"){
						var sid = v.element.attr("id");
						icon = v.element.siblings("label[for="+sid+"]").find('.'+v.icons.primary);
					}else{
						icon = v.element.find('.'+v.icons.primary);
					}
					icon.css("background-image","url("+v.iconFile+")");
				}
			});
		});
	},

	refresh: function(){
		$.each(this.actionSets,function(i,j){
			$.each(j, function(k,v){
				switch(v.type){
				case "button":
				case "checkbox":
				case "radio":
					if(v.enabled()){
						v.element.button("enable");	
						if(v.type == "checkbox" || v.type == "radio"){
							v.element.prop("checked", v.checked());
							v.element.button("refresh");
						}
					}else{
						v.element.button("disable");
					}
					break;
				case "colorPicker":
				case "select":
					v.element.toggleClass("disabled", !v.enabled());
					break;
				}
			});
		});
	},
	
	value: function(selId, val){
		this.element.find("#"+selId).data("select").val(val);
		return this;
	},
	
	option: function( key, value) {
		if  (key == "isEmpty" && value === undefined){
			return this.element.children().length == 0;
		}
		return $.Widget.prototype.option.apply(this, arguments ); 
	},
	
	_setOption: function(key, value) {
		var o = this.options, oldValue = o[key];
		if(!equals(value,oldValue)){
			$.Widget.prototype._setOption.apply(this, arguments );
			if(key == "actionSets"){
				this.element.empty();
				this._createActionSets();
				this.refresh();
			}
			this._trigger("optionchanged",null,{key:key, value:value, oldValue:oldValue, "transient":o["transient"]});
		}
		return this; 
	},
	
	destroy: function() {
		this.element.removeClass( "an-toolbar" );
		$.Widget.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
