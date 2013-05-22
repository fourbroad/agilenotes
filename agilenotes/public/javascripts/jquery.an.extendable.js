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

$.widget( "an.extendable", {
	
	_create: function() {
		var self=this, o = this.options;
		if(o.extensionPoints){
			if($.type(o.extensionPoints) == "string") o.extensionPoints = o.extensionPoints.split(",");
			Model.loadExtensions(o.dbId, o.extensionPoints, function(err, extensions){
				o.extensions = extensions;
				self._trigger("loadextensions");
			});
		}
	},
	
	destroy: function() {
	    $(document).unbind(".extendable"); 
		$.Widget.prototype.destroy.apply( this, arguments );
	}
});
})(jQuery);