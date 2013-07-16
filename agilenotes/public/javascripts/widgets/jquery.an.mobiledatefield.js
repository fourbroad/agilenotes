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
		dateOrder: 'yy mmD dd',
		dateOrder:'yymmdd',
		minDate:'',
		maxDate:'',
	},

	_create: function() {
		$.an.inputfield.prototype._create.apply(this, arguments);
		this.element.addClass("an-mobiledatetimefield");
	},
	
	_edit:function(){
		var minDate,maxDate,self=this,o=this.options;
		var date=new Date(), lng=window.database.local,
		opts={
			//invalid: {  dates: [new Date(2013/07/01), new Date(2014/06/30)],daysOfWeek: [], daysOfMonth: [] },
			theme: o.theme,
			lang: o.lang,
			display: o.display,
			mode: o.mode,
			dateFormat:o.dateFormat,
			dateOrder: o.dateOrder,
		}
		minDate=o.minDate=="now"?date:new Date(o.minDate);
		minDate.toString()!="Invalid Date"&&(opts.minDate=minDate);
		maxDate=o.maxDate=="now"?date:new Date(o.maxDate);
		maxDate.toString()!="Invalid Date"&&(opts.maxDate=maxDate);
		$.an.inputfield.prototype._edit.apply( this, arguments );
		opts.onSelect=function(value){
			self.input.trigger("keyup");
		};
		this.input.mobiscroll().date(opts);
	},
	
	destroy: function() {
		this.input.mobiscroll&&this.input.mobiscroll("destroy");
		this.input.removeAttr("readony");
		this.element.removeClass("an-mobiledatetimefield" );
		return $.an.inputfield.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
