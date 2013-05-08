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

$.widget( "an.widget", {
	options: {
		mode: "browser"
	},

	_create: function() {
		var self = this, o = this.options, el = this.element;
		o.mode = o.readonly && o.mode=="edit"? "browser" : o.mode;
		el.addClass("an-widget "+o.mode)[0].contentEditable = false;
		o.metadata = el.getMetadata()||{};
		o.attributes = attributes(el.get(0));
		o["transient"]=o.attributes["transient"];
		o.id = el.attr("id");
		if(o.id) o.id = o.id.replace(/-/g,".");
		o.type = el.attr("type");
		if($.type(o.parent) == "function") o.parent = o.parent();

		this.content = el.children("div.content");
		if(this.content.size()==0) this.content = $("<div class='content'/>").appendTo(el);
		this._makeResizable();
		
		el.bind("metadatachanged.widget",function(e, md, oldmd){
			e.stopImmediatePropagation();
			self._reloadMetadata(md, oldmd);
		}).bind("attributeschanged.widget",function(e, attrs, oldattrs){
			e.stopImmediatePropagation();
			o.attributes = attrs;
			self._trigger("optionchanged",null,{key:"attributes", value:attrs, oldValue:oldattrs});
		}).bind("dblclick.widget click.widget change.widget",function(e){
			if($(e.target).closest(".widget")[0] == self.element[0]){
				setTimeout(function(){el.trigger($.Event(e,{type:"widget"+e.type}), self);},20);
			}
		});
	},
	
	_init: function(){
		this.refresh();
	},

	selectable:function(e){
		return this.options.mode == "design";
	},
	
	_makeResizable:function(){
		var self = this, o = this.options, el = this.element, handles = null;
		el.removeClass("fill-width auto-width fill-height auto-height");
		if(o.width == "fill" || o.width == "auto"){
			el.css("width","").addClass(o.width+"-width");
		}else{
			handles = "e";
		}
		
		if(o.height == "fill" || o.height == "auto"){
			el.css("height","").addClass(o.height+"-height");
		}else{
			handles = handles ? (handles+",s,se") : "s";
		}
		
		if(handles && (o.mode == "design" || o.resizable)){
			el.resizable({
				handles: handles,
				stop:function(e,ui){
					self._trigger("resize",null, {size:ui.size, oldSize:ui.originalSize});
				}
			});	
		}
	},

	option: function(key, value) {
		var o = this.options;
		if(key === "mode" && value==="edit" && o.readonly){
			value = "browser";
		}
		if(key === "value" && value === undefined){
			return o.value;
		}
		if(key === "actionSet" && value === undefined){
			return o.actioSet;
		}
		return $.Widget.prototype.option.apply(this, arguments );
	},

	_setOption: function(key, value) {
		var o = this.options, oldValue = o[key];
		if(!equals(value,oldValue)){
			$.Widget.prototype._setOption.apply(this, arguments );
			this._handleChange(key, value, oldValue);
			this._trigger("optionchanged",null,{key:key, value:value, oldValue:oldValue, isTransient:o.isTransient});
		}
		return this; 
	},
	
	_handleChange:function(key, value, oldValue){
		if(key === "mode" || key === "value"){
			if(key === "mode"){
				this.element.removeClass(oldValue).addClass(value);
			}
			this.refresh();
		}else if(key == "width" || key == "height"){
			this._makeResizable();
		}else if(key == "readonly"){
			if(value == "true"){
				this.option("mode", "browser");
			}else{
				this.refresh();
			}
		}
	},
	
	_reloadMetadata:function(md, oldmd){
		this.options.metadata = md;
		this.option(md[this.widgetName]);
		this.refresh();
		this._trigger("optionchanged",null,{key:"metadata", value:md, oldValue:oldmd});
	},
	
	_updateMetadata:function(){
		var o = this.options, el = this.element, oldmd = el.getMetadata();
		if(!equals(o.metadata, oldmd)){
			el.setMetadata(o.metadata);
			this._trigger("optionchanged",null,{key:"metadata", value:o.metadata, oldValue:oldmd});
		}
	},
	
	refresh:function(){
		var o = this.options;
		this["_"+o.mode] && this["_"+o.mode]();
	},
	
	highlight: function(highlight){
		this.element.toggleClass("an-state-hover",highlight);
	},
	
	scrollTo: function(){
		var o = this.options, opts = { onlyIfOutside: true, offsetTop: 50, offsetLeft: 50 };
		if(o.mode == "design"){
			o.parent.scrollTo(o.id, opts);
		}else{
			this.element.ScrollTo(opts);
		}
	},
	
	destroy: function() {
		this.element.resizable("destroy").unbind(".widget").removeAttr("contenteditable")
		    .removeClass("an-widget browser design edit selected");
		return $.Widget.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
