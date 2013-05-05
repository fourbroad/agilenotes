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

$.widget( "an.textfield", $.an.inputfield, {
	options:{
		width:120,
		height:21
	},

	_create: function() {
		$.an.inputfield.prototype._create.apply(this, arguments);
		this.element.addClass("an-textfield");
	},

	destroy: function() {
		this.element.removeClass("an-textfield" );
		return $.an.inputfield.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
