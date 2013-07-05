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

$.widget( "an.listviewfield", $.an.field, {
	options: {
		mode: "browser",
		value:[]
	},

	_create: function() {
		$.an.field.prototype._create.apply(this, arguments);
		this.element.addClass("an-listviewfield");
	},	

	_createControl : function() {
		var self = this, o = this.options, el = this.element;
		if (o.mobile) {
			var cl = this.element.find(".content").eq(0);
			this.ul_element = $('<ul name="' + o.id + '" data-role="listview" />').appendTo(cl);
			if(o.isInset){
				this.ul_element.attr("data-inset","true");
			}

			if(o.label_theme){
				this.ul_element.attr("data-divider-theme",o.label_theme);
			}
			if(o.data_theme){
				this.ul_element.attr("data-theme",o.data_theme);		
			}
			if(o.splitIcon){
				this.ul_element.attr("data-split-icon",o.splitIcon);
				this.ul_element.attr("data-split-theme","d");
			}
		} 
	},
	
	_createLabel:function(){
	},

	_makeResizable : function() {
	},

	_notify:function(oldValue, value){
		var o = this.options;
		if(value != oldValue){
			o.value = value;
			this._trigger("optionchanged",null,{key:"value", value:value, oldValue:oldValue, isTransient:o.isTransient});
		}
	},
	
	appendValue:function(value) {
		var o = this.options, oldValue = [].concat(o.value);
		o.value.push(value);
		this.refresh();
		this._notify(oldValue, o.value);
	},

	insertValue:function(index, value) {
		var o = this.options, oldValue = [].concat(o.value);
		o.value.splice(index, 1, value);
		this.refresh();
		this._notify(oldValue, o.value);
	},
	
	delValue:function(index) {
		var o = this.options, oldValue = [].concat(o.value);
		o.value.splice(index, 1);
		this.refresh();
		this._notify(oldValue, o.value);
	},
	
	getValue:function(index) {
		var o = this.options;
		return o.value[index];
	},
	
	replaceValue:function(index, value) {
		var o = this.options, oldValue = [].concat(o.value);
		o.value[index] = value;
		this.refresh();
		this._notify(oldValue, o.value);
	},

	_browser : function() {
		var o = this.options,button_li="";
		this.ul_element.empty();
		o.value=[];
		$.each(o.selectItems||[], function(k,v){
			o.value.push(o.selectItems[k].value);
			button_li += "<li><a>"+this.label+"</a></li>";							
		});
		if(o.label){
			this.ul_element.append('<li data-role="list-divider"><a>' + o.label + '</a></li>');
		}
		this.ul_element.append(button_li);
		this.ul_element.listview();
		this.ul_element.data("mobileListview").refresh();
	},

	_edit : function() {
		var o = this.options,button_li="";
		this.ul_element.empty();
		o.value=[];
		$.each(o.selectItems||[], function(k,v){
			o.value.push(o.selectItems[k].value);
			if(o.splitIcon){
				button_li += "<li><a>"+this.label+"</a><a href=\"javascript:;\">"+o.splitText+"</a></li>";
			}else{
				button_li += "<li><a>"+this.label+"</a></li>";	
			}
		});
		if(o.value.length>0)this._trigger("optionchanged",null,{key:"value", value:o.value, oldValue:[], isTransient:o.isTransient});
		if(o.label){
			this.ul_element.append('<li data-role="list-divider"><a>' + o.label + '</a></li>');
		}
		
		this.ul_element.append(button_li);
		if(this.ul_element.listview){
			this.ul_element.listview();
			this.ul_element.data("mobileListview").refresh();
		}
	},

	_design : function() {
		//this.input.detach();
		var self = this, o = this.options, cl = this.content;
	
		if (cl.is(".ui-resizable")) c.resizable("destroy");
		cl.html('');
			var ul_element = $('<ul />').addClass('codiqa-control ui-listview').appendTo(cl);
			if(!o.label_theme){
				o.label_theme='c';
			}
			if(o.label){
				ul_element.html('<li data-role="list-divider"><a>' + o.label + '</a></li>');
			}
			var label_li = $('<li />').addClass('ui-li ui-li-divider ui-bar-' + o.label_theme + ' ui-first-child').html(o.label).appendTo(ul_element);
			$.each(o.selectItems||[], function(k,v){
				button_li = $("<li class='ui-btn ui-btn-icon-right ui-li-has-arrow ui-li' />").appendTo(ul_element);				
				$('<div class="ui-btn-inner ui-li" />').html('<div class="ui-btn-text"><a class="ui-link-inherit" >' + this.label + '</a></div><span class="ui-icon ui-icon-arrow-r ui-icon-shadow"> </span>')
														.appendTo(button_li);
														
				if(k==o.selectItems.length-1){
					button_li.addClass("ui-last-child");
				}
				
				if (o.isInset) {
					ul_element.addClass("ui-listview-inset ui-corner-all ui-shadow");
				}
				button_li.addClass("ui-btn-up-" + o.data_theme);
				
				
			});						
		
	},



	/*highlight : function(highlight) {
		(this.options.mode == "edit" ? this.input : this.element).toggleClass("an-state-hover", highlight);
	},*/

	destroy : function() {
		//this.element.unbind(".listviewfield").remove();
		this.element.removeClass("an-listviewfield");
		return $.an.field.prototype.destroy.apply(this, arguments);
	} });
})( jQuery );
