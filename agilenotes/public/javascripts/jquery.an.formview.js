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
	
	_docsLoaded:function(){
		var o = this.options;
		o.currentPage = Math.floor(o.skip/o.limit+1);
		o.totalPage = Math.ceil(o.total/o.limit);
		this._refreshPager();
		this.refresh();
	},

	_refreshPager:function(){
		var self = this, o = this.options;
		if(!o.showPager || o.totalPage <= 1){
			this.element.removeClass("show-pager");
			this.pager && this.pager.remove();
			delete this.pager;
			return this;
		}
		
		if(!this.pager){
			this.pager = $("<div class='pager'/>").appendTo($("<div class='bottom'/>").appendTo(this.element));
			$.each(["first","prev","goto","next","last"], function(k,v){
				if(v == "goto"){
					self.pager.append("<div class='goto-page'><input class='current-page' type='text' value='"+o.currentPage+"'>of<div class='total-page'>"+o.totalPage+"</div></div>");
					self.pager.delegate("input", "change.formview", function(){
						var $this = $(this), p = $(this).val();
						if(p <= 0){
							p = 1;
							$this.val(p);
						}else if(p > o.totalPage){
							p = o.totalPage;
							$this.val(p);
						}
						self.gotopage(p);
					});
				}else{
					$("<button class='pager-button'/>").attr("id",v).appendTo(self.pager).button({
						label: v,
			    		icons: {primary: "ui-icon-"+v+"-page"},
						text:false,
						disabled:true
					}).click(function(e){
						e.preventDefault();
						e.stopImmediatePropagation();
						self[v+"page"]();
					});
				}
			});
		}

		this.pager.find(".pager-button").button("enable");
		if(o.currentPage <= 1){
			this.pager.find("#first").button("disable");
			this.pager.find("#prev").button("disable");
		}else if(o.currentPage >= o.totalPage){
			this.pager.find("#last").button("disable");
			this.pager.find("#next").button("disable");
		}
		this.pager.find("input.current-page").val(o.currentPage);
		this.pager.find(".total-page").html(o.totalPage);
	},

	firstpage:function(e,data){ 
		this.options.skip = 0; 
		this._loadDocs();
	},
	
	prevpage:function(){
		var o = this.options;
		o.skip = o.skip - o.limit;
		this._loadDocs(); 
	},
	
	gotopage:function(page){
		var o = this.options;
		o.skip = (page-1)*o.limit;
		this._loadDocs();
	},
	
	nextpage:function(){
		var o = this.options;
		o.skip = o.skip + o.limit;
		this._loadDocs();
	},
	
	lastpage:function(){
		var o = this.options;
		o.skip = (Math.floor(o.total/o.limit)-1)*o.limit; 
		this._loadDocs();
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
