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

$.widget( "an.agilegrid", {
	options:{
		selectionMode:"row",
		showTopHeader: true,
		showLeftHeader: true,
		isColumnResizable: false,
		isRowResizable: false,
		topHeaderHeight: 28,
		leftHeaderWidth: 50,
		defaultColWidth: 80,
		defaultRowHeight: 28,
		cellSelections: [],
		colSelections: {},
		rowSelections: {},
		focus: {row:0,col:0},
		pagerHeight: 28,
		currentPage: 0,
		totalPage: 0,
		colModel: {},
		rowModel: {},
		rowOffset: 0,
		limit: 30,
		rowCount: 0,
		totalRowCount: 0,
		totalColCount: 3,
		topHeaderRender: function(col, colProp){return colProp && colProp.label ? colProp.label : col;},
		leftHeaderRender: function(row){return row;},
		cellRender: function(row, col){ return row + "," + col; }
	},

	_create: function() {
		this.element.addClass("an-agilegrid").empty();
		var self = this, o = this.options;

		if(o.showLeftHeader && o.showTopHeader){
			this.topLeftCorner = $("<div class='top-left ui-widget-header'/>").css({
				left:0, top: 0, width: o.leftHeaderWidth, height: o.topHeaderHeight
			}).appendTo(this.element);
		}

		if(o.showTopHeader){
			this.topHeaderTable =$("<table cellspacing='0' cellpadding='0'><thead><tr/></thead></table>");
			this.topHeaderArea = $("<div class='top-header ui-widget-header'/>").css({
				left:o.showLeftHeader ? o.leftHeaderWidth + 1 : 0,  top: 0,
				right: 0, height: o.topHeaderHeight + 1
			}).append(this.topHeaderTable).appendTo(this.element).disableSelection();
		}
		
		if(o.showLeftHeader){
			this.leftHeaderTable =$("<table cellspacing='0' cellpadding='0'><thead></thead></table>");
			this.leftHeaderArea = $("<div class='left-header ui-widget-header'/>").css({
				left: 0, top: o.showTopHeader ? o.topHeaderHeight + 1 : 0,
				bottom: o.showPager?o.pagerHeight: 0, width: o.leftHeaderWidth + 1
			}).append(this.leftHeaderTable).appendTo(this.element).disableSelection();
		}

		this.contentArea = $("<div class='content-area'/>").css({
			left: o.showLeftHeader ? o.leftHeaderWidth + 1 : 0,
			top: o.showTopHeader ? o.topHeaderHeight + 1 : 0,
			bottom: o.showPager?o.pagerHeight: 0, right: 0
		}).appendTo(this.element).disableSelection();
	    this.contentTable=$("<table class='content' cellspacing='0' cellpadding='0'><tbody/></table>").appendTo(this.contentArea);

		if(o.showPager){
			this.pager = $("<div class='pager ui-widget-header'/>").css({
				left:0,right:0,bottom:0,height:o.pagerHeight
			}).appendTo(this.element);
			$.each(["first","prev","goto","next","last"], function(k,v){
				if(v == "goto"){
					self.pager.append("<div class='goto-page'>Page<input class='current-page' type='text' value='"+o.currentPage+"'>of<div class='total-page'>"+o.totalPage+"</div></div>");
					self.pager.delegate("input", "change.agilegrid", function(){
						var $this = $(this), p = $(this).val();
						if(p <= 0){
							p = 1;
							$this.val(p);
						}else if(p > o.totalPage){
							p = o.totalPage;
							$this.val(p);
						}
						self._trigger("gotopage",null,{page:p});
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
						self._trigger(v+"page",null,{currentPage:o.currentPage});
					});
				}
			});
			this.pager.append("<div class='info'>");
		}
		
		this.contentArea.scroll(function(){
			var pos = self.contentTable.position();
			if(o.showTopHeader) self.topHeaderTable.css("left", pos.left);
			if(o.showLeftHeader) 	self.leftHeaderTable.css("top", pos.top);
		});

		this.element.delegate(".top-header th>div","hover.agilegrid",function(e){
			if(o.isColumnResizable){
				$(this).resizable({
					handles: "e",
					resize: function(event, ui){
						self._columnWidth(parseInt(ui.element.parent().attr("index")), ui.size.width);
					}
				});
			} 
		}).delegate(".left-header th>div","hover.agilegrid",function(e){
			if(o.isRowResizable){
				$(this).resizable({
					handles: "s",
					resize: function(event, ui){
						self._rowHeight(o.rowOffset, parseInt(ui.element.parent().attr("index")), ui.size.height);
					}
				});
			}
		}).delegate(".top-header th","mousedown.agilegrid",function(e){
			if(o.selectionMode == "row") return;
			var col = parseInt($(this).attr("index"));
			if(e.ctrlKey){
				if(o.colSelections[col]){
					delete o.colSelections[col];
				}else{
					o.colSelections[col] = true;
				}
				self.contentTable.find("td[colindex="+col+"]")
				    .toggleClass("selected", o.colSelections[col]==true ? true: false);
				o.focus = $.extend(o.focus, {col: col});
			}else if(e.shiftKey){
				var colStart = Math.min(o.focus.col, col), colEnd = Math.max(o.focus.col, col);
				self.clearSelection();
				for(var i = colStart; i<=colEnd; i++){
					o.colSelections[i]=true;
					self.contentTable.find("td[colindex="+i+"]").addClass("selected");
				}
			}else{
				self.clearSelection();
				o.focus = $.extend(o.focus, {col:col});
				o.colSelections[col]=true;
				self.contentTable.find("td[colindex="+col+"]").addClass("selected");
				o.focus = $.extend(o.focus, {col: col});
			}
			self.mouseDownTopHeader = true;
		}).delegate(".top-header th","mousemove.agilegrid", function(e){
			if(self.mouseDownTopHeader){
				var col = parseInt($(this).attr("index")), colStart = Math.min(o.focus.col, col), 
				    colEnd = Math.max(o.focus.col, col);
				if(!e.ctrlKey) self.clearSelection();
				for(var i = colStart; i<=colEnd; i++){
					o.colSelections[i]=true;
					self.contentTable.find("td[colindex="+col+"]").addClass("selected");
				}
			}
		}).delegate(".left-header th","mousedown.agilegrid",function(e){
			if(o.selectionMode == "column") return;
			var rowIndex = parseInt($(this).attr("index")), row = o.rowOffset+rowIndex;
			if(e.ctrlKey){
				if(o.rowSelections[row]){
					delete o.rowSelections[row];
				}else{
					o.rowSelections[row] = true;
				}
				self.contentTable.find("tr[rowindex="+rowIndex+"]")
				    .toggleClass("selected", o.rowSelections[row]==true ? true: false);
				o.focus = $.extend(o.focus, {row: row});
			}else if(e.shiftKey){
				var rowStart = Math.min(o.focus.row, row), rowEnd = Math.max(o.focus.row, row);
				self.clearSelection();
				for(var i = rowStart; i<=rowEnd; i++){
					o.rowSelections[i]=true;
					self.contentTable.find("tr[rowindex="+(i-o.rowOffset)+"]").addClass("selected");
				}
			}else{
				self.clearSelection();
				o.focus = $.extend(o.focus, {row:row});
				o.rowSelections[row]=true;
				self.contentTable.find("tr[rowindex="+rowIndex+"]").addClass("selected");
				o.focus = $.extend(o.focus, {row: row});
			}
			self.mouseDownLeftHeader = true;
		}).delegate(".left-header th","mousemove.agilegrid", function(e){
			if(self.mouseDownLeftHeader){
				var rowIndex = parseInt($(this).attr("index")), row = o.rowOffset+rowIndex,
                      rowStart = Math.min(o.focus.row, row), rowEnd = Math.max(o.focus.row, row);
				if(!e.ctrlKey) self.clearSelection();
				for(var i = rowStart; i<=rowEnd; i++){
					o.rowSelections[i]=true;
					self.contentTable.find("tr[rowindex="+(i-o.rowOffset)+"]").addClass("selected");
				}
			}
		}).delegate(".content td","mousedown.agilegrid", function(e){
			var $this = $(this), rowIndex = parseInt($this.attr("rowindex")), 
			    colIndex = parseInt($this.attr("colindex")), row = o.rowOffset+rowIndex, col = colIndex;
			self.select(row,col,e.ctrlKey?"ctrl":(e.shiftKey?"shift":null));
			self.mouseDownContent = true;
		}).delegate(".content td","mousemove.agilegrid", function(e){
			if(self.mouseDownContent){
				var $this = $(this), rowIndex = parseInt($this.attr("rowindex")), 
				    colIndex = parseInt($this.attr("colindex")), row = o.rowOffset+rowIndex, col = colIndex;
				if(!e.ctrlKey) self.clearSelection();
				if(o.selectionMode == "row"){
					var rowStart = Math.min(o.focus.row, row), rowEnd = Math.max(o.focus.row, row);
					for(var i = rowStart; i<=rowEnd; i++){
						o.rowSelections[i]=true;
						self.contentTable.find("tr[rowindex="+(i-o.rowOffset)+"]").addClass("selected");
					}
				}else if(o.selectionMode == "column"){
					var colStart = Math.min(o.focus.col, col), colEnd = Math.max(o.focus.col, col);
					for(var i = colStart; i<=colEnd; i++){
						o.colSelections[i]=true;
						self.contentTable.find("td[colindex="+i+"]").addClass("selected");
					}
				}else{
					var rowStart = Math.min(o.focus.row, row), rowEnd = Math.max(o.focus.row, row),
					      colStart = Math.min(o.focus.col, col), colEnd = Math.max(o.focus.col, col);
					for(var row = rowStart; row<=rowEnd; row++){
						if(!o.cellSelections[row]) o.cellSelections[row] = []; 
						for(var col = colStart; col<=colEnd; col++){
							o.cellSelections[row][col]=true;
							self.contentTable.find("td[rowindex="+(row-o.rowOffset)+"][colindex="+col+"]").addClass("selected");
						}
					}
				}
			}
		}).delegate(".content td","dblclick.agilegrid click.agilegrid", function(e){
			var $this = $(this), rowIndex = parseInt($this.attr("rowindex")), colIndex = parseInt($this.attr("colindex"));
			self._trigger(e.type == "dblclick"? "celldblclick": "cellclick", e,{row:o.rowOffset+rowIndex, column:colIndex});
	    });

		o.topHeaderActions = o.topHeaderActions || function(colModel, col){
			var actions = {};
			actions["hide"] = {type: "menuItem",text: "Hide",handler: function(){self.hideColumn(col);}};
			if(o.columnEditable){
				actions["add"] = {type: "menuItem",text: "Add",handler: function(){self.editColumn(col,"add");}};
				actions["edit"] = {type: "menuItem",	text: "Edit",	handler: function(){self.editColumn(col);}};
				actions["del"] = {type: "menuItem",text: "Delete",handler: function(){self.removeColumn(col);}};
			}
			
			if(!$.isEmptyObject(colModel)){
				var colActions = {};
				$.each(colModel, function(k,v){
					colActions[v.name]={
							name: v.name,
							type: "checkbox",
							text: v.label,
							checked: !v.hide,
							handler: function(e,checked){
								var count = self.option("visibleColCount");
								if(count <= 1 && !checked){
									$(e.target).prop("checked", true);
								}else{
									self[checked?"showColumn":"hideColumn"](k);
								}
							}
					};
				});
				actions["show"] = {type:"submenu",text:"Show",children:colActions};
			}
			
			return actions;
		};
		
		o.leftHeaderActions = o.leftHeaderActions || function(row){
			var actions= {};
			return actions;
		};

		o.contentActions = o.contentActions || function(row,col){
			var actions= {};
			return actions;
		};

		this.element.bind("mouseup.agilegrid",function(){
        	delete self.mouseDownContent;
        	delete self.mouseDownLeftHeader;
        	delete self.mouseDownTopHeader;
        }).bind("contextmenu2.agilegrid contextmenu.agilegrid",function(e){
        	if((o.contextmenu2 && e.type == "contextmenu2")
        			||(!o.contextmenu2 && e.type == "contextmenu")){
        		var t = $(e.target), topHeader = t.closest(".top-header table"), th = t.parent("th"),
        		      actions = {}, cm = o.colModel;
        		if(topHeader.length > 0 && th.length > 0){
        			$.extend(actions,o.topHeaderActions(cm, parseInt(t.closest("th").attr("index"))));
        		}

        		var content = t.closest(".content"), td = t.closest("td");
				if(content.length > 0 && td.length > 0){
					var row = o.rowOffset+parseInt(td.attr("rowindex")), col = parseInt(td.attr("rowindex"));
					$.extend(actions, o.contentActions(row, col));
				}

        		if(!$.isEmptyObject(actions)){
        			t.menu({
        				autoShow: true,
        				menuPosition:{ of: e, my: "left top", at: "left bottom"	},
        				actions: actions,
        				select: function(e,ui){	$(this).menu("destroy");	},
        				collapseAll: function(e){	$(this).menu("destroy");	}
        			});
        		}
        		e.preventDefault();
        	}
		}).attr('tabIndex', -1).css('outline', 0).bind("keydown.agilegrid",function(e){
			self._keydown(e);
		});  // TODO keybord navigation isn't normal..
	},

	_init:function(){
		this.refresh();
	},
	
	_refreshLeftHeader: function(){
		var o = this.options, rm = o.rowModel, ro = o.rowOffset, thead = this.leftHeaderTable.find("thead");
		thead.empty();
		for(var i = 0; i < o.rowCount; i++){
			var tr = $("<tr/>");
			$("<th/>").attr("index",ro+i).css("display",rm[ro+i]&&rm[ro+i].hide?"none":"block")
			.append($("<div/>").css({
				width: o.leftHeaderWidth,
				height: (rm[ro+i]&&rm[ro+i].height) || o.defaultRowHeight,
				"line-height": (rm[ro+i]&&rm[ro+i].height) || o.defaultRowHeight+"px"
			}).html((rm[ro+i]&&rm[ro+i].render) || o.leftHeaderRender(ro+i, rm[ro+i]))).appendTo(tr);
			tr.appendTo(thead);
		}
	},
	
	_refreshTopHeader: function(){
		var o = this.options, cm = o.colModel, tr = this.topHeaderTable.find("tr");
		tr.empty();
		for(var i = 0; i < o.totalColCount; i++){
			$("<th/>").attr("index",i).css("display",cm[i]&&cm[i].hide?"none":"table-cell")
			.append($("<div/>").css({
		   	    width: (cm[i]&&cm[i].width) || o.defaultColWidth,
		   	    height: o.topHeaderHeight,
		   	    "line-height": o.topHeaderHeight+"px"
		    }).html((cm[i]&&cm[i].render) || o.topHeaderRender(i, cm[i]))).appendTo(tr);
		}
	},
	
	_refreshContent: function(){
		var o = this.options, cm = o.colModel, rm = o.rowModel, ro = o.rowOffset,
		    tbody = this.contentTable.children("tbody"), tr = $("<tr/>");

		tbody.detach().empty();
		for(var c = 0; c < o.totalColCount; c++){
			td = $("<td/>").attr("colindex", c).css("display",cm[c]&&cm[c].hide?"none":"table-cell")
			    .append($("<div/>").css("width",cm[c] && cm[c].width ? cm[c].width : o.defaultColWidth)).appendTo(tr);
		}

		for(var i = 0; i < o.rowCount; i++){
			var height = rm[ro+i] && rm[ro+i].height ? rm[ro+i].height : o.defaultRowHeight, clone = tr.clone();
			clone.css("display",rm[ro+i]&&rm[ro+i].hide?"none":"table-row").attr("rowindex",i)
			  .toggleClass("selected", o.rowSelections[ro+i]||(o.selectionMode == "row" && o.focus.row==ro+i))
			  .children("td").attr("rowindex",i).each(function(){
				var $this = $(this), c = parseInt($this.attr("colindex"));
				$this.toggleClass("selected", 
				    (o.cellSelections[ro+i]&&o.cellSelections[ro+i][c])||o.colSelections[c]
				    ||(o.focus.row==ro+i && o.focus.col == c)
				    ||(o.focus.col==c && o.selectionMode=="column"));
				$this.children("div").css({height : height, "line-height": height+"px"}).html(o.cellRender(ro+i,c));
			});
			clone.appendTo(tbody);
		}
		
		this.contentTable.append(tbody);
	},
	
	option:function(key,value){
		if(key === "visibleColCount" && value === undefined){
			return this.topHeaderTable.find("th:visible").length;
		}
		return $.Widget.prototype.option.apply(this, arguments );
	},
	
	_setOption: function(key, value) {
		var o = this.options, oldValue = o[key];
		if(!equals(value,oldValue)){
			$.Widget.prototype._setOption.apply(this, arguments );
			if(o.showPager&&(key == "currentPage" || key == "totalPage")){
				this._refreshPager();
			}
			this._trigger("optionchanged",null,{key:key, value:value, oldValue:oldValue});
		}
		return this; 
	},
	
	_refreshPager:function(){
		var o = this.options;
		if(o.totalPage <= 1){
			this.pager.find(".pager-button").button("disable");
		}else{
			this.pager.find(".pager-button").button("enable");
			if(o.currentPage <= 1){
				this.pager.find("#first").button("disable");
				this.pager.find("#prev").button("disable");
			}else if(o.currentPage >= o.totalPage){
				this.pager.find("#last").button("disable");
				this.pager.find("#next").button("disable");
			}
		}
		this.pager.find("input.current-page").val(o.currentPage);
		this.pager.find(".total-page").html(o.totalPage);
		this.pager.find(".info").html("Displaying "+(o.rowOffset+1)+" to "+(o.rowOffset+o.rowCount)+" of "+o.totalRowCount+" items.");
	},
	
	select: function(row,col,modified){
		var o = this.options;
		if(modified == "ctrl"){
			if(o.selectionMode == "row"){
				if(o.rowSelections[row]){
					delete o.rowSelections[row];
				}else{
					o.rowSelections[row] = true;
				}
				this.contentTable.find("tr[rowindex="+(row-o.rowOffset)+"]")
				    .toggleClass("selected", o.rowSelections[row]==true ? true: false);
			}else if(o.selectionMode == "column"){
				if(o.colSelections[col]){
					delete o.colSelections[col];
				}else{
					o.colSelections[col] = true;
				}
				this.contentTable.find("td[colindex="+col+"]")
				    .toggleClass("selected", o.colSelections[col]==true ? true: false);
			}else{
				if(!o.cellSelections[row]){
					o.cellSelections[row]=[];
					o.cellSelections[row][col]=true;
				}else{
					if(o.cellSelections[row][col]){
						delete o.cellSelections[row][col];
					}else{
						o.cellSelections[row][col]=true;
					}
				}
				this.contentTable.find("td[rowindex="+(row-o.rowOffset)+"][colindex="+col+"]")
				    .toggleClass("selected", o.cellSelections[row][col]=true?true:false);
			}
			o.focus = $.extend(o.focus, {row: row, col:col});
		}else if(modified == "shift"){
			if(o.selectionMode == "row"){
				var rowStart = Math.min(o.focus.row, row), rowEnd = Math.max(o.focus.row, row); 
				this.clearSelection();
				for(var i = rowStart; i<=rowEnd; i++){
					o.rowSelections[i]=true;
					this.contentTable.find("tr[rowindex="+(i-o.rowOffset)+"]").addClass("selected");
				}
			}else if(o.selectionMode == "column"){
				var colStart = Math.min(o.focus.col, col), colEnd = Math.max(o.focus.col, col);
				this.clearSelection();
				for(var i = colStart; i<=colEnd; i++){
					o.colSelections[i]=true;
					this.contentTable.find("td[colindex="+i+"]").addClass("selected");
				}
			}else{
				var rowStart = Math.min(o.focus.row, row), rowEnd = Math.max(o.focus.row, row),
				      colStart = Math.min(o.focus.col, col), colEnd = Math.max(o.focus.col, col);
				this.clearSelection();
				for(var r = rowStart; r<=rowEnd; r++){
					o.cellSelections[r] = o.cellSelections[r]||[]; 
					for(var c = colStart; c<=colEnd; c++){
						o.cellSelections[r][c]=true;
						this.contentTable.find("td[rowindex="+(r-o.rowOffset)+"][colindex="+c+"]").addClass("selected");
					}
				}
			}
		}else{
			this.clearSelection();
			if(o.selectionMode == "row"){
				o.rowSelections[row]=true;
				this.contentTable.find("tr[rowindex="+(row-o.rowOffset)+"]").addClass("selected");
			}else if(o.selectionMode == "column"){
				o.colSelections[col]=true;
				this.contentTable.find("td[colindex="+col+"]").addClass("selected");
			}else{
				o.cellSelections[row] = [];
				o.cellSelections[row][col] = true;
				this.contentTable.find("td[rowindex="+(row-o.rowOffset)+"][colindex="+col+"]")
				    .addClass("selected");
			}
			o.focus = $.extend(o.focus, {row: row, col:col});
		}
	},
	
	clearSelection: function(){
		var o = this.options;
		o.cellSelections = [];
		o.rowSelections = {};
		o.colSelections = {};
		if(o.showTopHeader){
			this.topHeaderTable.find(".selected").removeClass("selected");
		}
		if(o.showLeftHeader){
			this.leftHeaderTable.find(".selected").removeClass("selected");
		}
		this.contentTable.find(".selected").removeClass("selected");
	},
	
	_keydown: function( event ) {
		var keyCode = $.ui.keyCode, o = this.options; 
		
		if(event.shiftKey && !this.shiftKeyDown){
			this.shiftKeyDown = {row:o.focus.row,col:o.focus.col};
		}else if(!event.shiftKey){
			delete this.shiftKeyDown;
		}
		
		switch(event.keyCode) {
		case keyCode.LEFT:
			if(o.focus.col>0) 
				this.select(o.focus.row, event.shiftKey? --this.shiftKeyDown.col: o.focus.col-1, event.shiftKey?"shift":null);
			break;
		case keyCode.RIGHT:
			if(o.focus.col<o.totalColCount-1) 
				this.select(o.focus.row, event.shiftKey? ++this.shiftKeyDown.col: o.focus.col+1, event.shiftKey?"shift":null);
			break;
		case keyCode.UP:
			if(o.focus.row>0) 
				this.select(event.shiftKey?--this.shiftKeyDown.row: o.focus.row-1, o.focus.col, event.shiftKey?"shift":null);
			break;
		case keyCode.DOWN:
			if(o.focus.row<o.rowCount-1) 
				this.select(event.shiftKey?++this.shiftKeyDown.row: o.focus.row+1, o.focus.col, event.shiftKey?"shift":null);
			break;
		case keyCode.SPACE:
		case keyCode.ENTER:
			break;
		}

		return true;
	},

	_columnWidth: function(col, width){
		var o = this.options, cm = o.colModel, oldcm = $.extend({},cm);
		cm[col] = cm[col] || {name:col, label:col};
		oldWidth = cm[col].width || o.defaultColWidth; 
		cm[col].width = width;
		if(o.showTopHeader){
			this.topHeaderTable.find("th[index="+col+"]>div").css("width", width);
		}
		this.contentTable.find("td[colindex="+col+"]>div").css("width", width);
		this._trigger("optionchanged",null, {key:"colModel", value:cm, oldValue:oldcm});
	},
	
	_rowHeight: function(rowOffset, index, height){
		var o = this.options, rm = o.rowModel, row = rowOffset+index, oldrm = $.extend({},rm);
		rm[row] = rm[row] || {};
		oldHeight = rm[row].height || o.defaultRowHeight; 
		rm[row].height = height;
		if(o.showLeftHeader){
			this.leftHeaderTable.find("th[index="+index+"]>div").css({height:height, "line-height":height+"px"});
		}
		this.contentTable.find("td[rowindex="+index+"]>div").css("height", height);
		this._trigger("optionchanged",null, {key:"rowModel", value:rm, oldValue:oldrm});
	},
	
	insertColumn: function(col,colProp){
		var o = this.options, oldcm = $.extend(true,{},o.colModel), newcm = {};
		$.each(oldcm, function(k,v){
			if(k < col){
				newcm[k] = v;
			}else{
				newcm[parseInt(k)+1] = v;
			}
		});
		newcm[col] = colProp;
		o.colModel = newcm;
		o.totalColCount = o.totalColCount+1;
		this._adjustWidth();
		this._trigger("optionchanged", null, {key:"colModel", value:newcm, oldValue:oldcm});
	},
	
	removeColumn: function(col){
		var o = this.options, cm = o.colModel, oldcm = $.extend(true,{},cm);
		$.each(cm, function(k,v){
			if(k >= col && k < o.totalColCount - 1) {
				cm[k] = oldcm[parseInt(k)+1];
			}else if(k == o.totalColCount - 1){
				delete cm[k];
			}
		});
		o.totalColCount = o.totalColCount-1;
		this._adjustWidth();
		this._trigger("optionchanged", null, {key:"colModel", value:cm, oldValue:oldcm});
	},
	
	showColumn: function(col){
		var o = this.options, cm = o.colModel, oldcm = $.extend(true,{},cm);
		if(cm[col] && cm[col].hide) {
			cm[col].hide = false;
		}else{
			return;
		}
		this.topHeaderTable.find("th[index="+col+"]").show();
		this.contentTable.find("td[colindex="+col+"]").show();
		this._trigger("optionchanged",null, {key:"colModel", value:cm, oldValue:oldcm});
	},
	
	editColumn: function(col,hint){
		var self = this, o = this.options, cm = o.colModel, oldcm = $.extend(true,{},cm), 
		      colProp = (hint=="add"?{name:"",label:""}:cm[col]);
		$("<div/>").dialog({
			title: hint=="add" ? "Add Column" : "Edit Column",
			height: 260,
			width: 380,
			modal: true,
			create: function(event, ui){
				var $this = $(this);
				$.ans.getDoc(o.dbId, "50acda5e9555dbe125000004", null, function(err,form){
					$this.editor({document:colProp, forms:[form] ,dbId:o.dbId, mode:"edit", ignoreEscape:true});
				});
			},
			buttons: {
				OK: function() {
					var $this= $(this), cp = $this.editor("option","document");
					if(hint == "add"){
						self.insertColumn(col, cp);
					}else{
						cm[col] = cm[col]||{};
						$.extend(cm[col],cp);
						self._refreshTopHeader();
						self._trigger("optionchanged",null, {key:"colModel", value:cm, oldValue:oldcm});
					}
					self.option("isDirty",true);
					$this.dialog("close");
				},
				Cancel: function() { $( this ).dialog( "close" );}
			},
			close: function(e, ui){$(this).remove();}
		});		
	},
	
	hideColumn: function(col){
		var o = this.options, cm = o.colModel, oldcm = $.extend(true,{},cm);
		cm[col] = cm[col] || {name:col,label:col};
		cm[col].hide = true;
		this.topHeaderTable.find("th[index="+col+"]").hide();
		this.contentTable.find("td[colindex="+col+"]").hide();
		this._trigger("optionchanged", null, {key:"colModel", value:cm, oldValue:oldcm});
	},

	showRow: function(row){
		var o = this.options, rm = o.rowModel, oldrm = $.extend(true,{},rm);
		if(rm[row] && rm[row].hide) {
			delete rm[row].hide;
		}else{
			return;
		}
		this.leftHeaderTable.find("th[index="+row+"]").hide();
		this.contentTable.find("td[rowindex="+row+"]").hide();
		this._trigger("optionchanged",null, {key:"rowModel", value:rm, oldValue:oldrm});
	},
	
	hideRow: function(row){
		var o = this.options, rm = o.rowModel, oldrm = $.extend(true,{},rm);
		rm[row] = rm[row] ? rm[row] : {};
		rm[row].hide = true;
		this._adjustHeight();
		this._trigger("optionchanged", null, {key:"rowModel", value:rm, oldValue:oldrm});
	},

	_adjustWidth:function(){
		this._refreshTopHeader();
		this._refreshContent();
		return this;
	},

	_adjustHeight:function(){
		this._refreshLeftHeader();
		this._refreshContent();
		return this;
	},
	
	refresh:function(){
		var o = this.options;
		if(o.showTopHeader) this._refreshTopHeader();
		if(o.showLeftHeader) this._refreshLeftHeader();
		this._refreshContent();
		if(o.showPager) this._refreshPager();
		return this;
	},
	
	destroy: function() {
		this.element.removeClass("an-agilegrid").unbind(".agilegrid")
		    .undelegate(".top-header th>div",".agilegrid")
		    .undelegate(".left-header th>div",".agilegri")
		    .undelegate(".content td>div",".agilegrid");

		$.Widget.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );