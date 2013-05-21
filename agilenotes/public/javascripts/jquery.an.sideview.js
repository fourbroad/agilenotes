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

$.widget( "an.sideview", $.an.extendable, {
	
	_create: function() {
		var o = this.options, el = this.element;
		if(o.name) el.addClass(o.name);
		$('<style type="text/css">'+(o.stylesheet||"")+'</style>').appendTo(el);
		$.extend(this, eval("try{("+(o.methods||"{}")+")}catch(e){}"));
		
		var data = {};
		data[this.widgetName] = this;
		o.actions = eval("("+(o.actions||"[]")+")");
		$.each(o.actions, function(k,action){
			el.bind(action.events, data, action.handler);
		});

		$.an.extendable.prototype._create.apply(this, arguments);
		
		console.log("*****************************8");
		this.createContent && this.createContent();
	},
	
	destroy: function() {
		var el = this.element;
		$.each(o.actions, function(k,action){
			el.unbind(action.events);
		});
		this.clean && this.clean();
		$.Widget.prototype.destroy.apply( this, arguments );
	}
});
})(jQuery);