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

$.widget( "an.border", {
	options: {
		center:{
			minWidth: 200,
			minHeight: 20
		}
	},

	_create: function() {
		this.element.addClass("an-border");
		this._calculateDimension();
		this._makeResizable();
		this._proxy = $.proxy(function(e){
			if(e.target===window){
				this._calculateDimension();
			}
		},this);
		$(window).bind("resize.border",this._proxy);
	},

	_setOption: function( key, value ) {
		var oldValue = $.extend({},this.options[key]);
//		$.Widget.prototype._setOption.apply( this, arguments );
		switch(key){
		case "east":
		case "south":
		case "west":
		case "north":
		case "center":{
			$.extend(true,this.options[key],value);
			if(value.width!=oldValue.width || value.height!=oldValue.height){
				this._calculateDimension(key);
			}
			if(value.hasOwnProperty("resizable")){
				this._makeResizable();
			}
		}
			break;
		default:
			break;
		}
		this._trigger("optionchanged",null,{key:key, value:this.options[key], oldValue:oldValue});
	},

	_calculateDimension: function(hint) {
		var self = this, o = this.options, center = null;
		if(o.center.selector && o.center.selector != ""){
			center = self.element.children(o.center.selector);
		}
		if(!center || center.length == 0){
			center = $("<div/>").appendTo(self.element);
		}
		
		self.centerElement = center;
		
		// Dimension for east,south,west,north and center.
		var dim = {
				pbmWidth : 0,
				pbmHeight : 0,
				minWidth : 0,
				minHeight : 0,
				totalMinWidth : 0,
				totalMinHeight : 0				
		}, 
		nd = $.extend({ height: 0, totalHeight: 0 },dim), 
		sd = $.extend({},nd),
		wd = $.extend({ width: 0, totalWidth: 0 },dim),
		ed = $.extend({},wd),
        cd = {};
		
		// sum of width of padding-left,padding-right,border-left,
		// border-right,margin-left,margin-right.
		cd.pbmWidth = (center.outerWidth(true) - center.width());

		// sum of height of padding-top,padding-bottom,border-top,
		// border-bottom,margin-top,margin-bottom.
		cd.pbmHeight = (center.outerHeight(true) - center.height()); 
		
		cd.minWidth = parseFloat(o.center.minWidth);
		cd.minHeight = parseFloat(o.center.minHeight);
		cd.totalMinWidth = cd.minWidth + cd.pbmWidth;
		cd.totalMinHeight = cd.minHeight + cd.pbmHeight;

		$.each({"north":nd,"south":sd},function(k,v){
			var node = null;
			if(o[k]){
				if(o[k].selector && o[k].selector!=""){
					node = self.element.children(o[k].selector);
				}
				if(!node || node.length == 0){
					node = $("<div/>").appendTo(self.element);
				}
				v.height = parseFloat(o[k].height||v.minHeight||0);
				v.pbmWidth = node.outerWidth(true)-node.width();
				v.pbmHeight = node.outerHeight(true)-node.height();
				v.totalHeight = v.height + v.pbmHeight;
				v.minWidth = parseFloat(o[k].minWidth);
				v.minHeight = parseFloat(o[k].minHeight);
				v.totalMinWidth = v.minWidth + v.pbmWidth;
				v.totalMinHeight = v.minHeight+ v.pbmHeight;
				self[k+"Element"] = node;
			}
		});
		$.each({"west":wd,"east":ed},function(k,v){
			var node = null;
			if(o[k]){
				if(o[k].selector && o[k].selector!=""){
					node = self.element.children(o[k].selector);
				}
				if(!node || node.length == 0){
					node = $("<div/>").appendTo(self.element);
				}
				v.width = parseFloat(o[k].width||v.minWidth||0);
				v.pbmWidth = node.outerWidth(true)-node.width();
				v.pbmHeight = node.outerHeight(true)-node.height();
				v.totalWidth = v.width + v.pbmWidth;
				v.minWidth = parseFloat(o[k].minWidth);
				v.minHeight = parseFloat(o[k].minHeight);
				v.totalMinWidth = v.minWidth + v.pbmWidth;
				v.totalMinHeight = v.minHeight+ v.pbmHeight;
				self[k+"Element"] = node;
			}
		});
		
		var cw = self.element.width(), ch = self.element.height();
		if((nd.totalHeight + sd.totalHeight + cd.totalMinHeight > ch)
				&& (nd.totalMinHeight + sd.totalMinHeight + cd.totalMinHeight < ch)){
			var diff =  nd.totalHeight + sd.totalHeight + cd.totalMinHeight - ch;
			if(!hint){
				sd.height = sd.height - Math.ceil(diff/2);
				nd.height = nd.height - Math.floor(diff/2);
				if(sd.height < sd.minHeight){
					nd.height = nd.height - (sd.minHeight-sd.height);
					sd.height = sd.minHeight;
				}
				if(nd.height < nd.minHeight){
					sd.height = sd.height - (nd.minHeight-nd.height);
					nd.height = nd.minHeight;
				}
				sd.totalHeight = sd.height + sd.pbmHeight;
				nd.totalHeight = nd.height + nd.pbmHeight;
			}else if(hint == "north"){
				sd.height = sd.height - diff;
				if(sd.height < sd.minHeight){
					nd.height = nd.height - (sd.minHeight-sd.height);
					sd.height = sd.minHeight;
					nd.totalHeight = nd.height + nd.pbmHeight;
				}
				sd.totalHeight = sd.height + sd.pbmHeight;
			}else if(hint == "south"){
				nd.height = nd.height - diff;
				if(nd.height < nd.minHeight){
					sd.height = sd.height - (nd.minHeight-nd.height);
					nd.height = nd.minHeight;
					sd.totalHeight = sd.height + sd.pbmHeight;
				}
				nd.totalHeight = nd.height + nd.pbmHeight;
			}
		} else if(nd.totalMinHeight + sd.totalMinHeight + cd.totalMinHeight >= ch){
			nd.height = nd.minHeight;
			sd.height = sd.minHeight;
			nd.totalHeight = nd.height + nd.pbmHeight;
			sd.totalHeight = sd.height + sd.pbmHeight;
			ch = nd.totalMinHeight + sd.totalMinHeight + cd.totalMinHeight;
		}

		if((wd.totalWidth + ed.totalWidth + cd.totalMinWidth > cw)
				&& (wd.totalMinWidth + ed.totalMinWidth + cd.totalMinWidth < cw)){
			var diff =  wd.totalWidth + ed.totalWidth + cd.totalMinWidth - cw;
			if(!hint){
				ed.width = ed.width - Math.ceil(diff/2);
				wd.width = wd.width - Math.floor(diff/2);
				if(ed.width < ed.minWidth){
					wd.width = wd.width - (ed.minWidth-ed.width);
					ed.width = ed.minWidth;
				}
				if(wd.width < wd.minWidth){
					ed.width = ed.width - (wd.minWidth-wd.width);
					wd.width = wd.minWidth;
				}
				ed.totalWidth = ed.width + ed.pbmWidth;
				wd.totalWidth = wd.width + wd.pbmWidth;
			}else if(hint == "west"){
				ed.width = ed.width - diff;
				if(ed.width < ed.minWidth){
					wd.width = wd.width - (ed.minWidth-ed.width);
					ed.width = ed.minWidth;
					wd.totalWidth = wd.width + wd.pbmWidth;
				}
				ed.totalWidth = ed.width + ed.pbmWidth;
			}else if(hint == "east"){
				wd.width = wd.width - diff;
				if(wd.width < wd.minWidth){
					ed.width = ed.width - (wd.minWidth-wd.width);
					wd.width = wd.minWidth;
					ed.totalWidth = ed.width + ed.pbmWidth;
				}
				wd.totalWidth = wd.width + wd.pbmWidth;
			}
		} else if(wd.totalMinWidth + ed.totalMinWidth + cd.totalMinWidth >= cw){
			wd.width = wd.minWidth;
			ed.width = ed.minWidth;
			wd.totalWidth = wd.width + wd.pbmWidth;
			ed.totalWidth = ed.width + ed.pbmWidth;
			cw = wd.totalMinWidth + ed.totalMinWidth + cd.totalMinWidth;
		}
		
		cd.top = parseFloat(self.element.css("padding-top"));
		cd.left = parseFloat(self.element.css("padding-left"));
		cd.right = parseFloat(self.element.css("padding-right"));
		cd.bottom = parseFloat(self.element.css("padding-bottom"));

		if(self.northElement){
			nd.top = parseFloat(self.element.css("padding-top"));
			nd.left = parseFloat(self.element.css("padding-left"));
			nd.width = cw - nd.pbmWidth;
			
			cd.top += nd.totalHeight;
		}
		
		if(self.southElement){
			sd.left = parseFloat(self.element.css("padding-left"));
			sd.width = cw - sd.pbmWidth;
			sd.top = ch- sd.totalHeight;

			cd.bottom += sd.totalHeight;
		}
		
		if(self.westElement){
			wd.top = cd.top;
			wd.left = parseFloat(self.element.css("padding-left"));
			wd.height = ch - cd.top - cd.bottom - wd.pbmHeight;
			cd.left += wd.totalWidth;
		}
		
		if(self.eastElement){
			ed.top = cd.top;
			ed.left = cw - ed.totalWidth;
			ed.height = ch - cd.top - cd.bottom - ed.pbmHeight;
			cd.right += ed.totalWidth;
		}
		
		cd.width = cw - cd.left - cd.right - cd.pbmWidth;
		cd.height = ch - cd.top - cd.bottom - cd.pbmHeight;
		
		$.each({"north":nd,"south":sd,"west":wd,"east":ed,"center":cd},function(k,v){
			if(self[k+"Element"]){
				self[k+"Element"].css($.extend({position:"absolute"},{
					top : v.top + "px",
					left : v.left + "px",
					overflow: k=="north"?"visible":"hidden",
					width : v.width + "px",
					height : v.height + "px"
				}));
			}
		});
		
		self.element.trigger("resize");
	},
	
	_makeResizable : function(){
		var self = this, o = this.options;
		if(this.northElement){
			this.northElement.resizable(o.north.resizable?{ 
				handles: "s",
				containment: self.element,
				resize: function(event, an) {
					var height = Math.max(ui.size.height,o.north.minHeight||0);
					height = Math.min(height, o.north.maxHeight||Number.MAX_VALUE);
					self._setOption("north",{height:height});
				},
			    start: function(event, ui) {
			    	//add a mask over the Iframe to prevent IE from stealing mouse events
			       $('body').append("<div id=\"mask\" style=\"position: absolute; z-index: 999999; left: 0pt; top: 0pt; right: 0pt; bottom: 0pt;\"></div>");
			    },
			    stop: function(event, ui) {
			    	//remove mask when dragging ends
			       $("#mask").remove();
			    }
			}:"destroy");
		}
		if(this.southElement){
			this.southElement.resizable(o.south.resizable?{ 
				handles: "n",
				containment: self.element,
				resize: function(event, ui) {
					var height = Math.max(ui.size.height,o.south.minHeight||0);
					height = Math.min(height, o.south.maxHeight||Number.MAX_VALUE);
					self._setOption("south",{height:height});
				},
			    start: function(event, ui) {
			        //add a mask over the Iframe to prevent IE from stealing mouse events
			        $('body').append("<div id=\"mask\" style=\"position: absolute; z-index: 999999; left: 0pt; top: 0pt; right: 0pt; bottom: 0pt;\"></div>");
			    },
			    stop: function(event, ui) {
			        //remove mask when dragging ends
			        $("#mask").remove();
			    }
			}:"destroy");
		}
		if(this.westElement){
			this.westElement.resizable(o.west.resizable?{ 
				handles: "e",
				containment: self.element,
				resize: function(event, ui) {
					var width = Math.max(ui.size.width,o.west.minWidth||0);
					width = Math.min(width,o.west.maxWidth||Number.MAX_VALUE);
					self._setOption("west",{width:width});
				},
			    start: function(event, ui) {
			        //add a mask over the Iframe to prevent IE from stealing mouse events
			        $('body').append("<div id=\"mask\" style=\"position: absolute; z-index: 999999; left: 0pt; top: 0pt; right: 0pt; bottom: 0pt;\"></div>");
			    },
			    stop: function(event, ui) {
			        //remove mask when dragging ends
			        $("#mask").remove();
			    }
			}:"destroy");
		}
		if(this.eastElement){
			this.eastElement.resizable(o.east.resizable?{ 
				handles: "w",
				containment: self.element,
				resize: function(event, ui) {
					var width = Math.max(ui.size.width,o.east.minWidth||0);
					width = Math.min(width, o.east.maxWidth||Number.MAX_VALUE);
					self._setOption("east",{width:width});
				},
			    start: function(event, ui) {
			        //add a mask over the Iframe to prevent IE from stealing mouse events
			        $('body').append("<div id=\"mask\" style=\"position: absolute; z-index: 999999; left: 0pt; top: 0pt; right: 0pt; bottom: 0pt;\"></div>");
			    },
			    stop: function(event, ui) {
			        //remove mask when dragging ends
			        $("#mask").remove();
			    }
			}:"destroy");
		}
	},

	refresh:function(){
		this._calculateDimension();
	},
	
	destroy: function() {
		this.element.removeClass( "ui-border" );
		$(window).unbind("resize.border",this._proxy);
		return $.Widget.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
