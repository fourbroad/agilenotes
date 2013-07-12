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

(function($, undefined) {

	$.widget("an.inputfield", $.an.field, {
		_create : function() {
			$.an.field.prototype._create.apply(this, arguments);
			this.element.addClass("an-inputfield");
		},

		_createControl : function() {
			var self = this, o = this.options;
			if (o.mobile) {
				var el = this.element.find(".content").eq(0);
				el.addClass("ui-shadow-inset ui-corner-all ui-btn-shadow ui-body-c ui-input-text");
				
				this.input = $("<input type='" + o.type + "'/>").attr({ name : o.id }).addClass("ui-body-c ui-input-text").bind(
					"change.inputfield keyup.inputfield",
					function(e) {
						var value = self.input.val(), oldValue = o.value;
						if (value != oldValue) {
							o.value = value;
							self._trigger("optionchanged", null, { key : "value", value : value, oldValue : oldValue,
								isTransient : o.isTransient });
						}
					}).bind("dblclick.inputfield", function(e) {
					e.stopImmediatePropagation();
				}).bind("focus.inputfield", function(e) {
					el.addClass("ui-focus");
				}).bind("blur.inputfield", function(e) {
					el.removeClass("ui-focus");
				}).bind("keyup.inputfield", function(e) {
					
				});

				if (o.placeholder) {
					this.input.attr("placeholder", o.placeholder);
				}

				if (o.value) {
					this.input.attr("value", o.value);
					this._trigger("optionchanged", null, { key : "value", value : o.value, oldValue : "",isTransient : o.isTransient });
				}

				if (o.data_mini) {
					this.input.attr("data-mini", o.data_mini);
				}
			} else {
				this.input = $("<input type='" + o.type + "'/>").attr({ name : o.id }).addClass(
					"ui-widget-content ui-corner-all").bind(
					"change.inputfield keyup.inputfield",
					function(e) {
						var value = self.input.val(), oldValue = o.value;
						if (value != oldValue) {
							o.value = value;
							self._trigger("optionchanged", null, { key : "value", value : value, oldValue : oldValue,
								isTransient : o.isTransient });
						}
					}).bind("dblclick.inputfield", function(e) {
					e.stopImmediatePropagation();
				});
			}

			if (!$.isEmptyObject(o.validate)) {
				this.input.addClass($.toJSON({ validate : o.validate }));
			}
			this.input.css({ width : o.width, height : o.height });
		},

		_makeResizable : function() {
		},

		_browser : function() {
			this.input.detach();
			var c = this.content;
			if (c.is(".ui-resizable")) c.resizable("destroy");
			c.html(this.options.value + "").css("display", "");
		},

		_edit : function() {
			this.input.detach().val(this.options.value).appendTo(this.content.empty());
		},

		_design : function() {
			this.input.detach();
			var self = this, o = this.options, c = this.content;
			if (c.is(".ui-resizable")) c.resizable("destroy");
			c.html(o.value + "").css({ width : o.width, height : o.height, display : "" }).resizable(
				{ stop : function(e, ui) {
					o.width = c.width();
					o.height = c.height();
					$.extend(true, o.metadata[self.widgetName], { width : o.width, height : o.height });
					self._updateMetadata();
					self._trigger("resize", null, { size : ui.size, oldSize : ui.originalSize });
				} });
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

		highlight : function(highlight) {
			(this.options.mode == "edit" ? this.input : this.element).toggleClass("an-state-hover", highlight);
		},

		destroy : function() {
			this.input && this.input.unbind(".inputfield").remove();
			this.element.removeClass("an-inputfield");
			return $.an.field.prototype.destroy.apply(this, arguments);
		} });
})(jQuery);
