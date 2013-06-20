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

$.widget( "an.customhtmlfield", $.an.field, {


	_create: function() {
		$.an.field.prototype._create.apply(this, arguments);
		this.element.addClass("an-customhtmlfield");
	},	

	_createControl : function() {
		var self = this, o = this.options, el = this.element;
		if (o.mobile) {
			try{
			var cl = this.element.find(".content").eq(0);
			var customhtml = '';
			customhtml += o.customhtml; 
			
			cl.html(customhtml);
			this.element.context.lastElementChild.lastElementChild.className = 'customhtml';
			if($('.customhtml').listview){
				$('.customhtml').listview();
			}
			$.mobile.ajaxEnabled = true;
			}catch (e){}
		} 
		
	},
	
	_createLabel:function(){
		this.element.find('label').remove();
		
	},

	_makeResizable : function() {
	},

	_browser : function() {
		//this.element.find('label').remove();
		//this.input.detach();
		/*var c = this.content;
		if (c.is(".ui-resizable")) c.resizable("destroy");
		c.html(this.options.value + "").css("display", "");*/
	},

	_edit : function() {
		//this.input.detach().val(this.options.value).appendTo(this.content.empty());
	},

	_design : function() {
		//this.input.detach();
		//var self = this, o = this.options, c = this.content;
		//if (c.is(".ui-resizable")) c.resizable("destroy");
		//this.element.find('li').unbind();
		/*c.html(o.value + "").css({ width : o.width, height : o.height, display : "" }).resizable(
			{ stop : function(e, ui) {
				o.width = c.width();
				o.height = c.height();
				$.extend(true, o.metadata[self.widgetName], { width : o.width, height : o.height });
				self._updateMetadata();
				self._trigger("resize", null, { size : ui.size, oldSize : ui.originalSize });
			} });*/
		var self = this;
		//self.content.html(123);
		/*$.get("http://192.168.1.52:8080/page2.html?dbid=519093fbac8f2702b2000002&formid=51abf3e521c7d6005b000069", {}, function(data) {
			console.log(data);
			//self.content.html(data);
		}, 'html');*/
		//console.log(document.body.innerHTML);
		$.ajax({
			  type: "GET",
			  url: "http://192.168.1.52:8080/page2.html?dbid=519093fbac8f2702b2000002&formid=51abf3e521c7d6005b000069",
			  dataType: "html",
			  success:function(data){
				  console.log(data);
				  console.log($(data));
			  }
			});
	},



	/*highlight : function(highlight) {
		(this.options.mode == "edit" ? this.input : this.element).toggleClass("an-state-hover", highlight);
	},*/

	destroy : function() {
		//this.element.unbind(".customhtmlfield").remove();
		this.element.removeClass("an-customhtmlfield");
		return $.an.field.prototype.destroy.apply(this, arguments);
	} });
})( jQuery );
