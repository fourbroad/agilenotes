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

$.widget( "an.radiofield", $.an.inputfield, {
	options:{
		orientation:"horizontal"
	},

	_create: function() {
		$.an.inputfield.prototype._create.apply(this, arguments);
		this.element.addClass("an-radiofield");
		this.content.remove();
	},

	_createControl:function(){
		var self = this, o = this.options, el = this.element;
		$.each(o.selectItems||[], function(k,v){
			$("<input type='radio'/>").attr({id:o.id+k, name:o.id, value:this.value})
			    .addClass("ui-widget-content ui-corner-all").appendTo(el);
			$("<div class='content'/>").hide().appendTo(el);
			$("<label/>").attr("for",o.id+k).html(this.label).appendTo(el);
			if(o.orientation == "vertical") el.append("<br>");
		});
		
		this.inputs = el.children("input");
		this.contents = el.children(".content");
		if(!$.isEmptyObject(o.validate)){
			this.inputs.addClass($.toJSON({validate:o.validate}));
		}
		this.inputs.filter("[value="+o.value+"]").prop("checked",true);
		
		this.inputs.bind("change.radiofield",function(e){
			var value = $(e.target).attr("value"), oldValue = o.value;
			if(value != oldValue){
				o.value = value;
				self._trigger("optionchanged",null,{key:"value", value:value, oldValue:oldValue, isTransient:o.isTransient});
			}
		}).bind("dblclick.radiofield",function(e){e.stopImmediatePropagation();});
	},
	
	_createLabel:function(){},

	_makeResizable:function(){},

	_handleChange:function(key, value, oldValue){
		if(key == "value"){
			this.inputs.filter("[value="+o.value+"]").prop("checked",true);
		}else if(key == "selectItems"){
			this.inputs.remove();
			this.contents.remove();
			this.element.children("label,br").remove();
			this._createControl();
		}else if(key == "orientation"){
			this.inputs.remove();
			this.contents.remove();
			this.element.children("label,br").remove();
			this._createControl();
		}else{
			return $.an.inputfield.prototype._handleChange.apply(this, arguments );
		}
	},
	
	_browser:function(){
		this.contents.css("display","none");
        this.inputs.attr("disabled","disabled");
	},
	
	_edit:function(){
		this.contents.css("display","none");
        this.inputs.removeAttr("disabled");
	},

	_design:function(){
		this.inputs.hide();
		this.contents.css("display","");
	},

	highlight: function(highlight){
		this.element.toggleClass("an-state-hover",highlight);
	},
	
	destroy: function() {
		this.inputs.unbind(".radiofield").remove();
		this.contents.remove();
		this.element.removeClass("an-radiofield" ).children("br").remove();
		$.an.inputfield.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
