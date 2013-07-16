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

(function($) {
  $.ans = $.ans || {};

  function httpData( xhr, type, s ) {
	  var ct = xhr.getResponseHeader("content-type") || "",
	      xml = type === "xml" || !type && ct.indexOf("xml") >= 0,
	      data = xml ? xhr.responseXML : xhr.responseText;
	  if ( xml && data.documentElement.nodeName === "parsererror" ) {
		  jQuery.error( "parsererror" );
	  }
	  // Allow a pre-filtering function to sanitize the response
	  // s is checked to keep backwards compatibility
	  if ( s && s.dataFilter ) {
		  data = s.dataFilter( data, type );
	  }
	  // The filter can actually parse the response
	  if ( typeof data === "string" ) {
		  // Get the JavaScript object, if JSON is used.
		  if ( type === "json" || !type && ct.indexOf("json") >= 0 ) {
			  data = jQuery.parseJSON( data );
			  // If the type is "script", eval it in global context
		  } else if ( type === "script" || !type && ct.indexOf("javascript") >= 0 ) {
			  jQuery.globalEval( data );
		  }
	  }
	  return data;
  };

  function prepareUserDoc(user_doc, new_password) {
    if (typeof hex_sha1 == "undefined") {
      alert("creating a user doc requires sha1.js to be loaded in the page");
      return;
    }
    var user_prefix = "org.notesdb.user:";
    user_doc._id = user_doc._id || user_prefix + user_doc.name;
    if (new_password) {
      // handle the password crypto
      user_doc.salt = $.notes.newUUID();
      user_doc.password_sha = hex_sha1(new_password + user_doc.salt);
    }
    user_doc.type = "user";
    if (!user_doc.roles) {
      user_doc.roles = [];
    }
    return user_doc;
  };

  // Convert a options object to an url query string.
  // ex: {key:'value',key2:'value2'} becomes '?key="value"&key2="value2"'
  function encodeOptions(options) {
    var buf = [];
    if (typeof(options) === "object" && options !== null) {
      for (var name in options) {
        var value = options[name];
        if(typeof(value === "object")){
        	value = toJSON(value);
        }
       buf.push(encodeURIComponent(name) + "=" + encodeURIComponent(value));
      }
    }
    return buf.length ? "?" + buf.join("&") : "";
  }

  function toJSON(obj) {
    return obj !== null ? JSON.stringify(obj) : null;
  }

  function ajax_get(url,callback,options){
  	$.ajax($.extend(true,{
		type: "GET",
		url: url,
		cache:!($.browser.msie),
		dataType: "json",
		complete: function(req) {
			var resp = httpData(req, "json"), err, result;
			if (req.status == 200) {
				result = resp;
			} else {
				err = {status: req.status, error:resp.error, reason:resp.reason};
			}
			callback(err, result);
		}
	},options));
  }

  function ajax_post(url,doc,callback){
	  $.ajax({
		  type: "POST",
		  url: url,
		  dataType: "json",
		  contentType: "application/json",
		  data: JSON.stringify(doc),
		  complete: function(req) {
			  var resp = httpData(req, "json"), err = null, result = null;
			  if (req.status == 201 || req.status == 200) {
				  result = resp;
			  } else {
				  err = {status: req.status, error:resp.error, reason:resp.reason};
			  }
			  callback(err, result,resp);
		  }
	  });
  }

  function ajax_put(url,doc,callback){
	  $.ajax({
		  type: "PUT",
		  url: url,
		  dataType: "json",
		  contentType: "application/json",
		  data: JSON.stringify(doc),
		  complete: function(req) {
			  var resp = httpData(req, "json"), err, result;
			  if (req.status == 200) {
				  result = resp;
			  } else {
				  err = {status: req.status, error:resp.error, reason:resp.reason};
			  }
			  callback(err, result);
		  }
	  });
  }

  function ajax_del(url,callback){
	  $.ajax({
		  type: "DELETE",
		  url: url,
		  dataType: "json",
		  complete: function(req) {
			  var resp = httpData(req, "json"), err, result;
			  if (req.status == 200) {
				  result = resp;
			  } else {
				  err = {status: req.status, error:resp.error, reason:resp.reason};
			  }
			  callback(err, result);
		  }
	  });
  }

  // TODO 规范接口错误消息
  $.extend($.ans, {

    login: function(loginInfo, callback){
    	ajax_post("/login", loginInfo, callback);
    },

    logout: function(callback){
    	ajax_get("/logout", callback);
    },

    dbAttachmentUri: function(dbId,filepath){
    	return "/dbs/"+Model.ADMINDBID+"/"+dbId+"/attachments/" + filepath;
    },

    getDB: function(dbId, options, callback){
    	options = options || {};
    	$.extend(true, options, {selector:{type:Model.DATABASE}});
    	ajax_get("/dbs/"+Model.ADMINDBID+"/"+(dbId||encodeOptions(options)),callback);
    },

    postDB: function(dbdoc, callback){
    	ajax_post("/dbs/"+Model.ADMINDBID, dbdoc, function(err,result){
    		callback(err,result);
    		if(!err) $(document).trigger("databaseCreated",result);
    	});
    },

    putDB: function(dbId, dbdoc, options, callback){
    	options = options || {};
    	$.extend(true, options, {selector:{type:Model.DATABASE}});
    	ajax_put("/dbs/"+Model.ADMINDBID+"/"+(dbId||encodeOptions(options)),dbdoc,function(err,result){
    		callback(err,result);
    		if(!err) $(document).trigger("databaseChanged",dbdoc);
    	});
    },

   delDB: function(dbId, options, callback){
	   options = options || {};
	   $.extend(true, options, {selector:{type:Model.DATABASE}});
    	ajax_del("/dbs/"+Model.ADMINDBID+"/"+(dbId||encodeOptions(options)), function(err,result){
    		callback(err,result);
    		if(!err) $(document).trigger("databaseDeleted",{_id:dbId});
    	});
    },

   getDBAttachment: function(dbId, attachment){},

   postDBAttachment: function(db, input,options){
		var form = $('<form action="" method="POST"></form>')
		           .append(input.clone().attr("name","attachment"));
		var o = {url: "/dbs/"+Model.ADMINDBID+"/"+db._id+"/attachments"};
		$.extend(o, options);
		form.ajaxSubmit(o);
   },

   delDBAttachment: function(dbId, attachment){},

   getDoc: function(dbId, docId, options, callback){
	   var ajaxOptions = {}, url = "/dbs/"+dbId;
	   if(options && options.headers){
		   $.extend(ajaxOptions,{headers:options.headers});
		   delete options.headers;
	   }
	   if(docId) url += "/"+docId;
	   if(options) url += encodeOptions(options);
	   ajax_get(url, callback, ajaxOptions);
   },

   postDoc: function(dbId, doc, options, callback){
	   if( options && options.redirect){
		  $.ajax({
			  type: "POST", 
			  url: '/dbs/'+dbId, 
			  dataType: "json",
			  contentType: "application/json",
			  data: JSON.stringify(doc),
			  success: function(result) {
				 callback(result);
			  }
		  });
	   }else{
		ajax_post("/dbs/"+dbId+encodeOptions(options), doc, function(err,result){
   	       callback(err,result);
		   if(!err) $(document).trigger("documentCreated",doc);
	    });
	   }
   },

   putDoc: function(dbId, docId, fields, options, callback){
	   var url = "/dbs/"+dbId+"/"+docId;
	   if(options) url += encodeOptions(options);
	   ajax_put(url, fields,function(err,result){
   		   callback(err,result);
		   if(!err) $(document).trigger("documentChanged", fields);
	   });
   },

   delDoc: function(dbId, docId, options, callback){
	   var url = "/dbs/"+dbId;
	   if(docId) url += "/"+docId;
	   if(options) url += encodeOptions(options);
	   ajax_del(url, function(err,result){
   		   callback(err,result);
		   if(!err) $(document).trigger("documentDeleted",{_id:docId});
	   });
   },

   getAttachmentPath: function(dbId,docId,attachment){
	   return "/dbs/"+dbId+"/"+docId+"/attachments/"+attachment;
   },

   delAttachment: function(dbId,docId,attachment){},

   getTempPath: function(filename){
	   return "/tmp/"+filename;
   },

   postTemp: function(input, options){
	   var form = $('<form action="" method="POST"></form>').append(input.attr("name","file")),
	       o = {url: "/tmp"};
	   $.extend(o, options);
	   form.ajaxSubmit(o);
   },
   downPdf:function(url) {
	   window.location.href = url;
   }
  });

})(jQuery);
