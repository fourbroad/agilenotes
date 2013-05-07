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

$.widget( "an.passwordfield", $.an.inputfield, {
	_create: function() {
		$.an.inputfield.prototype._create.apply(this, arguments);
		this.element.addClass("an-passwordfield");
	},

	_browser:function(){
		$.an.inputfield.prototype._browser.apply(this, arguments);
		this.content.html("********");
	},
	
	_design:function(){
		this.input.hide();
		var self = this, o = this.options, c = this.content;
		if(c.is(".ui-resizable")) c.resizable("destroy");
		c.html("********").css({width:o.width, height:o.height, display:""}).resizable({
			stop:function(e,ui){
				o.width = c.width();
				o.height = c.height();
				$.extend(true,o.metadata[self.widgetName],{width:o.width,height:o.height});
				self._updateMetadata();
				self._trigger("resize",null, {size:ui.size, oldSize:ui.originalSize});
			}
		});
	},

	destroy: function() {
		this.element.removeClass( "an-passwordfield" );
		$.an.inputfield.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
