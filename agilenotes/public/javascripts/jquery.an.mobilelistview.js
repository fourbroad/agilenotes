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

$.widget( "an.mobilelistview", $.an.view, {
	options: {
		printable: false,
		pagerPosition: "bottom" // bottom, both sides
	},

	_create: function(){
		$.an.view.prototype._create.apply(this, arguments);

		var o = this.options, el = this.element;
		el.addClass("an-mobilelistbview");
		o.templateTemp = o.view.templateTemp;
		o.templateSelector = o.view.templateSelector;
		o.templateConverts = o.view.templateConverts;
		o.templateContent = o.view.templateContent;
		this.documents = $(o.templateContent).prependTo(el);
				
		if (o.templateTemp) {
			o.templateTemp=$.templates(o.templateTemp);
		}
		
		if(o.templateConverts&&typeof o.templateConverts=='string'){
			o.templateConverts=eval("("+o.templateConverts+")");			
			$.views.converters(o.templateConverts);
		}
	},

	_showDocuments:function(){
		var self = this, o = this.options;
		if (o.templateTemp) {
			var html = o.templateTemp.render(self.docs);
			$(o.templateSelector, this.documents).html(html);
		}
		if($(o.templateSelector).listview){
			$(o.templateSelector).listview();
		}
		if(o.templateConverts&&typeof o.templateConverts=='string'){
			o.templateConverts=eval("("+o.templateConverts+")");			
			$.views.converters(o.templateConverts);
		}
	},
	
	_docsLoaded:function(){
		this.refresh();
	},
	
	_design:function(){
		this._showDocuments();
	},
	
	_browser:function(){
		this._showDocuments();
	},
	
	save:function(){
		var value = {};
		$.extend(this.options.view.options, value);
		return $.an.view.prototype.save.apply(this,arguments);
	},
	
	print: function(){ 
		var o = this.options, loc = window.location, 
		      url = loc.protocol +"//"+loc.host+"/pdfs?dbid="+o.dbId+"&viewid="+o.view._id;
		print(url);
	},
	
	destroy: function() {
		this.element.unbind(".formview").removeClass("an-formview show-pager");
		$.an.view.prototype.destroy.apply(this,arguments);
	}
});
})( jQuery );
