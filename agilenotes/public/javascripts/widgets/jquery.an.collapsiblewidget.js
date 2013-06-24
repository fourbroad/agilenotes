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

$.widget( "an.collapsiblewidget", $.an.widget, {
	_create: function() {
        $.an.widget.prototype._create.apply(this, arguments);
        var o = this.options,newOps={};
        if(o.mobile){
           // o.headerText = o.headerText || 'Section Header';
            //o.contentText = o.contentText || 'Content';
			o.content_theme=o.content_theme||"";
            this.element.addClass("an-collapsiblewidget");
            var wrap = $('<div data-content-theme="'+o.content_theme+'"></div>'),
				header = $('<h3>' + o.headerText + '</h3>');
            this.contentDiv = $('<div></div>');
			wrap.append(header).append(this.contentDiv);
            this.element.find('.content').append(wrap);
			if(o.collapsedIcon){
				newOps.collapsedIcon=o.collapsedIcon;
			}
			if(o.expandedIcon){
				newOps.expandedIcon=o.expandedIcon;
			}
			if(o.iconpos){
				newOps.iconpos=o.iconpos;
			}
			if(o.theme){
				newOps.theme=o.theme;
			}
			wrap.collapsible(o);
        }
	},
	
	_browser:function(){
		var o = this.options;
		this.option("contextmenu2", false);
		this.content[0].contentEditable = false;
		if(link && link != "raw"){
			this.contentDiv.box({hideTitleBar:true,link:o.link,odbId:o.dbId,targetId:o.targetId,mode:"browser"});
			this.contentDiv.css("border","0 none");
		}else{
			this.contentDiv.append(o.contentText);
		}
	},

	_edit:function(){
		var o = this.options, link = o.link;
		this.option("contextmenu2", false);
		this.content[0].contentEditable = false;
		if(link && link != "raw"){
			this.contentDiv.box({hideTitleBar:true,link:o.link,odbId:o.dbId,targetId:o.targetId,mode:"edit"});
			this.contentDiv.css("border","0 none");
		}else{
			this.contentDiv.append(o.contentText);
		}
	},

    _design: function(){
		var o = this.options;
		this.option("contextmenu2", false);
		this.content[0].contentEditable = false;
		if(link && link != "raw"){
			this.contentDiv.box({hideTitleBar:true,link:o.link,odbId:o.dbId,targetId:o.targetId,mode:"browser"});
		}else{
			this.contentDiv.append(o.contentText);
		}
    },

	destroy: function() {
		this.element.removeClass("an-collapsiblewidget");
        this.element.unbind('collapsiblewidget');
        this.content.remove();
		return $.an.widget.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
