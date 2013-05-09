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
		skip: 0,
		limit: 10,
		total: 0,
		mode: "browser",
		actionSets:[]
	},
	
	_create: function(){
		var o = this.options, el = this.element;
		el.addClass("an-view").addClass(o.view.name).empty();
		$('<style type="text/css">'+(o.view.stylesheet||"")+'</style>').appendTo(el);
		if(o.view&&o.view.limit) {
			o.limit = o.view.limit = parseInt(o.view.limit);
		}
		$.extend(this, eval("try{("+(o.view.methods||"{}")+")}catch(e){}"));
		var data = {};
		data[this.widgetName] = this;
		$.each(eval("("+(o.view.actions||"[]")+")"), function(k,action){
			el.bind(action.events, data, action.handler);
		});
		
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
	
	refresh:function(){
		var o = this.options;
		this['_'+o.mode]&&this['_'+o.mode]();
	},
	
	reload: function(){
		this._loadDocs();
	},

	_loadDocs:function(){
		var self = this, o = this.options, sel = o.view.selector, filter= o.view.filter,opts = {skip:o.skip,limit:o.limit},selectorStr;
		if(!o.view.showPager||self.widgetName=='gridview'){
			if($.type(o.view.sort)=="string"){
				opts.sort=eval("("+o.view.sort+")");
			}
			if($.type(sel)=="string"){
				sel = eval("("+sel+")");
				if(filter&&filter.replace(/\s/g,"")){
					selectorStr={selector:sel,filter:filter,options:opts};
				}else{
					selectorStr={selector:sel,options:opts};
				}
				$.ans.getDoc(o.dbId,null,selectorStr,function(err,data){
					self.docs = data.docs;
					o.total = data.total;
					self._docsLoaded && self._docsLoaded();
				});
			}
		}else{
			self.pager&&self.pager.reload();
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
