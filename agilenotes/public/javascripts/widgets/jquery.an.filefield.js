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

$.widget( "an.filefield", $.an.inputfield, {
	options: {
		tags: [],
		sortBy: "name",
		mode: "browser",
		value: [],
		maxCount:Number.MAX_VALUE,
		itemWidth:64,
		itemHeight:64
	},

	_create: function() {
		$.an.inputfield.prototype._create.apply(this, arguments);
		this.element.addClass("an-filefield wrapper");
	},

	_createControl:function(){
		var self = this, o = this.options, c = this.content;
		this.files = $("<ul class='grid'/>").appendTo(c);
		c.delegate("li[data-id][data-id!=uploadButton]", "hover.filefield", function(e){
			if(o.mode != "edit") return;
			if(e.type == "mouseenter"){
				$(this).find("img.button").remove();
				$("<img class='button' width='24' height='24' src='stylesheets/images/delete.png' />").appendTo(this)
				    .position({of: $(this), my: "right top", at: "right top"});
			}else if(e.type == "mouseleave"){
				$(this).find("img.button").remove();	
			}
       }).delegate("img.button", "hover.filefield", function(e){
			if(e.type == "mouseenter"){
			    $(this).addClass("ui-state-hover");
			}else if(e.type == "mouseleave"){
			    $(this).removeClass("ui-state-hover ui-state-active");
			}
		}).delegate("img.button", "mousedown.filefield", function(e){
			$(this).addClass("ui-state-active");
		}).delegate("img.button", "mouseup.filefield", function(e){
			$(this).removeClass("ui-state-active");
		}).delegate("img.button", "click.filefield", function(e){
			e.preventDefault();
			e.stopImmediatePropagation();
			var id = $(this).closest("li").attr("data-id"), oldValue = [].concat(o.value);
			for(var i = 0; i < o.value.length; i++){
				if(o.value[i]._id == id){
					o.value[i]._del = true;
					break;
				}
			}
			self._trigger("optionchanged",null,{key:"value", value:o.value, oldValue:oldValue, isTransient:o.isTransient});
			self.loadIcons();
		});
		this.input = $("<input type='file'/>").hide().appendTo(this.element);
		this.element.append($('<input id="btnCancel" type="button" value="Cancel" disabled="disabled" style="display:none;" />'));
	},
	
	_createSwfUpload:function(placeElem,callback){
		var settings = {
			flash_url : "javascripts/swfupload/swfupload.swf",
			upload_url: "/tmp",
			file_post_name:"file",
			post_params: {"file" : ""},
			file_size_limit : "10 MB",
			file_types : "*.*",
			file_types_description : "All Files",
			file_upload_limit : 100,
			file_queue_limit : 0,
			custom_settings : {
				cancelButtonId : "btnCancel"
			},
			debug: false,
			button_image_url: "stylesheets/images/selection.png",
			button_width: "64",
			button_height: "64",
			button_placeholder:placeElem,
			button_text: '',
			button_action:SWFUpload.BUTTON_ACTION.SELECT_FILE,
			file_queued_handler : fileQueued,
			file_queue_error_handler : fileQueueError,
			file_dialog_complete_handler : fileDialogComplete,
			upload_start_handler : uploadStart,
			upload_progress_handler : uploadProgress,
			upload_error_handler : uploadError,
			upload_success_handler : callback,
			upload_complete_handler : uploadComplete,
			queue_complete_handler : function(){} // Queue plugin event
		};
		this.swfUpload = new SWFUpload(settings);
	},

	loadIcons: function(){
		var self = this, o = this.options,lis=this.files.children(),size=0;
		for(var i=0;i<lis.size();i++){
			if(lis.eq(i).attr("data-id")!="uploadButton"){
				lis.eq(i).remove();
			}
		}
		$.each(o.value, function(k,v){
			if(!v._del){
				size++;
				self._addIcon(v);
			}
		});
		if(o.mode == "edit" || o.mode == "design"){
			var li=this.files.find('li[data-id="uploadButton"]');
			if(li.length==0){
				li = $("<li/>").attr("data-id", "uploadButton");
				var $img=$("<img/>");
				$img.css({width:o.itemWidth, height:o.itemHeight}).appendTo(li);
				li.appendTo(this.files);
				if(o.mode == "design"){
					$img.css("backgroundImage","url(stylesheets/images/selection.png)");
				}else{
					if(!self.swfUpload){
						self._createSwfUpload(li.children("img")[0],function(data,resp){
							resp=$.parseJSON(resp);
							resp._tmp = true;
							var oldValue = [].concat(o.value);
							o.value.push(resp);
							self._addIcon(resp);
							if(self.files.children().size()-1 >= o.maxCount){
								li.hide();
							}
							self._trigger("optionchanged",null,{key:"value", value:o.value, oldValue:oldValue, isTransient:o.isTransient});
						});
					}
				}
			}
			if(size >= o.maxCount){
				li.hide();
			}else{
				li.show();
			}
		}
	},
	
	_addIcon:function(file){
		var o = this.options, li = $("<li/>").attr("data-id", file._id), 
		    imgsrc = "stylesheets/images/file.png", href = "";
		var imgFormat="jpg,jpeg,png,gif";
		if(file._tmp){
			href = "/tmp/"+file._id;
			if(imgFormat.match(file["filename"].match(/(?=.)[^.]+$/g)[0])){
				imgsrc = href;
			}
		}else if(file.metadata){
			href = o.url+"/"+file.metadata.filepath;
			if(imgFormat.match(file["filename"].match(/(?=.)[^.]+$/g)[0])){
				imgsrc = href;
			} else {
				imgsrc += "#" + href;
			}
		}
		
	    var img = $("<img/>").css({width:o.itemWidth, height:o.itemHeight}).attr("src", imgsrc);
	    if(o.downloadable){
	    	img.wrap("<a target='_blank'/>").parent().attr("href", href).appendTo(li);
	    }else{
	    	img.appendTo(li);
	    }

	    if(o.showFileName) $("<strong/>").text(file.filename).appendTo(li);
	    if(o.showFileSize) $("<span/>").text(file.length).appendTo(li);
	    li.prependTo(this.files);
	},
	
	_addUploadButton: function(target){
		var o = this.options;
		if((target.size() >= o.maxCount)||(target.size()>=1 && o.maxCount==1)) return target;
		var li = $("<li/>").attr("data-id", "uploadButton");
	    $("<img/>").css({width:o.itemWidth, height:o.itemHeight}).attr("src", "stylesheets/images/selection.png").appendTo(li);
//	    $("<strong/>").text("Upload...").appendTo(li);
	    return target.add(li.get());
	},
	
	_delUploadButton:function(){
		this.files.find("li#uploadButton").remove();
	},

	sort: function(tags, by){
		var o = this.options, data = null;
		if(tags && tags.length){
			data = this.data.find('li.' + tags.join("."));
		}else{
			data = this.data.find("li");
		}
		
		function sorted(data, customOptions) {
			var options = {
				reversed : false,
				by : function(a) {
					return a.text();
				}
			};
			$.extend(options, customOptions);

			arr = data.get();
			arr.sort(function(a, b) {
				var valA = options.by($(a));
				var valB = options.by($(b));
				if (options.reversed) {
					return (valA < valB) ? 1 : (valA > valB) ? -1 : 0;
				} else {
					return (valA < valB) ? -1 : (valA > valB) ? 1 : 0;
				}
			});
			return $(arr);
		};
		
		if (by == 'size') {
			data = sorted(data, {
				by : function(v) {
					return parseFloat($(v).find('span').text());
				}
			});
		} else {
			data = sorted(data, {
				by : function(v) {
					return $(v).find('strong').text().toLowerCase();
				}
			});
		}

		if(o.mode == "edit" || o.mode == "design"){
			data = this._addUploadButton(data);
		}

		this.files.quicksand(data, { 
			duration : 800, 
			easing : 'easeInOutQuad', 
//			adjustHeight : "dynamic",
			useScaling : true
		}, function(){});
	},
	
	_handleChange:function(key, value, oldValue){
		if(key === "sortBy"){
			var o = this.options;
			this.sort(o.tags, o.sortBy);
		}else if(key == "label"){
			this.element.children("label").remove();
			this._createLabel();
		}else{
			$.an.inputfield.prototype._handleChange.apply(this, arguments );
		}
	},
	
	refresh:function(){
		var self = this, o = this.options, c = this.content;
		if(c.is(".ui-resizable")) c.resizable("destroy");
		c.css({width:o.width, height:o.height, display:""});
		if(o.mode == "design" || o.resizable){
			c.resizable({
				stop:function(e,ui){
					o.width = c.width();
					o.height = c.height();
					$.extend(true,o.metadata[self.widgetName],{width:o.width,height:o.height});
					self._updateMetadata();
					self._trigger("resize",null, {size:ui.size, oldSize:ui.originalSize});
				}
			});
		}

		this.loadIcons();
	},
	
	destroy: function() {
		this.swfUpload&&this.swfUpload.destroy();
		this.content.undelegate(".filefield");
		this.element.removeClass( "an-filefield wrapper");
		return $.an.inputfield.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
