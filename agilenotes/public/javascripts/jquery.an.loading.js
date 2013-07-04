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

$.widget( "an.loading", {
	options:{
		trans:'0.6',
		msg:''
	},
	
	_create: function(){
		var o = this.options,self=this;
		this.wrap=$('<div class="loading" style="width:100%;height:100%;position:absolute;left:0;top:0;z-index:9997;vertical-align:middle;"><div style="position:absolute;left:0;top:0;width:100%;height:100%;z-index:9998;background:#fff;"></div></div>');
		this.wrap.css('opacity',o.trans);
		this.wrap.append($('<span style="background:url(images/large-loading.gif) no-repeat;width:32px;height:32px;position:absolute;left:49%;top:49%;z-index:9999;padding-top:32px;">'+o.msg+'</span>'));
		this.oldPos=this.element.css("postion");
		this.element.css("postion","relatvie").append(this.wrap);;
	},
	
	open:function(){
		this.wrap && this.wrap.show();
	},

	close:function(){
		this.wrap && this.wrap.hide();
	},

	destroy: function() {
		this.element.css("postion",this.oldPos);
		this.wrap && this.wrap.remove();
		delete this.pager;
		$.Widget.prototype.destroy.apply(this,arguments);
	}
});
})( jQuery );
