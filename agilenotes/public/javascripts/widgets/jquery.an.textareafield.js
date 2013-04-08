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

$.widget( "an.textareafield", $.an.field, {

	_create: function() {
		$.an.field.prototype._create.apply(this, arguments);
		var self = this, o = this.options, el = this.element;
		el.addClass("an-textareafield");
		var ta = this.textarea = $("<textarea type='"+o.type+"'/>").attr("name",o.id)
		      .addClass("ui-widget-content ui-corner-all")
		      .appendTo($("<div class='textarea-wrapper'/>").appendTo(el));

		if(!$.isEmptyObject(o.validate)){
			ta.addClass($.toJSON({validate:o.validate}));
		}

		ta.bind("change.textareafield keyup.textareafield",function(e){
			e.preventDefault();
//			e.stopImmediatePropagation();
			var value = ta.val(), oldValue = o.value;
			if(value != oldValue){
				o.value = value;
				self._trigger("optionchanged",null,{key:"value", value:value, oldValue:oldValue, isTransient:o.isTransient});
			}
		}).bind("dblclick.textareafield",function(e){e.stopImmediatePropagation();});
	},
	
	_browser:function(){
		var o = this.options;
		this.textarea.hide();
		this.content.html(o.pre? "<pre>"+o.value+"</pre>": o.value).show();
	},
	
	_edit:function(){
		var o = this.options;
		this.content.hide();
		this.textarea.val(o.value).show();
	},

	_design:function(){
		var o = this.options;
		this.textarea.hide();
		this.content.html(o.pre? "<pre>"+o.value+"</pre>":o.value).show();
	},
	
	destroy: function() {
		this.textarea.unbind(".textareafield").parent().remove();
		this.element.removeClass( "an-textareafield" );
		return $.an.field.prototype.destroy.apply(this, arguments);
	}
});
})( jQuery );
