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

$.widget( "an.passwordfield", $.an.inputfield, {

	_create: function() {
		$.an.inputfield.prototype._create.apply(this, arguments);
		this.element.addClass("an-passwordfield");
	},

	_browser:function(){
		this.input.hide();
		this.content.html("********").show();
	},
	
	_edit:function(){
		this.content.hide();
		this.input.val(this.options.value).show();
	},
	
	_design:function(){
		this.input.hide();
		this.content.html("********").show();
	},

	destroy: function() {
		this.element.removeClass( "an-passwordfield" );
		$.an.inputfield.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
