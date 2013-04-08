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

var fakePath = 'C:\\fakepath\\';	

$.widget( "an.fileinput", {
	options: {
		browserButtonText: "Browse",
		uploadParams:{},
		uploadURL:"",
		uploadButtonText: "Upload",
		inputText: ""
	},

	_create: function(){
		var self = this, o = this.options;
		this.parent = this.element.parent();
		this.fileFile = this.element;
		this.wrapper = $("<div class='wrapper' />").insertAfter(this.fileFile);
		this.fileWrapper = $("<div class='fileinput-wrapper' />")
			.hover(function(){
				self.browserButton.addClass('ui-state-hover');
			},function(){
				self.browserButton.removeClass("ui-state-hover ui-state-active");
			}).bind('mousemove.fileinput',function(e){
				var fileFile = self.fileFile, offset = $(this).offset();
				fileFile.css({
					left: (e.pageX - offset.left) - (fileFile.width() / 1.2),
					top: (e.pageY - offset.top) - (fileFile.height() / 2)
				});
			}).bind('mousedown.fileinput',function(e){
				self.browserButton.addClass("ui-state-active");
			}).bind('mouseup.fileinput',function(e){
				self.browserButton.removeClass("ui-state-active");
			}).appendTo(this.wrapper);
		this.fileFile	.addClass("fileinput-file").appendTo(this.fileWrapper);
		this.fileInput = $("<div class='fileinput-input ui-widget-content ui-corner-left' />")
		      .text(this._getText()).insertBefore(this.fileFile);
		this.browserButtonText = $("<span class='fileinput-button-text' />").text(o.browserButtonText);
		this.browserButton = $("<span class='fileinput-button ui-state-default ui-widget-header ui-corner-right' />")
		      .append(this.browserButtonText).insertAfter(this.fileInput);

		if(o.upload){
			this.uploadButtonText = $("<span class='fileinput-button-text' />").text(o.uploadButtonText);
			this.uploadButton = $("<span class='upload-button ui-state-default ui-widget-header ui-corner-right' />")
			      .append(this.uploadButtonText).insertAfter(this.fileWrapper).click(function(e){
			    	  self.fileInput.progressbar();
			    	  var form = $('<form action="" method="POST"></form>');	
			    	  self.fileFile.clone().attr("name","attachment").appendTo(form);
			    	  $.each(o.uploadParams, function(k,v){
				    	  $('<input type="hidden">').attr("name", k).attr("value", v).appendTo(form);
			    	  });
			    	  form.ajaxSubmit({
			    		  url : o.uploadURL,
			    		  uploadProgress: function(event, position, total, percent){
			    			  self.fileInput.progressbar("option", "value", percent*100);
			    		  },
			    		  success: function(resp){
			    			  self.fileInput.progressbar("destroy").addClass("ui-widget-content");
			    			  self.element.trigger("uploaded",[resp]);
			    			  self.reset();
			    		  }
			    	  });
			      });
		}

		this.fileFile.bind('change.fileinput mouseout.fileinput',function(e){
			self.fileInput.text(self._getText());
		}).bind('focusin.fileinput',function(){
			self.browserButton.addClass("ui-state-hover");
		}).bind('focusout.fileinput',function(){
			self.browserButton.removeClass("ui-state-hover");
		});
	},

	_getText: function(){
		var fileValue = this.getValue(), inputTextValue = this.options.inputText;
		if(fileValue == ''){
			return inputTextValue;
		}else{
			return fileValue;
		}
	},

	getValue: function(){
		return fileValue = this.fileFile.val().replace(fakePath,'');
	},

	reset: function() {
		this.fileInput.text(this.options.inputText);
	},

	destroy: function(){
		this.fileFile.removeClass("fileinput-file").appendTo(this.parent);
		this.wrapper.remove();
		$.Widget.prototype.destroy.call(this);
	},

	hide: function(){
		this.wrapper.hide();
	},
	
	show: function(){
		this.wrapper.show();
	},
		
	_setOption: function(option, value){
		$.Widget.prototype._setOption.apply(this, arguments );
		switch(option){
			case "browserButtonText":
				this.browserButtonText.text(value);
				break;
			case "inputText":
				this.fileInput.text(this._getText());
				break;
		}
	}
});
})( jQuery );
