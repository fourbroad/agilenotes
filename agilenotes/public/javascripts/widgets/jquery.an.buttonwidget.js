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

$.widget( "an.buttonwidget",  $.an.widget, {

	_create: function() {
		$.an.widget.prototype._create.apply(this, arguments);
		this.element.addClass("an-buttonwidget");
		this.content.button({label:this.options.label});
	},

	_makeResizable:function(){},
	
	_handleChange:function(key, value, oldValue){
		if(key === "label"){
			this.content.button("option","label",value);
		}else {
			$.an.widget.prototype._handleChange.apply(this, arguments);
		}
	},
	
	destroy: function() {
		this.content.button("destroy").remove();
		this.element.removeClass("an-buttonwidget");
		return $.an.widget.prototype.destroy.apply(this, arguments);
	}
});
})( jQuery );
