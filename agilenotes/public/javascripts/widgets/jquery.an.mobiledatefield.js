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

$.widget( "an.mobiledatefield", $.an.inputfield, {
	
	options:{
		theme: 'jqm',
		lang: 'en',
		display: 'bottom',
		mode: 'scroller',
		dateFormat:'yy-mm-dd',
		dateOrder: 'yy mmD dd'
	},

	_create: function() {
		$.an.inputfield.prototype._create.apply(this, arguments);
		this.element.addClass("an-mobiledatetimefield");
	},
	
	_edit:function(){
		var date=new Date(), lng=window.database.local,
		opts={
			//invalid: { daysOfWeek: [0, 6], daysOfMonth: ['5/1', '12/24', '12/25'] },
			theme: this.options.theme,
			lang: this.options.lang,
			display: this.options.display,
			mode: this.options.mode,
			dateFormat:this.options.dateFormat,
			dateOrder: this.options.dateOrder,
		}
		
		$.an.inputfield.prototype._edit.apply( this, arguments );
		this.input.mobiscroll().date(opts);
	},
	
	destroy: function() {
		this.input.mobiscroll("destroy");
		this.input.removeAttr("readony");
		this.element.removeClass("an-mobiledatetimefield" );
		return $.an.inputfield.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
