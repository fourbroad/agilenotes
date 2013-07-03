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

$.widget( "an.view", {
	options:{
		mode: "browser",
		actionSets:[]
	},

	_create: function(){
		var o = this.options, el = this.element;
		el.addClass("an-view").addClass(o.view.name).empty();
		$('<style type="text/css">'+(o.view.stylesheet||"")+'</style>').appendTo(el);

		o.limit = o.limit||parseInt(o.view.limit)||10;
		o.skip = o.skip||parseInt(o.view.skip)||0;
		o.total = o.total||parseInt(o.view.total)||0;
		o.filter = o.filter||o.view.filter;
		o.showPager = o.showPager||o.view.showPager;

		try{$.extend(this, eval("("+(o.view.methods||"{}")+")"));}catch(e){console.log(e);};

		var data = {};
		data[this.widgetName] = this;
		$.each(eval("("+(o.view.actions||"[]")+")"), function(k,action){
			el.bind(action.events, data, action.handler);
		});

		o.showPager&&this._createPager();

		this.docs = [];
		this._loadDocs();
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

	_handleChange:function(key,value,oldValue){
		if(key === "mode" || key === "view"){
			this.refresh();
		}
	},

	_createPager:function(){
		var o = this.options,self=this;
		this.pager = $("<div style='display:none;' class='pager'/>").css({
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
					label:$.i18n.pager?$.i18n.pager[v]:v,
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
		o.skip = Math.floor(o.total/o.limit)*o.limit;
		this._loadDocs();
	},

	refresh:function(){
		var o = this.options;
		this['_'+o.mode]&&this['_'+o.mode]();
		this._refreshPager();
	},

	_refreshPager:function(){
		var o = this.options;
		if(this.pager){
			if(o.totalPage <= 1){
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
			var currentNums=o.currentPage==o.totalPage?(o.limit*(o.currentPage-1)+o.total%o.limit):o.limit*o.currentPage,info="";
			if($.i18n.pager){
				info = $.i18n.pager.display.replace(/{total}/,o.total).replace(/{currentPagerFirst}/,(o.limit*(o.currentPage-1)+1)).replace(/{currentPagerLast}/,currentNums);
			}else{
				info = "Displaying "+(o.limit*(o.currentPage-1)+1)+" to "+currentNums+" of "+o.total+" items.";
			}
			this.pager.find(".info").html(info);
		}
	},

	reload: function(){
		this._loadDocs();
	},

	_loadDocs:function(){
		var self = this, o = this.options, sel = o.view.selector, filter= o.filter,opts = {skip:o.skip,limit:o.limit},selectorStr, taskUrl = o.view.taskUrl;

		if($.type(o.view.sort)=="string"){
			opts.sort=eval("("+o.view.sort+")");
		}

        if($.type(taskUrl) == 'string' && taskUrl.replace(/(^\s*)|(\s*$)/g,'') != ''){
            var param = {};
            param.taskFilter = typeof filter == 'string' ? eval("("+filter+")") : filter;
            param.skip = o.skip;
            param.limit = o.limit;
            param.sort = opts.sort || o.view.sort;
            param.options = {exec : true, redirect : true};
            $.ans.getDoc(o.dbId,taskUrl,param,function(err,data){
                self.docs = data.docs;
				try{self._docsLoaded && self._docsLoaded();}catch(e){};
				self._trigger("documentloaded",null,data);
            })
            return;
        }

		if($.type(sel)=="string"){
			sel = eval("("+sel+")");
			if($.type(filter)=="string"){
				selectorStr=filter.replace(/\s/g,"")?{selector:sel,filter:eval("("+filter+")"),options:opts}:{selector:sel,options:opts};
			}else{
				selectorStr=filter?{selector:sel,filter:filter,options:opts}:{selector:sel,options:opts};
			}
			$.ans.getDoc(o.dbId,null,selectorStr,function(err,data){
				self.docs = data.docs;
				o.total = data.total;
				if(self.pager){
					o.currentPage = Math.floor(o.skip/o.limit+1);
					o.totalPage = Math.ceil(o.total/o.limit);
				}
				try{self._docsLoaded && self._docsLoaded();}catch(e){};
				self._trigger("documentloaded",null,data);
			});
		}
	},

	_getRow: function(row){
		return this.docs[row-this.options.skip];
	},

	_delRow: function(row){
		var self = this, o = this.options;
		Model.deleteDocument(o.dbId, this.docs[row-o.skip]._id,null, function(err,result){
			self._loadDocs();
		});
	},

	save:function(){
		var self = this, o = this.options, view = o.view;
		Model.updateDocument(o.dbId, view._id, view, null, function(err,result){
			self.option("isDirty",false);
		});
	},

	destroy: function() {
		this.element.children("style").remove();
		this.element.unbind(".view").empty();
		$.Widget.prototype.destroy.apply(this,arguments);
	}
});
})( jQuery );
