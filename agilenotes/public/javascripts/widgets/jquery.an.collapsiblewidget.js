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
        var o = this.options;
        if(o.mobile){
           // o.headerText = o.headerText || 'Section Header';
            //o.contentText = o.contentText || 'Content';
            this.element.addClass("an-collapsiblewidget");
            var header = $('<a herf="javascript:;" class="an-collapsiblewidget-header"><span class="an-collapsiblewidget-icon an-collapsiblewidget-collapse-icon"></span><span>' + o.headerText + '</span></a>'),
                content = $('<div class="an-collapsiblewidget-content">' + o.contentText + '</div>');
            this.element.find('.content').append(header).append(content);
            this.element.find('.an-collapsiblewidget-header').bind('click.collapsiblewidget', function(e){
                $(this).find('.an-collapsiblewidget-icon')
                    .toggleClass('an-collapsiblewidget-extend-icon');
                $(this).next()
                    .toggleClass('an-collapsiblewidget-content-extend');
            });
        }
	},
    _design: function(){

    },
	destroy: function() {
		this.element.removeClass("an-collapsiblewidget");
        this.element.unbind('collapsiblewidget');
        this.content.remove();
		return $.an.widget.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
