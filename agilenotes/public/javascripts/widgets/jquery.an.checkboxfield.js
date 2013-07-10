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

$.widget( "an.checkboxfield", $.an.inputfield, {
	_create: function() {
		$.an.inputfield.prototype._create.apply(this, arguments);
		this.element.addClass("an-checkboxfield");
		this.content.hide();

		
	},

	_createControl:function(){
		var self = this, o = this.options, el = this.element;
		if(o.mobile){
			var elementoptions = {};

			if(o.selectItems.length>1){				
				var checks_group = $("<fieldset data-role='controlgroup' />").appendTo(this.content);
				if(o.orientation == "horizontal"){
					checks_group.attr({"data-type":"horizontal"});
				}
				$.each(o.selectItems||[], function(k,v){
					this.input = $("<input type='checkbox'/>").attr({id:o.id+k, name:o.id+k, value:this.value}).appendTo(checks_group);
					$("<label />").attr({for:o.id+k}).html(this.label).appendTo(checks_group);
				});
				
			}else{
				$.each(o.selectItems||[], function(k,v){
					this.input = $("<input type='checkbox'/>").attr({id:o.id, name:o.id, value:this.value}).addClass("custom").appendTo(this.content);
					$("<label  />").attr({for:o.id}).html(this.label).appendTo(this.content);
				});
			}
			if (!o.data_theme) {
					o.data_theme = 'c';
				}
			elementoptions.theme = o.data_theme;
			if (o.isMini) {
				elementoptions.mini = true;
			}
			if($("input[type='checkbox']").checkboxradio){
				$("input[type='checkbox']").checkboxradio(elementoptions);
				$("fieldset[data-role='controlgroup']").controlgroup();
			}
			
						
		}else{
			this.input = $("<input type='checkbox'/>").attr({name:o.id})
			    .addClass("ui-widget-content ui-corner-all").bind("change.checkboxfield",function(e){
				var value = self.input.prop("checked"), oldValue = o.value;
				if(value != oldValue){
					o.value = value;
					self._trigger("optionchanged",null,{key:"value", value:value, oldValue:oldValue, isTransient:o.isTransient});
				}
			}).bind("dblclick.checkboxfield",function(e){e.stopImmediatePropagation();});
			if(!$.isEmptyObject(o.validate)){
				this.input.addClass($.toJSON({validate:o.validate}));
			}
			this.input.appendTo(this.element);
		}				
	},
	
	_handleChange:function(key, value, oldValue){
		var o = this.options;
			if(key == "value"){
				this.input.filter("[value="+o.value+"]").prop("checked",true);
			}else if(key == "selectItems"){
				this.input.remove();
				this.contents.remove();
				this.element.children("label,br").remove();
				this._createControl();
			}else{
				return $.an.inputfield.prototype._handleChange.apply(this, arguments );
			}
		
	},
	
	_makeResizable:function(){},
	
	_createLabel:function(){
		var o = this.options, el = this.element;
		if(o.label){
			if(!o.mobile){
				$("<label/>").attr("for",o.id).html(o.label).appendTo(el);
			}
		    
		}
	},
	
	_browser:function(){
		if(!this.options.mobile){
			this.input.prop('checked', this.options.value).attr("disabled","disabled");
		}else{
			this.content.css("display","");
		}
	},
	
	_edit:function(){
		if(!this.options.mobile){
			this.input.prop('checked', this.options.value).removeAttr("disabled");
		}else{
			this.content.css("display","");
		}
	},
	
	_design:function(){
		var o = this.options,c = this.content;
		if (o.mobile) {
			if (!o.data_theme) {
					o.data_theme = 'c';
				}
			c.html("");
			if(o.selectItems.length>1){
				var fildset = $("<fieldset class='ui-corner-all ui-controlgroup' />").appendTo(c);
				if(o.orientation=="horizontal"){
					fildset.addClass("ui-controlgroup-horizontal");
				}
				var group = $("<div class='ui-controlgroup-controls' />").appendTo(fildset);
				$.each(o.selectItems||[], function(k,v){
					var divcheckbox = $("<div class='ui-checkbox' />").html('<input type="checkbox" id="'+o.id+k+'" name="'+o.id+k+'" value="'+v+'">').appendTo(group);
					var labelcheckbox = $("<label class='ui-checkbox-off ui-btn ui-btn-corner-all ui-fullsize ui-btn-icon-left ui-btn-up-"+o.data_theme+"' />").html('<span class="ui-btn-inner"><span class="ui-btn-text">'+this.label+'</span><span class="ui-icon ui-icon-checkbox-off ui-icon-shadow">&nbsp;</span></span>').appendTo(divcheckbox); 
					if(k==0){
						labelcheckbox.addClass("ui-first-child");
					}
					if(k==o.selectItems.length-1){
						labelcheckbox.addClass("ui-last-child");
					}
				});
			}else{
				$.each(o.selectItems||[], function(k,v){
				$("<div class='ui-checkbox' />").html('<input type="checkbox" id="'+o.id+k+'" name="'+o.id+k+'" value="'+v+'"><label for="1230" class="ui-checkbox-off ui-btn ui-btn-corner-all ui-fullsize ui-btn-icon-left ui-btn-up-'+o.data_theme+'"><span class="ui-btn-inner"><span class="ui-btn-text">'+this.label+'</span><span class="ui-icon ui-icon-checkbox-off ui-icon-shadow">&nbsp;</span></span></label>').appendTo(c);
			});
			}
			
		this.content.css("display","");
		} else {
			this.input.hide();
			this.content.css("display","");
		}
	},
	
	highlight: function(highlight){
		this.element.toggleClass("an-state-hover",highlight);
	},
	
	destroy: function() {
		if(!this.options.mobile){
			this.input.unbind(".checkboxfield");
		}
		this.element.removeClass( "an-checkboxfield" );
		return $.an.inputfield.prototype.destroy.apply( this, arguments );
		
	}
});
})( jQuery );
