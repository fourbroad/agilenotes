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

$.widget( "an.field", $.an.widget, {
	options:{
		value:""
	},

	_create: function() {
		$.an.widget.prototype._create.apply(this, arguments);
		var o = this.options, el = this.element;
		el.addClass("an-field");
		this.content.empty();
		o.isTransient = el.attr("transient"); 
	},
	
	destroy: function() {
		this.content.remove();
		this.element.removeClass("an-field");
		return $.an.widget.prototype.destroy.apply(this, arguments);
	}
});

})( jQuery );
