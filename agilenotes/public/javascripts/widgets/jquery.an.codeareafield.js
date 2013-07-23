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
    options:{
        lineNumbers : false,
        modeType : 'javascript',
        codeTheme: 'solarized'  //default/solarized
    },

	_create: function() {
		$.an.field.prototype._create.apply(this, arguments);
		this.element.addClass("an-codeareafield");
	},

	_createControl:function(){
		var self = this, o = this.options, el = this.element;
        this.textarea = $("<textarea type='" + o.type + "' name='" + o.id + "'/>");
        this.textarea.appendTo(this.content.width('100%').height('100%'));

	},

	_makeResizable:function(){},

	_browser:function(){
        this.textarea.hide();
        if(this.codeEdit){
            this.codeEdit.off('change',function(){});
            this.codeEdit = null;
        }
        this.content.find('.CodeMirror').length > 0 && this.content.find('.CodeMirror').remove();
        if(!this.pre){
           this.pre = $("<pre>"+this.options.value+"</pre>");
           this.pre.appendTo(this.content);
        }

	},

	_edit:function(){
        var self = this, o = this.options;
        this.pre && this.pre.remove() && (this.pre = null);
        if(!self.codeEdit){
            self.codeEdit = CodeMirror.fromTextArea(self.textarea[0], {
               lineNumbers: o.lineNumbers,
               mode : o.modeType,
               theme: o.codeTheme
            });
        }

        var lineBox = this.content.find('.CodeMirror-gutters');
        lineBox.css('min-height',lineBox.find('.CodeMirror-linenumbers').outerHeight());

        $(self.textarea).val(o.value);
        self.codeEdit.doc.setValue(o.value);
        self.codeEdit.on('change',function(edit){
            if(self.editTimeout){
               clearTimeout(self.editTimeout);
               self.editTimeout = null;
            }
            self.editTimeout = setTimeout(function(){
                self.codeEdit && $(self.textarea).val(self.codeEdit.doc.getValue());
                $(self.textarea).trigger('change');
            },800);
        });

        this.textarea.bind("change.textareafield keyup.textareafield",function(e){
            var value = self.textarea.val(), oldValue = o.value;
            if(value != oldValue){
                o.value = value;
                self._trigger("optionchanged",null,{key:"value", value:value, oldValue:oldValue, isTransient:o.isTransient});
            }
        }).bind("dblclick.textareafield",function(e){e.stopImmediatePropagation();});
	},

	_design:function(){
        var self = this;

		this.textarea.detach();
	},
	destroy: function() {
        if(this.codeEdit){
            this.codeEdit.off('change',function(){});
            this.codeEdit = null;
        }
        this.content.find('.CodeMirror').length > 0 && this.content.find('.CodeMirror').remove();
        this.pre && this.pre.remove() && (this.pre = null);
		this.textarea.unbind(".codeareafield").parent().remove();
		this.element.removeClass( "an-codeareafield" );
		return $.an.field.prototype.destroy.apply(this, arguments);
	}
});
})( jQuery );
