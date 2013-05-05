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

$.widget( "an.selectfield", $.an.field, {
	options:{
		width:120,
		height:21
	},
	
	_create: function() {
		$.an.field.prototype._create.apply(this, arguments);
		this.element.addClass("an-selectfield");
	},
	
	_createControl:function(){
		var self = this, o = this.options, el = this.element;
		var sel = this.select = $("<select />").attr("name",o.id).css({width:o.width, height:o.height})
		    .appendTo(el);
		$("<option/>").attr("value","").html("").appendTo(sel);
		$.each(o.selectItems||[], function(){
			$("<option/>").attr("value",this.value).html(this.label).appendTo(sel);
		});
		
		if(!$.isEmptyObject(o.validate)){
			sel.addClass($.toJSON({validate:o.validate}));
		}

		sel.bind("change.selectfield", function(e){
			e.preventDefault();
//			e.stopImmediatePropagation();
			var value = sel.val(), oldValue = o.value;
			if(value != oldValue){
				o.value = value;
				self._trigger("optionchanged",null,{key:"value", value:value, oldValue:oldValue, isTransient:o.isTransient});
			}
		});
	},
	
	_browser:function(){
		var self = this, o = this.options;
		this.select.hide();
		$.each(o.selectItems, function(){
			if(this.value == o.value){
				self.content.html(this.label).show();
				return false;
			}
		});
	},
	
	_edit:function(){
		this.content.hide();
		this.select.val(this.options.value).show();
	},
	
	_design:function(){
		var self = this, o = this.options;
		this.select.hide();
		$.each(o.selectItems, function(){
			if(this.value == o.value){
				self.content.html(this.label).show();
				return false;
			}
		});
	},
	
	_handleChange:function(key, value, oldValue){
		if(key === "label"){
			this.element.children("label").remove();
			this._createLabel();
		}else if(key == "selectItems"){
			this.select.remove();
			this._createControl();
		}else{
			$.an.field.prototype._handleChange.apply(this, arguments);
		}
	},
	
	destroy: function() {
		this.select.unbind(".selectfield").remove();
		this.element.removeClass("an-selectfield" );
		return $.an.field.prototype.destroy.apply(this, arguments);
	}
});
})( jQuery );
