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

$.widget( "an.field", $.an.widget, {
	options:{
	    value:"",
	},

	_create: function() {
		$.an.widget.prototype._create.apply(this, arguments);
		var o = this.options, el = this.element;
		el.addClass("an-field");

		var css = {};
		if(o.width) css.width = o.width;
		if(o.height) css.height = o.height;
		
		this.content.empty();
		if(!$.isEmptyObject(css)){
			this.content.css(css);
		}
		
		o.isTransient = el.attr("transient");
		
		this._createControl();
		this._createLabel();
	},

	_createControl:function(){},
	
	_createLabel:function(){
		var o = this.options, el = this.element;
		if(o.label){
		    $("<label/>").attr("for",o.id).html(o.label).prependTo(el);
		}
	},
	
	destroy: function() {
		this.content.remove();
		this.element.removeClass("an-field").children("label").remove();
		return $.an.widget.prototype.destroy.apply(this, arguments);
	}
});

})( jQuery );
