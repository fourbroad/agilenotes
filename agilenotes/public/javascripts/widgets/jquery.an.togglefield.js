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

$.widget( "an.togglefield", $.an.inputfield, {


	_create: function() {
		$.an.field.prototype._create.apply(this, arguments);
		this.element.addClass("an-togglefield");
	},	

	_createControl : function() {
		var self = this, o = this.options, el = this.element;
		console.log(this);
		console.log(el);
		console.log(o);
		if (o.mobile) {
			var cl = this.element.find(".content").eq(0);
			cl.addClass("codiqa-control ui-field-contain ui-body ui-br");
			this.select = $('<select />').attr({id:o.id, name:o.id, value:this.value})
		    .addClass("ui-slider-switch").appendTo(cl);
			var toggle_content = $('<div />').addClass('ui-slider ui-slider-switch ui-btn-down-c ui-btn-corner-all').appendTo(cl);
			toggle_content.html('<span class="ui-slider-label ui-slider-label-a ui-btn-active ui-btn-corner-all" role="img" style="width: 0%;">On</span><span class="ui-slider-label ui-slider-label-b ui-btn-down-c ui-btn-corner-all" role="img" style="width: 100%;">Off</span>');
			var toggle_a_content = $('<div />').addClass("ui-slider-inneroffset").appendTo(toggle_content);
			var toogle_a = $('<a />').addClass('ui-slider-handle ui-slider-handle-snapping ui-btn ui-btn-up-c ui-shadow ui-btn-corner-all')
									.html('<span class="ui-btn-inner"><span class="ui-btn-text"></span></span>').appendTo(toggle_a_content);	
		} 
	},

	_makeResizable : function() {
	},

	_browser : function() {
		//this.input.detach();
		/*var c = this.content;
		if (c.is(".ui-resizable")) c.resizable("destroy");
		c.html(this.options.value + "").css("display", "");*/
	},

	_edit : function() {
		//this.input.detach().val(this.options.value).appendTo(this.content.empty());
	},

	_design : function() {
		//this.input.detach();
		var self = this, o = this.options, c = this.content;
		if (c.is(".ui-resizable")) c.resizable("destroy");
		/*c.html(o.value + "").css({ width : o.width, height : o.height, display : "" }).resizable(
			{ stop : function(e, ui) {
				o.width = c.width();
				o.height = c.height();
				$.extend(true, o.metadata[self.widgetName], { width : o.width, height : o.height });
				self._updateMetadata();
				self._trigger("resize", null, { size : ui.size, oldSize : ui.originalSize });
			} });*/
	},

	_handleChange : function(key, value, oldValue) {
		if (key === "label") {
			this.input && this.input.remove();
			this.element.children("label").remove();
			this._createControl();
			this._createLabel();
		} else {
			$.an.field.prototype._handleChange.apply(this, arguments);
		}
	},

	/*highlight : function(highlight) {
		(this.options.mode == "edit" ? this.input : this.element).toggleClass("an-state-hover", highlight);
	},*/

	destroy : function() {
		//this.input && this.input.unbind(".togglefield").remove();
		this.element.removeClass("an-togglefield");
		return $.an.field.prototype.destroy.apply(this, arguments);
	} });
})( jQuery );
