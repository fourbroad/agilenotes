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

$.widget( "an.jsrenderfield", $.an.field, {
	options: {
		mode: "browser",
		selector:"",
		browserTemplate:"",
		editorTemplate:"",
		value:[]
	},

	_create: function() {
		$.an.field.prototype._create.apply(this, arguments);
		var o = this.options, c = this.content;
		this.element.addClass("an-jsrenderfield");
		try {
			c.html(o.content);
		} catch (e) {
			
		}
		
		if (o.templates) {
			var obj = {};
			for (var i = 0; i < o.templates.length; i++) {
				obj[o.templates[i].name] = o.templates[i].content;
			}
			
			$.templates(obj);
		}
		
		if(o.converters){
			var conv = {};
			var tmp = null;
			for (var j = 0; j < o.converters.length; j++) {
				tmp = eval("(0," + o.converters[j]['function'] + ")");
				if (!$.isFunction(tmp)) {
					conv[o.converters[j]['name']] = function(v) {
						return v;
					};
				} else {
					conv[o.converters[j]['name']] = tmp;
				}
			}
			
			$.views.converters(conv);
		}
	},
	
	_notify:function(oldValue, value){
		var o = this.options;
		if(value != oldValue){
			o.value = value;
			this._trigger("optionchanged",null,{key:"value", value:value, oldValue:oldValue, isTransient:o.isTransient});
		}
	},
	
	appendValue:function(value) {
		var o = this.options, oldValue = [].concat(o.value);
		o.value.push(value);
		this.refresh();
		this._notify(oldValue, o.value);
	},

	insertValue:function(index, value) {
		var o = this.options, oldValue = [].concat(o.value);
		o.value.splice(index, 1, value);
		this.refresh();
		this._notify(oldValue, o.value);
	},
	
	delValue:function(index) {
		var o = this.options, oldValue = [].concat(o.value);
		o.value.splice(index, 1);
		this.refresh();
		this._notify(oldValue, o.value);
	},
	
	getValue:function(index) {
		var o = this.options;
		return o.value[index];
	},
	
	replaceValue:function(index, value) {
		var o = this.options, oldValue = [].concat(o.value);
		o.value[index] = value;this.refresh();
		this._notify(oldValue, o.value);
	},
	
	_browser:function(){
		var o = this.options;
		if (o.browserTemplate != undefined && o.browserTemplate != "") {
			var html = $.render[o.browserTemplate](o.value);
			$(o.selector, this.element).html(html);
		} else {
			if (o.templates) {
				var html = $.render[o.templates[0].name](o.value);
				$(o.selector, this.element).html(html);
			}
		}
	},
	
	_edit:function(){
		var o = this.options;
		if (o.editorTemplate != undefined && o.editorTemplate != "") {
			var html = $.render[o.editorTemplate](o.value);
			$(o.selector, this.element).html(html);
		} else {
			if (o.templates) {
				var html = $.render[o.templates[0].name](o.value);
				$(o.selector, this.element).html(html);
			}
		}
	},
	
	_design:function(){
		this._browser();
	},
	
	destroy: function() {
		this.element.removeClass("an-jsrenderfield" );
		return $.an.field.prototype.destroy.apply(this, arguments);
	}
});
})( jQuery );
