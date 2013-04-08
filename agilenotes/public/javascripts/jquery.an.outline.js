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

$.widget( "an.outline", {
	options: {
	},

	_create: function() {
		var self = this, o = this.options, el = this.element;
		el.addClass("an-outline").tree({ 
			contextmenu: o.contextmenu, 
			contentProvider: o.contentProvider,
			nodehover: o.nodehover,
			nodeclick: o.nodeclick,
			nodedblclick:o.nodedblclick
		});
		$.each(el.tree("option","roots")||[],function(k,v){ el.tree("expand",v); });

		$(window).bind("outline.outline", function(e){
			var ed = e.workbench.currentEditor();
			self._setOption("contentProvider", ed&&ed.option("outline"));
		}).bind("widgetselect.outline", function(e,widget){
			el.tree("option","selectedNodes",[widget.option("id")]);
		});
	},

	_setOption: function( key, value ) {
		if ( key === "contentProvider" ) {
			var el = this.element;
			el.tree("option","contentProvider", value);
			$.each(el.tree("option","roots")||[],function(k,v){ el.tree("expand",v); });
		}
		return $.Widget.prototype._setOption.apply(this, arguments ); 
	},

	destroy: function() {
		$(window).unbind(".outline");
		this.element.removeClass("an-outline");
		$.Widget.prototype.destroy.apply( this, arguments );
	}
});

})( jQuery );
