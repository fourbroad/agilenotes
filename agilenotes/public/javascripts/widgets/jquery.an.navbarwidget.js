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

$.widget( "an.navbarwidget",  $.an.widget, {

	_create: function() {
		var o = this.options;
		$.an.widget.prototype._create.apply(this, arguments);
		// this.element.addClass("an-navbarwidget");
		if (o.mobile) {
			try {this.content.navbar(); }catch(e) {}
		}
	},

	_makeResizable:function(){},
	
	_design:function() {
		var o = this.options;
		if (o.mobile) {
			var content = $("<div data-role='navbar'/>").attr("id", o.id);
			var ul = $("<ul class='c' />").addClass('ui-grid-solo'), width;
			var len = o.selectItems.length;
			$(o.selectItems).each(function(k, v) {
				var link = $("<a/>"), linkClass = 'ui-btn ';
				if (v.data_transition) {
					link.attr("data-transition", v.data_transition);
				}
				
				if (v.data_icon) {
					linkClass += " ui-btn-icon-" + v.data_icon;
				}
				
				if (v.data_iconpos) {
					linkClass += " ui-btn-iconpos-" + v.data_iconpos;
				}
				
				if (v.data_theme) {
					linkClass += " ui-btn-up-" + v.data_theme;
				}
				
				if (v.data_inline) {
					linkClass += " ui-btn-inline";
				}
				
				if (v.isMini) {
					linkClass += " ui-mini";
				}
				
				var span = $('<span class="ui-btn-inner"><span class="ui-btn-text">' + v.label + '</span></span>');
				link.append(span).addClass(linkClass);
				if (len <= 5) {
					width = 100 / len;
				} else {
					width = "33.33";
				}
				ul.append($("<li style='width:" + width + "%;'/>").addClass("ui-block-a").append(link));
			});
			
			content.append(ul);
			this.content.html(content.html());
		}
	},
	
	destroy: function() {
		return $.an.widget.prototype.destroy.apply(this, arguments);
	}
});
})( jQuery );
