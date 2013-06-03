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
			var checkbox_group = $("<div class='ui-controlgroup-controls' />");
			checkbox_group.append($("<label />").attr("for", o.id).html(o.label));
			$.each(o.selectItems||[], function(k,v){
				var checkbox_elem = $("<div class='ui-checkbox incheck' />");
				$("<input type='checkbox'/>").attr({id:o.id+k, name:o.id, value:this.value})
				    .addClass("ui-widget-content").appendTo(checkbox_elem);
				$("<div class='content'/>").hide().appendTo(el);
				var label = '<span class="ui-btn-inner"><span class="ui-btn-text">' + this.label + '</span> \
					<span class="ui-icon ui-icon-checkbox-off ui-icon-shadow"> </span>\
					</span>';
				var label_elem = $("<label class=' ui-checkbox-off ui-btn  ui-fullsize ui-btn-icon-left' />").attr("for",o.id+k);
				// ui-btn-up-a
				if(k==0){
					label_elem.addClass("ui-first-child");
				}
				if(k==o.selectItems.length-1){
					label_elem.addClass("ui-last-child");
				}
				
				if (!o.data_theme) {
					o.data_theme = 'c';
				}
				if (o.isMini) {
					label_elem.addClass("ui-mini");
				}
				label_elem.addClass("ui-btn-up-" + o.data_theme);
				label_elem.html(label).appendTo(checkbox_elem);
				checkbox_elem.appendTo(checkbox_group);
				
			});
			
			checkbox_group.appendTo($("<div class='ui-controlgroup ui-corner-all ui-controlgroup-" + o.orientation + "'/>").appendTo(el));
			
			el.find(".incheck").bind("mousedown.checkboxfield",function(e){
				$(this).find("label").addClass("ui-btn-down-" + o.data_theme);				  
			  }).bind("mouseup.checkboxfield",function(e){
				  $(this).find("label").removeClass("ui-btn-down-" + o.data_theme);
			  }).bind("mousemove.checkboxfield",function(e){
				  $(this).find("label").removeClass("ui-btn-up-" + o.data_theme).addClass("ui-btn-hover-" + o.data_theme);
			  }).bind("mouseout.checkboxfield",function(e){
				  $(this).find("label").removeClass("ui-btn-hover-" + o.data_theme).addClass("ui-btn-up-" + o.data_theme);
			  }).bind("click.checkboxfield",function(e){
				  e.stopPropagation();
				  var $input=$(this).find('input');
				  if( $input.attr("checked")){
					  $input.removeAttr("checked");
					  if (o.orientation == "vertical") {
						    $(this).find("label span .ui-icon").removeClass("ui-icon-checkbox-on").addClass("ui-icon-checkbox-off");
						} else {
							$(this).find(">label").removeClass('ui-btn-active');
						}
					  
				  }else{
					  $input.attr("checked","checked");
					  if (o.orientation == "vertical") {
						    $(this).find("label span .ui-icon").removeClass("ui-icon-checkbox-off").addClass("ui-icon-checkbox-on");
						} else {
							$(this).find(">label").addClass('ui-btn-active');
						}
					  
				  }
				  return ;
			  });;
			
			/*$(".ui-checkbox").bind('click.checkboxfield',function(e){
				var name=o.id;
				$(this).find('input[type="checkbox"][name="'+name+'"]').attr('checked','checked');
				if (o.orientation == "vertical") {
					$(this).removeClass("ui-icon-checkbox-off").addClass('ui-checkbox-on').siblings().removeClass('ui-checkbox-on');
				} else {
					$(this).find(">label").addClass('ui-btn-active').parent().siblings().find(">label").removeClass('ui-btn-active');
				}
			});*/
			
			this.input = el.children(".ui-controlgroup");
					
				
			
			/*this.input = $("<input type='checkbox'/>").attr({name:o.id})
		    .addClass("codiqa-control").bind("change.checkboxfield",function(e){
			var value = self.input.prop("checked"), oldValue = o.value;
			if(value != oldValue){
				o.value = value;
				self._trigger("optionchanged",null,{key:"value", value:value, oldValue:oldValue, isTransient:o.isTransient});
			}
		}).bind("dblclick.checkboxfield",function(e){e.stopImmediatePropagation();});*/
			this.contents = el.children(".content");
			if(!$.isEmptyObject(o.validate)){
				this.input.addClass($.toJSON({validate:o.validate}));
			}
			this.input.filter("[value="+o.value+"]").prop("checked",true);
			
			this.input.bind("change.checkboxfield",function(e){
				var value = $(e.target).attr("value"), oldValue = o.value;
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
		}else if(key == "orientation"){
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
        this.input.prop('checked', this.options.value).attr("disabled","disabled");
	},
	
	_edit:function(){
        this.input.prop('checked', this.options.value).removeAttr("disabled");
	},
	
	_design:function(){
		if (this.options.mobile) {
			this.input.find(".incheck").unbind();
		} else {
			this.input.hide();
			this.content.css("display","");
		}
	},
	
	highlight: function(highlight){
		this.element.toggleClass("an-state-hover",highlight);
	},
	
	destroy: function() {
		if(this.options.mobile){
			this.input.unbind(".checkboxfield").remove();
			this.contents.remove();
		}
		this.input.unbind(".checkboxfield");
		this.element.removeClass( "an-checkboxfield" );
		return $.an.inputfield.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
