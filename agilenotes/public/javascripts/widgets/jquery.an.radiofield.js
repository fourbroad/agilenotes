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

$.widget( "an.radiofield", $.an.inputfield, {

	_create: function() {
		$.an.inputfield.prototype._create.apply(this, arguments);
		var self = this, o = this.options, value = this.element.attr("value");
		this.element.addClass("an-radiofield");
		this.content.hide();
		this.input.attr("value",value).css({width:"",height:""}).prop("checked", value == o.value).show();
		this.input.unbind("change keypress").bind("change.checkboxfield",function(e){
//			e.preventDefault();
//			e.stopImmediatePropagation();
			self._trigger("optionchanged",null,{key:"value", value:value, oldValue:null, isTransient:self.element.is(".isTransient")});
		});
	},

	_makeResizable:function(){},

	option: function(key, value) {
		if(key == "value"){
			var v = this.element.attr("value");
			if(value === undefined){
				return this.input.prop("checked")? v : null;
			}else{
				this.input.prop("checked",value == v);
				this.refresh();
				return;
			}
		}
		return $.an.inputfield.prototype.option.apply(this, arguments );
	},
	
	_browser:function(){
        this.input.attr("disabled","disabled");
	},
	
	_edit:function(){
        this.input.removeAttr("disabled");
	},

	_design:function(){
		this.input.hide();
	},

	highlight: function(highlight){
		this.element.toggleClass("an-state-hover",highlight);
	},
	
	destroy: function() {
		this.element.removeClass( "an-radiofield" );
		$.an.inputfield.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
