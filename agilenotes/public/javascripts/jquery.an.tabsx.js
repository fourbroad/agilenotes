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

$.widget("an.tabsx", $.ui.tabs, {
	options: {
		'duration': 2000,
		'slideshow': false,
		'fxs': null
	},

	_create: function() {
		var self = this, o = this.options;
		if(o.mode == "edit" && o.slideshow){
			o.fx = o.fxs ? o.fxs : {'opacity' : 'toggle', 'duration' : 200};
		}
		$.ui.tabs.prototype._create.apply(this, arguments);
		this.element.addClass("an-tabsx");

		
		this._navMenu = $("<div id='nav-menu'>>><span>0</span></div>");
		this._navMenu.css({position:"relative","float":"left",width:"18px",height:"22px","font-size":"60%",border: "1px solid #CCCCCC",margin:'0px',padding:'0px'});
		this._navMenu.find("span").css({position:"absolute",right:"0px",bottom:"0px","font-size":"11px"});
		this._navMenu.hover(function(e){
			self._navMenu.css({border: "1px solid #AAAAAA",cursor : 'pointer',margin:'0px',padding:'0px'});
		},function(){
			self._navMenu.css({border: "1px solid #CCCCCC",margin:'0px',padding:'0px'});
		});
		
		if(o.mode == "edit" && o.slideshow){
			this._slideshow(o.duration);
		}else{
			this.element.bind( "tabsxadd.tabsx", $.proxy(this, "_showMenu") );
			this.element.bind( "tabsxshow.tabsx", $.proxy(this, "_showMenu") );
			this.element.bind( "tabsxremove.tabsx", $.proxy(this, "_showMenu"));
			this._proxy = $.proxy(this, "_showMenu");
			$(window).bind( "resize.tabsx", this._proxy);
		}
		
		if(o.showTabsContextMenu){
			this.list.menu({
				triggerEvent:"contextmenu",
				menuPosition:{my: "left top", at: "left bottom"},
				delay:false,
				actions: {
					close:{type:"menuItem", text:"Close", handler:$.proxy(self,"closeCurrent")},
					closeOthers:{type:"menuItem", text:"Close Others", handler:$.proxy(self,"closeOthers")},
					closeAll:{type:"menuItem", text:"Close All", handler:$.proxy(self,"closeAll")}
				},
				select: function(e,ui){ $(this).menu("collapseAll"); }
			});
		}
	},
	_slideshow: function(duration) {
		var self = this, o = this.options, overanchor = null, navWidth = 0;
		this.lis.each(function(){
			navWidth += $(this).outerWidth(true);
		});
		this.list.css({
			"width" : navWidth
		}).addClass('ui-tabs-slideshow-nav').removeClass("ui-widget-header");
		var rotate = function(e) {
			stop();
			self._rotation = setTimeout(function() {
				var t = o.selected;
                if(overanchor != null && overanchor == t){
                    stop();
                    return false;
                }
				self.select( ++t < self.anchors.length ? t : 0 );
                rotate();
			}, duration);
		};
		function stop(){
            clearTimeout(self._rotation);
            self._rotation = null;
        };
		if (duration) {
            this.anchors.bind('click',stop);
            this.anchors.bind('mouseover',function(){
                var index = self.anchors.index(this);
                if(o.selected == index){
                    stop();
                }else{
                    overanchor = index;
                }
            });
            this.anchors.bind('mouseout',function(){
                rotate();
                overanchor = null;
            });
            this.anchors.bind('mouseup',function(){
                $(this).parent().hasClass('ui-state-focus') && $(this).parent().removeClass('ui-state-focus');
            });
			rotate();
		}
		else {
			stop();
		}
		return this;
	},
	
	closeCurrent:function(){
		this.remove(this.option("selected"));
	},
	
	closeOthers:function(){
		var selected = this.option("selected");
		while(this.length()-1 > selected){
			this.remove(this.length()-1);
		}
		while(this.length()>1){
			this.remove(0);
		}
	},

	closeAll:function(){
		while(this.length()>0){
			this.remove(0);
		}
	},

	option: function(key, value) {
		if(key === "selectedPanel" && value === undefined){
			return this.panels.get(this.options.selected);
		}else if(key ==="panels" && value === undefined){
			return this.panels;
		}
		return $.Widget.prototype.option.apply(this, arguments);
	},
	
	_showMenu: function(e, ui){
		if(this.list.is(":hidden")) return;
		
		var self = this;
		if(e.type == "tabsxshow"){
			this.lis.each(function(k,v){
				var $v = $(v), hit = parseInt($v.attr("hit"))||0;
				$v.attr("hit", $v.is(".ui-tabs-selected")? 0 : hit+1);
			});
		}
		
		var liArray = this.lis.toArray(); 
		liArray.sort(function(x,y){
			var pre = parseInt($(x).attr("hit")), next = parseInt($(y).attr("hit"));
			return pre-next;
		});

		this._navMenu.appendTo(this.list);
		var width = this.list.width() - this._navMenu.outerWidth(true);
		this._navMenu.menu("destroy").detach();
		
		$.each(liArray, function(k,v){
			width -= $(v).outerWidth(true);
			$(v)[width>0?"show":"hide"]();
		});
		
		var hs = this.lis.filter(":hidden"),size = hs.size();
		if(size > 0){
			this._navMenu.find("span").html(size);
			var actions = {};
			hs.each(function(){
				var $this = $(this), item = $this.find("a:first"), id = item.attr("href").slice(1);
				actions[id] = {
						type: "menuItem",
						text: item.text(),
						handler: function(){
							self.element.tabsx("select", '#'+id);
						}
				};
			});
			self._navMenu.appendTo(this.list);
			self._navMenu.menu({
				triggerEvent:"click",
				menuPosition:{of: self._navMenu, my: "left top", at: "left bottom"},
				delay:false,
				actions: actions,
				select: function(e,ui){ $(this).menu("collapseAll"); }
			});
		}
	},

	remove: function( index ) {
		if(this._getIndex(index)== -1) return;
		return $.ui.tabs.prototype.remove.apply(this, arguments);
	},
	
	panel:function(index){
		return $(this.panels[this._getIndex( index )]);
	},
	
	_trigger: function( type, event, data ) {
		var prop, orig, callback = this.options[ type ];

		data = data || {};
		event = $.Event( event );
		event.type = ( type === this.widgetEventPrefix ?
			type :
			this.widgetEventPrefix + type ).toLowerCase();
		// the original event may come from any element
		// so we need to reset the target on the new event
		event.target = this.element[ 0 ];

		// copy original event properties over to the new event
		orig = event.originalEvent;
		if ( orig ) {
			for ( prop in orig ) {
				if ( !( prop in event ) ) {
					event[ prop ] = orig[ prop ];
				}
			}
		}

		!( $.isFunction(callback) &&	callback.call( this.element[0], event, data ) === false ||	event.isDefaultPrevented() );

		return this.element.trigger( event, data );
	},

	destroy: function() {
		var o = this.options;
		if(!o.destroyTabs){
			this.lis.add( this.panels ).each(function() {
				$.removeData(this,"destroy.tabs");
			});
		}
		$(window).unbind( "resize.tabsx", this._proxy);
		this.list.unbind(".tabsx");
		this.element.removeClass("an-tabsx" ).unbind( ".tabsx").removeData("tabsx");
		return $.ui.tabs.prototype.destroy.apply(this, arguments);
	}
});
}(jQuery));
