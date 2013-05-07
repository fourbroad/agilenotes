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

$.widget( "an.checkboxfield", $.an.inputfield, {
	_create: function() {
		$.an.inputfield.prototype._create.apply(this, arguments);
		this.element.addClass("an-checkboxfield");
		this.content.hide();
	},

	_createControl:function(){
		var self = this, o = this.options;
		this.input = $("<input type='checkbox'/>").attr({name:o.id})
		    .addClass("ui-widget-content ui-corner-all").bind("change.checkboxfield",function(e){
			var value = self.input.prop("checked"), oldValue = o.value;
			if(value != oldValue){
				o.value = value;
				self._trigger("optionchanged",null,{key:"value", value:value, oldValue:oldValue, isTransient:o.isTransient});
			}
		}).bind("dblclick.checkboxfield",function(e){e.stopImmediatePropagation();});
		
		if(!$.isEmptyObject(o.validate)){
			this.input.addClass($.toJSON({validate:o.validate}));
		}
		this.input.appendTo(this.element);
	},
	
	_makeResizable:function(){},
	
	_createLabel:function(){
		var o = this.options, el = this.element;
		if(o.label){
		    $("<label/>").attr("for",o.id).html(o.label).appendTo(el);
		}
	},
	
	_browser:function(){
        this.input.prop('checked', this.options.value).attr("disabled","disabled");
	},
	
	_edit:function(){
        this.input.prop('checked', this.options.value).removeAttr("disabled");
	},
	
	_design:function(){
		this.input.hide();
		this.content.css("display","");
	},
	
	highlight: function(highlight){
		this.element.toggleClass("an-state-hover",highlight);
	},
	
	destroy: function() {
		this.input.unbind(".checkboxfield");
		this.element.removeClass( "an-checkboxfield" );
		return $.an.inputfield.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
