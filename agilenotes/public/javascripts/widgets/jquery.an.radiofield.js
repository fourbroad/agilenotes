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
		if (o.mobile) {
			var radio_group = $("<div class='ui-controlgroup-controls' />");
			$.each(o.selectItems||[], function(k,v){
				var radio_elem = $("<div class='ui-radio' />");
				$("<input type='radio'/>").attr({id:o.id+k, name:o.id, value:this.value})
				    .addClass("ui-widget-content").appendTo(radio_elem);
				$("<div class='content'/>").hide().appendTo(el);
				var label = '<span class="ui-btn-inner"><span class="ui-btn-text">' + this.label + '</span> \
					<span class="ui-icon ui-icon-radio-on ui-icon-shadow"> </span>\
					</span>';
				// ui-btn-up-a
				var label_elem = $("<label class='ui-first-child ui-radio-off ui-btn ui-btn-up-c ui-fullsize ui-btn-icon-left' style='margin:0'  />").attr("for",o.id+k);
				if (!o.data_theme) {
					o.data_theme = 'c';
				}
				
				label_elem.addClass("ui-btn-up-" + o.data_theme);
				label_elem.html(label).appendTo(radio_elem);
				radio_elem.appendTo(radio_group);
			});
			
			radio_group.appendTo($("<div class='ui-controlgroup ui-controlgroup-" + o.orientation + "'/>").appendTo(el));
			
			$(".ui-radio").bind('click.radiofield',function(e){
				var name=o.id;
				$(this).find('input[type="radio"][name="'+name+'"]').attr('checked','checked');
				if (o.orientation == "vertical") {
					$(this).removeClass("ui-icon-radio-off").addClass('ui-radio-on').siblings().removeClass('ui-radio-on');
				} else {
					$(this).find(">label").addClass('ui-btn-active').parent().siblings().find(">label").removeClass('ui-btn-active');
				}
			});
			
			this.inputs = el.children(".ui-controlgroup");
		} else {
			$.each(o.selectItems||[], function(k,v){
				$("<input type='radio'/>").attr({id:o.id+k, name:o.id, value:this.value})
				    .addClass("ui-widget-content ui-corner-all").appendTo(el);
				$("<div class='content'/>").hide().appendTo(el);
				$("<label/>").attr("for",o.id+k).html(this.label).appendTo(el);
				if(o.orientation == "vertical") el.append("<br>");
			});
			this.inputs = el.children("input");
		}
		
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
		var o = this.options;
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
		if (!this.options.mobile) {
			this.inputs.hide();
			this.contents.css("display","");
		}
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
