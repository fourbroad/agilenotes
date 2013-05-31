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

$.widget( "an.pageMobile", $.an.page, {
	_create: function() {
		if (this.widgetName == 'pageMobile') this.widgetName = 'page';
		$.an.page.prototype._create.apply(this, arguments);
	}
});
})( jQuery );