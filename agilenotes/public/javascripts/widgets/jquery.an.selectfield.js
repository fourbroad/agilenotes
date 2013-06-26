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
		nativeMenu:true
	},

	_create: function() {
		$.an.field.prototype._create.apply(this, arguments);
		this.element.addClass("an-selectfield");
	},
	
	_createControl:function(){
		var self = this, o = this.options;
		var sel = this.select = $("<select />").attr("name",o.id);
		if(!o.mobile){			
			$("<option/>").attr("value","").html("").appendTo(sel);
		}
		$.each(o.selectItems||[], function(){
			$("<option/>").attr("value",this.value).html(this.label).appendTo(sel);
		});
		sel.bind("change.selectfield", function(e){
			e.preventDefault();
			e.stopImmediatePropagation();
			var value = sel.val(), oldValue = o.value;
			if(value != oldValue){
				o.value = value;
				self._trigger("optionchanged",null,{key:"value", value:value, oldValue:oldValue, isTransient:o.isTransient});
			}
		});
		
		if(!$.isEmptyObject(o.validate)){
			sel.addClass($.toJSON({validate:o.validate}));
		}
		
	},
	
	_makeResizable:function(){},
	
	_browser:function(){
		var self = this, o = this.options;
		
		if(o.mobile){
			this.select.detach().val(this.options.value).appendTo(this.content.empty());
			var  option = {};
			option.icon = 'arrow-r';
			if(o.corners){
				option.conrners = false;
			}
			if(o.icon){
				option.icon = o.icon;
			}
			if(o.iconpos){
				option.iconpos = o.iconpos;
			}
			if(o.iconshadow){
				option.iconshadow = false;
			}
			if(o.inline){
				option.inline = true;
			}
			if(o.mini){
				option.mini = true;
			}
			if(o.nativeMenu){
				option.nativeMenu = false;
			}
			if(o.overlayTheme){
				option.overlayTheme = o.overlayTheme;
			}
			if(o.preventFocusZoom){
				option.preventFocusZoom = false;
			}
			if(o.shadow){
				option.shadow = false;
			}
			if(o.theme){
				option.theme = o.theme;
			}
			if($('select[name=' + o.id + ']').selectmenu){
				$('select[name=' + o.id + ']').selectmenu(option);
			}
		}else{
			this.select.detach();
			$.each(o.selectItems, function(){
				if(this.value == o.value){
					self.content.html(this.label).show();
					return false;
				}
			});
		}
	},
	
	_edit:function(){
		var o = this.options;
		if(o.mobile){
			if(!o.value&&o.selectItems[0])o.value=o.selectItems[0].value;
		}
		this.select.detach().val(this.options.value).appendTo(this.content.empty());
		this._trigger("optionchanged",null,{key:"value", value:o.value, oldValue:"", isTransient:o.isTransient});
		if(o.mobile){			
			var  option = {};
			option.icon = 'arrow-r';
			if(o.corners){
				option.conrners = false;
			}
			if(o.icon){
				option.icon = o.icon;
			}
			if(o.iconpos){
				option.iconpos = o.iconpos;
			}
			if(o.iconshadow){
				option.iconshadow = false;
			}
			if(o.inline){
				option.inline = true;
			}
			if(o.mini){
				option.mini = true;
			}
			if(o.nativeMenu){
				option.nativeMenu = false;
			}
			if(o.overlayTheme){
				option.overlayTheme = o.overlayTheme;
			}
			if(o.preventFocusZoom){
				option.preventFocusZoom = false;
			}
			if(o.shadow){
				option.shadow = false;
			}
			if(o.theme){
				option.theme = o.theme;
			}
			this.select.selectmenu(option);
		}
	},
	
	_design:function(){
		this.select.detach();

		var self = this, o = this.options, c = this.content;
		if(o.mobile){
			c.html('<div class="ui-select">\
					<a class="ui-btn ui-shadow ui-btn-corner-all ui-btn-icon-right ui-btn-up-c">\
					<span class="ui-btn-inner">\
					<span class="ui-btn-text"><span>' + o.selectItems[0].label + '</span></span><span class="ui-icon ui-icon-arrow-d ui-icon-shadow">&nbsp;</span></span></a>\
					<select>\
					  </select>\
					    </div>');
		}else{
		if(c.is(".ui-resizable")) c.resizable("destroy");
		$.each(o.selectItems, function(){
			if(this.value == o.value){
				c.html(this.label);
				return false;
			}
		});
		c.css({width:o.width, height:o.height}).resizable({
			stop:function(e,ui){
				o.width = c.width();
				o.height = c.height();
				$.extend(true,o.metadata[self.widgetName],{width:o.width,height:o.height});
				self._updateMetadata();
				self._trigger("resize",null, {size:ui.size, oldSize:ui.originalSize});
			}
		});
		}
	},
	
	_handleChange:function(key, value, oldValue){
		if(key === "label"){
			this.element.children("label").remove();
			this._createLabel();
		}else if(key == "selectItems"){
			this.select.remove();
			this._createControl();
		}else if(this.options.mobile){
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
