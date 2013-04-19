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

$.widget( "an.gridview", $.an.view, {
	options: {
		printable: false
	},

	_create: function(){
		$.an.view.prototype._create.apply(this, arguments);
		this.element.addClass("an-gridview");
		var self = this, o = this.options;
		o.showPager = o.view.showPager;
		if(o.view.cellRender) o.cellRender = eval("("+o.view.cellRender+")");
		this.element.agilegrid($.extend({
			rowOffset: o.skip,
			showPager: o.showPager,
			dbId:o.dbId,
			leftHeaderRender: function(row){return row+1;},
			cellRender: function(row, col){
				var value = "", r = self._getRow(row), cm = this.colModel, c = cm[col];
				if(o.cellRender){
					value = o.cellRender(row,col,doc,cm);
				}else{
					if( r && c) { value =  eval("try{r['"+c.name+"']}catch(e){}"); }
				}
				return value?value+"":"";
			},
			firstpage:function(e,data){ o.skip = 0; self._loadDocs();	},
			prevpage:function(e, data){ o.skip = o.skip - o.limit; self._loadDocs(); },
			gotopage:function(e,data){ o.skip = (data.page-1)*o.limit; self._loadDocs(); },
			nextpage:function(e,data){ o.skip = o.skip + o.limit; self._loadDocs(); },
			lastpage:function(e,data){ o.skip = (Math.floor(o.total/o.limit)-1)*o.limit; self._loadDocs(); },
			celldblclick:function(e,data){ self._trigger("docdblclick", e, self.docs[data.row-o.skip]); },
			cellclick:function(e,data){ self._trigger("docclick", e, self.docs[data.row-o.skip]); },
			contentActions:function(row,col){ return o.contentActions(self.docs[row-o.skip]);},
			optionchanged:function(e,data){if(data.key == "colModel" && o.mode == "design") self.option("isDirty", true);}
		},o.view.options));
		
		this.refresh();
	},

	_docsLoaded:function(){
		var o = this.options, rc = this.docs.length;
		this.element.agilegrid({
			currentPage: Math.floor(o.skip/o.limit+1),
			totalPage: Math.ceil(o.total/o.limit),
			rowOffset: o.skip,
			rowCount: rc,
			totalRowCount: o.total
		});
	},
	
	_design:function(){
		this.element.agilegrid({
			columnEditable:true,
			isColumnResizable:true,
			isRowResizable:true
		});		
	},
	
	_browser:function(){
		this.element.agilegrid($.extend({
			columnEditable:false,
			isColumnResizable:false,
			isRowResizable:false
		},this.options.view.options));		
	},
	
	save:function(){
		$.extend(this.options.view.options, this._viewOptions());
		return $.an.view.prototype.save.apply(this,arguments);
	},
	
	option: function(key, value) {
		if(key === "viewOptions" && value===undefined){
			return this._viewOptions();
		}
		return $.an.view.prototype.option.apply(this, arguments);
	},
	
	_viewOptions:function(){
		var self = this, value = {};
		$.each(["showTopHeader","showLeftHeader","isColumnResizable",
		        "isRowResizable","topHeaderHeight","leftHeaderWidth","defaultColWidth",
		        "defaultRowHeight","colModel","rowModel","totalColCount"],function(k,v){
			value[v] = self.element.agilegrid("option",v);
		});
		return value;
	},
	
	print: function(){ 
		var o = this.options, loc = window.location, 
		      url = loc.protocol +"//"+loc.host+"/pdfs?dbid="+o.dbId+"&viewid="+o.view._id;
		print(url);
	},
	
	destroy: function() {
		this.element.agilegrid("destroy").unbind(".gridview").removeClass("an-gridview");
		$.an.view.prototype.destroy.apply(this,arguments);
	}
});
})( jQuery );
