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

$.widget( "an.pager", {
	options:{
		skip: 0,
		limit: 10,
		totalPage: 0,
		currentPage:0,
		selector:'',
		className:'',
		showInfo:false,
		pagerHeight: 28
	},
	
	_create: function(){
		var o = this.options,self=this;

		this.pager = $("<div class='pager'/>").css({
			left:0,right:0,bottom:0,height:o.pagerHeight
		}).appendTo(this.element);
		this.pager.addClass(o.className);
		$.each(["first","prev","goto","next","last"], function(k,v){
			if(v == "goto"){
				self.pager.append("<div class='goto-page'>Page<input class='current-page' type='text' value='"+o.currentPage+"'>of<div class='total-page'>"+o.totalPage+"</div></div>");
				self.pager.delegate("input", "change.pager", function(){
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

		this.pager.append("<div class='info'>");
		this._pagerLoadDocs();
	},

	option: function(key, value) {
		var ret = $.Widget.prototype.option.apply(this, arguments ); 
		return ret === undefined ? null : ret; // return null not undefined, avoid to return this dom element.
	},

	_setOption: function(key, value){
		var oldValue = this.options[key];
		if(!equals(value,oldValue)){
			$.Widget.prototype._setOption.apply(this, arguments );
			this._handleChange && this._handleChange(key,value,oldValue);
			this._trigger("optionchanged",null,{key:key,value:value,oldValue:oldValue});
		}
		return this;
	},
	
	_refresh:function(){
		var o = this.options;
		if(!o.showPager || o.totalPage <= 1){
			this.pager.hide();
			return this;
		}
		this.pager.show();
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
		o.showInfo&&this.pager.find(".info").html("Displaying "+(o.limit*(o.currentPage-1)+1)+" to "+o.limit*o.currentPage+" of "+o.total+" items.");
	},
	reload:function(){
		this._pagerLoadDocs();
	},

	firstpage:function(e,data){ 
		this.options.skip = 0; 
		this._pagerLoadDocs();
	},
	
	prevpage:function(){
		var o = this.options;
		o.skip = o.skip - o.limit;
		this._pagerLoadDocs(); 
	},
	
	gotopage:function(page){
		var o = this.options;
		o.skip = (page-1)*o.limit;
		this._pagerLoadDocs();
	},
	
	nextpage:function(){
		var o = this.options;
		o.skip = o.skip + o.limit;
		this._pagerLoadDocs();
	},
	
	lastpage:function(){
		var o = this.options;
		o.skip = Math.floor(o.total/o.limit)*o.limit; 
		this._pagerLoadDocs();
	},

	_pagerLoadDocs:function(){
		var self = this, o = this.options, sel = o.selector, opts = {skip:o.skip,limit:o.limit};
		if($.type(o.sort)=="string"){
			opts.sort=eval("("+o.sort+")");
		}
		if($.type(sel)=="string"){
			sel = eval("("+sel+")");
			$.ans.getDoc(o.dbId,null,{selector:sel, options:opts},function(err,data){
				var obj=self.element.data();
				for(var q in obj){
					if(/view/.test(obj[q]['widgetName'])){
						obj[q]._docsLoaded(data.docs);
						break;
					}
				}
				o.total = data.total;
				o.currentPage = Math.floor(o.skip/o.limit+1);
				o.totalPage = Math.ceil(o.total/o.limit);
				self._refresh();
			});
		}
	},
	
	destroy: function() {
		this.element.removeClass("show-pager");
		this.pager && this.pager.remove();
		delete this.pager;
		$.Widget.prototype.destroy.apply(this,arguments);
	}
});
})( jQuery );
