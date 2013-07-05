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

$.widget( "an.codeareafield", $.an.field, {

	_create: function() {
		$.an.field.prototype._create.apply(this, arguments);
		this.element.addClass("an-codeareafield");
	},

	_createControl:function(){
		var self = this, o = this.options, el = this.element;
        this.textarea = $("<textarea type='" + o.type + "' name='" + o.id + "'/>");
        this.textarea.appendTo(this.content.width('100%'));

	},

	_makeResizable:function(){},

	_browser:function(){
        //this.textarea.val(this.codeEdit.doc.getValue()).show();
		//this.textarea.detach();
	},

	_edit:function(){
         var self = this;
         self.codeEdit = CodeMirror.fromTextArea(self.textarea[0], {
               lineNumbers: true,
               mode : 'javascript',
               theme: 'solarized'
            });
            self.codeEdit.doc.setValue($(self.textarea).val());
            self.codeEdit.on('change',function(edit){
                if(self.editTimeout){
                   clearTimeout(self.editTimeout);
                   self.editTimeout = null;
                }
                self.editTimeout = setTimeout(function(){
                    $(self.textarea).val(self.codeEdit.doc.getValue());
                },500);
            })
		//this.textarea.detach().val(this.options.value).appendTo(this.content.empty());
	},

	_design:function(){
        var self = this;

		this.textarea.detach();
	},
	destroy: function() {
		this.textarea.unbind(".codeareafield").parent().remove();
		this.element.removeClass( "an-codeareafield" );
		return $.an.field.prototype.destroy.apply(this, arguments);
	}
});
})( jQuery );
