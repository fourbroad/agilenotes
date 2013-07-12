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
        o.mobile = true;
        if(o.mobile){
           // o.headerText = o.headerText || 'Section Header';
            //o.contentText = o.contentText || 'Content';
			o.content_theme=o.content_theme||"";
            this.element.addClass("an-collapsiblewidget");
			var content = this.element.children(".content");
			content.attr("data-content-theme",o.content_theme);
            this.header = $('<h3>' + o.headerText + '</h3>');
            this.contentDiv = $('<div></div>');
			content.prepend(this.header);
			if(o.link!="raw"){
				content.append(this.contentDiv);
			}
			if(o.collapsedIcon){
				newOps.collapsedIcon=o.collapsedIcon;
			}
			if(o.collapsed){
				newOps.collapsed=false;
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
			this.opts=newOps;
        }
	},
	
	_browser:function(){
		this._edit();
	},

	_edit:function(){
		var o = this.options,link=o.link;
		var content = this.element.children(".content");
		this.option("contextmenu2", false);
		this.content[0].contentEditable = false;
		content.collapsible&&content.collapsible(this.opts);
		if(link && link != "raw"){
			this.contentDiv.box({hideTitleBar:true,link:o.link,odbId:o.dbId,targetId:o.targetId,mode:"browser"});
			this.contentDiv.css("border","0 none");
		}else{
			this.contentDiv.append(o.contentText);
		}
	},

    _design: function(){
		var o = this.options,link=o.link;
		this.option("contextmenu2", true);
		this.header.addClass("ui-collapsible-heading").html('<a href="#" class="ui-collapsible-heading-toggle ui-btn ui-fullsize ui-btn-icon-right ui-btn-up-c" data-corners="false" data-shadow="false" data-iconshadow="true" data-wrapperels="span" data-icon="arrow-u" data-iconpos="right" data-theme="c" data-mini="false"><span class="ui-btn-inner"><span class="ui-btn-text">'+o.headerText+'<span class="ui-collapsible-heading-status"> click to collapse contents</span></span><span class="ui-icon ui-icon-shadow ui-icon-arrow-d">&nbsp;</span></span></a>');

		var tag=false;
		if(link && link != "raw"){
			this.contentDiv.box({hideTitleBar:true,link:o.link,odbId:o.dbId,targetId:o.targetId,mode:"design"});
		}else{
			tag=true;
			this.contentDiv.append(o.contentText);
		}
		this.content[0].contentEditable = tag;
    },

	destroy: function() {
		var o = this.options, link = o.link;
		if(link && link != "raw"){
			this.content.remove();
		}else{
			this.content.removeAttr("contenteditable");
			this.content.removeAttr("data-content-theme");
			this.header.remove();
		}
		this.element.removeClass("an-collapsiblewidget");
        this.element.unbind('collapsiblewidget');
		return $.an.widget.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
