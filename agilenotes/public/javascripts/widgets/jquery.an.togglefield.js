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

$.widget( "an.togglefield", $.an.sliderfield, {
	_create: function() {
		$.an.sliderfield.prototype._create.apply(this, arguments);
		this.element.addClass("an-togglefield");
	},
	
	_createControl : function() {
		var o = this.options, self = this;
		o.ontext = o.ontext || "On";
		o.offtext = o.offtext || "Off";
		this.input = $('<select >\
		    <option value="no">' + o.ontext + '</option>\
		    <option value="yes">' + o.offtext + '</option>\
		  </select>').attr({ name : o.id }).bind(
			"change.inputfield keyup.inputfield",
			function(e) {
				var value = self.input.val(), oldValue = o.value;
				if (value != oldValue) {
					o.value = value;
					self._trigger("optionchanged", null, { key : "value", value : value, oldValue : oldValue,
						isTransient : o.isTransient });
				}
			});
		self._trigger("optionchanged", null, { key : "value", value : "no", oldValue : "",isTransient : o.isTransient });
	},
	
	_edit : function() {
		this.input.appendTo(this.content).slider(this.options);
	},
	
	_makeResizable:function(){},
	
	_design:function() {
		if(!this.select){
			var o = this.options;
			if (o.mobile) {
				var cl = this.element.find(".content").eq(0);
				cl.addClass("codiqa-control ui-field-contain ui-body ui-br");
				this.select = $('<select />').attr({id:o.id, name:o.id, value:this.value})
			    .addClass("ui-slider-switch").appendTo(cl);
				var toggle_content = $('<div />').addClass('ui-slider ui-slider-switch ui-btn-down-c ui-btn-corner-all').appendTo(cl);
				toggle_content.html('<span class="ui-slider-label ui-slider-label-a ui-btn-active ui-btn-corner-all" role="img" style="width: 0%;">On</span><span class="ui-slider-label ui-slider-label-b ui-btn-down-c ui-btn-corner-all" role="img" style="width: 100%;">Off</span>');
				var toggle_a_content = $('<div />').addClass("ui-slider-inneroffset").appendTo(toggle_content);
				$('<a />').addClass('ui-slider-handle ui-slider-handle-snapping ui-btn ui-btn-up-c ui-shadow ui-btn-corner-all')
										.html('<span class="ui-btn-inner"><span class="ui-btn-text"></span></span>').appendTo(toggle_a_content);
				this.content.removeClass("content");
			}
			}
	},
	
	destroy: function() {
		return $.an.sliderfield.prototype.destroy.apply(this, arguments);
	}
});
})( jQuery );
