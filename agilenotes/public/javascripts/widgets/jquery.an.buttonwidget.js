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
		var o = this.options;
		$.an.widget.prototype._create.apply(this, arguments);
		this.element.addClass("an-buttonwidget");
		var opts = {label:this.options.label};
		if (o.mobile) {
			// opts = {corners:true, icon:"star", iconpos: "right" , iconshadow: false, inline: true, mini: true, shadow: false, theme: "a"};
			opts.corners = true;
			opts.iconshadow = false;
			if (o.data_transition) {
				opts.transition = o.data_transition;
			}
			
			if (o.data_icon) {
				opts.icon = o.data_icon;
			}
			
			if (o.data_iconpos) {
				opts.iconpos = o.data_iconpos;
			}
			
			if (o.data_theme) {
				opts.theme = o.data_theme;
			}
			
			if (o.data_inline) {
				opts.inline = o.data_inline;
			}
			
			if (o.isMini) {
				opts.mini = true;
			}
			
			var t = this.content.button(opts);
			$($($($(t).parent()).find(">span")).find(">span").eq(0)).html(this.options.label);
		} else {
			this.content.button(opts);
		}
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
