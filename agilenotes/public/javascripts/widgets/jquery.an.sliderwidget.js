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

$.widget( "an.sliderwidget",  $.an.widget, {
	_create: function() {
		var o = this.options;
		$.an.widget.prototype._create.apply(this, arguments);
		this.element.addClass("an-sliderwidget");
		if (!this.min) {
			this.min = 1;
		}
		
		if (!this.max) {
			this.max = 100;
		}
		
		var input = $("<input type='number' data-type='range' data-highlight='false' />").addClass("ui-input-text ui-body-c ui-corner-all ui-shadow-inset ui-slider-input");
		this.content.append(input);
		this.content.slider().attr("id", o.id).attr('min', this.min).attr('max', this.max).bind("change.sliderfield", function(e) {
			$(e.target).find(">input").val($($(e.target)).val());
		});
	},

	_makeResizable:function(){},
	
	_design:function() {
		var link = $('<div role="application" class="ui-slider-track ui-btn-down-c ui-btn-corner-all">\
					<a href="#"\
						class="ui-slider-handle ui-btn ui-shadow ui-btn-corner-all ui-btn-up-c"\
						data-corners="true" data-shadow="true" data-iconshadow="true"\
						data-wrapperels="span" data-theme="c" role="slider" aria-valuemin="0"\
						aria-valuemax="100" aria-valuenow="0" aria-valuetext="0" title="0"\
						aria-labelledby="slider1-label" style="left: 0%;">\
						<span class="ui-btn-inner">\
							<span class="ui-btn-text"></span>\
						</span>\
					</a>\
				</div>');
		var el = $("<div class='ui-slider' style='margin-top:0' />");
		link.appendTo(el);
		el.appendTo(this.content);
		$(this.content.find(">input")).attr('disabled', true);
	},
	
	destroy: function() {
		this.content.slider("destroy").unbind(".sliderfield").remove();
		this.element.removeClass("an-sliderwidget");
		return $.an.widget.prototype.destroy.apply(this, arguments);
	}
});
})( jQuery );
