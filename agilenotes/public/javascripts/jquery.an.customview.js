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

$.widget( "an.customview", $.an.view, {
	options: {
		printable: false,
		pagerPosition: "bottom" // bottom, both sides
	},

	_create: function(){
		$.an.view.prototype._create.apply(this, arguments);
		var o = this.options, el = this.element;
		o.showPager = o.view.showPager;
		o.templateTemp = o.view.templateTemp;
		o.templateSelector = o.view.templateSelector;
		o.templateConverts = o.view.templateConverts;
		o.templateContent = o.view.templateContent;
		el.addClass("an-customview");
		this.documents = $(o.templateContent).appendTo(el);
				
		if (o.templateTemp) {
			o.templateTemp=$.templates(o.templateTemp);
		}
		
		if(o.templateConverts&&typeof o.templateConverts=='string'){
			o.templateConverts=eval("("+o.templateConverts+")");			
			$.views.converters(o.templateConverts);
		}

		if(o.view.showPager){
			el.pager($.extend({
				dbId:o.dbId
			},o.view));
			this.pager=el.data('pager');
			this._loadDocs=function(){
				el.data('pager')._pagerLoadDocs();
			}
		}
	},

	_showDocuments:function(){
		var self = this, o = this.options;
		if (o.templateTemp) {
			var html = o.templateTemp.render(self.docs);
			$(o.templateSelector, this.documents).html(html);
		}
	},
	
	_docsLoaded:function(data){
		if($.isArray(data)){
			this.docs = data;
		}
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
