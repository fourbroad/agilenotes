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
	
	_design:function() {
		var o = this.options;
		if (o.mobile) {
			var dat = '<div data-corners="true" data-shadow="true" data-iconshadow="false"\
				data-wrapperels="span"  data-disabled="true" data-label="' + o.label + '"\
				aria-disabled="false">\
				<span class="ui-btn-inner">\
					<span class="ui-btn-text">' + o.label + '</span>';
			if (o.data_icon) {
				dat += '<span class="ui-icon ui-icon-arrow-d">&nbsp;</span>';
			}
				dat += '</span>\
				<div class="content ui-btn-hidden" data-disabled="false"></div>\
			</div>';
			var html = $(dat);
			
			if (o.data_icon) {
				html.addClass("ui-btn-icon-" + o.data_icon);
			}
			
			if (o.data_iconpos) {
				html.addClass('ui-btn-icon-' + o.data_iconpos);
			}
			
			if (o.data_theme) {
				html.addClass("ui-btn-up-" + o.data_theme);
			}
			
			if (o.data_inline) {
				html.addClass("ui-btn-inline");
			}
			
			if (o.isMini) {
				html.addClass('ui-mini');
			}
			
			html.addClass("ui-btn ui-shadow ui-btn-corner-all");
			this.content.html(html);
		}
	},
	
	destroy: function() {
		this.content.button("destroy").remove();
		this.element.removeClass("an-buttonwidget");
		return $.an.widget.prototype.destroy.apply(this, arguments);
	}
});
})( jQuery );
