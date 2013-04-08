module.exports = function (jQuery) {  
	/**
	 * Sets the type of metadata to use. Metadata is encoded in JSON, and each property
	 * in the JSON will become a property of the element itself.
	 *
	 * There are two supported types of metadata storage:
	 *
	 *   attr:  Inside an attribute. The name parameter indicates *which* attribute.
	 *          
	 *   elem:  Inside a child element (e.g. a script tag). The name parameter indicates *which* element.
	 *          
	 * The metadata for an element is loaded the first time the element is accessed via jQuery.
	 *
	 * As a result, you can define the metadata type, use $(expr) to load the metadata into the elements
	 * matched by expr, then redefine the metadata type and run another $(expr) for other elements.
	 * 
	 * @name $.metadata.setType
	 *
	 * @example <p id="one" class="some_class" data="{item_id: 1, item_label: 'Label'}">This is a p</p>
	 * @before $.metadata.setType("attr", "data")
	 * @after $("#one").metadata().item_id == 1; $("#one").metadata().item_label == "Label"
	 * @desc Reads metadata from a "data" attribute
	 * 
	 * @example <p id="one" class="some_class"><script>{item_id: 1, item_label: 'Label'}</script>This is a p</p>
	 * @before $.metadata.setType("elem", "script")
	 * @after $("#one").metadata().item_id == 1; $("#one").metadata().item_label == "Label"
	 * @desc Reads metadata from a nested script element
	 * 
	 * @param String type The encoding type
	 * @param String name The name of the attribute to be used to get metadata (optional)
	 * @cat Plugins/Metadata
	 * @descr Sets the type of encoding to be used when loading metadata for the first time
	 * @type undefined
	 * @see metadata()
	 */

	(function($) {

	$.extend({
		metadata : {
			defaults : { type: 'attr', name: 'metadata', single: 'metadata' },
			setType: function( type, name ){
				this.defaults.type = type;
				this.defaults.name = name;
			},
			get: function( elem, opts ){
				var settings = $.extend({},this.defaults,opts),elem = $(elem);
				settings.single = settings.single||'metadata';
				
				var data = $.data(elem, settings.single);
				if (!$.isEmptyObject(data)) return data;  // returned cached data if it already exists
				
				data = "{}";
				if ( settings.type == "elem" ) {
					data = $.trim(elem.find(settings.name+"[type='text/json']").text())||data;
				} else if (settings.type == "attr" ) {
					data = elem.attr(settings.name)||data;
				}
				
				if ( data.indexOf( '{' ) <0 ) data = "{" + data + "}";
				try{data = eval("(" + data + ")");}catch(e){};
				if(!$.isEmptyObject(data)){
					$.data( elem, settings.single, data );
				}
				return data;
			},
			set:function(elem, metadata,opts){
				var settings = $.extend({},this.defaults,opts),elem = $(elem);
				settings.single = settings.single||'metadata';
				if ( settings.type == "elem" ) {
					elem.find("script[type='text/json']").remove();
					if(!$.isEmptyObject(metadata)){
						elem.html("<script type='text/json'>"+$.toJSON(metadata)+"</script>");
					}
				} else if (settings.type == "attr" ) {
					elem.removeAttr(settings.name);
					if(!$.isEmptyObject(metadata)){
						elem.attr(settings.name, $.toJSON(metadata));
					}
				}
				$.data(elem,settings.single,metadata);
			}
		}
	});

	// return the metadata of first element.
	$.fn.metadata = function( opts ){
		return $.metadata.get(this, opts ); 
	};
	$.fn.getMetadata = function( opts ){
		return $.metadata.get(this, opts ); 
	};

	$.fn.setMetadata = function( metadata, opts ){
		$.metadata.set( this, metadata, opts );
	};

	})(jQuery);
};
