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
			self.loadIcons();
			self._trigger("optionchanged",null,{key:"value", value:o.value, oldValue:oldValue, isTransient:o.isTransient});
		}).delegate("li[data-id=uploadButton]", "click.filefield", function(e){
			e.preventDefault();
			e.stopImmediatePropagation();
			self.input.click();
		});
		this.input = $("<input type='file'/>").hide().appendTo(this.element).bind("change",$.proxy(this, "_uploadFile"));
		this.loadIcons();
	},
	
	_uploadFile:function(e){
		var self = this, o = this.options, upload = this.files.find("li[data-id=uploadButton]");
		$.ans.postTemp(this.input,{
    		  uploadProgress: function(event, position, total, percent){
    			  upload.progressbar("option", "value", percent*100);
    		  },
    		  success: function(resp){
    			  upload.progressbar("destroy").addClass("ui-widget-content");
    			  resp._tmp = true;
    			  var oldValue = [].concat(o.value);
    			  o.value.push(resp);
    			  self.loadIcons();
  				self._trigger("optionchanged",null,{key:"value", value:o.value, oldValue:oldValue, isTransient:o.isTransient});
    		  }
		});
	},
	
	loadIcons: function(){
		var self = this, o = this.options;
		this.files.empty();
		$.each(o.value, function(k,v){
			if(!v._del){
				self._addIcon(v);
			}
		});
		if(o.mode == "edit" || o.mode == "design"){
			var size = this.files.children().size();
			if((size < o.maxCount)||(size<1 && o.maxCount==1)){
				var li = $("<li/>").attr("data-id", "uploadButton");
			    $("<img/>").css({width:o.itemWidth, height:o.itemHeight}).attr("src", "stylesheets/images/selection.png").appendTo(li);
//			    $("<strong/>").text("Upload...").appendTo(li);
			    li.appendTo(this.files);
			}
		}
	},
	
	_addIcon:function(file){
		var o = this.options, li = $("<li/>").attr("data-id", file._id), 
		    imgsrc = "stylesheets/images/file.png", href = "";
		if(file._tmp){
			href = "/tmp/"+file._id;
			if(/^image\/.*/.test(file["contentType"])){
				imgsrc = href;
			}
		}else if(file.metadata){
			href = o.url+"/"+file.metadata.filepath;
			if(/^image\/.*/.test(file["contentType"])){
				imgsrc = href;
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
	    li.appendTo(this.files);
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
		this.content.undelegate(".filefield");
		this.element.removeClass( "an-filefield wrapper");
		return $.an.inputfield.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
