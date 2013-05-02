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

$.widget( "an.formview", $.an.view, {
	options: {
		printable: false,
		pagerPosition: "bottom", // bottom, both sides
		itemWidth: 320,
		itemHeight: 280
	},

	_create: function(){
		$.an.view.prototype._create.apply(this, arguments);
		var o = this.options, el = this.element;
		o.showPager = o.view.showPager;
		o.itemWidth = o.view.itemWidth;
		o.itemHeight = o.view.itemHeight;
		el.addClass("an-formview");
		this.documents = $("<div class='content'/>").appendTo(el);
		
		if(o.view.showPager){
			if(el.data('pager')){
				el.data('pager').destroy();	
			}
			el.pager($.extend({
				dbId:o.dbId
			},o.view));
			this.pager=el.data('pager');
			this._loadDocs=function(){
				el.data('pager').reload();
			}
		}
	},

	_showDocuments:function(){
		var self = this, o = this.options;
		this.documents.empty();
		var oFragment = document.createDocumentFragment();
		$.each(this.docs, function(k,doc){
			var ed = $("<div class='grid-item'/>").css({width:o.itemWidth, height:o.itemHeight});
			oFragment.appendChild(ed[0]);
			ed.editor({ dbId:o.dbId, document: doc, forms:[o.form],readOnly:true });
		});
		self.documents[0].appendChild(oFragment);
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
		var self = this, value = {};
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
