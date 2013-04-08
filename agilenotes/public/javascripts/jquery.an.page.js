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

$.widget( "an.page", $.an.form, {
	options: {
		printable: false,
		mode:'edit',
		wrapper:"<div/>",
		document:new DocWrapper({})
	},

	_create: function() {
		$.an.form.prototype._create.apply(this, arguments);
		this.element.addClass("an-page");
	},
	
	option: function(key, value) {
		var o = this.options;
		if(key === "page" && value === undefined){
			return o.form;
		}else if(key === "currentForm" && value === undefined){
			return this;
		}
		var ret = $.an.form.prototype.option.apply(this, arguments ); 
		return ret === undefined ? null : ret; // return null not undefined, avoid to return this dom element.
	},

	print: function(){ 
		var o = this.options, loc = window.location, 
		      url = loc.protocol +"//"+loc.host+"/pdfs?dbid="+o.dbId+"&pageid="+o.form._id;
		print(url);
		return this;
	},
	
	destroy: function() {
		this.element.removeClass("an-page");
		return $.an.form.prototype.destroy.apply(this, arguments);
	}
});
})( jQuery );