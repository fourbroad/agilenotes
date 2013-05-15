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

	$.widget("an.searchfield", $.an.inputfield, {
		_create : function() {
			$.an.inputfield.prototype._create.apply(this, arguments);
		},

		_createControl : function() {
			$.an.inputfield.prototype._createControl.apply(this, arguments);
			this.input.attr('data-type', "search");
			var el = this.element.find(".content").eq(0);
			el.removeClass("ui-input-text");
			el.addClass("ui-input-search ui-icon-search ui-icon-searchfield");
			
			/*var delButton = '<a id="agilenote_search_field_link" title="clear text" class="ui-input-clear ui-btn ui-shadow ui-btn-corner-all ui-fullsize ui-btn-icon-notext ui-btn-up-c ui-input-clear-hidden" href="#" data-corners="true" data-shadow="true" data-iconshadow="true" data-wrapperels="span" data-icon="delete" data-iconpos="notext" data-theme="c" data-mini="false"><span class="ui-btn-inner"><span class="ui-btn-text">clear text</span><span class="ui-icon ui-icon-delete ui-icon-shadow">&nbsp;</span></span></a>';
			this.element.append(delButton);
			this.input.bind("keyup.inputfield", function(e) {
				$("#agilenote_search_field_link").removeClass("ui-input-clear-hidden");
			});*/
		},

		_makeResizable : function() {
		},

		_browser : function() {
			$.an.inputfield.prototype._browser.apply(this, arguments);
		},

		_edit : function() {
			this.input.detach().val(this.options.value).appendTo(this.content.empty(), arguments);
		},

		_design : function() {
			$.an.inputfield.prototype._design.apply(this, arguments);
		},

		_handleChange : function(key, value, oldValue) {
			$.an.inputfield.prototype._handleChange.apply(this, arguments);
		},

		highlight : function(highlight) {
			(this.options.mode == "edit" ? this.input : this.element).toggleClass("an-state-hover", highlight);
		},

		destroy : function() {
			$.an.inputfield.prototype.destroy.apply(this, arguments);
		} });
})(jQuery);
