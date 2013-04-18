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

$.widget( "an.inputfield", $.an.field, {

	_create: function() {
		$.an.field.prototype._create.apply(this, arguments);
		this.element.addClass("an-inputfield").find("input").remove();
		this.input = this._createInput().appendTo(this.element);
	},
	
	_createInput:function(){
		var self = this, o = this.options;
		var input = $("<input type='"+o.type+"'/>").attr({name:o.id})
		    .addClass("ui-widget-content ui-corner-all").bind("change.inputfield keyup.inputfield",function(e){
			var value = self.input.val(), oldValue = o.value;
			if(value != oldValue){
				o.value = value;
				self._trigger("optionchanged",null,{key:"value", value:value, oldValue:oldValue, isTransient:o.isTransient});
			}
		}).bind("dblclick.inputfield",function(e){e.stopImmediatePropagation();}).hide();
		
		if(!$.isEmptyObject(o.validate)){
			input.addClass($.toJSON({validate:o.validate}));
		}
		return input;
	},
	
	_browser:function(){
		this.input.hide();
		this.content.html(this.options.value+"").css("display","inline-block");
	},
	
	_edit:function(){
		this.input.val(this.options.value).removeAttr("style");
		this.content.hide();
	},
	
	_design:function(){
		this.input.hide();
		this.content.html(this.options.value+"").show();
	},
	
	highlight: function(highlight){
		(this.options.mode == "edit" ? this.input : this.element).toggleClass("an-state-hover",highlight);
	},
	
	destroy: function() {
		this.input.unbind(".inputfield").remove();
		this.element.removeClass("an-inputfield");
		return $.an.field.prototype.destroy.apply(this, arguments);
	}
});
})( jQuery );
