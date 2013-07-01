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

$.widget( "an.sliderfield",  $.an.inputfield, {
	_create: function() {
		$.an.inputfield.prototype._create.apply(this, arguments);
		this.element.addClass("an-sliderfield");
	},
	
	_createControl : function() {
		var o = this.options, self = this;
		if (!o.min) {
			o.min = 1;
		}
		
		if (!o.max) {
			o.max = 100;
		}
		
		this.input = $("<input type='text'/>").attr({ name : o.id }).attr({min:o.min, max:o.max}).bind(
			"change.inputfield keyup.inputfield",
			function(e) {
				var value = self.input.val(), oldValue = o.value;
				if (value != oldValue) {
					o.value = value;
					self._trigger("optionchanged", null, { key : "value", value : value, oldValue : oldValue,
						isTransient : o.isTransient });
				}
			}).addClass("content ui-shadow-inset ui-corner-all ui-btn-shadow ui-body-c ui-input-text");
	},
	
	_edit : function() {
		this.input.appendTo(this.content).slider(this.options);
	},
	
	_makeResizable:function(){},
	
	_design:function() {
		if(!this.linkStr){
			this.linkStr= $('<input type="text" disabled="disabled" class="content ui-shadow-inset ui-corner-all ui-btn-shadow ui-body-c ui-input-text ui-slider-input"><div role="application" class="ui-slider-track ui-btn-down-c ui-btn-corner-all">\
			<a href="#"\
			class="ui-slider-handle ui-btn ui-shadow ui-btn-corner-all ui-btn-up-c"\
			data-corners="true" data-shadow="true" data-iconshadow="true"\
			data-wrapperels="span" data-theme="c" role="slider" aria-valuemin="0"\
			aria-valuemax="100" aria-valuenow="0" aria-valuetext="0" title="0"\
			aria-labelledby="slider1-label" style="left: 50%;">\
			<span class="ui-btn-inner">\
				<span class="ui-btn-text"></span>\
			</span>\
		</a>\
	</div>');
			this.linkStr.appendTo(this.content.removeClass("content"));
			}
	},
	
	destroy: function() {
		return $.an.inputfield.prototype.destroy.apply(this, arguments);
	}
});
})( jQuery );
