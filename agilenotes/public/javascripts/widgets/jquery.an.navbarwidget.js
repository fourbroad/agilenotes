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
			try {this.content.navbar({iconpos:o.iconpos}); }catch(e) {}
		}
	},

	_makeResizable:function(){},
	
	_edit:function() {
		var span = this.content.find(".an-navbarwidget");
		$(span).each(function(k, v) {
			$(v).remove();
		});
		
		this.content.find(".c").removeClass("ui-grid-c");
	},
	
	_design:function() {
		var o = this.options;
		if (o.mobile) {
			var content = $("<div data-role='navbar'/>").attr("id", o.id);
			var ul = $("<ul class='c' />"), width;
			var len = o.selectItems.length;
			$(o.selectItems).each(function(k, v) {
				var link = $("<a/>"), linkClass = 'ui-btn ';
				var subspan = $("<span style='display:none;' class='an-navbarwidget' />");
				subspan.addClass(o.iconpos || "");
				if (v.data_transition) {
					link.attr("data-transition", v.data_transition);
				}
				
				if (v.data_icon) {
					subspan.addClass("ui-icon ui-icon-" + v.data_icon);
					subspan.css('display', 'block');
					link.attr("data-icon", v.data_icon);
				}
				
				if (o.iconpos) {
					subspan.addClass("ui-btn-icon-" + o.iconpos);
				}
				
				if (v.data_theme) {
					linkClass += " ui-btn-up-" + v.data_theme;
					link.attr("data-theme", v.data_theme);
				}
				
				if (v.data_inline) {
					linkClass += " ui-btn-inline";
					link.attr("data-inline", true);
				}
				
				if (v.isMini) {
					linkClass += " ui-mini";
					link.attr("data-mini", true);
				}
				
				if (len <= 5) {
					width = 100 / len;
				} else {
					width = "33.33";
				}
				if (o.iconpos && o.iconpos != 'bottom') {
					link.append(subspan).addClass(linkClass);
				}
				link.append($("<div />").html(v.label || "Button"));
				if (o.iconpos && o.iconpos == 'bottom') {
					link.append(subspan).addClass(linkClass);
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
