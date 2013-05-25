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
			el.addClass('codiqa-control ui-field-contain ui-body ui-br')
			  .bind("mousedown.checkboxfield",function(e){
				  el.find('label').addClass("ui-btn-down-c");				  
			  }).bind("mouseup.checkboxfield",function(e){
				  el.find('label').removeClass("ui-btn-down-c");
				  if( el.find('input').attr("checked")){
					  el.find('input').attr("checked",false);
					  el.find("span .ui-icon").removeClass("ui-icon-checkbox-on").addClass("ui-icon-checkbox-off");
				  }else{
					  el.find('input').attr("checked",true);
					  el.find("span .ui-icon").removeClass("ui-icon-checkbox-off").addClass("ui-icon-checkbox-on");
				  }
			  }).bind("mousemove.checkboxfield",function(e){
				  el.find('label').removeClass("ui-btn-up-c").addClass("ui-btn-hover-c");
			  }).bind("mouseout.checkboxfield",function(e){
				  el.find('label').removeClass("ui-btn-hover-c").addClass("ui-btn-up-c");
			  });	
			
			this.input = $("<input type='checkbox'/>").attr({name:o.id})
		    .addClass("codiqa-control").bind("change.checkboxfield",function(e){
			var value = self.input.prop("checked"), oldValue = o.value;
			if(value != oldValue){
				o.value = value;
				self._trigger("optionchanged",null,{key:"value", value:value, oldValue:oldValue, isTransient:o.isTransient});
			}
		}).bind("dblclick.checkboxfield",function(e){e.stopImmediatePropagation();});
		}else{
			this.input = $("<input type='checkbox'/>").attr({name:o.id})
			    .addClass("ui-widget-content ui-corner-all").bind("change.checkboxfield",function(e){
				var value = self.input.prop("checked"), oldValue = o.value;
				if(value != oldValue){
					o.value = value;
					self._trigger("optionchanged",null,{key:"value", value:value, oldValue:oldValue, isTransient:o.isTransient});
				}
			}).bind("dblclick.checkboxfield",function(e){e.stopImmediatePropagation();});
		}
		
		
		if(!$.isEmptyObject(o.validate)){
			this.input.addClass($.toJSON({validate:o.validate}));
		}
		this.input.appendTo(this.element);
	},
	
	_makeResizable:function(){},
	
	_createLabel:function(){
		var o = this.options, el = this.element;
		if(o.label){
			if(o.mobile){
				var labelspan = '<span class="ui-btn-inner"><span class="ui-btn-text">' + o.label+ '</span><span class="ui-icon ui-icon-checkbox-off ui-icon-shadow"> </span></span>'; 
				$("<label/>").attr({"for":o.id,"class":"ui-checkbox-off ui-btn ui-btn-corner-all ui-fullsize ui-btn-icon-left ui-first-child ui-last-child ui-btn-up-c"})
							 .html(labelspan).appendTo(el);
			}else{
				$("<label/>").attr("for",o.id).html(o.label).appendTo(el);
			}
		    
		}
	},
	
	_browser:function(){
        this.input.prop('checked', this.options.value).attr("disabled","disabled");
	},
	
	_edit:function(){
        this.input.prop('checked', this.options.value).removeAttr("disabled");
	},
	
	_design:function(){
		this.input.hide();
		this.content.css("display","");
	},
	
	highlight: function(highlight){
		this.element.toggleClass("an-state-hover",highlight);
	},
	
	destroy: function() {
		this.input.unbind(".checkboxfield");
		this.element.removeClass( "an-checkboxfield" );
		return $.an.inputfield.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
