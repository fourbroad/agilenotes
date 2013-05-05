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
	options:{resizable:true},

	_create: function() {
		$.an.field.prototype._create.apply(this, arguments);
		this.element.addClass("an-textareafield");
	},
	
	_createControl:function(){
		var self = this, o = this.options, el = this.element;
		this.textareaWrapper = $("<div class='textarea-wrapper'/>").css({width:o.width, height:o.height})
		    .appendTo(el);
		this.textarea = $("<textarea type='"+o.type+"'/>").attr("name",o.id)
		    .addClass("ui-widget-content ui-corner-all").appendTo(this.textareaWrapper);

		if(o.resizable) this.textareaWrapper.resizable();
		
		if(!$.isEmptyObject(o.validate)){
			this.textarea.addClass($.toJSON({validate:o.validate}));
		}

		this.textarea.bind("change.textareafield keyup.textareafield",function(e){
			e.preventDefault();
//			e.stopImmediatePropagation();
			var value = self.textarea.val(), oldValue = o.value;
			if(value != oldValue){
				o.value = value;
				self._trigger("optionchanged",null,{key:"value", value:value, oldValue:oldValue, isTransient:o.isTransient});
			}
		}).bind("dblclick.textareafield",function(e){e.stopImmediatePropagation();});
	},
	
	_makeResizable:function(){},
	
	_browser:function(){
		this.textareaWrapper.hide();

		var o = this.options, c = this.content;
		if(c.is(".ui-resizable")) c.resizable("destroy");
		c.html(o.pre? "<pre>"+o.value+"</pre>": o.value).css("display","");
	},
	
	_edit:function(){
		this.content.hide();
		this.textarea.val(this.options.value);
		this.textareaWrapper.css("display","");
	},

	_design:function(){
		this.textareaWrapper.hide();

		var self = this, o = this.options, c = this.content;
		if(c.is(".ui-resizable")) c.resizable("destroy");
		c.html(o.pre? "<pre>"+o.value+"</pre>":o.value)
		 .css({width:o.width, height:o.height, display:""}).resizable({
			stop:function(e,ui){
				o.width = c.width();
				o.height = c.height();
				$.extend(true,o.metadata[self.widgetName],{width:o.width,height:o.height});
				self._updateMetadata();
				self._trigger("resize",null, {size:ui.size, oldSize:ui.originalSize});
			}
		});
	},
	
	_handleChange:function(key, value, oldValue){
		if(key === "label"){
			this.textareaWrapper.remove();
			this.element.children("label").remove();
			this._createControl();
			this._createLabel();
		}else {
			$.an.field.prototype._handleChange.apply(this, arguments);
		}
	},
	
	destroy: function() {
		this.textarea.unbind(".textareafield").parent().remove();
		this.element.removeClass( "an-textareafield" );
		return $.an.field.prototype.destroy.apply(this, arguments);
	}
});
})( jQuery );
