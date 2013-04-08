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
		var self = this;
		this.content.hide();
		this.input.unbind("change keypress").bind("change.checkboxfield",function(e){
//			e.preventDefault();
//			e.stopImmediatePropagation();
			self.option("value",self.input.prop("checked"));
		}).css({width:"",height:""}).show();
	},

	_makeResizable:function(){},
	
	_browser:function(){
        this.input.prop('checked', this.options.value).attr("disabled","disabled");
	},
	
	_edit:function(){
        this.input.prop('checked', this.options.value).removeAttr("disabled");
	},
	
	_design:function(){
		this.input.hide();
		this.content.show();
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
