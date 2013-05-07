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

$.widget( "an.rtefield",  $.an.field, {
	options:{
		showToolbar:true
	},

	_create: function() {
		$.an.field.prototype._create.apply(this, arguments);
		this.element.addClass("an-rtefield");
		var self = this, o = this.options;

		this.content.bind("change.rtefield",function(e){
			e.preventDefault();
//			e.stopImmediatePropagation();

			var value = self.content.rte("option","content"), oldValue = o.value;
			if(value != oldValue){
				o.value = value;
				self._trigger("optionchanged",null,{key:"value", value:value, oldValue:oldValue, isTransient:o.isTransient});
			}
		});
	},

	_browser:function(){
		this.content.rte("destroy").html(this.options.value);
		this.content.find(".widget[type=tabsx]").each(function(){
			var $this = $(this);
			if($this.is(".an-tabsxwidget")){
				$this.data("tabsxwidget").option("mode","browser");
			}else{
				$this.tabsxwidget({	parent:function(){return self;}, mode:"browser"});
			}
		});
	},
	
	_edit:function(){
		var o = this.options;
		this.content.rte({
			content:o.value,
			dbId:o.dbId,
			showToolbar:o.showToolbar,
			stylesheet:o.stylesheet,
			cssClass: o.cssClass,
			resizable: o.resizable,
			cssfiles: ['stylesheets/rte/rte-design.css','stylesheets/jquery-ui-1.8.24.custom.css','stylesheets/base.css'].concat(o.globalCSSFiles).concat(o.localCSSFiles),
			jsfiles:  [].concat(o.globalJSFiles).concat(o.localJSFiles)
		});
	},

	_design:function(){
		this._browser();
	},

	destroy: function() {
		this.content.rte("destroy");
		this.element.removeClass("an-rtefield");
		return $.an.field.prototype.destroy.apply(this, arguments);
	}
});
})( jQuery );
