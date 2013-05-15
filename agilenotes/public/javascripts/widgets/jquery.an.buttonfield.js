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

$.widget( "an.buttonfield",  $.an.field, {

	_create: function() {
		$.an.field.prototype._create.apply(this, arguments);
		this.element.addClass("an-buttonfield");
		this.content.button({label:this.options.label});
	},

	_makeResizable : function() {
	},

	destroy: function() {
		this.content.button("destroy");
		this.element.removeClass("an-buttonfield");
		return $.an.field.prototype.destroy.apply(this, arguments);
	}
});
})( jQuery );
