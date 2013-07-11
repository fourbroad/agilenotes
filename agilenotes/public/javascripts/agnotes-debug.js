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

var Model = {
    ADMINDBID: "000000000000000000000000",

    META: "000000000000000000000001",
    FORM: "000000000000000000000002",
    VIEW: "000000000000000000000003",
    PAGE: "000000000000000000000004",
    TASK: "000000000000000000000005",
    USER: "000000000000000000000006",
    OU: "000000000000000000000007",
    GROUP: "000000000000000000000008",
    ROLE: "000000000000000000000009",
    SIDE_VIEW: "00000000000000000000000a",
//    ACTION: "00000000000000000000000b",
    VALIDATE_METHOD:"00000000000000000000000c",
    EXTENSION_POINT: "00000000000000000000000d",
    CATEGORY: "00000000000000000000000e",
    DATABASE: "00000000000000000000000f",

    META_ROOT: "0000000000000000000e0001",
    FORM_ROOT: "0000000000000000000e0002",
    VIEW_ROOT: "0000000000000000000e0003",
    PAGE_ROOT: "0000000000000000000e0004",
    TASK_ROOT: "0000000000000000000e0005",
    OU_ROOT: "0000000000000000000e0007",
    GROUP_ROOT: "0000000000000000000e0008",
    ROLE_ROOT: "0000000000000000000e0009",
    SIDE_VIEW_ROOT: "0000000000000000000e000a",
    EXTENSION_ROOT: "0000000000000000000e000b",
    DATABASE_ROOT: "0000000000000000000e000f",

    // Cache of dbs, document type, page(form), view, side view.
    dbs:{},
    types:{},
    pages:{},
    views:{},
    sideViews:{},
    extension:{},
    
    rootId:function(typeId){
    	if(typeId == this.META){
    		return this.META_ROOT;
    	}else	if(typeId == this.FORM){
    		return this.FORM_ROOT;
    	}else	if(typeId == this.VIEW){
    		return this.VIEW_ROOT;
    	}else	if(typeId == this.PAGE){
    		return this.PAGE_ROOT;
    	}else	if(typeId == this.TASK){
    		return this.TASK_ROOT;
    	}else if(typeId == this.OU || typeId == this.USER){
    		return this.OU_ROOT;
    	}else if(typeId == this.GROUP){
    		return this.GROUP_ROOT;
    	}else if(typeId == this.ROLE){
    		return this.ROLE_ROOT;
    	}else if(typeId == this.SIDE_VIEW){
    		return this.SIDE_VIEW_ROOT;
    	}else if(typeId == this.EXTENSION_POINT){
    		return this.EXTENSION_ROOT;
    	}else if(typeId == this.DATABASE){
    		return this.DATABASE_ROOT;
    	}
    },

    getDb:function(dbId, callback){
    	if(this.dbs[dbId]){
    		callback(null,this.dbs[dbId]);
    	}else{
    		var self =this;
        	$.ans.getDB(dbId,null,function(error,db){
        		if(db) self.dbs[dbId] = db;
        		callback(error,db);
        	});
    	}
    },
    
    getPages: function(dbId, ids, callback){
    	var self = this, sel = {$or:[]}, pages = [], page;
    	for(var f in ids){
    		page = this.pages[ids[f]];
    		if(page){
    			pages.push(page);
    		}else{
    			sel.$or.push({_id:ids[f]});
    		}
    	}
    	
    	function sort(ids, pages){
    		var sortedPages=[];
    		if(pages.length>0){
    			for(var i in ids){
    				for(var j in pages){
    					if(pages[j]._id == ids[i]){
    						var type = pages[j].type; 
    						if(type == Model.PAGE||type == Model.FORM){
        						sortedPages.push(pages[j]);
        						self.pages[pages[j]._id] = pages[j];
    						}
    						break;
    					}
    				}
    			}
    		}					
    		return sortedPages;
    	}
    	
    	if(sel.$or.length>0){
        	$.ans.getDoc(dbId, null, {selector:sel},function(err, data){
        		callback(err, sort(ids, pages.concat(data.docs)));
        	});
    	}else{
    		callback(null, sort(ids, pages));
    	}
    },
    
    loadExtensions: function(dbId, extensionPoints, callback){
    	var self = this, sel = {$or:[]}, exts = {};
    	$.each(extensionPoints, function(){
    		if(self.extension[dbId]&&self.extension[dbId][this]){
    			exts[this] = self.extension[dbId][this];
    		}else{
        		sel.$or.push({extensionPoint:this});
    		}
    	});
    	if(sel.$or.length > 0){
        	$.ans.getDoc(dbId, null, {selector:sel},function(err,data){
        		if(data){
        			$.each(data.docs,function(){
        				self.extension[dbId] = self.extension[dbId]||{};
        				self.extension[dbId][this.extensionPoint] = exts[this.extensionPoint]=exts[this.extensionPoint]||[]; 
        				exts[this.extensionPoint].push(this);
        			});
        		}
        		callback(err, exts);
        	});
    	}else{
    		callback(null, exts);
    	}
    },

    newDocument: function(element, dbId, typeId, opts){
    	opts = opts ||{};
    	opts.isNew = true;
    	var self = this, rootId = Model.rootId(typeId), 
    	doc = $.extend(true, {}, opts["default"],{_id: opts.id || new ObjectId().toString(), type: typeId});
    	if(doc._path){
    		doc._path = doc._path.replace(/[^,]+,$/, doc._id+",");
    	}else if(rootId){
    		doc._path = rootId+","+doc._id+",";
    	}

    	function openDoc(doc){
    		if(doc.type == self.FORM || doc.type == self.PAGE){
    			doc.content = doc.content||"";
    			self._doOpenPage(element, dbId, doc, $.extend(true,{mode:"design"},opts));
    		}else if(doc.type == self.VIEW){
    			doc.viewType = opts.viewType;
    			self._doOpenView(element, dbId, doc, $.extend(true,{mode:"design"},opts));
    		}else{
    			self._doOpenDocument(element, dbId, doc, $.extend(true,{mode:"edit"},opts));
    		}
    	}
    	
    	if($.type(opts.parent) == "string"){
    		$.ans.getDoc(dbId, opts.parent, null,function(err, p){
    			if(err){
    				console.log("Get parent document "+ opts.parent + " error:"+err);
    			}else{
    				if(p && p._path) doc._path = p._path+doc._id+",";
    				openDoc(doc);
    			}
    		});
    	}else{
    		if(opts.parent && opts.parent._path) doc._path = opts.parent._path+doc._id+",";
			openDoc(doc);
    	}
    },

    _doOpenDocument: function(element, dbId, doc, opts){
    	var optsx = $.extend(true, { 
			title: opts.title || doc.title||doc.name || doc._id, 
			dbId: dbId,
			document: doc,
			isDocumentEditor: true
		}, opts), self = this;
		if(optsx.formIds){
			this.getPages(dbId, optsx.formIds, function(err, forms){
				if(err){
					console.log("Load forms "+optsx.formIds+" error: "+err);
				}else{
					optsx.forms = forms;
					element.editor(optsx);
					optsx.opened && optsx.opened(element.data("editor"));
				}
			});
		}else{
			var type = this.types[doc.type];
			function openEditor(type){
		    	if(optsx.isNew){
					var obj=type.defaultValues||"{}";
					$.extend(true, optsx.document, eval("(" + obj + ")"));
				}
				self.getPages(dbId, (type.forms&&type.forms.split(","))||[], function(err, forms){
					if(err){
						console.log("Load forms "+type.forms+" error: "+err);
					}else{
						optsx.mobile = doc.mobile;
						optsx.forms = forms;
						element.editor(optsx);
						opts.opened && opts.opened(element.data("editor"));
					}
				});
			}
			if(type){
				openEditor(type);
			}else{
    			$.ans.getDoc(dbId, doc.type, null, function(err, type){
    				if(err || !type){
    					console.log("Load document type "+ doc.type + " error: "+err);
    				}else{
    					self.types[doc.type] = type;
        				openEditor(type);
    				}
    			});
			}
		}
    },
    
    openDocument: function(element, dbId, docId, opts){
    	opts = opts||{};
    	var self = this;
    	if(!docId&&opts.document){
			this._doOpenDocument(element, dbId, opts.document, opts);
    	}else{
        	$.ans.getDoc(dbId, docId, null, function(err,doc){
        		if(err){
        			console.log("Load document "+ docId + " error: "+err);
        		}else{
        			self._doOpenDocument(element, dbId, doc, opts);
        		}
        	});	
    	}
    },

    _doOpenPage: function(element, dbId, page, opts){
    	var self = this, title = opts.title || page.title || page.name ||  page._id, 
    	type = this.types[page.type];

    	function openEditor(type){
			if(opts.mode == "design"){
	    		self.getPages(dbId, (type.forms&&type.forms.split(","))||[], function(err, forms){
	    			if(err){
	    				console.log("Load forms "+type.forms+" error: "+err);
	    			}else{
				    	if(opts.isNew) $.extend(true, page, eval("("+type.defaultValues+")"||"{}"));
	    				element.editor($.extend(true, {title:title, dbId:dbId, document:page, forms:forms, design:true}, $.extend(true,{},opts,{mode:'edit'})));
	    				opts.opened && opts.opened(element.data("editor"));
	    			}
	    		});
			}else{
		    	if(page.type==Model.PAGE){
					if(opts.mobile){
						element.mpage($.extend(true, {title:title, dbId:dbId, page:page, mobile:true}, opts));
						opts.opened && opts.opened(element.data("mpage"));
					}else{
						element.page($.extend(true, {title:title, dbId:dbId, page:page}, opts));
						opts.opened && opts.opened(element.data("page"));
					}
					
		    	}else if(page.type == Model.FORM){
					var doc = {};
			    	if(opts.isNew) $.extend(true, doc, eval("("+type.defaultValues+")"||"{}"));
					element.editor($.extend(true, {title:title, dbId:dbId, document:doc, forms:[page]}, opts));
					opts.opened && opts.opened(element.data("editor"));
		    	}
			}   
    	}

    	if(type){
    		openEditor(type);
    	}else{
    		$.ans.getDoc(dbId, page.type, null, function(err,type){
    			if(err){
    				console.log("Load document type "+page.type+" error: "+ err);
    			}else{
    				self.types[page.type] = type;
    				openEditor(type);
    			}
    		});
    	}
    },

    openPage: function(element, dbId, pageId, opts){
    	opts = opts || {};
    	var self = this;
    	if(this.pages[pageId]){
    		opts.mobile = this.pages[pageId].mobile;
    		this._doOpenPage(element, dbId, this.pages[pageId], opts);
    	}else{
    		$.ans.getDoc(dbId, pageId, null, function(err, page){
    			if(err){
    				console.log("Load page "+ pageId+" error: "+err);
    			}else{
    				self.pages[pageId] = page;
    				opts.mobile = page.mobile;
    				self._doOpenPage(element, dbId, page, opts);
    			}
    		});
    	}
    },

    _doOpenView:function(element, dbId, view, opts){
    	var self = this;
    	function openView(element, dbId, viewDoc, opts){
    		var title = viewDoc.title || viewDoc.name || viewDoc._id, vt = viewDoc.viewType||"gridview";
    		vt = vt.toLowerCase();
    		if(opts.mode == "design"){
    			function openEditor(type){
    		    	if(opts.isNew) $.extend(true, viewDoc, eval("("+type.defaultValues+")"||"{}"));
    				self.getPages(dbId, (type.forms&&type.forms.split(","))||[], function(err, forms){
    					if(err){
    						console.log("Load forms "+type.forms+" error: "+err);
    					}else{
    						if (opts.mobile) {
    							var cb = viewDoc.viewType;
    							if (cb == 'mobilelistview') {
    								element.mobilelistview({view:viewDoc, dbId:dbId, mode:"design"});
    							} else if (cb == 'customview') {
    								element.customview({view:viewDoc, dbId:dbId, mode:"design"});
    							} else {
    								element.view({view:viewDoc, dbId:dbId, mode:"design"});
    							}
    							
    							opts.opened && opts.opened(element.data(cb));
    						} else {
    							element.editor($.extend(true, { title:title, dbId:dbId, document:viewDoc, forms:forms, design:true, isViewEditor:true}, $.extend(true,{},opts,{mode:"edit"})));
        						opts.opened && opts.opened(element.data("editor"));
    						}
    					}
    				});
    			}
    			var type = self.types[viewDoc.type];
    			if(type){
    				openEditor(type);
    			}else{
    				$.ans.getDoc(dbId, viewDoc.type, null, function(err,type){
    					if(err){
    						console.log("Load document type "+ viewDoc.type+" error: "+err);
    					}else{
    						self.types[viewDoc.type] = type;
    						openEditor(type);
    					}
    				});
    			}
    		}else{
    			vt = (vt=="customizedview"?"view":vt);
    			element[vt]($.extend(true, { title: title, dbId: dbId, view: viewDoc, isViewEditor:true }, opts));
    			opts.opened && opts.opened(element.data(vt));
    		}
    	}

    	if(view.viewType == "formView"){
    		var form = this.pages[view.formId];
    		if(form){
				opts.form = form;
				openView(element, dbId, view, opts);
    		}else{
        		$.ans.getDoc(dbId,view.formId,null, function(err,form){
        			if(err){
        				console.log("Load form "+view.formId+" error: "+err);
        			}else{
        				opts.form = self.pages[view.formId] = form;
        				openView(element, dbId, view, opts);
        			}
        		});
    		}
    	}else{
    		openView(element, dbId, view, opts);
    	}
    },

    openView: function(element, dbId, viewId, opts){
    	opts = opts || {};
    	var self = this, view = this.views[viewId];
    	if(view){
    		this._doOpenView(element, dbId, view, opts);
    	}else{
    		$.ans.getDoc(dbId, viewId, null, function(err, view){
    			if(err){
    				console.log("Load view "+viewId+" error: "+err);
    			}else{
    				self.views[viewId] = view;
    				self._doOpenView(element, dbId, view, opts);
    			}
    		});
    	}
    },

    _doOpenSideView:function(element, dbId, sideView, opts){
		if(sideView){
			element.sideview($.extend(true, {dbId:dbId}, sideView, opts));
			opts.opened && opts.opened(element.data("sideview"));
		}
    },

    openSideView: function(element, dbId, sideViewId, opts){
    	opts = opts || {};
    	var self = this, sideView = this.sideViews[sideViewId];
    	if(sideView){
    		this._doOpenSideView(element, dbId, sideView, opts);
    	}else{
        	$.ans.getDoc(dbId, sideViewId, null, function(err, sideView){
        		if(err){
        			console.log("Load side view "+sideViewId + " error: "+err);
        		}else{
        			self.sideViews[sideViewId] = sideView;
        			self._doOpenSideView(element, dbId, sideView, opts);
        		}
        	});
    	}
    },
    
    postDocument:function(dbId, doc, opts, callback){
		$.ans.postDoc(dbId, doc, opts, callback);
    },
    
    updateDocument:function(dbId, docId, fields,opts,callback){
    	this._cleanCache(docId);
		$.ans.putDoc(dbId, docId, fields,opts,callback);
    },
    
    deleteDocument:function(dbId, docId, options, callback){
    	this._cleanCache(docId);
    	$.ans.delDoc(dbId, docId, options, callback);
    },
    
    _cleanCache:function(docId){
    	delete this.types[docId];
        delete this.pages[docId];
        delete this.views[docId];
        delete this.sideViews[docId];
    }
};

function DocWrapper(doc, parseDot){
	this._doc = doc;
	this._parseDot = parseDot;

	this.setDoc = function(doc){
		var oldDoc = this._doc;
		this._doc = doc;
		$(this).trigger("docchanged", [doc, oldDoc]);
	};
	this.getDoc = function(){return this._doc;};

	this.prop = function(id, value, isTransient){
		if(!id) return null;
		if(value === undefined){
			try{return eval("this._doc."+id);}catch(e){};
		}else {
			var oldValue = this.prop(id);
			if(value == oldValue) return this;
			if(this._parseDot){
				var parts = id.split(".");
				function assign(doc,parts,val){
					var part = parts.shift(), r =part.match(/([a-zA-Z0-9_]+)\[([0-9]+)\]/); 
					if(r){
						doc[r[1]]=doc[r[1]]||[];
						if(parts.length > 0){
							doc[r[1]][r[2]]=doc[r[1]][r[2]]||{};
							assign(doc[r[1]][r[2]], parts, val);
						}else{
							doc[r[1]][r[2]]=val;
						}
					}else{
						if(parts.length > 0){
							doc[part]=doc[part]||{};
							assign(doc[part], parts, val);
						}else{
							doc[part]=val;
						}
					}
				}
				assign(this._doc, parts,value);
			}else{
				this._doc[id] = value;
			}
			$(this).trigger("propchanged", [id, value, oldValue,isTransient]);
		}
	};
}
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
Date.prototype.format = function(fmt){  //args:yyyy-mm-dd hh:MM:ss
  var o = {   
    "m+" : this.getMonth()+1,                 //月份   
    "d+" : this.getDate(),                    //日   
    "h+" : this.getHours(),                   //小时   
    "M+" : this.getMinutes(),                 //分   
    "s+" : this.getSeconds(),                 //秒   
    "q+" : Math.floor((this.getMonth()+3)/3), //季度   
    "S"  : this.getMilliseconds()             //毫秒   
  };   
  if(/(y+)/.test(fmt))   
    fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));   
  for(var k in o)   
    if(new RegExp("("+ k +")").test(fmt))   
  fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));   
  return fmt;   
} 
Date.prototype.add=function(obj){
	var y=this.getFullYear(),m=this.getMonth()+1,days=this.getDate(),d=0;
	if(typeof obj !='object'){return this;}
	for(var q in obj){
		if(q=='year'){
			y += obj[q];
		}else if(q=='month'){
			m += obj[q];
                        if(m>12){
                               y += parseInt(m/12);
                               m=m%12;
                        }
                        if(m<1){
                               y += parseInt(m/12)-1;
                               m=12+m%12;
                        }
		}else if(q=='day'){
			d += obj[q];
		}
	}
	return new Date(new Date(y+"/"+m+"/"+days).getTime()+d*24*60*60*1000);
}
function emptyEqual(a1,a2){  
	if(a1 === null && a2 === null)  
		return 1;  
	else if(a1 === null || a2 === null)  
		return -1;  
	if(a1 === undefined && a2 === undefined)  
		return 1;  
	else if(a1 === undefined || a2 === undefined)  
		return -1;  
	if(a1 === '' && a2 === '')  
		return 1;  
	else if(a1 === '' || a2 === '')  
		return -1;  
	return 0;  
}  
function isBothObject(a1,a2){  
	if(typeof a1 === 'object' && typeof a2 === 'object')  
		return 0;  
	else if(typeof a1 === 'object' || typeof a2 === 'object')  
		return -1;
	return 1;
}  
function equals(a1,a2){  
	var flag = 0;  
	var result = true;  
	flag = emptyEqual(a1,a2);  
	if(flag == 1)  
		return true;  
	else if(flag == -1)  
		return false;  
	flag = isBothObject(a1,a2);  
	if(flag == -1)  
		return false;  
	if(flag == 1){  
		if(a1 === a2)  
			return true;  
		else  
			return false;  
	}else{  
		for(var i in a1){  
			var oResult = arguments.callee(a1[i],a2[i]);
			if(!oResult){  
				result = false;  
				break;  
			}  
		}  
		for(var i in a2){  
			var oResult = arguments.callee(a2[i],a1[i]);
			if(!oResult){  
				result = false;  
				break;  
			}  
		}  
	}  
	return result;  

}

function getUrlParam(name) {
	var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"), r = window.location.search.substr(1).match(reg);
	return r != null? unescape(r[2]):null;
} 

function attributes(node){
	var attrs = {}, as = node.attributes;
	for(var i=0; i < as.length; i++) {
		if(as[i].name !="metadata") attrs[as[i].name] = as[i].value;
	}
	return attrs;
}

function print(url){
    var printer = $("body").children("iframe#printer");
		if(printer.length == 0) printer = $("<iframe id='printer'>").hide().appendTo("body");
		printer.attr("src", url);
}

function showDialog(title, message, opts){
	var lng=window.database.local;
	opts = opts||{};
	var buttons = [];
	$.each(opts.buttons||[],function(){
		var btn = this;
		buttons.push({text:btn.text, click:function(){ btn.handler&&btn.handler($( this ).data("dialog")); }});
	});
	
	var txtCon="OK";
	if(lng&&lng!='en'){
		txtCon=$.i18n.dialog.ok;
	}
	if(buttons.length == 0){
		buttons.push({text:txtCon,click:function(){$( this ).dialog( "close" );}});
	}
	
	$("<div/>").dialog({
		title: title,
		height: 220,
		width: 360,
		modal: true,
		create: function(event, ui){ $(this).html(message); },
		buttons: buttons,
		close:function(e,ui){$(this).remove();}
	});
}
function openDialog(dbId,id,opts,method){
	$("<div/>").dialog($.extend(true,{
		height: 220,
		width: 360,
		modal: true,
		create: function(event, ui){ 
			Model[method]($(this), dbId, id, opts);
		},
		buttons: [{
			text:"OK",
			click:function(){
				$( this ).dialog( "close" );
			}
		}],
		close:function(e,ui){$(this).remove();}
	},opts));
}
function newDocument(dbId,typeId, opts){
	openDialog(dbId,typeId,opts,'newDocument');
}
function openDocument(dbId,docId, opts){
	openDialog(dbId,docId,opts,'openDocument');
}
var openPage,openView,openPage,openSideView;
openForm=openPage=function(dbId,sid, opts){
	openDialog(dbId,sid,opts,'openPage');
};
openView=function(dbId,sid, opts){
	openDialog(dbId,sid,opts,'openView');
};
openSideView=function(dbId,sid, opts){
	openDialog(dbId,sid,opts,'openSideView');
};

/*
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */
var hexcase=0;function hex_md5(a){return rstr2hex(rstr_md5(str2rstr_utf8(a)))}function hex_hmac_md5(a,b){return rstr2hex(rstr_hmac_md5(str2rstr_utf8(a),str2rstr_utf8(b)))}function md5_vm_test(){return hex_md5("abc").toLowerCase()=="900150983cd24fb0d6963f7d28e17f72"}function rstr_md5(a){return binl2rstr(binl_md5(rstr2binl(a),a.length*8))}function rstr_hmac_md5(c,f){var e=rstr2binl(c);if(e.length>16){e=binl_md5(e,c.length*8)}var a=Array(16),d=Array(16);for(var b=0;b<16;b++){a[b]=e[b]^909522486;d[b]=e[b]^1549556828}var g=binl_md5(a.concat(rstr2binl(f)),512+f.length*8);return binl2rstr(binl_md5(d.concat(g),512+128))}function rstr2hex(c){try{hexcase}catch(g){hexcase=0}var f=hexcase?"0123456789ABCDEF":"0123456789abcdef";var b="";var a;for(var d=0;d<c.length;d++){a=c.charCodeAt(d);b+=f.charAt((a>>>4)&15)+f.charAt(a&15)}return b}function str2rstr_utf8(c){var b="";var d=-1;var a,e;while(++d<c.length){a=c.charCodeAt(d);e=d+1<c.length?c.charCodeAt(d+1):0;if(55296<=a&&a<=56319&&56320<=e&&e<=57343){a=65536+((a&1023)<<10)+(e&1023);d++}if(a<=127){b+=String.fromCharCode(a)}else{if(a<=2047){b+=String.fromCharCode(192|((a>>>6)&31),128|(a&63))}else{if(a<=65535){b+=String.fromCharCode(224|((a>>>12)&15),128|((a>>>6)&63),128|(a&63))}else{if(a<=2097151){b+=String.fromCharCode(240|((a>>>18)&7),128|((a>>>12)&63),128|((a>>>6)&63),128|(a&63))}}}}}return b}function rstr2binl(b){var a=Array(b.length>>2);for(var c=0;c<a.length;c++){a[c]=0}for(var c=0;c<b.length*8;c+=8){a[c>>5]|=(b.charCodeAt(c/8)&255)<<(c%32)}return a}function binl2rstr(b){var a="";for(var c=0;c<b.length*32;c+=8){a+=String.fromCharCode((b[c>>5]>>>(c%32))&255)}return a}function binl_md5(p,k){p[k>>5]|=128<<((k)%32);p[(((k+64)>>>9)<<4)+14]=k;var o=1732584193;var n=-271733879;var m=-1732584194;var l=271733878;for(var g=0;g<p.length;g+=16){var j=o;var h=n;var f=m;var e=l;o=md5_ff(o,n,m,l,p[g+0],7,-680876936);l=md5_ff(l,o,n,m,p[g+1],12,-389564586);m=md5_ff(m,l,o,n,p[g+2],17,606105819);n=md5_ff(n,m,l,o,p[g+3],22,-1044525330);o=md5_ff(o,n,m,l,p[g+4],7,-176418897);l=md5_ff(l,o,n,m,p[g+5],12,1200080426);m=md5_ff(m,l,o,n,p[g+6],17,-1473231341);n=md5_ff(n,m,l,o,p[g+7],22,-45705983);o=md5_ff(o,n,m,l,p[g+8],7,1770035416);l=md5_ff(l,o,n,m,p[g+9],12,-1958414417);m=md5_ff(m,l,o,n,p[g+10],17,-42063);n=md5_ff(n,m,l,o,p[g+11],22,-1990404162);o=md5_ff(o,n,m,l,p[g+12],7,1804603682);l=md5_ff(l,o,n,m,p[g+13],12,-40341101);m=md5_ff(m,l,o,n,p[g+14],17,-1502002290);n=md5_ff(n,m,l,o,p[g+15],22,1236535329);o=md5_gg(o,n,m,l,p[g+1],5,-165796510);l=md5_gg(l,o,n,m,p[g+6],9,-1069501632);m=md5_gg(m,l,o,n,p[g+11],14,643717713);n=md5_gg(n,m,l,o,p[g+0],20,-373897302);o=md5_gg(o,n,m,l,p[g+5],5,-701558691);l=md5_gg(l,o,n,m,p[g+10],9,38016083);m=md5_gg(m,l,o,n,p[g+15],14,-660478335);n=md5_gg(n,m,l,o,p[g+4],20,-405537848);o=md5_gg(o,n,m,l,p[g+9],5,568446438);l=md5_gg(l,o,n,m,p[g+14],9,-1019803690);m=md5_gg(m,l,o,n,p[g+3],14,-187363961);n=md5_gg(n,m,l,o,p[g+8],20,1163531501);o=md5_gg(o,n,m,l,p[g+13],5,-1444681467);l=md5_gg(l,o,n,m,p[g+2],9,-51403784);m=md5_gg(m,l,o,n,p[g+7],14,1735328473);n=md5_gg(n,m,l,o,p[g+12],20,-1926607734);o=md5_hh(o,n,m,l,p[g+5],4,-378558);l=md5_hh(l,o,n,m,p[g+8],11,-2022574463);m=md5_hh(m,l,o,n,p[g+11],16,1839030562);n=md5_hh(n,m,l,o,p[g+14],23,-35309556);o=md5_hh(o,n,m,l,p[g+1],4,-1530992060);l=md5_hh(l,o,n,m,p[g+4],11,1272893353);m=md5_hh(m,l,o,n,p[g+7],16,-155497632);n=md5_hh(n,m,l,o,p[g+10],23,-1094730640);o=md5_hh(o,n,m,l,p[g+13],4,681279174);l=md5_hh(l,o,n,m,p[g+0],11,-358537222);m=md5_hh(m,l,o,n,p[g+3],16,-722521979);n=md5_hh(n,m,l,o,p[g+6],23,76029189);o=md5_hh(o,n,m,l,p[g+9],4,-640364487);l=md5_hh(l,o,n,m,p[g+12],11,-421815835);m=md5_hh(m,l,o,n,p[g+15],16,530742520);n=md5_hh(n,m,l,o,p[g+2],23,-995338651);o=md5_ii(o,n,m,l,p[g+0],6,-198630844);l=md5_ii(l,o,n,m,p[g+7],10,1126891415);m=md5_ii(m,l,o,n,p[g+14],15,-1416354905);n=md5_ii(n,m,l,o,p[g+5],21,-57434055);o=md5_ii(o,n,m,l,p[g+12],6,1700485571);l=md5_ii(l,o,n,m,p[g+3],10,-1894986606);m=md5_ii(m,l,o,n,p[g+10],15,-1051523);n=md5_ii(n,m,l,o,p[g+1],21,-2054922799);o=md5_ii(o,n,m,l,p[g+8],6,1873313359);l=md5_ii(l,o,n,m,p[g+15],10,-30611744);m=md5_ii(m,l,o,n,p[g+6],15,-1560198380);n=md5_ii(n,m,l,o,p[g+13],21,1309151649);o=md5_ii(o,n,m,l,p[g+4],6,-145523070);l=md5_ii(l,o,n,m,p[g+11],10,-1120210379);m=md5_ii(m,l,o,n,p[g+2],15,718787259);n=md5_ii(n,m,l,o,p[g+9],21,-343485551);o=safe_add(o,j);n=safe_add(n,h);m=safe_add(m,f);l=safe_add(l,e)}return Array(o,n,m,l)}function md5_cmn(h,e,d,c,g,f){return safe_add(bit_rol(safe_add(safe_add(e,h),safe_add(c,f)),g),d)}function md5_ff(g,f,k,j,e,i,h){return md5_cmn((f&k)|((~f)&j),g,f,e,i,h)}function md5_gg(g,f,k,j,e,i,h){return md5_cmn((f&j)|(k&(~j)),g,f,e,i,h)}function md5_hh(g,f,k,j,e,i,h){return md5_cmn(f^k^j,g,f,e,i,h)}function md5_ii(g,f,k,j,e,i,h){return md5_cmn(k^(f|(~j)),g,f,e,i,h)}function safe_add(a,d){var c=(a&65535)+(d&65535);var b=(a>>16)+(d>>16)+(c>>16);return(b<<16)|(c&65535)}function bit_rol(a,b){return(a<<b)|(a>>>(32-b))};
function md5(str) {
	return hex_md5(str);
}/*
*
* Copyright (c) 2011 Justin Dearing (zippy1981@gmail.com)
* Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
* and GPL (http://www.opensource.org/licenses/gpl-license.php) version 2 licenses.
* This software is not distributed under version 3 or later of the GPL.
*
* Version 1.0.0
*
*/

/**
 * Javascript class that mimics how WCF serializes a object of type MongoDB.Bson.ObjectId
 * and converts between that format and the standard 24 character representation.
*/
var ObjectId = (function () {
    var increment = 0;
    var pid = Math.floor(Math.random() * (32767));
    var machine = Math.floor(Math.random() * (16777216));

    if (localStorage && typeof (localStorage) != 'undefined') {
        var mongoMachineId = parseInt(localStorage['mongoMachineId']);
        if (mongoMachineId >= 0 && mongoMachineId <= 16777215) {
            machine = Math.floor(localStorage['mongoMachineId']);
        }
        // Just always stick the value in.
        localStorage['mongoMachineId'] = machine;
        document.cookie = 'mongoMachineId=' + machine + ';expires=Tue, 19 Jan 2038 05:00:00 GMT';
    }
    else {
        var cookieList = document.cookie.split('; ');
        for (var i in cookieList) {
            var cookie = cookieList[i].split('=');
            if (cookie[0] == 'mongoMachineId' && cookie[1] >= 0 && cookie[1] <= 16777215) {
                machine = cookie[1];
                break;
            }
        }
        document.cookie = 'mongoMachineId=' + machine + ';expires=Tue, 19 Jan 2038 05:00:00 GMT';

    }

    return function () {
        if (!(this instanceof ObjectId)) {
            return new ObjectId(arguments[0], arguments[1], arguments[2], arguments[3]).toString();
        }

        if (typeof (arguments[0]) == 'object') {
            this.timestamp = arguments[0].timestamp;
            this.machine = arguments[0].machine;
            this.pid = arguments[0].pid;
            this.increment = arguments[0].increment;
        }
        else if (typeof (arguments[0]) == 'string' && arguments[0].length == 24) {
            this.timestamp = Number('0x' + arguments[0].substr(0, 8)),
            this.machine = Number('0x' + arguments[0].substr(8, 6)),
            this.pid = Number('0x' + arguments[0].substr(14, 4)),
            this.increment = Number('0x' + arguments[0].substr(18, 6));
        }
        else if (arguments.length == 4 && arguments[0] != null) {
            this.timestamp = arguments[0];
            this.machine = arguments[1];
            this.pid = arguments[2];
            this.increment = arguments[3];
        }
        else {
            this.timestamp = Math.floor(new Date().valueOf() / 1000);
            this.machine = machine;
            this.pid = pid;
            if (increment > 0xffffff) {
                increment = 0;
            }
            this.increment = increment++;

        }
    };
})();

ObjectId.prototype.getDate = function () {
    return new Date(this.timestamp * 1000);
};

/**
* Turns a WCF representation of a BSON ObjectId into a 24 character string representation.
*/
ObjectId.prototype.toString = function () {
    var timestamp = this.timestamp.toString(16);
    var machine = this.machine.toString(16);
    var pid = this.pid.toString(16);
    var increment = this.increment.toString(16);
    return '00000000'.substr(0, 6 - timestamp.length) + timestamp +
           '000000'.substr(0, 6 - machine.length) + machine +
           '0000'.substr(0, 4 - pid.length) + pid +
           '000000'.substr(0, 6 - increment.length) + increment;
};
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

  // TODO 瑙勮寖鎺ュ彛閿欒娑堟伅
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
   }
  });

})(jQuery);
/**
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
		defaults : { type: 'elem', name: 'script', single: 'script' },
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
				data = $.trim(elem.children(settings.name+"[type='text/json']").html())||data;
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
				elem.children("script[type='text/json']").remove();
				if(!$.isEmptyObject(metadata)){
					$("<script type='text/json'>"+$.toJSON(metadata)+"</script>").prependTo(elem);
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
/**
 * jQuery Validation Plugin 1.9.0
 *
 * http://bassistance.de/jquery-plugins/jquery-plugin-validation/
 * http://docs.jquery.com/Plugins/Validation
 *
 * Copyright (c) 2006 - 2011 J枚rn Zaefferer
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */

(function($) {

$.extend($.fn, {
	// http://docs.jquery.com/Plugins/Validation/validate
	validate: function( options ) {

		// if nothing is selected, return nothing; can't chain anyway
		if (!this.length) {
			options && options.debug && window.console && console.warn( "nothing selected, can't validate, returning nothing" );
			return;
		}

		// check if a validator for this form was already created
		var validator = $.data(this[0], 'validator');
		if ( validator ) {
			return validator;
		}

		// Add novalidate tag if HTML5.
		this.attr('novalidate', 'novalidate');

		validator = new $.validator( options, this[0] );
		$.data(this[0], 'validator', validator);

		if ( validator.settings.onsubmit ) {

			var inputsAndButtons = this.find("input, button");

			// allow suppresing validation by adding a cancel class to the submit button
			inputsAndButtons.filter(".cancel").click(function () {
				validator.cancelSubmit = true;
			});

			// when a submitHandler is used, capture the submitting button
			if (validator.settings.submitHandler) {
				inputsAndButtons.filter(":submit").click(function () {
					validator.submitButton = this;
				});
			}

			// validate the form on submit
			this.submit( function( event ) {
				if ( validator.settings.debug )
					// prevent form submit to be able to see console output
					event.preventDefault();

				function handle() {
					if ( validator.settings.submitHandler ) {
						if (validator.submitButton) {
							// insert a hidden input as a replacement for the missing submit button
							var hidden = $("<input type='hidden'/>").attr("name", validator.submitButton.name).val(validator.submitButton.value).appendTo(validator.currentForm);
						}
						validator.settings.submitHandler.call( validator, validator.currentForm );
						if (validator.submitButton) {
							// and clean up afterwards; thanks to no-block-scope, hidden can be referenced
							hidden.remove();
						}
						return false;
					}
					return true;
				}

				// prevent submit for invalid forms or custom submit handlers
				if ( validator.cancelSubmit ) {
					validator.cancelSubmit = false;
					return handle();
				}
				if ( validator.form() ) {
					if ( validator.pendingRequest ) {
						validator.formSubmitted = true;
						return false;
					}
					return handle();
				} else {
					validator.focusInvalid();
					return false;
				}
			});
		}

		return validator;
	},
	// http://docs.jquery.com/Plugins/Validation/valid
	valid: function() {
        if ( $(this[0]).is('form')) {
            return this.validate().form();
        } else {
            var valid = true;
            var validator = $(this[0].form).validate();
            this.each(function() {
				valid &= validator.element(this);
            });
            return valid;
        }
    },
	// attributes: space seperated list of attributes to retrieve and remove
	removeAttrs: function(attributes) {
		var result = {},
			$element = this;
		$.each(attributes.split(/\s/), function(index, value) {
			result[value] = $element.attr(value);
			$element.removeAttr(value);
		});
		return result;
	},
	// http://docs.jquery.com/Plugins/Validation/rules
	rules: function(command, argument) {
		var element = this[0];

		if (command) {
			var settings = $.data(element.form, 'validator').settings;
			var staticRules = settings.rules;
			var existingRules = $.validator.staticRules(element);
			switch(command) {
			case "add":
				$.extend(existingRules, $.validator.normalizeRule(argument));
				staticRules[element.name] = existingRules;
				if (argument.messages)
					settings.messages[element.name] = $.extend( settings.messages[element.name], argument.messages );
				break;
			case "remove":
				if (!argument) {
					delete staticRules[element.name];
					return existingRules;
				}
				var filtered = {};
				$.each(argument.split(/\s/), function(index, method) {
					filtered[method] = existingRules[method];
					delete existingRules[method];
				});
				return filtered;
			}
		}

		var data = $.validator.normalizeRules(
		$.extend(
			{},
			$.validator.metadataRules(element),
			$.validator.classRules(element),
			$.validator.attributeRules(element),
			$.validator.staticRules(element)
		), element);

		// make sure required is at front
		if (data.required) {
			var param = data.required;
			delete data.required;
			data = $.extend({required: param}, data);
		}

		return data;
	}
});

// Custom selectors
$.extend($.expr[":"], {
	// http://docs.jquery.com/Plugins/Validation/blank
	blank: function(a) {return !$.trim("" + a.value);},
	// http://docs.jquery.com/Plugins/Validation/filled
	filled: function(a) {return !!$.trim("" + a.value);},
	// http://docs.jquery.com/Plugins/Validation/unchecked
	unchecked: function(a) {return !a.checked;}
});

// constructor for validator
$.validator = function( options, form ) {
	this.settings = $.extend( true, {}, $.validator.defaults, options );
	this.currentForm = form;
	this.init();
};

$.validator.format = function(source, params) {
	if ( arguments.length == 1 )
		return function() {
			var args = $.makeArray(arguments);
			args.unshift(source);
			return $.validator.format.apply( this, args );
		};
	if ( arguments.length > 2 && params.constructor != Array  ) {
		params = $.makeArray(arguments).slice(1);
	}
	if ( params.constructor != Array ) {
		params = [ params ];
	}
	$.each(params, function(i, n) {
		source = source.replace(new RegExp("\\{" + i + "\\}", "g"), n);
	});
	return source;
};

$.extend($.validator, {

	defaults: {
		messages: {},
		groups: {},
		rules: {},
		errorClass: "error",
		validClass: "valid",
		errorElement: "label",
		focusInvalid: true,
		errorContainer: $( [] ),
		errorLabelContainer: $( [] ),
		onsubmit: true,
		ignore: ":hidden",
		ignoreTitle: false,
		onfocusin: function(element, event) {
			this.lastActive = element;

			// hide error label and remove error class on focus if enabled
			if ( this.settings.focusCleanup && !this.blockFocusCleanup ) {
				this.settings.unhighlight && this.settings.unhighlight.call( this, element, this.settings.errorClass, this.settings.validClass );
				this.addWrapper(this.errorsFor(element)).hide();
			}
		},
		onfocusout: function(element, event) {
			if ( !this.checkable(element) && (element.name in this.submitted || !this.optional(element)) ) {
				this.element(element);
			}
		},
		onkeyup: function(element, event) {
			if ( element.name in this.submitted || element == this.lastElement ) {
				this.element(element);
			}
		},
		onclick: function(element, event) {
			// click on selects, radiobuttons and checkboxes
			if ( element.name in this.submitted )
				this.element(element);
			// or option elements, check parent select in that case
			else if (element.parentNode.name in this.submitted)
				this.element(element.parentNode);
		},
		highlight: function(element, errorClass, validClass) {
			if (element.type === 'radio') {
				this.findByName(element.name).addClass(errorClass).removeClass(validClass);
			} else {
				$(element).addClass(errorClass).removeClass(validClass);
			}
		},
		unhighlight: function(element, errorClass, validClass) {
			if (element.type === 'radio') {
				this.findByName(element.name).removeClass(errorClass).addClass(validClass);
			} else {
				$(element).removeClass(errorClass).addClass(validClass);
			}
		}
	},

	// http://docs.jquery.com/Plugins/Validation/Validator/setDefaults
	setDefaults: function(settings) {
		$.extend( $.validator.defaults, settings );
	},

	messages: {
		required: "This field is required.",
		remote: "Please fix this field.",
		email: "Please enter a valid email address.",
		url: "Please enter a valid URL.",
		date: "Please enter a valid date.",
		dateISO: "Please enter a valid date (ISO).",
		number: "Please enter a valid number.",
		digits: "Please enter only digits.",
		creditcard: "Please enter a valid credit card number.",
		equalTo: "Please enter the same value again.",
		accept: "Please enter a value with a valid extension.",
		maxlength: $.validator.format("Please enter no more than {0} characters."),
		minlength: $.validator.format("Please enter at least {0} characters."),
		rangelength: $.validator.format("Please enter a value between {0} and {1} characters long."),
		range: $.validator.format("Please enter a value between {0} and {1}."),
		max: $.validator.format("Please enter a value less than or equal to {0}."),
		min: $.validator.format("Please enter a value greater than or equal to {0}.")
	},

	autoCreateRanges: false,

	prototype: {

		init: function() {
			this.labelContainer = $(this.settings.errorLabelContainer);
			this.errorContext = this.labelContainer.length && this.labelContainer || $(this.currentForm);
			this.containers = $(this.settings.errorContainer).add( this.settings.errorLabelContainer );
			this.submitted = {};
			this.valueCache = {};
			this.pendingRequest = 0;
			this.pending = {};
			this.invalid = {};
			this.reset();

			var groups = (this.groups = {});
			$.each(this.settings.groups, function(key, value) {
				$.each(value.split(/\s/), function(index, name) {
					groups[name] = key;
				});
			});
			var rules = this.settings.rules;
			$.each(rules, function(key, value) {
				rules[key] = $.validator.normalizeRule(value);
			});

			function delegate(event) {
				var validator = $.data(this[0].form, "validator"),
					eventType = "on" + event.type.replace(/^validate/, "");
				validator.settings[eventType] && validator.settings[eventType].call(validator, this[0], event);
			}
			$(this.currentForm)
			       .validateDelegate("input[type='text'], input[type='password'], input[type='file'], select, textarea, " +
						"input[type='number'], input[type='search'] ,input[type='tel'], input[type='url'], " +
						"input[type='email'], input[type='datetime'], input[type='date'], input[type='month'], " +
						"input[type='week'], input[type='time'], input[type='datetime-local'], " +
						"input[type='range'], input[type='color'] ",
						"focusin focusout keyup", delegate)
				.validateDelegate("input[type='radio'], input[type='checkbox'], select, option", "click", delegate);

			if (this.settings.invalidHandler)
				$(this.currentForm).bind("invalid-form.validate", this.settings.invalidHandler);
		},

		// http://docs.jquery.com/Plugins/Validation/Validator/form
		form: function() {
			this.checkForm();
			$.extend(this.submitted, this.errorMap);
			this.invalid = $.extend({}, this.errorMap);
			if (!this.valid())
				$(this.currentForm).triggerHandler("invalid-form", [this]);
			this.showErrors();
			return this.valid();
		},

		checkForm: function() {
			this.prepareForm();
			for ( var i = 0, elements = (this.currentElements = this.elements()); elements[i]; i++ ) {
				this.check( elements[i] );
			}
			return this.valid();
		},

		// http://docs.jquery.com/Plugins/Validation/Validator/element
		element: function( element ) {
			element = this.validationTargetFor( this.clean( element ) );
			this.lastElement = element;
			this.prepareElement( element );
			this.currentElements = $(element);
			var result = this.check( element );
			if ( result ) {
				delete this.invalid[element.name];
			} else {
				this.invalid[element.name] = true;
			}
			if ( !this.numberOfInvalids() ) {
				// Hide error containers on last error
				this.toHide = this.toHide.add( this.containers );
			}
			this.showErrors();
			return result;
		},

		// http://docs.jquery.com/Plugins/Validation/Validator/showErrors
		showErrors: function(errors) {
			if(errors) {
				// add items to error list and map
				$.extend( this.errorMap, errors );
				this.errorList = [];
				for ( var name in errors ) {
					this.errorList.push({
						message: errors[name],
						element: this.findByName(name)[0]
					});
				}
				// remove items from success list
				this.successList = $.grep( this.successList, function(element) {
					return !(element.name in errors);
				});
			}
			this.settings.showErrors
				? this.settings.showErrors.call( this, this.errorMap, this.errorList )
				: this.defaultShowErrors();
		},

		// http://docs.jquery.com/Plugins/Validation/Validator/resetForm
		resetForm: function() {
			if ( $.fn.resetForm )
				$( this.currentForm ).resetForm();
			this.submitted = {};
			this.lastElement = null;
			this.prepareForm();
			this.hideErrors();
			this.elements().removeClass( this.settings.errorClass );
		},

		numberOfInvalids: function() {
			return this.objectLength(this.invalid);
		},

		objectLength: function( obj ) {
			var count = 0;
			for ( var i in obj )
				count++;
			return count;
		},

		hideErrors: function() {
			this.addWrapper( this.toHide ).hide();
		},

		valid: function() {
			return this.size() == 0;
		},

		size: function() {
			return this.errorList.length;
		},

		focusInvalid: function() {
			if( this.settings.focusInvalid ) {
				try {
					$(this.findLastActive() || this.errorList.length && this.errorList[0].element || [])
					.filter(":visible")
					.focus()
					// manually trigger focusin event; without it, focusin handler isn't called, findLastActive won't have anything to find
					.trigger("focusin");
				} catch(e) {
					// ignore IE throwing errors when focusing hidden elements
				}
			}
		},

		findLastActive: function() {
			var lastActive = this.lastActive;
			return lastActive && $.grep(this.errorList, function(n) {
				return n.element.name == lastActive.name;
			}).length == 1 && lastActive;
		},

		elements: function() {
			var validator = this,
				rulesCache = {};

			// select all valid inputs inside the form (no submit or reset buttons)
			return $(this.currentForm)
			.find("input, select, textarea")
			.not(":submit, :reset, :image, [disabled]")
			.not( this.settings.ignore )
			.filter(function() {
				!this.name && validator.settings.debug && window.console && console.error( "%o has no name assigned", this);

				// select only the first element for each name, and only those with rules specified
				if ( this.name in rulesCache || !validator.objectLength($(this).rules()) )
					return false;

				rulesCache[this.name] = true;
				return true;
			});
		},

		clean: function( selector ) {
			return $( selector )[0];
		},

		errors: function() {
			return $( this.settings.errorElement + "." + this.settings.errorClass, this.errorContext );
		},

		reset: function() {
			this.successList = [];
			this.errorList = [];
			this.errorMap = {};
			this.toShow = $([]);
			this.toHide = $([]);
			this.currentElements = $([]);
		},

		prepareForm: function() {
			this.reset();
			this.toHide = this.errors().add( this.containers );
		},

		prepareElement: function( element ) {
			this.reset();
			this.toHide = this.errorsFor(element);
		},

		check: function( element ) {
			element = this.validationTargetFor( this.clean( element ) );

			var rules = $(element).rules();
			var dependencyMismatch = false;
			for (var method in rules ) {
				var rule = { method: method, parameters: rules[method] };
				try {
					var result = $.validator.methods[method].call( this, element.value.replace(/\r/g, ""), element, rule.parameters );

					// if a method indicates that the field is optional and therefore valid,
					// don't mark it as valid when there are no other rules
					if ( result == "dependency-mismatch" ) {
						dependencyMismatch = true;
						continue;
					}
					dependencyMismatch = false;

					if ( result == "pending" ) {
						this.toHide = this.toHide.not( this.errorsFor(element) );
						return;
					}

					if( !result ) {
						this.formatAndAdd( element, rule );
						return false;
					}
				} catch(e) {
					this.settings.debug && window.console && console.log("exception occured when checking element " + element.id
						 + ", check the '" + rule.method + "' method", e);
					throw e;
				}
			}
			if (dependencyMismatch)
				return;
			if ( this.objectLength(rules) )
				this.successList.push(element);
			return true;
		},

		// return the custom message for the given element and validation method
		// specified in the element's "messages" metadata
		customMetaMessage: function(element, method) {
			if (!$.metadata)
				return;

			var meta = this.settings.meta
				? $(element).metadata()[this.settings.meta]
				: $(element).metadata();

			return meta && meta.messages && meta.messages[method];
		},

		// return the custom message for the given element name and validation method
		customMessage: function( name, method ) {
			var m = this.settings.messages[name];
			return m && (m.constructor == String
				? m
				: m[method]);
		},

		// return the first defined argument, allowing empty strings
		findDefined: function() {
			for(var i = 0; i < arguments.length; i++) {
				if (arguments[i] !== undefined)
					return arguments[i];
			}
			return undefined;
		},

		defaultMessage: function( element, method) {
			return this.findDefined(
				this.customMessage( element.name, method ),
				this.customMetaMessage( element, method ),
				// title is never undefined, so handle empty string as undefined
				!this.settings.ignoreTitle && element.title || undefined,
				$.validator.messages[method],
				"<strong>Warning: No message defined for " + element.name + "</strong>"
			);
		},

		formatAndAdd: function( element, rule ) {
			var message = this.defaultMessage( element, rule.method ),
				theregex = /\$?\{(\d+)\}/g;
			if ( typeof message == "function" ) {
				message = message.call(this, rule.parameters, element);
			} else if (theregex.test(message)) {
				message = jQuery.format(message.replace(theregex, '{$1}'), rule.parameters);
			}
			this.errorList.push({
				message: message,
				element: element
			});

			this.errorMap[element.name] = message;
			this.submitted[element.name] = message;
		},

		addWrapper: function(toToggle) {
			if ( this.settings.wrapper )
				toToggle = toToggle.add( toToggle.parent( this.settings.wrapper ) );
			return toToggle;
		},

		defaultShowErrors: function() {
			for ( var i = 0; this.errorList[i]; i++ ) {
				var error = this.errorList[i];
				this.settings.highlight && this.settings.highlight.call( this, error.element, this.settings.errorClass, this.settings.validClass );
				this.showLabel( error.element, error.message );
			}
			if( this.errorList.length ) {
				this.toShow = this.toShow.add( this.containers );
			}
			if (this.settings.success) {
				for ( var i = 0; this.successList[i]; i++ ) {
					this.showLabel( this.successList[i] );
				}
			}
			if (this.settings.unhighlight) {
				for ( var i = 0, elements = this.validElements(); elements[i]; i++ ) {
					this.settings.unhighlight.call( this, elements[i], this.settings.errorClass, this.settings.validClass );
				}
			}
			this.toHide = this.toHide.not( this.toShow );
			this.hideErrors();
			this.addWrapper( this.toShow ).show();
		},

		validElements: function() {
			return this.currentElements.not(this.invalidElements());
		},

		invalidElements: function() {
			return $(this.errorList).map(function() {
				return this.element;
			});
		},

		showLabel: function(element, message) {
			var label = this.errorsFor( element );
			if ( label.length ) {
				// refresh error/success class
				label.removeClass( this.settings.validClass ).addClass( this.settings.errorClass );

				// check if we have a generated label, replace the message then
				label.attr("generated") && label.html(message);
			} else {
				// create label
				label = $("<" + this.settings.errorElement + "/>")
					.attr({"for":  this.idOrName(element), generated: true})
					.addClass(this.settings.errorClass)
					.html(message || "");
				if ( this.settings.wrapper ) {
					// make sure the element is visible, even in IE
					// actually showing the wrapped element is handled elsewhere
					label = label.hide().show().wrap("<" + this.settings.wrapper + "/>").parent();
				}
				if ( !this.labelContainer.append(label).length )
					this.settings.errorPlacement
						? this.settings.errorPlacement(label, $(element) )
						: label.insertAfter(element);
			}
			if ( !message && this.settings.success ) {
				label.text("");
				typeof this.settings.success == "string"
					? label.addClass( this.settings.success )
					: this.settings.success( label );
			}
			this.toShow = this.toShow.add(label);
		},

		errorsFor: function(element) {
			var name = this.idOrName(element);
    		return this.errors().filter(function() {
				return $(this).attr('for') == name;
			});
		},

		idOrName: function(element) {
			return this.groups[element.name] || (this.checkable(element) ? element.name : element.id || element.name);
		},

		validationTargetFor: function(element) {
			// if radio/checkbox, validate first element in group instead
			if (this.checkable(element)) {
				element = this.findByName( element.name ).not(this.settings.ignore)[0];
			}
			return element;
		},

		checkable: function( element ) {
			return /radio|checkbox/i.test(element.type);
		},

		findByName: function( name ) {
			// select by name and filter by form for performance over form.find("[name=...]")
			var form = this.currentForm;
			return $(document.getElementsByName(name)).map(function(index, element) {
				return element.form == form && element.name == name && element  || null;
			});
		},

		getLength: function(value, element) {
			switch( element.nodeName.toLowerCase() ) {
			case 'select':
				return $("option:selected", element).length;
			case 'input':
				if( this.checkable( element) )
					return this.findByName(element.name).filter(':checked').length;
			}
			return value.length;
		},

		depend: function(param, element) {
			return this.dependTypes[typeof param]
				? this.dependTypes[typeof param](param, element)
				: true;
		},

		dependTypes: {
			"boolean": function(param, element) {
				return param;
			},
			"string": function(param, element) {
				return !!$(param, element.form).length;
			},
			"function": function(param, element) {
				return param(element);
			}
		},

		optional: function(element) {
			return !$.validator.methods.required.call(this, $.trim(element.value), element) && "dependency-mismatch";
		},

		startRequest: function(element) {
			if (!this.pending[element.name]) {
				this.pendingRequest++;
				this.pending[element.name] = true;
			}
		},

		stopRequest: function(element, valid) {
			this.pendingRequest--;
			// sometimes synchronization fails, make sure pendingRequest is never < 0
			if (this.pendingRequest < 0)
				this.pendingRequest = 0;
			delete this.pending[element.name];
			if ( valid && this.pendingRequest == 0 && this.formSubmitted && this.form() ) {
				$(this.currentForm).submit();
				this.formSubmitted = false;
			} else if (!valid && this.pendingRequest == 0 && this.formSubmitted) {
				$(this.currentForm).triggerHandler("invalid-form", [this]);
				this.formSubmitted = false;
			}
		},

		previousValue: function(element) {
			return $.data(element, "previousValue") || $.data(element, "previousValue", {
				old: null,
				valid: true,
				message: this.defaultMessage( element, "remote" )
			});
		}

	},

	classRuleSettings: {
		required: {required: true},
		email: {email: true},
		url: {url: true},
		date: {date: true},
		dateISO: {dateISO: true},
		dateDE: {dateDE: true},
		number: {number: true},
		numberDE: {numberDE: true},
		digits: {digits: true},
		creditcard: {creditcard: true}
	},

	addClassRules: function(className, rules) {
		className.constructor == String ?
			this.classRuleSettings[className] = rules :
			$.extend(this.classRuleSettings, className);
	},

	classRules: function(element) {
		var rules = {};
		var classes = $(element).attr('class');
		classes && $.each(classes.split(' '), function() {
			if (this in $.validator.classRuleSettings) {
				$.extend(rules, $.validator.classRuleSettings[this]);
			}
		});
		return rules;
	},

	attributeRules: function(element) {
		var rules = {};
		var $element = $(element);

		for (var method in $.validator.methods) {
			var value;
			// If .prop exists (jQuery >= 1.6), use it to get true/false for required
			if (method === 'required' && typeof $.fn.prop === 'function') {
				value = $element.prop(method);
			} else {
				value = $element.attr(method);
			}
			if (value) {
				rules[method] = value;
			} else if ($element[0].getAttribute("type") === method) {
				rules[method] = true;
			}
		}

		// maxlength may be returned as -1, 2147483647 (IE) and 524288 (safari) for text inputs
		if (rules.maxlength && /-1|2147483647|524288/.test(rules.maxlength)) {
			delete rules.maxlength;
		}

		return rules;
	},

	metadataRules: function(element) {
		if (!$.metadata) return {};

		var meta = $.data(element.form, 'validator').settings.meta;
		return meta ?
			$(element).metadata()[meta] :
			$(element).metadata();
	},

	staticRules: function(element) {
		var rules = {};
		var validator = $.data(element.form, 'validator');
		if (validator.settings.rules) {
			rules = $.validator.normalizeRule(validator.settings.rules[element.name]) || {};
		}
		return rules;
	},

	normalizeRules: function(rules, element) {
		// handle dependency check
		$.each(rules, function(prop, val) {
			// ignore rule when param is explicitly false, eg. required:false
			if (val === false) {
				delete rules[prop];
				return;
			}
			if (val.param || val.depends) {
				var keepRule = true;
				switch (typeof val.depends) {
					case "string":
						keepRule = !!$(val.depends, element.form).length;
						break;
					case "function":
						keepRule = val.depends.call(element, element);
						break;
				}
				if (keepRule) {
					rules[prop] = val.param !== undefined ? val.param : true;
				} else {
					delete rules[prop];
				}
			}
		});

		// evaluate parameters
		$.each(rules, function(rule, parameter) {
			rules[rule] = $.isFunction(parameter) ? parameter(element) : parameter;
		});

		// clean number parameters
		$.each(['minlength', 'maxlength', 'min', 'max'], function() {
			if (rules[this]) {
				rules[this] = Number(rules[this]);
			}
		});
		$.each(['rangelength', 'range'], function() {
			if (rules[this]) {
				rules[this] = [Number(rules[this][0]), Number(rules[this][1])];
			}
		});

		if ($.validator.autoCreateRanges) {
			// auto-create ranges
			if (rules.min && rules.max) {
				rules.range = [rules.min, rules.max];
				delete rules.min;
				delete rules.max;
			}
			if (rules.minlength && rules.maxlength) {
				rules.rangelength = [rules.minlength, rules.maxlength];
				delete rules.minlength;
				delete rules.maxlength;
			}
		}

		// To support custom messages in metadata ignore rule methods titled "messages"
		if (rules.messages) {
			delete rules.messages;
		}

		return rules;
	},

	// Converts a simple string to a {string: true} rule, e.g., "required" to {required:true}
	normalizeRule: function(data) {
		if( typeof data == "string" ) {
			var transformed = {};
			$.each(data.split(/\s/), function() {
				transformed[this] = true;
			});
			data = transformed;
		}
		return data;
	},

	// http://docs.jquery.com/Plugins/Validation/Validator/addMethod
	addMethod: function(name, method, message) {
		$.validator.methods[name] = method;
		$.validator.messages[name] = message != undefined ? message : $.validator.messages[name];
		if (method.length < 3) {
			$.validator.addClassRules(name, $.validator.normalizeRule(name));
		}
	},

	methods: {

		// http://docs.jquery.com/Plugins/Validation/Methods/required
		required: function(value, element, param) {
			// check if dependency is met
			if ( !this.depend(param, element) )
				return "dependency-mismatch";
			switch( element.nodeName.toLowerCase() ) {
			case 'select':
				// could be an array for select-multiple or a string, both are fine this way
				var val = $(element).val();
				return val && val.length > 0;
			case 'input':
				if ( this.checkable(element) )
					return this.getLength(value, element) > 0;
			default:
				return $.trim(value).length > 0;
			}
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/remote
		remote: function(value, element, param) {
			if ( this.optional(element) )
				return "dependency-mismatch";

			var previous = this.previousValue(element);
			if (!this.settings.messages[element.name] )
				this.settings.messages[element.name] = {};
			previous.originalMessage = this.settings.messages[element.name].remote;
			this.settings.messages[element.name].remote = previous.message;

			param = typeof param == "string" && {url:param} || param;

			if ( this.pending[element.name] ) {
				return "pending";
			}
			if ( previous.old === value ) {
				return previous.valid;
			}

			previous.old = value;
			var validator = this;
			this.startRequest(element);
			var data = {};
			data[element.name] = value;
			$.ajax($.extend(true, {
				url: param,
				mode: "abort",
				port: "validate" + element.name,
				dataType: "json",
				data: data,
				success: function(response) {
					validator.settings.messages[element.name].remote = previous.originalMessage;
					var valid = response === true;
					if ( valid ) {
						var submitted = validator.formSubmitted;
						validator.prepareElement(element);
						validator.formSubmitted = submitted;
						validator.successList.push(element);
						validator.showErrors();
					} else {
						var errors = {};
						var message = response || validator.defaultMessage( element, "remote" );
						errors[element.name] = previous.message = $.isFunction(message) ? message(value) : message;
						validator.showErrors(errors);
					}
					previous.valid = valid;
					validator.stopRequest(element, valid);
				}
			}, param));
			return "pending";
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/minlength
		minlength: function(value, element, param) {
			return this.optional(element) || this.getLength($.trim(value), element) >= param;
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/maxlength
		maxlength: function(value, element, param) {
			return this.optional(element) || this.getLength($.trim(value), element) <= param;
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/rangelength
		rangelength: function(value, element, param) {
			var length = this.getLength($.trim(value), element);
			return this.optional(element) || ( length >= param[0] && length <= param[1] );
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/min
		min: function( value, element, param ) {
			return this.optional(element) || value >= param;
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/max
		max: function( value, element, param ) {
			return this.optional(element) || value <= param;
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/range
		range: function( value, element, param ) {
			return this.optional(element) || ( value >= param[0] && value <= param[1] );
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/email
		email: function(value, element) {
			// contributed by Scott Gonzalez: http://projects.scottsplayground.com/email_address_validation/
			return this.optional(element) || /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i.test(value);
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/url
		url: function(value, element) {
			// contributed by Scott Gonzalez: http://projects.scottsplayground.com/iri/
			return this.optional(element) || /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/date
		date: function(value, element) {
			return this.optional(element) || !/Invalid|NaN/.test(new Date(value));
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/dateISO
		dateISO: function(value, element) {
			return this.optional(element) || /^\d{4}[\/-]\d{1,2}[\/-]\d{1,2}$/.test(value);
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/number
		number: function(value, element) {
			return this.optional(element) || /^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(value);
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/digits
		digits: function(value, element) {
			return this.optional(element) || /^\d+$/.test(value);
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/creditcard
		// based on http://en.wikipedia.org/wiki/Luhn
		creditcard: function(value, element) {
			if ( this.optional(element) )
				return "dependency-mismatch";
			// accept only spaces, digits and dashes
			if (/[^0-9 -]+/.test(value))
				return false;
			var nCheck = 0,
				nDigit = 0,
				bEven = false;

			value = value.replace(/\D/g, "");

			for (var n = value.length - 1; n >= 0; n--) {
				var cDigit = value.charAt(n);
				var nDigit = parseInt(cDigit, 10);
				if (bEven) {
					if ((nDigit *= 2) > 9)
						nDigit -= 9;
				}
				nCheck += nDigit;
				bEven = !bEven;
			}

			return (nCheck % 10) == 0;
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/accept
		accept: function(value, element, param) {
			param = typeof param == "string" ? param.replace(/,/g, '|') : "png|jpe?g|gif";
			return this.optional(element) || value.match(new RegExp(".(" + param + ")$", "i"));
		},

		// http://docs.jquery.com/Plugins/Validation/Methods/equalTo
		equalTo: function(value, element, param) {
			// bind to the blur event of the target in order to revalidate whenever the target field is updated
			// TODO find a way to bind the event just once, avoiding the unbind-rebind overhead
			var target = $(param).unbind(".validate-equalTo").bind("blur.validate-equalTo", function() {
				$(element).valid();
			});
			return value == target.val();
		}

	}

});

// deprecated, use $.validator.format instead
$.format = $.validator.format;

})(jQuery);

// ajax mode: abort
// usage: $.ajax({ mode: "abort"[, port: "uniqueport"]});
// if mode:"abort" is used, the previous request on that port (port can be undefined) is aborted via XMLHttpRequest.abort()
;(function($) {
	var pendingRequests = {};
	// Use a prefilter if available (1.5+)
	if ( $.ajaxPrefilter ) {
		$.ajaxPrefilter(function(settings, _, xhr) {
			var port = settings.port;
			if (settings.mode == "abort") {
				if ( pendingRequests[port] ) {
					pendingRequests[port].abort();
				}
				pendingRequests[port] = xhr;
			}
		});
	} else {
		// Proxy ajax
		var ajax = $.ajax;
		$.ajax = function(settings) {
			var mode = ( "mode" in settings ? settings : $.ajaxSettings ).mode,
				port = ( "port" in settings ? settings : $.ajaxSettings ).port;
			if (mode == "abort") {
				if ( pendingRequests[port] ) {
					pendingRequests[port].abort();
				}
				return (pendingRequests[port] = ajax.apply(this, arguments));
			}
			return ajax.apply(this, arguments);
		};
	}
})(jQuery);

// provides cross-browser focusin and focusout events
// IE has native support, in other browsers, use event caputuring (neither bubbles)

// provides delegate(type: String, delegate: Selector, handler: Callback) plugin for easier event delegation
// handler is only called when $(event.target).is(delegate), in the scope of the jquery-object for event.target
;(function($) {
	// only implement if not provided by jQuery core (since 1.4)
	// TODO verify if jQuery 1.4's implementation is compatible with older jQuery special-event APIs
	if (!jQuery.event.special.focusin && !jQuery.event.special.focusout && document.addEventListener) {
		$.each({
			focus: 'focusin',
			blur: 'focusout'
		}, function( original, fix ){
			$.event.special[fix] = {
				setup:function() {
					this.addEventListener( original, handler, true );
				},
				teardown:function() {
					this.removeEventListener( original, handler, true );
				},
				handler: function(e) {
					arguments[0] = $.event.fix(e);
					arguments[0].type = fix;
					return $.event.handle.apply(this, arguments);
				}
			};
			function handler(e) {
				e = $.event.fix(e);
				e.type = fix;
				return $.event.handle.call(this, e);
			}
		});
	};
	$.extend($.fn, {
		validateDelegate: function(delegate, type, handler) {
			return this.bind(type, function(event) {
				var target = $(event.target);
				if (target.is(delegate)) {
					return handler.apply(target, arguments);
				}
			});
		}
	});
})(jQuery);
/*
 * jQuery JSON Plugin
 * version: 2.1 (2009-08-14)
 *
 * This document is licensed as free software under the terms of the
 * MIT License: http://www.opensource.org/licenses/mit-license.php
 *
 * Brantley Harris wrote this plugin. It is based somewhat on the JSON.org 
 * website's http://www.json.org/json2.js, which proclaims:
 * "NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.", a sentiment that
 * I uphold.
 *
 * It is also influenced heavily by MochiKit's serializeJSON, which is 
 * copyrighted 2005 by Bob Ippolito.
 */
 
(function($) {
    /** jQuery.toJSON( json-serializble )
        Converts the given argument into a JSON respresentation.

        If an object has a "toJSON" function, that will be used to get the representation.
        Non-integer/string keys are skipped in the object, as are keys that point to a function.

        json-serializble:
            The *thing* to be converted.
     **/
    $.toJSON = function(o)
    {
        if (typeof(JSON) == 'object' && JSON.stringify)
            return JSON.stringify(o);
        
        var type = typeof(o);
    
        if (o === null)
            return "null";
    
        if (type == "undefined")
            return undefined;
        
        if (type == "number" || type == "boolean")
            return o + "";
    
        if (type == "string")
            return $.quoteString(o);
    
        if (type == 'object')
        {
            if (typeof o.toJSON == "function") 
                return $.toJSON( o.toJSON() );
            
            if (o.constructor === Date)
            {
                var month = o.getUTCMonth() + 1;
                if (month < 10) month = '0' + month;

                var day = o.getUTCDate();
                if (day < 10) day = '0' + day;

                var year = o.getUTCFullYear();
                
                var hours = o.getUTCHours();
                if (hours < 10) hours = '0' + hours;
                
                var minutes = o.getUTCMinutes();
                if (minutes < 10) minutes = '0' + minutes;
                
                var seconds = o.getUTCSeconds();
                if (seconds < 10) seconds = '0' + seconds;
                
                var milli = o.getUTCMilliseconds();
                if (milli < 100) milli = '0' + milli;
                if (milli < 10) milli = '0' + milli;

                return '"' + year + '-' + month + '-' + day + 'T' +
                             hours + ':' + minutes + ':' + seconds + 
                             '.' + milli + 'Z"'; 
            }

            if (o.constructor === Array) 
            {
                var ret = [];
                for (var i = 0; i < o.length; i++)
                    ret.push( $.toJSON(o[i]) || "null" );

                return "[" + ret.join(",") + "]";
            }
        
            var pairs = [];
            for (var k in o) {
                var name;
                var type = typeof k;

                if (type == "number")
                    name = '"' + k + '"';
                else if (type == "string")
                    name = $.quoteString(k);
                else
                    continue;  //skip non-string or number keys
            
                if (typeof o[k] == "function") 
                    continue;  //skip pairs where the value is a function.
            
                var val = $.toJSON(o[k]);
            
                pairs.push(name + ":" + val);
            }

            return "{" + pairs.join(", ") + "}";
        }
    };

    /** jQuery.evalJSON(src)
        Evaluates a given piece of json source.
     **/
    $.evalJSON = function(src)
    {
        if (typeof(JSON) == 'object' && JSON.parse)
            return JSON.parse(src);
        return eval("(" + src + ")");
    };
    
    /** jQuery.secureEvalJSON(src)
        Evals JSON in a way that is *more* secure.
    **/
    $.secureEvalJSON = function(src)
    {
        if (typeof(JSON) == 'object' && JSON.parse)
            return JSON.parse(src);
        
        var filtered = src;
        filtered = filtered.replace(/\\["\\\/bfnrtu]/g, '@');
        filtered = filtered.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']');
        filtered = filtered.replace(/(?:^|:|,)(?:\s*\[)+/g, '');
        
        if (/^[\],:{}\s]*$/.test(filtered))
            return eval("(" + src + ")");
        else
            throw new SyntaxError("Error parsing JSON, source is not valid.");
    };

    /** jQuery.quoteString(string)
        Returns a string-repr of a string, escaping quotes intelligently.  
        Mostly a support function for toJSON.
    
        Examples:
            >>> jQuery.quoteString("apple")
            "apple"
        
            >>> jQuery.quoteString('"Where are we going?", she asked.')
            "\"Where are we going?\", she asked."
     **/
    $.quoteString = function(string)
    {
        if (string.match(_escapeable))
        {
            return '"' + string.replace(_escapeable, function (a) 
            {
                var c = _meta[a];
                if (typeof c === 'string') return c;
                c = a.charCodeAt();
                return '\\u00' + Math.floor(c / 16).toString(16) + (c % 16).toString(16);
            }) + '"';
        }
        return '"' + string + '"';
    };
    
    var _escapeable = /["\\\x00-\x1f\x7f-\x9f]/g;
    
    var _meta = {
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '"' : '\\"',
        '\\': '\\\\'
    };
})(jQuery);
/*! Copyright (c) 2011 Brandon Aaron (http://brandonaaron.net)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
 * Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
 * Thanks to: Seamus Leahy for adding deltaX and deltaY
 *
 * Version: 3.0.6
 * 
 * Requires: 1.2.2+
 */

(function($) {

var types = ['DOMMouseScroll', 'mousewheel'];

if ($.event.fixHooks) {
    for ( var i=types.length; i; ) {
        $.event.fixHooks[ types[--i] ] = $.event.mouseHooks;
    }
}

$.event.special.mousewheel = {
    setup: function() {
        if ( this.addEventListener ) {
            for ( var i=types.length; i; ) {
                this.addEventListener( types[--i], handler, false );
            }
        } else {
            this.onmousewheel = handler;
        }
    },
    
    teardown: function() {
        if ( this.removeEventListener ) {
            for ( var i=types.length; i; ) {
                this.removeEventListener( types[--i], handler, false );
            }
        } else {
            this.onmousewheel = null;
        }
    }
};

$.fn.extend({
    mousewheel: function(fn) {
        return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
    },
    
    unmousewheel: function(fn) {
        return this.unbind("mousewheel", fn);
    }
});


function handler(event) {
    var orgEvent = event || window.event, args = [].slice.call( arguments, 1 ), delta = 0, returnValue = true, deltaX = 0, deltaY = 0;
    event = $.event.fix(orgEvent);
    event.type = "mousewheel";
    
    // Old school scrollwheel delta
    if ( orgEvent.wheelDelta ) { delta = orgEvent.wheelDelta/120; }
    if ( orgEvent.detail     ) { delta = -orgEvent.detail/3; }
    
    // New school multidimensional scroll (touchpads) deltas
    deltaY = delta;
    
    // Gecko
    if ( orgEvent.axis !== undefined && orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
        deltaY = 0;
        deltaX = -1*delta;
    }
    
    // Webkit
    if ( orgEvent.wheelDeltaY !== undefined ) { deltaY = orgEvent.wheelDeltaY/120; }
    if ( orgEvent.wheelDeltaX !== undefined ) { deltaX = -1*orgEvent.wheelDeltaX/120; }
    
    // Add event and delta to the front of the arguments
    args.unshift(event, delta, deltaX, deltaY);
    
    return ($.event.dispatch || $.event.handle).apply(this, args);
}

})(jQuery);
/**
 * @depends jquery
 * @name jquery.scrollto
 * @package jquery-scrollto {@link http://balupton.com/projects/jquery-scrollto}
 */

/**
 * jQuery Aliaser
 */
(function(window,undefined){
	// Prepare
	var jQuery, $, ScrollTo;
	jQuery = $ = window.jQuery;

	/**
	 * jQuery ScrollTo (balupton edition)
	 * @version 1.2.0
	 * @date July 9, 2012
	 * @since 0.1.0, August 27, 2010
	 * @package jquery-scrollto {@link http://balupton.com/projects/jquery-scrollto}
	 * @author Benjamin "balupton" Lupton {@link http://balupton.com}
	 * @copyright (c) 2010 Benjamin Arthur Lupton {@link http://balupton.com}
	 * @license MIT License {@link http://creativecommons.org/licenses/MIT/}
	 */
	ScrollTo = $.ScrollTo = $.ScrollTo || {
		/**
		 * The Default Configuration
		 */
		config: {
			duration: 400,
			easing: 'swing',
			callback: undefined,
			durationMode: 'each',
			offsetTop: 0,
			offsetLeft: 0
		},

		/**
		 * Configure ScrollTo
		 */
		configure: function(options){
			// Apply Options to Config
			$.extend(ScrollTo.config, options||{});

			// Chain
			return this;
		},

		/**
		 * Perform the Scroll Animation for the Collections
		 * We use $inline here, so we can determine the actual offset start for each overflow:scroll item
		 * Each collection is for each overflow:scroll item
		 */
		scroll: function(collections, config){
			// Prepare
			var collection, $container, container, $target, $inline, position,
				containerScrollTop, containerScrollLeft,
				containerScrollTopEnd, containerScrollLeftEnd,
				startOffsetTop, targetOffsetTop, targetOffsetTopAdjusted,
				startOffsetLeft, targetOffsetLeft, targetOffsetLeftAdjusted,
				scrollOptions,
				callback;

			// Determine the Scroll
			collection = collections.pop();
			$container = collection.$container;
			container = $container.get(0);
			$target = collection.$target;

			// Prepare the Inline Element of the Container
			$inline = $('<span/>').css({
				'position': 'absolute',
				'top': '0px',
				'left': '0px'
			});
			position = $container.css('position');

			// Insert the Inline Element of the Container
			$container.css('position','relative');
			$inline.appendTo($container);

			// Determine the top offset
			startOffsetTop = $inline.offset().top;
			targetOffsetTop = $target.offset().top;
			targetOffsetTopAdjusted = targetOffsetTop - startOffsetTop - parseInt(config.offsetTop,10);

			// Determine the left offset
			startOffsetLeft = $inline.offset().left;
			targetOffsetLeft = $target.offset().left;
			targetOffsetLeftAdjusted = targetOffsetLeft - startOffsetLeft - parseInt(config.offsetLeft,10);

			// Determine current scroll positions
			containerScrollTop = container.scrollTop;
			containerScrollLeft = container.scrollLeft;

			// Reset the Inline Element of the Container
			$inline.remove();
			$container.css('position',position);

			// Prepare the scroll options
			scrollOptions = {};

			// Prepare the callback
			callback = function(event){
				// Check
				if ( collections.length === 0 ) {
					// Callback
					if ( typeof config.callback === 'function' ) {
						config.callback.apply(this,[event]);
					}
				}
				else {
					// Recurse
					ScrollTo.scroll(collections,config);
				}
				// Return true
				return true;
			};

			// Handle if we only want to scroll if we are outside the viewport
			if ( config.onlyIfOutside ) {
				// Determine current scroll positions
				containerScrollTopEnd = containerScrollTop + $container.height();
				containerScrollLeftEnd = containerScrollLeft + $container.width();

				// Check if we are in the range of the visible area of the container
				if ( containerScrollTop < targetOffsetTopAdjusted && targetOffsetTopAdjusted < containerScrollTopEnd ) {
					targetOffsetTopAdjusted = containerScrollTop;
				}
				if ( containerScrollLeft < targetOffsetLeftAdjusted && targetOffsetLeftAdjusted < containerScrollLeftEnd ) {
					targetOffsetLeftAdjusted = containerScrollLeft;
				}
			}

			// Determine the scroll options
			if ( targetOffsetTopAdjusted !== containerScrollTop ) {
				scrollOptions.scrollTop = targetOffsetTopAdjusted;
			}
			if ( targetOffsetLeftAdjusted !== containerScrollLeft ) {
				scrollOptions.scrollLeft = targetOffsetLeftAdjusted;
			}

			// Perform the scroll
			if ( $.browser.safari && container === document.body ) {
				window.scrollTo(scrollOptions.scrollLeft, scrollOptions.scrollTop);
				callback();
			}
			else if ( scrollOptions.scrollTop || scrollOptions.scrollLeft ) {
				$container.animate(scrollOptions, config.duration, config.easing, callback);
			}
			else {
				callback();
			}

			// Return true
			return true;
		},

		/**
		 * ScrollTo the Element using the Options
		 */
		fn: function(options){
			// Prepare
			var collections, config, $container, container;
			collections = [];

			// Prepare
			var	$target = $(this);
			if ( $target.length === 0 ) {
				// Chain
				return this;
			}

			// Handle Options
			config = $.extend({},ScrollTo.config,options);

			// Fetch
			$container = $target.parent();
			container = $container.get(0);

			// Cycle through the containers
			while ( ($container.length === 1) && (container !== document.body) && (container !== document) ) {
				// Check Container for scroll differences
				var scrollTop, scrollLeft;
				scrollTop = $container.css('overflow-y') !== 'visible' && container.scrollHeight !== container.clientHeight;
				scrollLeft =  $container.css('overflow-x') !== 'visible' && container.scrollWidth !== container.clientWidth;
				if ( scrollTop || scrollLeft ) {
					// Push the Collection
					collections.push({
						'$container': $container,
						'$target': $target
					});
					// Update the Target
					$target = $container;
				}
				// Update the Container
				$container = $container.parent();
				container = $container.get(0);
			}

			// Add the final collection
			collections.push({
				'$container': $(
					($.browser.msie || $.browser.mozilla) ? 'html,body' : 'body'
				),
				'$target': $target
			});

			// Adjust the Config
			if ( config.durationMode === 'all' ) {
				config.duration /= collections.length;
			}

			// Handle
			ScrollTo.scroll(collections,config);

			// Chain
			return this;
		}
	};

	// Apply our jQuery Prototype Function
	$.fn.ScrollTo = $.ScrollTo.fn;

})(window);
/*
 * jQuery timepicker addon
 * By: Trent Richardson [http://trentrichardson.com]
 * Version 1.0.3
 * Last Modified: 09/15/2012
 *
 * Copyright 2012 Trent Richardson
 * You may use this project under MIT or GPL licenses.
 * http://trentrichardson.com/Impromptu/GPL-LICENSE.txt
 * http://trentrichardson.com/Impromptu/MIT-LICENSE.txt
 *
 * HERES THE CSS:
 * .ui-timepicker-div .ui-widget-header { margin-bottom: 8px; }
 * .ui-timepicker-div dl { text-align: left; }
 * .ui-timepicker-div dl dt { height: 25px; margin-bottom: -25px; }
 * .ui-timepicker-div dl dd { margin: 0 10px 10px 65px; }
 * .ui-timepicker-div td { font-size: 90%; }
 * .ui-tpicker-grid-label { background: none; border: none; margin: 0; padding: 0; }
 */

/*jslint evil: true, white: false, undef: false, nomen: false */

(function($) {

	/*
	* Lets not redefine timepicker, Prevent "Uncaught RangeError: Maximum call stack size exceeded"
	*/
	$.ui.timepicker = $.ui.timepicker || {};
	if ($.ui.timepicker.version) {
		return;
	}

	/*
	* Extend jQueryUI, get it started with our version number
	*/
	$.extend($.ui, {
		timepicker: {
			version: "1.0.3"
		}
	});

	/* 
	* Timepicker manager.
	* Use the singleton instance of this class, $.timepicker, to interact with the time picker.
	* Settings for (groups of) time pickers are maintained in an instance object,
	* allowing multiple different settings on the same page.
	*/
	function Timepicker() {
		this.regional = []; // Available regional settings, indexed by language code
		this.regional[''] = { // Default regional settings
			currentText: 'Now',
			closeText: 'Done',
			ampm: false,
			amNames: ['AM', 'A'],
			pmNames: ['PM', 'P'],
			timeFormat: 'hh:mm tt',
			timeSuffix: '',
			timeOnlyTitle: 'Choose Time',
			timeText: 'Time',
			hourText: 'Hour',
			minuteText: 'Minute',
			secondText: 'Second',
			millisecText: 'Millisecond',
			timezoneText: 'Time Zone'
		};
		this._defaults = { // Global defaults for all the datetime picker instances
			showButtonPanel: true,
			timeOnly: false,
			showHour: true,
			showMinute: true,
			showSecond: false,
			showMillisec: false,
			showTimezone: false,
			showTime: true,
			stepHour: 1,
			stepMinute: 1,
			stepSecond: 1,
			stepMillisec: 1,
			hour: 0,
			minute: 0,
			second: 0,
			millisec: 0,
			timezone: null,
			useLocalTimezone: false,
			defaultTimezone: "+0000",
			hourMin: 0,
			minuteMin: 0,
			secondMin: 0,
			millisecMin: 0,
			hourMax: 23,
			minuteMax: 59,
			secondMax: 59,
			millisecMax: 999,
			minDateTime: null,
			maxDateTime: null,
			onSelect: null,
			hourGrid: 0,
			minuteGrid: 0,
			secondGrid: 0,
			millisecGrid: 0,
			alwaysSetTime: true,
			separator: ' ',
			altFieldTimeOnly: true,
			altSeparator: null,
			altTimeSuffix: null,
			showTimepicker: true,
			timezoneIso8601: false,
			timezoneList: null,
			addSliderAccess: false,
			sliderAccessArgs: null,
			defaultValue: null
		};
		$.extend(this._defaults, this.regional['']);
	}

	$.extend(Timepicker.prototype, {
		$input: null,
		$altInput: null,
		$timeObj: null,
		inst: null,
		hour_slider: null,
		minute_slider: null,
		second_slider: null,
		millisec_slider: null,
		timezone_select: null,
		hour: 0,
		minute: 0,
		second: 0,
		millisec: 0,
		timezone: null,
		defaultTimezone: "+0000",
		hourMinOriginal: null,
		minuteMinOriginal: null,
		secondMinOriginal: null,
		millisecMinOriginal: null,
		hourMaxOriginal: null,
		minuteMaxOriginal: null,
		secondMaxOriginal: null,
		millisecMaxOriginal: null,
		ampm: '',
		formattedDate: '',
		formattedTime: '',
		formattedDateTime: '',
		timezoneList: null,
		units: ['hour','minute','second','millisec'],

		/* 
		* Override the default settings for all instances of the time picker.
		* @param  settings  object - the new settings to use as defaults (anonymous object)
		* @return the manager object
		*/
		setDefaults: function(settings) {
			extendRemove(this._defaults, settings || {});
			return this;
		},

		/*
		* Create a new Timepicker instance
		*/
		_newInst: function($input, o) {
			var tp_inst = new Timepicker(),
				inlineSettings = {};

			for (var attrName in this._defaults) {
				if(this._defaults.hasOwnProperty(attrName)){
					var attrValue = $input.attr('time:' + attrName);
					if (attrValue) {
						try {
							inlineSettings[attrName] = eval(attrValue);
						} catch (err) {
							inlineSettings[attrName] = attrValue;
						}
					}
				}
			}
			tp_inst._defaults = $.extend({}, this._defaults, inlineSettings, o, {
				beforeShow: function(input, dp_inst) {
					if ($.isFunction(o.beforeShow)) {
						return o.beforeShow(input, dp_inst, tp_inst);
					}
				},
				onChangeMonthYear: function(year, month, dp_inst) {
					// Update the time as well : this prevents the time from disappearing from the $input field.
					tp_inst._updateDateTime(dp_inst);
					if ($.isFunction(o.onChangeMonthYear)) {
						o.onChangeMonthYear.call($input[0], year, month, dp_inst, tp_inst);
					}
				},
				onClose: function(dateText, dp_inst) {
					if (tp_inst.timeDefined === true && $input.val() !== '') {
						tp_inst._updateDateTime(dp_inst);
					}
					if ($.isFunction(o.onClose)) {
						o.onClose.call($input[0], dateText, dp_inst, tp_inst);
					}
				},
				timepicker: tp_inst // add timepicker as a property of datepicker: $.datepicker._get(dp_inst, 'timepicker');
			});
			tp_inst.amNames = $.map(tp_inst._defaults.amNames, function(val) {
				return val.toUpperCase();
			});
			tp_inst.pmNames = $.map(tp_inst._defaults.pmNames, function(val) {
				return val.toUpperCase();
			});

			if (tp_inst._defaults.timezoneList === null) {
				var timezoneList = ['-1200', '-1100', '-1000', '-0930', '-0900', '-0800', '-0700', '-0600', '-0500', '-0430', '-0400', '-0330', '-0300', '-0200', '-0100', '+0000', 
									'+0100', '+0200', '+0300', '+0330', '+0400', '+0430', '+0500', '+0530', '+0545', '+0600', '+0630', '+0700', '+0800', '+0845', '+0900', '+0930', 
									'+1000', '+1030', '+1100', '+1130', '+1200', '+1245', '+1300', '+1400'];

				if (tp_inst._defaults.timezoneIso8601) {
					timezoneList = $.map(timezoneList, function(val) {
						return val == '+0000' ? 'Z' : (val.substring(0, 3) + ':' + val.substring(3));
					});
				}
				tp_inst._defaults.timezoneList = timezoneList;
			}

			tp_inst.timezone = tp_inst._defaults.timezone;
			tp_inst.hour = tp_inst._defaults.hour;
			tp_inst.minute = tp_inst._defaults.minute;
			tp_inst.second = tp_inst._defaults.second;
			tp_inst.millisec = tp_inst._defaults.millisec;
			tp_inst.ampm = '';
			tp_inst.$input = $input;

			if (o.altField) {
				tp_inst.$altInput = $(o.altField).css({
					cursor: 'pointer'
				}).focus(function() {
					$input.trigger("focus");
				});
			}

			if (tp_inst._defaults.minDate === 0 || tp_inst._defaults.minDateTime === 0) {
				tp_inst._defaults.minDate = new Date();
			}
			if (tp_inst._defaults.maxDate === 0 || tp_inst._defaults.maxDateTime === 0) {
				tp_inst._defaults.maxDate = new Date();
			}

			// datepicker needs minDate/maxDate, timepicker needs minDateTime/maxDateTime..
			if (tp_inst._defaults.minDate !== undefined && tp_inst._defaults.minDate instanceof Date) {
				tp_inst._defaults.minDateTime = new Date(tp_inst._defaults.minDate.getTime());
			}
			if (tp_inst._defaults.minDateTime !== undefined && tp_inst._defaults.minDateTime instanceof Date) {
				tp_inst._defaults.minDate = new Date(tp_inst._defaults.minDateTime.getTime());
			}
			if (tp_inst._defaults.maxDate !== undefined && tp_inst._defaults.maxDate instanceof Date) {
				tp_inst._defaults.maxDateTime = new Date(tp_inst._defaults.maxDate.getTime());
			}
			if (tp_inst._defaults.maxDateTime !== undefined && tp_inst._defaults.maxDateTime instanceof Date) {
				tp_inst._defaults.maxDate = new Date(tp_inst._defaults.maxDateTime.getTime());
			}
			tp_inst.$input.bind('focus', function() {
				tp_inst._onFocus();
			});

			return tp_inst;
		},

		/*
		* add our sliders to the calendar
		*/
		_addTimePicker: function(dp_inst) {
			var currDT = (this.$altInput && this._defaults.altFieldTimeOnly) ? this.$input.val() + ' ' + this.$altInput.val() : this.$input.val();

			this.timeDefined = this._parseTime(currDT);
			this._limitMinMaxDateTime(dp_inst, false);
			this._injectTimePicker();
		},

		/*
		* parse the time string from input value or _setTime
		*/
		_parseTime: function(timeString, withDate) {
			if (!this.inst) {
				this.inst = $.datepicker._getInst(this.$input[0]);
			}

			if (withDate || !this._defaults.timeOnly) {
				var dp_dateFormat = $.datepicker._get(this.inst, 'dateFormat');
				try {
					var parseRes = parseDateTimeInternal(dp_dateFormat, this._defaults.timeFormat, timeString, $.datepicker._getFormatConfig(this.inst), this._defaults);
					if (!parseRes.timeObj) {
						return false;
					}
					$.extend(this, parseRes.timeObj);
				} catch (err) {
					return false;
				}
				return true;
			} else {
				var timeObj = $.datepicker.parseTime(this._defaults.timeFormat, timeString, this._defaults);
				if (!timeObj) {
					return false;
				}
				$.extend(this, timeObj);
				return true;
			}
		},

		/*
		* generate and inject html for timepicker into ui datepicker
		*/
		_injectTimePicker: function() {
			var $dp = this.inst.dpDiv,
				o = this.inst.settings,
				tp_inst = this,
				litem = '',
				uitem = '',
				max = {},
				gridSize = {},
				size = null;

			// Prevent displaying twice
			if ($dp.find("div.ui-timepicker-div").length === 0 && o.showTimepicker) {
				var noDisplay = ' style="display:none;"',
					html = '<div class="ui-timepicker-div"><dl>' + '<dt class="ui_tpicker_time_label"' + ((o.showTime) ? '' : noDisplay) + '>' + o.timeText + '</dt>' + 
								'<dd class="ui_tpicker_time"' + ((o.showTime) ? '' : noDisplay) + '></dd>';

				// Create the markup
				for(var i=0,l=this.units.length; i<l; i++){
					litem = this.units[i];
					uitem = litem.substr(0,1).toUpperCase() + litem.substr(1);
					// Added by Peter Medeiros:
					// - Figure out what the hour/minute/second max should be based on the step values.
					// - Example: if stepMinute is 15, then minMax is 45.
					max[litem] = parseInt((o[litem+'Max'] - ((o[litem+'Max'] - o[litem+'Min']) % o['step'+uitem])), 10);
					gridSize[litem] = 0;

					html += '<dt class="ui_tpicker_'+ litem +'_label"' + ((o['show'+uitem]) ? '' : noDisplay) + '>' + o[litem +'Text'] + '</dt>' + 
								'<dd class="ui_tpicker_'+ litem +'"><div class="ui_tpicker_'+ litem +'_slider"' + ((o['show'+uitem]) ? '' : noDisplay) + '></div>';

					if (o['show'+uitem] && o[litem+'Grid'] > 0) {
						html += '<div style="padding-left: 1px"><table class="ui-tpicker-grid-label"><tr>';

						if(litem == 'hour'){
							for (var h = o[litem+'Min']; h <= max[litem]; h += parseInt(o[litem+'Grid'], 10)) {
								gridSize[litem]++;
								var tmph = (o.ampm && h > 12) ? h - 12 : h;
								if (tmph < 10) {
									tmph = '0' + tmph;
								}
								if (o.ampm) {
									if (h === 0) {
										tmph = 12 + 'a';
									} else {
										if (h < 12) {
											tmph += 'a';
										} else {
											tmph += 'p';
										}
									}
								}
								html += '<td data-for="'+litem+'">' + tmph + '</td>';
							}
						}
						else{
							for (var m = o[litem+'Min']; m <= max[litem]; m += parseInt(o[litem+'Grid'], 10)) {
								gridSize[litem]++;
								html += '<td data-for="'+litem+'">' + ((m < 10) ? '0' : '') + m + '</td>';
							}
						}

						html += '</tr></table></div>';
					}
					html += '</dd>';
				}
				
				// Timezone
				html += '<dt class="ui_tpicker_timezone_label"' + ((o.showTimezone) ? '' : noDisplay) + '>' + o.timezoneText + '</dt>';
				html += '<dd class="ui_tpicker_timezone" ' + ((o.showTimezone) ? '' : noDisplay) + '></dd>';

				// Create the elements from string
				html += '</dl></div>';
				var $tp = $(html);

				// if we only want time picker...
				if (o.timeOnly === true) {
					$tp.prepend('<div class="ui-widget-header ui-helper-clearfix ui-corner-all">' + '<div class="ui-datepicker-title">' + o.timeOnlyTitle + '</div>' + '</div>');
					$dp.find('.ui-datepicker-header, .ui-datepicker-calendar').hide();
				}
				
				// Updated by Peter Medeiros:
				// - Pass in Event and UI instance into slide function
				this.hour_slider = $tp.find('.ui_tpicker_hour_slider').prop('slide', null).slider({
					orientation: "horizontal",
					value: this.hour,
					min: o.hourMin,
					max: max.hour,
					step: o.stepHour,
					slide: function(event, ui) {
						tp_inst.hour_slider.slider("option", "value", ui.value);
						tp_inst._onTimeChange();
					},
					stop: function(event, ui) {
						tp_inst._onSelectHandler();
					}
				});

				this.minute_slider = $tp.find('.ui_tpicker_minute_slider').prop('slide', null).slider({
					orientation: "horizontal",
					value: this.minute,
					min: o.minuteMin,
					max: max.minute,
					step: o.stepMinute,
					slide: function(event, ui) {
						tp_inst.minute_slider.slider("option", "value", ui.value);
						tp_inst._onTimeChange();
					},
					stop: function(event, ui) {
						tp_inst._onSelectHandler();
					}
				});

				this.second_slider = $tp.find('.ui_tpicker_second_slider').prop('slide', null).slider({
					orientation: "horizontal",
					value: this.second,
					min: o.secondMin,
					max: max.second,
					step: o.stepSecond,
					slide: function(event, ui) {
						tp_inst.second_slider.slider("option", "value", ui.value);
						tp_inst._onTimeChange();
					},
					stop: function(event, ui) {
						tp_inst._onSelectHandler();
					}
				});

				this.millisec_slider = $tp.find('.ui_tpicker_millisec_slider').prop('slide', null).slider({
					orientation: "horizontal",
					value: this.millisec,
					min: o.millisecMin,
					max: max.millisec,
					step: o.stepMillisec,
					slide: function(event, ui) {
						tp_inst.millisec_slider.slider("option", "value", ui.value);
						tp_inst._onTimeChange();
					},
					stop: function(event, ui) {
						tp_inst._onSelectHandler();
					}
				});

				// add sliders, adjust grids, add events
				for(var i=0,l=tp_inst.units.length; i<l; i++){
					litem = tp_inst.units[i];
					uitem = litem.substr(0,1).toUpperCase() + litem.substr(1);
					
					/* 
						Something fishy happens when assigning to tp_inst['hour_slider'] instead of tp_inst.hour_slider, I think 
						it is because it is assigned as a prototype. Clicking the slider will always change to the previous value 
						not the new one clicked. Ideally this works and reduces the 80+ lines of code above
					// add the slider
					tp_inst[litem+'_slider'] = $tp.find('.ui_tpicker_'+litem+'_slider').prop('slide', null).slider({
						orientation: "horizontal",
						value: tp_inst[litem],
						min: o[litem+'Min'],
						max: max[litem],
						step: o['step'+uitem],
						slide: function(event, ui) {
							tp_inst[litem+'_slider'].slider("option", "value", ui.value);
							tp_inst._onTimeChange();
						},
						stop: function(event, ui) {
							//Emulate datepicker onSelect behavior. Call on slidestop.
							tp_inst._onSelectHandler();
						}
					});
					*/

					// adjust the grid and add click event
					if (o['show'+uitem] && o[litem+'Grid'] > 0) {
						size = 100 * gridSize[litem] * o[litem+'Grid'] / (max[litem] - o[litem+'Min']);
						$tp.find('.ui_tpicker_'+litem+' table').css({
							width: size + "%",
							marginLeft: (size / (-2 * gridSize[litem])) + "%",
							borderCollapse: 'collapse'
						}).find("td").click(function(e){
								var $t = $(this),
									h = $t.html(),
									f = $t.data('for'); // loses scope, so we use data-for

								if (f == 'hour' && o.ampm) {
									var ap = h.substring(2).toLowerCase(),
										aph = parseInt(h.substring(0, 2), 10);
									if (ap == 'a') {
										if (aph == 12) {
											h = 0;
										} else {
											h = aph;
										}
									} else if (aph == 12) {
										h = 12;
									} else {
										h = aph + 12;
									}
								}
								tp_inst[f+'_slider'].slider("option", "value", parseInt(h,10));
								tp_inst._onTimeChange();
								tp_inst._onSelectHandler();
							})
						.css({
								cursor: 'pointer',
								width: (100 / gridSize[litem]) + '%',
								textAlign: 'center',
								overflow: 'hidden'
							});
					} // end if grid > 0
				} // end for loop

				// Add timezone options
				this.timezone_select = $tp.find('.ui_tpicker_timezone').append('<select></select>').find("select");
				$.fn.append.apply(this.timezone_select,
				$.map(o.timezoneList, function(val, idx) {
					return $("<option />").val(typeof val == "object" ? val.value : val).text(typeof val == "object" ? val.label : val);
				}));
				if (typeof(this.timezone) != "undefined" && this.timezone !== null && this.timezone !== "") {
					var local_date = new Date(this.inst.selectedYear, this.inst.selectedMonth, this.inst.selectedDay, 12);
					var local_timezone = $.timepicker.timeZoneOffsetString(local_date);
					if (local_timezone == this.timezone) {
						selectLocalTimeZone(tp_inst);
					} else {
						this.timezone_select.val(this.timezone);
					}
				} else {
					if (typeof(this.hour) != "undefined" && this.hour !== null && this.hour !== "") {
						this.timezone_select.val(o.defaultTimezone);
					} else {
						selectLocalTimeZone(tp_inst);
					}
				}
				this.timezone_select.change(function() {
					tp_inst._defaults.useLocalTimezone = false;
					tp_inst._onTimeChange();
				});
				// End timezone options
				
				// inject timepicker into datepicker
				var $buttonPanel = $dp.find('.ui-datepicker-buttonpane');
				if ($buttonPanel.length) {
					$buttonPanel.before($tp);
				} else {
					$dp.append($tp);
				}

				this.$timeObj = $tp.find('.ui_tpicker_time');

				if (this.inst !== null) {
					var timeDefined = this.timeDefined;
					this._onTimeChange();
					this.timeDefined = timeDefined;
				}

				// slideAccess integration: http://trentrichardson.com/2011/11/11/jquery-ui-sliders-and-touch-accessibility/
				if (this._defaults.addSliderAccess) {
					var sliderAccessArgs = this._defaults.sliderAccessArgs;
					setTimeout(function() { // fix for inline mode
						if ($tp.find('.ui-slider-access').length === 0) {
							$tp.find('.ui-slider:visible').sliderAccess(sliderAccessArgs);

							// fix any grids since sliders are shorter
							var sliderAccessWidth = $tp.find('.ui-slider-access:eq(0)').outerWidth(true);
							if (sliderAccessWidth) {
								$tp.find('table:visible').each(function() {
									var $g = $(this),
										oldWidth = $g.outerWidth(),
										oldMarginLeft = $g.css('marginLeft').toString().replace('%', ''),
										newWidth = oldWidth - sliderAccessWidth,
										newMarginLeft = ((oldMarginLeft * newWidth) / oldWidth) + '%';

									$g.css({
										width: newWidth,
										marginLeft: newMarginLeft
									});
								});
							}
						}
					}, 10);
				}
				// end slideAccess integration

			}
		},

		/*
		* This function tries to limit the ability to go outside the
		* min/max date range
		*/
		_limitMinMaxDateTime: function(dp_inst, adjustSliders) {
			var o = this._defaults,
				dp_date = new Date(dp_inst.selectedYear, dp_inst.selectedMonth, dp_inst.selectedDay);

			if (!this._defaults.showTimepicker) {
				return;
			} // No time so nothing to check here

			if ($.datepicker._get(dp_inst, 'minDateTime') !== null && $.datepicker._get(dp_inst, 'minDateTime') !== undefined && dp_date) {
				var minDateTime = $.datepicker._get(dp_inst, 'minDateTime'),
					minDateTimeDate = new Date(minDateTime.getFullYear(), minDateTime.getMonth(), minDateTime.getDate(), 0, 0, 0, 0);

				if (this.hourMinOriginal === null || this.minuteMinOriginal === null || this.secondMinOriginal === null || this.millisecMinOriginal === null) {
					this.hourMinOriginal = o.hourMin;
					this.minuteMinOriginal = o.minuteMin;
					this.secondMinOriginal = o.secondMin;
					this.millisecMinOriginal = o.millisecMin;
				}

				if (dp_inst.settings.timeOnly || minDateTimeDate.getTime() == dp_date.getTime()) {
					this._defaults.hourMin = minDateTime.getHours();
					if (this.hour <= this._defaults.hourMin) {
						this.hour = this._defaults.hourMin;
						this._defaults.minuteMin = minDateTime.getMinutes();
						if (this.minute <= this._defaults.minuteMin) {
							this.minute = this._defaults.minuteMin;
							this._defaults.secondMin = minDateTime.getSeconds();
							if (this.second <= this._defaults.secondMin) {
								this.second = this._defaults.secondMin;
								this._defaults.millisecMin = minDateTime.getMilliseconds();
							} else {
								if (this.millisec < this._defaults.millisecMin) {
									this.millisec = this._defaults.millisecMin;
								}
								this._defaults.millisecMin = this.millisecMinOriginal;
							}
						} else {
							this._defaults.secondMin = this.secondMinOriginal;
							this._defaults.millisecMin = this.millisecMinOriginal;
						}
					} else {
						this._defaults.minuteMin = this.minuteMinOriginal;
						this._defaults.secondMin = this.secondMinOriginal;
						this._defaults.millisecMin = this.millisecMinOriginal;
					}
				} else {
					this._defaults.hourMin = this.hourMinOriginal;
					this._defaults.minuteMin = this.minuteMinOriginal;
					this._defaults.secondMin = this.secondMinOriginal;
					this._defaults.millisecMin = this.millisecMinOriginal;
				}
			}

			if ($.datepicker._get(dp_inst, 'maxDateTime') !== null && $.datepicker._get(dp_inst, 'maxDateTime') !== undefined && dp_date) {
				var maxDateTime = $.datepicker._get(dp_inst, 'maxDateTime'),
					maxDateTimeDate = new Date(maxDateTime.getFullYear(), maxDateTime.getMonth(), maxDateTime.getDate(), 0, 0, 0, 0);

				if (this.hourMaxOriginal === null || this.minuteMaxOriginal === null || this.secondMaxOriginal === null) {
					this.hourMaxOriginal = o.hourMax;
					this.minuteMaxOriginal = o.minuteMax;
					this.secondMaxOriginal = o.secondMax;
					this.millisecMaxOriginal = o.millisecMax;
				}

				if (dp_inst.settings.timeOnly || maxDateTimeDate.getTime() == dp_date.getTime()) {
					this._defaults.hourMax = maxDateTime.getHours();
					if (this.hour >= this._defaults.hourMax) {
						this.hour = this._defaults.hourMax;
						this._defaults.minuteMax = maxDateTime.getMinutes();
						if (this.minute >= this._defaults.minuteMax) {
							this.minute = this._defaults.minuteMax;
							this._defaults.secondMax = maxDateTime.getSeconds();
						} else if (this.second >= this._defaults.secondMax) {
							this.second = this._defaults.secondMax;
							this._defaults.millisecMax = maxDateTime.getMilliseconds();
						} else {
							if (this.millisec > this._defaults.millisecMax) {
								this.millisec = this._defaults.millisecMax;
							}
							this._defaults.millisecMax = this.millisecMaxOriginal;
						}
					} else {
						this._defaults.minuteMax = this.minuteMaxOriginal;
						this._defaults.secondMax = this.secondMaxOriginal;
						this._defaults.millisecMax = this.millisecMaxOriginal;
					}
				} else {
					this._defaults.hourMax = this.hourMaxOriginal;
					this._defaults.minuteMax = this.minuteMaxOriginal;
					this._defaults.secondMax = this.secondMaxOriginal;
					this._defaults.millisecMax = this.millisecMaxOriginal;
				}
			}

			if (adjustSliders !== undefined && adjustSliders === true) {
				var hourMax = parseInt((this._defaults.hourMax - ((this._defaults.hourMax - this._defaults.hourMin) % this._defaults.stepHour)), 10),
					minMax = parseInt((this._defaults.minuteMax - ((this._defaults.minuteMax - this._defaults.minuteMin) % this._defaults.stepMinute)), 10),
					secMax = parseInt((this._defaults.secondMax - ((this._defaults.secondMax - this._defaults.secondMin) % this._defaults.stepSecond)), 10),
					millisecMax = parseInt((this._defaults.millisecMax - ((this._defaults.millisecMax - this._defaults.millisecMin) % this._defaults.stepMillisec)), 10);

				if (this.hour_slider) {
					this.hour_slider.slider("option", {
						min: this._defaults.hourMin,
						max: hourMax
					}).slider('value', this.hour);
				}
				if (this.minute_slider) {
					this.minute_slider.slider("option", {
						min: this._defaults.minuteMin,
						max: minMax
					}).slider('value', this.minute);
				}
				if (this.second_slider) {
					this.second_slider.slider("option", {
						min: this._defaults.secondMin,
						max: secMax
					}).slider('value', this.second);
				}
				if (this.millisec_slider) {
					this.millisec_slider.slider("option", {
						min: this._defaults.millisecMin,
						max: millisecMax
					}).slider('value', this.millisec);
				}
			}

		},

		/*
		* when a slider moves, set the internal time...
		* on time change is also called when the time is updated in the text field
		*/
		_onTimeChange: function() {
			var hour = (this.hour_slider) ? this.hour_slider.slider('value') : false,
				minute = (this.minute_slider) ? this.minute_slider.slider('value') : false,
				second = (this.second_slider) ? this.second_slider.slider('value') : false,
				millisec = (this.millisec_slider) ? this.millisec_slider.slider('value') : false,
				timezone = (this.timezone_select) ? this.timezone_select.val() : false,
				o = this._defaults;

			if (typeof(hour) == 'object') {
				hour = false;
			}
			if (typeof(minute) == 'object') {
				minute = false;
			}
			if (typeof(second) == 'object') {
				second = false;
			}
			if (typeof(millisec) == 'object') {
				millisec = false;
			}
			if (typeof(timezone) == 'object') {
				timezone = false;
			}

			if (hour !== false) {
				hour = parseInt(hour, 10);
			}
			if (minute !== false) {
				minute = parseInt(minute, 10);
			}
			if (second !== false) {
				second = parseInt(second, 10);
			}
			if (millisec !== false) {
				millisec = parseInt(millisec, 10);
			}

			var ampm = o[hour < 12 ? 'amNames' : 'pmNames'][0];

			// If the update was done in the input field, the input field should not be updated.
			// If the update was done using the sliders, update the input field.
			var hasChanged = (hour != this.hour || minute != this.minute || second != this.second || millisec != this.millisec 
								|| (this.ampm.length > 0 && (hour < 12) != ($.inArray(this.ampm.toUpperCase(), this.amNames) !== -1)) 
								|| ((this.timezone === null && timezone != this.defaultTimezone) || (this.timezone !== null && timezone != this.timezone)));

			if (hasChanged) {

				if (hour !== false) {
					this.hour = hour;
				}
				if (minute !== false) {
					this.minute = minute;
				}
				if (second !== false) {
					this.second = second;
				}
				if (millisec !== false) {
					this.millisec = millisec;
				}
				if (timezone !== false) {
					this.timezone = timezone;
				}

				if (!this.inst) {
					this.inst = $.datepicker._getInst(this.$input[0]);
				}

				this._limitMinMaxDateTime(this.inst, true);
			}
			if (o.ampm) {
				this.ampm = ampm;
			}

			//this._formatTime();
			this.formattedTime = $.datepicker.formatTime(this._defaults.timeFormat, this, this._defaults);
			if (this.$timeObj) {
				this.$timeObj.text(this.formattedTime + o.timeSuffix);
			}
			this.timeDefined = true;
			if (hasChanged) {
				this._updateDateTime();
			}
		},

		/*
		* call custom onSelect.
		* bind to sliders slidestop, and grid click.
		*/
		_onSelectHandler: function() {
			var onSelect = this._defaults.onSelect || this.inst.settings.onSelect;
			var inputEl = this.$input ? this.$input[0] : null;
			if (onSelect && inputEl) {
				onSelect.apply(inputEl, [this.formattedDateTime, this]);
			}
		},

		/*
		* left for any backwards compatibility
		*/
		_formatTime: function(time, format) {
			time = time || {
				hour: this.hour,
				minute: this.minute,
				second: this.second,
				millisec: this.millisec,
				ampm: this.ampm,
				timezone: this.timezone
			};
			var tmptime = (format || this._defaults.timeFormat).toString();

			tmptime = $.datepicker.formatTime(tmptime, time, this._defaults);

			if (arguments.length) {
				return tmptime;
			} else {
				this.formattedTime = tmptime;
			}
		},

		/*
		* update our input with the new date time..
		*/
		_updateDateTime: function(dp_inst) {
			dp_inst = this.inst || dp_inst;
			var dt = $.datepicker._daylightSavingAdjust(new Date(dp_inst.selectedYear, dp_inst.selectedMonth, dp_inst.selectedDay)),
				dateFmt = $.datepicker._get(dp_inst, 'dateFormat'),
				formatCfg = $.datepicker._getFormatConfig(dp_inst),
				timeAvailable = dt !== null && this.timeDefined;
			this.formattedDate = $.datepicker.formatDate(dateFmt, (dt === null ? new Date() : dt), formatCfg);
			var formattedDateTime = this.formattedDate;

			/*
			* remove following lines to force every changes in date picker to change the input value
			* Bug descriptions: when an input field has a default value, and click on the field to pop up the date picker. 
			* If the user manually empty the value in the input field, the date picker will never change selected value.
			*/
			//if (dp_inst.lastVal !== undefined && (dp_inst.lastVal.length > 0 && this.$input.val().length === 0)) {
			//	return;
			//}

			if (this._defaults.timeOnly === true) {
				formattedDateTime = this.formattedTime;
			} else if (this._defaults.timeOnly !== true && (this._defaults.alwaysSetTime || timeAvailable)) {
				formattedDateTime += this._defaults.separator + this.formattedTime + this._defaults.timeSuffix;
			}

			this.formattedDateTime = formattedDateTime;

			if (!this._defaults.showTimepicker) {
				this.$input.val(this.formattedDate);
			} else if (this.$altInput && this._defaults.altFieldTimeOnly === true) {
				this.$altInput.val(this.formattedTime);
				this.$input.val(this.formattedDate);
			} else if (this.$altInput) {
				this.$input.val(formattedDateTime);
				var altFormattedDateTime = '',
					altSeparator = this._defaults.altSeparator ? this._defaults.altSeparator : this._defaults.separator,
					altTimeSuffix = this._defaults.altTimeSuffix ? this._defaults.altTimeSuffix : this._defaults.timeSuffix;
				if (this._defaults.altFormat) altFormattedDateTime = $.datepicker.formatDate(this._defaults.altFormat, (dt === null ? new Date() : dt), formatCfg);
				else altFormattedDateTime = this.formattedDate;
				if (altFormattedDateTime) altFormattedDateTime += altSeparator;
				if (this._defaults.altTimeFormat) altFormattedDateTime += $.datepicker.formatTime(this._defaults.altTimeFormat, this, this._defaults) + altTimeSuffix;
				else altFormattedDateTime += this.formattedTime + altTimeSuffix;
				this.$altInput.val(altFormattedDateTime);
			} else {
				this.$input.val(formattedDateTime);
			}

			this.$input.trigger("change");
		},

		_onFocus: function() {
			if (!this.$input.val() && this._defaults.defaultValue) {
				this.$input.val(this._defaults.defaultValue);
				var inst = $.datepicker._getInst(this.$input.get(0)),
					tp_inst = $.datepicker._get(inst, 'timepicker');
				if (tp_inst) {
					if (tp_inst._defaults.timeOnly && (inst.input.val() != inst.lastVal)) {
						try {
							$.datepicker._updateDatepicker(inst);
						} catch (err) {
							$.datepicker.log(err);
						}
					}
				}
			}
		}

	});

	$.fn.extend({
		/*
		* shorthand just to use timepicker..
		*/
		timepicker: function(o) {
			o = o || {};
			var tmp_args = Array.prototype.slice.call(arguments);

			if (typeof o == 'object') {
				tmp_args[0] = $.extend(o, {
					timeOnly: true
				});
			}

			return $(this).each(function() {
				$.fn.datetimepicker.apply($(this), tmp_args);
			});
		},

		/*
		* extend timepicker to datepicker
		*/
		datetimepicker: function(o) {
			o = o || {};
			var tmp_args = arguments;

			if (typeof(o) == 'string') {
				if (o == 'getDate') {
					return $.fn.datepicker.apply($(this[0]), tmp_args);
				} else {
					return this.each(function() {
						var $t = $(this);
						$t.datepicker.apply($t, tmp_args);
					});
				}
			} else {
				return this.each(function() {
					var $t = $(this);
					$t.datepicker($.timepicker._newInst($t, o)._defaults);
				});
			}
		}
	});

	/*
	* Public Utility to parse date and time
	*/
	$.datepicker.parseDateTime = function(dateFormat, timeFormat, dateTimeString, dateSettings, timeSettings) {
		var parseRes = parseDateTimeInternal(dateFormat, timeFormat, dateTimeString, dateSettings, timeSettings);
		if (parseRes.timeObj) {
			var t = parseRes.timeObj;
			parseRes.date.setHours(t.hour, t.minute, t.second, t.millisec);
		}

		return parseRes.date;
	};

	/*
	* Public utility to parse time
	*/
	$.datepicker.parseTime = function(timeFormat, timeString, options) {
		
		// pattern for standard and localized AM/PM markers
		var getPatternAmpm = function(amNames, pmNames) {
			var markers = [];
			if (amNames) {
				$.merge(markers, amNames);
			}
			if (pmNames) {
				$.merge(markers, pmNames);
			}
			markers = $.map(markers, function(val) {
				return val.replace(/[.*+?|()\[\]{}\\]/g, '\\$&');
			});
			return '(' + markers.join('|') + ')?';
		};

		// figure out position of time elements.. cause js cant do named captures
		var getFormatPositions = function(timeFormat) {
			var finds = timeFormat.toLowerCase().match(/(h{1,2}|m{1,2}|s{1,2}|l{1}|t{1,2}|z)/g),
				orders = {
					h: -1,
					m: -1,
					s: -1,
					l: -1,
					t: -1,
					z: -1
				};

			if (finds) {
				for (var i = 0; i < finds.length; i++) {
					if (orders[finds[i].toString().charAt(0)] == -1) {
						orders[finds[i].toString().charAt(0)] = i + 1;
					}
				}
			}
			return orders;
		};

		var o = extendRemove(extendRemove({}, $.timepicker._defaults), options || {});

		var regstr = '^' + timeFormat.toString()
									.replace(/h{1,2}/ig, '(\\d?\\d)')
									.replace(/m{1,2}/ig, '(\\d?\\d)')
									.replace(/s{1,2}/ig, '(\\d?\\d)')
									.replace(/l{1}/ig, '(\\d?\\d?\\d)')
									.replace(/t{1,2}/ig, getPatternAmpm(o.amNames, o.pmNames))
									.replace(/z{1}/ig, '(z|[-+]\\d\\d:?\\d\\d|\\S+)?')
									.replace(/\s/g, '\\s?') + 
									o.timeSuffix + '$',
			order = getFormatPositions(timeFormat),
			ampm = '',
			treg;

		treg = timeString.match(new RegExp(regstr, 'i'));

		var resTime = {
			hour: 0,
			minute: 0,
			second: 0,
			millisec: 0
		};

		if (treg) {
			if (order.t !== -1) {
				if (treg[order.t] === undefined || treg[order.t].length === 0) {
					ampm = '';
					resTime.ampm = '';
				} else {
					ampm = $.inArray(treg[order.t].toUpperCase(), o.amNames) !== -1 ? 'AM' : 'PM';
					resTime.ampm = o[ampm == 'AM' ? 'amNames' : 'pmNames'][0];
				}
			}

			if (order.h !== -1) {
				if (ampm == 'AM' && treg[order.h] == '12') {
					resTime.hour = 0; // 12am = 0 hour
				} else {
					if (ampm == 'PM' && treg[order.h] != '12') {
						resTime.hour = parseInt(treg[order.h], 10) + 12; // 12pm = 12 hour, any other pm = hour + 12
					} else {
						resTime.hour = Number(treg[order.h]);
					}
				}
			}

			if (order.m !== -1) {
				resTime.minute = Number(treg[order.m]);
			}
			if (order.s !== -1) {
				resTime.second = Number(treg[order.s]);
			}
			if (order.l !== -1) {
				resTime.millisec = Number(treg[order.l]);
			}
			if (order.z !== -1 && treg[order.z] !== undefined) {
				var tz = treg[order.z].toUpperCase();
				switch (tz.length) {
				case 1:
					// Z
					tz = o.timezoneIso8601 ? 'Z' : '+0000';
					break;
				case 5:
					// +hhmm
					if (o.timezoneIso8601) {
						tz = tz.substring(1) == '0000' ? 'Z' : tz.substring(0, 3) + ':' + tz.substring(3);
					}
					break;
				case 6:
					// +hh:mm
					if (!o.timezoneIso8601) {
						tz = tz == 'Z' || tz.substring(1) == '00:00' ? '+0000' : tz.replace(/:/, '');
					} else {
						if (tz.substring(1) == '00:00') {
							tz = 'Z';
						}
					}
					break;
				}
				resTime.timezone = tz;
			}


			return resTime;
		}

		return false;
	};

	/*
	* Public utility to format the time
	* format = string format of the time
	* time = a {}, not a Date() for timezones
	* options = essentially the regional[].. amNames, pmNames, ampm
	*/
	$.datepicker.formatTime = function(format, time, options) {
		options = options || {};
		options = $.extend({}, $.timepicker._defaults, options);
		time = $.extend({
			hour: 0,
			minute: 0,
			second: 0,
			millisec: 0,
			timezone: '+0000'
		}, time);

		var tmptime = format;
		var ampmName = options.amNames[0];

		var hour = parseInt(time.hour, 10);
		if (options.ampm) {
			if (hour > 11) {
				ampmName = options.pmNames[0];
				if (hour > 12) {
					hour = hour % 12;
				}
			}
			if (hour === 0) {
				hour = 12;
			}
		}
		tmptime = tmptime.replace(/(?:hh?|mm?|ss?|[tT]{1,2}|[lz]|('.*?'|".*?"))/g, function(match) {
			switch (match.toLowerCase()) {
			case 'hh':
				return ('0' + hour).slice(-2);
			case 'h':
				return hour;
			case 'mm':
				return ('0' + time.minute).slice(-2);
			case 'm':
				return time.minute;
			case 'ss':
				return ('0' + time.second).slice(-2);
			case 's':
				return time.second;
			case 'l':
				return ('00' + time.millisec).slice(-3);
			case 'z':
				return time.timezone;
			case 't':
			case 'tt':
				if (options.ampm) {
					if (match.length == 1) {
						ampmName = ampmName.charAt(0);
					}
					return match.charAt(0) === 'T' ? ampmName.toUpperCase() : ampmName.toLowerCase();
				}
				return '';
			default:
				return match.replace(/\'/g, "") || "'";
			}
		});

		tmptime = $.trim(tmptime);
		return tmptime;
	};

	/*
	* the bad hack :/ override datepicker so it doesnt close on select
	// inspired: http://stackoverflow.com/questions/1252512/jquery-datepicker-prevent-closing-picker-when-clicking-a-date/1762378#1762378
	*/
	$.datepicker._base_selectDate = $.datepicker._selectDate;
	$.datepicker._selectDate = function(id, dateStr) {
		var inst = this._getInst($(id)[0]),
			tp_inst = this._get(inst, 'timepicker');

		if (tp_inst) {
			tp_inst._limitMinMaxDateTime(inst, true);
			inst.inline = inst.stay_open = true;
			//This way the onSelect handler called from calendarpicker get the full dateTime
			this._base_selectDate(id, dateStr);
			inst.inline = inst.stay_open = false;
			this._notifyChange(inst);
			this._updateDatepicker(inst);
		} else {
			this._base_selectDate(id, dateStr);
		}
	};

	/*
	* second bad hack :/ override datepicker so it triggers an event when changing the input field
	* and does not redraw the datepicker on every selectDate event
	*/
	$.datepicker._base_updateDatepicker = $.datepicker._updateDatepicker;
	$.datepicker._updateDatepicker = function(inst) {

		// don't popup the datepicker if there is another instance already opened
		var input = inst.input[0];
		if ($.datepicker._curInst && $.datepicker._curInst != inst && $.datepicker._datepickerShowing && $.datepicker._lastInput != input) {
			return;
		}

		if (typeof(inst.stay_open) !== 'boolean' || inst.stay_open === false) {

			this._base_updateDatepicker(inst);

			// Reload the time control when changing something in the input text field.
			var tp_inst = this._get(inst, 'timepicker');
			if (tp_inst) {
				tp_inst._addTimePicker(inst);

				if (tp_inst._defaults.useLocalTimezone) { //checks daylight saving with the new date.
					var date = new Date(inst.selectedYear, inst.selectedMonth, inst.selectedDay, 12);
					selectLocalTimeZone(tp_inst, date);
					tp_inst._onTimeChange();
				}
			}
		}
	};

	/*
	* third bad hack :/ override datepicker so it allows spaces and colon in the input field
	*/
	$.datepicker._base_doKeyPress = $.datepicker._doKeyPress;
	$.datepicker._doKeyPress = function(event) {
		var inst = $.datepicker._getInst(event.target),
			tp_inst = $.datepicker._get(inst, 'timepicker');

		if (tp_inst) {
			if ($.datepicker._get(inst, 'constrainInput')) {
				var ampm = tp_inst._defaults.ampm,
					dateChars = $.datepicker._possibleChars($.datepicker._get(inst, 'dateFormat')),
					datetimeChars = tp_inst._defaults.timeFormat.toString()
											.replace(/[hms]/g, '')
											.replace(/TT/g, ampm ? 'APM' : '')
											.replace(/Tt/g, ampm ? 'AaPpMm' : '')
											.replace(/tT/g, ampm ? 'AaPpMm' : '')
											.replace(/T/g, ampm ? 'AP' : '')
											.replace(/tt/g, ampm ? 'apm' : '')
											.replace(/t/g, ampm ? 'ap' : '') + 
											" " + tp_inst._defaults.separator + 
											tp_inst._defaults.timeSuffix + 
											(tp_inst._defaults.showTimezone ? tp_inst._defaults.timezoneList.join('') : '') + 
											(tp_inst._defaults.amNames.join('')) + (tp_inst._defaults.pmNames.join('')) + 
											dateChars,
					chr = String.fromCharCode(event.charCode === undefined ? event.keyCode : event.charCode);
				return event.ctrlKey || (chr < ' ' || !dateChars || datetimeChars.indexOf(chr) > -1);
			}
		}

		return $.datepicker._base_doKeyPress(event);
	};

	/*
	* Override key up event to sync manual input changes.
	*/
	$.datepicker._base_doKeyUp = $.datepicker._doKeyUp;
	$.datepicker._doKeyUp = function(event) {
		var inst = $.datepicker._getInst(event.target),
			tp_inst = $.datepicker._get(inst, 'timepicker');

		if (tp_inst) {
			if (tp_inst._defaults.timeOnly && (inst.input.val() != inst.lastVal)) {
				try {
					$.datepicker._updateDatepicker(inst);
				} catch (err) {
					$.datepicker.log(err);
				}
			}
		}

		return $.datepicker._base_doKeyUp(event);
	};

	/*
	* override "Today" button to also grab the time.
	*/
	$.datepicker._base_gotoToday = $.datepicker._gotoToday;
	$.datepicker._gotoToday = function(id) {
		var inst = this._getInst($(id)[0]),
			$dp = inst.dpDiv;
		this._base_gotoToday(id);
		var tp_inst = this._get(inst, 'timepicker');
		selectLocalTimeZone(tp_inst);
		var now = new Date();
		this._setTime(inst, now);
		$('.ui-datepicker-today', $dp).click();
	};

	/*
	* Disable & enable the Time in the datetimepicker
	*/
	$.datepicker._disableTimepickerDatepicker = function(target) {
		var inst = this._getInst(target);
		if (!inst) {
			return;
		}

		var tp_inst = this._get(inst, 'timepicker');
		$(target).datepicker('getDate'); // Init selected[Year|Month|Day]
		if (tp_inst) {
			tp_inst._defaults.showTimepicker = false;
			tp_inst._updateDateTime(inst);
		}
	};

	$.datepicker._enableTimepickerDatepicker = function(target) {
		var inst = this._getInst(target);
		if (!inst) {
			return;
		}

		var tp_inst = this._get(inst, 'timepicker');
		$(target).datepicker('getDate'); // Init selected[Year|Month|Day]
		if (tp_inst) {
			tp_inst._defaults.showTimepicker = true;
			tp_inst._addTimePicker(inst); // Could be disabled on page load
			tp_inst._updateDateTime(inst);
		}
	};

	/*
	* Create our own set time function
	*/
	$.datepicker._setTime = function(inst, date) {
		var tp_inst = this._get(inst, 'timepicker');
		if (tp_inst) {
			var defaults = tp_inst._defaults,
				// calling _setTime with no date sets time to defaults
				hour = date ? date.getHours() : defaults.hour,
				minute = date ? date.getMinutes() : defaults.minute,
				second = date ? date.getSeconds() : defaults.second,
				millisec = date ? date.getMilliseconds() : defaults.millisec;
			//check if within min/max times..
			// correct check if within min/max times. 	
			// Rewritten by Scott A. Woodward
			var hourEq = hour === defaults.hourMin,
				minuteEq = minute === defaults.minuteMin,
				secondEq = second === defaults.secondMin;
			var reset = false;
			if (hour < defaults.hourMin || hour > defaults.hourMax) reset = true;
			else if ((minute < defaults.minuteMin || minute > defaults.minuteMax) && hourEq) reset = true;
			else if ((second < defaults.secondMin || second > defaults.secondMax) && hourEq && minuteEq) reset = true;
			else if ((millisec < defaults.millisecMin || millisec > defaults.millisecMax) && hourEq && minuteEq && secondEq) reset = true;
			if (reset) {
				hour = defaults.hourMin;
				minute = defaults.minuteMin;
				second = defaults.secondMin;
				millisec = defaults.millisecMin;
			}
			tp_inst.hour = hour;
			tp_inst.minute = minute;
			tp_inst.second = second;
			tp_inst.millisec = millisec;
			if (tp_inst.hour_slider) tp_inst.hour_slider.slider('value', hour);
			if (tp_inst.minute_slider) tp_inst.minute_slider.slider('value', minute);
			if (tp_inst.second_slider) tp_inst.second_slider.slider('value', second);
			if (tp_inst.millisec_slider) tp_inst.millisec_slider.slider('value', millisec);

			tp_inst._onTimeChange();
			tp_inst._updateDateTime(inst);
		}
	};

	/*
	* Create new public method to set only time, callable as $().datepicker('setTime', date)
	*/
	$.datepicker._setTimeDatepicker = function(target, date, withDate) {
		var inst = this._getInst(target);
		if (!inst) {
			return;
		}

		var tp_inst = this._get(inst, 'timepicker');

		if (tp_inst) {
			this._setDateFromField(inst);
			var tp_date;
			if (date) {
				if (typeof date == "string") {
					tp_inst._parseTime(date, withDate);
					tp_date = new Date();
					tp_date.setHours(tp_inst.hour, tp_inst.minute, tp_inst.second, tp_inst.millisec);
				} else {
					tp_date = new Date(date.getTime());
				}
				if (tp_date.toString() == 'Invalid Date') {
					tp_date = undefined;
				}
				this._setTime(inst, tp_date);
			}
		}

	};

	/*
	* override setDate() to allow setting time too within Date object
	*/
	$.datepicker._base_setDateDatepicker = $.datepicker._setDateDatepicker;
	$.datepicker._setDateDatepicker = function(target, date) {
		var inst = this._getInst(target);
		if (!inst) {
			return;
		}

		var tp_date = (date instanceof Date) ? new Date(date.getTime()) : date;

		this._updateDatepicker(inst);
		this._base_setDateDatepicker.apply(this, arguments);
		this._setTimeDatepicker(target, tp_date, true);
	};

	/*
	* override getDate() to allow getting time too within Date object
	*/
	$.datepicker._base_getDateDatepicker = $.datepicker._getDateDatepicker;
	$.datepicker._getDateDatepicker = function(target, noDefault) {
		var inst = this._getInst(target);
		if (!inst) {
			return;
		}

		var tp_inst = this._get(inst, 'timepicker');

		if (tp_inst) {
			//this._setDateFromField(inst, noDefault); // This keeps setting to today when it shouldn't
			var date = this._getDate(inst);
			if (date && tp_inst._parseTime($(target).val(), tp_inst.timeOnly)) {
				date.setHours(tp_inst.hour, tp_inst.minute, tp_inst.second, tp_inst.millisec);
			}
			return date;
		}
		return this._base_getDateDatepicker(target, noDefault);
	};

	/*
	* override parseDate() because UI 1.8.14 throws an error about "Extra characters"
	* An option in datapicker to ignore extra format characters would be nicer.
	*/
	$.datepicker._base_parseDate = $.datepicker.parseDate;
	$.datepicker.parseDate = function(format, value, settings) {
		var splitRes = splitDateTime(format, value, settings);
		return $.datepicker._base_parseDate(format, splitRes[0], settings);
	};

	/*
	* override formatDate to set date with time to the input
	*/
	$.datepicker._base_formatDate = $.datepicker._formatDate;
	$.datepicker._formatDate = function(inst, day, month, year) {
		var tp_inst = this._get(inst, 'timepicker');
		if (tp_inst) {
			tp_inst._updateDateTime(inst);
			return tp_inst.$input.val();
		}
		return this._base_formatDate(inst);
	};

	/*
	* override options setter to add time to maxDate(Time) and minDate(Time). MaxDate
	*/
	$.datepicker._base_optionDatepicker = $.datepicker._optionDatepicker;
	$.datepicker._optionDatepicker = function(target, name, value) {
		var inst = this._getInst(target);
		if (!inst) {
			return null;
		}

		var tp_inst = this._get(inst, 'timepicker');
		if (tp_inst) {
			var min = null,
				max = null,
				onselect = null;
			if (typeof name == 'string') { // if min/max was set with the string
				if (name === 'minDate' || name === 'minDateTime') {
					min = value;
				} else {
					if (name === 'maxDate' || name === 'maxDateTime') {
						max = value;
					} else {
						if (name === 'onSelect') {
							onselect = value;
						}
					}
				}
			} else {
				if (typeof name == 'object') { //if min/max was set with the JSON
					if (name.minDate) {
						min = name.minDate;
					} else {
						if (name.minDateTime) {
							min = name.minDateTime;
						} else {
							if (name.maxDate) {
								max = name.maxDate;
							} else {
								if (name.maxDateTime) {
									max = name.maxDateTime;
								}
							}
						}
					}
				}
			}
			if (min) { //if min was set
				if (min === 0) {
					min = new Date();
				} else {
					min = new Date(min);
				}

				tp_inst._defaults.minDate = min;
				tp_inst._defaults.minDateTime = min;
			} else if (max) { //if max was set
				if (max === 0) {
					max = new Date();
				} else {
					max = new Date(max);
				}
				tp_inst._defaults.maxDate = max;
				tp_inst._defaults.maxDateTime = max;
			} else if (onselect) {
				tp_inst._defaults.onSelect = onselect;
			}
		}
		if (value === undefined) {
			return this._base_optionDatepicker(target, name);
		}
		return this._base_optionDatepicker(target, name, value);
	};

	/*
	* jQuery extend now ignores nulls!
	*/
	function extendRemove(target, props) {
		$.extend(target, props);
		for (var name in props) {
			if (props[name] === null || props[name] === undefined) {
				target[name] = props[name];
			}
		}
		return target;
	}

	/*
	* Splits datetime string into date ans time substrings.
	* Throws exception when date can't be parsed
	* Returns [dateString, timeString]
	*/
	var splitDateTime = function(dateFormat, dateTimeString, dateSettings, timeSettings) {
		try {
			// The idea is to get the number separator occurances in datetime and the time format requested (since time has 
			// fewer unknowns, mostly numbers and am/pm). We will use the time pattern to split.
			var separator = timeSettings && timeSettings.separator ? timeSettings.separator : $.timepicker._defaults.separator,
				format = timeSettings && timeSettings.timeFormat ? timeSettings.timeFormat : $.timepicker._defaults.timeFormat,
				ampm = timeSettings && timeSettings.ampm ? timeSettings.ampm : $.timepicker._defaults.ampm,
				timeParts = format.split(separator), // how many occurances of separator may be in our format?
				timePartsLen = timeParts.length,
				allParts = dateTimeString.split(separator),
				allPartsLen = allParts.length;

			// because our default ampm=false, but our default format has tt, we need to filter this out
			if(!ampm){
				timeParts = $.trim(format.replace(/t/gi,'')).split(separator);
				timePartsLen = timeParts.length;
			}
			if(allPartsLen == 1){return allParts;}
			if(allPartsLen > 1) {
				return [
						allParts.splice(0,allPartsLen-timePartsLen).join(separator),
						allParts.splice(timePartsLen*-1).join(separator)
					];
			}

		} catch (err) {
			if (err.indexOf(":") >= 0) {
				// Hack!  The error message ends with a colon, a space, and
				// the "extra" characters.  We rely on that instead of
				// attempting to perfectly reproduce the parsing algorithm.
				var dateStringLength = dateTimeString.length - (err.length - err.indexOf(':') - 2),
					timeString = dateTimeString.substring(dateStringLength);

				return [$.trim(dateTimeString.substring(0, dateStringLength)), $.trim(dateTimeString.substring(dateStringLength))];

			} else {
				throw err;
			}
		}
		return [dateTimeString, ''];
	};

	/*
	* Internal function to parse datetime interval
	* Returns: {date: Date, timeObj: Object}, where
	*   date - parsed date without time (type Date)
	*   timeObj = {hour: , minute: , second: , millisec: } - parsed time. Optional
	*/
	var parseDateTimeInternal = function(dateFormat, timeFormat, dateTimeString, dateSettings, timeSettings) {
		var date;
		var splitRes = splitDateTime(dateFormat, dateTimeString, dateSettings, timeSettings);
		date = $.datepicker._base_parseDate(dateFormat, splitRes[0], dateSettings);
		if (splitRes[1] !== '') {
			var timeString = splitRes[1],
				parsedTime = $.datepicker.parseTime(timeFormat, timeString, timeSettings);

			if (parsedTime === null) {
				throw 'Wrong time format';
			}
			return {
				date: date,
				timeObj: parsedTime
			};
		} else {
			return {
				date: date
			};
		}
	};

	/*
	* Internal function to set timezone_select to the local timezone
	*/
	var selectLocalTimeZone = function(tp_inst, date) {
		if (tp_inst && tp_inst.timezone_select) {
			tp_inst._defaults.useLocalTimezone = true;
			var now = typeof date !== 'undefined' ? date : new Date();
			var tzoffset = $.timepicker.timeZoneOffsetString(now);
			if (tp_inst._defaults.timezoneIso8601) {
				tzoffset = tzoffset.substring(0, 3) + ':' + tzoffset.substring(3);
			}
			tp_inst.timezone_select.val(tzoffset);
		}
	};

	/*
	* Create a Singleton Insance
	*/
	$.timepicker = new Timepicker();

	/**
	 * Get the timezone offset as string from a date object (eg '+0530' for UTC+5.5)
	 * @param  date
	 * @return string
	 */
	$.timepicker.timeZoneOffsetString = function(date) {
		var off = date.getTimezoneOffset() * -1,
			minutes = off % 60,
			hours = (off - minutes) / 60;
		return (off >= 0 ? '+' : '-') + ('0' + (hours * 101).toString()).substr(-2) + ('0' + (minutes * 101).toString()).substr(-2);
	};

	/**
	 * Calls `timepicker()` on the `startTime` and `endTime` elements, and configures them to
	 * enforce date range limits.
	 * n.b. The input value must be correctly formatted (reformatting is not supported)
	 * @param  Element startTime
	 * @param  Element endTime
	 * @param  obj options Options for the timepicker() call
	 * @return jQuery
	 */
	$.timepicker.timeRange = function(startTime, endTime, options) {
		return $.timepicker.handleRange('timepicker', startTime, endTime, options);
	};

	/**
	 * Calls `datetimepicker` on the `startTime` and `endTime` elements, and configures them to
	 * enforce date range limits.
	 * @param  Element startTime
	 * @param  Element endTime
	 * @param  obj options Options for the `timepicker()` call. Also supports `reformat`,
	 *   a boolean value that can be used to reformat the input values to the `dateFormat`.
	 * @param  string method Can be used to specify the type of picker to be added
	 * @return jQuery
	 */
	$.timepicker.dateTimeRange = function(startTime, endTime, options) {
		$.timepicker.dateRange(startTime, endTime, options, 'datetimepicker');
	};

	/**
	 * Calls `method` on the `startTime` and `endTime` elements, and configures them to
	 * enforce date range limits.
	 * @param  Element startTime
	 * @param  Element endTime
	 * @param  obj options Options for the `timepicker()` call. Also supports `reformat`,
	 *   a boolean value that can be used to reformat the input values to the `dateFormat`.
	 * @param  string method Can be used to specify the type of picker to be added
	 * @return jQuery
	 */
	$.timepicker.dateRange = function(startTime, endTime, options, method) {
		method = method || 'datepicker';
		$.timepicker.handleRange(method, startTime, endTime, options);
	};

	/**
	 * Calls `method` on the `startTime` and `endTime` elements, and configures them to
	 * enforce date range limits.
	 * @param  string method Can be used to specify the type of picker to be added
	 * @param  Element startTime
	 * @param  Element endTime
	 * @param  obj options Options for the `timepicker()` call. Also supports `reformat`,
	 *   a boolean value that can be used to reformat the input values to the `dateFormat`.
	 * @return jQuery
	 */
	$.timepicker.handleRange = function(method, startTime, endTime, options) {
		$.fn[method].call(startTime, $.extend({
			onClose: function(dateText, inst) {
				checkDates(this, endTime, dateText);
			},
			onSelect: function(selectedDateTime) {
				selected(this, endTime, 'minDate');
			}
		}, options, options.start));
		$.fn[method].call(endTime, $.extend({
			onClose: function(dateText, inst) {
				checkDates(this, startTime, dateText);
			},
			onSelect: function(selectedDateTime) {
				selected(this, startTime, 'maxDate');
			}
		}, options, options.end));
		// timepicker doesn't provide access to its 'timeFormat' option, 
		// nor could I get datepicker.formatTime() to behave with times, so I
		// have disabled reformatting for timepicker
		if (method != 'timepicker' && options.reformat) {
			$([startTime, endTime]).each(function() {
				var format = $(this)[method].call($(this), 'option', 'dateFormat'),
					date = new Date($(this).val());
				if ($(this).val() && date) {
					$(this).val($.datepicker.formatDate(format, date));
				}
			});
		}
		checkDates(startTime, endTime, startTime.val());

		function checkDates(changed, other, dateText) {
			if (other.val() && (new Date(startTime.val()) > new Date(endTime.val()))) {
				other.val(dateText);
			}
		}
		selected(startTime, endTime, 'minDate');
		selected(endTime, startTime, 'maxDate');

		function selected(changed, other, option) {
			if (!$(changed).val()) {
				return;
			}
			var date = $(changed)[method].call($(changed), 'getDate');
			// timepicker doesn't implement 'getDate' and returns a jQuery
			if (date.getTime) {
				$(other)[method].call($(other), 'option', option, date);
			}
		}
		return $([startTime.get(0), endTime.get(0)]);
	};

	/*
	* Keep up with the version
	*/
	$.timepicker.version = "1.0.3";

})(jQuery);/*!
 * jQuery Form Plugin
 * version: 3.32.0-2013.04.09
 * @requires jQuery v1.5 or later
 * Copyright (c) 2013 M. Alsup
 * Examples and documentation at: http://malsup.com/jquery/form/
 * Project repository: https://github.com/malsup/form
 * Dual licensed under the MIT and GPL licenses.
 * https://github.com/malsup/form#copyright-and-license
 */
/*global ActiveXObject */
;(function($) {
"use strict";

/*
    Usage Note:
    -----------
    Do not use both ajaxSubmit and ajaxForm on the same form.  These
    functions are mutually exclusive.  Use ajaxSubmit if you want
    to bind your own submit handler to the form.  For example,

    $(document).ready(function() {
        $('#myForm').on('submit', function(e) {
            e.preventDefault(); // <-- important
            $(this).ajaxSubmit({
                target: '#output'
            });
        });
    });

    Use ajaxForm when you want the plugin to manage all the event binding
    for you.  For example,

    $(document).ready(function() {
        $('#myForm').ajaxForm({
            target: '#output'
        });
    });

    You can also use ajaxForm with delegation (requires jQuery v1.7+), so the
    form does not have to exist when you invoke ajaxForm:

    $('#myForm').ajaxForm({
        delegation: true,
        target: '#output'
    });

    When using ajaxForm, the ajaxSubmit function will be invoked for you
    at the appropriate time.
*/

/**
 * Feature detection
 */
var feature = {};
feature.fileapi = $("<input type='file'/>").get(0).files !== undefined;
feature.formdata = window.FormData !== undefined;

var hasProp = !!$.fn.prop;

// attr2 uses prop when it can but checks the return type for
// an expected string.  this accounts for the case where a form 
// contains inputs with names like "action" or "method"; in those
// cases "prop" returns the element
$.fn.attr2 = function() {
    if ( ! hasProp )
        return this.attr.apply(this, arguments);
    var val = this.prop.apply(this, arguments);
    if ( ( val && val.jquery ) || typeof val === 'string' )
        return val;
    return this.attr.apply(this, arguments);
};

/**
 * ajaxSubmit() provides a mechanism for immediately submitting
 * an HTML form using AJAX.
 */
$.fn.ajaxSubmit = function(options) {
    /*jshint scripturl:true */

    // fast fail if nothing selected (http://dev.jquery.com/ticket/2752)
    if (!this.length) {
        log('ajaxSubmit: skipping submit process - no element selected');
        return this;
    }

    var method, action, url, $form = this;

    if (typeof options == 'function') {
        options = { success: options };
    }

    method = this.attr2('method');
    action = this.attr2('action');

    url = (typeof action === 'string') ? $.trim(action) : '';
    url = url || window.location.href || '';
    if (url) {
        // clean url (don't include hash vaue)
        url = (url.match(/^([^#]+)/)||[])[1];
    }

    options = $.extend(true, {
        url:  url,
        success: $.ajaxSettings.success,
        type: method || 'GET',
        iframeSrc: /^https/i.test(window.location.href || '') ? 'javascript:false' : 'about:blank'
    }, options);

    // hook for manipulating the form data before it is extracted;
    // convenient for use with rich editors like tinyMCE or FCKEditor
    var veto = {};
    this.trigger('form-pre-serialize', [this, options, veto]);
    if (veto.veto) {
        log('ajaxSubmit: submit vetoed via form-pre-serialize trigger');
        return this;
    }

    // provide opportunity to alter form data before it is serialized
    if (options.beforeSerialize && options.beforeSerialize(this, options) === false) {
        log('ajaxSubmit: submit aborted via beforeSerialize callback');
        return this;
    }

    var traditional = options.traditional;
    if ( traditional === undefined ) {
        traditional = $.ajaxSettings.traditional;
    }

    var elements = [];
    var qx, a = this.formToArray(options.semantic, elements);
    if (options.data) {
        options.extraData = options.data;
        qx = $.param(options.data, traditional);
    }

    // give pre-submit callback an opportunity to abort the submit
    if (options.beforeSubmit && options.beforeSubmit(a, this, options) === false) {
        log('ajaxSubmit: submit aborted via beforeSubmit callback');
        return this;
    }

    // fire vetoable 'validate' event
    this.trigger('form-submit-validate', [a, this, options, veto]);
    if (veto.veto) {
        log('ajaxSubmit: submit vetoed via form-submit-validate trigger');
        return this;
    }

    var q = $.param(a, traditional);
    if (qx) {
        q = ( q ? (q + '&' + qx) : qx );
    }
    if (options.type.toUpperCase() == 'GET') {
        options.url += (options.url.indexOf('?') >= 0 ? '&' : '?') + q;
        options.data = null;  // data is null for 'get'
    }
    else {
        options.data = q; // data is the query string for 'post'
    }

    var callbacks = [];
    if (options.resetForm) {
        callbacks.push(function() { $form.resetForm(); });
    }
    if (options.clearForm) {
        callbacks.push(function() { $form.clearForm(options.includeHidden); });
    }

    // perform a load on the target only if dataType is not provided
    if (!options.dataType && options.target) {
        var oldSuccess = options.success || function(){};
        callbacks.push(function(data) {
            var fn = options.replaceTarget ? 'replaceWith' : 'html';
            $(options.target)[fn](data).each(oldSuccess, arguments);
        });
    }
    else if (options.success) {
        callbacks.push(options.success);
    }

    options.success = function(data, status, xhr) { // jQuery 1.4+ passes xhr as 3rd arg
        var context = options.context || this ;    // jQuery 1.4+ supports scope context
        for (var i=0, max=callbacks.length; i < max; i++) {
            callbacks[i].apply(context, [data, status, xhr || $form, $form]);
        }
    };

    // are there files to upload?

    // [value] (issue #113), also see comment:
    // https://github.com/malsup/form/commit/588306aedba1de01388032d5f42a60159eea9228#commitcomment-2180219
    var fileInputs = $('input[type=file]:enabled[value!=""]', this);

    var hasFileInputs = fileInputs.length > 0;
    var mp = 'multipart/form-data';
    var multipart = ($form.attr('enctype') == mp || $form.attr('encoding') == mp);

    var fileAPI = feature.fileapi && feature.formdata;
    log("fileAPI :" + fileAPI);
    var shouldUseFrame = (hasFileInputs || multipart) && !fileAPI;

    var jqxhr;

    // options.iframe allows user to force iframe mode
    // 06-NOV-09: now defaulting to iframe mode if file input is detected
    if (options.iframe !== false && (options.iframe || shouldUseFrame)) {
        // hack to fix Safari hang (thanks to Tim Molendijk for this)
        // see:  http://groups.google.com/group/jquery-dev/browse_thread/thread/36395b7ab510dd5d
        if (options.closeKeepAlive) {
            $.get(options.closeKeepAlive, function() {
                jqxhr = fileUploadIframe(a);
            });
        }
        else {
            jqxhr = fileUploadIframe(a);
        }
    }
    else if ((hasFileInputs || multipart) && fileAPI) {
        jqxhr = fileUploadXhr(a);
    }
    else {
        jqxhr = $.ajax(options);
    }

    $form.removeData('jqxhr').data('jqxhr', jqxhr);

    // clear element array
    for (var k=0; k < elements.length; k++)
        elements[k] = null;

    // fire 'notify' event
    this.trigger('form-submit-notify', [this, options]);
    return this;

    // utility fn for deep serialization
    function deepSerialize(extraData){
        var serialized = $.param(extraData).split('&');
        var len = serialized.length;
        var result = [];
        var i, part;
        for (i=0; i < len; i++) {
            // #252; undo param space replacement
            serialized[i] = serialized[i].replace(/\+/g,' ');
            part = serialized[i].split('=');
            // #278; use array instead of object storage, favoring array serializations
            result.push([decodeURIComponent(part[0]), decodeURIComponent(part[1])]);
        }
        return result;
    }

     // XMLHttpRequest Level 2 file uploads (big hat tip to francois2metz)
    function fileUploadXhr(a) {
        var formdata = new FormData();

        for (var i=0; i < a.length; i++) {
            formdata.append(a[i].name, a[i].value);
        }

        if (options.extraData) {
            var serializedData = deepSerialize(options.extraData);
            for (i=0; i < serializedData.length; i++)
                if (serializedData[i])
                    formdata.append(serializedData[i][0], serializedData[i][1]);
        }

        options.data = null;

        var s = $.extend(true, {}, $.ajaxSettings, options, {
            contentType: false,
            processData: false,
            cache: false,
            type: method || 'POST'
        });

        if (options.uploadProgress) {
            // workaround because jqXHR does not expose upload property
            s.xhr = function() {
                var xhr = jQuery.ajaxSettings.xhr();
                if (xhr.upload) {
                    xhr.upload.addEventListener('progress', function(event) {
                        var percent = 0;
                        var position = event.loaded || event.position; /*event.position is deprecated*/
                        var total = event.total;
                        if (event.lengthComputable) {
                            percent = Math.ceil(position / total * 100);
                        }
                        options.uploadProgress(event, position, total, percent);
                    }, false);
                }
                return xhr;
            };
        }

        s.data = null;
            var beforeSend = s.beforeSend;
            s.beforeSend = function(xhr, o) {
                o.data = formdata;
                if(beforeSend)
                    beforeSend.call(this, xhr, o);
        };
        return $.ajax(s);
    }

    // private function for handling file uploads (hat tip to YAHOO!)
    function fileUploadIframe(a) {
        var form = $form[0], el, i, s, g, id, $io, io, xhr, sub, n, timedOut, timeoutHandle;
        var deferred = $.Deferred();

        if (a) {
            // ensure that every serialized input is still enabled
            for (i=0; i < elements.length; i++) {
                el = $(elements[i]);
                if ( hasProp )
                    el.prop('disabled', false);
                else
                    el.removeAttr('disabled');
            }
        }

        s = $.extend(true, {}, $.ajaxSettings, options);
        s.context = s.context || s;
        id = 'jqFormIO' + (new Date().getTime());
        if (s.iframeTarget) {
            $io = $(s.iframeTarget);
            n = $io.attr2('name');
            if (!n)
                 $io.attr2('name', id);
            else
                id = n;
        }
        else {
            $io = $('<iframe name="' + id + '" src="'+ s.iframeSrc +'" />');
            $io.css({ position: 'absolute', top: '-1000px', left: '-1000px' });
        }
        io = $io[0];


        xhr = { // mock object
            aborted: 0,
            responseText: null,
            responseXML: null,
            status: 0,
            statusText: 'n/a',
            getAllResponseHeaders: function() {},
            getResponseHeader: function() {},
            setRequestHeader: function() {},
            abort: function(status) {
                var e = (status === 'timeout' ? 'timeout' : 'aborted');
                log('aborting upload... ' + e);
                this.aborted = 1;

                try { // #214, #257
                    if (io.contentWindow.document.execCommand) {
                        io.contentWindow.document.execCommand('Stop');
                    }
                }
                catch(ignore) {}

                $io.attr('src', s.iframeSrc); // abort op in progress
                xhr.error = e;
                if (s.error)
                    s.error.call(s.context, xhr, e, status);
                if (g)
                    $.event.trigger("ajaxError", [xhr, s, e]);
                if (s.complete)
                    s.complete.call(s.context, xhr, e);
            }
        };

        g = s.global;
        // trigger ajax global events so that activity/block indicators work like normal
        if (g && 0 === $.active++) {
            $.event.trigger("ajaxStart");
        }
        if (g) {
            $.event.trigger("ajaxSend", [xhr, s]);
        }

        if (s.beforeSend && s.beforeSend.call(s.context, xhr, s) === false) {
            if (s.global) {
                $.active--;
            }
            deferred.reject();
            return deferred;
        }
        if (xhr.aborted) {
            deferred.reject();
            return deferred;
        }

        // add submitting element to data if we know it
        sub = form.clk;
        if (sub) {
            n = sub.name;
            if (n && !sub.disabled) {
                s.extraData = s.extraData || {};
                s.extraData[n] = sub.value;
                if (sub.type == "image") {
                    s.extraData[n+'.x'] = form.clk_x;
                    s.extraData[n+'.y'] = form.clk_y;
                }
            }
        }

        var CLIENT_TIMEOUT_ABORT = 1;
        var SERVER_ABORT = 2;
                
        function getDoc(frame) {
            /* it looks like contentWindow or contentDocument do not
             * carry the protocol property in ie8, when running under ssl
             * frame.document is the only valid response document, since
             * the protocol is know but not on the other two objects. strange?
             * "Same origin policy" http://en.wikipedia.org/wiki/Same_origin_policy
             */
            
            var doc = null;
            
            // IE8 cascading access check
            try {
                if (frame.contentWindow) {
                    doc = frame.contentWindow.document;
                }
            } catch(err) {
                // IE8 access denied under ssl & missing protocol
                log('cannot get iframe.contentWindow document: ' + err);
            }

            if (doc) { // successful getting content
                return doc;
            }

            try { // simply checking may throw in ie8 under ssl or mismatched protocol
                doc = frame.contentDocument ? frame.contentDocument : frame.document;
            } catch(err) {
                // last attempt
                log('cannot get iframe.contentDocument: ' + err);
                doc = frame.document;
            }
            return doc;
        }

        // Rails CSRF hack (thanks to Yvan Barthelemy)
        var csrf_token = $('meta[name=csrf-token]').attr('content');
        var csrf_param = $('meta[name=csrf-param]').attr('content');
        if (csrf_param && csrf_token) {
            s.extraData = s.extraData || {};
            s.extraData[csrf_param] = csrf_token;
        }

        // take a breath so that pending repaints get some cpu time before the upload starts
        function doSubmit() {
            // make sure form attrs are set
            var t = $form.attr2('target'), a = $form.attr2('action');

            // update form attrs in IE friendly way
            form.setAttribute('target',id);
            if (!method) {
                form.setAttribute('method', 'POST');
            }
            if (a != s.url) {
                form.setAttribute('action', s.url);
            }

            // ie borks in some cases when setting encoding
            if (! s.skipEncodingOverride && (!method || /post/i.test(method))) {
                $form.attr({
                    encoding: 'multipart/form-data',
                    enctype:  'multipart/form-data'
                });
            }

            // support timout
            if (s.timeout) {
                timeoutHandle = setTimeout(function() { timedOut = true; cb(CLIENT_TIMEOUT_ABORT); }, s.timeout);
            }

            // look for server aborts
            function checkState() {
                try {
                    var state = getDoc(io).readyState;
                    log('state = ' + state);
                    if (state && state.toLowerCase() == 'uninitialized')
                        setTimeout(checkState,50);
                }
                catch(e) {
                    log('Server abort: ' , e, ' (', e.name, ')');
                    cb(SERVER_ABORT);
                    if (timeoutHandle)
                        clearTimeout(timeoutHandle);
                    timeoutHandle = undefined;
                }
            }

            // add "extra" data to form if provided in options
            var extraInputs = [];
            try {
                if (s.extraData) {
                    for (var n in s.extraData) {
                        if (s.extraData.hasOwnProperty(n)) {
                           // if using the $.param format that allows for multiple values with the same name
                           if($.isPlainObject(s.extraData[n]) && s.extraData[n].hasOwnProperty('name') && s.extraData[n].hasOwnProperty('value')) {
                               extraInputs.push(
                               $('<input type="hidden" name="'+s.extraData[n].name+'">').val(s.extraData[n].value)
                                   .appendTo(form)[0]);
                           } else {
                               extraInputs.push(
                               $('<input type="hidden" name="'+n+'">').val(s.extraData[n])
                                   .appendTo(form)[0]);
                           }
                        }
                    }
                }

                if (!s.iframeTarget) {
                    // add iframe to doc and submit the form
                    $io.appendTo('body');
                    if (io.attachEvent)
                        io.attachEvent('onload', cb);
                    else
                        io.addEventListener('load', cb, false);
                }
                setTimeout(checkState,15);

                try {
					console.log(form.target);
                    form.submit();
                } catch(err) {
                    // just in case form has element with name/id of 'submit'
                    var submitFn = document.createElement('form').submit;
                    submitFn.apply(form);
                }
            }
            finally {
                // reset attrs and remove "extra" input elements
                form.setAttribute('action',a);
                if(t) {
                    form.setAttribute('target', t);
                } else {
                    $form.removeAttr('target');
                }
                $(extraInputs).remove();
            }
        }

        if (s.forceSync) {
            doSubmit();
        }
        else {
            setTimeout(doSubmit, 10); // this lets dom updates render
        }

        var data, doc, domCheckCount = 50, callbackProcessed;

        function cb(e) {
            if (xhr.aborted || callbackProcessed) {
                return;
            }
            
            doc = getDoc(io);
            if(!doc) {
                log('cannot access response document');
                e = SERVER_ABORT;
            }
            if (e === CLIENT_TIMEOUT_ABORT && xhr) {
                xhr.abort('timeout');
                deferred.reject(xhr, 'timeout');
                return;
            }
            else if (e == SERVER_ABORT && xhr) {
                xhr.abort('server abort');
                deferred.reject(xhr, 'error', 'server abort');
                return;
            }

            if (!doc || doc.location.href == s.iframeSrc) {
                // response not received yet
                if (!timedOut)
                    return;
            }
            if (io.detachEvent)
                io.detachEvent('onload', cb);
            else
                io.removeEventListener('load', cb, false);

            var status = 'success', errMsg;
            try {
                if (timedOut) {
                    throw 'timeout';
                }

                var isXml = s.dataType == 'xml' || doc.XMLDocument || $.isXMLDoc(doc);
                log('isXml='+isXml);
                if (!isXml && window.opera && (doc.body === null || !doc.body.innerHTML)) {
                    if (--domCheckCount) {
                        // in some browsers (Opera) the iframe DOM is not always traversable when
                        // the onload callback fires, so we loop a bit to accommodate
                        log('requeing onLoad callback, DOM not available');
                        setTimeout(cb, 250);
                        return;
                    }
                    // let this fall through because server response could be an empty document
                    //log('Could not access iframe DOM after mutiple tries.');
                    //throw 'DOMException: not available';
                }

                //log('response detected');
                var docRoot = doc.body ? doc.body : doc.documentElement;
                xhr.responseText = docRoot ? docRoot.innerHTML : null;
                xhr.responseXML = doc.XMLDocument ? doc.XMLDocument : doc;
                if (isXml)
                    s.dataType = 'xml';
                xhr.getResponseHeader = function(header){
                    var headers = {'content-type': s.dataType};
                    return headers[header];
                };
                // support for XHR 'status' & 'statusText' emulation :
                if (docRoot) {
                    xhr.status = Number( docRoot.getAttribute('status') ) || xhr.status;
                    xhr.statusText = docRoot.getAttribute('statusText') || xhr.statusText;
                }

                var dt = (s.dataType || '').toLowerCase();
                var scr = /(json|script|text)/.test(dt);
                if (scr || s.textarea) {
                    // see if user embedded response in textarea
                    var ta = doc.getElementsByTagName('textarea')[0];
                    if (ta) {
                        xhr.responseText = ta.value;
                        // support for XHR 'status' & 'statusText' emulation :
                        xhr.status = Number( ta.getAttribute('status') ) || xhr.status;
                        xhr.statusText = ta.getAttribute('statusText') || xhr.statusText;
                    }
                    else if (scr) {
                        // account for browsers injecting pre around json response
                        var pre = doc.getElementsByTagName('pre')[0];
                        var b = doc.getElementsByTagName('body')[0];
                        if (pre) {
                            xhr.responseText = pre.textContent ? pre.textContent : pre.innerText;
                        }
                        else if (b) {
                            xhr.responseText = b.textContent ? b.textContent : b.innerText;
                        }
                    }
                }
                else if (dt == 'xml' && !xhr.responseXML && xhr.responseText) {
                    xhr.responseXML = toXml(xhr.responseText);
                }

                try {
                    data = httpData(xhr, dt, s);
                }
                catch (err) {
                    status = 'parsererror';
                    xhr.error = errMsg = (err || status);
                }
            }
            catch (err) {
                log('error caught: ',err);
                status = 'error';
                xhr.error = errMsg = (err || status);
            }

            if (xhr.aborted) {
                log('upload aborted');
                status = null;
            }

            if (xhr.status) { // we've set xhr.status
                status = (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) ? 'success' : 'error';
            }

            // ordering of these callbacks/triggers is odd, but that's how $.ajax does it
            if (status === 'success') {
                if (s.success)
                    s.success.call(s.context, data, 'success', xhr);
                deferred.resolve(xhr.responseText, 'success', xhr);
                if (g)
                    $.event.trigger("ajaxSuccess", [xhr, s]);
            }
            else if (status) {
                if (errMsg === undefined)
                    errMsg = xhr.statusText;
                if (s.error)
                    s.error.call(s.context, xhr, status, errMsg);
                deferred.reject(xhr, 'error', errMsg);
                if (g)
                    $.event.trigger("ajaxError", [xhr, s, errMsg]);
            }

            if (g)
                $.event.trigger("ajaxComplete", [xhr, s]);

            if (g && ! --$.active) {
                $.event.trigger("ajaxStop");
            }

            if (s.complete)
                s.complete.call(s.context, xhr, status);

            callbackProcessed = true;
            if (s.timeout)
                clearTimeout(timeoutHandle);

            // clean up
            setTimeout(function() {
                if (!s.iframeTarget)
                    $io.remove();
                xhr.responseXML = null;
            }, 100);
        }

        var toXml = $.parseXML || function(s, doc) { // use parseXML if available (jQuery 1.5+)
            if (window.ActiveXObject) {
                doc = new ActiveXObject('Microsoft.XMLDOM');
                doc.async = 'false';
                doc.loadXML(s);
            }
            else {
                doc = (new DOMParser()).parseFromString(s, 'text/xml');
            }
            return (doc && doc.documentElement && doc.documentElement.nodeName != 'parsererror') ? doc : null;
        };
        var parseJSON = $.parseJSON || function(s) {
            /*jslint evil:true */
            return window['eval']('(' + s + ')');
        };

        var httpData = function( xhr, type, s ) { // mostly lifted from jq1.4.4

            var ct = xhr.getResponseHeader('content-type') || '',
                xml = type === 'xml' || !type && ct.indexOf('xml') >= 0,
                data = xml ? xhr.responseXML : xhr.responseText;

            if (xml && data.documentElement.nodeName === 'parsererror') {
                if ($.error)
                    $.error('parsererror');
            }
            if (s && s.dataFilter) {
                data = s.dataFilter(data, type);
            }
            if (typeof data === 'string') {
                if (type === 'json' || !type && ct.indexOf('json') >= 0) {
                    data = parseJSON(data);
                } else if (type === "script" || !type && ct.indexOf("javascript") >= 0) {
                    $.globalEval(data);
                }
            }
            return data;
        };

        return deferred;
    }
};

/**
 * ajaxForm() provides a mechanism for fully automating form submission.
 *
 * The advantages of using this method instead of ajaxSubmit() are:
 *
 * 1: This method will include coordinates for <input type="image" /> elements (if the element
 *    is used to submit the form).
 * 2. This method will include the submit element's name/value data (for the element that was
 *    used to submit the form).
 * 3. This method binds the submit() method to the form for you.
 *
 * The options argument for ajaxForm works exactly as it does for ajaxSubmit.  ajaxForm merely
 * passes the options argument along after properly binding events for submit elements and
 * the form itself.
 */
$.fn.ajaxForm = function(options) {
    options = options || {};
    options.delegation = options.delegation && $.isFunction($.fn.on);

    // in jQuery 1.3+ we can fix mistakes with the ready state
    if (!options.delegation && this.length === 0) {
        var o = { s: this.selector, c: this.context };
        if (!$.isReady && o.s) {
            log('DOM not ready, queuing ajaxForm');
            $(function() {
                $(o.s,o.c).ajaxForm(options);
            });
            return this;
        }
        // is your DOM ready?  http://docs.jquery.com/Tutorials:Introducing_$(document).ready()
        log('terminating; zero elements found by selector' + ($.isReady ? '' : ' (DOM not ready)'));
        return this;
    }

    if ( options.delegation ) {
        $(document)
            .off('submit.form-plugin', this.selector, doAjaxSubmit)
            .off('click.form-plugin', this.selector, captureSubmittingElement)
            .on('submit.form-plugin', this.selector, options, doAjaxSubmit)
            .on('click.form-plugin', this.selector, options, captureSubmittingElement);
        return this;
    }

    return this.ajaxFormUnbind()
        .bind('submit.form-plugin', options, doAjaxSubmit)
        .bind('click.form-plugin', options, captureSubmittingElement);
};

// private event handlers
function doAjaxSubmit(e) {
    /*jshint validthis:true */
    var options = e.data;
    if (!e.isDefaultPrevented()) { // if event has been canceled, don't proceed
        e.preventDefault();
        $(this).ajaxSubmit(options);
    }
}

function captureSubmittingElement(e) {
    /*jshint validthis:true */
    var target = e.target;
    var $el = $(target);
    if (!($el.is("[type=submit],[type=image]"))) {
        // is this a child element of the submit el?  (ex: a span within a button)
        var t = $el.closest('[type=submit]');
        if (t.length === 0) {
            return;
        }
        target = t[0];
    }
    var form = this;
    form.clk = target;
    if (target.type == 'image') {
        if (e.offsetX !== undefined) {
            form.clk_x = e.offsetX;
            form.clk_y = e.offsetY;
        } else if (typeof $.fn.offset == 'function') {
            var offset = $el.offset();
            form.clk_x = e.pageX - offset.left;
            form.clk_y = e.pageY - offset.top;
        } else {
            form.clk_x = e.pageX - target.offsetLeft;
            form.clk_y = e.pageY - target.offsetTop;
        }
    }
    // clear form vars
    setTimeout(function() { form.clk = form.clk_x = form.clk_y = null; }, 100);
}


// ajaxFormUnbind unbinds the event handlers that were bound by ajaxForm
$.fn.ajaxFormUnbind = function() {
    return this.unbind('submit.form-plugin click.form-plugin');
};

/**
 * formToArray() gathers form element data into an array of objects that can
 * be passed to any of the following ajax functions: $.get, $.post, or load.
 * Each object in the array has both a 'name' and 'value' property.  An example of
 * an array for a simple login form might be:
 *
 * [ { name: 'username', value: 'jresig' }, { name: 'password', value: 'secret' } ]
 *
 * It is this array that is passed to pre-submit callback functions provided to the
 * ajaxSubmit() and ajaxForm() methods.
 */
$.fn.formToArray = function(semantic, elements) {
    var a = [];
    if (this.length === 0) {
        return a;
    }

    var form = this[0];
    var els = semantic ? form.getElementsByTagName('*') : form.elements;
    if (!els) {
        return a;
    }

    var i,j,n,v,el,max,jmax;
    for(i=0, max=els.length; i < max; i++) {
        el = els[i];
        n = el.name;
        if (!n || el.disabled) {
            continue;
        }

        if (semantic && form.clk && el.type == "image") {
            // handle image inputs on the fly when semantic == true
            if(form.clk == el) {
                a.push({name: n, value: $(el).val(), type: el.type });
                a.push({name: n+'.x', value: form.clk_x}, {name: n+'.y', value: form.clk_y});
            }
            continue;
        }

        v = $.fieldValue(el, true);
        if (v && v.constructor == Array) {
            if (elements)
                elements.push(el);
            for(j=0, jmax=v.length; j < jmax; j++) {
                a.push({name: n, value: v[j]});
            }
        }
        else if (feature.fileapi && el.type == 'file') {
            if (elements)
                elements.push(el);
            var files = el.files;
            if (files.length) {
                for (j=0; j < files.length; j++) {
                    a.push({name: n, value: files[j], type: el.type});
                }
            }
            else {
                // #180
                a.push({ name: n, value: '', type: el.type });
            }
        }
        else if (v !== null && typeof v != 'undefined') {
            if (elements)
                elements.push(el);
            a.push({name: n, value: v, type: el.type, required: el.required});
        }
    }

    if (!semantic && form.clk) {
        // input type=='image' are not found in elements array! handle it here
        var $input = $(form.clk), input = $input[0];
        n = input.name;
        if (n && !input.disabled && input.type == 'image') {
            a.push({name: n, value: $input.val()});
            a.push({name: n+'.x', value: form.clk_x}, {name: n+'.y', value: form.clk_y});
        }
    }
    return a;
};

/**
 * Serializes form data into a 'submittable' string. This method will return a string
 * in the format: name1=value1&amp;name2=value2
 */
$.fn.formSerialize = function(semantic) {
    //hand off to jQuery.param for proper encoding
    return $.param(this.formToArray(semantic));
};

/**
 * Serializes all field elements in the jQuery object into a query string.
 * This method will return a string in the format: name1=value1&amp;name2=value2
 */
$.fn.fieldSerialize = function(successful) {
    var a = [];
    this.each(function() {
        var n = this.name;
        if (!n) {
            return;
        }
        var v = $.fieldValue(this, successful);
        if (v && v.constructor == Array) {
            for (var i=0,max=v.length; i < max; i++) {
                a.push({name: n, value: v[i]});
            }
        }
        else if (v !== null && typeof v != 'undefined') {
            a.push({name: this.name, value: v});
        }
    });
    //hand off to jQuery.param for proper encoding
    return $.param(a);
};

/**
 * Returns the value(s) of the element in the matched set.  For example, consider the following form:
 *
 *  <form><fieldset>
 *      <input name="A" type="text" />
 *      <input name="A" type="text" />
 *      <input name="B" type="checkbox" value="B1" />
 *      <input name="B" type="checkbox" value="B2"/>
 *      <input name="C" type="radio" value="C1" />
 *      <input name="C" type="radio" value="C2" />
 *  </fieldset></form>
 *
 *  var v = $('input[type=text]').fieldValue();
 *  // if no values are entered into the text inputs
 *  v == ['','']
 *  // if values entered into the text inputs are 'foo' and 'bar'
 *  v == ['foo','bar']
 *
 *  var v = $('input[type=checkbox]').fieldValue();
 *  // if neither checkbox is checked
 *  v === undefined
 *  // if both checkboxes are checked
 *  v == ['B1', 'B2']
 *
 *  var v = $('input[type=radio]').fieldValue();
 *  // if neither radio is checked
 *  v === undefined
 *  // if first radio is checked
 *  v == ['C1']
 *
 * The successful argument controls whether or not the field element must be 'successful'
 * (per http://www.w3.org/TR/html4/interact/forms.html#successful-controls).
 * The default value of the successful argument is true.  If this value is false the value(s)
 * for each element is returned.
 *
 * Note: This method *always* returns an array.  If no valid value can be determined the
 *    array will be empty, otherwise it will contain one or more values.
 */
$.fn.fieldValue = function(successful) {
    for (var val=[], i=0, max=this.length; i < max; i++) {
        var el = this[i];
        var v = $.fieldValue(el, successful);
        if (v === null || typeof v == 'undefined' || (v.constructor == Array && !v.length)) {
            continue;
        }
        if (v.constructor == Array)
            $.merge(val, v);
        else
            val.push(v);
    }
    return val;
};

/**
 * Returns the value of the field element.
 */
$.fieldValue = function(el, successful) {
    var n = el.name, t = el.type, tag = el.tagName.toLowerCase();
    if (successful === undefined) {
        successful = true;
    }

    if (successful && (!n || el.disabled || t == 'reset' || t == 'button' ||
        (t == 'checkbox' || t == 'radio') && !el.checked ||
        (t == 'submit' || t == 'image') && el.form && el.form.clk != el ||
        tag == 'select' && el.selectedIndex == -1)) {
            return null;
    }

    if (tag == 'select') {
        var index = el.selectedIndex;
        if (index < 0) {
            return null;
        }
        var a = [], ops = el.options;
        var one = (t == 'select-one');
        var max = (one ? index+1 : ops.length);
        for(var i=(one ? index : 0); i < max; i++) {
            var op = ops[i];
            if (op.selected) {
                var v = op.value;
                if (!v) { // extra pain for IE...
                    v = (op.attributes && op.attributes['value'] && !(op.attributes['value'].specified)) ? op.text : op.value;
                }
                if (one) {
                    return v;
                }
                a.push(v);
            }
        }
        return a;
    }
    return $(el).val();
};

/**
 * Clears the form data.  Takes the following actions on the form's input fields:
 *  - input text fields will have their 'value' property set to the empty string
 *  - select elements will have their 'selectedIndex' property set to -1
 *  - checkbox and radio inputs will have their 'checked' property set to false
 *  - inputs of type submit, button, reset, and hidden will *not* be effected
 *  - button elements will *not* be effected
 */
$.fn.clearForm = function(includeHidden) {
    return this.each(function() {
        $('input,select,textarea', this).clearFields(includeHidden);
    });
};

/**
 * Clears the selected form elements.
 */
$.fn.clearFields = $.fn.clearInputs = function(includeHidden) {
    var re = /^(?:color|date|datetime|email|month|number|password|range|search|tel|text|time|url|week)$/i; // 'hidden' is not in this list
    return this.each(function() {
        var t = this.type, tag = this.tagName.toLowerCase();
        if (re.test(t) || tag == 'textarea') {
            this.value = '';
        }
        else if (t == 'checkbox' || t == 'radio') {
            this.checked = false;
        }
        else if (tag == 'select') {
            this.selectedIndex = -1;
        }
		else if (t == "file") {
			if (/MSIE/.test(navigator.userAgent)) {
				$(this).replaceWith($(this).clone(true));
			} else {
				$(this).val('');
			}
		}
        else if (includeHidden) {
            // includeHidden can be the value true, or it can be a selector string
            // indicating a special test; for example:
            //  $('#myForm').clearForm('.special:hidden')
            // the above would clean hidden inputs that have the class of 'special'
            if ( (includeHidden === true && /hidden/.test(t)) ||
                 (typeof includeHidden == 'string' && $(this).is(includeHidden)) )
                this.value = '';
        }
    });
};

/**
 * Resets the form data.  Causes all form elements to be reset to their original value.
 */
$.fn.resetForm = function() {
    return this.each(function() {
        // guard against an input with the name of 'reset'
        // note that IE reports the reset function as an 'object'
        if (typeof this.reset == 'function' || (typeof this.reset == 'object' && !this.reset.nodeType)) {
            this.reset();
        }
    });
};

/**
 * Enables or disables any matching elements.
 */
$.fn.enable = function(b) {
    if (b === undefined) {
        b = true;
    }
    return this.each(function() {
        this.disabled = !b;
    });
};

/**
 * Checks/unchecks any matching checkboxes or radio buttons and
 * selects/deselects and matching option elements.
 */
$.fn.selected = function(select) {
    if (select === undefined) {
        select = true;
    }
    return this.each(function() {
        var t = this.type;
        if (t == 'checkbox' || t == 'radio') {
            this.checked = select;
        }
        else if (this.tagName.toLowerCase() == 'option') {
            var $sel = $(this).parent('select');
            if (select && $sel[0] && $sel[0].type == 'select-one') {
                // deselect all other options
                $sel.find('option').selected(false);
            }
            this.selected = select;
        }
    });
};

// expose debug var
$.fn.ajaxSubmit.debug = false;

// helper fn for console logging
function log() {
    if (!$.fn.ajaxSubmit.debug)
        return;
    var msg = '[jquery.form] ' + Array.prototype.join.call(arguments,'');
    if (window.console && window.console.log) {
        window.console.log(msg);
    }
    else if (window.opera && window.opera.postError) {
        window.opera.postError(msg);
    }
}

})(jQuery);
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

$.widget( "an.widget", {
	options: {
		mode: "browser"
	},

	_create: function() {
		var self = this, o = this.options, el = this.element;
		o.mode = o.readonly && o.mode=="edit"? "browser" : o.mode;
		el.addClass("an-widget "+o.mode)[0].contentEditable = false;
		o.metadata = el.getMetadata()||{};
		o.attributes = attributes(el.get(0));
		o["transient"]=o.attributes["transient"];
		o.id = el.attr("id");
		if(o.id) o.id = o.id.replace(/-/g,".");
		o.type = el.attr("type");
		if($.type(o.parent) == "function") o.parent = o.parent();

		this.content = el.children("div.content");
		if(this.content.size()==0) this.content = $("<div class='content'/>").appendTo(el);
		this._makeResizable();
		
		el.bind("metadatachanged.widget",function(e, md, oldmd){
			e.stopImmediatePropagation();
			self._reloadMetadata(md, oldmd);
		}).bind("attributeschanged.widget",function(e, attrs, oldattrs){
			e.stopImmediatePropagation();
			o.attributes = attrs;
			self._trigger("optionchanged",null,{key:"attributes", value:attrs, oldValue:oldattrs});
		}).bind("dblclick.widget click.widget change.widget",function(e){
			if($(e.target).closest(".widget")[0] == self.element[0]){
				setTimeout(function(){el.trigger($.Event(e,{type:"widget"+e.type}), self);},20);
			}
		});
	},
	
	_init: function(){
		this.refresh();
	},

	selectable:function(e){
		return this.options.mode == "design";
	},
	
	_makeResizable:function(){
		var self = this, o = this.options, el = this.element, handles = null;
		el.removeClass("fill-width auto-width fill-height auto-height");
		if(o.width == "fill" || o.width == "auto"){
			el.css("width","").addClass(o.width+"-width");
		}else{
			handles = "e";
		}
		
		if(o.height == "fill" || o.height == "auto"){
			el.css("height","").addClass(o.height+"-height");
		}else{
			handles = handles ? (handles+",s,se") : "s";
		}
		
		if(handles && (o.mode == "design" || o.resizable)){
			el.resizable({
				handles: handles,
				stop:function(e,ui){
					self._trigger("resize",null, {size:ui.size, oldSize:ui.originalSize});
				}
			});	
		}
	},

	option: function(key, value) {
		var o = this.options;
		if(key === "mode" && value==="edit" && o.readonly){
			value = "browser";
		}
		if(key === "value" && value === undefined){
			return o.value;
		}
		if(key === "actionSet" && value === undefined){
			return o.actioSet;
		}
		return $.Widget.prototype.option.apply(this, arguments );
	},

	_setOption: function(key, value) {
		var o = this.options, oldValue = o[key];
		if(!equals(value,oldValue)){
			$.Widget.prototype._setOption.apply(this, arguments );
			this._handleChange(key, value, oldValue);
			this._trigger("optionchanged",null,{key:key, value:value, oldValue:oldValue, isTransient:o.isTransient});
		}
		return this; 
	},
	
	_handleChange:function(key, value, oldValue){
		if(key === "mode" || key === "value"){
			if(key === "mode"){
				this.element.removeClass(oldValue).addClass(value);
			}
			this.refresh();
		}else if(key == "width" || key == "height"){
			this._makeResizable();
		}else if(key == "readonly"){
			if(value){
				this.option("mode", "browser");
			}else{
				this.option("mode", "edit");
			}
		}
	},
	
	_reloadMetadata:function(md, oldmd){
		this.options.metadata = md;
		this.option(md[this.widgetName]);
		this.refresh();
		this._trigger("optionchanged",null,{key:"metadata", value:md, oldValue:oldmd});
	},
	
	_updateMetadata:function(){
		var o = this.options, el = this.element, oldmd = el.getMetadata();
		if(!equals(o.metadata, oldmd)){
			el.setMetadata(o.metadata);
			this._trigger("optionchanged",null,{key:"metadata", value:o.metadata, oldValue:oldmd});
		}
	},
	
	refresh:function(){
		var o = this.options;
		this["_"+o.mode] && this["_"+o.mode]();
	},
	
	highlight: function(highlight){
		this.element.toggleClass("an-state-hover",highlight);
	},
	
	scrollTo: function(){
		var o = this.options, opts = { onlyIfOutside: true, offsetTop: 50, offsetLeft: 50 };
		if(o.mode == "design"){
			o.parent.scrollTo(o.id, opts);
		}else{
			this.element.ScrollTo(opts);
		}
	},
	
	destroy: function() {
		this.element.resizable("destroy").unbind(".widget").removeAttr("contenteditable")
		    .removeClass("an-widget browser design edit selected");
		return $.Widget.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
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

$.widget( "an.field", $.an.widget, {
	options:{
	    value:"",
	},

	_create: function() {
		$.an.widget.prototype._create.apply(this, arguments);
		var o = this.options, el = this.element;
		el.addClass("an-field");

		var css = {};
		if(o.width) css.width = o.width;
		if(o.height) css.height = o.height;
		
		this.content.empty();
		if(!$.isEmptyObject(css)){
			this.content.css(css);
		}
		
		o.isTransient = el.attr("transient");
		
		this._createControl();
		this._createLabel();
	},

	_createControl:function(){},
	
	_createLabel:function(){
		var o = this.options, el = this.element;
		if(o.label){
		    $("<label/>").attr("for",o.id).html(o.label).prependTo(el);
		}
	},
	
	destroy: function() {
		this.content.remove();
		this.element.removeClass("an-field").children("label").remove();
		return $.an.widget.prototype.destroy.apply(this, arguments);
	}
});

})( jQuery );
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

$.widget( "an.box", $.an.widget, {
	options:{
		visibleButtonCount: 3,
		link: "raw" // raw, documentType, document, form, view, page
	},

	_create: function() {
		$.an.widget.prototype._create.apply(this, arguments);
		var o = this.options, el = this.element;
		el.addClass("an-box ui-corner-all").addClass(o.link == "raw"? "raw":"link").children(".title-bar").remove();
		
		this._showTitleBar(!o.hideTitleBar);
		this._showFootButtons(o.footAreaButtons||[]);
		
		el.bind("contextmenu2.box contextmenu.box",function(e){
        	if((o.contextmenu2 && e.type == "contextmenu2")
        			||(!o.contextmenu2 && e.type == "contextmenu")){
        		var actions = {};
    			if(o.mode == "design"){
    				actions["select"] = {type: "menuItem",text: "Select",handler: function(){el.trigger("click");}};
    			}
        		if(!$.isEmptyObject(actions)){
        			$(e.target).menu({
        				autoShow: true,
        				menuPosition:{ of: e, my: "left top", at: "left bottom"	},
        				actions: actions,
        				select: function(e,ui){	$(this).menu("destroy");	},
        				collapseAll: function(e){	$(this).menu("destroy");	}
        			});
        		}
        	}
        	e.preventDefault();
	    });
	},
	
	selectable:function(e){
		var o = this.options, t = e.target;
		if(o.hideTitleBar){
			return t == this.element[0];
		}else{
			return $(t).closest("div.title-bar")[0] == this.titleBar[0];
		}
	},
	
	_showTitleBar:function(show){
		var o = this.options, el = this.element;
		if(show){
			if(!this.titleBar){
				this.titleBar = $("<div class='title-bar ui-widget-header ui-corner-top'/>").prependTo(this.element);
				this.title = $("<div class='title'/>").html(o.title).appendTo(this.titleBar);
				this.toolbar = $("<div class='toolbar'/>").appendTo(this.titleBar);
			}
			this._refreshToolbarButtons();
		}else{
			el.removeClass("title-bar");
			this.titleBar && this.titleBar.remove();
			delete this.titleBar;
		}
	},
	
	_refreshToolbarButtons: function(){
		var self = this, o = this.options, btns = o.toolbarButtons||[];
		$.each(btns, function(k,btn){
			if(k >= o.visibleButtonCount) return false;
			$("<button class='title-button'/>").appendTo(self.toolbar).button({label:btn.label}).click(function(e){
				self.element.trigger("boxtoolbarbuttonclick",[self, btn.id]);
				e.preventDefault();
				e.stopImmediatePropagation();
			});
		});
		if(btns.length > o.visibleButtonCount){
			var items = [];
			for(var i = o.visibleButtonCount; i < btns.length; i++){
				items.push({
					id: btns[i].id,
					type: "menuItem",
					text: btns[i].label,
					handler:function(){self.element.trigger("toolbarbuttonclick", [self, this.id]);},
					enabled:function(){return true;}
				});
			}
			var sysMenu = $("<button class='box-menu'/>").button({label:"Box Menu",text:false, icons:{primary: "box-menu-icon"}}).appendTo(self.toolbar);
			sysMenu.menu({
				triggerEvent:"click",
				menuPosition:{ of:sysMenu, my: "right top", at: "right bottom"},
				actions: items,
				select: function(){ $(this).menu("collapseAll");}
			}).click(function(e){e.preventDefault();}).blur(function(e){sysMenu.menu("collapseAll");});	
		}
	},
	
	_showFootButtons:function(buttons){
		var self = this, el = this.element;
		if(buttons && buttons.length > 0){
			if(!this.footArea){
				this.footArea = $("<div class='foot-area'/>").appendTo(el);
			}else{
				this.footArea.empty();
			}
			$.each(buttons, function(k,btn){
				$("<button class='foot-button'/>").attr("id",btn.id).html(btn.label).prependTo(self.footArea).button().click(function(e){
					self.element.trigger("boxfootareabuttonclick",[self, btn.id]);
					e.preventDefault();
					e.stopImmediatePropagation();
				});
			});
		}else{
			el.removeClass("foot-area");
			this.footArea && this.footArea.remove();
			delete this.footArea;
		}
	},

	newDocument:function(typeId, opts){
		opts = opts || {};
		var self = this, o = this.options, dbId = opts.dbId || o.dbId,
		    el = $("<div class='target'/>").appendTo(this.content.empty()),
		    optsx = $.extend(true,{},opts,{
				opened:function(editor){
					var doc = editor.option("document"), title = opts.title || doc.title || doc._id;
					self._showFootButtons(opts.footAreaButtons||[]);
					self.option("title", title);
					opts.opened && opts.opened(editor);
				}
		    });
		optsx.mode = optsx.mode != 'design' ? 'edit' : optsx.mode;
		optsx.mobile = opts.mobile;
		if (opts.mobile && opts.mode == 'design') {
			$.ans.getDoc(dbId, opts.parent, null, function(err, p) {
				if(err){
    				console.log("Get parent document "+ opts.parent + " error:"+err);
    			}else{
    				var rootId = Model.rootId(typeId), doc = $.extend(true, {}, opts["default"],{_id: opts.id || new ObjectId().toString(), type: typeId});
    		    	if(doc._path){
    		    		doc._path = doc._path.replace(/[^,]+,$/, doc._id+",");
    		    	}else if(rootId){
    		    		doc._path = rootId+","+doc._id+",";
    		    	}
    		    	
    				if(p && p._path) doc._path = p._path+doc._id+",";
    				if (doc.type == Model.FORM || doc.type == Model.PAGE) {
    					el.page({mode:"design", mobile:true, page:doc});
    				} else {
    					Model.newDocument(el, dbId, typeId, optsx);
    				}
    			}
			});
		} else {
			Model.newDocument(el, dbId, typeId, optsx);
		}
		
		return this;
	},

	openDocument:function(docId, opts){
		opts = opts || {};
		var self = this, o = this.options, dbId = opts.dbId || o.dbId,
	        el = $("<div class='target'/>").appendTo(this.content.empty()),
	        optsx = $.extend(true, {}, opts,{
	    		opened:function(editor){
	    			var doc = editor.option("document"), title = opts.title || doc.title || doc._id;
	    			self._showFootButtons(opts.footAreaButtons||[]);
	    			self.option("title", title);
	    			opts.opened && opts.opened(editor);
	    		}
	        });
		if (o.mobile && o.mode == 'design') {
			Model.getPages(dbId,[docId],function(err, docs){
				el.page({mode:"design", page:docs[0], mobile:true});
			});
		} else {
			Model.openDocument(el, dbId, docId, optsx);
		}
		
		return this;
	},
	
	saveDocument:function(opts){
		opts = opts || {};
		var widget = this.linkedWidget();
		if(widget && widget.option("isDocumentEditor")){
			widget.save(opts);
		}
		return this;
	},

	openForm:function(formId, opts){
		opts = opts || {};
		$.extend(true,opts,{isFormEditor:true});

		var self = this, o = this.options, dbId = opts.dbId || o.dbId,
	        el = $("<div class='target'/>").appendTo(this.content.empty()),
	        optsx = $.extend(true, {mode: opts.mode != 'design' ? "edit" : opts.mode}, opts, {
	        	opened: function(editor){
	    			var form = editor.option("currentForm"), title = opts.title || form.title || form._id;
	    			self._showFootButtons(opts.footAreaButtons||[]);
	    			self.option("title", title);
	    			opts.opened && opts.opened(editor);
	    		}
	        });
		if (o.mobile && o.mode == 'design') {
			Model.getPages(dbId,[formId],function(err, forms){
				el.page({mode:"design", page:forms[0], document: forms[0], mobile:true});
			});
		} else {
			Model.openPage(el, dbId, formId, optsx);
		}
		return this;
	},

	openView:function(viewId, opts){
		opts = opts || {};
		var self = this, o = this.options, dbId = opts.dbId || o.dbId,
	        el = $("<div class='target'/>").appendTo(this.content.empty()),
	        optsx = $.extend(true, {}, opts, {
	        	opened: function(view){
	    			var v = view.option("view"), title = opts.title || v.title || v._id;
	    			self._showFootButtons(opts.footAreaButtons||[]);
	    			self.option("title", title);
	    			opts.opened && opts.opened(view);
	    		}	        	
	        });
		Model.openView(el, dbId, viewId, optsx);
		return this;
	},

	openPage:function(pageId, opts){
		opts = opts || {};
		$.extend(true,opts,{isPageEditor:true});
		
		var self = this, o = this.options, dbId = opts.dbId || o.dbId,
	        el = $("<div class='target'/>").appendTo(this.content.empty()),
	        optsx = $.extend(true, {mode:opts.mode != 'design' ? "edit" : opts.mode}, opts,{
	        	opened: function(page){
	    			var p = page.option("page"), title = opts.title || p.title || p._id;
	    			self._showFootButtons(opts.footAreaButtons||[]);
	    			self.option("title", title);
	    			opts.opened && opts.opened(page);
	    		}
	        });
		if (o.mobile && o.mode == 'design') {
			Model.getPages(dbId,[pageId],function(err, pages){
				el.page({mode:"design", page:pages[0], mobile:true});
			});
		} else {
			Model.openPage(el, dbId, pageId, optsx);
		}
		
		return this;
	},
	
	openSideView: function(sideViewId, opts){
		opts = opts || {};
		var self = this, o = this.options, dbId = opts.dbId || o.dbId,
		    el = $("<div class='target'/>").appendTo(this.content.empty()),
		    optsx = $.extend(true, {},opts, {
		    	opened:function(sideView){
					var title = opts.title || sideView.option("title") || sideView.option("_id");
					self._showFootButtons(opts.footAreaButtons||[]);
					self.option("title", title);
					opts.opened && opts.opened(page);
				}
		    });
		Model.openSideView(el, dbId, sideViewId, optsx);
		return this;
	},

	_browser:function(){
		var o = this.options, link = o.link;
		this.option("contextmenu2", false);
		this.content[0].contentEditable = false;
		if(link && link != "raw"){
			var target = this.content.children(".target"), data = target.data(), hit = false;
			for(var i in data){
				if($.inArray(i, ["editor","gridview", "formview", "customview","customizedview","page", "sideview","explorer","mobilelistview"]) != -1){
					data[i].option("mode", "browser");
					hit = true;
				}
			}
			if(!hit){
				var opts = {dbId:o.odbId||o.dbId, mobile:o.mobile}, id = o.targetId;
				if (o.mobile && o.mode == 'design') opts.mode = o.mode;
				if(link == "documentType"){
					this.newDocument(id, opts);
				}else if(link == "document"){
					this.openDocument(id, opts);
				}else if(link == "form"){
					this.openForm(id, opts);
				}else if(link == "view"){
					this.openView(id, opts);
				}else if(link == "page"){
					this.openPage(id, opts);
				}else if(link == "sideView"){
					this.openSideView(id, opts);
				}
			}
		}
	},
	
	linkedWidget:function(){
		var data = this.content.children(".an-view,.an-page,.an-editor,.an-mpage").data(), 
		    widget = null;
		if(data){
			$.each(data,function(){
				if($.inArray(this.widgetName,["editor","gridview","formview","customview","view","page","mobilelistview"]) != -1){
					widget = this;
					return false;
				}
			});
		}
		return widget;
	},

	_edit:function(){
		var o = this.options, link = o.link;
		this.option("contextmenu2", false);
		this.content[0].contentEditable = false;
		if(link && link != "raw"){
			var target = this.content.children(".target"), data = target.data(), hit = false;
			for(var i in data){
				if(i == "editor"){
					data[i].option("mode", "edit");
					hit = true;
				}
				if($.inArray(i, ["gridview", "formview","view", "page", "sideview","explorer"]) != -1){
					data[i].option("mode", "browser");
					hit = true;
				}
			}
			if(!hit){
				var id = o.targetId, ob = {dbId:o.odbId||o.dbId}, oe = {mode:"edit",dbId:o.odbId||o.dbId}; 
				if(link == "documentType"){
					this.newDocument(id, oe);
				}else if(link == "document"){
					this.openDocument(id, oe);
				}else if(link == "form"){
					this.openForm(id, oe);
				}else if(link == "view"){
					this.openView(id, ob);
				}else if(link == "page"){
					this.openPage(id, oe);
				}else if(link == "sideView"){
					this.openSideView(id, ob);
				}
			}
		}
	},
	
	_design:function(){
		var o = this.options, link = o.link;
		if (o.mobile) o.mode = "design";
		this._browser();
		this.option("contextmenu2", true);
		if(link == "raw"){
			this.content[0].contentEditable = true;
		}
	},

	_handleChange:function(key, value, oldValue){
		if(key === "title"){
			this.title && this.title.html(value);
		}else if(key ==="hideTitleBar"){
			this._showTitleBar(!value);
		}
		return $.an.widget.prototype._handleChange.apply(this, arguments);
	},
	
	destroy: function() {
		var o = this.options, link = o.link;
		if(link && link != "raw"){
			this.content.remove();
		}else{
			this.content.removeAttr("contenteditable");
		}
		this.titleBar&&this.titleBar.remove();
		this.footArea && this.footArea.remove();
		this.element.unbind(".box").removeClass("an-box ui-corner-all title-bar");
		return $.an.widget.prototype.destroy.apply(this, arguments);
	}
});

})( jQuery );
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

(function($, undefined) {

	$.widget("an.inputfield", $.an.field, {
		_create : function() {
			$.an.field.prototype._create.apply(this, arguments);
			this.element.addClass("an-inputfield");
		},

		_createControl : function() {
			var self = this, o = this.options;
			if (o.mobile) {
				var el = this.element.find(".content").eq(0);
				el.addClass("ui-shadow-inset ui-corner-all ui-btn-shadow ui-body-c ui-input-text");
				
				this.input = $("<input type='" + o.type + "'/>").attr({ name : o.id }).addClass("ui-body-c ui-input-text").bind(
					"change.inputfield keyup.inputfield",
					function(e) {
						var value = self.input.val(), oldValue = o.value;
						if (value != oldValue) {
							o.value = value;
							self._trigger("optionchanged", null, { key : "value", value : value, oldValue : oldValue,
								isTransient : o.isTransient });
						}
					}).bind("dblclick.inputfield", function(e) {
					e.stopImmediatePropagation();
				}).bind("focus.inputfield", function(e) {
					el.addClass("ui-focus");
				}).bind("blur.inputfield", function(e) {
					el.removeClass("ui-focus");
				}).bind("keyup.inputfield", function(e) {
					
				});

				if (o.placeholder) {
					this.input.attr("placeholder", o.placeholder);
				}

				if (o.value) {
					this.input.attr("value", o.value);
				}

				if (o.data_mini) {
					this.input.attr("data-mini", o.data_mini);
				}
			} else {
				this.input = $("<input type='" + o.type + "'/>").attr({ name : o.id }).addClass(
					"ui-widget-content ui-corner-all").bind(
					"change.inputfield keyup.inputfield",
					function(e) {
						var value = self.input.val(), oldValue = o.value;
						if (value != oldValue) {
							o.value = value;
							self._trigger("optionchanged", null, { key : "value", value : value, oldValue : oldValue,
								isTransient : o.isTransient });
						}
					}).bind("dblclick.inputfield", function(e) {
					e.stopImmediatePropagation();
				});
			}

			if (!$.isEmptyObject(o.validate)) {
				this.input.addClass($.toJSON({ validate : o.validate }));
			}
			this.input.css({ width : o.width, height : o.height });
		},

		_makeResizable : function() {
		},

		_browser : function() {
			this.input.detach();
			var c = this.content;
			if (c.is(".ui-resizable")) c.resizable("destroy");
			c.html(this.options.value + "").css("display", "");
		},

		_edit : function() {
			this.input.detach().val(this.options.value).appendTo(this.content.empty());
		},

		_design : function() {
			this.input.detach();
			var self = this, o = this.options, c = this.content;
			if (c.is(".ui-resizable")) c.resizable("destroy");
			c.html(o.value + "").css({ width : o.width, height : o.height, display : "" }).resizable(
				{ stop : function(e, ui) {
					o.width = c.width();
					o.height = c.height();
					$.extend(true, o.metadata[self.widgetName], { width : o.width, height : o.height });
					self._updateMetadata();
					self._trigger("resize", null, { size : ui.size, oldSize : ui.originalSize });
				} });
		},

		_handleChange : function(key, value, oldValue) {
			if (key === "label") {
				this.input && this.input.remove();
				this.element.children("label").remove();
				this._createControl();
				this._createLabel();
			} else {
				$.an.field.prototype._handleChange.apply(this, arguments);
			}
		},

		highlight : function(highlight) {
			(this.options.mode == "edit" ? this.input : this.element).toggleClass("an-state-hover", highlight);
		},

		destroy : function() {
			this.input && this.input.unbind(".inputfield").remove();
			this.element.removeClass("an-inputfield");
			return $.an.field.prototype.destroy.apply(this, arguments);
		} });
})(jQuery);
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

$.widget( "an.textfield", $.an.inputfield, {
	_create: function() {
		$.an.inputfield.prototype._create.apply(this, arguments);
		this.element.addClass("an-textfield");
	},

	destroy: function() {
		this.element.removeClass("an-textfield" );
		return $.an.inputfield.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
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

$.widget( "an.radiofield", $.an.inputfield, {
	options:{
		orientation:"horizontal"
	},

	_create: function() {
		$.an.inputfield.prototype._create.apply(this, arguments);
		this.element.addClass("an-radiofield");
		this.content.remove();
	},

	_createControl:function(){
		var self = this, o = this.options, el = this.element;	
		if (o.mobile) {
			var radio_group = $("<div class='ui-controlgroup-controls' />");
			radio_group.append($("<label />").attr("for", o.id).html(o.label).css("display", "block"));
			$.each(o.selectItems||[], function(k,v){
				var radio_elem = $("<div class='ui-radio' />");
				$("<input type='radio'/>").attr({id:o.id+k, name:o.id, value:this.value}).addClass("ui-widget-content").appendTo(radio_elem);
				$("<div class='content'/>").hide().appendTo(el);
				var label = '<span class="ui-btn-inner"><span class="ui-btn-text">' + this.label + '</span> \
					<span class="ui-icon ui-icon-radio-on ui-icon-shadow"> </span>\
					</span>';

				var label_elem = $("<label class='ui-radio-off ui-btn ui-btn-up-c ui-fullsize ui-btn-icon-left' style='margin:0'  />").attr("for",o.id+k);
				if (!o.data_theme) {
					o.data_theme = 'c';
				}
				
				if (k == 0) {
					label_elem.addClass("ui-first-child");
				}
				
				if (k == (o.selectItems.length - 1)) {
					label_elem.addClass("ui-last-child");
				}
				label_elem.addClass("ui-btn-up-" + o.data_theme);
				label_elem.html(label).appendTo(radio_elem);
				radio_elem.appendTo(radio_group);
				
			});
			var $wrap=$("<div border='1' class='ui-controlgroup ui-corner-all ui-controlgroup-" + o.orientation + "'/>");
			if(o.isMini){
				$wrap.addClass("ui-mini");
			}
			radio_group.appendTo($wrap.appendTo(el));
			radio_group.delegate(".ui-radio","click", function(e) {
				var $this=$(this);
				if (o.orientation == "vertical") {
					$this.removeClass("ui-icon-radio-off").addClass('ui-radio-on').siblings().removeClass('ui-radio-on');
				} else {
					$this.find(">label").addClass('ui-btn-active');
					$this.siblings().find(">label").removeClass('ui-btn-active');
				}
				$this.find('input').attr('checked','checked');
				$this.siblings().find('input').removeAttr('checked');
				$this.find('input').trigger("change.radiofield");
			});
		} else {
			$.each(o.selectItems||[], function(k,v){
				$("<input type='radio'/>").attr({id:o.id+k, name:o.id, value:this.value})
				    .addClass("ui-widget-content ui-corner-all").appendTo(el);
				$("<div class='content'/>").hide().appendTo(el);
				$("<label/>").attr("for",o.id+k).html(this.label).appendTo(el);
				if(o.orientation == "vertical") el.append("<br>");
			});
			
		}
		this.inputs = el.find("input");
		this.contents = el.children(".content");
		if(!$.isEmptyObject(o.validate)){
			this.inputs.addClass($.toJSON({validate:o.validate}));
		}
		this.inputs.filter("[value="+o.value+"]").prop("checked",true);
		
		this.inputs.bind("change.radiofield",function(e){
			var value = $(e.target).attr("value"), oldValue = o.value;
			if(value != oldValue){
				o.value = value;
				self._trigger("optionchanged",null,{key:"value", value:value, oldValue:oldValue, isTransient:o.isTransient});
			}
		}).bind("dblclick.radiofield",function(e){e.stopImmediatePropagation();});
	},
	
	_createLabel:function(){},

	_makeResizable:function(){},

	_handleChange:function(key, value, oldValue){
		var o = this.options;
		if(key == "value"){
			this.inputs.filter("[value="+o.value+"]").prop("checked",true);
		}else if(key == "selectItems"){
			this.inputs.remove();
			this.contents.remove();
			this.element.children("label,br").remove();
			this._createControl();
		}else if(key == "orientation"){
			this.inputs.remove();
			this.contents.remove();
			this.element.children("label,br").remove();
			this._createControl();
		}else{
			return $.an.inputfield.prototype._handleChange.apply(this, arguments );
		}
	},
	
	_browser:function(){
		this.contents.css("display","none");
        this.inputs.attr("disabled","disabled");
	},
	
	_edit:function(){
		this.contents.css("display","none");
        this.inputs.removeAttr("disabled");
	},

	_design:function(){
		if (!this.options.mobile) {
			this.inputs.hide();
			this.contents.css("display","");
		}
	},

	highlight: function(highlight){
		this.element.toggleClass("an-state-hover",highlight);
	},
	
	destroy: function() {
		if (this.options.mobile) {
			this.element.children(".ui-controlgroup").unbind(".radiofield").remove();
		}
		this.inputs.unbind(".radiofield").remove();
		this.contents.remove();
		this.element.removeClass("an-radiofield" ).children("br").remove();
		$.an.inputfield.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
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

$.widget( "an.checkboxfield", $.an.inputfield, {
	_create: function() {
		$.an.inputfield.prototype._create.apply(this, arguments);
		this.element.addClass("an-checkboxfield");
		this.content.hide();

		
	},

	_createControl:function(){
		var self = this, o = this.options, el = this.element,c=this.content;
		if(o.mobile){
			var elementoptions = {};

			if(o.selectItems.length>1){				
				var checks_group = $("<fieldset data-role='controlgroup' />").appendTo(c);
				if(o.orientation == "horizontal"){
					checks_group.attr({"data-type":"horizontal"});
				}
				$.each(o.selectItems||[], function(k,v){
					this.input = $("<input type='checkbox'/>").attr({id:o.id+k, name:o.id+k, value:this.value}).appendTo(checks_group);
					$("<label />").attr({"for":o.id+k}).html(this.label).appendTo(checks_group);
				});
				
			}else{
				$.each(o.selectItems||[], function(k,v){
					this.input = $("<input type='checkbox'/>").attr({id:o.id, name:o.id, value:this.value}).addClass("custom").appendTo(c);
					$("<label  />").attr({"for":o.id}).html(this.label).appendTo(c);
				});
			}
			if (!o.data_theme) {
					o.data_theme = 'c';
				}
			elementoptions.theme = o.data_theme;
			if (o.isMini) {
				elementoptions.mini = true;
			}
			if($("input[type='checkbox']").checkboxradio){
				$("input[type='checkbox']").checkboxradio(elementoptions);
				$("fieldset[data-role='controlgroup']").controlgroup();
			}
			
						
		}else{
			this.input = $("<input type='checkbox'/>").attr({name:o.id})
			    .addClass("ui-widget-content ui-corner-all").bind("change.checkboxfield",function(e){
				var value = self.input.prop("checked"), oldValue = o.value;
				if(value != oldValue){
					o.value = value;
					self._trigger("optionchanged",null,{key:"value", value:value, oldValue:oldValue, isTransient:o.isTransient});
				}
			}).bind("dblclick.checkboxfield",function(e){e.stopImmediatePropagation();});
			if(!$.isEmptyObject(o.validate)){
				this.input.addClass($.toJSON({validate:o.validate}));
			}
			this.input.appendTo(this.element);
		}				
	},
	
	_handleChange:function(key, value, oldValue){
		var o = this.options;
			if(key == "value"){
				this.input.filter("[value="+o.value+"]").prop("checked",true);
			}else if(key == "selectItems"){
				this.input.remove();
				this.contents.remove();
				this.element.children("label,br").remove();
				this._createControl();
			}else{
				return $.an.inputfield.prototype._handleChange.apply(this, arguments );
			}
		
	},
	
	_makeResizable:function(){},
	
	_createLabel:function(){
		var o = this.options, el = this.element;
		if(o.label){
			if(!o.mobile){
				$("<label/>").attr("for",o.id).html(o.label).appendTo(el);
			}
		    
		}
	},
	
	_browser:function(){
		if(!this.options.mobile){
			this.input.prop('checked', this.options.value).attr("disabled","disabled");
		}else{
			this.content.css("display","");
		}
	},
	
	_edit:function(){
		if(!this.options.mobile){
			this.input.prop('checked', this.options.value).removeAttr("disabled");
		}else{
			this.content.css("display","");
		}
	},
	
	_design:function(){
		var o = this.options,c = this.content;
		if (o.mobile) {
			if (!o.data_theme) {
					o.data_theme = 'c';
				}
			c.html("");
			if(o.selectItems.length>1){
				var fildset = $("<fieldset class='ui-corner-all ui-controlgroup' />").appendTo(c);
				if(o.orientation=="horizontal"){
					fildset.addClass("ui-controlgroup-horizontal");
				}
				var group = $("<div class='ui-controlgroup-controls' />").appendTo(fildset);
				$.each(o.selectItems||[], function(k,v){
					var divcheckbox = $("<div class='ui-checkbox' />").html('<input type="checkbox" id="'+o.id+k+'" name="'+o.id+k+'" value="'+v+'">').appendTo(group);
					var labelcheckbox = $("<label class='ui-checkbox-off ui-btn ui-btn-corner-all ui-fullsize ui-btn-icon-left ui-btn-up-"+o.data_theme+"' />").html('<span class="ui-btn-inner"><span class="ui-btn-text">'+this.label+'</span><span class="ui-icon ui-icon-checkbox-off ui-icon-shadow">&nbsp;</span></span>').appendTo(divcheckbox); 
					if(k==0){
						labelcheckbox.addClass("ui-first-child");
					}
					if(k==o.selectItems.length-1){
						labelcheckbox.addClass("ui-last-child");
					}
				});
			}else{
				$.each(o.selectItems||[], function(k,v){
				$("<div class='ui-checkbox' />").html('<input type="checkbox" id="'+o.id+k+'" name="'+o.id+k+'" value="'+v+'"><label for="1230" class="ui-checkbox-off ui-btn ui-btn-corner-all ui-fullsize ui-btn-icon-left ui-btn-up-'+o.data_theme+'"><span class="ui-btn-inner"><span class="ui-btn-text">'+this.label+'</span><span class="ui-icon ui-icon-checkbox-off ui-icon-shadow">&nbsp;</span></span></label>').appendTo(c);
			});
			}
			
		this.content.css("display","");
		} else {
			this.input.hide();
			this.content.css("display","");
		}
	},
	
	highlight: function(highlight){
		this.element.toggleClass("an-state-hover",highlight);
	},
	
	destroy: function() {
		if(!this.options.mobile){
			this.input.unbind(".checkboxfield");
		}
		this.element.removeClass( "an-checkboxfield" );
		return $.an.inputfield.prototype.destroy.apply( this, arguments );
		
	}
});
})( jQuery );
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

$.widget( "an.passwordfield", $.an.inputfield, {
	_create: function() {
		$.an.inputfield.prototype._create.apply(this, arguments);
		this.element.addClass("an-passwordfield");
	},

	_browser:function(){
		$.an.inputfield.prototype._browser.apply(this, arguments);
		this.content.html("********");
	},
	
	_design:function(){
		this.input.hide();
		var self = this, o = this.options, c = this.content;
		if(c.is(".ui-resizable")) c.resizable("destroy");
		c.html("********").css({width:o.width, height:o.height, display:""}).resizable({
			stop:function(e,ui){
				o.width = c.width();
				o.height = c.height();
				$.extend(true,o.metadata[self.widgetName],{width:o.width,height:o.height});
				self._updateMetadata();
				self._trigger("resize",null, {size:ui.size, oldSize:ui.originalSize});
			}
		});
	},

	destroy: function() {
		this.element.removeClass( "an-passwordfield" );
		$.an.inputfield.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
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

$.widget( "an.datetimefield", $.an.inputfield, {
	
	_create: function() {
		$.an.inputfield.prototype._create.apply(this, arguments);
		this.element.addClass("an-datetimefield");
	},
	
	_edit:function(){
		var date=new Date(), lng=window.database.local,
		opts={
			hour: date.getHours(),
            minute: date.getMinutes(),
			dateFormat: this.options.dateFormat?this.options.dateFormat:'mm/dd/yy',
			minDate: this.options.minDate && eval("("+ this.options.minDate +")") || null,
			maxDate: this.options.maxDate && eval("("+ this.options.maxDate +")") || null,
			yearRange:this.options.yearRange?this.options.yearRange:"c-10:c+10",
			changeMonth:true,
			changeYear:true,
			onClose: function() {
				var $this = $(this);
				$this.valid&&$this.valid();
			}
		};
		
		if(lng&&lng!='en'){
			$.extend(opts,$.i18n.datepicker);
		}
		
		$.an.inputfield.prototype._edit.apply( this, arguments );
		
		this.input.removeClass("hasDatepicker");
		if(this.options.time=='y'){
			this.input.datetimepicker(opts);
		}else{
			this.input.datepicker(opts);
		}
	},
	
	destroy: function() {
		this.input.datepicker("destroy");
		this.element.removeClass("an-datetimefield" );
		return $.an.inputfield.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
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

$.widget( "an.textareafield", $.an.field, {

	_create: function() {
		$.an.field.prototype._create.apply(this, arguments);
		this.element.addClass("an-textareafield");
	},

	_createControl:function(){
		var self = this, o = this.options, el = this.element;
		if (o.mobile) {
			el.find(".content").addClass("codiqa-control");
			this.textarea = $("<textarea type='"+o.type+"'/>").attr("name",o.id)
			    .addClass("ui-input-text ui-body-c ui-corner-all ui-shadow-inset");
			this.textarea.bind("change.textareafield keyup.textareafield",function(e){
				e.preventDefault();
	//			e.stopImmediatePropagation();
				var value = self.textarea.val(), oldValue = o.value;
				if(value != oldValue){
					o.value = value;
					self._trigger("optionchanged",null,{key:"value", value:value, oldValue:oldValue, isTransient:o.isTransient});
				}
			}).bind("dblclick.textareafield",function(e){e.stopImmediatePropagation();
			}).bind("focus.textareafield", function(e) {
				$(this).addClass("ui-focus");
			}).bind("blur.textareafield", function(e) {
				$(this).removeClass("ui-focus");
			});
		} else {
			this.textarea = $("<textarea type='"+o.type+"'/>").attr("name",o.id)
			    .addClass("ui-widget-content ui-corner-all");
			this.textarea.bind("change.textareafield keyup.textareafield",function(e){
				e.preventDefault();
	//			e.stopImmediatePropagation();
				var value = self.textarea.val(), oldValue = o.value;
				if(value != oldValue){
					o.value = value;
					self._trigger("optionchanged",null,{key:"value", value:value, oldValue:oldValue, isTransient:o.isTransient});
				}
			}).bind("dblclick.textareafield",function(e){e.stopImmediatePropagation();});
		}



		if(o.resizable) this.content.resizable();
		if(!$.isEmptyObject(o.validate)){
			this.textarea.addClass($.toJSON({validate:o.validate}));
		}
	},

	_makeResizable:function(){},

	_browser:function(){
		this.textarea.detach();

		var o = this.options, c = this.content;
		if(c.is(".ui-resizable")) c.resizable("destroy");
		c.html(o.pre? "<pre>"+o.value+"</pre>": o.value).css("display","");
	},

	_edit:function(){
		this.textarea.detach().val(this.options.value).appendTo(this.content.empty());
	},

	_design:function(){

		this.textarea.detach();

		var self = this, o = this.options, c = this.content;
		if(c.is(".ui-resizable")) c.resizable("destroy");
		c.html(o.pre? "<pre>"+o.value+"</pre>":o.value)
		 .css({width:o.width, height:o.height, display:""}).resizable({
			stop:function(e,ui){
				o.width = c.width();
				o.height = c.height();
				$.extend(true,o.metadata[self.widgetName],{width:o.width,height:o.height});
				self._updateMetadata();
				self._trigger("resize",null, {size:ui.size, oldSize:ui.originalSize});
			}
		});
	},

	_handleChange:function(key, value, oldValue){
		if(key === "label"){
			this.textarea.remove();
			this.element.children("label").remove();
			this._createControl();
			this._createLabel();
		}else {
			$.an.field.prototype._handleChange.apply(this, arguments);
		}
	},

	destroy: function() {
		this.textarea.unbind(".textareafield").parent().remove();
		this.element.removeClass( "an-textareafield" );
		return $.an.field.prototype.destroy.apply(this, arguments);
	}
});
})( jQuery );
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

$.widget( "an.rtefield",  $.an.field, {
	options:{
		showToolbar:true
	},

	_create: function() {
		$.an.field.prototype._create.apply(this, arguments);
		this.element.addClass("an-rtefield");
		var self = this, o = this.options;

		this.content.bind("change.rtefield",function(e){
			e.preventDefault();
//			e.stopImmediatePropagation();

			var value = self.content.rte("option","content"), oldValue = o.value;
			if(value != oldValue){
				o.value = value;
				self._trigger("optionchanged",null,{key:"value", value:value, oldValue:oldValue, isTransient:o.isTransient});
			}
		});
	},

	_browser:function(){
		this.content.rte("destroy").html(this.options.value);
		this.content.find(".widget[type=tabsx]").each(function(){
			var $this = $(this);
			if($this.is(".an-tabsxwidget")){
				$this.data("tabsxwidget").option("mode","browser");
			}else{
				$this.tabsxwidget({	parent:function(){return self;}, mode:"browser"});
			}
		});
	},
	
	_edit:function(){
		var o = this.options;
		this.content.rte({
			content:o.value,
			dbId:o.dbId,
			showToolbar:o.showToolbar,
			stylesheet:o.stylesheet,
			cssClass: o.cssClass,
			resizable: o.resizable,
			cssfiles: ['stylesheets/rte/rte-design.css','stylesheets/jquery-ui-1.8.24.custom.css','stylesheets/base.css'].concat(o.globalCSSFiles).concat(o.localCSSFiles),
			jsfiles:  [].concat(o.globalJSFiles).concat(o.localJSFiles)
		});
	},

	_design:function(){
		this._browser();
	},

	destroy: function() {
		this.content.rte("destroy");
		this.element.removeClass("an-rtefield");
		return $.an.field.prototype.destroy.apply(this, arguments);
	}
});
})( jQuery );
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

$.widget( "an.selectfield", $.an.field, {

	options:{
		nativeMenu:true
	},

	_create: function() {
		$.an.field.prototype._create.apply(this, arguments);
		this.element.addClass("an-selectfield");
	},
	
	_createControl:function(){
		var self = this, o = this.options;
		var sel = this.select = $("<select />").attr("name",o.id);
		if(!o.mobile){			
			$("<option/>").attr("value","").html("").appendTo(sel);
		}
		$.each(o.selectItems||[], function(){
			$("<option/>").attr("value",this.value).html(this.label).appendTo(sel);
		});
		sel.bind("change.selectfield", function(e){
			e.preventDefault();
			//e.stopImmediatePropagation();
			var value = sel.val(), oldValue = o.value;
			if(value != oldValue){
				o.value = value;
				self._trigger("optionchanged",null,{key:"value", value:value, oldValue:oldValue, isTransient:o.isTransient});
			}
		});
		
		if(!$.isEmptyObject(o.validate)){
			sel.addClass($.toJSON({validate:o.validate}));
		}
		
		if(o.mobile){
			if(!o.value&&o.selectItems[0])o.value=o.selectItems[0].value;
		}
	},
	
	_makeResizable:function(){},
	
	_browser:function(){
		var self = this, o = this.options;
		this.select.detach();
		$.each(o.selectItems, function(){
			if(this.value == o.value){
				self.content.html("<span style=\"padding: .6em 20px;display:inline-block;\">"+this.label+"</span>").show();
				return false;
			}
		});
	},
	
	_edit:function(){
		var o = this.options;
		this.select.detach().val(this.options.value).appendTo(this.content.empty());
		this._trigger("optionchanged",null,{key:"value", value:o.value, oldValue:"", isTransient:o.isTransient});
		if(o.mobile){			
			var  option = {};
			option.icon = 'arrow-r';
			if(o.corners){
				option.conrners = false;
			}
			if(o.icon){
				option.icon = o.icon;
			}
			if(o.iconpos){
				option.iconpos = o.iconpos;
			}
			if(o.iconshadow){
				option.iconshadow = false;
			}
			if(o.inline){
				option.inline = true;
			}
			if(o.mini){
				option.mini = true;
			}
			if(o.nativeMenu){
				option.nativeMenu = false;
			}
			if(o.overlayTheme){
				option.overlayTheme = o.overlayTheme;
			}
			if(o.preventFocusZoom){
				option.preventFocusZoom = false;
			}
			if(o.shadow){
				option.shadow = false;
			}
			if(o.theme){
				option.theme = o.theme;
			}
			if(this.select.data("mobileSelectmenu")){
				this.select.data("mobileSelectmenu").destroy();
			}
			this.select.selectmenu(option);
		}
	},
	
	_design:function(){
		this.select.detach();

		var self = this, o = this.options, c = this.content;
		if(o.mobile){
			c.html('<div class="ui-select">\
					<a class="ui-btn ui-shadow ui-btn-corner-all ui-btn-icon-right ui-btn-up-c">\
					<span class="ui-btn-inner">\
					<span class="ui-btn-text"><span>' + o.selectItems[0].label + '</span></span><span class="ui-icon ui-icon-arrow-d ui-icon-shadow">&nbsp;</span></span></a>\
					<select>\
					  </select>\
					    </div>');
		}else{
		if(c.is(".ui-resizable")) c.resizable("destroy");
		$.each(o.selectItems, function(){
			if(this.value == o.value){
				c.html(this.label);
				return false;
			}
		});
		c.css({width:o.width, height:o.height}).resizable({
			stop:function(e,ui){
				o.width = c.width();
				o.height = c.height();
				$.extend(true,o.metadata[self.widgetName],{width:o.width,height:o.height});
				self._updateMetadata();
				self._trigger("resize",null, {size:ui.size, oldSize:ui.originalSize});
			}
		});
		}
	},
	
	_handleChange:function(key, value, oldValue){
		if(key === "label"){
			this.element.children("label").remove();
			this._createLabel();
		}else if(key == "selectItems"){
			this.select.remove();
			this._createControl();
		}else if(this.options.mobile){
			this.select.remove();
			this._createControl();
		}else{
			$.an.field.prototype._handleChange.apply(this, arguments);
		}
	},
	
	destroy: function() {
		this.select.unbind(".selectfield").remove();
		this.element.removeClass("an-selectfield" );
		return $.an.field.prototype.destroy.apply(this, arguments);
	}
});
})( jQuery );
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
					o.value.splice(i,1);
					//o.value[i]._del = true;
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
			button_window_mode : "transparent",
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
			//if(!v._del){
				size++;
				self._addIcon(v);
			//}
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
							if(!o.value)o.value=[];
							var oldValue = [].concat(o.value);
							o.value.push(resp);
							if(self.files.children().size() >= o.maxCount){
								setTimeout(function(){li.hide();},50);//prevent to throw error under the browers of ie
							}
							self._addIcon(resp);
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

$.widget( "an.gridfield", $.an.field, {
	options: {
		mode: "browser",
		addItemLabel: "Add",
		editItemLabel: "Edit",
		deleteItemLabel: "Delete",
		value:[]
	},

	_create: function() {
		$.an.field.prototype._create.apply(this, arguments);
		this.element.addClass("an-gridfield");
	},
	
	_createControl:function(){
		var self = this, o = this.options, c = this.content;
		this.titlebar = $("<div class='titlebar ui-widget-header'/>").appendTo(c);
		this.title = $("<span class='title'/>").html(o.label).appendTo(this.titlebar);
		this.toolbar = $("<span class='toolbar'/>").appendTo(this.titlebar);
		if(o.converter){
			o.converter=eval("("+o.converter+")");
			if(!$.isFunction(o.converter)){
				o.converter=function(row,col,v){
					return v;
				};
			}
		}
		var lng=window.database.local;
		if(lng&&lng!='en'){
			$.extend(o,$.i18n.gridfield);
		}
		this.grid = $("<div/>").appendTo(c)
		      .agilegrid($.extend({
					dbId:o.dbId,
					cellRender: function(row, col){
						var v = "", r = o.value[row], cm = this.colModel;
						if( r ) {
							try{v = eval("r."+cm[col].name);}catch(e){};
							v = v || "";
						}
						return o.converter?o.converter(row,col,v):v;
					},
					leftHeaderRender:function(row){return row+1;},
					columnResize:function(e,data){if(o.mode == "design") self._updateMetadata();},
					optionchanged:function(e,data){if(o.mode == "design" && data.key == "colModel") self._updateMetadata();}
				},o.gridOptions));
		$.each(["addItem","editItem","deleteItem"], function(k,v){
			$("<button class='title-button'/>").attr("id",v).html(o[v+"Label"]).appendTo(self.toolbar).button().click(function(e){
				self['_'+$(e.target).closest('button').attr("id")]();
				return false;
			});
		});
	},

	_createLabel:function(){},

	_makeResizable:function(){},
	
	_updateMetadata:function(){
		var opts = {
				colModel: this.grid.agilegrid("option","colModel"),
				totalColCount: this.grid.agilegrid("option","totalColCount")
		};
		$.extend(true, this.options.metadata, {gridfield:{gridOptions: opts}});
		return $.an.field.prototype._updateMetadata.apply(this, arguments);
	},
	
	_addItem: function(){
		this._createItemEditor(this.options.formId);
	},
	
	_editItem: function(){
		var o = this.options, row=0;
		$.each(this.grid.agilegrid("option","rowSelections"), function(k,v){
			if(v) { row = k; return false; }
		});
		this._createItemEditor(o.formId, row);
	},
	
	_deleteItem: function(){
		var o = this.options, sel = this.grid.agilegrid("option","rowSelections"), value = [];
		$.each(o.value, function(k,v){
			if(!sel[k]){
				value.push(v);
			}
		});
		this._setValue(value);
	},
	
	_setValue:function(value){
		var o = this.options;
		var oldValue = o.value;
		o.value = value;
		this.grid.agilegrid("option","rowCount", value.length).agilegrid("refresh");
		this.element.trigger("change");
		this._trigger("optionchanged",null,{key:"value", value:value, oldValue:oldValue, isTransient:o.isTransient});
	},
	
	_createItemEditor: function(formId, row){
		var self = this, o = this.options;
		o.value = o.value || [];
		$.ans.getDoc(o.dbId,formId,null,function(err,form){
			$("<div/>").dialog($.extend({
				title: form.title || form.name || form._id, 
				autoOpen: true,
				height: 500,
				width: 600,
				modal: true,
				open: function(event, ui){
					var doc = new DocWrapper(o.value[row]||{});
					$(this).form({form:form, document:doc,url:o.url,dbId:o.dbId,mode:"edit",ignoreEscape:true});
				},
				buttons:{
					"OK": function(){
						if(!(o.gridOptions.validate) || (o.gridOptions.validate && $(this).form("validate"))){
							var $this = $(this), doc = $this.form("option","document").getDoc(), value = [].concat(o.value);
							if(row !== undefined){
								value.splice(row,1,doc);
							}else{
								value.push(doc);
							}
							self._setValue(value);
							$this.dialog("close");
						}
						
					},
					"Cancel": function(){
						$(this).dialog("close"); 
					}
				},
				close:function(){
					$(this).form("destroy").remove();
				}
			},o.dialogOptions));
		});
	},
	
	_handleChange:function(key, value, oldValue){
		$.an.field.prototype._handleChange.apply(this, arguments);
		if(key === "label") this.title.html(value);
	},
	
	_browser:function(){
		var o = this.options;
		this.grid.agilegrid($.extend(true,{},{
			rowCount: (o.value&&o.value.length)||0,
			isColumnResizable: false, 
			isRowResizable: false,
			contextmenu2:false
		},o.gridOptions)).agilegrid("refresh");
		this.toolbar.hide();
	},
	
	_edit:function(){
		this._browser();
		this.toolbar.show();
	},
	
	// TODO: Editing column is not correct in design mode.
	_design:function(){
		var self = this, o = this.options, c = this.content;
		if(c.is(".ui-resizable")) c.resizable("destroy");
		c.resizable({
			stop:function(e,ui){
				o.width = c.width();
				o.height = c.height();
				$.extend(true,o.metadata[self.widgetName],{width:o.width,height:o.height});
				self._updateMetadata();
				self._trigger("resize",null, {size:ui.size, oldSize:ui.originalSize});
			}
		});
		
		this.grid.agilegrid($.extend(true,{},{
			rowCount: (o.value&&o.value.length)||0,
			isColumnResizable: true,
			isRowResizable: true,
			columnEditable:true,
			contextmenu2:true
		},o.gridOptions)).agilegrid("refresh");
		this.toolbar.show();
	},
	
	destroy: function() {
		$(window).unbind("resize.an-gridfield", this._proxy);
		this.element.removeClass("an-gridfield" );
		return $.an.field.prototype.destroy.apply(this, arguments);
	}
});
})( jQuery );
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

$.widget( "an.jsrenderfield", $.an.field, {
	options: {
		mode: "browser",
		selector:"",
		browserTemplate:"",
		editorTemplate:"",
		value:[]
	},

	_create: function() {
		$.an.field.prototype._create.apply(this, arguments);
		var o = this.options, c = this.content;
		this.element.addClass("an-jsrenderfield");
		try {
			c.html(o.content);
		} catch (e) {
			
		}
		
		if (o.template) {
			o.template=$.templates(o.template);
		}
		
		if(o.converters){
			var conv = {};
			var tmp = null;
			for (var j = 0; j < o.converters.length; j++) {
				tmp = eval("(0," + o.converters[j]['function'] + ")");
				if (!$.isFunction(tmp)) {
					conv[o.converters[j]['name']] = function(v) {
						return v;
					};
				} else {
					conv[o.converters[j]['name']] = tmp;
				}
			}
			
			$.views.converters(conv);
		}
	},
	
	_notify:function(oldValue, value){
		var o = this.options;
		if(value != oldValue){
			o.value = value;
			this._trigger("optionchanged",null,{key:"value", value:value, oldValue:oldValue, isTransient:o.isTransient});
		}
	},
	
	appendValue:function(value) {
		var o = this.options, oldValue = [].concat(o.value);
		o.value.push(value);
		this.refresh();
		this._notify(oldValue, o.value);
	},

	insertValue:function(index, value) {
		var o = this.options, oldValue = [].concat(o.value);
		o.value.splice(index, 1, value);
		this.refresh();
		this._notify(oldValue, o.value);
	},
	
	delValue:function(index) {
		var o = this.options, oldValue = [].concat(o.value);
		o.value.splice(index, 1);
		this.refresh();
		this._notify(oldValue, o.value);
	},
	
	getValue:function(index) {
		var o = this.options;
		return o.value[index];
	},
	
	replaceValue:function(index, value) {
		var o = this.options, oldValue = [].concat(o.value);
		o.value[index] = value;
		this.refresh();
		this._notify(oldValue, o.value);
	},
	
	_browser:function(){
		var o = this.options;
		if (o.browserTemplate != undefined && o.browserTemplate != "") {
			var html = $.render[o.browserTemplate](o.value);
			$(o.selector, this.element).html(html);
		} else {
			if (o.template) {
				var html = o.template.render(o.value);
				$(o.selector, this.element).html(html);
			}
		}
	},
	
	_edit:function(){
		var o = this.options;
		if (o.editorTemplate != undefined && o.editorTemplate != "") {
			var html = $.render[o.editorTemplate](o.value);
			$(o.selector, this.element).html(html);
		} else {
			if (o.template) {
				var html = o.template.render(o.value);
				$(o.selector, this.element).html(html);
			}
		}
	},
	
	_design:function(){
		this._browser();
	},
	
	destroy: function() {
		this.element.removeClass("an-jsrenderfield" );
		return $.an.field.prototype.destroy.apply(this, arguments);
	}
});
})( jQuery );
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

$.widget( "an.buttonwidget",  $.an.widget, {

	_create: function() {
		var o = this.options;
		$.an.widget.prototype._create.apply(this, arguments);
		this.element.addClass("an-buttonwidget");
		var opts = {label:this.options.label};
		if (o.mobile) {
			// opts = {corners:true, icon:"star", iconpos: "right" , iconshadow: false, inline: true, mini: true, shadow: false, theme: "a"};
			opts.corners = true;
			opts.iconshadow = false;
			if (o.data_transition) {
				opts.transition = o.data_transition;
			}
			
			if (o.data_icon) {
				opts.icon = o.data_icon;
			}
			
			if (o.data_iconpos) {
				opts.iconpos = o.data_iconpos;
			}
			
			if (o.data_theme) {
				opts.theme = o.data_theme;
			}
			
			if (o.data_inline) {
				opts.inline = o.data_inline;
			}
			
			if (o.isMini) {
				opts.mini = true;
			}
			
			var t = this.content.button(opts);
			$($($($(t).parent()).find(">span")).find(">span").eq(0)).html(this.options.label);
		} else {
			this.content.button(opts);
		}
	},

	_makeResizable:function(){},
	
	_handleChange:function(key, value, oldValue){
		if(key === "label"){
			this.content.button("option","label",value);
		}else {
			$.an.widget.prototype._handleChange.apply(this, arguments);
		}
	},
	
	_design:function() {
		var o = this.options;
		if (o.mobile) {
			var dat = '<div data-corners="true" data-shadow="true" data-iconshadow="false"\
				data-wrapperels="span"  data-disabled="true" data-label="' + o.label + '"\
				aria-disabled="false">\
				<span class="ui-btn-inner">\
					<span class="ui-btn-text">' + o.label + '</span>';
			if (o.data_icon) {
				dat += '<span class="ui-icon ui-icon-arrow-d">&nbsp;</span>';
			}
				dat += '</span>\
				<div class="content ui-btn-hidden" data-disabled="false"></div>\
			</div>';
			var html = $(dat);
			
			if (o.data_icon) {
				html.addClass("ui-btn-icon-" + o.data_icon);
			}
			
			if (o.data_iconpos) {
				html.addClass('ui-btn-icon-' + o.data_iconpos);
			}
			
			if (o.data_theme) {
				html.addClass("ui-btn-up-" + o.data_theme);
			}
			
			if (o.data_inline) {
				html.addClass("ui-btn-inline");
			}
			
			if (o.isMini) {
				html.addClass('ui-mini');
			}
			
			html.addClass("ui-btn ui-shadow ui-btn-corner-all");
			this.content.html(html);
		}
	},
	
	destroy: function() {
		this.content.button("destroy").remove();
		this.element.removeClass("an-buttonwidget");
		return $.an.widget.prototype.destroy.apply(this, arguments);
	}
});
})( jQuery );
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

$.widget( "an.tabsxwidget", $.an.widget, {

	_create: function() {
		$.an.widget.prototype._create.apply(this, arguments);
		var self = this, o = this.options, el = this.element, c = this.content, ul = c.children("ul");
		el.addClass("an-tabsxwidget");
		if(ul.length <= 0) ul = $("<ul/>").appendTo(c);
		c.tabsx({
			tabTemplate: "<li><a href='#{href}' hidefocus='true'>#{label}</a></li>",
			destroyTabs: false,
			duration: o.duration,
			slideshow: o.slideshow,
			fxs: eval("(" + o.fx + ")"),
			mode: o.mode
		}).bind("contextmenu2.tabsxwidget contextmenu.tabsxwidget",function(e){
        	if((o.contextmenu2 && e.type == "contextmenu2")
        			||(!o.contextmenu2 && e.type == "contextmenu")){
        		var t = $(e.target), actions = {}, index = t.closest("li").index(), ul = t.closest("ul");
    			if(o.mode == "design"){
    				actions["add"] = {type: "menuItem",text: "Add Tab",handler: function(){self.insertTab(index);}};
    				if(ul.size() != 0){
        				actions["edit"] = {type: "menuItem",	text: "Edit Tab",	handler: function(){self.editTab(index);}};
        				actions["del"] = {type: "menuItem",text: "Delete Tab",handler: function(){self.removeTab(index);}};
    				}
    			}

        		if(!$.isEmptyObject(actions)){
        			t.menu({
        				autoShow: true,
        				menuPosition:{ of: e, my: "left top", at: "left bottom"	},
        				actions: actions,
        				select: function(e,ui){	$(this).menu("destroy");	},
        				collapseAll: function(e){	$(this).menu("destroy");	}
        			});
        		}
        		e.preventDefault();
        	}
		});
		
		this._updateContentHeight();
		
		if(o.mode == "design"){
			this._contentEditable(true);
		}
	},

	selectable:function(e){
		return e.target == this.content.children(".ui-tabs-nav")[0]||e.target==this.element[0];
	},
	
	select: function(id){
		this.content.tabsx("select",id);
	},
	
	_updateContentHeight:function(){
		var o = this.options, c = this.content, css = {}, ul = c.children("ul");
		if(o.minHeight){
			css["min-height"] = o.minHeight-ul.outerHeight(true)-16;
		}else if(o.height){
			css.height = o.height-ul.outerHeight(true)-16;
		}
		c.children(".ui-tabs-panel").css(css);
	},
	
	_doEditTab:function(index, isNew){
		var self = this, o = this.options, c = this.content, doc = {}, a, p;
		if(!isNew){
			a = c.children("ul").find("li").eq(index).children("a");
			doc.id = a.attr("href").substring(1);
			doc.label=a.html();
			p = c.find("#"+doc.id);
		}
		$("<div/>").dialog({
			title:isNew ? "Insert Tab" : "Edit Tab",
			height: 400,
			width: 500,
			modal: true,
			create: function(event, ui){
				var $this = $(this);
				$.ans.getDoc(o.dbId, "50a4f883d6c6603d0a000018", null, function(err,form){
					$this.editor({document:doc, forms:[form] ,dbId:o.dbId, ignoreEscape:true, mode:"edit"});
				});

			},
			buttons: {
				OK: function() {
					var $this = $(this), doc = $this.editor("option","document");
					if(isNew){
						c.tabsx("add","#"+doc.id, doc.label, index);
						self._updateContentHeight();
						c.children("#"+doc.id)[0].contentEditable=true;
					}else{
						a.attr("href","#"+doc.id).html(doc.label);
						p.attr("id", doc.id);
					}
					self.element.trigger("contentchange");
					$this.dialog("close");
				},
				Cancel: function(){ $( this ).dialog( "close" );}
			},
			close:function(e, ui){$(this).remove();}
		});
	},
	
	insertTab:function(index){
		if(index <0 || index >this.content.tabsx("length")) index = this.content.tabsx("length");
		this._doEditTab(index, true);
	},
	
	editTab:function(index){
		if(index >= 0 && index < this.content.tabsx("length")) this._doEditTab(index);
	},
	
	removeTab:function(index){
		this.content.tabsx("remove",index).trigger("contentchange");
	},
	
	_browser:function(){
		this.option("contextmenu2", false);
		this._contentEditable(false);
	},
	
	_edit:function(){
		this.option("contextmenu2", false);
		this._contentEditable(false);
	},
	
	_design:function(){
		this.option("contextmenu2", true);
		this._contentEditable(true);
	},
	
	_contentEditable:function(editable){
		this.content.children(".ui-tabs-panel").each(function(){
			this.contentEditable = editable;
		});
	},
	
	destroy: function() {
		this.content.children(".ui-tabs-panel").css({height:"", "min-height":""});
		this.content.tabsx("destroy");
		this.element.unbind(".tabsxwidget").removeClass("an-tabsxwidget");
		return $.an.widget.prototype.destroy.apply(this, arguments);;
	}
});
})( jQuery );
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

(function($, undefined) {

	$.widget("an.searchfield", $.an.inputfield, {
		_create : function() {
			$.an.inputfield.prototype._create.apply(this, arguments);
			this.element.addClass("an-searchfield");
		},

		_createControl : function() {
			$.an.inputfield.prototype._createControl.apply(this, arguments);
			if (this.options.mobile) {
				this.input.attr('data-type', "search");
				var el = this.element.find(".content").eq(0);
				el.removeClass("ui-input-text");
				el.addClass("ui-input-search ui-icon-search ui-icon-searchfield");
			}
		},

		_makeResizable : function() {
		},

		_browser : function() {
			$.an.inputfield.prototype._browser.apply(this, arguments);
		},

		_edit : function() {
			this.input.detach().val(this.options.value).appendTo(this.content.empty(), arguments);
			if (this.options.mobile) {
				var self = this;
				var delButton = '<a style="position: absolute;right: 20px; top: 17px;display:none;" class="ui-input-clear ui-btn ui-shadow ui-btn-corner-all ui-fullsize ui-btn-icon-notext ui-btn-up-c" href="#" data-corners="true" data-shadow="true" data-iconshadow="true" data-wrapperels="span" data-icon="delete" data-iconpos="notext" data-theme="c" data-mini="false">\
					<span class="ui-btn-inner">\
					<span class="ui-btn-text">clear text</span>\
					<span class="ui-icon ui-icon-delete ui-icon-shadow">&nbsp;</span>\
					</span></a>';
				$(delButton).bind("click", function(e) {
					self.input.val('');
					$(this).hide();
				}).appendTo(this.content);
				
				this.input.bind("keyup.inputfield", function(e) {
					$($(e.target).siblings()).show();
				}).bind("keydown.inputfield", function(e) {
					$($(e.target).siblings()).show();
				});
			}
		},

		_design : function() {
			$.an.inputfield.prototype._design.apply(this, arguments);
		},

		_handleChange : function(key, value, oldValue) {
			$.an.inputfield.prototype._handleChange.apply(this, arguments);
		},

		highlight : function(highlight) {
			(this.options.mode == "edit" ? this.input : this.element).toggleClass("an-state-hover", highlight);
		},

		destroy : function() {
			this.input && this.input.unbind(".inputfield").remove();
			this.element.removeClass("an-inputfield");
			return $.an.field.prototype.destroy.apply(this, arguments);
		} });
})(jQuery);
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

$.widget( "an.tree", {
	options: {
		draggable: true,
		droppable: true,
		labelProvider:{
			getText: function(node){ return node.text; },
			getClass: function(node){ return node["class"];}
		}
	},

	_create: function() {
		var self = this, el = this.element, o = this.options;
		el.addClass("an-tree").empty();
		o.contentProvider = o.contentProvider || this._defaultContentProvider();
		this._loadChildren(el);
		el.delegate(".hitarea","click.tree",function(){
			var li = $(this).parent();
			self['_do'+(li.is(".expandable") ? "Expand" : "Collapse")](li);
		}).delegate("li>span","hover.tree",function(e){
			$(this).toggleClass("ui-state-hover");
			self._trigger("nodehover",e,$(this).closest("li").data("node"));
		}).delegate("li>span","click.tree contextmenu.tree",function(e){
			el.find("li>span.selected").removeClass("selected");
			$(this).addClass("selected");
			if(e.type=="click"){
				self._trigger("nodeclick",e,$(this).closest("li").data("node"));
			}else if(e.type=="contextmenu"){
				self._trigger("contextmenu",e,$(this).closest("li").data("node"));
			}
		}).delegate("li>span","dblclick.tree",function(e){
			self._trigger("nodedblclick",e,$(this).closest("li").data("node"));
		});
	},

	_defaultContentProvider: function(){
		return {
			getRoots: function(){ return []; },
			getChildren: function(parentNode){ return []; },
			hasChildren: function(node){ return false; },
			getId: function(node){ return node.id ? node.id: null;}
		};;
	},
	
	refresh: function(nodeId){
		var self = this;
		if(nodeId){
			var li = this.element.find("#"+nodeId);
			if(li.length){
				var o = this.options, lp = o.labelProvider, cp = o.contentProvider, 
				    id = li.attr("id"), parent = li.parent().closest("li");
				function mountNodes(nodes){
					var hit = null;
					for(var i in nodes){ if(id == nodes[i].id){ hit = i; break; } }
					if(hit!=null){
						li.data("node",nodes[hit]).addClass(lp.getClass(nodes[hit])).children("span")
						    .html(lp.getText(nodes[hit]));
						if(li.is(".expandable")){
							li.addClass("stale");
						}else if(li.is(".collapsable")){
							self._loadChildren(li);
						}
					}else{
						li.remove();
					}
				}

				if(parent.length){
					cp.getChildren(parent.data("node"),mountNodes);
				}else{
					cp.getRoots(mountNodes);
				}
			}
		}else{
			this._loadChildren(this.element);
		}
	},

	add:function(nodeId, node){
		this._addNode(this.element.find("#"+nodeId).children("ul"), node);	
	},
	
	"delete":function(nodeId){
		var li = this.element.find("#"+nodeId);
		if(li.is(".last")) li.prev().addClass("last");
		li.remove();
	},
	
	expand:function(nodeId){
		var li = this.element.find("#"+nodeId);
		if(li.length > 0) this._doExpand(li);
	},
	
	collapse:function(nodeId){
		var li = this.element.find("#"+nodeId);
		if(li.length >= 0) this._doCollapse(li);
	},

	_doExpand:function(li){
		if(li.is(".expandable.stale")) {
			this._loadChildren(li);
		}else if(li.is(".expandable")){
			li.children("ul").show();
			li.removeClass("expandable").addClass("collapsable");
		}
	},
	
	_doCollapse:function(li){
		if(li.is(".collapsable")){
			li.children("ul").hide();
			li.removeClass("collapsable").addClass("expandable");
		}
	},
	
	_addNode:function(parent, node){
		var self = this, o = this.options, lp = o.labelProvider, cp = o.contentProvider, 
		    id=cp.getId(node), text = lp.getText(node), li = $("<li/>").addClass(lp.getClass(node)).attr("id",id);
		if(o.checkbox){
			$("<input type='checkbox'/>").prop("checked", $.inArray(id,o.checkedNodes) !=-1).appendTo(li);
		}
		$("<span/>").addClass(lp.getClass(node)).html(text).appendTo(li);
		if(cp.hasChildren(node)){
			li.addClass("expandable stale").prepend("<div class='hitarea'/>");
			var droppable = $.type(o.droppable) == "function" ? o.droppable(node) : o.droppable;
			if(droppable){
				li.children("span").droppable({ greedy: true, hoverClass:"ui-state-hover", drop:function(event, ui ){
					self._trigger("drop",null, {source: ui.draggable.data("node"), target:node});
				}});
			}
		}
		parent.children("li.last").removeClass("last");
		li.data("node",node).addClass("last").appendTo(parent);
		
		var draggable = $.type(o.draggable) == "function" ? o.draggable(node) : o.draggable;
		if(draggable){
			li.draggable({ appendTo: "body", helper: "clone" , scroll:true, distance: 20, scrollSensitivity:100, zIndex:9999});
		}
	},
	
	_loadChildren: function(parent){
		var self = this, o = this.options, ul = parent.children("ul"), cp = o.contentProvider||this._defaultContentProvider();
		if(ul.length == 0) ul = $("<ul/>").appendTo(parent);
		
		var ids = [];
		ul.find(".collapsable").each(function(){
			ids.push($(this).attr("id"));
		});
		ul.empty();
		
		var hitarea = parent.children(".hitarea").addClass("loading");
		function mountNodes(nodes){
			$.each(nodes,function(k,v){
				self._addNode(ul,v);
			});
			
			parent.removeClass("expandable stale").addClass("collapsable");
			for(var i in ids) self.expand(ids[i]);
			hitarea.removeClass("loading");
		}
		
		if(parent[0] == this.element[0]){
			cp.getRoots(mountNodes);
		}else{
			cp.getChildren(parent.data("node"),mountNodes);
		}
	},
	
	option: function(key, value) {
		if(key == "checkedNodes" && value === undefined){
			var nodes = [];
			$("input:checked", this.element).each(function(){
				nodes.push($(this).closest("li").data("node"));
			});
			return nodes;
		}else if(key === "roots" && value === undefined){
			var roots = [];
			this.element.children("ul").children("li").each(function(){
				roots.push($(this).attr("id"));
			});
			return roots;
		}else if(key === "selectedNodes" && value === undefined){
			var nodes = [];
			this.element.find(".selected").each(function(){
				nodes.push($(this).closest("li").attr("id"));
			});
			return nodes;
		}
		
		return $.Widget.prototype.option.apply(this, arguments);
	},
	
	_setOption: function( key, value ) {
		$.Widget.prototype._setOption.apply(this, arguments );
		var self = this, el = this.element;
		if ( key === "contentProvider" ) {
			this._loadChildren(this.element);
		}else if(key === "checkedNodes"){
			$.each(value,function(k,v){
				$("#"+v + " input",self.element).prop("checked",true);
			});
		}else if(key === "selectedNodes"){
			$.each(value,function(k,v){
				el.find("li>span.selected").removeClass("selected");
				el.find("li#"+v+">span").addClass("selected");
			});
		}
		return this; 
	},
	
	destroy: function() {
		this.element.undelegate(".hitarea",".tree").undelegate("li>span",".tree").removeClass( "an-tree" );
		$.Widget.prototype.destroy.apply(this, arguments);
	}
});
})( jQuery );
/**
 * Cookie plugin
 *
 * Copyright (c) 2006 Klaus Hartl (stilbuero.de)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 */

/**
 * Create a cookie with the given name and value and other optional parameters.
 *
 * @example $.cookie('the_cookie', 'the_value');
 * @desc Set the value of a cookie.
 * @example $.cookie('the_cookie', 'the_value', { expires: 7, path: '/', domain: 'jquery.com', secure: true });
 * @desc Create a cookie with all available options.
 * @example $.cookie('the_cookie', 'the_value');
 * @desc Create a session cookie.
 * @example $.cookie('the_cookie', null);
 * @desc Delete a cookie by passing null as value. Keep in mind that you have to use the same path and domain
 *       used when the cookie was set.
 *
 * @param String name The name of the cookie.
 * @param String value The value of the cookie.
 * @param Object options An object literal containing key/value pairs to provide optional cookie attributes.
 * @option Number|Date expires Either an integer specifying the expiration date from now on in days or a Date object.
 *                             If a negative value is specified (e.g. a date in the past), the cookie will be deleted.
 *                             If set to null or omitted, the cookie will be a session cookie and will not be retained
 *                             when the the browser exits.
 * @option String path The value of the path atribute of the cookie (default: path of page that created the cookie).
 * @option String domain The value of the domain attribute of the cookie (default: domain of page that created the cookie).
 * @option Boolean secure If true, the secure attribute of the cookie will be set and the cookie transmission will
 *                        require a secure protocol (like HTTPS).
 * @type undefined
 *
 * @name $.cookie
 * @cat Plugins/Cookie
 * @author Klaus Hartl/klaus.hartl@stilbuero.de
 */

/**
 * Get the value of a cookie with the given name.
 *
 * @example $.cookie('the_cookie');
 * @desc Get the value of a cookie.
 *
 * @param String name The name of the cookie.
 * @return The value of the cookie.
 * @type String
 *
 * @name $.cookie
 * @cat Plugins/Cookie
 * @author Klaus Hartl/klaus.hartl@stilbuero.de
 */
jQuery.cookie = function(name, value, options) {
    if (typeof value != 'undefined') { // name and value given, set cookie
        options = options || {};
        if (value === null) {
            value = '';
            options.expires = -1;
        }
        var expires = '';
        if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
            var date;
            if (typeof options.expires == 'number') {
                date = new Date();
                date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
            } else {
                date = options.expires;
            }
            expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
        }
        // CAUTION: Needed to parenthesize options.path and options.domain
        // in the following expressions, otherwise they evaluate to undefined
        // in the packed version for some reason...
        var path = options.path ? '; path=' + (options.path) : '';
        var domain = options.domain ? '; domain=' + (options.domain) : '';
        var secure = options.secure ? '; secure' : '';
        document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
    } else { // only name given, get cookie
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
};/*
 * jQuery Hotkeys Plugin
 * Copyright 2010, John Resig
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Based upon the plugin by Tzury Bar Yochay:
 * http://github.com/tzuryby/hotkeys
 *
 * Original idea by:
 * Binny V A, http://www.openjs.com/scripts/events/keyboard_shortcuts/
*/

(function(jQuery){
	
	jQuery.hotkeys = {
		version: "0.8",

		specialKeys: {
			8: "backspace", 9: "tab", 13: "return", 16: "shift", 17: "ctrl", 18: "alt", 19: "pause",
			20: "capslock", 27: "esc", 32: "space", 33: "pageup", 34: "pagedown", 35: "end", 36: "home",
			37: "left", 38: "up", 39: "right", 40: "down", 45: "insert", 46: "del", 
			96: "0", 97: "1", 98: "2", 99: "3", 100: "4", 101: "5", 102: "6", 103: "7",
			104: "8", 105: "9", 106: "*", 107: "+", 109: "-", 110: ".", 111 : "/", 
			112: "f1", 113: "f2", 114: "f3", 115: "f4", 116: "f5", 117: "f6", 118: "f7", 119: "f8", 
			120: "f9", 121: "f10", 122: "f11", 123: "f12", 144: "numlock", 145: "scroll", 191: "/", 224: "meta"
		},
	
		shiftNums: {
			"`": "~", "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&", 
			"8": "*", "9": "(", "0": ")", "-": "_", "=": "+", ";": ": ", "'": "\"", ",": "<", 
			".": ">",  "/": "?",  "\\": "|"
		}
	};

	function keyHandler( handleObj ) {
		// Only care when a possible input has been specified
		if ( typeof handleObj.data !== "string" ) {
			return;
		}
		
		var origHandler = handleObj.handler,
			keys = handleObj.data.toLowerCase().split(" ");
	
		handleObj.handler = function( event ) {
			// Don't fire in text-accepting inputs that we didn't directly bind to
			if ( this !== event.target && (/textarea|select/i.test( event.target.nodeName ) ||
				 event.target.type === "text") ) {
				return;
			}
			
			// Keypress represents characters, not special keys
			var special = event.type !== "keypress" && jQuery.hotkeys.specialKeys[ event.which ],
				character = String.fromCharCode( event.which ).toLowerCase(),
				key, modif = "", possible = {};

			// check combinations (alt|ctrl|shift+anything)
			if ( event.altKey && special !== "alt" ) {
				modif += "alt+";
			}

			if ( event.ctrlKey && special !== "ctrl" ) {
				modif += "ctrl+";
			}
			
			// TODO: Need to make sure this works consistently across platforms
			if ( event.metaKey && !event.ctrlKey && special !== "meta" ) {
				modif += "meta+";
			}

			if ( event.shiftKey && special !== "shift" ) {
				modif += "shift+";
			}

			if ( special ) {
				possible[ modif + special ] = true;

			} else {
				possible[ modif + character ] = true;
				possible[ modif + jQuery.hotkeys.shiftNums[ character ] ] = true;

				// "$" can be triggered as "Shift+4" or "Shift+$" or just "$"
				if ( modif === "shift+" ) {
					possible[ jQuery.hotkeys.shiftNums[ character ] ] = true;
				}
			}

			for ( var i = 0, l = keys.length; i < l; i++ ) {
				if ( possible[ keys[i] ] ) {
					return origHandler.apply( this, arguments );
				}
			}
		};
	}

	jQuery.each([ "keydown", "keyup", "keypress" ], function() {
		jQuery.event.special[ this ] = { add: keyHandler };
	});

})( jQuery );/*!
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

var idIncrement = 0;

$.widget( "an.menu", {
	defaultElement: "<ul>",
	delay: 100,
	options: {
		submenuPosition: { my: "left top", at: "right top"},
		triggerEvent:"contextmenu",
		menuPosition:{ my: "left top", at: "left bottom"}
	},
	_create: function() {
		var o = this.options;
		this.element.addClass("an-menu");
		this.activeMenu = this.menu = this._createMenuContent(o.actions);
		this.menu.appendTo("body").hide();
		this.menuId = this.menu.attr( "id" ) || "ui-menu-" + idIncrement++;
		if(this.menu.find(".ui-icon").length) {
			this.menu.addClass( "ui-menu-icons" );
		}
		
		this.bindings = $();
		this.menu.addClass("ui-menu ui-widget ui-widget-content ui-corner-all")
			.attr({	id: this.menuId, role: "menu"})
			.css({"z-index":"999999"})
			// need to catch all clicks on disabled menu
			// not possible through _bind
			.bind( "click.menu", $.proxy( function( event ) {
				if ( o.disabled ) {event.preventDefault();}
			}, this));
		this._bind({
			"click .ui-menu-item:has(a)": function( event ) {
				var target = $( event.currentTarget );
				// it's possible to click an item without hovering it (#7085)
				if ( !this.active || ( this.active[ 0 ] !== target[ 0 ] ) ) {
					this.focus( event, target );
				}
				this.select( event );
				event.preventDefault();
			},
			"mouseover .ui-menu-item:not(.seperator)": function( event ) {
				event.stopImmediatePropagation();
				var target = $( event.currentTarget );
				// Remove ui-state-active class from siblings of the newly focused menu item to avoid a jump caused by adjacent elements both having a class with a border
				target.siblings().children( ".ui-state-active" ).removeClass( "ui-state-active" );
				this.focus( event, target );
			},
			"mouseleave": "_mouseleave",
			"mouseleave .ui-menu": "_mouseleave",
			"mouseout .ui-menu-item": "blur",
			"focus": function( event ) {
				this.focus( event, $( event.target ).children( ".ui-menu-item:first" ) );
			},
			"blur": "collapseAll"
		});

		this.refresh();

		this.menu.attr( "tabIndex", 0 );
		this._bind({
			"keydown": function( event ) {
				switch ( event.keyCode ) {
				case $.ui.keyCode.PAGE_UP:
					this.previousPage( event );
					event.preventDefault();
					event.stopImmediatePropagation();
					break;
				case $.ui.keyCode.PAGE_DOWN:
					this.nextPage( event );
					event.preventDefault();
					event.stopImmediatePropagation();
					break;
				case $.ui.keyCode.HOME:
					this._move( "first", "first", event );
					event.preventDefault();
					event.stopImmediatePropagation();
					break;
				case $.ui.keyCode.END:
					this._move( "last", "last", event );
					event.preventDefault();
					event.stopImmediatePropagation();
					break;
				case $.ui.keyCode.UP:
					this.previous( event );
					event.preventDefault();
					event.stopImmediatePropagation();
					break;
				case $.ui.keyCode.DOWN:
					this.next( event );
					event.preventDefault();
					event.stopImmediatePropagation();
					break;
				case $.ui.keyCode.LEFT:
					if (this.collapse( event )) {
						event.stopImmediatePropagation();
					}
					event.preventDefault();
					break;
				case $.ui.keyCode.RIGHT:
					if (this.expand( event )) {
						event.stopImmediatePropagation();
					}
					event.preventDefault();
					break;
				case $.ui.keyCode.ENTER:
					if ( this.active.children( "a[aria-haspopup='true']" ).length ) {
						if ( this.expand( event ) ) {
							event.stopImmediatePropagation();
						}
					}
					else {
						this.select( event );
						event.stopImmediatePropagation();
					}
					event.preventDefault();
					break;
				case $.ui.keyCode.ESCAPE:
					if ( this.collapse( event ) ) {
						event.stopImmediatePropagation();
					}
					event.preventDefault();
					break;
				default:
					event.stopPropagation();
					clearTimeout( this.filterTimer );
					var match,
						prev = this.previousFilter || "",
						character = String.fromCharCode( event.keyCode ),
						skip = false;

					if (character == prev) {
						skip = true;
					} else {
						character = prev + character;
					}
					function escape( value ) {
						return value.replace( /[-[\]{}()*+?.,\\^$|#\s]/g , "\\$&" );
					}
					match = this.activeMenu.children( ".ui-menu-item" ).filter( function() {
						return new RegExp("^" + escape(character), "i")
							.test( $( this ).children( "a" ).text() );
					});
					match = skip && match.index(this.active.next()) != -1 ? this.active.nextAll(".ui-menu-item") : match;
					if ( !match.length ) {
						character = String.fromCharCode(event.keyCode);
						match = this.activeMenu.children(".ui-menu-item").filter( function() {
							return new RegExp("^" + escape(character), "i")
								.test( $( this ).children( "a" ).text() );
						});
					}
					if ( match.length ) {
						this.focus( event, match );
						if (match.length > 1) {
							this.previousFilter = character;
							this.filterTimer = this._delay( function() {
								delete this.previousFilter;
							}, 1000 );
						} else {
							delete this.previousFilter;
						}
					} else {
						delete this.previousFilter;
					}
				}
			}
		});

		if(o.triggerEvent ){
			this.element.unbind(o.triggerEvent+".menu");
			this.element.bind(o.triggerEvent+".menu", $.proxy(function(event){
				var position = $.extend({}, {
					of: event,
					offset:"0 0"
				}, $.type(this.options.menuPosition) == "function"
					? this.options.menuPosition(this.active)
					: this.options.menuPosition
				);
				
				var prev = $(document).data("contextmenu");
				if(prev) prev.collapseAll();
				$(document).data("contextmenu",this);
				this.menu.show().position(position);
				
				if(this.options.triggerEvent == "contextmenu"){
					event.preventDefault();
				}
			},this));
		}
		
		this.proxy = $.proxy(function(event){
			var $t = $( event.target );
			if ($t.closest(".ui-menu" ).length || $t.closest(".an-menu").get(0) == this.element.get(0)) 
				return;
			this.collapseAll( event );
		},this); 
		$(document).bind("click.menu",this.proxy);
		
		if(o.autoShow){
			this.menu.position(
					$.type(this.options.menuPosition) == "function"
						? this.options.menuPosition(this.active)
						: this.options.menuPosition).show();
		}
	},

	_createMenuContent: function(actions){
		var self = this, menu = $("<ul/>");
		$.each(actions, function(k,v){
			switch(v.type){
			case "submenu":{
				var sm = self._createMenuContent(v.children);
				$("<li/>").append($("<a href='#'/>").text(v.text))
				          .append(sm).appendTo(menu);
			}
				break;
			case "menuItem":
				$("<a/>").attr("href","#"+k).text(v.text).click(function(e){
					v.handler(arguments);
					e.preventDefault();
				}).wrap("<li/>").parent().appendTo(menu);
				break;
			case "seperator":
				$("<li class='seperator'/>").append($("<a href='#'/>")).appendTo(menu);
				break;
			case "checkbox":{
				var input = $("<input/>").attr("type","checkbox").attr("name",v.name).prop("checked",v.checked);
				$("<a/>").attr("href","#"+k).text(v.text).click(function(e){
					var target = $(e.target), checked = false;
					if(target.is("a")){
						var input = target.find("input");
						checked = !input.prop("checked");
						input.prop("checked",checked);
					}else if(target.is("input")){
						checked = target.prop("checked");
					}
					v.handler(e,checked);
					e.stopImmediatePropagation();
				}).prepend(input).wrap("<li/>").parent().appendTo(menu);
			}
				break;
			}
		});
		return menu;
	},
	
	refresh: function() {
		// initialize nested menus
		var submenus = this.menu.find( "ul:not(.ui-menu)" )
			.addClass( "ui-menu ui-widget ui-widget-content ui-corner-all" )
			.attr( "role", "menu" )
			.hide()
			.attr( "aria-hidden", "true" )
			.attr( "aria-expanded", "false" );

		// don't refresh list items that are already adapted
		var menuId = this.menuId;
		submenus.add( this.menu ).children( "li:not(.ui-menu-item):has(a)" )
			.addClass( "ui-menu-item" )
			.attr( "role", "presentation" )
			.children( "a" )
				.addClass( "ui-corner-all" )
				.attr( "tabIndex", -1 )
				.attr( "role", "menuitem" )
				.attr( "id", function( i ) {
					return menuId + "-" + i;
				});
		submenus.each( function() {
			var menu = $( this ), item = menu.prev( "a" );
			item.attr( "aria-haspopup", "true" )
				.prepend( '<span class="ui-menu-icon ui-icon ui-icon-carat-1-e"></span>' );
			menu.attr( "aria-labelledby", item.attr( "id" ) );
		});
	},

	focus: function( event, item ) {
		this.blur( event );
		if ( this._hasScroll() ) {
			var borderTop = parseFloat( $.curCSS( this.activeMenu[0], "borderTopWidth", true ) ) || 0,
				paddingTop = parseFloat( $.curCSS( this.activeMenu[0], "paddingTop", true ) ) || 0,
				offset = item.offset().top - this.activeMenu.offset().top - borderTop - paddingTop,
				scroll = this.activeMenu.scrollTop(),
				elementHeight = this.activeMenu.height(),
				itemHeight = item.height();

			if ( offset < 0 ) {
				this.activeMenu.scrollTop( scroll + offset );
			} else if ( offset + itemHeight > elementHeight ) {
				this.activeMenu.scrollTop( scroll + offset - elementHeight + itemHeight );
			}
		}

		this.active = item.first()
			.children( "a" )
				.addClass( "ui-state-focus" )
			.end();
		this.menu.attr( "aria-activedescendant", this.active.children("a").attr("id") );

		// highlight active parent menu item, if any
		this.active.parent().closest(".ui-menu-item").children("a:first").addClass("ui-state-active");

		this.timer = this._delay( function() {
			this._close();
		}, this.delay );

		var nested = $( ">ul", item );
		if ( nested.length && ( /^mouse/.test( event.type ) ) ) {
			this._startOpening(nested);
		}
		this.activeMenu = item.parent();

		this._trigger( "focus", event, { item: item } );
	},

	blur: function( event ) {
		if ( !this.active ) {
			return;
		}

		clearTimeout( this.timer );

		this.active.children( "a" ).removeClass( "ui-state-focus" );
		this.active = null;

		this._trigger( "blur", event, { item: this.active } );
	},

	_startOpening: function( submenu ) {
		clearTimeout( this.timer );

		// Don't open if already open fixes a Firefox bug that caused a .5 pixel
		// shift in the submenu position when mousing over the carat icon
		if ( submenu.attr( "aria-hidden" ) !== "true" ) {
			return;
		}

		this.timer = this._delay( function() {
			this._close();
			this._open( submenu );
		}, this.delay );
	},

	_open: function(submenu) {
		clearTimeout(this.timer);
		this.menu
			.find(".ui-menu")
			.not(submenu.parents())
			.hide()
			.attr("aria-hidden", "true");

		var position = $.extend({}, {
				of: this.active
			}, $.type(this.options.submenuPosition) == "function"
				? this.options.submenuPosition(this.active)
				: this.options.submenuPosition
			);

		submenu.show()
			.removeAttr("aria-hidden")
			.attr("aria-expanded", "true")
			.position( position );
	},
	
	collapseAll: function( event ) {
		var currentMenu = false;
		if ( event ) {
			var target = $( event.target );
			if ( target.is( ".ui-menu" ) ) {
				currentMenu = target;
			} else if ( target.closest( ".ui-menu" ).length ) {
				currentMenu = target.closest( ".ui-menu" );
			}
		}
		this._close( currentMenu );
		this.blur( event );
		this.activeMenu = this.menu;
		this._trigger("collapseAll");
	},

	_close: function( startMenu ) {
		if( !startMenu ) {
			startMenu = this.active ? this.active.parent() : this.menu;
		}

		startMenu
			.find( "ul" )
				.hide()
				.attr( "aria-hidden", "true" )
				.attr( "aria-expanded", "false" )
			.end()
			.find( "a.ui-state-active" )
			.removeClass( "ui-state-active" );
		
		if(startMenu == this.menu){
			startMenu.hide()
			    .attr( "aria-hidden", "true" )
			    .attr( "aria-expanded", "false" );
		}
	},

	collapse: function( event ) {
		var newItem = this.active && this.active.parents("li:not(.ui-menubar-item)").first();
		if ( newItem && newItem.length ) {
			this._close();
			this.focus( event, newItem );
			return true;
		}
	},

	expand: function( event ) {
		var newItem = this.active && this.active.children("ul").children("li").first();

		if ( newItem && newItem.length ) {
			this._open( newItem.parent() );

			//timeout so Firefox will not hide activedescendant change in expanding submenu from AT
			this._delay( function() {
				this.focus( event, newItem );
			}, 20 );
			return true;
		}
	},

	next: function(event) {
		this._move( "next", "first", event );
	},

	previous: function(event) {
		this._move( "prev", "last", event );
	},

	first: function() {
		return this.active && !this.active.prevAll( ".ui-menu-item" ).length;
	},

	last: function() {
		return this.active && !this.active.nextAll( ".ui-menu-item" ).length;
	},

	_move: function( direction, filter, event ) {
		if ( !this.active ) {
			this.focus( event, this.activeMenu.children( ".ui-menu-item" )[ filter ]() );
			return;
		}

		var next;
		if ( direction === "first" || direction === "last" ) {
			next = this.active[ direction === "first" ? "prevAll" : "nextAll" ]( ".ui-menu-item" ).eq( -1 );
		} else {
			next = this.active[ direction + "All" ]( ".ui-menu-item" ).eq( 0 );
		}

		if ( next.length ) {
			this.focus( event, next );
		} else {
			this.focus( event, this.activeMenu.children( ".ui-menu-item" )[ filter ]() );
		}
	},

	nextPage: function( event ) {
		if ( this._hasScroll() ) {
			if ( !this.active ) {
				this.focus( event, this.activeMenu.children( ".ui-menu-item" ).first() );
				return;
			}
			if ( this.last() ) {
				return;
			}

			var base = this.active.offset().top,
				height = this.menu.height(),
				result;
			this.active.nextAll( ".ui-menu-item" ).each( function() {
				result = $( this );
				return $( this ).offset().top - base - height < 0;
			});

			this.focus( event, result );
		} else {
			this.focus( event, this.activeMenu.children( ".ui-menu-item" )
				[ !this.active ? "first" : "last" ]() );
		}
	},

	previousPage: function( event ) {
		if ( this._hasScroll() ) {
			if ( !this.active ) {
				this.focus( event, this.activeMenu.children( ".ui-menu-item" ).first() );
				return;
			}
			if ( this.first() ) {
				return;
			}

			var base = this.active.offset().top,
				height = this.menu.height(),
				result;
			this.active.prevAll( ".ui-menu-item" ).each( function() {
				result = $( this );
				return $(this).offset().top - base + height > 0;
			});

			this.focus( event, result );
		} else {
			this.focus( event, this.activeMenu.children( ".ui-menu-item" ).first() );
		}
	},

	_hasScroll: function() {
		return this.menu.height() < this.menu.prop( "scrollHeight" );
	},

	_mouseleave: function( event ) {
		this.collapseAll( event );
		this.blur();
	},

	select: function( event ) {
		// save active reference before collapseAll triggers blur
		var ui = {
			item: this.active
		};
		this.collapseAll( event );
		this._trigger( "select", event, ui );
	},
	
	_bind: function( element, handlers ) {
		// no element argument, shuffle and use this.menu
		if ( !handlers ) {
			handlers = element;
			element = this.menu;
		} else {
			// accept selectors, DOM elements
			element = $( element );
			this.bindings = this.bindings.add(element);
		}

		var instance = this;
		$.each( handlers, function( event, handler ) {
			function handlerProxy() {
				// allow widgets to customize the disabled handling
				// - disabled as an array instead of boolean
				// - disabled class as method for disabling individual parts
				if ( instance.options.disabled === true ||
						$( this ).hasClass( "ui-state-disabled" ) ) {
					return;
				}
				return ( typeof handler === "string" ? instance[ handler ] : handler )
					.apply( instance, arguments );
			}
			var match = event.match( /^(\w+)\s*(.*)$/ ),
				eventName = match[1] + "." + instance.widgetName,
				selector = match[2];
			if ( selector ) {
				instance.menu.delegate( selector, eventName, handlerProxy );
			} else {
				element.bind( eventName, handlerProxy );
			}
		});
	},
	
	_delay: function( handler, delay ) {
		function handlerProxy() {
			return ( typeof handler === "string" ? instance[ handler ] : handler )
				.apply( instance, arguments );
		}
		var instance = this;
		return setTimeout( handlerProxy, delay || 0 );
	},
	
	destroy: function() {
		//destroy (sub)menus
		$(document).unbind(".menu",this.proxy);
		this.menu
			.removeAttr( "aria-activedescendant" )
			.find( "ul" )
			.andSelf()
			.removeClass( "ui-menu ui-widget ui-widget-content ui-corner-all" )
			.removeAttr( "role" )
			.removeAttr( "tabIndex" )
			.removeAttr( "aria-labelledby" )
			.removeAttr( "aria-expanded" )
			.removeAttr( "aria-hidden" )
			.show();

		//destroy menu items
		this.menu.find( ".ui-menu-item" )
			.unbind( ".menu" )
			.removeClass( "ui-menu-item" )
			.removeAttr( "role" )
			.children( "a" )
			.removeClass( "ui-corner-all ui-state-hover" )
			.removeAttr( "tabIndex" )
			.removeAttr( "role" )
			.removeAttr( "aria-haspopup" )
			.removeAttr( "id" )
			.children( ".ui-icon" )
			.remove();
		this.bindings.unbind("." + this.widgetName);
		this.menu.remove();
		this.element.unbind("." + this.widgetName).removeClass("an-menu");;
		$.Widget.prototype.destroy.apply( this, arguments );
	}
});
}( jQuery ));
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

$.widget( "an.border", {
	options: {
		center:{
			minWidth: 200,
			minHeight: 20
		}
	},

	_create: function() {
		this.element.addClass("an-border");
		this._calculateDimension();
		this._makeResizable();
		this._proxy = $.proxy(function(e){
			if(e.target===window){
				this._calculateDimension();
			}
		},this);
		$(window).bind("resize.border",this._proxy);
	},

	_setOption: function( key, value ) {
		var oldValue = $.extend({},this.options[key]);
//		$.Widget.prototype._setOption.apply( this, arguments );
		switch(key){
		case "east":
		case "south":
		case "west":
		case "north":
		case "center":{
			$.extend(true,this.options[key],value);
			if(value.width!=oldValue.width || value.height!=oldValue.height){
				this._calculateDimension(key);
			}
			if(value.hasOwnProperty("resizable")){
				this._makeResizable();
			}
		}
			break;
		default:
			break;
		}
		this._trigger("optionchanged",null,{key:key, value:this.options[key], oldValue:oldValue});
	},

	_calculateDimension: function(hint) {
		var self = this, o = this.options, center = null;
		if(o.center.selector && o.center.selector != ""){
			center = self.element.children(o.center.selector);
		}
		if(!center || center.length == 0){
			center = $("<div/>").appendTo(self.element);
		}
		
		self.centerElement = center;
		
		// Dimension for east,south,west,north and center.
		var dim = {
				pbmWidth : 0,
				pbmHeight : 0,
				minWidth : 0,
				minHeight : 0,
				totalMinWidth : 0,
				totalMinHeight : 0				
		}, 
		nd = $.extend({ height: 0, totalHeight: 0 },dim), 
		sd = $.extend({},nd),
		wd = $.extend({ width: 0, totalWidth: 0 },dim),
		ed = $.extend({},wd),
        cd = {};
		
		// sum of width of padding-left,padding-right,border-left,
		// border-right,margin-left,margin-right.
		cd.pbmWidth = (center.outerWidth(true) - center.width());

		// sum of height of padding-top,padding-bottom,border-top,
		// border-bottom,margin-top,margin-bottom.
		cd.pbmHeight = (center.outerHeight(true) - center.height()); 
		
		cd.minWidth = parseFloat(o.center.minWidth);
		cd.minHeight = parseFloat(o.center.minHeight);
		cd.totalMinWidth = cd.minWidth + cd.pbmWidth;
		cd.totalMinHeight = cd.minHeight + cd.pbmHeight;

		$.each({"north":nd,"south":sd},function(k,v){
			var node = null;
			if(o[k]){
				if(o[k].selector && o[k].selector!=""){
					node = self.element.children(o[k].selector);
				}
				if(!node || node.length == 0){
					node = $("<div/>").appendTo(self.element);
				}
				v.height = parseFloat(o[k].height||v.minHeight||0);
				v.pbmWidth = node.outerWidth(true)-node.width();
				v.pbmHeight = node.outerHeight(true)-node.height();
				v.totalHeight = v.height + v.pbmHeight;
				v.minWidth = parseFloat(o[k].minWidth);
				v.minHeight = parseFloat(o[k].minHeight);
				v.totalMinWidth = v.minWidth + v.pbmWidth;
				v.totalMinHeight = v.minHeight+ v.pbmHeight;
				self[k+"Element"] = node;
			}
		});
		$.each({"west":wd,"east":ed},function(k,v){
			var node = null;
			if(o[k]){
				if(o[k].selector && o[k].selector!=""){
					node = self.element.children(o[k].selector);
				}
				if(!node || node.length == 0){
					node = $("<div/>").appendTo(self.element);
				}
				v.width = parseFloat(o[k].width||v.minWidth||0);
				v.pbmWidth = node.outerWidth(true)-node.width();
				v.pbmHeight = node.outerHeight(true)-node.height();
				v.totalWidth = v.width + v.pbmWidth;
				v.minWidth = parseFloat(o[k].minWidth);
				v.minHeight = parseFloat(o[k].minHeight);
				v.totalMinWidth = v.minWidth + v.pbmWidth;
				v.totalMinHeight = v.minHeight+ v.pbmHeight;
				self[k+"Element"] = node;
			}
		});
		
		var cw = self.element.width(), ch = self.element.height();
		if((nd.totalHeight + sd.totalHeight + cd.totalMinHeight > ch)
				&& (nd.totalMinHeight + sd.totalMinHeight + cd.totalMinHeight < ch)){
			var diff =  nd.totalHeight + sd.totalHeight + cd.totalMinHeight - ch;
			if(!hint){
				sd.height = sd.height - Math.ceil(diff/2);
				nd.height = nd.height - Math.floor(diff/2);
				if(sd.height < sd.minHeight){
					nd.height = nd.height - (sd.minHeight-sd.height);
					sd.height = sd.minHeight;
				}
				if(nd.height < nd.minHeight){
					sd.height = sd.height - (nd.minHeight-nd.height);
					nd.height = nd.minHeight;
				}
				sd.totalHeight = sd.height + sd.pbmHeight;
				nd.totalHeight = nd.height + nd.pbmHeight;
			}else if(hint == "north"){
				sd.height = sd.height - diff;
				if(sd.height < sd.minHeight){
					nd.height = nd.height - (sd.minHeight-sd.height);
					sd.height = sd.minHeight;
					nd.totalHeight = nd.height + nd.pbmHeight;
				}
				sd.totalHeight = sd.height + sd.pbmHeight;
			}else if(hint == "south"){
				nd.height = nd.height - diff;
				if(nd.height < nd.minHeight){
					sd.height = sd.height - (nd.minHeight-nd.height);
					nd.height = nd.minHeight;
					sd.totalHeight = sd.height + sd.pbmHeight;
				}
				nd.totalHeight = nd.height + nd.pbmHeight;
			}
		} else if(nd.totalMinHeight + sd.totalMinHeight + cd.totalMinHeight >= ch){
			nd.height = nd.minHeight;
			sd.height = sd.minHeight;
			nd.totalHeight = nd.height + nd.pbmHeight;
			sd.totalHeight = sd.height + sd.pbmHeight;
			ch = nd.totalMinHeight + sd.totalMinHeight + cd.totalMinHeight;
		}

		if((wd.totalWidth + ed.totalWidth + cd.totalMinWidth > cw)
				&& (wd.totalMinWidth + ed.totalMinWidth + cd.totalMinWidth < cw)){
			var diff =  wd.totalWidth + ed.totalWidth + cd.totalMinWidth - cw;
			if(!hint){
				ed.width = ed.width - Math.ceil(diff/2);
				wd.width = wd.width - Math.floor(diff/2);
				if(ed.width < ed.minWidth){
					wd.width = wd.width - (ed.minWidth-ed.width);
					ed.width = ed.minWidth;
				}
				if(wd.width < wd.minWidth){
					ed.width = ed.width - (wd.minWidth-wd.width);
					wd.width = wd.minWidth;
				}
				ed.totalWidth = ed.width + ed.pbmWidth;
				wd.totalWidth = wd.width + wd.pbmWidth;
			}else if(hint == "west"){
				ed.width = ed.width - diff;
				if(ed.width < ed.minWidth){
					wd.width = wd.width - (ed.minWidth-ed.width);
					ed.width = ed.minWidth;
					wd.totalWidth = wd.width + wd.pbmWidth;
				}
				ed.totalWidth = ed.width + ed.pbmWidth;
			}else if(hint == "east"){
				wd.width = wd.width - diff;
				if(wd.width < wd.minWidth){
					ed.width = ed.width - (wd.minWidth-wd.width);
					wd.width = wd.minWidth;
					ed.totalWidth = ed.width + ed.pbmWidth;
				}
				wd.totalWidth = wd.width + wd.pbmWidth;
			}
		} else if(wd.totalMinWidth + ed.totalMinWidth + cd.totalMinWidth >= cw){
			wd.width = wd.minWidth;
			ed.width = ed.minWidth;
			wd.totalWidth = wd.width + wd.pbmWidth;
			ed.totalWidth = ed.width + ed.pbmWidth;
			cw = wd.totalMinWidth + ed.totalMinWidth + cd.totalMinWidth;
		}
		
		cd.top = parseFloat(self.element.css("padding-top"));
		cd.left = parseFloat(self.element.css("padding-left"));
		cd.right = parseFloat(self.element.css("padding-right"));
		cd.bottom = parseFloat(self.element.css("padding-bottom"));

		if(self.northElement){
			nd.top = parseFloat(self.element.css("padding-top"));
			nd.left = parseFloat(self.element.css("padding-left"));
			nd.width = cw - nd.pbmWidth;
			
			cd.top += nd.totalHeight;
		}
		
		if(self.southElement){
			sd.left = parseFloat(self.element.css("padding-left"));
			sd.width = cw - sd.pbmWidth;
			sd.top = ch- sd.totalHeight;

			cd.bottom += sd.totalHeight;
		}
		
		if(self.westElement){
			wd.top = cd.top;
			wd.left = parseFloat(self.element.css("padding-left"));
			wd.height = ch - cd.top - cd.bottom - wd.pbmHeight;
			cd.left += wd.totalWidth;
		}
		
		if(self.eastElement){
			ed.top = cd.top;
			ed.left = cw - ed.totalWidth;
			ed.height = ch - cd.top - cd.bottom - ed.pbmHeight;
			cd.right += ed.totalWidth;
		}
		
		cd.width = cw - cd.left - cd.right - cd.pbmWidth;
		cd.height = ch - cd.top - cd.bottom - cd.pbmHeight;
		
		$.each({"north":nd,"south":sd,"west":wd,"east":ed,"center":cd},function(k,v){
			if(self[k+"Element"]){
				self[k+"Element"].css($.extend({position:"absolute"},{
					top : v.top + "px",
					left : v.left + "px",
					overflow: k=="north"?"visible":"hidden",
					width : v.width + "px",
					height : v.height + "px"
				}));
			}
		});
		
		self.element.trigger("resize");
	},
	
	_makeResizable : function(){
		var self = this, o = this.options;
		if(this.northElement){
			this.northElement.resizable(o.north.resizable?{ 
				handles: "s",
				containment: self.element,
				resize: function(event, an) {
					var height = Math.max(ui.size.height,o.north.minHeight||0);
					height = Math.min(height, o.north.maxHeight||Number.MAX_VALUE);
					self._setOption("north",{height:height});
				},
			    start: function(event, ui) {
			    	//add a mask over the Iframe to prevent IE from stealing mouse events
			       $('body').append("<div id=\"mask\" style=\"position: absolute; z-index: 999999; left: 0pt; top: 0pt; right: 0pt; bottom: 0pt;\"></div>");
			    },
			    stop: function(event, ui) {
			    	//remove mask when dragging ends
			       $("#mask").remove();
			    }
			}:"destroy");
		}
		if(this.southElement){
			this.southElement.resizable(o.south.resizable?{ 
				handles: "n",
				containment: self.element,
				resize: function(event, ui) {
					var height = Math.max(ui.size.height,o.south.minHeight||0);
					height = Math.min(height, o.south.maxHeight||Number.MAX_VALUE);
					self._setOption("south",{height:height});
				},
			    start: function(event, ui) {
			        //add a mask over the Iframe to prevent IE from stealing mouse events
			        $('body').append("<div id=\"mask\" style=\"position: absolute; z-index: 999999; left: 0pt; top: 0pt; right: 0pt; bottom: 0pt;\"></div>");
			    },
			    stop: function(event, ui) {
			        //remove mask when dragging ends
			        $("#mask").remove();
			    }
			}:"destroy");
		}
		if(this.westElement){
			this.westElement.resizable(o.west.resizable?{ 
				handles: "e",
				containment: self.element,
				resize: function(event, ui) {
					var width = Math.max(ui.size.width,o.west.minWidth||0);
					width = Math.min(width,o.west.maxWidth||Number.MAX_VALUE);
					self._setOption("west",{width:width});
				},
			    start: function(event, ui) {
			        //add a mask over the Iframe to prevent IE from stealing mouse events
			        $('body').append("<div id=\"mask\" style=\"position: absolute; z-index: 999999; left: 0pt; top: 0pt; right: 0pt; bottom: 0pt;\"></div>");
			    },
			    stop: function(event, ui) {
			        //remove mask when dragging ends
			        $("#mask").remove();
			    }
			}:"destroy");
		}
		if(this.eastElement){
			this.eastElement.resizable(o.east.resizable?{ 
				handles: "w",
				containment: self.element,
				resize: function(event, ui) {
					var width = Math.max(ui.size.width,o.east.minWidth||0);
					width = Math.min(width, o.east.maxWidth||Number.MAX_VALUE);
					self._setOption("east",{width:width});
				},
			    start: function(event, ui) {
			        //add a mask over the Iframe to prevent IE from stealing mouse events
			        $('body').append("<div id=\"mask\" style=\"position: absolute; z-index: 999999; left: 0pt; top: 0pt; right: 0pt; bottom: 0pt;\"></div>");
			    },
			    stop: function(event, ui) {
			        //remove mask when dragging ends
			        $("#mask").remove();
			    }
			}:"destroy");
		}
	},

	refresh:function(){
		this._calculateDimension();
	},
	
	destroy: function() {
		this.element.removeClass( "ui-border" );
		$(window).unbind("resize.border",this._proxy);
		return $.Widget.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
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

$.widget( "an.rte", {
	options: {
		doctype: '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">',
		cssFiles: [],
		jsFiles: [],
		mode: "design", // "design","sourcecode"
		lang: 'en',
		absoluteURLs: true,
		styleWithCSS: false,
		history:[],
		undoable:false,
		redoable:false,
		formIds:{
			standard:"5080143085ac60df09000001",
			link: "508251eb0b27990c0a000001",
			image:"5082d29f0b27990c0a000005",
			table:"5085f383eeeac1e909000001",
			cell:"5086b873eeeac1e909000002",
			tabsx:["5080143085ac60df09000001","51306faad58d1c129f000000"]
		}
	},

	_create: function() {
		var self = this, o = this.options, el = this.element;
		el.addClass("an-rte").empty();
		this.url = this._parseURL(window.location.href);
		this.lang = (''+o.lang);
		o.iframe = $('<iframe/>').addClass("container").attr({frameborder:0}).appendTo(el);

		o.win = o.iframe[0].contentWindow;
		var doc = (o.doc = o.win.document);

		if(o.resizable) el.resizable();
		this.source = $("<textarea class='content'/>").appendTo(el);
		this.source[o.mode=="sourcecode"?"show":"hide"]();

		o.actions = this._createActions();

		$(o.win).bind("focus.rte blur.rte",function(e){
			self._trigger(e.type, e, el);
		});

		$(doc).bind('dragend.rte', function(e) {
			setTimeout(function() {
				try {
					o.win.focus();
					sel.moveToBookmark(sel.getBookmark());
					self.updatePath();
				} catch(e) { }
			}, 200);
		});

		o.iframe.load(function(){
			var body = $(this).contents().find("body")[0];
			// make iframe editable.
			if ($.browser.msie) {
				body.contentEditable = true;
			} else {
				try {
					body.contentEditable = true;
					//doc.designMode = "on";
					doc.execCommand('styleWithCSS', false, o.styleWithCSS);
				}catch(e){}
			}

			if (o.mobile) {
				var iself = this;
				this.width = "100%";
				setTimeout(function() {
					var bHeight = iself.contentWindow.document.body.scrollHeight;
					var dHeight = iself.contentWindow.document.documentElement.scrollHeight;
					var height = Math.max(bHeight, dHeight);
					iself.height = height;
				}, 500);
			}

			self.$body = $(body);
			if(o.cssClass) self.$body.addClass(o.cssClass);
			//o.history.push(self.$body.html());
			//self.htStep=o.history.length-1;
			o.onload&&o.onload();
			o.restore && o.restore(self.$body);
			self._restore();
		});

		/* put content into iframe */
		var html = '<html xmlns="http://www.w3.org/1999/xhtml"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />';
		$.each(o.cssFiles, function() {
			html += "<link rel='stylesheet' type='text/css' href='"+this+"'/>";
		});
		$.each(o.jsFiles,function(){
			html +="<script type='text/javascript' language='javascript' src='"+this+"'></script>";
		});

		/*if (o.mobile && o.modelType === 'page') {
			html += '<script src="javascripts/jquery.mobile-1.3.1.js"></script>\
				<link rel="stylesheet" href="stylesheets/jquery.mobile-1.3.1.min.css" type="text/css">';
		}*/
		html += '<style id="stylesheet" type="text/css">'+(o.stylesheet||"")+'</style>';

		doc.open();
		doc.write(o.doctype+html+'</head><body>'+$.trim(o.content||"")+'</body></html>');
		doc.close();

		o.dom       = new rteDom(this);
		o.selection = new rteSelection(this);
		this.showToolbar(o.showToolbar);
		this.source.bind("change.rte keyup.rte",function(e){
			e.preventDefault();
			e.stopImmediatePropagation();
			self.element.trigger("change");
		}).bind('keydown.rte', function(e) { // on tab press - insert \t and prevent move focus
			if (e.keyCode == $.ui.keyCode.TAB) {
				e.preventDefault();
				if ($.browser.msie) {
					var r = document.selection.createRange();
					r.text = "\t"+r.text;
					this.focus();
				} else {
					var value = this.value, before = value.substr(0, this.selectionStart),
					    after = value.substr(this.selectionEnd);
					this.value = before+"\t"+after;
					this.setSelectionRange(before.length+1, before.length+1);
				}
			}
		});

		/* update buttons on click and keyup */
		var mouseStatus = null;
		$(doc).bind('keydown.rte', function(e) {
			var sel = o.selection;
			if (e.keyCode == 13) {  // Enter
				var n = sel.getNode();
				if (o.dom.selfOrParent(n, /^PRE$/)) {
					sel.insertNode(o.doc.createTextNode("\r\n"));
				} else if ($.browser.safari && e.shiftKey) {
					sel.insertNode(o.doc.createElement('br'));
				}
			}
			if (e.keyCode == 32 && $.browser.opera) { // Space
				sel.insertNode(o.doc.createTextNode(" "));
			}

			if ((e.keyCode>=48 && e.keyCode <=57) || e.keyCode==61 || e.keyCode == 109
				|| (e.keyCode>=65 && e.keyCode<=90) || (e.keyCode>=188&&e.keyCode<=190)
				|| e.keyCode==191 || (e.keyCode>=219 && e.keyCode<=222)
				|| e.keyCode == 8 || e.keyCode == 46 || e.keyCode == 32 || e.keyCode == 13) {
				self.element.trigger("change");
			}
			if ((e.keyCode >= 8 && e.keyCode <= 13) || (e.keyCode>=32 && e.keyCode<= 40)
					|| e.keyCode == 46 || (e.keyCode >=96 && e.keyCode <= 111)
					||(e.keyCode == 65)&&(e.metaKey || e.ctrlKey)) {
				self.updatePath();
			}
			self.element.trigger(e);
		}).bind("contextmenu.rte",function(e){
			e.preventDefault();
			e.stopImmediatePropagation();
			var offset = o.iframe.offset(), pageX = offset.left+e.clientX, pageY = offset.top+e.clientY,
			      ev = $.extend($.Event(),{type:"contextmenu2",pageX:pageX,pageY:pageY});
			$(doc).find(e.target).trigger(ev);
		}).bind('paste.rte', function(e) {
			if (o.denyPaste) {
				e.stopPropagation();
				e.preventDefault();
			}
		}).bind("mousedown.rte",function(e){
			mouseStatus = "down";
		}).bind("mousemove.rte",function(e){
			if(mouseStatus == "down"){
				mouseStatus = "moving";
			}
			self.element.trigger(e);
		}).bind('mouseup.rte dblclick.rte', function(e){
			if(mouseStatus == "moving" || e.type == "dblclick"){
				mouseStatus = null;
				self.element.trigger("selectionChanged");
			}
			self.updatePath();
			self.element.trigger(e);
		}).bind("click.rte newwidget.rte contentchange.rte",function(e){
			self.element.trigger(e);
		}).bind("treenodeclick.rte",function(e,node){
			self.element.trigger(e,node);
		});
		if ($.browser.msie) {
			$(doc).bind('keyup.rte', function(e) {
				var sel = o.selection;
				if (e.keyCode == 86 && (e.metaKey||e.ctrlKey)) { // Ctrl + v
					sel.saveIERange();
					o.content  = self.$body.html();
					sel.restoreIERange();
					self.$body.mouseup();
					self.updatePath();
				}
			});
		}

		if ($.browser.safari) {
			$(doc).bind('click.rte', function(e) {
				content.find('.rte-webkit-hl').removeClass('rte-webkit-hl');
				if (e.target.nodeName == 'IMG') {
					$(e.target).addClass('rte-webkit-hl');
				}
			}).bind('keyup.rte', function(e) {
				content.find('.rte-webkit-hl').removeClass('rte-webkit-hl');
			});
		}


		o.win.focus();
	},

	option: function( key, value ) {
		if(/^can.*/.test(key)){
			this.options[key] = this['_'+key]?this['_'+key]():false;
		}
		if(key === "actionSets" && value === undefined){
			return this._createActionSets();
		}else	if(key === "content" && value === undefined){
			return this._getContent();
		}
		return $.Widget.prototype.option.apply(this, arguments );
	},

	_setOption: function( key, value ) {
		var o = this.options, oldValue = this.option(key);
		if(!equals(value,oldValue)){
			$.Widget.prototype._setOption.apply(this, arguments );
			if(key == "mode"){
				if(value == "design"){
					o.iframe.show();
					this.$body.html(this.source.hide().val());
					o.restore && o.restore(this.$body);
					this._restore();
					o.win.focus();
				}else {
					o.clean && o.clean(this.$body);
					this._clean();
					this.source.val(this.$body.html()).show();
					o.iframe.hide();
					if ($.browser.msie) {
						// @todo
					} else {
						this.source[0].setSelectionRange(0, 0);
					}
				}
			}else if(key == "content"){
				if(o.mode == "design"){
					this.$body.html(value);
				}else if(o.mode == "sourcecode"){
					this.source.val(value);
				}
			}else if(key == "stylesheet"){
				$(o.doc).find("#stylesheet").text(value);
			}else	if(key == "height"){
				this.element.css("height",value);
			}else if(key == "width"){
				this.element.css("width",value);
			}else if(key == "showToolbar"){
				this.showToolbar(value);
			}else if(key == "path"){
				this.toolbar && this.toolbar.toolbar("refresh");
			}
			this._trigger("optionchanged",null,{key:key, value:value, oldValue:oldValue});
		}
		return this;
	},
	history:function(){
		var self=this,o=self.options,ht=o.history;
		if(o.mode=="design"){
			clearTimeout(o.historyT);
			o.historyT=setTimeout(function(){
				ht.push(self._getContent());
				self.htStep=ht.length-1;
				self.option("undoable",true);
			},400);
		}
	},
	undo:function(){
		var self=this,ht=self.options.history;
		if(ht.length<=1)return ;
		self.htStep=self.htStep-1;
		if(self.htStep<0){
			self.htStep=0;
		}
		self.$body.html(ht[self.htStep]);
		self._restore();
		self.option("redoable",true);
		self.htStep==0&&self.option("undoable",false);
	},
	redo:function(){
		var self=this,ht=self.options.history;
		if(ht.length<=1)return ;
		self.htStep++;
		if(self.htStep>(ht.length-1)){
			self.htStep=ht.length-1;
		}
		self.$body.html(ht[self.htStep]);
		self._restore();
		self.option("undoable",true);
		(self.htStep==ht.length-1)&&self.option("redoable",false);

	},
	showToolbar: function(show){
		if(show){
			if(!this.toolbar){
				var self = this, o = this.options;
				this.toolbar = $("<div/>").toolbar({actionSets: this._createActionSets()}).prependTo(this.element);
				function adjustHeight(){
					if(self.toolbar.is(":visible")){
						var height = self.element.height()-self.toolbar.outerHeight(true);
						o.iframe.css({height: height});
						self.source.css({height: height});
					}
				}
				adjustHeight();
				this._proxy = $.proxy(function(e){ adjustHeight(); },this);
				$(window).bind("resize.rte", this._proxy);
			}
		}else{
			if(this.toolbar){
				$(window).unbind("resize.rte", this._proxy);
				this.toolbar.remove();
				delete this.toolbar;
			}
		}
	},

	_getContent:function(){
		var o = this.options, content = o.content;
		if(o.mode == "design" && this.$body){
			o.clean && o.clean(this.$body);
			this._clean();
			content = this.$body.html();
			o.restore && o.restore(this.$body);
			this._restore();
		}else if(o.mode == "sourcecode"){
			content = this.source.val();
		}
		return content;
	},
	_clean:function(){
		$('table',this.$body).each(function(){
			if($(this).data('resizable')){
				$(this).data('resizable').destroy();
			}
		});
		$("img",this.$body).unbind('dblclick');

		this.$body.find(".widget[type=tabsx]").each(function(){
			var tw = $(this).data("tabsxwidget");
			if(tw) tw.destroy();
		});
	},
	_restore:function(){
		var self = this, o = this.options, ids = o.formIds, sel = o.selection;
		$('table',this.$body).resizable({
			stop: function(e, ui) {
				self.element.trigger("contentchange");
				e.preventDefault();
				e.stopImmediatePropagation();
			}
		});
		$("img",this.$body).each(function(){
			var img =this;
			$(this).dblclick(function(){
				var attrs=attributes(img);
				attrs['width']=$(img).css('width').replace(/px/g,'');
				attrs['height']=$(img).css('height').replace(/px/g,'');
				self._showDialog("Image", attrs, [ids.standard,ids.image], function(attrs){
					$.each(attrs, function(k,v){
						if(k=='width'||k=='height'){
							v = $.trim(v)?$img.css(k,v):$img.removeAttr(k);
						}else{
							v = $.trim(v)?$img.attr(k,v):$img.removeAttr(k);
						}
					});
					if(!img.parentNode) sel.insertNode(img);
					self.element.trigger("contentchange");
				});
			});
		});

		this.$body.find(".widget[type=tabsx]").each(function(){
			var $this = $(this);
			if($this.is(".an-tabsxwidget")){
				$this.data("tabsxwidget").option("mode",o.mode);
			}else{
				$this.tabsxwidget({
					parent:function(){return self;},
					mode:o.mode,
					dbId:o.dbId,
					optionchanged:function(e,data){
						if(data.key == "metadata" || data.key == "attributes"){
							self.element.trigger("contentchange");
						}
					}
				});
			}
		});
	},
	_createActionSets:function(){
		var o = this.options, mode = o.mode;
		if(mode == "design"){
			return [this._controlActionSet(), this._formatActionSet(),
			        this._tableActionSet(), this._widgetActionSet(), this._modeActionSet()];
		}else if(mode == "sourcecode"){
			return [this._modeActionSet()];
		}
	},

	_controlActionSet:function(){
		return this._createActionSet(["properties","cleanFormat"]);
	},

	_formatActionSet:function(){
		return this._createActionSet(["bold","italic","underline","strikethrough","subscript",
		        "superscript","alignLeft","alignCenter","alignRight","alignFull","font","fontSize",
		        "format","leftToRight","rightToLeft","fontColor","backgroundColor","outdent",
		        "indent","orderedList","unorderedList","link","deleteLink","horizontalRule",
		        "blockQuote","blockElement","stopFloat","image"]);
	},

	_tableActionSet:function(){
		return this._createActionSet(["table","tableProps","deleteTable","rowBefore","rowAfter","deleteRow",
		"columnBefore","columnAfter","deleteColumn", "cellProps","mergeCells",
		"splitCells"]);
	},

	_widgetActionSet:function(){
		return this._createActionSet(["tabsx"]);
	},

	_modeActionSet:function(){
		return this._createActionSet(["sourcecode"]);
	},

	_createActionSet:function(as){
		var actions = this.options.actions, actionSet = {};
		$.each(as, function(){
			actionSet[this] = actions[this];
		});
		return actionSet;
	},

	// do cut, copy, paste.
	_doCCP: function(op){
			this.addHistory();
			try {
				this.options.doc.execCommand(op, false, null);
			} catch (e) {
				if ($.browser.mozilla){
					var s = ' Ctl + C';
					if (op == 'cut') {
						s = ' Ctl + X';
					} else if (op == 'paste') {
						s = ' Ctl + V';
					}
					$("<div class='rte-dialog'/>").dialog({
						title:"Warning",
						height: 260,
						width: 380,
						modal: true,
						open: function(event, ui){
							$(this).append('This operation is disabled in your browser on security reason. Use shortcut instead.'+': '+s);
						},
						buttons: { OK: function() {$(this).dialog( "close" );} },
						close: function(e, ui){$(this).remove();}
					});
				}else{
					window.console.log('commands failed: '+op);
				}
			}
			this.updatePath();
	},

	_canCCP: function(op){
		var o = this.options,ret = false;
		try{
			ret = o.mode == "design" && o.doc.queryCommandEnabled(op);
		}catch (e) {
		};
		return ret;
	},

	_canCut: function(){
		return this._canCCP("cut");
	},

	_canCopy: function(){
		return this._canCCP("copy");
	},

	_canPaste: function(){
		return this._canCCP("paste");
	},

	cut: function(){
		this._doCCP("cut");
	},

	copy: function(){
		this._doCCP("copy");
	},

	paste: function(){
		this._doCCP("paste");
	},

	updatePath: function(cleanCache){
		var o = this.options,sel = o.selection, dom = o.dom;
		cleanCache && sel.cleanCache();
		var n    = sel.getNode(),	 p = dom.parents(n, '*'), rtl = o.rtl, sep  = rtl ? ' &laquo; ' : ' &raquo; ', path = '', i;

		function _name(n) {
			var name = n.nodeName.toLowerCase();
			n = $(n);
			if (name == 'img' || name == "div") {
				if(n.is(".widget")){
					var id = n.attr("id");
					if(id) id = id.replace(/-/g,".");
					name = id +" ("+n.attr("type")+")";
				}
			}
			return name;
		}

		if (n && n.nodeType == 1 && n.nodeName != 'BODY') {
			p.unshift(n);
		}

		if (!rtl) {
			p = p.reverse();
		}

		for (i=0; i < p.length; i++) {
			path += (i>0 ? sep : '')+_name(p[i]);
		}

		return this.option("path", path);
	},

	removeFormat: function(){
		this.options.doc.execCommand("removeformat", false, null);
		return this;
	},

    bold: function(){
    	this.options.doc.execCommand("bold", false, null);
		this.element.trigger("contentchange");
		return this;
    },

	italic: function(){
    	this.options.doc.execCommand("italic", false, null);
		this.element.trigger("contentchange");
    	return this;
    },

	underline: function(){
    	this.options.doc.execCommand("underline", false, null);
		this.element.trigger("contentchange");
    	return this;
    },

	strikethrough: function(){
    	this.options.doc.execCommand("strikethrough", false, null);
		this.element.trigger("contentchange");
		return this;
    },

	subscript: function(){
    	this.options.doc.execCommand("subscript", false, null);
		this.element.trigger("contentchange");
		return this;
    },

	superscript: function(){
    	this.options.doc.execCommand("superscript", false, null);
		this.element.trigger("contentchange");
		return this;
    },

    align: function(dir){
    	var o = this.options, s = o.selection.selected({collapsed:true, blocks : true, tag : 'div'}),
		l = s.length;
		while (l--) {
			o.dom.filter(s[l], 'textNodes') && $(s[l]).css('text-align', dir);
		}
		this.element.trigger("contentchange");
		return this;
	},

	leftToRight: function(){
		var o = this.options, dom = o.dom,sel = o.selection, n = sel.getNode();
		if ($(n).attr('dir') == 'ltr' || $(n).parents('[dir="ltr"]').length || $(n).find('[dir="ltr"]').length) {
			$(n).removeAttr('dir');
			$(n).parents('[dir="ltr"]').removeAttr('dir');
			$(n).find('[dir="ltr"]').removeAttr('dir');
		} else {
			if (dom.is(n, 'textNodes') && dom.is(n, 'block')) {
				$(n).attr('dir', 'ltr');
			} else {
				$.each(dom.parents(n, 'textNodes'), function(i, n) {
					if (dom.is(n, 'block')) {
						$(n).attr('dir', 'ltr');
						return false;
					}
				});
			}
		}
		this.element.trigger("contentchange");
		return this;
	},

	rightToLeft: function(){
		var o = this.options, dom = o.dom, n = o.selection.getNode();
		if ($(n).attr('dir') == 'rtl' || $(n).parents('[dir="rtl"]').length || $(n).find('[dir="rtl"]').length) {
			$(n).removeAttr('dir');
			$(n).parents('[dir="rtl"]').removeAttr('dir');
			$(n).find('[dir="rtl"]').removeAttr('dir');
		} else {
			if (dom.is(n, 'textNodes') && dom.is(n, 'block')) {
				$(n).attr('dir', 'rtl');
			} else {
				$.each(dom.parents(n, 'textNodes'), function(i, n) {
					if (dom.is(n, 'block')) {
						$(n).attr('dir', 'rtl');
						return false;
					}
				});
			}
		}
		this.element.trigger("contentchange");
		return this;
	},

    outdent: function(){
    	var o = this.options, sel = o.selection, dom = o.dom;
		function find(n) {
			function checkNode(n) {
				var ret = {type : '', val : 0}, s;
				if ((s = dom.attr(n, 'style'))) {
					ret.type = s.indexOf('padding-left') != -1
						? 'padding-left'
						: (s.indexOf('margin-left') != -1 ? 'margin-left' : '');
					ret.val = ret.type ? parseInt($(n).css(ret.type))||0 : 0;
				}
				return ret;
			}

			var n = sel.getNode(), ret = checkNode(n);
			if (ret.val) {
				ret.node = n;
			} else {
				$.each(dom.parents(n, '*'), function() {
					ret = checkNode(this);
					if (ret.val) {
						ret.node = this;
						return ret;
					}
				});
			}
			return ret;
		};

		var v = find();
		if (v.node) {
			$(v.node).css(v.type, (v.val>40 ? v.val-40 : 0)+'px');
			this.updatePath();
		}
		this.element.trigger("contentchange");
		return this;
	},

    indent: function(){
    	var o = this.options, sel = o.selection, dom = o.dom, doc = o.doc,
    	    nodes = sel.selected({collapsed : true, blocks : true, wrap : 'inline', tag : 'p'});

		function indent(n) {
			var css = /(IMG|HR|TABLE|EMBED|OBJECT)/.test(n.nodeName) ? 'margin-left' : 'padding-left';
			var val = dom.attr(n, 'style').indexOf(css) != -1 ? parseInt($(n).css(css))||0 : 0;
			$(n).css(css, val+40+'px');
		}

		for (var i=0; i < nodes.length; i++) {
			if (/^(TABLE|THEAD|TFOOT|TBODY|COL|COLGROUP|TR)$/.test(nodes[i].nodeName)) {
				$(nodes[i]).find('td,th').each(function() {
					indent(this);
				});
			} else if (/^LI$/.test(nodes[i].nodeName)) {
				var n = $(nodes[i]);
				$(doc.createElement(nodes[i].parentNode.nodeName))
					.append($(doc.createElement('li')).html(n.html()||'')).appendTo(n.html('&nbsp;'));
			} else {
				indent(nodes[i]);
			}
		};
		this.updatePath();
		this.element.trigger("contentchange");
		return this;
	},

	orderedList: function(){
		this.options.doc.execCommand("insertorderedlist", false, null);
		this.updatePath();
		this.element.trigger("contentchange");
		return this;
	},

    unorderedList: function(){
		this.options.doc.execCommand("insertunorderedlist", false, null);
		this.updatePath();
		this.element.trigger("contentchange");
		return this;
    },

    _showDialog:function(title, attrs, formIds, callback,openCallBack){
    	var self = this, o = this.options, sel = o.selection, bm = sel.getBookmark();
    	sel.saveIERange();
		$("<div class='rte-dialog'/>").dialog({
			title:title,
			height: 400,
			width: 500,
			modal: true,
			create: function(event, ui){
				var $this = $(this);
				Model.getPages(o.dbId, formIds, function(err, forms){
					if(forms){
						$this.editor({document:attrs, forms:forms, dbId:o.dbId, mode:"edit", ignoreEscape:true});
					}
				});
			},
			buttons: {
				OK: function() {
					var $this = $(this);
					sel.moveToBookmark(bm);
					callback($this.editor("option","document"));
					self.updatePath();
					$this.dialog("close");
				},
				Cancel: function(){ $( this ).dialog( "close" );}
			},
			open : function(event, ui){
				if(typeof openCallBack == 'function'){
					openCallBack();
				}
			},
			close : function(e, ui) {sel.removeBookmark(bm); $.browser.msie && sel.restoreIERange(); $(this).remove();}
		});
    },

	link: function(){
		var self = this, o = this.options, sel = o.selection, dom = o.dom, doc = o.doc,
		      n = sel.getNode(), link = dom.selfOrParentLink(n), ids = o.formIds;
		function isLink(n) { return n.nodeName == 'A' && n.href; }
		if (!link) {
			sn = $.browser.msie ? sel.selected() : sel.selected({wrap : false});
			if (sn.length) {
				for (var i=0; i < sn.length; i++) {
					if (isLink(sn[i])) {
						link = sn[i];
						break;
					}
				};
				if (!link) {
					link = dom.parent(sn[0], isLink) || dom.parent(sn[sel.length-1], isLink);
				}
			}
		}
		link = link || doc.createElement('a');
		this._showDialog("Link", attributes(link), [ids.standard,ids.link], function(attrs){
			var href = self._absoluteURL(attrs.href), fakeURL, img = n.nodeName == 'IMG' ? n : null;
			if (img && img.parentNode) {
				link = $(doc.createElement('a')).attr('href', href);
				dom.wrap(img, link[0]);
			} else if (!link.parentNode) {
				fakeURL = '#--el-editor---'+Math.random();
				doc.execCommand('createLink', false, fakeURL);
				link = $('a[href="'+fakeURL+'"]', doc).each(function() {
					var $this = $(this);
					if (!$.trim($this.html()) && !$.trim($this.text())) {
						$this.replaceWith($this.text());
					}
				});
			}
			attrs.href = href;
			link = $(link);
			$.each(attrs, function(k,v){ v = $.trim(v)?link.attr(k,v):link.removeAttr(k); });
			img && sel.select(img);
		});
		this.element.trigger("contentchange");
		return this;
	},

	blockQuote: function(){
    	var o = this.options, sel = o.selection, dom = o.dom, n, nodes;
		if (sel.collapsed() && (n = dom.selfOrParent(sel.getNode(), /^BLOCKQUOTE$/))) {
			$(n).replaceWith($(n).html());
		} else {
			nodes = sel.selected({wrap : 'all', tag : 'blockquote'});
			nodes.length && sel.select(nodes[0], nodes[nodes.length-1]);
		}
		this.updatePath();
		this.element.trigger("contentchange");
		return this;
	},

	blockElement:function(){
    	var o = this.options, sel = o.selection, dom = o.dom, n, nodes;
		if (sel.collapsed()) {
			n = dom.selfOrParent(sel.getNode(), /^DIV$/);
			if (n) {
				$(n).replaceWith($(n).html());
			}
		} else {
			nodes = sel.selected({wrap : 'all', tag : 'div'});
			nodes.length && sel.select(nodes[0], nodes[nodes.length-1]);
		}
		this.updatePath();
		this.element.trigger("contentchange");
		return this;
	},

    stopFloat: function(){
    	var o = this.options, sel = o.selection, dom = o.dom, doc = o.doc;
		function find() {
			if (sel.collapsed()) {
				var n = dom.selfOrParent(sel.getEnd(), /^DIV$/);
				if (n && (dom.attr(n, 'clear') || $(n).css('clear') != 'none')) {
					return n;
				}
			}
		};

		var n = find();
		if (n) {
			n = $(n);
			if (!n.children().length && !$.trim(n.text()).length) {
				n.remove();
			} else {
				n.removeAttr('clear').css('clear', '');
			}
		} else {
			sel.insertNode($(doc.createElement('div')).css('clear', 'both')[0], true);
		}
		this.updatePath();
		this.element.trigger("contentchange");
		return this;
	},

    deleteTable: function(){
    	$(this.options.dom.parent(this.options.selection.getNode(), /^TABLE$/)).remove();
		this.updatePath();
		this.element.trigger("contentchange");
		return this;
	},

	insertTableRow: function(param){
		var o = this.options, dom = o.dom,sel = o.selection, n  = sel.getNode(), doc = o.doc,
		    c  = dom.selfOrParent(n, /^(TD|TH)$/), r  = dom.selfOrParent(c, /^TR$/),
		    mx = dom.tableMatrix(dom.selfOrParent(c, /^TABLE$/));

		if (c && r && mx) {
			var before =  'before'== param, ro = $(r).prevAll('tr').length, cnt = 0, mdf = [];
			function _find(x, y) {
				while (y>0) {
					y--;
					if (mx[y] && mx[y][x] && mx[y][x].nodeName) {
						return mx[y][x];
					}
				}
			}

			for (var i=0; i<mx[ro].length; i++) {
				if (mx[ro][i] && mx[ro][i].nodeName) {
					var cell    = $(mx[ro][i]);
					var colspan = parseInt(cell.attr('colspan')||1);
					if (parseInt(cell.attr('rowspan')||1) > 1) {
						if (before) {
							cnt += colspan;
						} else {
							mdf.push(cell);
						}
					} else {
						cnt += colspan;
					}
				} else if (mx[ro][i] == '-') {
					cell = _find(i, ro);
					cell && mdf.push($(cell));
				}
			}
			var row = $(doc.createElement('tr'));
			for (var i=0; i<cnt; i++) {
				row.append('<td>&nbsp;</td>');
			}
			if (before) {
				row.insertBefore(r);
			} else {
				row.insertAfter(r);
			}
			$.each(mdf, function() {
				$(this).attr('rowspan', parseInt($(this).attr('rowspan')||1)+1);
			});
			this.updatePath();
		}
		this.element.trigger("contentchange");
		return this;
	},

    deleteRow: function(){
    	var o = this.options,sel = o.selection, dom = o.dom, n = sel.getNode(),
    	    c = dom.selfOrParent(n, /^(TD|TH)$/), r = dom.selfOrParent(c, /^TR$/),
    	    tb = dom.selfOrParent(c, /^TABLE$/), mx = dom.tableMatrix(tb);

		if (c && r && mx.length) {
			if (mx.length==1) {
				$(tb).remove();
				this.updatePath();
			}
			var mdf = [], ro = $(r).prevAll('tr').length;
			function _find(x, y) {
				while (y>0) {
					y--;
					if (mx[y] && mx[y][x] && mx[y][x].nodeName) {
						return mx[y][x];
					}
				}
			}

			// move cell with rowspan>1 to next row
			function _move(cell, x) {
				y = ro+1;
				var sibling= null;
				if (mx[y]) {
					for (var _x=0; _x<x; _x++) {
						if (mx[y][_x] && mx[y][_x].nodeName) {
							sibling = mx[y][_x];
						}
					};

					cell = cell.remove();
					if (sibling) {
						cell.insertAfter(sibling);
					} else {
						cell.prependTo($(r).next('tr').eq(0));
					}
				}
			}

			function _cursorPos(column) {
				for (var i = 0; i<column.length; i++) {
					if (column[i] == c) {
						return i<column.length-1 ? column[i+1] : column[i-1];
					}
				}
			}

			for (var i=0; i<mx[ro].length; i++) {
				var cell = null;
				var move = false;
				if (mx[ro][i] && mx[ro][i].nodeName) {
					cell = mx[ro][i];
					move = true;
				} else if (mx[ro][i] == '-' && (cell = _find(i, ro))) {
					move = false;
				}
				if (cell) {
					cell = $(cell);
					var rowspan = parseInt(cell.attr('rowspan')||1);
					if (rowspan>1) {
						cell.attr('rowspan', rowspan-1);
						move && _move(cell, i, ro);
					}
				}
			};

			var _c = _cursorPos(dom.tableColumn(c));
			if (_c) {
				sel.selectContents(_c).collapse(true);
			}

			$(r).remove();
		}
		this.updatePath();
		this.element.trigger("contentchange");
		return this;
	},

	insertTableColumn: function(param){
		var o=this.options,doc = o.doc, dom=o.dom,sel=o.selection,
		    cells = dom.tableColumn(sel.getNode(), false, true);
		if (cells.length) {
			$.each(cells, function() {
				var $this = $(this);
				var cp = parseInt($this.attr('colspan')||1);
				if (cp >1) {
					$this.attr('colspan', cp+1);
				} else {
					var c = $(doc.createElement(this.nodeName)).html('&nbsp;');
					if (param == 'before') {
						c.insertBefore(this);
					} else {
						c.insertAfter(this);
					}
				}
			});
		}
		this.updatePath();
		this.element.trigger("contentchange");
		return this;
	},

    deleteColumn: function(){
    	var o=this.options,sel=o.selection,dom=o.dom, n = sel.getNode(),
    	    c = dom.selfOrParent(n, /^(TD|TH)$/), prev  = $(c).prev('td,th')[0],
    	    next  = $(c).next('td,th')[0], tb = dom.parent(n, /^TABLE$/),
    	    cells = dom.tableColumn(n, false, true);

		if (cells.length) {
			$.each(cells, function() {
				var $this = $(this), cp = parseInt($this.attr('colspan')||1);
				if ( cp>1 ) {
					$this.attr('colspan', cp-1);
				} else {
					$this.remove();
				}
			});
			dom.fixTable(tb);
			if (prev || next) {
				sel.selectContents(prev ? prev : next).collapse(true);
			}
		}
		this.updatePath();
		this.element.trigger("contentchange");
		return this;
	},

    mergeCells: function(){
    	var o=this.options,sel=o.selection,dom=o.dom, cells = null,
    	    c1 = dom.selfOrParent(sel.getStart(), /^(TD|TH)$/),
    	    c2 = dom.selfOrParent(sel.getEnd(), /^(TD|TH)$/);
		if (c1 && c2 && c1!=c2 && $(c1).parents('table')[0] == $(c2).parents('table')[0]) {
			cells = [c1, c2];
		}

		if (cells) {
			var _s  = dom.indexOf($(cells[0]).parent('tr')[0]),
			    _e  = dom.indexOf($(cells[1]).parent('tr')[0]),
			    ro  = Math.min(_s, _e), // row offset
			    rl  = Math.max(_s, _e) - ro + 1, // row length
			    _c1 = dom.tableColumn(cells[0], true, true), _c2 = dom.tableColumn(cells[1], true),
			    _i1 = $.inArray(cells[0], _c1.column), _i2 = $.inArray(cells[1], _c2.column),
			    colBegin = _c1.info.offset[_i1] < _c2.info.offset[_i2]  ? _c1 : _c2,
			    colEnd   = _c1.info.offset[_i1] >= _c2.info.offset[_i2] ? _c1 : _c2,
			    length   = 0, target   = null, html     = '';
			$($(cells[0]).parents('table').eq(0).find('tr').get().slice(ro, ro+rl)).each( function(i) {
					var _l = html.length, accept = false;
					$(this).children('td,th').each(function() {
						var $this   = $(this), inBegin = $.inArray(this, colBegin.column),
						    inEnd   = $.inArray(this, colEnd.column);

						if (inBegin!=-1 || inEnd!=-1) {
							accept = inBegin!=-1 && inEnd==-1;
							var len = parseInt($this.attr('colspan')||1);
							if (i == 0) {
								length += len;
							}

							if (inBegin!=-1 && i>0) {
								var delta = colBegin.info.delta[inBegin], cell;
								if (delta>0) {
									if ($this.css('text-align') == 'left') {
										cell = $this.clone(true);
										$this.html('&nbsp;');
									} else {
										cell = $this.clone().html('&nbsp;');
									}
									cell.removeAttr('colspan').removeAttr('id').insertBefore(this);
									if (delta>1) {
										cell.attr('colspan', delta);
									}
								}
							}

							if (inEnd!=-1) {
								var delta = colEnd.info.delta[inEnd], cell;
								if (len-delta>1) {
									var cp = len-delta-1;
									if ($this.css('text-align') == 'right') {
										cell = $this.clone(true);
										$this.html('&nbsp;');
									} else {
										cell = $this.clone().html('&nbsp;');
									}
									cell.removeAttr('colspan').removeAttr('id').insertAfter(this);
									if (cp>1) {
										cell.attr('colspan', cp);
									}
								}
							}
							if (!target) {
								target = $this;
							} else {
								html += $this.html();
								$this.remove();
							}
						} else if (accept) {
							if (i == 0) {
								length += parseInt($this.attr('colspan')||1);
							}
							html += $this.html();
							$this.remove();
						}
					});
					html += _l!=html.length ? '<br/>' : '';
				});

			target.removeAttr('colspan').removeAttr('rowspan').html(target.html()+html);
			if (length>1) {
				target.attr('colspan', length);
			}
			if (rl>1) {
				target.attr('rowspan', rl);
			}
			// sometimes when merge cells with different rowspans we get "lost" cells in rows
			// this add cells if needed
			dom.fixTable($(cells[0]).parents('table').get(0));
		}
		this.updatePath();
		this.element.trigger("contentchange");
		return this;
	},

    splitCells: function(){
    	var o=this.options,sel=o.selection,dom=o.dom, doc = o.doc,
    	    n = dom.selfOrParent(sel.getNode(), /^(TD|TH)$/);
		if (n) {
			var colspan = parseInt(dom.attr(n, 'colspan')), rowspan = parseInt(dom.attr(n, 'rowspan'));
			if (colspan>1 || rowspan>1) {
				var cnum = colspan-1, rnum = rowspan-1, tb = dom.parent(n, /^TABLE$/), tbm  = dom.tableMatrix(tb);
				if (cnum) {
					for (var i=0; i<cnum; i++) {
						$(doc.createElement(n.nodeName)).html('&nbsp;').insertAfter(n);
					}
				}
				if (rnum) {
					var ndx  = dom.indexesOfCell(n, tbm), rndx = ndx[0], cndx = ndx[1];
					for (var r=rndx+1; r < rndx+rnum+1; r++) {
						var cell = null;
						if (!tbm[r][cndx].nodeName) {
							if (tbm[r][cndx-1].nodeName) {
								cell = tbm[r][cndx-1];
							} else {
								for (var i=cndx-1; i>=0; i--) {
									if (tbm[r][i].nodeName) {
										cell =tbm[r][i];
										break;
									}
								}
							}
							if (cell) {
								for (var i=0; i<= cnum; i++) {
									$(doc.createElement(cell.nodeName)).html('&nbsp;').insertAfter(cell);
								}
							}
						}
					};
				}
				$(n).removeAttr('colspan').removeAttr('rowspan');
				dom.fixTable(tb);
			}
		}
		this.updatePath();
		this.element.trigger("contentchange");
		return this;
	},

	fontColor: function(c){
		var o =  this.options, sel = o.selection;
		if (!sel.collapsed()) {
			var nodes = sel.selected({collapse : false, wrap : 'text'});
			$.each(nodes, function() {
				if (/^(THEAD|TBODY|TFOOT|TR)$/.test(this.nodeName)) {
					$(this).find('td,th').each(function() {
						$(this).css('color', c).find('*').css('color', '');
					});
				} else {
					$(this).css('color', c).find('*').css('color', '');
				}
			});
			this.updatePath();
			this.element.trigger("contentchange");
		}
		return this;
	},

	backgroundColor:function(c){
		var o = this.options, sel = o.selection;
		if (!sel.collapsed()) {
			var nodes = sel.selected({collapse : false, wrap : 'text'});
			$.each(nodes, function() {
				if (/^(THEAD|TBODY|TFOOT|TR)$/.test(this.nodeName)) {
					$(this).find('td,th').each(function() {
						$(this).css('background-color', c).find('*').css('background-color', '');
					});
				} else {
					$(this).css('background-color', c).find('*').css('background-color', '');
				}
			});
			this.updatePath();
			this.element.trigger("contentchange");
		}
		return this;
	},

	font: function(size){
		var o = this.options, sel = o.selection, nodes = sel.selected({filter : 'textContainsNodes'});
		$.each(nodes, function() {
			$this = /^(THEAD|TFOOT|TBODY|COL|COLGROUP|TR)$/.test(this.nodeName) ? $(this).find('td,th') : $(this);
			$(this).css('font-family', size).find('[style]').css('font-family', '');
		});
		this.updatePath();
		this.element.trigger("contentchange");
		return this;
	},

	fontSize: function(size){
		var o = this.options, nodes = o.selection.selected({filter : 'textContainsNodes'});
		$.each(nodes, function() {
			$this = /^(THEAD|TFOOT|TBODY|COL|COLGROUP|TR)$/.test(this.nodeName) ? $(this).find('td,th') : $(this);
			$this.css('font-size', size).find("[style]").css('font-size', '');
		});
		this.updatePath();
		this.element.trigger("contentchange");
		return this;
	},

	format: function(v){
		var o = this.options, sel = o.selection, dom = o.dom, doc = o.doc;
		function f(n, tag) {
			function replaceChilds(p) {
				$(p).find('h1,h2,h3,h4,h5,h6,p,address,pre').each(function() {
					$(this).replaceWith($(this).html());
				});
				return p;
			}

			if (/^(LI|DT|DD|TD|TH|CAPTION)$/.test(n.nodeName)) {
				!dom.isEmpty(n) && dom.wrapContents(replaceChilds(n), tag);
			} else if (/^(UL|OL|DL|TABLE)$/.test(n.nodeName)) {
				dom.wrap(n, tag);
			} else {
				!dom.isEmpty(n) && $(replaceChilds(n)).replaceWith( $(doc.createElement(tag)).html($(n).html()));
			}
		}

		var tag = v.toUpperCase(),	i, n, $n, c = sel.collapsed(), bm = sel.getBookmark(),
			nodes = sel.selected({ collapsed : true, blocks:true, filter : 'textContainsNodes', wrap:'inline', tag:'span'}),
			l = nodes.length, s = $(nodes[0]).prev(), e = $(nodes[nodes.length-1]).next();
		while (l--) {
			n = nodes[l];
			$n = $(n);
			if (tag == 'DIV' || tag == 'SPAN') {
				if (/^(H[1-6]|P|ADDRESS|PRE)$/.test(n.nodeName)) {
					$n.replaceWith($(doc.createElement('div')).html($n.html()||''));
				}
			} else {
				if (/^(THEAD|TBODY|TFOOT|TR)$/.test(n.nodeName)) {
					$n.find('td,th').each(function() { f(this, tag); });
				} else if (n.nodeName != tag) {
					f(n, tag);
				}
			}
		}

		sel.moveToBookmark(bm);
		this.updatePath();
		this.element.trigger("contentchange");
		return this;
	},

	deleteLink:function(){
		var o = this.options, sel = o.selection, dom = o.dom, doc = o.doc, n = sel.getNode(), l = dom.selfOrParentLink(n);
		function isLink(n) { return n.nodeName == 'A' && n.href; }
		if (l) {
			sel.select(l);
			doc.execCommand('unlink', false, null);
		} else {
			sel = $.browser.msie ? sel.selected() : sel.selected({wrap : false});
			if (sel.length) {
				for (var i=0; i < sel.length; i++) {
					if (isLink(sel[i])) {
						l = sel[i];
						break;
					}
				};
				if (!l) {
					l = dom.parent(sel[0], isLink) || dom.parent(sel[sel.length-1], isLink);
				}
			}
		}
		this.updatePath();
		this.element.trigger("contentchange");
		return this;
	},

	horizontalRule: function(){
		var o = this.options, sel = o.selection, n = sel.getEnd(),doc = o.doc;
		n = (n&&(n.nodeName=="HR"))? n : doc.createElement('hr');
		this._showDialog("Horizontal Rule", attributes(n), [o.formIds.standard], function(attrs){
			var $n = $(n);
			$.each(attrs, function(k,v){ v = $.trim(v)?$n.attr(k,v):$n.removeAttr(k); });
			if(!$n.parent().length) sel.insertNode(n);
		});
		this.element.trigger("contentchange");
		return this;
    },

	properties: function(){
		var self = this, o = this.options, sel = o.selection, n = sel.getNode();
		if (n.nodeType == 3)  n = n.parentNode;
		if(n.nodeType != 1 || n.nodeName == 'BODY') return;
		this._showDialog("Standard Properties", attributes(n), [o.formIds.standard], function(attrs){
			var $n = $(n);
			$.each(attrs, function(k,v){ v = $.trim(v)?$n.attr(k,v):$n.removeAttr(k); });
			self.element.trigger("contentchange");
		});
		return this;
	},

    image: function(){
    	var self = this, o = this.options, sel = o.selection, img = sel.getEnd(),doc = o.doc, ids = o.formIds;
    	if($(img).is('.widget,:not(img)')) img = doc.createElement('img');
    	if(img['width'] && $(img).attr('style')){
    		img['width'] = img.offsetWidth;
			$(img).attr('style',$(img).attr('style').replace(/width:\s*\d+px/,'width:' + img.offsetWidth + 'px'));
		}
		if(img['height'] && $(img).attr('style')){
			img['height'] = img.offsetHeight;
			$(img).attr('style',$(img).attr('style').replace(/height:\s*\d+px/,'height:' + img.offsetHeight + 'px'));
		}

		var as = attributes(img),
			oldValue = $.extend(true,{},as);
    	this._showDialog("Image", attributes(img), [ids.standard,ids.image], function(attrs){
    		var $img = $(img);
    		if(attrs['width'] && attrs['style']){
				attrs['style'] = attrs['style'].replace(/width:\s*\d+px/,'width:' + attrs['width'] + 'px');
			}
			if(attrs['height'] && attrs['style']){
				attrs['style'] = attrs['style'].replace(/height:\s*\d+px/,'height:' + attrs['height'] + 'px');
			}
			$.each(attrs, function(k,v){
				v = $.trim(v)?$img.attr(k,v):$img.removeAttr(k);
			});
			if(!img.parentNode) sel.insertNode(img);
			self.element.trigger("contentchange");

			/*$img.resizable({
				stop: function(event, ui) {
					self.element.trigger("contentchange");
					event.preventDefault();
					event.stopImmediatePropagation();
			    },
				create:function(){
					$img.parent().css('position','relative');
				}
			});*/
			if(!equals(attrs,oldValue)){
				self.element.trigger("contentchange");
			}
			$img.dblclick(function(){
				var attrs=attributes(img);
				attrs['width']=$(img).css('width').replace(/px/g,'');
				attrs['height']=$(img).css('height').replace(/px/g,'');
				self._showDialog("Image", attrs, [ids.standard,ids.image], function(attrs){
					$.each(attrs, function(k,v){
						if(k=='width'||k=='height'){
							v = $.trim(v)?$img.css(k,v):$img.removeAttr(k);
						}else{
							v = $.trim(v)?$img.attr(k,v):$img.removeAttr(k);
						}
					});
					if(!img.parentNode) sel.insertNode(img);
					self.element.trigger("contentchange");
				});
			});
    	});
		return this;
    },

	rteWidget: function(type, formIds, opts){
    	var o = this.options, sel = o.selection, n = sel.getStart(), $n = $(n);
    	if(!$n.is('.widget[type='+type+']')){
    		$n = $("<div class='widget'/>").attr("type",type).css((opts&&opts.style)||{});
    		$n.toggleClass("field", $.inArray(type,["text","checkbox", "radio","select", "datetime", "mobiledate","codearea",
    		                                          "textarea", "file","grid","jsrender","password","rte", "search",
    		                                          "toggle", "listview","customhtml"])!=-1);
    		$n.toggleClass("box", $.inArray(type,["box","editor", "page","view"])!=-1);
    		n = $n.get(0);
    	}
    	var oldmd = $.extend(true,opts,$n.getMetadata()), oldattrs = attributes(n),
       	      title = type.substring(0,1).toUpperCase()+type.substring(1) + " Properties";
    	if(oldattrs.id) oldattrs.id = oldattrs.id.replace(/-/g,".");
 		this._showDialog(title, $.extend({},oldmd,oldattrs), formIds, function(attrs){
			var md = {};
			if($n.is(".field") && attrs[type+"field"]){
				md[type+"field"] = attrs[type+"field"];
				delete attrs[type+"field"];
			}else if($n.is("[type=widget]")){
				md.widget = attrs.widget;
				delete attrs.widget;
			}else if($n.is("[type=box]")){
				md.box = attrs.box;
				delete attrs.box;
				if(oldmd&&oldmd.box&&!(oldmd.box.link == md.box.link && md.box.link == "raw")) $n.children('.content').empty();
			}else if($n.is("[type=tabsx]")){
				md.tabsxwidget = attrs.tabsxwidget;
				delete attrs.tabsxwidget;
			}else if($n.is("[type=button]")){
				md.buttonwidget = attrs.buttonwidget;
				delete attrs.buttonwidget;
			}else if($n.is(".box") && attrs[type+"box"]){
				md[type+"box"] = attrs[type+"box"];
				delete attrs[type+"box"];
			}else if($n.is(".widget") && attrs[type+"widget"]){
				md[type+"widget"] = attrs[type+"widget"];
				delete attrs[type+"widget"];
			}
			if(!equals(md, oldmd)){
				$n.setMetadata(md);
				$n.trigger("metadatachanged",[md, oldmd]);
			}
			if(!equals(attrs, oldattrs)){
				if(attrs.id) attrs.id = attrs.id.replace(/\./g,"-");
				$.each(attrs, function(k,v){ v = $.trim(v)?$n.attr(k,v):$n.removeAttr(k); });
				if($n.parent().length==0) {
					sel.insertNode(n);
					$n.trigger("newwidget",[n]);
				}else{
					$n.trigger("attributeschanged",[attrs, oldattrs]);
				}
			}
		});
		return this;
	},

	rteWidgetActive: function(type){
		var n = this.options.selection.getEnd();
		if(n&&n.nodeName == "DIV"){
			return $(n).is('.widget[type='+type+']');
		}
    	return false;
	},

    _alignEnable: function(){
    	var o = this.options;
    	if(o.mode != "design") return false;
    	var s = o.selection.getNode();
    	return s&&s.nodeName == 'BODY' ? s : o.dom.selfOrParent(s, 'textNodes')||(s&&s.parentNode && s.parentNode.nodeName == 'BODY' ? s.parentNode : null) ? true : false;
    },

    _alignActive: function(align){
    	var o = this.options;
    	if(o.mode != "design") return false;
    	var s = o.selection.getNode(),
    	     n = s.nodeName == 'BODY' ? s : o.dom.selfOrParent(s, 'textNodes')||(s.parentNode && s.parentNode.nodeName == 'BODY' ? s.parentNode : null);
    	return $(n).css('text-align') == align;
    },

    _commandEnabled: function(cmd){
    	var o = this.options, enabled = false;
    	try{
    		enabled = (o.mode == "design") && o.doc.queryCommandEnabled(cmd);
    	}catch(e){};
    	return enabled;
    },

    _commandState: function(cmd){
    	var o = this.options, state = false;
    	try{state = (o.mode == "design") && o.doc.queryCommandState(cmd);}catch(e){};
    	return state;
    },

    _directionActive:function(dir){
		var $n = $(this.options.selection.getNode());
		return $n.attr('dir') == dir || $n.parents('[dir='+dir+']').length || $n.find('[dir='+dir+']').length;
    },

    _colorEnable:function(element, color){
    	var o = this.options;
		if(o.mode != "design") return false;
		var n = o.selection.getNode();
		if(n){
			var c = $(n.nodeType != 1 ? n.parentNode : n).css(color);
			element.data("select").val(this._color2Hex(''+c)||(color=="color"?"#000000":"#FFFFFF"));
			return true;
		}
		return false;
    },

    _fontEnable:function(action){
    	var o = this.options;
    	if(o.mode != "design") return false;
		var n = o.selection.getNode();
		if(n){
			if (n.nodeType != 1) n = n.parentNode;
			var v = $(n).css('font-family');
			v = v ? v.toString().toLowerCase().replace(/,\s+/g, ',').replace(/'|"/g, '') : '';
			action.element.data("select").val(action.src[v] ? v : '');
			return true;
		}
		return false;
    },

    _fontSizeEnable:function(action){
    	var o = this.options;
		if(o.mode != "design") return false;
		var n = o.selection.getNode();
		action.element.data("select").val((m = o.dom.attr(n, 'style').match(/font-size:\s*([^;]+)/i)) ? m[1] : '');
		return true;
    },

    _formatEnable:function(action){
    	var o = this.options;
    	if(o.mode != "design") return false;
		var n = o.dom.selfOrParent(o.selection.getNode(), /^(H[1-6]|P|ADDRESS|PRE)$/);
		action.element.data("select").val(n ? n.nodeName.toLowerCase() : 'span');
		return true;
    },

    _outdentEnable:function(){
    	var o = this.options;
		if(o.mode != "design") return false;

		var sel = o.selection, dom = o.dom;
		function checkNode(n) {
			var ret = {type : '', val : 0}, s;
			if ((s = dom.attr(n, 'style'))) {
				ret.type = s.indexOf('padding-left') != -1 ? 'padding-left'
						: (s.indexOf('margin-left') != -1 ? 'margin-left' : '');
				ret.val = ret.type ? parseInt($(n).css(ret.type))||0 : 0;
			}
			return ret;
		}

		var n = sel.getNode(), outdent = checkNode(n), node = null;
		if (outdent.val) {
			node = n;
		} else {
			$.each(dom.parents(n, '*'), function() {
				outdent = checkNode(this);
				if (outdent.val) {
					node = this;
				}
			});
		}
		return node ? true: false;
    },

    _linkEnable:function(){
    	var o = this.options;
		if(o.mode != "design") return false;
		var sel = o.selection, n = sel.getNode();
		if(n){
			var dom = o.dom;
			return dom.selfOrParentLink(n)
				|| dom.selectionHas(sel, function(n) { return n.nodeName == 'A' && n.href; })
				|| !sel.collapsed() || n.nodeName == 'IMG';
		}
		return false;
    },

    _linkActive:function(){
    	var o = this.options, sel = o.selection;
		if(o.mode != "design") return false;
		var n = sel.getNode();
		if(n){
			var dom = o.dom;
			return dom.selfOrParentLink(n)
					|| dom.selectionHas(sel, function(n) { return n.nodeName == 'A' && n.href; });
		}
		return false;
    },

	_deleteLinkEnable:function(){
		var o = this.options, sel = o.selection;
		if(o.mode != "design") return false;
		var n = sel.getNode();
		if(n){
			var dom = o.dom;
			return dom.selfOrParentLink(n)
					|| dom.selectionHas(sel, function(n) { return n.nodeName == 'A' && n.href; });
		}
		return false;
	},

	_blockQuoteEnable:function(){
		var o = this.options;
		if(o.mode != "design") return false;
		var sel = o.selection,dom = o.dom;
		if (!sel.collapsed())  return true;
		return dom.selfOrParent(sel.getNode(), /^BLOCKQUOTE$/);
	},

	_blockElementEnable:function(){
		var o = this.options;
		if(o.mode != "design") return false;
		var sel = o.selection,dom = o.dom;
		return !sel.collapsed() || dom.selfOrParent(sel.getNode(), /^DIV$/);
	},

	_blockElementActive:function(){
		var o = this.options;
		if(o.mode != "design") return false;
		var sel = o.selection,dom = o.dom;
		return sel.collapsed() && dom.selfOrParent(sel.getNode(), /^DIV$/);
	},

	_stopFloatActive:function(){
		var o = this.options;
		if(o.mode != "design") return false;
		var sel = o.selection, dom = o.dom;
		if (!sel.collapsed()) return false;
		var n = dom.selfOrParent(sel.getEnd(), /^DIV$/);
		return n && (dom.attr(n, 'clear') || $(n).css('clear') != 'none');
	},

	_propertiesEnable:function(){
		var o = this.options, sel = o.selection,n = sel.getNode();
		if(o.mode != "design") return false;
		if (n && n.nodeType == 3) {
			n = n.parentNode;
		}
		n = (n&&n.nodeType == 1 && n.nodeName != 'BODY') ? n : null;
		return n ? true : false;
	},

	_imageActive:function(){
		var o = this.options;
		if(o.mode != "design") return false;
		var n = o.selection.getEnd();
		if(n){
			var $n = $(n);
			return n.nodeName == 'IMG' && !$n.is('.widget') && !$n.is('.rte-media');
		}
		return false;
	},

	_tablePropsEnable:function(){
		var o = this.options;
		if(o.mode != "design") return false;
		var sel = o.selection, dom = o.dom;
		return dom.selfOrParent(sel.getNode(), /^TABLE$/);
	},

	_deleteTableEnable:function(){
		var o = this.options;
		if(o.mode != "design") return false;
		var sel = o.selection, dom = o.dom;
		return dom.parent(sel.getNode(), /^TABLE$/);
	},

	_rowBeforeEnable:function(){
		var o = this.options;
		if(o.mode != "design") return false;
		var sel = o.selection,dom = o.dom;
		return dom.selfOrParent(sel.getNode(), /^TR$/);
	},

	_rowAfterEnable:function(){
		var o = this.options;
		if(o.mode != "design") return false;
		var sel = o.selection, dom = o.dom;
		return dom.selfOrParent(sel.getNode(), /^TR$/);
	},

	_deleteRowEnable:function(){
		var o = this.options;
		if(o.mode != "design") return false;
		var sel = o.selection, dom = o.dom;
		return dom.selfOrParent(sel.getNode(), /^TR$/);
	},

	_columnBeforeEnable:function(){
		var o = this.options;
		if(o.mode != "design") return false;
		var sel = o.selection,dom = o.dom;
		return dom.selfOrParent(sel.getNode(), /^(TD|TH)$/);
	},

	_columnAfterEnable:function(){
		var o = this.options;
		if(o.mode != "design") return false;
		var sel = o.selection, dom = o.dom;
		return dom.selfOrParent(sel.getNode(), /^(TD|TH)$/);
	},

	_deleteColumnEnable:function(){
		var o = this.options;
		if(o.mode != "design") return false;
		var sel = o.selection, dom = o.dom;
		return dom.selfOrParent(sel.getNode(), /^(TD|TH)$/);
	},

	_cellPropsEnable:function(){
		var o = this.options;
		if(o.mode != "design") return false;
		var sel = o.selection, dom = o.dom;
		return dom.parent(sel.getNode(), /^TABLE$/);
	},

	_mergeCellsEnable:function(){
		var o = this.options;
		if(o.mode != "design") return false;
		var sel = o.selection, dom = o.dom,
		      c1 = dom.selfOrParent(sel.getStart(), /^(TD|TH)$/),
		      c2 = dom.selfOrParent(sel.getEnd(), /^(TD|TH)$/);
		return c1 && c2 && c1!=c2 && $(c1).parents('table').get(0) == $(c2).parents('table').get(0);
	},

	_splitCellsEnable:function(){
		var o = this.options;
		if(o.mode != "design") return false;
		var sel = o.selection, dom = o.dom,
		      n = dom.selfOrParent(sel.getNode(), /^(TD|TH)$/);
		return n && (parseInt(dom.attr(n, 'colspan'))>1 || parseInt(dom.attr(n, 'rowspan'))>1);
	},

	_parseURL: function(url) {
		var reg = /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
		var u   = url.match(reg);
		var ret = {};
		$.each(["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"], function(i) {
			ret[this] = u[i];
		});
		if (!ret.host.match(/[a-z0-9]/i)) {
			ret.host = '';
		}
		return ret;
	},

	_absoluteURL: function(url) {
		var baseURL = this.url.protocol+'://'+(this.url.userInfo ?  parts.userInfo+'@' : '')+this.url.host+(this.url.port ? ':'+this.url.port : '');
		var path    = !this.url.file ? this.url.path : this.url.path.substring(0, this.url.path.length - this.url.file.length);

		url = $.trim(url);
		if (!url) return '';
		if (url[0] == '#') 	return url;

		var u = this._parseURL(url);
		if (!u.host && !u.path && !u.anchor) {
			//this.rte.log('Invalid URL: '+url)
			return '';
		}
		if (!this.options.absoluteURLs) return url;
		if (u.protocol) {
			//this.rte.log('url already absolute: '+url);
			return url;
		}
		if (u.host && (u.host.indexOf('.')!=-1 || u.host == 'localhost')) {
			//this.rte.log('no protocol');
			return this.url.protocol+'://'+url;
		}
		if (url[0] == '/') {
			url = baseURL+url;
		} else {
			if (url.indexOf('./') == 0) {
				url = url.substring(2);
			}
			url = baseURL+path+url;
		}
		return url;
	},

	_color2Hex : function(c) {
		var colors = {
				aqua    : '#00ffff',
				black   : '#000000',
				blue    : '#0000ff',
				fuchsia : '#ff00ff',
				gray    : '#808080',
				green   : '#008000',
				lime    : '#00ff00',
				maroon  : '#800000',
				navy    : '#000080',
				olive   : '#808000',
				orange  : '#ffa500',
				purple  : '#800080',
				red     : '#ff0000',
				silver  : '#c0c0c0',
				teal    : '#008080',
				white   : '#fffffff',
				yellow  : '#ffff00'
		};
		// rgb color regexp
		var rgbRegExp = /\s*rgb\s*?\(\s*?([0-9]+)\s*?,\s*?([0-9]+)\s*?,\s*?([0-9]+)\s*?\)\s*/i;
		// regexp to detect color in border/background properties
		var colorsRegExp = /aqua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|orange|purple|red|silver|teal|white|yellow|rgb\s*\([^\)]+\)/i;

		var m;
		c = c||'';
		if (c.indexOf('#') === 0) {
			return c;
		}

		function hex(s) {
			s = parseInt(s).toString(16);
			return s.length > 1 ? s : '0' + s;
		};

		if (colors[c]) {
			return colors[c];
		}
		if ((m = c.match(rgbRegExp))) {
			return '#'+hex(m[1])+hex(m[2])+hex(m[3]);
		}
		return '';
	},

	_trimEventCallback: function(c) {
		c = c ? c.toString() : '';
		return $.trim(c.replace(/\r*\n/mg, '').replace(/^function\s*on[a-z]+\s*\(\s*event\s*\)\s*\{(.+)\}$/igm, '$1'));
	},

	_toPixels : function(num) {
		var m = num.match(/([0-9]+\.?[0-9]*)\s*(px|pt|em|%)/);
		if (m) {
			num  = m[1];
			unit = m[2];
		}
		if (num[0] == '.') {
			num = '0'+num;
		}
		num = parseFloat(num);

		if (isNaN(num)) {
			return '';
		}
		var base = parseInt($(document.body).css('font-size')) || 16;
		switch (unit) {
			case 'em': return parseInt(num*base);
			case 'pt': return parseInt(num*base/12);
			case '%' : return parseInt(num*base/100);
		}
		return num;
	},

	_parseStyle: function(s) {
		var st = {}, t, n, v, p;
		if (typeof(s) == 'string' && s.length) {
			$.each(s.replace(/&quot;/gi, "'").split(';'), function(i, str) {
				if ((p = str.indexOf(':')) !== -1) {
					n = $.trim(str.substr(0, p));
					v = $.trim(str.substr(p+1));
					if (n == 'color' || n == 'background-color') {
						v = v.toLowerCase();
					}
					if (n && v) {
						st[n] = v;
					}
				}
			});
		}
		return st;
	},

	/**
	 * Encode entities in string
	 *
	 * @param   String
	 * @return  String
	 **/
	_encode: function(s) {
		/**
		 * entities map
		 **/
		var entities = {'&' : '&amp;', '"' : '&quot;', '<' : '&lt;', '>' : '&gt;'};
		/**
		 * entities regexp
		 **/
		var entitiesRegExp = /[<>&\"]/g;

		var e = entities;
		return (''+s).replace(entitiesRegExp, function(c) {
			return e[c];
		});
	},

	_edittable: function(create){
		var o = this.options, sel = o.selection, dom = o.dom, doc = o.doc, ids = o.formIds,self = this;
		var table = create ? doc.createElement('table'):dom.selfOrParent(sel.getNode(), /^TABLE$/);
		table = table||doc.createElement('table');
		if(table['width'] && $(table).attr('style')){
			table['width'] = table.offsetWidth;
			$(table).attr('style',$(table).attr('style').replace(/width:\s*\d+px/,'width:' + table.offsetWidth + 'px'));
		}
		if(table['height'] && $(table).attr('style')){
			table['height'] = table.offsetHeight;
			$(table).attr('style',$(table).attr('style').replace(/height:\s*\d+px/,'height:' + table.offsetHeight + 'px'));
		}
		var as = attributes(table);
		if(create){
			$.extend(as,{rows:2,columns:2,_isNew:true});
		}
		var oldValue = $.extend(true,{},as);

		this._showDialog("Table", as, [ids.standard, ids.table], function(attrs){
			var $table = $(table);
			if (!$table.parents().length) {
				var r = parseInt(attrs.rows)|| 0;
				var c = parseInt(attrs.columns) || 0;
				if (r<=0 || c<=0)  return;
				var b = $(doc.createElement('tbody')).appendTo(table);
				for (var i=0; i < r; i++) {
					var tr = '<tr>';
					for (var j=0; j < c; j++) {
						tr += '<td>&nbsp;</td>';
					}
					b.append(tr+'</tr>');
				};
			} else {
				$table.removeAttr('width').removeAttr('border').removeAttr('cellspacing')
					.removeAttr('cellpadding').removeAttr('frame').removeAttr('rules')
					.removeAttr('style');
			}
			delete attrs.rows;
			delete attrs.columns;
			delete attrs._isNew;

			if(attrs['width'] && attrs['style']){
				attrs['style'] = attrs['style'].replace(/width:\s*\d+px/,'width:' + attrs['width'] + 'px');
			}
			if(attrs['height'] && attrs['style']){
				attrs['style'] = attrs['style'].replace(/height:\s*\d+px/,'height:' + attrs['height'] + 'px');
			}
			$.each(attrs, function(k,v){ v = $.trim(v)?$table.attr(k,v):$table.removeAttr(k);});
			if(!table.parentNode) sel.insertNode(table);
			$table.resizable({
				stop: function(e, ui) {
					self.element.trigger("contentchange");
					e.preventDefault();
					e.stopImmediatePropagation();
			    }
			});
			if(!equals(attrs,oldValue)){
				self.element.trigger("contentchange");
			}
		});
		return this;
	},

	_cellProperties:function(){
		var self = this, o = this.options, sel = o.selection, dom = o.dom, ids = o.formIds;
		var cell = dom.selfOrParent(sel.getNode(), /^(TD|TH)$/);
		if (!cell) {
			return;
		}

		var $cell = $(cell), as = attributes(cell);
		$.extend(as,{
			type:cell.nodeName.toLowerCase(),
			width:$cell.css('width') || $cell.attr('width'),
			height:$cell.css('height') || $cell.attr('height')
		});
		this._showDialog("Cell", as, [ids.standard, ids.cell], function(attrs){
			var target = $cell;
			switch (attrs.apply) {
				case 'row':
					target = $cell.parent('tr').children('td,th');
					break;
				case 'column':
					target = $(dom.tableColumn(cell));
					break;
				case 'table':
					target = $cell.closest('table').find('td,th');
					break;
			}
			delete attrs.apply;

			if (cell.nodeName.toLowerCase() != attrs.type){
				$.each(target.get(), function() {
						$(this).replaceWith($('<'+attrs.type+' />').html($(this).html()));
				});
			}
			delete attrs.type;
			self.element.trigger("contentchange");
			$.each(attrs, function(k,v){ v = $.trim(v)?target.attr(k,v):target.removeAttr(k);});
		});
		return this;
	},

	addClass: function(selector, cls){
		this.$body.find(selector).addClass(cls);
	},

	removeClass:function(selector, cls){
		this.$body.find(selector).removeClass(cls);
	},

	toggleClass:function(selector, cls, tag){
		this.$body.find(selector).toggleClass(cls,tag);
	},

	_createActions: function(){
		var self = this, o = this.options;
	    var actions = {
		    properties:{
		    	type: "button",
		    	label: "Properties",
		    	icons: {primary: "ui-icon-css"},
		    	handler: function(){self.properties();},
		    	enabled:function(){return self._propertiesEnable();}
		    },
	    	cleanFormat:{
	    		type: "checkbox",
	    		label: "Clean Format",
	    		icons: {primary: "ui-icon-clean-format"},
	    		handler: function(){self.removeFormat();},
	    		enabled: function(){return self._commandEnabled("removeformat");},
	    		checked: function(){return self._commandState("removeformat");}
	    	},
	    	bold:{
	        	type: "checkbox",
	        	label: "Bold",
	    		icons: {primary: "ui-icon-bold"},
	        	handler: function(){self.bold();},
	    		enabled: function(){return self._commandEnabled("bold");},
	    		checked: function(){return self._commandState("bold");}
	    	},
	    	italic:{
	        	type: "checkbox",
	        	label: "Italic",
	    		icons: {primary: "ui-icon-italic"},
	        	handler: function(){self.italic();},
	    		enabled: function(){return self._commandEnabled("italic");},
	    		checked: function(){return self._commandState("italic");}
	    	},
	    	underline:{
	        	type: "checkbox",
	        	label: "Underline",
	    		icons: {primary: "ui-icon-underline"},
	        	handler: function(){self.underline();},
	    		enabled: function(){return self._commandEnabled("underline");},
	    		checked: function(){return self._commandState("underline");}
	    	},
	    	strikethrough:{
	        	type: "checkbox",
	        	label: "Strikethrough",
	    		icons: {primary: "ui-icon-strikethrough"},
	        	handler: function(){self.strikethrough();},
	    		enabled: function(){return self._commandEnabled("strikethrough");},
	    		checked: function(){return self._commandState("strikethrough");}
	    	},
	    	subscript:{
	        	type: "checkbox",
	        	label: "Subscript",
	    		icons: {primary: "ui-icon-subscript"},
	        	handler: function(){self.subscript();},
	    		enabled: function(){return self._commandEnabled("subscript");},
	    		checked: function(){return self._commandState("subscript");}
	    	},
	    	superscript:{
	        	type: "checkbox",
	        	label: "Superscript",
	    		icons: {primary: "ui-icon-superscript"},
	        	handler: function(){self.superscript();},
	    		enabled: function(){return self._commandEnabled("superscript");},
	    		checked: function(){return self._commandState("superscript");}
	    	},
	    	alignLeft:{
	        	name: "align",
	        	type: "radio",
	        	label: "Align left",
	    		icons: {primary: "ui-icon-align-left"},
	        	handler: function(){self.align("left");},
	        	enabled: function(){return self._alignEnable();},
	        	checked: function(){return self._alignActive("left");}
	    	},
	    	alignCenter:{
	        	name: "align",
	        	type: "radio",
	        	label: "Align center",
	    		icons: {primary: "ui-icon-align-center"},
	        	handler: function(){self.align("center");},
	        	enabled: function(){return self._alignEnable();},
	        	checked: function(){return self._alignActive("center");}
	    	},
	    	alignRight:{
	        	name: "align",
	        	type: "radio",
	        	label: "Align right",
	    		icons: {primary: "ui-icon-align-right"},
	        	handler: function(){self.align("right");},
	        	enabled: function(){return self._alignEnable();},
	        	checked: function(){return self._alignActive("right");}
	    	},
	    	alignFull:{
	        	name: "align",
	        	type: "radio",
	        	label: "Align full",
	    		icons: {primary: "ui-icon-align-full"},
	        	handler: function(){self.align("justify");},
	        	enabled: function(){return self._alignEnable();},
	        	checked: function(){return self._alignActive("justify");}
	    	},
	    	leftToRight:{
	    		name: "direction",
	        	type: "radio",
	        	label: "Left to right",
	    		icons: {primary: "ui-icon-left-to-right"},
	        	handler: function(){self.leftToRight();},
	        	checked: function(){return self._directionActive('ltr');}
	    	},
	    	rightToLeft:{
	    		name: "direction",
	        	type: "radio",
	        	label: "Right to left",
	    		icons: {primary: "ui-icon-right-to-left"},
	        	handler: function(){self.rightToLeft();},
	        	checked: function(){return self._directionActive('rtl');}
	    	},
	    	fontColor:{
	        	type: "colorPicker",
	        	label: "Font color",
	    		icons: {primary: "ui-icon-font-color"},
	    		handler  : function(c){ self.fontColor(c); },
	    		enabled : function(){ return self._colorEnable(this.element, "color"); }
	    	},
	    	backgroundColor:{
	        	type: "colorPicker",
	        	label: "Background color",
	        	color : "#FFFFFF",
	    		icons: {primary: "ui-icon-background-color"},
	    		handler  : function(c) {self.backgroundColor(c);},
	    		enabled : function(){ return self._colorEnable(this.element, "background-color"); }
	    	},
	    	font:{
	        	type     : "select",
	        	label  : "Font",
	    		tpl      : '<span style="font-family:%val">%label</span>',
	    		src      : {
	    			''                                                                    : 'Font',
	    			'andale mono,sans-serif'                                  : 'Andale Mono',
	    			'arial,helvetica,sans-serif'                                  : 'Arial',
	    			'arial black,gadget,sans-serif'                            : 'Arial Black',
	    			'book antiqua,palatino,sans-serif'                      : 'Book Antiqua',
	    			'comic sans ms,cursive'                                     : 'Comic Sans MS',
	    			'courier new,courier,monospace'                       : 'Courier New',
	    			'georgia,palatino,serif'                                      : 'Georgia',
	    			'helvetica,sans-serif'                                          : 'Helvetica',
	    			'impact,sans-serif'                                             : 'Impact',
	    			'lucida console,monaco,monospace'                  : 'Lucida console',
	    			'lucida sans unicode,lucida grande,sans-serif'     : 'Lucida grande',
	    			'tahoma,sans-serif'                                           : 'Tahoma',
	    			'times new roman,times,serif'                            : 'Times New Roman',
	    			'trebuchet ms,lucida grande,verdana,sans-serif'  : 'Trebuchet MS',
	    			'verdana,geneva,sans-serif'                               : 'Verdana'
	    		},
	    		select   : function(size) {self.font(size);},
	    		enabled  : function() {return self._fontEnable(this);}
	    	},
	    	fontSize:{
	        	type     : "select",
	        	label: "Font size",
	    		labelTpl : '%label',
	    		tpl : '<span style="font-size:%val;line-height:1.2em">%label</span>',
	    		src : {
	    			''         : 'Font size',
	    			'xx-small' : 'Small (8pt)',
	    			'x-small'  : 'Small (10px)',
	    			'small'    : 'Small (12pt)',
	    			'medium'   : 'Normal (14pt)',
	    			'large'    : 'Large (18pt)',
	    			'x-large'  : 'Large (24pt)',
	    			'xx-large' : 'Large (36pt)'
	    		},
	    		select   : function(size) {self.fontSize(size);},
	    		enabled: function(){return self._fontSizeEnable(this);}
	    	},
	    	format:{
	        	type: "select",
	        	label: "Format",
	    		labelTpl : '%label',
	    		tpls     : {'' : '%label'},
	    		src      : {
	    			'span'    : 'Format',
	    			'h1'      : 'Heading 1',
	    			'h2'      : 'Heading 2',
	    			'h3'      : 'Heading 3',
	    			'h4'      : 'Heading 4',
	    			'h5'      : 'Heading 5',
	    			'h6'      : 'Heading 6',
	    			'p'       : 'Paragraph',
	    			'address' : 'Address',
	    			'pre'     : 'Preformatted',
	    			'div'     : 'Normal (DIV)'
	    		},
	    		select   : function(v) {self.format(v);	},
	    		enabled  : function(){return self._formatEnable(this);}
	    	},
	    	outdent:{
	        	type: "button",
	        	label: "Outdent",
	    		icons: {primary: "ui-icon-outdent"},
	        	handler: function(){self.outdent();},
	        	enabled: function(){return self._outdentEnable();}
	    	},
	    	indent:{
	        	type: "button",
	        	label: "Indent",
	    		icons: {primary: "ui-icon-indent"},
	        	handler: function(){self.indent();}
	    	},
	    	orderedList:{
	        	type: "button",
	        	label: "Ordered list",
	    		icons: {primary: "ui-icon-ordered-list"},
	        	handler: function(){self.orderedList();},
	    		enabled: function(){return self._commandEnabled("insertorderedlist");},
	    		checked: function(){return self._commandState("insertorderedlist");}
	    	},
	    	unorderedList:{
	        	type: "button",
	        	label: "Unordered List",
	    		icons: {primary: "ui-icon-unordered-list"},
	        	handler: function(){self.unorderedList();},
	    		enabled: function(){return self._commandEnabled("insertunorderedlist");},
	    		checked: function(){return self._commandState("insertunorderedlist");}
	    	},
	    	link:{
	        	type: "checkbox",
	        	label: "Link",
	    		icons: {primary: "ui-icon-link"},
	        	handler: function(){self.link();},
	        	enabled:function(){return self._linkEnable();},
	        	checked: function(){return self._linkActive();}
	    	},
	    	deleteLink:{
	        	type: "checkbox",
	        	label: "Delete Link",
	    		icons: {primary: "ui-icon-del-link"},
	        	handler: function(){self.deleteLink();	},
	        	enabled: function(){return self._deleteLinkEnable();},
	        	checked: function(){return self._deleteLinkEnable();}
	    	},
	    	horizontalRule:{
	        	type: "checkbox",
	        	label: "Horizontal rule",
	    		icons: {primary: "ui-icon-horizontal-rule"},
	        	handler: function(){self.horizontalRule();},
	        	checked:function(){ return o.mode == "design" && o.selection.getEnd() &&o.selection.getEnd().nodeName == 'HR';}
	    	},
	    	blockQuote:{
	        	type: "checkbox",
	        	label: "Block quote",
	    		icons: {primary: "ui-icon-block-quote"},
	        	handler: function(){self.blockQuote();},
	    		enabled: function(){return self._blockQuoteEnable();},
	    		checked: function(){return self._blockQuoteEnable();}
	    	},
	    	blockElement:{
	        	type: "checkbox",
	        	label: "Block element (DIV)",
	    		icons: {primary: "ui-icon-block-element"},
	        	handler: function(){self.blockElement();},
	        	enabled: function(){return self._blockElementEnable();},
	        	checked: function(){return self._blockElementActive();}
	    	},
	    	stopFloat:{
	        	type: "checkbox",
	        	label: "Stop element floating",
	    		icons: {primary: "ui-icon-stop-float"},
	        	handler: function(){self.stopFloat();},
	        	checked: function(){return self._stopFloatActive();}
	    	},
	    	image:{
	        	type: "checkbox",
	        	label: "Image",
	    		icons: {primary: "ui-icon-image"},
	        	handler: function(){self.image();},
	        	checked: function(){return self._imageActive();}
	    	},
	    	table:{
	        	type: "button",
	        	label: "Table",
	    		icons: {primary: "ui-icon-table"},
	        	handler: function(){self._edittable(true);}
	    	},
	    	tableProps:{
	        	type: "button",
	        	label: "Table properties",
	    		icons: {primary: "ui-icon-table-props"},
	        	handler: function(){self._edittable();},
	        	enabled: function(){return self._tablePropsEnable();}
	    	},
	    	deleteTable:{
	        	type: "button",
	        	label: "Delete table",
	    		icons: {primary: "ui-icon-del-table"},
	        	handler: function(){self.deleteTable();},
	        	enabled: function(){return self._deleteTableEnable();}
	    	},
	    	rowBefore:{
	        	type: "button",
	        	label: "Insert row before",
	    		icons: {primary: "ui-icon-row-before"},
	        	handler: function(){self.insertTableRow("before");},
	        	enabled: function(){return self._rowBeforeEnable();}
	    	},
	    	rowAfter:{
	        	type: "button",
	        	label: "Insert row after",
	    		icons: {primary: "ui-icon-row-after"},
	        	handler: function(){self.insertTableRow("after");},
	        	enabled: function(){return self._rowAfterEnable();}
	    	},
	    	deleteRow:{
	        	type: "button",
	        	label: "Delete row",
	    		icons: {primary: "ui-icon-del-row"},
	        	handler: function(){self.deleteRow();},
	        	enabled: function(){return self._deleteRowEnable();}
	    	},
	    	columnBefore:{
	        	type: "button",
	        	label: "Insert column before",
	    		icons: {primary: "ui-icon-col-before"},
	        	handler: function(){self.insertTableColumn("before");},
	        	enabled: function(){return self._columnBeforeEnable();}
	    	},
	    	columnAfter:{
	        	type: "button",
	        	label: "Insert column after",
	    		icons: {primary: "ui-icon-col-after"},
	        	handler: function(){self.insertTableColumn("after");},
	        	enabled: function(){return self._columnAfterEnable();}
	    	},
	    	deleteColumn:{
	        	type: "button",
	        	label: "Delete column",
	    		icons: {primary: "ui-icon-del-column"},
	        	handler: function(){self.deleteColumn();},
	        	enabled: function(){return self._deleteColumnEnable();}
	    	},
	    	cellProps:{
	        	type: "button",
	        	label: "Table cell properties",
	    		icons: {primary: "ui-icon-cell-props"},
	        	handler: function(){self._cellProperties();},
	        	enabled: function(){return self._cellPropsEnable();}
	    	},
	    	mergeCells:{
	        	type: "button",
	        	label: "Merge table cells",
	    		icons: {primary: "ui-icon-merge-cells"},
	        	handler: function(){self.mergeCells();},
	        	enabled: function(){return self._mergeCellsEnable();}
	    	},
	    	splitCells:{
	        	type: "button",
	        	label: "Split table cells",
	    		icons: {primary: "ui-icon-split-cells"},
	        	handler: function(){self.splitCells();},
	        	enabled: function(){return self._splitCellsEnable();}
	    	},
	    	tabsx:{
	        	type: "checkbox",
	        	label: "Tabsx",
	    		icons: {primary: "ui-icon-tabsx"},
	        	handler: function(){self.rteWidget("tabsx", o.formIds.tabsx, {style:{width:400,height:300}});},
	        	checked: function(){return self.rteWidgetActive("tabsx");}
	    	},
	    	sourcecode:{
	        	type: "checkbox",
	        	label: "Source Code",
	    		icons: {primary: "ui-icon-sourcecode"},
	        	handler: function(){self.option("mode",o.mode =="sourcecode"?"design":"sourcecode");},
	        	checked: function(){return o.mode =="sourcecode";},
	        	enabled:function(){return true;}
	    	}
	    };

	    $.each(actions, function(){
	    	this.text = false;
	    	if(!this.enabled){
	    		this.enabled = function(){
	    			return o.mode == "design";
	    		};
	    	}
	    });

	    return actions;
	},

	destroy: function() {
		var o = this.options, doc = o.doc;
		o.history=[];
		this.toolbar && this.toolbar.remove();
		this.source.unbind(".rte");
		$(doc).unbind(".rte");
		this.$body.unbind('.rte');
		$(o.win).unbind(".rte");
		$(window).unbind("resize.rte", this._proxy);
		this.element.removeClass( "an-rte" );
		return $.Widget.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
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

$.widget("an.tabsx", $.ui.tabs, {
	options: {
		'duration': 2000,
		'slideshow': false,
		'fxs': null
	},

	_create: function() {
		var self = this, o = this.options;
		if((o.mode == "edit"||o.mode == "browser") && o.slideshow){
			o.fx = o.fxs ? o.fxs : {'opacity' : 'toggle', 'duration' : 200};
		}
		$.ui.tabs.prototype._create.apply(this, arguments);
		this.element.addClass("an-tabsx");

		
		this._navMenu = $("<div id='nav-menu'>>><span>0</span></div>");
		this._navMenu.css({position:"relative","float":"left",width:"18px",height:"22px","font-size":"60%",border: "1px solid #CCCCCC",margin:'0px',padding:'0px'});
		this._navMenu.find("span").css({position:"absolute",right:"0px",bottom:"0px","font-size":"11px"});
		this._navMenu.hover(function(e){
			self._navMenu.css({border: "1px solid #AAAAAA",cursor : 'pointer',margin:'0px',padding:'0px'});
		},function(){
			self._navMenu.css({border: "1px solid #CCCCCC",margin:'0px',padding:'0px'});
		});
		
		if((o.mode == "edit"||o.mode == "browser") && o.slideshow){
			this._slideshow(o.duration);
		}else{
			this.element.bind( "tabsxadd.tabsx", $.proxy(this, "_showMenu") );
			this.element.bind( "tabsxshow.tabsx", $.proxy(this, "_showMenu") );
			this.element.bind( "tabsxremove.tabsx", $.proxy(this, "_showMenu"));
			this._proxy = $.proxy(this, "_showMenu");
			$(window).bind( "resize.tabsx", this._proxy);
		}
		
		if(o.showTabsContextMenu){
			this.list.menu({
				triggerEvent:"contextmenu",
				menuPosition:{my: "left top", at: "left bottom"},
				delay:false,
				actions: {
					close:{type:"menuItem", text:"Close", handler:$.proxy(self,"closeCurrent")},
					closeOthers:{type:"menuItem", text:"Close Others", handler:$.proxy(self,"closeOthers")},
					closeAll:{type:"menuItem", text:"Close All", handler:$.proxy(self,"closeAll")}
				},
				select: function(e,ui){ $(this).menu("collapseAll"); }
			});
		}
	},
	_slideshow: function(duration) {
		var self = this, o = this.options, overanchor = null, navWidth = 0;
		this.lis.each(function(){
			navWidth += $(this).outerWidth(true);
		});
		this.list.css({
			"width" : navWidth
		}).addClass('ui-tabs-slideshow-nav').removeClass("ui-widget-header");
		var rotate = function(e) {
			stop();
			self._rotation = setTimeout(function() {
				var t = o.selected;
                if(overanchor != null && overanchor == t){
                    stop();
                    return false;
                }
				self.select( ++t < self.anchors.length ? t : 0 );
                rotate();
			}, duration);
		};
		function stop(){
            clearTimeout(self._rotation);
            self._rotation = null;
        };
		if (duration) {
            this.anchors.bind('click',stop);
            this.anchors.bind('mouseover',function(){
                var index = self.anchors.index(this);
                if(o.selected == index){
                    stop();
                }else{
                    overanchor = index;
                }
            });
            this.anchors.bind('mouseout',function(){
                rotate();
                overanchor = null;
            });
            this.anchors.bind('mouseup',function(){
                $(this).parent().hasClass('ui-state-focus') && $(this).parent().removeClass('ui-state-focus');
            });
			rotate();
		}
		else {
			stop();
		}
		return this;
	},
	
	closeCurrent:function(){
		this.remove(this.option("selected"));
	},
	
	closeOthers:function(){
		var selected = this.option("selected");
		while(this.length()-1 > selected){
			this.remove(this.length()-1);
		}
		while(this.length()>1){
			this.remove(0);
		}
	},

	closeAll:function(){
		while(this.length()>0){
			this.remove(0);
		}
	},

	option: function(key, value) {
		if(key === "selectedPanel" && value === undefined){
			return this.panels.get(this.options.selected);
		}else if(key ==="panels" && value === undefined){
			return this.panels;
		}
		return $.Widget.prototype.option.apply(this, arguments);
	},
	
	_showMenu: function(e, ui){
		if(this.list.is(":hidden")) return;
		
		var self = this;
		if(e.type == "tabsxshow"){
			this.lis.each(function(k,v){
				var $v = $(v), hit = parseInt($v.attr("hit"))||0;
				$v.attr("hit", $v.is(".ui-tabs-selected")? 0 : hit+1);
			});
		}
		
		var liArray = this.lis.toArray(); 
		liArray.sort(function(x,y){
			var pre = parseInt($(x).attr("hit")), next = parseInt($(y).attr("hit"));
			return pre-next;
		});

		this._navMenu.appendTo(this.list);
		var width = this.list.width() - this._navMenu.outerWidth(true);
		this._navMenu.menu("destroy").detach();
		
		$.each(liArray, function(k,v){
			width -= $(v).outerWidth(true);
			$(v)[width>0?"show":"hide"]();
		});
		
		var hs = this.lis.filter(":hidden"),size = hs.size();
		if(size > 0){
			this._navMenu.find("span").html(size);
			var actions = {};
			hs.each(function(){
				var $this = $(this), item = $this.find("a:first"), id = item.attr("href").slice(1);
				actions[id] = {
						type: "menuItem",
						text: item.text(),
						handler: function(){
							self.element.tabsx("select", '#'+id);
						}
				};
			});
			self._navMenu.appendTo(this.list);
			self._navMenu.menu({
				triggerEvent:"click",
				menuPosition:{of: self._navMenu, my: "left top", at: "left bottom"},
				delay:false,
				actions: actions,
				select: function(e,ui){ $(this).menu("collapseAll"); }
			});
		}
	},

	remove: function( index ) {
		if(this._getIndex(index)== -1) return;
		return $.ui.tabs.prototype.remove.apply(this, arguments);
	},
	
	panel:function(index){
		return $(this.panels[this._getIndex( index )]);
	},
	
	_trigger: function( type, event, data ) {
		var prop, orig, callback = this.options[ type ];

		data = data || {};
		event = $.Event( event );
		event.type = ( type === this.widgetEventPrefix ?
			type :
			this.widgetEventPrefix + type ).toLowerCase();
		// the original event may come from any element
		// so we need to reset the target on the new event
		event.target = this.element[ 0 ];

		// copy original event properties over to the new event
		orig = event.originalEvent;
		if ( orig ) {
			for ( prop in orig ) {
				if ( !( prop in event ) ) {
					event[ prop ] = orig[ prop ];
				}
			}
		}

		!( $.isFunction(callback) &&	callback.call( this.element[0], event, data ) === false ||	event.isDefaultPrevented() );

		return this.element.trigger( event, data );
	},

	destroy: function() {
		var o = this.options;
		if(!o.destroyTabs){
			this.lis.add( this.panels ).each(function() {
				$.removeData(this,"destroy.tabs");
			});
		}
		$(window).unbind( "resize.tabsx", this._proxy);
		this.list.unbind(".tabsx");
		this.element.removeClass("an-tabsx" ).unbind( ".tabsx").removeData("tabsx");
		return $.ui.tabs.prototype.destroy.apply(this, arguments);
	}
});
}(jQuery));
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

$.widget( "an.explorer", $.an.tree, {
	
	_create: function() {
		$.an.tree.prototype._create.apply(this, arguments);
		var self = this;
		$(document).bind("documentCreated.explorer documentChanged.explorer documentDeleted.explorer", function(e,data){
			$.each($.isArray(data)?data:[data], function(k,v){
				if(e.type == "documentCreated" && v._path){
					var ids = v._path.split(","), id = ids[ids.length-3];
					self.refresh(id);
				}else{
					self.refresh(v._id);
					self.refresh(Model.GROUP_ROOT); // TODO: optimize the refreshing of explorer GROUP_ROOT.
				}
			});
		});
	},

	_defaultContentProvider: function(){
		var o = this.options;
		return {
			getRoots: function(mountNodes){
				var sel = {$or:[]};
				$.each(o.roots, function(){ sel.$or.push({_id:this}); });
				$.ans.getDoc(o.dbId,null,{selector:sel},function(err,data){
					var nodes = [];
					$.each(data.docs||[], function(k, root){
						nodes.push({ id: root._id, text: root.title, data: root, "class": "folder root" });
					});
					mountNodes(nodes);
				});
			},
			getChildren: function(parentNode,mountNodes){
				var d = parentNode.data, sel; 
				if(d._id == Model.EXTENSION_ROOT){
					sel = {type:Model.EXTENSION_POINT};
				}else if(d.type==Model.EXTENSION_POINT){
					sel = {extensionPoint:d._id};
				}else{
					sel = {_path:{$regex:'^'+d._path+'[^,]+,$'}};
					if(o.showUser&&(d.type == Model.GROUP)){
						sel = {$or:[sel,{type:Model.USER, _groupPaths:d._path}]};
					}else if(!o.showUser){
						sel = {$and:[sel,{type:{$ne:Model.USER}}]};
					}
				}

				$.ans.getDoc(o.dbId,null,{selector:sel},function(err,data){
					var nodes = [];
					$.each(data.docs, function(k, doc){
						nodes.push({ id: doc._id, text: doc.title, data: doc, parent:parentNode, "class": (doc.type == Model.CATEGORY||doc.type == Model.OU||doc.type == Model.GROUP||doc.type == Model. ROLE||doc.type==Model.EXTENSION_POINT) ? "folder":"file"});
					});
					mountNodes(nodes);
				});
			},
			hasChildren: function(node){
				var type = node.data.type;
				return type == Model.CATEGORY|| type == Model.OU||type == Model.GROUP||type == Model.ROLE||type==Model.EXTENSION_POINT;
			},
			getId: function(node){
				return node.id ? node.id : null;
			}
		};
	},
	
	destroy: function() {
		$(document).unbind(".explorer");
		$.an.tree.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );/*!
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

$.widget( "an.page", {
	options: {
		mode:'browser',
		actionSets: [],
		wrapper:"<div/>",
		modelType:'page',
		formIds:{
			button:["5080143085ac60df09000001","50de596da092007b11000001"],
		    tabsx:["5080143085ac60df09000001","51306faad58d1c129f000000"],
			box:["5080143085ac60df09000001","50de56d0a092007b11000000","50ea38efa0920073870000ef"],
            codearea:["5080143085ac60df09000001","51d66f5fedad572a8b0001ad"]
		},
		mFormIds:{
			tabsx:["5080143085ac60df09000001","51306faad58d1c129f000000"],
			box:["5080143085ac60df09000001","50de56d0a092007b11000000","50ea38efa0920073870000ef"],

			text:["5080143085ac60df09000001","519095a03bcccb65f400008b"],
			search:["5080143085ac60df09000001","51932b05ac8f2725e1000048"],
			password:["5080143085ac60df09000001","5185ac02a092006ca6000048"],
			checkbox:["5080143085ac60df09000001","519dbd9c3bcccb444800008c", "51a2ffeeac8f275c2700013b"],
			button:["5080143085ac60df09000001","51933105ac8f2712ab000069"],
			slider:["5080143085ac60df09000001","51a5a62dac8f2755d2000069"],
			datetime:["5080143085ac60df09000001","50af2da26cec663c0a00000b"],
			textarea:["5080143085ac60df09000001","50af2ca66cec663c0a000008"],
			tabsx:["5080143085ac60df09000001","51306faad58d1c129f000000"],
			file:["5080143085ac60df09000001","50ceb75ba092004120000000"],
			grid:["5080143085ac60df09000001","5089e21f2b2255080a000005"],
			jsrender:["5080143085ac60df09000001","514d0a46caa05a669e0005c8","514d0e9dcaa05a26e30001af","514d0825caa05a669e0002ae","514d5ef3ac8f27413200014e"],
			radio:["5080143085ac60df09000001","51a2b48dac8f2770b7000001","51850c1ca092003b12000024"],
			select:["5080143085ac60df09000001","51af125321c7d61a65000024","508259700b27990c0a000003"],
			box:["5080143085ac60df09000001","50de56d0a092007b11000000","50ea38efa0920073870000ef"],
		    rte:["5080143085ac60df09000001"],
            collapsible:["5080143085ac60df09000001","51a8639ebd94293c2f000081"],
			mobiledate:["5080143085ac60df09000001","51c967a3ba4682122900004a"],
		    toggle:["5080143085ac60df09000001","51a565753bcccb5b0e0000ac"],
		    navbar:["5080143085ac60df09000001", "51c17808caa05a042500004a", "51c02b6eac8f274167000120"],
		    listview:["5080143085ac60df09000001","51ad5e1f21c7d6296100006c","51ad54a921c7d63144000144"],
		    customhtml:["5080143085ac60df09000001","51c175e221c7d6118800023a"],
            swipe:["5080143085ac60df09000001","51ca58ebedad5734e8000023"]
		}
	},

	_create: function() {
		this.element.addClass("an-page");
		var o = this.options, page = o[this.widgetName];
		$.extend(this, eval("try{("+(page.methods||"{}")+")}catch(e){}"));

		o.cssFiles = o.cssFiles || [];
		o.jsFiles = o.jsFiles || [];
		if(o.mobile){
			o.cssFiles = ["stylesheets/jquery.mobile-1.3.1.min.css",
			              "stylesheets/jquery.an.mwidget.css"].concat(o.cssFiles);
			o.jsFiles = ["javascripts/jquery-1.8.2.js",
			             "javascripts/jquery.scrollto.js"].concat(o.jsFiles);
			o.formIds = o.mFormIds;
		}else{
			o.cssFiles = ["stylesheets/rte/rte-design.css",
			          "stylesheets/jquery-ui-1.8.24.custom.css",
			          "stylesheets/jquery.ui.timepicker.css",
			          "stylesheets/jquery.an.menu.css",
			          "stylesheets/jquery.an.agilegrid.css",
			          "stylesheets/jquery.an.tree.css",
			          "stylesheets/jquery.an.border.css",
			          "stylesheets/jquery.an.tabsx.css",
			          "stylesheets/jquery.an.toolbar.css",
			          "stylesheets/jquery.an.page.css",
			          "stylesheets/jquery.an.editor.css",
			          "stylesheets/jquery.an.formview.css",
			          "stylesheets/jquery.an.widget.css",
			          "stylesheets/jquery.an.tabsxwidget.css",
			          "stylesheets/jquery.an.box.css",
			          "stylesheets/jquery.an.fileinput.css",
			          "stylesheets/jquery.an.filefield.css",
			          "stylesheets/jquery.an.gridfield.css",
			          "stylesheets/jquery.colorpicker.css",
			          "stylesheets/jquery.ui.select.css",
			          "stylesheets/rte/paddinginput.css",
			          "stylesheets/jquery.an.rte.css",
			          "stylesheets/base.css"].concat(o.cssFiles);
	        o.jsFiles = ["javascripts/jquery-1.8.2.js",
	                     "javascripts/jquery.scrollto.js"].concat(o.jsFiles);
		}

		this._initPage();
	},

	_initPage:function(){
		this.refresh();
	},

	_createOutline:function(){
		var self = this, page = this.options[this.widgetName], root = this._getPage();
		return {
			getRoots: function(mountNodes){
				var nodes = new Array();
				nodes.push({id:"root", text:page.title||page.name||page._id, "class":"folder"});
				mountNodes(nodes);
			},
			getChildren: function(parentNode, mountNodes){
				var nodes = new Array();
				if(parentNode.id == "root"){
					root.find(".widget").each(function(){
						var $this = $(this), id = $this.attr("id");
						if($this.parent().closest(".widget").length == 0){
							nodes.push({id:id, text:id, "class":self._isContainer($this)?"folder":"file", data:self._getWidgetObj($this)});
						}
					});
				}else{
					root.find("#"+parentNode.id).find(".widget").each(function(){
						var $this = $(this), id = $this.attr("id");
						if($this.parent().closest(".widget").attr("id") == parentNode.id){
							nodes.push({id:id, text:id, "class":self._isContainer($this)?"folder":"file", data:self._getWidgetObj($this)});
						}
					});
				}
				mountNodes(nodes);
			},
			hasChildren: function(node){ return node["class"]=="folder"; },
			getId: function(node){ return node.id ? node.id : null; }
		};
	},

	_isContainer:function(el){
		return el.is("[type=tabsx], [type=box]");
	},

	_getWidgetObj:function(el){
		var widget = null, type = el.attr("type");
		if(el.is(".box")){
			widget = el.data(type);
		}else if(el.is(".widget")){
			widget = el.data(type+"widget");
		}
		return widget;
	},

	option: function(key, value) {
		var o = this.options;
		if(key === "actionSets" && value === undefined){
			return this._createActionSets();
		}else if(key === "outline" && value === undefined){
			return this._createOutline();
		}else if(key == "content" && value == undefined){
			if(o.isDirty) this._syncPageContent();
			return o[this.widgetName].content;
		}
		var ret = $.Widget.prototype.option.apply(this, arguments );
		return ret === undefined ? null : ret; // return null not undefined, avoid to return this dom element.
	},

	_setOption: function(key, value) {
		var o = this.options, oldValue = o[key];
		if(!equals(value,oldValue)){
			$.Widget.prototype._setOption.apply(this, arguments );
			this._handleChange(key,value,oldValue);
			this._trigger("optionchanged",null,{key:key, value:value, oldValue:oldValue});
		}
		return this;
	},

	_handleChange:function(key, value, oldValue){
		var o = this.options;
		if(key === "mode"){
			if(o.isDirty) this._syncPageContent();
			this.refresh();
		}else if(key === "page"){
			var page = o[this.widgetName];
			this.element.children("style").text(page.stylesheet);
			this.$page && !o.isDirty && this.$page.empty().html(page.content);
			if(this.rte){
				!o.isDirty && this.rte.rte("option","content",page.content);
				this.rte.rte("option","stylesheet", page.stylesheet);
			}
			this.refresh();
		}
	},

	refresh:function(){
		var o = this.options;
		this["_"+o.mode] && this["_"+o.mode]();
	},

	_browser:function(){
		this.rte && this.rte.hide();
		if(!this.$page){
			this._createPage();
		}else {
			this.$page.show();
			this._refreshWidgets();
		}
	},

	_edit:function(){
		this.rte && this.rte.hide();
		if(!this.$page){
			this._createPage();
		}else{
			this.$page.show();
			this._refreshWidgets();
		}
	},

	_design:function(){
		this.$page && this.$page.hide();
		if(!this.rte){
			var self = this, o = this.options, page = o[this.widgetName];
			Model.getDb(o.dbId, function(error,db){
				self._createRTE(db&&db.globalCss?db.globalCss+page.stylesheet:page.stylesheet);
			});
		}else{
			this.rte.show();
			this._refreshWidgets();
		}
	},

	getWidget:function(id){
		var self = this, o = this.options, page = o[this.widgetName], widget = null;
		this._getPage().find("#"+id).each(function(){
			var $this = $(this), filter = (o.mode=="design"? ".an-box:not(.raw),."+page.name : ".an-page");
			$this.parent().closest(filter).each(function(){
				if($(this).is('.'+page.name) || this == self.element[0]){
					widget = self._getWidgetObj($this);
					return false;
				}
			});
			if(widget) return false;
		});
		return widget;
	},

	showWidget:function(){
		var self = this;
		$.each(arguments,function(){
			var w = self.getWidget(this);
			w && w.widget().show();
		});
	},

	hideWidget:function(){
		var self = this;
		$.each(arguments,function(){
			var w = self.getWidget(this);
			w && w.widget().hide();
		});
	},

	_createPage:function(){
		var o = this.options, page = o[this.widgetName], el = this.element;
		$('<style type="text/css">'+(page.stylesheet||"")+'</style>').appendTo(el);
		this.$page = $(o.wrapper).addClass(page.name).html(page.content).appendTo(el);

		var data = {};
		data[this.widgetName] = this;
		$.each(eval("("+(o[this.widgetName].actions||"[]")+")"), function(k,action){
			el.bind(action.events, data, action.handler);
		});

		if(o.mobile)this._refreshMobileToolbar();
		this._refreshWidgets();
	},

	_refreshMobileToolbar:function(){
		try{
			var $page = this.element.parents(".ui-page-active"),
				o = $page.data( "mobile-page" ).options,
				pageRole = $page.jqmData( "role" ),
				pageTheme = o.theme;

			$( ":jqmData(role='header'), :jqmData(role='footer'), :jqmData(role='content')", $page ).jqmEnhanceable().each(function() {
				var $this = $( this ),
					role = $this.jqmData( "role" ),
					theme = $this.jqmData( "theme" ),
					contentTheme = theme || o.contentTheme || ( pageRole === "dialog" && pageTheme ),
					$headeranchors,
					leftbtn,
					rightbtn,
					backBtn;
				$this.addClass( "ui-" + role );

				//apply theming and markup modifications to page,header,content,footer
				if ( role === "header" || role === "footer" ) {
					var thisTheme = theme || ( role === "header" ? o.headerTheme : o.footerTheme ) || pageTheme;
					$this.addClass( "ui-bar-" + thisTheme ).attr( "role", role === "header" ? "banner" : "contentinfo" );
					if ( role === "header") {
						$headeranchors	= $this.children( "a, button" );
						leftbtn	= $headeranchors.hasClass( "ui-btn-left" );
						rightbtn = $headeranchors.hasClass( "ui-btn-right" );
						leftbtn = leftbtn || $headeranchors.eq( 0 ).not( ".ui-btn-right" ).addClass( "ui-btn-left" ).length;
						rightbtn = rightbtn || $headeranchors.eq( 1 ).addClass( "ui-btn-right" ).length;
					}
					// Auto-add back btn on pages beyond first view
					if ( o.addBackBtn &&
						role === "header" &&
						$( ".ui-page" ).length > 1 &&
						$page.jqmData( "url" ) !== $.mobile.path.stripHash( location.hash ) &&!leftbtn ) {
						backBtn = $( "<a href='javascript:void(0);' class='ui-btn-left' data-"+ $.mobile.ns +"rel='back' data-"+ $.mobile.ns +"icon='arrow-l'>"+ o.backBtnText +"</a>" ).attr( "data-"+ $.mobile.ns +"theme", o.backBtnTheme || thisTheme ).prependTo( $this );
					}
					// Page title
					$this.children( "h1, h2, h3, h4, h5, h6" ).addClass( "ui-title" ).attr({"role": "heading","aria-level": "1"});
				} else if ( role === "content" ) {
					if ( contentTheme ) {
						$this.addClass( "ui-body-" + ( contentTheme ) );
					}
					// Add ARIA role
					$this.attr( "role", "main" );
				}
			});
		}catch(e) {

		}

	},

	_createRTE:function(stylesheet){
		var self = this, o = this.options, page = o[this.widgetName];
		this.rte = $("<div class = 'rte'/>").appendTo(this.element).rte({
			content:page.content,
			cssFiles:o.cssFiles,
			jsFiles:o.jsFiles,
			dbId:o.dbId,
			mobile:o.mobile,
			modelType:o.modelType,
			stylesheet:stylesheet,
			cssClass:page.name,
			restore:function(page){self._refreshWidgets(page); },
			clean:function(page){
			    page.find(".widget").each(function(){
					var $this = $(this),wid;
					wid = self._getWidgetObj($this);
					wid&&wid.destroy();
				});
			},
			onload:function(){
				var sel = self.rte.rte("option","selection"), $doc = $(self.rte.rte("option","doc"));
				$doc.bind("paste.page",function(e){
					setTimeout(function(){
						self._refreshWidgets();
						self.rte.rte("updatePath");
						self._trigger("change",null, self);
					},20);
				}).bind("widgetdblclick.page widgetclick.page widgetchange.page click.page",function(e, widget){
					$doc.find(".widget.selected").removeClass("selected");
					if(e.type == "widgetclick" || e.type == "widgetdblclick"){
						if(widget.selectable(e.originalEvent)){
							var el = widget.widget();
							el.addClass("selected");
							!$.browser.chrome&&sel.select(el[0]);
							self._trigger("widgetselect",null, widget);
						}
						self.rte.rte("updatePath");
						if(e.type=="widgetdblclick"){
							var type = widget.option("type");
							if(self.rteWidgetActive(type)) self.rteWidget(type);
						}
					}
					self.rte.trigger(e, widget);
				});
				self._refreshWidgets();
				var data = {};
				data[self.widgetName] = self;
				self._trigger(self.widgetName+"create",null,data);
			}
		}).bind("change.page contentchange.page",function(e){
			self.option("isDirty",true);
			setTimeout(function(){ self._trigger("change",null, self);},20);
		}).bind("newwidget.page",function(e, widget){
			e.stopImmediatePropagation();
			self.refresh();
			self.option("isDirty",true);
			setTimeout(function(){ self._trigger("change",null, self);},20);
		});
	},

	_getPage:function(){
		return this.options.mode=="design" ? $(this.rte.rte("option","doc")): this.$page;
	},

	_refreshWidgets: function(page){
		var self = this;
		(page || this._getPage()).find(".widget").each(function(){
			self._refreshWidget($(this));
		});
		return this;
	},

	_refreshWidget: function(el){
		var self = this, o = this.options, type = el.attr("type");
		if(el.is(".box")){
			var actions = [], id = el.attr("id");
			$.each(o.boxToolbarActions||[],function(){
				if(this.boxName == id) actions.push(this);
			});
			if(el.is(".an-box")){
				el.data("box").option("mode", o.mode);
			}else{
				el.box({
					parent:function(){return self;},
					mode:o.mode,
					dbId:o.dbId,
					mobile:o.mobile,
					toolbarActions:actions,
					optionchanged:function(e,data){
						if(data.key == "metadata" || data.key == "attributes"){
							self.option("isDirty",true);
							setTimeout(function(){ self._trigger("change",null, self);},20);
						}
					}
				});
			}
		}else if(el.is("[type="+type+"]")){
			if(el.is(".an-"+type+"widget")){
				el.data(type+"widget").option("mode",o.mode);
			}else{
				el[type+"widget"]({
					parent:function(){return self;},
					mode:o.mode,
					dbId:o.dbId,
					mobile:o.mobile,
					optionchanged:function(e,data){
						if(data.key == "metadata" || data.key == "attributes"){
							self.option("isDirty",true);
							setTimeout(function(){ self._trigger("change",null, self);},20);
						}
					}
				});
			}
		}
	},

	_createActionSets:function(){
		if(this.options.mode == "design"){
			return [this._controlActionSet(),this._formatActionSet(), this._tableActionSet()];
		}
	},

	_controlActionSet:function(){
		var actions = this.rte.rte("option","actions");
		return this._createActionSet(["properties","cleanFormat"],actions);
	},

	_formatActionSet:function(){
		var actions = this.rte.rte("option","actions");
		return this._createActionSet(["bold","italic","underline","strikethrough","subscript",
		        "superscript","alignLeft","alignCenter","alignRight","alignFull","font","fontSize",
		        "format","leftToRight","rightToLeft","fontColor","backgroundColor","outdent",
		        "indent","orderedList","unorderedList","link","deleteLink","horizontalRule",
		        "blockQuote","blockElement","stopFloat","image"],actions);
	},

	_tableActionSet:function(){
		var actions = this.rte.rte("option","actions");
		return this._createActionSet(["table","tableProps","deleteTable","rowBefore","rowAfter","deleteRow",
		"columnBefore","columnAfter","deleteColumn", "cellProps","mergeCells",
		"splitCells"],actions);
	},

	_createActionSet:function(actionNames, actions){
		var actionSet = {};
		$.each(actionNames, function(){
			actionSet[this] = actions[this];
		});
		return actionSet;
	},

	_syncPageContent:function(){
		var page = this.options[this.widgetName];
		page.content = this.rte.rte("option","content");
		this.$page && this.$page.empty().html(page.content);
	},

	rteWidget: function(type,opts){
		this.rte && this.rte.rte("rteWidget", type, this.options.formIds[type], opts);
		return this;
	},

	rteWidgetActive: function(type){
		return this.rte && this.rte.rte("rteWidgetActive", type);
	},

	labelActive:function(){
		return this.rte && this.rte.rte("labelActive");
	},

	sourceCode:function(){
		if(this.rte){
			var mode = this.rte.rte("option", "mode");
			this.rte.rte("option", "mode", mode =="sourcecode"?"design":"sourcecode");
		}
	},

	sourceCodeActive:function(){
		return this.rte && this.rte.rte("option", "mode") == "sourcecode";
	},

	// TODO: optimize following code.
	handler: function(){self.option("mode",o.mode =="sourcecode"?"design":"sourcecode");},
	checked: function(){return o.mode =="sourcecode";},

	highlightWidget: function(id, highlight){
		var w = this.getWidget(id);
		w&&w.highlight(highlight);
		return this;
	},

	scrollTo: function(id, opts){
		var o = this.options;
		if(o.mode == "design"){
			var win = this.rte.rte("option","win");
			win.$("#"+id.replace(/\./g,"-")).ScrollTo(opts);
		}else{
			this.$page.find("#"+id).scrollTo(opts);
		}
	},

	save: function(){
		var self =this, o = this.options, page = o[this.widgetName];
		if(o.isDirty){
			this._syncPageContent();
			ModelupdateDocument(o.dbId, page._id,page,null,function(err,result){
				self.option("isDirty",false);
			});
		}
		return this;
	},

	print: function(){
		var o = this.options, loc = window.location,
		      url = loc.protocol +"//"+loc.host+"/pdfs?dbid="+o.dbId+"&pageid="+o[this.widgetName]._id;
		print(url);
		return this;
	},

	destroy: function() {
		$(this.options.document).unbind(".page");
		this.element.unbind(".page").removeClass("an-page").children("style").remove();
		return $.Widget.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
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

$.widget( "an.mpage", $.an.page, {
	_create: function() {
		this.element.addClass("an-mpage");
		if (this.widgetName == 'mpage') this.widgetName = 'page';
		$.an.page.prototype._create.apply(this, arguments);
	}
});
})( jQuery );/*!
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

$.widget( "an.form", $.an.page, {
	options: {
		document: {},
		printable: true,
		formIds:{
			text:["5080143085ac60df09000001","5092733215ca72150a000001"],
			password:["5080143085ac60df09000001","5185ac02a092006ca6000048"],
			checkbox:["5080143085ac60df09000001","50af2d266cec663c0a000009"],
			datetime:["5080143085ac60df09000001","50af2da26cec663c0a00000b"],
			mobiledate:["5080143085ac60df09000001","51c967a3ba4682122900004a"],
			textarea:["5080143085ac60df09000001","50af2ca66cec663c0a000008"],
			tabsx:["5080143085ac60df09000001","51306faad58d1c129f000000"],
			file:["5080143085ac60df09000001","50ceb75ba092004120000000"],
			grid:["5080143085ac60df09000001","5089e21f2b2255080a000005"],
			jsrender:["5080143085ac60df09000001","514d0a46caa05a669e0005c8","514d0e9dcaa05a26e30001af","514d0825caa05a669e0002ae","514d5ef3ac8f27413200014e"],
			radio:["5080143085ac60df09000001","50af2d626cec663c0a00000a","51850c1ca092003b12000024"],
			select:["5080143085ac60df09000001","51850b35a09200784a000122","508259700b27990c0a000003"],
			box:["5080143085ac60df09000001","50de56d0a092007b11000000","50ea38efa0920073870000ef"],
		    rte:["5080143085ac60df09000001"]
		},
		wrapper:"<form/>"
	},

	_create: function() {
		$.an.page.prototype._create.apply(this, arguments);
	},
	
	_initPage:function(){
		var self = this, o = this.options, el = this.element;
		el.addClass("an-form");
		
		o.cssFiles = o.cssFiles || [];
		o.cssFiles.push("stylesheets/jquery.an.form.css");
		
		o.document = $.type(o.document) == "function" ? o.document(): o.document;

		$(o.document).bind("docchanged.form",function(e,doc, oldDoc){
			self.refresh();
            el.trigger("documentchanged",e,[doc,oldDoc]);
		}).bind("propchanged.form",function(e,id,value,oldValue,trans){
			self.field(id, value);
		});
		
		$.an.page.prototype._initPage.apply(this, arguments);
	},

	option: function(key, value) {
		var o = this.options;
		if(key === "mode" && o.readonly){
			return;
		}else if(key === "isValid" && value === undefined && o.mode == "edit"){
			return this.validator.form();
		}
		return $.an.page.prototype.option.apply(this, arguments);
	},
	
	_getWidgetObj:function(el){
		if(el.is(".field")) return el.data(el.attr("type")+"field");
		return $.an.page.prototype._getWidgetObj.apply(this, arguments);
	},
	
	_handleChange:function(key, value, oldValue){
		var o = this.options;
		if(key === "document"){
			this.refresh();
		}else if(key === "url"){
			this.$page.find(".field.file").filefield("option","url",o.url);
			this.$page.find(".field.grid").gridfield("option","url",o.url);
		}
		return $.an.page.prototype._handleChange.apply(this, arguments);
	},

	_createPage:function(){
		$.an.page.prototype._createPage.apply(this, arguments);
		this.validator = this.$page.validate($.extend({
			meta:"validate",
			ignore:"",
			errorPlacement: function(error, el) {
				error.insertAfter(el.closest("div.field"));
			}
		},eval("("+(this.options[this.widgetName].validator||"{}")+")")));
	},
	
	_refreshWidget: function(el){
		var self = this, o = this.options, type = el.attr("type");
		if(el.is(".field")){
			var id = el.attr("id"); 
			if(id) id = id.replace(/-/g, ".");
			var doc = o.document, value = doc && doc.prop && doc.prop(id), field = el.data(type+"field"); 
			if(field){
			    field.option('mode',o.mode).option('value',value);
			    field.refresh();
			}else{
				var opts = {
					dbId:o.dbId,
					parent:function(){return self;},
					value:value,
					url:o.url,
					mode:o.mode,
					mobile:o.mobile,
					optionchanged:function(e,data){
						if(data.key == "value" && doc.prop){
							var id = $(e.target).attr("id");
							id = id&&id.replace(/-/g,".");
							var curValue = doc.prop(id);
							if(curValue != data.value ){
								doc.prop(id,data.value,data["transient"]);
							}
						}else if(data.key == "metadata" || data.key == "attributes"){
							self.option("isDirty",true);
							setTimeout(function(){ self._trigger("change",null, self);},20);
						}
					},
					resize:function(e,data){self.option("isDirty",true);}
				};

				if(type == "button"){
					el[type+"widget"]({parent:function(){return self;},label:el.attr("label")});
				}else{
					el[type+"field"] && el[type+"field"](opts);
				}
			}
		}else {
			$.an.page.prototype._refreshWidget.apply(this, arguments);
		}
	},

	field: function(id, value){
		var field = this._getPage().find("#"+id.replace(/\./g,"-")+".field"); 
		if(field.size() == 0) return;
		if(value === undefined){
			var v = null;
			field.each(function(){
				var $this = $(this), type = $this.attr("type");
				v = $this[type+"field"]("option","value");
				if(type=="radio" && v!=null) return false;
			});
			return v;
		}else{
			field[field.attr("type")+"field"]("option","value", value);
		}
	},

	label:function(){
		this.rte && this.rte.rte("label");
		return this;
	},
	
	reset:function(){
		var o = this.options,staticAttr=["type","_path"],doc=o.document._doc,_this=this;
		this.element.find("form")[0].reset();
		for(var q in doc){
			if(q=="_id"){
				doc[q]=new ObjectId().toString();
			}else if(q!="type"&&q!="_path"){
				delete doc[q];
			}
		}
		var field = this._getPage().find(".field"); 
		if(field.size() == 0) return;
		field.each(function(){
			if($(this).attr("type")=="select"){
				_this.field(this.id,$(this).find("select").val());
			}else if($.isFunction($(this)[$(this).attr("type")+"field"])){
				_this.field(this.id,"");
			}
			_this.getWidget(this.id)&&_this.getWidget(this.id).element.trigger("change");
		});
	},

	validate:function(){
		return this.validator?this.validator.form():true;
	},

	// TODO bug fix: 鎵撳嵃閿欒!
	print: function(){
		var o = this.options, docId = o.document.prop("_id"), loc = window.location, 
		      url = loc.protocol +"//"+loc.host+"/pdfs?dbid="+o.dbId+"&docid="+docId+"&formid="+o[this.widgetName]._id;
		print(url);
		return this;
	},

	destroy: function() {
		this.element.removeClass("an-form");
		return $.an.page.prototype.destroy.apply(this, arguments);
	}
});
})( jQuery );
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

$.widget( "an.agilegrid", {
	options:{
		selectionMode:"row",
		showTopHeader: true,
		showLeftHeader: true,
		isColumnResizable: false,
		isRowResizable: false,
		topHeaderHeight: 28,
		leftHeaderWidth: 50,
		defaultColWidth: 80,
		defaultRowHeight: 28,
		cellSelections: [],
		colSelections: {},
		rowSelections: {},
		focus: {row:0,col:0},
		pagerHeight: 28,
		currentPage: 0,
		totalPage: 0,
		colModel: {},
		rowModel: {},
		rowOffset: 0,
		limit: 30,
		rowCount: 0,
		totalRowCount: 0,
		totalColCount: 3,
		topHeaderRender: function(col, colProp){return colProp && colProp.label ? colProp.label : col;},
		leftHeaderRender: function(row){return row;},
		cellRender: function(row, col){ return row + "," + col; }
	},

	_create: function() {
		this.element.addClass("an-agilegrid").empty();
		var self = this, o = this.options;

		if(o.showLeftHeader && o.showTopHeader){
			this.topLeftCorner = $("<div class='top-left ui-widget-header'/>").css({
				left:0, top: 0, width: o.leftHeaderWidth, height: o.topHeaderHeight
			}).appendTo(this.element);
		}

		if(o.showTopHeader){
			this.topHeaderTable =$("<table cellspacing='0' cellpadding='0'><thead><tr/></thead></table>");
			this.topHeaderArea = $("<div class='top-header ui-widget-header'/>").css({
				left:o.showLeftHeader ? o.leftHeaderWidth + 1 : 0,  top: 0,
				right: 0, height: o.topHeaderHeight + 1
			}).append(this.topHeaderTable).appendTo(this.element).disableSelection();
		}
		
		if(o.showLeftHeader){
			this.leftHeaderTable =$("<table cellspacing='0' cellpadding='0'><thead></thead></table>");
			this.leftHeaderArea = $("<div class='left-header ui-widget-header'/>").css({
				left: 0, top: o.showTopHeader ? o.topHeaderHeight + 1 : 0,
				bottom: o.showPager?o.pagerHeight: 0, width: o.leftHeaderWidth + 1
			}).append(this.leftHeaderTable).appendTo(this.element).disableSelection();
		}

		this.contentArea = $("<div class='content-area'/>").css({
			left: o.showLeftHeader ? o.leftHeaderWidth + 1 : 0,
			top: o.showTopHeader ? o.topHeaderHeight + 1 : 0,
			bottom: o.showPager?o.pagerHeight: 0, right: 0
		}).appendTo(this.element).disableSelection();
	    this.contentTable=$("<table class='content' cellspacing='0' cellpadding='0'><tbody/></table>").appendTo(this.contentArea);

		if(o.showPager){
			this.pager = $("<div class='pager ui-widget-header'/>").css({
				left:0,right:0,bottom:0,height:o.pagerHeight
			}).appendTo(this.element);
			$.each(["first","prev","goto","next","last"], function(k,v){
				if(v == "goto"){
					self.pager.append("<div class='goto-page'>Page<input class='current-page' type='text' value='"+o.currentPage+"'>of<div class='total-page'>"+o.totalPage+"</div></div>");
					self.pager.delegate("input", "change.agilegrid", function(){
						var $this = $(this), p = $(this).val();
						if(p <= 0){
							p = 1;
							$this.val(p);
						}else if(p > o.totalPage){
							p = o.totalPage;
							$this.val(p);
						}
						self._trigger("gotopage",null,{page:p});
					});
				}else{
					$("<button class='pager-button'/>").attr("id",v).appendTo(self.pager).button({
						label: v,
			    		icons: {primary: "ui-icon-"+v+"-page"},
						text:false,
						disabled:true
					}).click(function(e){
						e.preventDefault();
						e.stopImmediatePropagation();
						self._trigger(v+"page",null,{currentPage:o.currentPage});
					});
				}
			});
			this.pager.append("<div class='info'>");
		}
		
		this.contentArea.scroll(function(){
			var pos = self.contentTable.position();
			if(o.showTopHeader) self.topHeaderTable.css("left", pos.left);
			if(o.showLeftHeader) 	self.leftHeaderTable.css("top", pos.top);
		});

		this.element.delegate(".top-header th>div","hover.agilegrid",function(e){
			if(o.isColumnResizable){
				$(this).resizable({
					handles: "e",
					resize: function(event, ui){
						self._columnWidth(parseInt(ui.element.parent().attr("index")), ui.size.width);
					}
				});
			} 
		}).delegate(".left-header th>div","hover.agilegrid",function(e){
			if(o.isRowResizable){
				$(this).resizable({
					handles: "s",
					resize: function(event, ui){
						self._rowHeight(o.rowOffset, parseInt(ui.element.parent().attr("index")), ui.size.height);
					}
				});
			}
		}).delegate(".top-header th","mousedown.agilegrid",function(e){
			if(o.selectionMode == "row") return;
			var col = parseInt($(this).attr("index"));
			if(e.ctrlKey){
				if(o.colSelections[col]){
					delete o.colSelections[col];
				}else{
					o.colSelections[col] = true;
				}
				self.contentTable.find("td[colindex="+col+"]")
				    .toggleClass("selected", o.colSelections[col]==true ? true: false);
				o.focus = $.extend(o.focus, {col: col});
			}else if(e.shiftKey){
				var colStart = Math.min(o.focus.col, col), colEnd = Math.max(o.focus.col, col);
				self.clearSelection();
				for(var i = colStart; i<=colEnd; i++){
					o.colSelections[i]=true;
					self.contentTable.find("td[colindex="+i+"]").addClass("selected");
				}
			}else{
				self.clearSelection();
				o.focus = $.extend(o.focus, {col:col});
				o.colSelections[col]=true;
				self.contentTable.find("td[colindex="+col+"]").addClass("selected");
				o.focus = $.extend(o.focus, {col: col});
			}
			self.mouseDownTopHeader = true;
		}).delegate(".top-header th","mousemove.agilegrid", function(e){
			if(self.mouseDownTopHeader){
				var col = parseInt($(this).attr("index")), colStart = Math.min(o.focus.col, col), 
				    colEnd = Math.max(o.focus.col, col);
				if(!e.ctrlKey) self.clearSelection();
				for(var i = colStart; i<=colEnd; i++){
					o.colSelections[i]=true;
					self.contentTable.find("td[colindex="+col+"]").addClass("selected");
				}
			}
		}).delegate(".left-header th","mousedown.agilegrid",function(e){
			if(o.selectionMode == "column") return;
			var rowIndex = parseInt($(this).attr("index")), row = o.rowOffset+rowIndex;
			if(e.ctrlKey){
				if(o.rowSelections[row]){
					delete o.rowSelections[row];
				}else{
					o.rowSelections[row] = true;
				}
				self.contentTable.find("tr[rowindex="+rowIndex+"]")
				    .toggleClass("selected", o.rowSelections[row]==true ? true: false);
				o.focus = $.extend(o.focus, {row: row});
			}else if(e.shiftKey){
				var rowStart = Math.min(o.focus.row, row), rowEnd = Math.max(o.focus.row, row);
				self.clearSelection();
				for(var i = rowStart; i<=rowEnd; i++){
					o.rowSelections[i]=true;
					self.contentTable.find("tr[rowindex="+(i-o.rowOffset)+"]").addClass("selected");
				}
			}else{
				self.clearSelection();
				o.focus = $.extend(o.focus, {row:row});
				o.rowSelections[row]=true;
				self.contentTable.find("tr[rowindex="+rowIndex+"]").addClass("selected");
				o.focus = $.extend(o.focus, {row: row});
			}
			self.mouseDownLeftHeader = true;
		}).delegate(".left-header th","mousemove.agilegrid", function(e){
			if(self.mouseDownLeftHeader){
				var rowIndex = parseInt($(this).attr("index")), row = o.rowOffset+rowIndex,
                      rowStart = Math.min(o.focus.row, row), rowEnd = Math.max(o.focus.row, row);
				if(!e.ctrlKey) self.clearSelection();
				for(var i = rowStart; i<=rowEnd; i++){
					o.rowSelections[i]=true;
					self.contentTable.find("tr[rowindex="+(i-o.rowOffset)+"]").addClass("selected");
				}
			}
		}).delegate(".content td","mousedown.agilegrid", function(e){
			var $this = $(this), rowIndex = parseInt($this.attr("rowindex")), 
			    colIndex = parseInt($this.attr("colindex")), row = o.rowOffset+rowIndex, col = colIndex;
			self.select(row,col,e.ctrlKey?"ctrl":(e.shiftKey?"shift":null));
			self.mouseDownContent = true;
		}).delegate(".content td","mousemove.agilegrid", function(e){
			if(self.mouseDownContent){
				var $this = $(this), rowIndex = parseInt($this.attr("rowindex")), 
				    colIndex = parseInt($this.attr("colindex")), row = o.rowOffset+rowIndex, col = colIndex;
				if(!e.ctrlKey) self.clearSelection();
				if(o.selectionMode == "row"){
					var rowStart = Math.min(o.focus.row, row), rowEnd = Math.max(o.focus.row, row);
					for(var i = rowStart; i<=rowEnd; i++){
						o.rowSelections[i]=true;
						self.contentTable.find("tr[rowindex="+(i-o.rowOffset)+"]").addClass("selected");
					}
				}else if(o.selectionMode == "column"){
					var colStart = Math.min(o.focus.col, col), colEnd = Math.max(o.focus.col, col);
					for(var i = colStart; i<=colEnd; i++){
						o.colSelections[i]=true;
						self.contentTable.find("td[colindex="+i+"]").addClass("selected");
					}
				}else{
					var rowStart = Math.min(o.focus.row, row), rowEnd = Math.max(o.focus.row, row),
					      colStart = Math.min(o.focus.col, col), colEnd = Math.max(o.focus.col, col);
					for(var row = rowStart; row<=rowEnd; row++){
						if(!o.cellSelections[row]) o.cellSelections[row] = []; 
						for(var col = colStart; col<=colEnd; col++){
							o.cellSelections[row][col]=true;
							self.contentTable.find("td[rowindex="+(row-o.rowOffset)+"][colindex="+col+"]").addClass("selected");
						}
					}
				}
			}
		}).delegate(".content td","dblclick.agilegrid click.agilegrid", function(e){
			var $this = $(this), rowIndex = parseInt($this.attr("rowindex")), colIndex = parseInt($this.attr("colindex"));
			self._trigger(e.type == "dblclick"? "celldblclick": "cellclick", e,{row:o.rowOffset+rowIndex, column:colIndex});
	    });

		o.topHeaderActions = o.topHeaderActions || function(colModel, col){
			var actions = {};
			actions["hide"] = {type: "menuItem",text: "Hide",handler: function(){self.hideColumn(col);}};
			if(o.columnEditable){
				actions["add"] = {type: "menuItem",text: "Add",handler: function(){self.editColumn(col,"add");}};
				actions["edit"] = {type: "menuItem",	text: "Edit",	handler: function(){self.editColumn(col);}};
				actions["del"] = {type: "menuItem",text: "Delete",handler: function(){self.removeColumn(col);}};
			}
			
			if(!$.isEmptyObject(colModel)){
				var colActions = {};
				$.each(colModel, function(k,v){
					colActions[v.name]={
							name: v.name,
							type: "checkbox",
							text: v.label,
							checked: !v.hide,
							handler: function(e,checked){
								var count = self.option("visibleColCount");
								if(count <= 1 && !checked){
									$(e.target).prop("checked", true);
								}else{
									self[checked?"showColumn":"hideColumn"](k);
								}
							}
					};
				});
				actions["show"] = {type:"submenu",text:"Show",children:colActions};
			}
			
			return actions;
		};
		
		o.leftHeaderActions = o.leftHeaderActions || function(row){
			var actions= {};
			return actions;
		};

		o.contentActions = o.contentActions || function(row,col){
			var actions= {};
			return actions;
		};

		this.element.bind("mouseup.agilegrid",function(){
        	delete self.mouseDownContent;
        	delete self.mouseDownLeftHeader;
        	delete self.mouseDownTopHeader;
        }).bind("contextmenu2.agilegrid contextmenu.agilegrid",function(e){
        	if((o.contextmenu2 && e.type == "contextmenu2")
        			||(!o.contextmenu2 && e.type == "contextmenu")){
        		var t = $(e.target), topHeader = t.closest(".top-header table"), th = t.parent("th"),
        		      actions = {}, cm = o.colModel;
        		if(topHeader.length > 0 && th.length > 0){
        			$.extend(actions,o.topHeaderActions(cm, parseInt(t.closest("th").attr("index"))));
        		}

        		var content = t.closest(".content"), td = t.closest("td");
				if(content.length > 0 && td.length > 0){
					var row = o.rowOffset+parseInt(td.attr("rowindex")), col = parseInt(td.attr("rowindex"));
					$.extend(actions, o.contentActions(row, col));
				}

        		if(!$.isEmptyObject(actions)){
        			t.menu({
        				autoShow: true,
        				menuPosition:{ of: e, my: "left top", at: "left bottom"	},
        				actions: actions,
        				select: function(e,ui){	$(this).menu("destroy");	},
        				collapseAll: function(e){	$(this).menu("destroy");	}
        			});
        		}
        		e.preventDefault();
        	}
		}).attr('tabIndex', -1).css('outline', 0).bind("keydown.agilegrid",function(e){
			self._keydown(e);
		});  // TODO keybord navigation isn't normal..
	},

	_init:function(){
		this.refresh();
	},
	
	_refreshLeftHeader: function(){
		var o = this.options, rm = o.rowModel, ro = o.rowOffset, thead = this.leftHeaderTable.find("thead");
		thead.empty();
		for(var i = 0; i < o.rowCount; i++){
			var tr = $("<tr/>");
			$("<th/>").attr("index",ro+i).css("display",rm[ro+i]&&rm[ro+i].hide?"none":"block")
			.append($("<div/>").css({
				width: o.leftHeaderWidth,
				height: (rm[ro+i]&&rm[ro+i].height) || o.defaultRowHeight,
				"line-height": (rm[ro+i]&&rm[ro+i].height) || o.defaultRowHeight+"px"
			}).html((rm[ro+i]&&rm[ro+i].render) || o.leftHeaderRender(ro+i, rm[ro+i]))).appendTo(tr);
			tr.appendTo(thead);
		}
	},
	
	_refreshTopHeader: function(){
		var o = this.options, cm = o.colModel, tr = this.topHeaderTable.find("tr");
		tr.empty();
		for(var i = 0; i < o.totalColCount; i++){
			$("<th/>").attr("index",i).css("display",cm[i]&&cm[i].hide?"none":"table-cell")
			.append($("<div/>").css({
		   	    width: (cm[i]&&cm[i].width) || o.defaultColWidth,
		   	    height: o.topHeaderHeight,
		   	    "line-height": o.topHeaderHeight+"px"
		    }).html((cm[i]&&cm[i].render) || o.topHeaderRender(i, cm[i]))).appendTo(tr);
		}
	},
	
	_refreshContent: function(){
		var o = this.options, cm = o.colModel, rm = o.rowModel, ro = o.rowOffset,
		    tbody = this.contentTable.children("tbody"), tr = $("<tr/>");

		tbody.detach().empty();
		for(var c = 0; c < o.totalColCount; c++){
			td = $("<td/>").attr("colindex", c).css("display",cm[c]&&cm[c].hide?"none":"table-cell")
			    .append($("<div/>").css("width",cm[c] && cm[c].width ? cm[c].width : o.defaultColWidth)).appendTo(tr);
		}

		for(var i = 0; i < o.rowCount; i++){
			var height = rm[ro+i] && rm[ro+i].height ? rm[ro+i].height : o.defaultRowHeight, clone = tr.clone();
			clone.css("display",rm[ro+i]&&rm[ro+i].hide?"none":"table-row").attr("rowindex",i)
			  .toggleClass("selected", o.rowSelections[ro+i]||(o.selectionMode == "row" && o.focus.row==ro+i))
			  .children("td").attr("rowindex",i).each(function(){
				var $this = $(this), c = parseInt($this.attr("colindex"));
				$this.toggleClass("selected", 
				    (o.cellSelections[ro+i]&&o.cellSelections[ro+i][c])||o.colSelections[c]
				    ||(o.focus.row==ro+i && o.focus.col == c)
				    ||(o.focus.col==c && o.selectionMode=="column"));
				$this.children("div").css({height : height, "line-height": height+"px"}).html(o.cellRender(ro+i,c));
			});
			clone.appendTo(tbody);
		}
		
		this.contentTable.append(tbody);
	},
	
	option:function(key,value){
		if(key === "visibleColCount" && value === undefined){
			return this.topHeaderTable.find("th:visible").length;
		}
		return $.Widget.prototype.option.apply(this, arguments );
	},
	
	_setOption: function(key, value) {
		var o = this.options, oldValue = o[key];
		if(!equals(value,oldValue)){
			$.Widget.prototype._setOption.apply(this, arguments );
			if(o.showPager&&(key == "currentPage" || key == "totalPage")){
				this._refreshPager();
			}
			this._trigger("optionchanged",null,{key:key, value:value, oldValue:oldValue});
		}
		return this; 
	},
	
	_refreshPager:function(){
		var o = this.options;
		if(o.totalPage <= 1){
			this.pager.find(".pager-button").button("disable");
		}else{
			this.pager.find(".pager-button").button("enable");
			if(o.currentPage <= 1){
				this.pager.find("#first").button("disable");
				this.pager.find("#prev").button("disable");
			}else if(o.currentPage >= o.totalPage){
				this.pager.find("#last").button("disable");
				this.pager.find("#next").button("disable");
			}
		}
		this.pager.find("input.current-page").val(o.currentPage);
		this.pager.find(".total-page").html(o.totalPage);
		this.pager.find(".info").html("Displaying "+(o.rowOffset+1)+" to "+(o.rowOffset+o.rowCount)+" of "+o.totalRowCount+" items.");
	},
	
	select: function(row,col,modified){
		var o = this.options;
		if(modified == "ctrl"){
			if(o.selectionMode == "row"){
				if(o.rowSelections[row]){
					delete o.rowSelections[row];
				}else{
					o.rowSelections[row] = true;
				}
				this.contentTable.find("tr[rowindex="+(row-o.rowOffset)+"]")
				    .toggleClass("selected", o.rowSelections[row]==true ? true: false);
			}else if(o.selectionMode == "column"){
				if(o.colSelections[col]){
					delete o.colSelections[col];
				}else{
					o.colSelections[col] = true;
				}
				this.contentTable.find("td[colindex="+col+"]")
				    .toggleClass("selected", o.colSelections[col]==true ? true: false);
			}else{
				if(!o.cellSelections[row]){
					o.cellSelections[row]=[];
					o.cellSelections[row][col]=true;
				}else{
					if(o.cellSelections[row][col]){
						delete o.cellSelections[row][col];
					}else{
						o.cellSelections[row][col]=true;
					}
				}
				this.contentTable.find("td[rowindex="+(row-o.rowOffset)+"][colindex="+col+"]")
				    .toggleClass("selected", o.cellSelections[row][col]=true?true:false);
			}
			o.focus = $.extend(o.focus, {row: row, col:col});
		}else if(modified == "shift"){
			if(o.selectionMode == "row"){
				var rowStart = Math.min(o.focus.row, row), rowEnd = Math.max(o.focus.row, row); 
				this.clearSelection();
				for(var i = rowStart; i<=rowEnd; i++){
					o.rowSelections[i]=true;
					this.contentTable.find("tr[rowindex="+(i-o.rowOffset)+"]").addClass("selected");
				}
			}else if(o.selectionMode == "column"){
				var colStart = Math.min(o.focus.col, col), colEnd = Math.max(o.focus.col, col);
				this.clearSelection();
				for(var i = colStart; i<=colEnd; i++){
					o.colSelections[i]=true;
					this.contentTable.find("td[colindex="+i+"]").addClass("selected");
				}
			}else{
				var rowStart = Math.min(o.focus.row, row), rowEnd = Math.max(o.focus.row, row),
				      colStart = Math.min(o.focus.col, col), colEnd = Math.max(o.focus.col, col);
				this.clearSelection();
				for(var r = rowStart; r<=rowEnd; r++){
					o.cellSelections[r] = o.cellSelections[r]||[]; 
					for(var c = colStart; c<=colEnd; c++){
						o.cellSelections[r][c]=true;
						this.contentTable.find("td[rowindex="+(r-o.rowOffset)+"][colindex="+c+"]").addClass("selected");
					}
				}
			}
		}else{
			this.clearSelection();
			if(o.selectionMode == "row"){
				o.rowSelections[row]=true;
				this.contentTable.find("tr[rowindex="+(row-o.rowOffset)+"]").addClass("selected");
			}else if(o.selectionMode == "column"){
				o.colSelections[col]=true;
				this.contentTable.find("td[colindex="+col+"]").addClass("selected");
			}else{
				o.cellSelections[row] = [];
				o.cellSelections[row][col] = true;
				this.contentTable.find("td[rowindex="+(row-o.rowOffset)+"][colindex="+col+"]")
				    .addClass("selected");
			}
			o.focus = $.extend(o.focus, {row: row, col:col});
		}
	},
	
	clearSelection: function(){
		var o = this.options;
		o.cellSelections = [];
		o.rowSelections = {};
		o.colSelections = {};
		if(o.showTopHeader){
			this.topHeaderTable.find(".selected").removeClass("selected");
		}
		if(o.showLeftHeader){
			this.leftHeaderTable.find(".selected").removeClass("selected");
		}
		this.contentTable.find(".selected").removeClass("selected");
	},
	
	_keydown: function( event ) {
		var keyCode = $.ui.keyCode, o = this.options; 
		
		if(event.shiftKey && !this.shiftKeyDown){
			this.shiftKeyDown = {row:o.focus.row,col:o.focus.col};
		}else if(!event.shiftKey){
			delete this.shiftKeyDown;
		}
		
		switch(event.keyCode) {
		case keyCode.LEFT:
			if(o.focus.col>0) 
				this.select(o.focus.row, event.shiftKey? --this.shiftKeyDown.col: o.focus.col-1, event.shiftKey?"shift":null);
			break;
		case keyCode.RIGHT:
			if(o.focus.col<o.totalColCount-1) 
				this.select(o.focus.row, event.shiftKey? ++this.shiftKeyDown.col: o.focus.col+1, event.shiftKey?"shift":null);
			break;
		case keyCode.UP:
			if(o.focus.row>0) 
				this.select(event.shiftKey?--this.shiftKeyDown.row: o.focus.row-1, o.focus.col, event.shiftKey?"shift":null);
			break;
		case keyCode.DOWN:
			if(o.focus.row<o.rowCount-1) 
				this.select(event.shiftKey?++this.shiftKeyDown.row: o.focus.row+1, o.focus.col, event.shiftKey?"shift":null);
			break;
		case keyCode.SPACE:
		case keyCode.ENTER:
			break;
		}

		return true;
	},

	_columnWidth: function(col, width){
		var o = this.options, cm = o.colModel, oldcm = $.extend({},cm);
		cm[col] = cm[col] || {name:col, label:col};
		oldWidth = cm[col].width || o.defaultColWidth; 
		cm[col].width = width;
		if(o.showTopHeader){
			this.topHeaderTable.find("th[index="+col+"]>div").css("width", width);
		}
		this.contentTable.find("td[colindex="+col+"]>div").css("width", width);
		this._trigger("optionchanged",null, {key:"colModel", value:cm, oldValue:oldcm});
	},
	
	_rowHeight: function(rowOffset, index, height){
		var o = this.options, rm = o.rowModel, row = rowOffset+index, oldrm = $.extend({},rm);
		rm[row] = rm[row] || {};
		oldHeight = rm[row].height || o.defaultRowHeight; 
		rm[row].height = height;
		if(o.showLeftHeader){
			this.leftHeaderTable.find("th[index="+index+"]>div").css({height:height, "line-height":height+"px"});
		}
		this.contentTable.find("td[rowindex="+index+"]>div").css("height", height);
		this._trigger("optionchanged",null, {key:"rowModel", value:rm, oldValue:oldrm});
	},
	
	insertColumn: function(col,colProp){
		var o = this.options, oldcm = $.extend(true,{},o.colModel), newcm = {};
		$.each(oldcm, function(k,v){
			if(k < col){
				newcm[k] = v;
			}else{
				newcm[parseInt(k)+1] = v;
			}
		});
		newcm[col] = colProp;
		o.colModel = newcm;
		o.totalColCount = o.totalColCount+1;
		this._adjustWidth();
		this._trigger("optionchanged", null, {key:"colModel", value:newcm, oldValue:oldcm});
	},
	
	removeColumn: function(col){
		var o = this.options, cm = o.colModel, oldcm = $.extend(true,{},cm);
		$.each(cm, function(k,v){
			if(k >= col && k < o.totalColCount - 1) {
				cm[k] = oldcm[parseInt(k)+1];
			}else if(k == o.totalColCount - 1){
				delete cm[k];
			}
		});
		o.totalColCount = o.totalColCount-1;
		this._adjustWidth();
		this._trigger("optionchanged", null, {key:"colModel", value:cm, oldValue:oldcm});
	},
	
	showColumn: function(col){
		var o = this.options, cm = o.colModel, oldcm = $.extend(true,{},cm);
		if(cm[col] && cm[col].hide) {
			cm[col].hide = false;
		}else{
			return;
		}
		this.topHeaderTable.find("th[index="+col+"]").show();
		this.contentTable.find("td[colindex="+col+"]").show();
		this._trigger("optionchanged",null, {key:"colModel", value:cm, oldValue:oldcm});
	},
	
	editColumn: function(col,hint){
		var self = this, o = this.options, cm = o.colModel, oldcm = $.extend(true,{},cm), 
		      colProp = (hint=="add"?{name:"",label:""}:cm[col]);
		$("<div/>").dialog({
			title: hint=="add" ? "Add Column" : "Edit Column",
			height: 260,
			width: 380,
			modal: true,
			create: function(event, ui){
				var $this = $(this);
				$.ans.getDoc(o.dbId, "50acda5e9555dbe125000004", null, function(err,form){
					$this.editor({document:colProp, forms:[form] ,dbId:o.dbId, mode:"edit", ignoreEscape:true});
				});
			},
			buttons: {
				OK: function() {
					var $this= $(this), cp = $this.editor("option","document");
					if(hint == "add"){
						self.insertColumn(col, cp);
					}else{
						cm[col] = cm[col]||{};
						$.extend(cm[col],cp);
						self._refreshTopHeader();
						self._trigger("optionchanged",null, {key:"colModel", value:cm, oldValue:oldcm});
					}
					self.option("isDirty",true);
					$this.dialog("close");
				},
				Cancel: function() { $( this ).dialog( "close" );}
			},
			close: function(e, ui){$(this).remove();}
		});		
	},
	
	hideColumn: function(col){
		var o = this.options, cm = o.colModel, oldcm = $.extend(true,{},cm);
		cm[col] = cm[col] || {name:col,label:col};
		cm[col].hide = true;
		this.topHeaderTable.find("th[index="+col+"]").hide();
		this.contentTable.find("td[colindex="+col+"]").hide();
		this._trigger("optionchanged", null, {key:"colModel", value:cm, oldValue:oldcm});
	},

	showRow: function(row){
		var o = this.options, rm = o.rowModel, oldrm = $.extend(true,{},rm);
		if(rm[row] && rm[row].hide) {
			delete rm[row].hide;
		}else{
			return;
		}
		this.leftHeaderTable.find("th[index="+row+"]").hide();
		this.contentTable.find("td[rowindex="+row+"]").hide();
		this._trigger("optionchanged",null, {key:"rowModel", value:rm, oldValue:oldrm});
	},
	
	hideRow: function(row){
		var o = this.options, rm = o.rowModel, oldrm = $.extend(true,{},rm);
		rm[row] = rm[row] ? rm[row] : {};
		rm[row].hide = true;
		this._adjustHeight();
		this._trigger("optionchanged", null, {key:"rowModel", value:rm, oldValue:oldrm});
	},

	_adjustWidth:function(){
		this._refreshTopHeader();
		this._refreshContent();
		return this;
	},

	_adjustHeight:function(){
		this._refreshLeftHeader();
		this._refreshContent();
		return this;
	},
	
	refresh:function(){
		var o = this.options;
		if(o.showTopHeader) this._refreshTopHeader();
		if(o.showLeftHeader) this._refreshLeftHeader();
		this._refreshContent();
		if(o.showPager) this._refreshPager();
		return this;
	},
	
	destroy: function() {
		this.element.removeClass("an-agilegrid").unbind(".agilegrid")
		    .undelegate(".top-header th>div",".agilegrid")
		    .undelegate(".left-header th>div",".agilegri")
		    .undelegate(".content td>div",".agilegrid");

		$.Widget.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );/*!
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

$.widget( "an.toolbar", {
	options: {},

	_create: function() {
		this.element.addClass("an-toolbar");
		var o = this.options;
		if(o.startAction || o.globalActionSet || o.actionSets){ 
			this.element.empty();
			this._createActionSets();
			this.refresh();
		}
	},
	
	_createActionSets:function(){
		var self = this, o = this.options, ass = [];
		if(o.startAction) ass.push(o.startAction);
		if(o.globalActionSet) ass.push(o.globalActionSet);
		ass = ass.concat(o.actionSets||[]);
		this.actionSets = ass;
		$.each(ass,function(i,j){
			$.each(j,function(k,v){
				var node = null;
				switch(v.type){
				case "button":
					if(k == "startAction"){
						v.element = $("<button class='action start-menu'/>").button({
							label:v.label,
							icons: { primary: "ui-icon-home", secondary: "ui-icon-triangle-1-s"}
						}).prependTo(self.element);
						v.element.menu({
							triggerEvent:"click",
							menuPosition:{ of: v.element, my: "left top", at: "left bottom" },
							actions: v.actions,
							select: function(){ $(this).menu("collapseAll"); }
						});						
					}else{
						v.element = $("<button class='action'/>").button({
					    	label:v.label,
					    	text: v.text,
					    	icons: v.icons
					    }).appendTo(self.element).click(function(e){
					    	if(v.handler) v.handler(e);
							e.preventDefault();
							e.stopImmediatePropagation();
					    });
					}
				    break;
				case "checkbox":{
					var input = $("<input class='action' type='checkbox' id = '"+new ObjectId().toString()+"'/>").appendTo(self.element);
					$("<label for='"+input.attr("id")+"' class='action'></label>").insertAfter(input);
					v.element = input.button({
				    	label:v.label,
				    	text: v.text,
				    	icons: v.icons
				    }).click(function(e){
				    	if(v.handler) v.handler(e);
						e.preventDefault();
						e.stopImmediatePropagation();
				    });
				}
				    break;
				case "radio":{
					var input = $("<input class='action' type='radio' name = '"+v.name+"' id = '"+new ObjectId().toString()+"'/>").appendTo(self.element);
					$("<label for='"+input.attr("id")+"' class='action'></label>").insertAfter(input);
					v.element = input.button({
				    	label:v.label,
				    	text: v.text,
				    	icons: v.icons
				    }).click(function(e){
				    	if(v.handler) v.handler(e);
						e.preventDefault();
						e.stopImmediatePropagation();
				    });
				}
					break;
				case "select":
					node = $("<acronym class='action'/>").attr("title", v.label)
					.elSelect({
						labelTpl : v.labelTpl,
						tpl      : v.tpl,
						select   : v.select,
						src      : v.src
					}).appendTo(self.element);
					node.data("select", node);
					v.element = node;
				    break;
				case "colorPicker":
					node = $("<button class='action'/>").button({
				    	label:v.label,
				    	text: v.text,
				    	icons: v.icons				    	
					}).appendTo(self.element).ColorPicker({color:v.color,handler  : v.handler});
					node.data("select", node);
					v.element = node;
				    break;
				default:
					break;
				}
				if(v.iconFile){
					var icon;
					if(v.type == "checkbox"){
						var sid = v.element.attr("id");
						icon = v.element.siblings("label[for="+sid+"]").find('.'+v.icons.primary);
					}else{
						icon = v.element.find('.'+v.icons.primary);
					}
					icon.css("background-image","url("+v.iconFile+")");
				}
			});
		});
	},

	refresh: function(){
		$.each(this.actionSets,function(i,j){
			$.each(j, function(k,v){
				switch(v.type){
				case "button":
				case "checkbox":
				case "radio":
					if(v.enabled()){
						v.element.button("enable");	
						if(v.type == "checkbox" || v.type == "radio"){
							v.element.prop("checked", v.checked());
							v.element.button("refresh");
						}
					}else{
						v.element.button("disable");
					}
					break;
				case "colorPicker":
				case "select":
					v.element.toggleClass("disabled", !v.enabled());
					break;
				}
			});
		});
	},
	
	value: function(selId, val){
		this.element.find("#"+selId).data("select").val(val);
		return this;
	},
	
	option: function( key, value) {
		if  (key == "isEmpty" && value === undefined){
			return this.element.children().length == 0;
		}
		return $.Widget.prototype.option.apply(this, arguments ); 
	},
	
	_setOption: function(key, value) {
		var o = this.options, oldValue = o[key];
		if(!equals(value,oldValue)){
			$.Widget.prototype._setOption.apply(this, arguments );
			if(key == "actionSets"){
				this.element.empty();
				this._createActionSets();
				this.refresh();
			}
			this._trigger("optionchanged",null,{key:key, value:value, oldValue:oldValue, "transient":o["transient"]});
		}
		return this; 
	},
	
	destroy: function() {
		this.element.removeClass( "an-toolbar" );
		$.Widget.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
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

$.widget( "an.view", {
	options:{
		mode: "browser",
		actionSets:[]
	},

	_create: function(){
		var o = this.options, el = this.element;
		el.addClass("an-view").addClass(o.view.name).empty();
		$('<style type="text/css">'+(o.view.stylesheet||"")+'</style>').appendTo(el);

		o.limit = o.limit||parseInt(o.view.limit)||10;
		o.skip = o.skip||parseInt(o.view.skip)||0;
		o.total = o.total||parseInt(o.view.total)||0;
		o.filter = o.filter||o.view.filter;
		o.showPager = o.showPager||o.view.showPager;

		try{$.extend(this, eval("("+(o.view.methods||"{}")+")"));}catch(e){console.log(e);};

		var data = {};
		data[this.widgetName] = this;
		$.each(eval("("+(o.view.actions||"[]")+")"), function(k,action){
			el.bind(action.events, data, action.handler);
		});

		o.showPager&&this._createPager();

		this.docs = [];
		this._loadDocs();
	},

	option: function(key, value) {
		var ret = $.Widget.prototype.option.apply(this, arguments );
		return ret === undefined ? null : ret; // return null not undefined, avoid to return this dom element.
	},

	_setOption: function(key, value){
		var oldValue = this.options[key];
		if(!equals(value,oldValue)){
			$.Widget.prototype._setOption.apply(this, arguments );
			this._handleChange && this._handleChange(key,value,oldValue);
			this._trigger("optionchanged",null,{key:key,value:value,oldValue:oldValue});
		}
		return this;
	},

	_handleChange:function(key,value,oldValue){
		if(key === "mode" || key === "view"){
			this.refresh();
		}
	},

	_createPager:function(){
		var o = this.options,self=this;
		this.pager = $("<div style='display:none;' class='pager'/>").css({
			left:0,right:0,bottom:0,height:o.pagerHeight
		}).appendTo(this.element);
		this.pager.addClass(o.className);
		$.each(["first","prev","goto","next","last"], function(k,v){
			if(v == "goto"){
				self.pager.append("<div class='goto-page'>Page<input class='current-page' type='text' value='"+o.currentPage+"'>of<div class='total-page'>"+o.totalPage+"</div></div>");
				self.pager.delegate("input", "change.pager", function(){
					var $this = $(this), p = $(this).val();
					if(p <= 0){
						p = 1;
						$this.val(p);
					}else if(p > o.totalPage){
						p = o.totalPage;
						$this.val(p);
					}
					self.gotopage(p);
				});
			}else{
				$("<button class='pager-button'/>").attr("id",v).appendTo(self.pager).button({
					label:$.i18n.pager?$.i18n.pager[v]:v,
					icons: {primary: "ui-icon-"+v+"-page"},
					text:false,
					disabled:true
				}).click(function(e){
					e.preventDefault();
					e.stopImmediatePropagation();
					self[v+"page"]();
				});
			}
		});

		this.pager.append("<div class='info'>");
	},

	firstpage:function(e,data){
		this.options.skip = 0;
		this._loadDocs();
	},

	prevpage:function(){
		var o = this.options;
		o.skip = o.skip - o.limit;
		this._loadDocs();
	},

	gotopage:function(page){
		var o = this.options;
		o.skip = (page-1)*o.limit;
		this._loadDocs();
	},

	nextpage:function(){
		var o = this.options;
		o.skip = o.skip + o.limit;
		this._loadDocs();
	},

	lastpage:function(){
		var o = this.options;
		o.skip = Math.floor(o.total/o.limit)*o.limit;
		this._loadDocs();
	},

	refresh:function(){
		var o = this.options;
		this['_'+o.mode]&&this['_'+o.mode]();
		this._refreshPager();
	},

	_refreshPager:function(){
		var o = this.options;
		if(this.pager){
			if(o.totalPage <= 1){
				this.pager.hide();
				return this;
			}
			this.pager.show();
			this.pager.find(".pager-button").button("enable");
			if(o.currentPage <= 1){
				this.pager.find("#first").button("disable");
				this.pager.find("#prev").button("disable");
			}else if(o.currentPage >= o.totalPage){
				this.pager.find("#last").button("disable");
				this.pager.find("#next").button("disable");
			}
			this.pager.find("input.current-page").val(o.currentPage);
			this.pager.find(".total-page").html(o.totalPage);
			var currentNums=o.currentPage==o.totalPage?(o.limit*(o.currentPage-1)+o.total%o.limit):o.limit*o.currentPage,info="";
			if($.i18n.pager){
				info = $.i18n.pager.display.replace(/{total}/,o.total).replace(/{currentPagerFirst}/,(o.limit*(o.currentPage-1)+1)).replace(/{currentPagerLast}/,currentNums);
			}else{
				info = "Displaying "+(o.limit*(o.currentPage-1)+1)+" to "+currentNums+" of "+o.total+" items.";
			}
			this.pager.find(".info").html(info);
		}
	},

	reload: function(){
		this._loadDocs();
	},

	_loadDocs:function(){
		var self = this, o = this.options, sel = o.view.selector, filter= o.filter,opts = {skip:o.skip,limit:o.limit},selectorStr, taskUrl = o.view.taskUrl;

		if($.type(o.view.sort)=="string"){
			opts.sort=eval("("+o.view.sort+")");
		}

        if($.type(taskUrl) == 'string' && taskUrl.replace(/(^\s*)|(\s*$)/g,'') != ''){
            var param = {};
            param.taskFilter = typeof filter == 'string' ? eval("("+filter+")") : filter;
            param.skip = o.skip;
            param.limit = o.limit;
            param.sort = opts.sort || o.view.sort;
            param.options = {exec : true, redirect : true};
            $.ans.getDoc(o.dbId,taskUrl,param,function(err,data){
                self.docs = data.docs;
				try{self._docsLoaded && self._docsLoaded();}catch(e){};
				self._trigger("documentloaded",null,data);
            })
            return;
        }

		if($.type(sel)=="string"&&sel.replace(/\s/g,"")){
			sel = eval("("+sel+")");
			if($.type(filter)=="string"){
				selectorStr=filter.replace(/\s/g,"")?{selector:sel,filter:eval("("+filter+")"),options:opts}:{selector:sel,options:opts};
			}else{
				selectorStr=filter?{selector:sel,filter:filter,options:opts}:{selector:sel,options:opts};
			}
			$.ans.getDoc(o.dbId,null,selectorStr,function(err,data){
				self.docs = data.docs;
				o.total = data.total;
				if(self.pager){
					o.currentPage = Math.floor(o.skip/o.limit+1);
					o.totalPage = Math.ceil(o.total/o.limit);
				}
				try{self._docsLoaded && self._docsLoaded();}catch(e){};
				self._trigger("documentloaded",null,data);
			});
		}
	},

	_getRow: function(row){
		return this.docs[row-this.options.skip];
	},

	_delRow: function(row){
		var self = this, o = this.options;
		Model.deleteDocument(o.dbId, this.docs[row-o.skip]._id,null, function(err,result){
			self._loadDocs();
		});
	},

	save:function(){
		var self = this, o = this.options, view = o.view;
		Model.updateDocument(o.dbId, view._id, view, null, function(err,result){
			self.option("isDirty",false);
		});
	},

	destroy: function() {
		this.element.children("style").remove();
		this.element.unbind(".view").empty();
		$.Widget.prototype.destroy.apply(this,arguments);
	}
});
})( jQuery );
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

$.widget( "an.gridview", $.an.view, {
	options: {
		printable: false
	},

	_create: function(){
		$.an.view.prototype._create.apply(this, arguments);
		this.element.addClass("an-gridview");
		var self = this, o = this.options;
		if(o.view.cellRender) o.cellRender = eval("("+o.view.cellRender+")");
		this.element.agilegrid($.extend({
			rowOffset: o.skip,
			showPager: o.showPager,
			dbId:o.dbId,
			leftHeaderRender: function(row){return row+1;},
			cellRender: function(row, col){
				var value = "", r = self._getRow(row), cm = this.colModel, c = cm[col];
				if(o.cellRender){
					value = o.cellRender(row,col,doc,cm);
				}else{
					if( r && c) { value =  eval("try{r['"+c.name+"']}catch(e){}"); }
				}
				return value?value+"":"";
			},
			firstpage:function(e,data){ o.skip = 0; self._loadDocs();	},
			prevpage:function(e, data){ o.skip = o.skip - o.limit; self._loadDocs(); },
			gotopage:function(e,data){ o.skip = (data.page-1)*o.limit; self._loadDocs(); },
			nextpage:function(e,data){ o.skip = o.skip + o.limit; self._loadDocs(); },
			lastpage:function(e,data){ o.skip = Math.floor(o.total/o.limit)*o.limit; self._loadDocs(); },
			celldblclick:function(e,data){ self._trigger("docdblclick", e, self.docs[data.row-o.skip]); },
			cellclick:function(e,data){ self._trigger("docclick", e, self.docs[data.row-o.skip]); },
			contentActions:function(row,col){ return o.contentActions(self.docs[row-o.skip]);},
			optionchanged:function(e,data){if(data.key == "colModel" && o.mode == "design") self.option("isDirty", true);}
		},o.view.options));
		
		this.refresh();
	},

	_docsLoaded:function(){
		var o = this.options, rc = this.docs.length;
		this.element.agilegrid({
			currentPage: Math.floor(o.skip/o.limit+1),
			totalPage: Math.ceil(o.total/o.limit),
			rowOffset: o.skip,
			rowCount: rc,
			totalRowCount: o.total
		});
	},
	
	_design:function(){
		this.element.agilegrid({
			columnEditable:true,
			isColumnResizable:true,
			isRowResizable:true
		});		
	},
	
	_browser:function(){
		this.element.agilegrid($.extend({
			columnEditable:false,
			isColumnResizable:false,
			isRowResizable:false
		},this.options.view.options));		
	},
	
	_createPager:function(){
	},
	
	save:function(){
		$.extend(this.options.view.options, this._viewOptions());
		return $.an.view.prototype.save.apply(this,arguments);
	},
	
	option: function(key, value) {
		if(key === "viewOptions" && value===undefined){
			return this._viewOptions();
		}
		return $.an.view.prototype.option.apply(this, arguments);
	},
	
	_viewOptions:function(){
		var self = this, value = {};
		$.each(["showTopHeader","showLeftHeader","isColumnResizable",
		        "isRowResizable","topHeaderHeight","leftHeaderWidth","defaultColWidth",
		        "defaultRowHeight","colModel","rowModel","totalColCount"],function(k,v){
			value[v] = self.element.agilegrid("option",v);
		});
		return value;
	},
	
	print: function(){ 
		var o = this.options, loc = window.location, 
		      url = loc.protocol +"//"+loc.host+"/pdfs?dbid="+o.dbId+"&viewid="+o.view._id;
		print(url);
	},
	
	destroy: function() {
		this.element.agilegrid("destroy").unbind(".gridview").removeClass("an-gridview");
		$.an.view.prototype.destroy.apply(this,arguments);
	}
});
})( jQuery );
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

$.widget( "an.formview", $.an.view, {
	options: {
		printable: false,
		pagerPosition: "bottom", // bottom, both sides
		itemWidth: 320,
		itemHeight: 280
	},

	_create: function(){
		$.an.view.prototype._create.apply(this, arguments);
		var o = this.options, el = this.element;
		o.showPager = o.view.showPager;
		o.itemWidth = o.view.itemWidth;
		o.itemHeight = o.view.itemHeight;
		el.addClass("an-formview");
		this.documents = $("<div class='content'/>").prependTo(el);
	},

	_showDocuments:function(){
		var self = this, o = this.options;
		this.documents.empty();
		var oFragment = document.createDocumentFragment();
		$.each(this.docs, function(k,doc){
			var ed = $("<div class='grid-item'/>").css({width:o.itemWidth, height:o.itemHeight});
			oFragment.appendChild(ed[0]);
			ed.editor({ dbId:o.dbId, document: doc, forms:[o.form],readOnly:true });
		});
		self.documents[0].appendChild(oFragment);
	},
	
	_docsLoaded:function(data){
		if($.isArray(data)){
			this.docs = data;
		}
		this.refresh();
	},
	
	_design:function(){
		this._showDocuments();
	},
	
	_browser:function(){
		this._showDocuments();
	},
	
	save:function(){
		var self = this, value = {};
		$.extend(this.options.view.options, value);
		return $.an.view.prototype.save.apply(this,arguments);
	},
	
	print: function(){ 
		var o = this.options, loc = window.location, 
		      url = loc.protocol +"//"+loc.host+"/pdfs?dbid="+o.dbId+"&viewid="+o.view._id;
		print(url);
	},
	
	destroy: function() {
		this.element.unbind(".formview").removeClass("an-formview show-pager");
		$.an.view.prototype.destroy.apply(this,arguments);
	}
});
})( jQuery );
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

$.widget( "an.customview", $.an.view, {
	options: {
		printable: false,
		pagerPosition: "bottom" // bottom, both sides
	},

	_create: function(){
		$.an.view.prototype._create.apply(this, arguments);

		var o = this.options, el = this.element;
		el.addClass("an-customview");
		o.templateTemp = o.view.templateTemp;
		o.templateSelector = o.view.templateSelector;
		o.templateConverts = o.view.templateConverts;
		o.templateContent = o.view.templateContent;
		this.documents = $(o.templateContent).prependTo(el);
				
		if (o.templateTemp) {
			o.templateTemp=$.templates(o.templateTemp);
		}
		
		if(o.templateConverts&&typeof o.templateConverts=='string'){
			o.templateConverts=eval("("+o.templateConverts+")");			
			$.views.converters(o.templateConverts);
		}
	},

	_showDocuments:function(){
		var self = this, o = this.options;
		if (o.templateTemp) {
			var html = o.templateTemp.render(self.docs);
			$(o.templateSelector, this.documents).html(html);
		}		
		if(o.templateConverts&&typeof o.templateConverts=='string'){
			o.templateConverts=eval("("+o.templateConverts+")");			
			$.views.converters(o.templateConverts);
		}
	},
	
	_docsLoaded:function(){
		this.refresh();
	},
	
	_design:function(){
		this._showDocuments();
	},
	
	_browser:function(){
		this._showDocuments();
	},
	
	save:function(){
		var value = {};
		$.extend(this.options.view.options, value);
		return $.an.view.prototype.save.apply(this,arguments);
	},
	
	print: function(){ 
		var o = this.options, loc = window.location, 
		      url = loc.protocol +"//"+loc.host+"/pdfs?dbid="+o.dbId+"&viewid="+o.view._id;
		print(url);
	},
	
	destroy: function() {
		this.element.unbind(".formview").removeClass("an-formview show-pager");
		$.an.view.prototype.destroy.apply(this,arguments);
	}
});
})( jQuery );
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

$.widget( "an.editor", {
	options: {
		printable: true,
		mode: "browser",
		document: {},
		forms: [],
		actionSets: [],
		parseDot: true,
		isDocDirty: false
	},

	_create: function() {
		this.element.addClass("an-editor");
		var self = this, o = this.options, el = this.element, doc = o.document, docType = doc.type, forms = {};
		this.doc = new DocWrapper(doc, o.parseDot);
		var id = doc._id; 
		if(id) o.url = "/dbs/"+o.dbId+"/"+id+"/attachments";

		if(o.forms.length <= 1) el.addClass("tabs-nav-hide");
		if(o.design && (docType==Model.FORM||docType==Model.PAGE||docType==Model.VIEW)){
			forms[doc._id+"-design"] = doc;
		}
		$.each(o.forms||[],function(k,v){
			forms[v._id] = v; 
		});

		el.append("<ul />").tabsx({
			tabTemplate: "<li><a href='#{href}' hidefocus='true'>#{label}</a></li>",
			show: function(event, ui) {
				var $p = $(ui.panel), id = $p.attr("id"), d = forms[id], type = d.type;
				if($p.is(".an-form,.an-page,.an-view,.an-mpage")){
					var data = $p.data();
					for(var i in data){
						if($.inArray(i, ["form","page", "mpage","gridview","formview","customview","view","mobilelistview"]) != -1){
							if(!o.design || !(/-design$/.test(id))) data[i].option("mode", o.mode);
							data[i].option("mobile", o.mobile);
							self._trigger("tabshow",event, data[i]);
							break;
						}
					}
				}else{
					var opt ={
							dbId:o.dbId,
							mode:(o.design && /-design$/.test(id)) ? "design" : o.mode,
							ignoreEscape:o.ignoreEscape,
							change:function(){ 
								o.change&&o.change();
							},
							mobile:o.mobile,
							readOnly:o.readOnly,
							widgetselect: o.widgetselect,
							optionchanged:function(e,data){
								if(data.key == "isDirty"){
									if(data.value){
										self.option("isFormDirty",true);
									}else{
										var isFormDirty = false;
										el.tabsx("option","panels").each(function(){
											var data = $(this).data();
											for(var i in data){
												if($.inArray(i, ["form","page","gridview","formview","customview","view","mobilelistview"]) != -1){ 
													isFormDirty = data[i].option("isDirty");
													if(isFormDirty) break;
												}
											}
										});
										self.option("isFormDirty",isFormDirty);
									}
								}else if(data.key == "mode"){
									self.option(data.key, data.value);
								}
								
							}
					    };
					if(type == Model.FORM){
						$p.form($.extend(true, {
							form: d, 
							document:(o.design && /-design$/.test(id)) ? {} : function(){return self.doc;},
							url:o.url,
							editor:self,
							create:function(){self._trigger("tabcreated",event, $(this).data("form")); }
						}, opt));
					}else if (type == Model.PAGE){
						$p.page($.extend(true,{
							page:d, 
							create:function(){ self._trigger("tabcreated",event, $(this).data("page")); }
						},opt));
					}else if (type == Model.VIEW){
						var vt = d.viewType||"gridview", vt = vt.toLowerCase();
						
						vt = (vt == "customizedview"?"view":vt);
						
						var optsx = {
							    view: d,
							    create:function(){ self._trigger("tabcreated",event, $(this).data(vt)); }
						    };
						if(vt == "formview"||vt == "customview"||vt == "mobilelistview") optsx.form = o.form;
						$p[vt]($.extend(true,optsx,opt));
					}
				}
			}
		});
		$.each(forms||[],function(k,v){
			el.tabsx("add","#"+k, v.title);
		});

		if(o.tabsPosition == "bottom"){
			el.addClass("tabs-bottom").children(".ui-tabs-nav, .ui-tabs-nav > *")
			    .removeClass("ui-corner-all ui-corner-top" ).addClass("ui-corner-bottom" );
		}

		el.attr('tabIndex', -1).css('outline', 0).keydown(function(e){
			var form=self._currentForm();
			if(e.keyCode === $.ui.keyCode.ESCAPE && !o.ignoreEscape &&!e.isDefaultPrevented()&&form.validate()){
				e.preventDefault();
				self.option("mode", "browser");
				form.option("mode", "browser");
			}
		}).bind("dblclick.form",function(e){
			var form=self._currentForm();
			if(o.mode == "browser"&&!o.readOnly){
				self.option("mode","edit");
				form.option("mode","edit");
			}
		});

		$(this.doc).bind("propchanged.editor",function(e,id,value,oldValue,trans){
			if(!trans) self.option("isDocDirty", true);
			if(o.design && (docType==Model.FORM||docType==Model.PAGE||docType==Model.VIEW)){
				var docId = doc._id+"-design", dd= $.extend(true, {}, doc);
				el.children("#"+docId+".ui-tabs-panel").each(function(){
					var $this = $(this);
					if($this.is(".an-form,.an-page,.an-view,.an-mpage")){
						var data = $this.data();
						for(var i in data){
							if($.inArray(i, ["form","page", "mpage"]) != -1){
								$this[i]("option",i,dd);
							}else if($.inArray(i, ["gridview","formview","customview","view","mobilelistview"]) != -1){
								$this[i]("option","view",dd);
							}
						}
					}
				});
			}
			self._trigger("docpropchanged",e, {id:id, value:value,oldValue:oldValue, "transient":trans});
		});
		
		$(document).bind("documentChanged.editor", function(e,data){
			var ds = $.isArray(data)?data:[data], id;
			for(var i in ds){
				id = ds[i]._id;
				if(id == o.document._id){
					$.extend(true, o.document, ds[i]);
					el.children(".ui-tabs-panel").each(function(){
						var $this = $(this);
						$this.is(".an-form")&&$this.form("refresh");
					});
				}
				if(forms[id] || forms[id+"-design"]){
					if(forms[id+"-design"]) id = id+"-design";
					forms[id] = $.extend(true, {}, ds[i]);
					for(var j in o.forms){
						if(o.forms[j]._id == ds[i]._id){
							o.forms[j] = forms[id];
							break;
						}
					}
					el.children("#"+id+".ui-tabs-panel").each(function(){
						var $this = $(this);
						if($this.is(".an-form,.an-page,.an-view,.an-mpage")){
							var data = $this.data();
							for(var i in data){
								if($.inArray(i, ["form","page", "mpage"]) != -1){
									$this[i]("option",i,forms[id]);
								}else if($.inArray(i, ["gridview","formview","customview","view","mobilelistview"]) != -1){
									$this[i]("option","view",forms[id]);
								}
							}
						}

					});
				}
			}
		}).bind("documentDeleted.editor",function(e,data){
			var ds = $.isArray(data)?data:[data], id;
			for(var i in ds){
				id = ds[i]._id;
				if(forms[id] || forms[id+"-design"]){
					if(forms[id+"-design"]) id = id+"-design";
					for(var j in o.forms){
						if(o.forms[j]._id == ds[i]._id){
							o.forms.splice(j,1);
							delete forms[id];
							el.tabsx("remove",id);
							break;
						}
					}
				}
			}
		});
	},
	
	_validate:function(){
		var self = this,valid=true;
		this.element.tabsx("option","panels").each(function(){
			var data = $(this).data();;
			for(var i in data){
				if($.inArray(i, ["form","page"]) != -1&&data[i].option("mode")!="design"&&!data[i].option("isValid")){
					self.element.tabsx("select", data[i].option("form")._id);
					valid=false;
					return false;
				}
			}
		});
		return valid;
	},
	
	save: function(opts){
		opts = opts || {};
		var self = this, o = this.options, dbId = o.dbId, valid = true;
		this.element.tabsx("option","panels").each(function(){
			var data = $(this).data();;
			for(var i in data){
				if($.inArray(i, ["form","page"]) != -1){
					if(data[i].option("isDirty")){
						if(data[i].option(i)._id == o.document._id){
							o.document.content = data[i].option("content");
							data[i].option("isDirty", false);
							o.isDocDirty = true;
						}else{
							data[i].save();	
						}
					}
					if(opts.validate && valid && form.option("mode")!="design"){
						valid = form.option("isValid");
						if(!valid){
							self.element.tabsx("select", form.option("form")._id);
						}
					}
				}else if($.inArray(i, ["gridview","formview","customview","view","mobilelistview"]) != -1){
					if(data[i].option("isDirty")){
						if(data[i].option("view")._id == o.document._id){
							o.document.options = $.extend(true,o.document.options, data[i].option("viewOptions"));
							data[i].option("isDirty", false);
							o.isDocDirty = true;
						}else{
							data[i].save();	
						}
					}
				}
			}
		});
		this.option("isFormDirty",false);
		
		if(valid && o.isDocDirty) {
			var doc = this._getDocument(),opNew={options:{}},tags=false;
			
			if ($.type(opts.beforesave) == "function") {
				opts.beforesave(doc); // here you can change the doc values
			}

			if (o.formIds) {
				doc.formIds=o.formIds;
			}
			
			if(o.task||opts.task){
				opNew["options"]["task"]=o.task||opts.task;
				tags=true;
			}

			if(o.isNew){
				var def = o["default"]&&o["default"]._id;
				
				if(def){
					opNew["options"]["default"]=def;
					tags=true;
				}
				Model.postDocument(dbId, doc, tags?opNew:null, function(err,result){
					if(!err){
						delete o.isNew;
						$.extend(o.document, result);
						self.option("option","url", "/dbs/"+dbId+"/"+doc._id+"/attachments");
						self.option("isDocDirty",false);
					}
					if($.type(opts.saved) == "function"){
						opts.saved(err, doc,true);
					}else{
						o.saved&&o.saved(err, doc,true);
					}
				});
			}else{
				Model.updateDocument(dbId,doc._id,doc,tags?opNew:null, function(err,result){
					if(!err){
						$.extend(o.document, result);
						self.option("isDocDirty",false);
					}
					if($.type(opts.saved) == "function"){
						opts.saved(err, doc,true);
					}else{
						o.saved&&o.saved(err, doc,true);
					}
				});
			}
		}
	},
	_getDocument:function(){
		var o = this.options,doc = $.extend(true,{},o.document);
		$.each(o.forms,function(){
			$(this.content).find(".field[transient=true]").each(function(){
				var $this = $(this), id = $this.attr("id");
				if(id){
					id = id.replace(/-/g,".");
					if($this.attr("transient")){
						try{delete eval("doc."+id)}catch(e){};
					}
				};
			});
		});
		return doc;
	},
	print: function(){
		this._currentForm().print();
	},
	option: function(key, value){
		var self = this, o = this.options;
		if(key === "actionSets" && value === undefined){
			var cf = this._currentForm(); 
			return cf&&cf.option("actionSets");
		}else if(key === "outline" && value === undefined){
			var form = this._currentForm();
			if(form) return form.option("outline");
		}else if(key === "document" && value === undefined){
			return this._getDocument();
		}else	if(key === "namedValues" && value === undefined){
			var nv = {};
			$.each(o.forms,function(k,form){
				$(form.form).find(".field:not(.button)").each(function(){
					var id = $(this).attr("id");
					if(id){
						id = id.replace(/-/g,".");
						nv[id] = self.doc.prop(id);
					}
				});
			});
			return nv;
		}else if(key == "currentForm" && value == undefined){
			return this._currentForm();
		}else if (key=="isValid"&&value==undefined){
			return this._validate();
		}
		var ret = $.Widget.prototype.option.apply(this, arguments ); 
		return ret === undefined ? null : ret; // return null not undefined, avoid to return this dom element.
	},
	
	_setOption: function(key, value){
		var oldValue = this.options[key];
		if(!equals(value,oldValue)){
			$.Widget.prototype._setOption.apply(this, arguments );
			if(key === "document"){
				this.doc.setDoc(value);
				this._setOption("isDocDirty",false);
			}else if(key === "url"){
				this.element.tabsx("option","panels").each(function(){
					$(this).form("option",key,value);
				});
			}else if(key === "mode"){
				this._currentForm().option(key,value);
			}
			this._trigger("optionchanged",null,{key:key,value:value,oldValue:oldValue});
		}
		return this;
	},

	getForm: function(id){
		var o = this.options;
		if(o.design && (id == o.document._id)) id = id+"-design";
		var data = this.element.tabsx("panel", id).data();
		for(var i in data){
			if($.inArray(i, ["form","page","gridview","formview","customview","view","mobilelistview"]) != -1) return data[i]; 
		}
		return null;
	},
	
	_currentForm:function(){
		var data = $(this.element.tabsx("option","selectedPanel")).data();
		for(var i in data){
			if($.inArray(i, ["form","page","gridview","formview","customview","view","mobilelistview"]) != -1) return data[i]; 
		}
		return null;
	},
	
	refresh:function(){
		this._currentForm().refresh();
		return this;
	},
	
	highlightWidget: function(id, highlight){
		return this._currentForm().highlightWidget(id, highlight);
	},
	
	destroy: function() {
		$(document).unbind(".editor");
		this.element.tabsx("destroy").removeClass("an-editor tabs-bottom")
		      .unbind(".editor").undelegate(".an-form",".editor").empty();
		$.Widget.prototype.destroy.apply(this, arguments);
	}
});
})( jQuery );/*!
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

$.widget( "an.sideview", {
	
	_create: function() {
		var o = this.options, el = this.element;
		if(o.name) el.addClass(o.name);
		$('<style type="text/css">'+(o.stylesheet||"")+'</style>').appendTo(el);
		$.extend(this, eval("try{("+(o.methods||"{}")+")}catch(e){}"));
		
		var data = {};
		data[this.widgetName] = this;
		o.actions = eval("("+(o.actions||"[]")+")");
		$.each(o.actions, function(k,action){
			el.bind(action.events, data, action.handler);
		});

		this.createContent && this.createContent();
	},
	
	destroy: function() {
		var o = this.options, el = this.element;
		$.each(o.actions, function(k,action){
			el.unbind(action.events);
		});
		this.clean && this.clean();
		$.Widget.prototype.destroy.apply( this, arguments );
	}
});
})(jQuery);/*!
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

$.widget( "an.workbench", {
	options: {
		westWidth: 320,
		eastWidth: 260,
		westViews: "",
		eastViews: "",
		sideViews: [{id:"50b19b6449987bc16db5a1b8", anchor:"west"}],
		extensionPoints:{startNew:"51959a88a092003a0f000011",
		     toolbarGlobal:"519598d2a092003a0f000005",
		     toolbarHeader:"5195994da092003a0f000008",
		     toolbarCenter:"5195989ea092003a0f000001",
		     toolbarTail:"51959981a092003a0f00000b",
		     showSideView:"51959a53a092003a0f00000e",
		     documentClick:"519ad731a092001a75000001",
		     documentDoubleClick:"51998379a092001104000078", 
		     documentContextMenuNew:"51949426a092000480000001",
		     documentContextMenuMiddle:"519ad76ba092001a75000004", 
		     documentContextMenuTop:"519ad8f8a092001a7500000f",
		     documentContextMenuBottom:"519ad916a092001a75000012"},
		openedDocuments:[]
	},

	_create: function() {
		this.element.addClass("an-workbench");
		var self = this, o = this.options;
		document.title=o.title || "Agile Notes";
		this.element.border({
			north:{selector:".north", height:28},
			west:{selector:".west", width:0, resizable:false},
			east:{selector:".east", width:0, resizable:false},
			south:{selector:".south", height:18},
			center:{selector:".center"},
			optionchanged:function(e,data){
				if(data.key == "west" || data.key == "east"){
					if(data.value.width) o[data.key+"Width"] = data.value.width;
					self._saveOptions();
				}
			}
		});
		
		$(["center","west","east"]).each(function(k,v){
			var node = $("#"+v+"-tabs",self.element);
			node.tabsx({
				tabTemplate: "<li><a href='#{href}' hidefocus='true'>#{label}</a> <span class='ui-icon ui-icon-close'>Remove Tab</span></li>",
				showTabsContextMenu:true,
				add: function(e, ui ) { if(v == "center") node.tabsx('select', '#' + ui.panel.id); },
				show: function(e, ui) {
					var panel = $(ui.panel), editor;
					$.each(["editor","gridview", "formview", "customview","view","page","mobilelistview"], function(k,v){
						editor = panel.data(v); 
						if(editor) {
							var title = editor.option('title');
							document.title = o.title +" - "+title;
							self.reloadToolbar();
							self._notifyOutline();
							return false;
						}
					});
				},
				remove: function(e, ui) {
					if(v == "center"){
						if(node.tabsx("length") == 0){
							document.title = o.title;;
							self.reloadToolbar();
							self._notifyOutline();
						}
						self._afterCloseEditor({workbench:self, id:$(ui.panel).attr("id")});
					}else if(v == "west" || v == "east"){
						var id = $(ui.panel).attr("id"), index = -1;
						$.each(o.sideViews, function(k,sv){
							if(id == sv.id && v == sv.anchor){
								index = k;
								return false;
							}
						});
						o.sideViews.splice(index,1);
						self._saveOptions();

						if(node.tabsx("length") == 0){
							self.element.border("option",v,{width:0, resizable:false});
						}
					}
				}
			});
			
			node.delegate("span.ui-icon-close", "click", function(){
				var index = $("li", node).index( $(this).parent());
				var saveBtn=self.toolbar.find('button[title="Save"]');
				if(!saveBtn.attr('disabled')&&$("li", node).eq(index).hasClass('ui-tabs-selected')){
					showDialog('Confirm', 'Do you want to save the changes?',{buttons:[{
						text: "OK",
						handler: function(dialog){
							saveBtn.trigger('click');
							node.tabsx("remove", index);
							dialog.close();
						}
					},{
						text: "Cancel",
						handler: function(dialog){
							node.tabsx("remove", index);
							dialog.close();
						}
					}]});
					return ;
				}
				node.tabsx("remove", index);
			});
			
			self[v+"Tabs"] = node;
		});
		this.statusBar = $(".south",self.element);

		this.element.ajaxComplete(function(event,request, settings){
			switch(request.status){
			case 401:
				self._login();
				break;
			default:
				break;
			}
		});
		
		// load validate methods. 
		$.ans.getDoc(o.dbId, null, {selector:{type:Model.VALIDATE_METHOD}},function(err,data){
			if(err){
				console.log("Load validate methods error: " + err);
			}else{
				$.each(data.docs,function(){
					$.validator.addMethod(this.name, eval("(0,"+this.handler+")"), this.message);
				});
			}
		});

		// load actions of document.
		this._loadExtensions(function(){
			self._initMainToolbar();
			// load opened documents.
			$.each(o.openedDocuments||[], function(){if (typeof(this.method) != 'undefined')	self[this.method](this.id, this.options);});
			// load side views.
			$.each(o.sideViews, function(){ self.showSideView(this.id, this.anchor, this.options); });
		});
		
		this.element.bind("rteoptionchanged.workbench",function(e, data){
			if(data.key == "path"){
				self.statusBar.html(data.value);
				self.toolbar.toolbar("refresh");
			}else if(data.key == "undoable"||data.key == "redoable"){
				self.toolbar.toolbar("refresh");
			}
        }).bind("selectionChanged.workbench",function(e){
			self.toolbar.toolbar("refresh");
        });
		
		this._proxy = $.proxy(function(e){
			if(e.target===window){
				if(this.toolbar.toolbar("option","isEmpty")){
					$(this.element).border("option",{
						north : { height : "0" }
					});
				}else{
					var height = this.toolbar.outerHeight(true);
					$(this.element).border("option",'north',{height:height ? height : 0});
				}
			}
		},this);
		$(window).bind("resize.workbench", this._proxy);

		$(document).bind("documentChanged.workbench documentCreated.workbench", function(e,data){
			var hit = false;
			$.each($.isArray(data)?data:[data], function(k,v){
				self.centerTabs.find("a[href^=#"+v._id+"]").html(v.title);
				if(v.extensionPoint){ hit = true; }
			});
			if(hit) self._loadExtensions(function(){ self._initMainToolbar(); });
		}).bind("documentDeleted.workbench",function(e,data){
			$.each($.isArray(data)?data:[data], function(k,v){
				self.centerTabs.find("a[href^=#"+v._id+"]").each(function(){
					var href = $(this).attr("href");
					if(href){
						self.centerTabs.tabsx("remove",href.substring(1));
					}
				});
			});
			self._loadExtensions(function(){ self._initMainToolbar(); });
		});

		window.workbench = this;
	},

	_afterOpenEditor:function(data){
	    var o = this.options, hit = false;
	    o.openedDocuments = o.openedDocuments||[];
	    $.each(o.openedDocuments, function(){
	    	if(this.id == data.id && this.method == data.method) hit = true;
	    });
	    if(!hit && !(data.options&&data.options.isNew)){
	    	o.openedDocuments.push(data);
		    this._saveOptions();
	    }
	},

	_afterCloseEditor:function(data){
		var o = this.options, m = data.id.match(/([^-]+)-([^-]+)/), index = -1,
		type = m[2].substring(0,1).toUpperCase()+m[2].substring(1);
		$.each(o.openedDocuments, function(k,v){
			if(v.method == ("open"+type) && v.id == m[1]){
				index = k;
				return false;
			}
		});
		o.openedDocuments.splice(index,1);
		this._saveOptions();
	},
	
	_afterShowSideView:function(data){
		var o = this.options, hit = false;
		$.each(o.sideViews,function(){
			if(this.id == data.id && this.anchor == data.anchor) hit = true;
		});
	    if(!hit){
	    	o.sideViews.push(data);
		    this._saveOptions();
	    }
	},
	
	_loadExtensions:function(afterLoad){
		var self = this, o = this.options, eps=[];
		$.each(o.extensionPoints,function(k,v){ eps.push(v);});
		Model.loadExtensions(o.dbId, eps, function(err, exts){
			self.extensions = exts;
			afterLoad();
	    });
	},
	
	_initMainToolbar:function(){
		var self = this, o = this.options, eps = o.extensionPoints;
		
		// Set up start menu actions
		var startActions = [], children = [];

		// Add new Actions.
		var sna = this.extensions[eps.startNew]||[];
		$.each(sna, function(k,v){
    		children.push({
    				id: k,
    				type:"menuItem",
    				text:v.title||v.name||k,
    				handler:eval("(0,"+(v.handler||"function(){}")+")"),
    				enabled:eval("(0,"+(v.enabled||"function(){return false;}")+")")
    		});
		});
		if(sna.length > 0) children.push({type:"seperator"});
		children.push({
			id: "others",
			type: "menuItem",
			text: "Others ...",
			handler:function(){
				$("<div class='workbench'/>").dialog({
					title:"New Document",
					height: 460,
					width: 320,
					modal: true,
					create: function(event, ui){
						var $this = $(this);
						$this.explorer({
							dbId:o.dbId, 
							roots:[Model.META_ROOT],
							docdblclick:function(e,doc){ self.newDocument(doc._id);$this.dialog("close"); }
						});
						setTimeout(function(){ $this.explorer("expand", Model.META_ROOT); },200);
					},
					buttons: {
						OK: function() {
							var $this= $(this), docIds = $this.explorer("option","selectedNodes");
							$.each(docIds,function(){self.newDocument(this); });
							$this.dialog( "close" );
						},
						Cancel: function() { $( this ).dialog( "close" );}
					},
					close: function(e, ui){$(this).remove();}
				});
			},
			enabled:function(){return true;}
		});
		startActions.push({ type:"submenu", text:"New", children:children});

		// Add show side view actions.
		children = [];
		var ssv = this.extensions[eps.showSideView]||[];
		$.each(ssv, function(k,v){
    		children.push({
    				id: k,
    				type:"menuItem",
    				text:v.title||v.name||k,
    				handler:eval("(0,"+(v.handler||"function(){}")+")"),
    				enabled:eval("(0,"+(v.enabled||"function(){return false;}")+")")
    		});
		});
		if(ssv.length > 0) children.push({type:"seperator"});
		children.push({
			id: "others",
			type:"menuItem",
			text:"Others ...",
			handler:function(){
				$("<div class='workbench'/>").dialog({
					title:"Show Side View",
					height: 460,
					width: 320,
					modal: true,
					create: function(event, ui){
						var $this = $(this);
						$this.explorer({
							dbId:o.dbId, 
							roots: [Model.SIDE_VIEW_ROOT],
							docdblclick:function(e,doc){ self.showSideView(doc._id);$this.dialog("close"); }
						});
						setTimeout(function(){ $this.explorer("expand", Model.SIDE_VIEW_ROOT); },200);
					},
					buttons: {
						OK: function() {
							var $this= $(this);
							$.each($this.explorer("option","selectedNodes"),function(){ self.showSideView(this); });
							$this.dialog( "close" );
						},
						Cancel: function() { $( this ).dialog( "close" );}
					},
					close: function(e, ui){$(this).remove();}
				});
			},
			enabled:function(){return true;}
		});
		startActions.push({ type:"submenu", text:$.i18n["showSideView"], children:children});
		startActions.push({type:"seperator"});
		startActions.push({id:"login", type:"menuItem", text:"Login ...",handler:function(){self._login();},enabled:function(){return true;}});
		startActions.push({id:"logout", type:"menuItem", text:"Logout",handler:function(){self._logout();},enabled:function(){return true;}});

    	// Set up global actions.
    	var globalActions = {}, tga = this.extensions[eps.toolbarGlobal]||[];
    	$.each(tga, function(k,v){ // 'cut','copy','paste','undo','redo'
    		globalActions[v._id] = {
    			_id: v._id,
    			type: "button",
    			label: v.title || v.name,
    			text: false,
    			icons: {primary: "ui-icon-"+v.name},
    			handler: eval("(0,"+(v.handler||"function(){}")+")"),
    			enabled: eval("(0,"+(v.enabled||"function(){return false;}")+")")
    		};
    		if(v.icon && (v.icon.length > 0)&& v.icon[0].metadata){
    			globalActions[v._id].iconFile = "/dbs/"+o.dbId+"/"+v._id+"/attachments/"+v.icon[0].metadata.filepath;
    		}
    	});

    	if(this.toolbar) this.toolbar.remove();
    	this.toolbar = $("<div id='main' class='ui-corner-all'/>").appendTo($(".north",self.element)).toolbar({
			startAction:{
				startAction:{
					type: "button",
					label: "Agile Notes",
					icons: { primary: "ui-icon-home", secondary: "ui-icon-triangle-1-s" },
					actions:startActions,
					enabled:function(){return true;}
				}
			},
			globalActionSet:globalActions
		});
    	this.reloadToolbar();
	},

	reloadToolbar: function(){	
		var self=this, eps = this.options.extensionPoints;
		clearTimeout(this.time);
		this.time=setTimeout(function(){
			console.log("reloadToolbar............................!");

			var editor = self.currentEditor(), actionSets = [];
			if(editor){
				function createActionSet(actions, context){
					var actionSet = {};
					$.each(actions, function(k,v){
						filter = eval("(0,"+(v.filter||"function(){return true}")+")");
						if(filter(context)){
							actionSet[v._id] = {
								_id: v._id,
								type: v.actionType || "button",
								label:v.title || v.name,
								text: false,
								icons:{primary: "ui-icon-"+v.name},
								iconFile:v.icon,
								handler: eval("(0,"+(v.handler||"function(){}")+")"),
								enabled: eval("(0,"+(v.enabled||"function(){return false;}")+")"),
								checked: eval("(0,"+(v.checked||"function(){return false;}")+")")
							};
							if(v.icon && (v.icon.length > 0)&& v.icon[0].metadata){
								actionSet[v._id].iconFile = "/dbs/"+context.dbId+"/"+v._id+"/attachments/"+v.icon[0].metadata.filepath;
							}
						}
					});
					return actionSet;
				}
				
				var tas = editor.widget().data("toolbarActions"), dbId = editor.widget().data("dbid")||self.options.dbId, 
					context = {editor:editor, dbId:dbId}, ass = editor.option('actionSets'), actionSet = {}, filter;
				actionSet = createActionSet((tas&&tas[eps.toolbarHeader])||self.extensions[eps.toolbarHeader], context);
				if(!$.isEmptyObject(actionSet)) actionSets.push(actionSet);
				if($.isArray(ass)) actionSets = actionSets.concat(ass);
				actionSet = createActionSet((tas&&tas[eps.toolbarCenter])||self.extensions[eps.toolbarCenter], context);
				if(!$.isEmptyObject(actionSet)) actionSets.push(actionSet);
				actionSet = createActionSet((tas&&tas[eps.toolbarTail])||self.extensions[eps.toolbarTail], context);
				if(!$.isEmptyObject(actionSet)) actionSets.push(actionSet);
			}
			self.toolbar.toolbar("option","actionSets", actionSets);
			if(self.toolbar.toolbar("option","isEmpty")){
				self.element.border("option",'north',{height:"0"});
			}else{
				var height = self.toolbar.outerHeight(true);
				self.element.border("option",'north',{height:height ? height :"0"});
			}
		},800);
	},
	
	currentEditor:function(){
		var panel = $(this.centerTabs.tabsx("option","selectedPanel")), data = panel.data(), editor = null;
		$.each(data||{}, function(k,v){
			if($.inArray(k,["editor","gridview","formview","customview","view","page","mobilelistview"]) != -1){
				editor = v;
				return false;
			}
		});
		return editor;
	},

	_saveOptions:function(){
		var o = this.options, opts = {};
		if(o.openedDocuments.length) opts.openedDocuments = o.openedDocuments;
		if(o.westWidth) opts.westWidth = o.westWidth;
		if(o.eastWidth) opts.eastWidth = o.eastWidth;
		if(o.sideViews.length) opts.sideViews = o.sideViews;
		$.cookie(o.dbId, $.toJSON(opts));
	},
	
	_login:function(){
		var o = this.options;
		var login=function($this){
			$.ans.login($this.editor("option","document"),function(err,result,real){
				if(real.success){
					window.location.reload();
				}else{
					showDialog("Login Failed","Login failed: "+ real.msg);
				}
				$this.dialog( "close" );
			});
		};
		$("<div class='workbench'/>").dialog({
			title:"Login",
			height: 260,
			width: 380,
			modal: true,
			create: function(event, ui){
				var $this = $(this);
				$.ans.getDoc(o.dbId, "50accac59555dbe125000002", null, function(err,form){
					if(err){
						console.log("Load Form Error", "Load form error: "+err);
					}else{
						$this.editor({document:{}, forms:[form] ,dbId:o.dbId, mode:"edit", ignoreEscape:true});
					}
				});
				$this.bind("keyup",function(e){
					if(e.keyCode==$.ui.keyCode.ENTER){
						login($(this));
					}
				});
			},
			buttons: {
				OK: function() {
					login($(this));
				},
				Cancel: function() { $( this ).dialog( "close" );}
			},
			close: function(e, ui){$(this).remove();}
		});
	},
	
	_logout:function(){
		$.ans.logout(function(err,result){window.location.reload();});
	},

	showSideView:function(viewId, anchor, opts){
		var self = this, o = this.options, dbId = (opts&&opts.dbId)||o.dbId;
		$.ans.getDoc(dbId, viewId, null, function(err, sideView){
			if(sideView){
				self._doShowSideView(sideView, anchor||"west", opts);
			}else{
				console.log("Load view "+viewId+"error: "+err);
			}
		});
	},
	
	_docClick:function(context, actions){
		var filter, action = {};
		$.each(actions||[], function(k,v){
			filter = eval("(0,"+(v.filter||"function(){return true}")+")");
			if(filter(context)){
				$.extend(true,action,v);
				action.context = context;
				action.handler = eval("(0,"+(v.handler||"function(){}")+")");
				action.handler();
				return false;
			}
		});
	},

	_docDblClick:function(context, actions){
		var filter, action = {}, hit = false;
		$.each(actions||[], function(k,v){
			filter = eval("(0,"+(v.filter||"function(){return true}")+")");
			if(filter(context)){
				$.extend(true, action, v);
				action.context = context;
				action.handler = eval("(0,"+(v.handler||"function(){}")+")");
				action.handler();
				hit = true;
				return false;
			}
		});
		if(!hit) this.openDocument(context.document._id, {dbId:context.dbId});
	},

	_docContextMenuActions:function(inActions, context, outActions){
		if(!inActions) return outActions;
		
		var eps = this.options.extensionPoints;
		function addAction(v){
			filter = eval("(0,"+(v.filter||"function(){return true}")+")");
			if(filter(context)){
				outActions.push({ type:"menuItem", text: v.title, context:context, handler:eval("(0,"+(v.handler||"function(){}")+")") });
			}
		}
		$.each(inActions[eps.documentContextMenuTop]||[], function(k,v){addAction(v);});
		if(outActions.length > 0) outActions.push({type:"seperator"});
		$.each(inActions[eps.documentContextMenuMiddle]||[], function(k,v){addAction(v);});
		if(outActions.length >= 1&&outActions[outActions.length-1].type != "seperator") outActions.push({type:"seperator"});
		$.each(inActions[eps.documentContextMenuBottom]||[], function(k,v){addAction(v);});
		if(outActions.length>=1&&outActions[outActions.length-1].type == "seperator") outActions.pop();
		return outActions;
	},

	_doShowSideView: function(sideView, anchor, opts){
		var self = this, o = this.options, title = sideView.title||sideView.name||sideView._id, 
		    dbId = (opts&&opts.dbId) || o.dbId, tabs = this[anchor+"Tabs"], id = sideView._id, 
		    el = this.element, panel = tabs.children("#"+id);
		if(panel.size() > 0) return;
		var a = el.border("option",anchor);
		if(!a.width) el.border("option",anchor, {width:o[anchor+"Width"], resizable:o[anchor+"Width"]>0});

		tabs.tabsx("add","#"+id, title);
		$("#"+id, tabs).sideview($.extend({
			dbId:dbId,
			create:function(e,data){self._afterShowSideView({id:sideView._id, anchor: anchor, options:opts});}
		}, sideView, opts));
	},

	authorization:function(docId, opts){
		var o = this.options, dbId = (opts&&opts.dbId) || o.dbId;
		$.ans.getDoc(dbId, docId, null,function(err,doc){
			if(err){
				console.log("Load document "+docId+" error: "+err);
			}else{
				var sel;
				if(doc.type == Model.META){
					sel = {$or:[{_id:"a417d20f9fa10c25dad56974"},{_id:"e2922e5edc79a1b28c0199e9"}]};
				}else{
					sel = {_id:"a417d20f9fa10c25dad56974"};
				}
				$.ans.getDoc(Model.ADMINDBID, null, {selector:sel},function(err,data){
					if(err){
						console.log("Load forms error: "+err);
					}else{
						$("<div/>").authorization({
							title: "Authorization - "+(doc.title||doc.name||doc._id),
							dbId:Model.ADMINDBID,
							document:doc,
							forms:data.docs,
							buttons:[{
								text: "Save",
								click: function(){
									var $this = $(this), doc = $this.authorization("option","document");
									Model.updateDocument(dbId, doc._id, doc, null, function(err,result){
										if(err) console.log("Save authorization error: "+err);
										$this.authorization("close");
									});
								}
							},{
								text: "Cancel",
								click: function(){ $(this).authorization("close"); }
							}],
							close: function(e, ui){$(this).remove();}
						});
					}
				});				
			}
		});
	},
	
	execute: function(doc, opts){
		var self = this, o = this.options, dbId = (opts&&opts.dbId)||o.dbId;
		$.ans.getDoc(dbId, doc._id,{options:{exec:true}},function(err, doc){
			if(opts.notify){
				self.statusBar.html("Execute " + doc.name+" "+(doc.result||doc.error));
			}
		});
	},
	
	_notifyOutline:function(){
		$(window).trigger($.Event("outline",{workbench:this})); 
	},
	
	_notifyWidgetSelect:function(widget){
		$(window).trigger($.Event("widgetselect",{workbench:this}),widget);
	},
	
	status:function(status){
		this.statusBar.html(status);
	},
	
	newDocument:function(typeId, opts){
		opts = opts || {};
		var self = this, o = this.options, dbId = opts.dbId || o.dbId, id = new ObjectId().toString(),
		    title = opts.title||id, pid = id,
		    optsx = $.extend(true,{
			    id: id,
			    tabsPosition:"bottom",
			    optionchanged:function(e,data){
			    	if(data.key == "isDocDirty"||data.key == "isFormDirty"){
			    		self.toolbar.toolbar("refresh");
			    	}else if(data.key == "mode"){
			    		self.reloadToolbar(); 
			    	}
			    },
			    change:function(e,form){self._notifyOutline();},
			    tabshow:function(e,target){self.reloadToolbar(); self._notifyOutline();},
			    tabcreated:function(e,target){self.reloadToolbar(); self._notifyOutline();},
				saved:function(err,doc,bl){
					var data = {id:doc._id, method:"openDocument", options:{mode:"edit"}};
					if(doc.type == Model.FORM){
						$.extend(true, data, {method:"openForm",options:{mode:"design"}});
					}else if(doc.type==Model.PAGE){
						$.extend(true, data, {method:"openPage",options:{mode:"design"}});
					}else if(doc.type==Model.VIEW){
						$.extend(true, data, {method:"openView",options:{mode:"design"}});
					}
					if(bl){
						self.options.openedDocuments.push(data);
						self._saveOptions();
					}
				}
		    },opts);
		if(typeId == Model.FORM){
			pid = pid+"-form";
			optsx.isFormEditor = true; 
		}else if(typeId == Model.PAGE){
			pid = pid+"-page";
			optsx.isPageEditor = true; 
		}else if(typeId == Model.VIEW){
			pid = pid+"-view";
		}else{
			pid = pid+"-document";
		}
		var el = this.centerTabs.tabsx("add","#"+pid, title).children("#"+pid);
		optsx.opened = function(editor){
			document.title = o.title +" - "+title;
			self.reloadToolbar();
	    	opts.opened && opts.opened(editor);
		};
		Model.newDocument(el, dbId, typeId, optsx);
	},
	
	copyDocument:function(docId, opts){
		opts = opts || {};
		var self = this, o = this.options, dbId = opts.dbId || o.dbId;
		$.ans.getDoc(dbId, docId, null, function(err,doc){
			if(err){
				console.log("Load document "+docId+" error: "+err);
			}else{
				self.newDocument(doc.type,$.extend(true,{"default":doc, title:doc.title||doc.name},opts));
			}
		});
	},

	openDocument: function(docId, opts){
		opts = opts || {};

		var self = this, o = this.options, dbId = opts.dbId || o.dbId, tabs = this.centerTabs,
		    pid = docId+"-document"; 
		if(tabs.tabsx("panel", pid).size() > 0){
			tabs.tabsx("select", pid);
			return;
		}

		function doOpenDoc(el, dbId, docId, opts){
			var optsx = $.extend(true,{
			    id: docId,
			    tabsPosition:"bottom",
			    optionchanged:function(e,data){
			    	if(data.key == "isDocDirty"||data.key == "isFormDirty"){
			    		self.toolbar.toolbar("refresh");
			    	}else if(data.key == "mode"){
			    		self.reloadToolbar(); 
			    	}
			    },
			    change:function(e,form){self._notifyOutline();},
			    tabshow:function(e,target){self.reloadToolbar(); self._notifyOutline();},
			    tabcreated:function(e,target){self.reloadToolbar(); self._notifyOutline();}
		    },opts);
			optsx.opened = function(editor){
				var doc = editor.option("document"), title = doc.title || doc.name || docId;
				tabs.find(".ui-tabs-nav>li>a[href=#"+pid+"]").html(title);
				document.title = o.title +" - "+title;
				self._afterOpenEditor({method:"openDocument", id:docId, options:opts});
		    	opts.opened && opts.opened(editor);
			};
			Model.openDocument(el, dbId, docId, optsx);
		}

		var el = tabs.tabsx("add","#"+pid, "...").children("#"+pid);
		if(dbId != o.dbId){
			var eps = o.extensionPoints;
			Model.loadExtensions(dbId, [eps.toolbarHeader,eps.toolbarCenter,eps.toolbarTail], function(err, toolbarActions){
				if(err){
					showDialog("Load Toolbar Actions", "Load toolbar actions: "+err);
				}else{
					el.data("toolbarActions",toolbarActions).data("dbId", dbId);
				}
				doOpenDoc(el, dbId, docId, opts);
			});
		}else{
			doOpenDoc(el, dbId, docId, opts);
		}
	},
	
	openForm:function(formId, opts){
		opts = opts || {};
		$.extend(true,opts,{isFormEditor:true});

		var self = this, o = this.options, dbId = opts.dbId || o.dbId, tabs = this.centerTabs,
		    pid = formId+"-form"; 
		if(!opts.preview && tabs.tabsx("panel",pid).size() > 0){
			tabs.tabsx("select",pid);
			return;
		}
		
		function doOpenForm(el, dbId, formId, opts){
			var optsx = $.extend(true,{
				tabsPosition:"bottom",
			    optionchanged:function(e,data){
			    	if(data.key == "isDocDirty" || data.key == "isFormDirty"){
			    		self.toolbar.toolbar("refresh");
			    	}else if(data.key == "mode"){
			    		self.reloadToolbar(); 
			    	}
			    },
			    widgetselect:function(e,widget){self._notifyWidgetSelect(widget);},
			    change:function(e,form){self._notifyOutline();},
			    tabshow:function(e,target){self.reloadToolbar(); self._notifyOutline();},
			    tabcreated:function(e,target){self.reloadToolbar(); self._notifyOutline();}
	        },opts);
			optsx.opened = function(editor){
				var doc = editor.option("document"), title = doc.title || doc.name || formId;
				tabs.find(".ui-tabs-nav>li>a[href=#"+pid+"]").html(title);
				document.title = o.title +" - "+title;
				self._afterOpenEditor({method:"openForm", id:formId, options:opts});
		    	opts.opened && opts.opened(editor);
			};
			Model.openPage(el, dbId, formId, optsx);
		}
		
		var el = null;
		if(!opts.preview){
			el= this.centerTabs.tabsx("add","#"+pid, "...").children("#"+pid);
		}
		if(dbId != o.dbId){
			var eps = o.extensionPoints;
			Model.loadExtensions(dbId, [eps.toolbarHeader,eps.toolbarCenter,eps.toolbarTail], function(err, toolbarActions){
				if(err){
					showDialog("Load Toolbar Actions", "Load toolbar actions: "+err);
				}else{
					el.data("toolbarActions",toolbarActions).data("dbId", dbId);
				}
				doOpenForm(el, dbId, formId, opts);
			});
		}else{
			doOpenForm(el, dbId, formId, opts);
		}
		
		return this;
	},

	openPage:function(pageId, opts){
		opts = opts || {};
		$.extend(true,opts,{isPageEditor:true});
		
		var self = this, o = this.options, dbId = opts.dbId || o.dbId, tabs = this.centerTabs,
		    pid = pageId+"-page"; 
		if(!opts.preview && tabs.tabsx("panel",pid).size() > 0){
			tabs.tabsx("select",pid);
			return;
		}
		
		function doOpenPage(el, dbId, pageId, opts){
			var optsx = $.extend(true,{
				tabsPosition:"bottom",
			    optionchanged:function(e,data){
			    	if(data.key == "isFormDirty"){
			    		self.toolbar.toolbar("refresh");
			    	}else if(data.key == "mode"){
			    		self.reloadToolbar(); 
			    	}
			    },
			    widgetselect:function(e,widget){self._notifyWidgetSelect(widget);},
			    change:function(e,form){self._notifyOutline();},
			    tabshow:function(e,target){self.reloadToolbar(); self._notifyOutline();},
			    tabcreated:function(e,target){self.reloadToolbar(); self._notifyOutline();}
	        },opts);
			optsx.opened = function(editor){
				var doc = editor.option("document"), title = doc.title || doc.name || doc._id;
				tabs.find(".ui-tabs-nav>li>a[href=#"+pid+"]").html(title);
				document.title = o.title +" - "+title;
				self._afterOpenEditor({method:"openPage", id:pageId, options:opts});
		    	opts.opened && opts.opened(editor);
			};
			Model.openPage(el, dbId, pageId, optsx);
		}
		
		var el = null;
		if(!opts.preview){
			el= this.centerTabs.tabsx("add","#"+pid, "...").children("#"+pid);
		}
		if(dbId != o.dbId){
			var eps = o.extensionPoints;
			Model.loadExtensions(dbId, [eps.toolbarHeader,eps.toolbarCenter,eps.toolbarTail], function(err, toolbarActions){
				if(err){
					showDialog("Load Toolbar Actions", "Load toolbar actions: "+err);
				}else{
					el.data("toolbarActions",toolbarActions).data("dbId", dbId);
				}
				doOpenPage(el, dbId, pageId, opts);
			});
		}else{
			doOpenPage(el, dbId, pageId, opts);
		}
		
		return this;
	},
	
	openView:function(viewId, opts){
		opts = opts || {};

		var self = this, o = this.options, dbId = opts.dbId || o.dbId, tabs = this.centerTabs, 
		    pid = viewId+"-view", el = tabs.tabsx("panel", pid), eps = o.extensionPoints; 
		if(el.size() > 0){
			tabs.tabsx("select", pid);
			$.each(["editor","gridview", "formview", "customview","view","mobilelistview"], function(k,v){
				editor = el.data(v); 
				if(editor && ((v == "editor" && opts.mode != "design")||(v != "editor" && opts.mode == "design"))) {
					editor.destroy();
				}else{
					return;
				}
			});
			
		}else{
	        el = tabs.tabsx("add","#"+pid, "...").children("#"+pid);
		}

		function doOpenView(el, dbId, viewId, actions, opts){
			var optsx = $.extend(true,{
				tabsPosition:"bottom",
		        optionchanged:function(e,data){
		        	if(data.key == "isDocDirty"||data.key == "isFormDirty"){
		        		self.toolbar.toolbar("refresh"); 
		        	}else if(data.key == "mode"){
		        		self.reloadToolbar();
		        	}
		        },
		        tabshow:function(e,target){self.reloadToolbar(); self._notifyOutline();},
		        tabcreated:function(e,target){self.reloadToolbar(); self._notifyOutline();}
		    },opts);
			
			var tas = {};
			$.each(["Header","Center", "Tail"],function(){
				var name = "toolbar"+this; 
				if(actions[eps[name]]) tas[eps[name]] = actions[eps[name]];
			});
			tas = $.isEmptyObject(tas) ? undefined : tas;
			el.data("toolbarActions",tas).data("dbId", dbId);
			optsx.opened = function(editor){
				var view = editor;
				if(editor.widgetName == "editor") view = editor.getForm(viewId);
				var v = view.option("view"), title = v.title || v.name || viewId, viewType = v.viewType||"gridview";
				tabs.find(".ui-tabs-nav>li>a[href=#"+pid+"]").html(title);
				document.title = o.title +" - "+ title;
				viewType = viewType.toLowerCase();
				view.option("docclick",function(e, doc){
		        	self._docClick({dbId:dbId,view:el.data(viewType),document:doc}, 
		        			actions[eps.documentClick]||self.extensions[eps.documentClick]);
				});
				view.option("docdblclick",function(e, doc){
		        	self._docDblClick({dbId:dbId,view:el.data(viewType),document:doc}, 
		        			actions[eps.documentDoubleClick]||self.extensions[eps.documentDoubleClick]);
				});
				view.option("contentActions",function(doc){
		        	return self._docContextMenuActions(actions, {dbId:dbId, view:el.data(viewType), document:doc },[]);
				});
				self.reloadToolbar();
				self._afterOpenEditor({method:"openView", id:viewId, options:opts});
		    	opts.opened && opts.opened(view);
			};
			Model.openView(el, dbId, viewId, optsx);
		}

		if(dbId != o.dbId){
			var epids = [];
			$.each(["toolbarHeader", "toolbarCenter","toolbarTail","documentClick", 
			        "documentDoubleClick", "documentContextMenuMiddle", 
			        "documentContextMenuTop", "documentContextMenuBottom"], function(){
				epids.push(eps[this]);
			});
			Model.loadExtensions(dbId, epids, function(err, exts){
				if(err){
					console.log("Load actions error: "+err);
				}else{
					doOpenView(el, dbId, viewId, exts, opts);
				}
			});
		}else{
			doOpenView(el, dbId, viewId, this.extensions, opts);
		}
		
		return this;
	},

	openDatabase: function(dbId, opts){
        window.open("workbench.html?dbid="+dbId);
        return this;
	},

	removeDocument:function(doc, opts){
		opts = opts || {};
		var dbId = (opts&&opts.dbId) || this.options.dbId, 
		    targetName = doc.title||doc.name||doc._id, title = "Remove "+ targetName, 
		    message = "Are you sure to remove "+targetName;
		message += (doc.type == Model.CATEGORY) ? " and all its child nodes?" : "?";
		showDialog(title, message,{buttons:[{
			text: "OK",
			handler: function(dialog){
				if(doc.type == Model.CATEGORY){
					Model.deleteDocument(dbId, null, {selector:{_path:{$regex: "^"+doc._path}}},function(err,result){
						if(err){
							console.log("Remove document error: "+err);
						}else{
							if($.type(opts.removed)=="function") opts.removed();
						}
					});
				}else{
					Model.deleteDocument(dbId, doc._id, null,function(err,result){
						if(err){
							console.log("Remove document error: "+err);
						}else{
							if($.type(opts.removed)=="function") opts.removed();
						}
					});
				}
				dialog.close();
			}
		},{
			text: "Cancel",
			handler: function(dialog){dialog.close();}
		}]});
		
		return this;
	},

	joinInGroup:function(userId, opts){
		var o = this.options, dbId = (opts&&opts.dbId)||o.dbId;
		$.ans.getDoc(dbId,userId,null,function(err,user){
			if(err){
				console.log("Load user document "+userId+" error: "+err);
			}else{
				$("<div class='workbench'/>").dialog({
					title:"Join In Group",
					height: 460,
					width: 320,
					modal: true,
					create: function(event, ui){
						var $this = $(this), ids = [];
						$.each(user._groupPaths||[], function(k,v){
							var a = v.split(",");
							ids.push(a[a.length-2]);
						});
						$this.explorer({dbId:dbId, roots: [Model.GROUP_ROOT], checkbox: true, checkedNodes:ids});
						setTimeout(function(){ $this.explorer("expand", Model.GROUP_ROOT); },200);
					},
					buttons: {
						OK: function() {
							var $this= $(this), nodes = $this.explorer("option","checkedNodes");
							user._groupPaths = [];
							$.each(nodes||[], function(k,node){ user._groupPaths.push(node.data._path); });
							Model.updateDocument(dbId, userId, user, null,function(err,result){
								if(err) console.log("Join in group error: "+err);
								$this.dialog("close");
							});
						},
						Cancel: function() { $( this ).dialog( "close" );}
					},
					close:function(e, ui){$(this).remove();}
				});
			}
		});
		return this;
	},
	
	quitGroup: function(userId, groupId, opts){
		var o = this.options, dbId = (opts&&opts.dbId)||o.dbId;
		$.ans.getDoc(dbId,userId,null,function(err,user){
			if(err){
				console.log("Load user document "+userId+" error: "+err);
			}else{
				var paths = [];
				$.each(user._groupPaths||[], function(k, path){
					var matcher = new RegExp(groupId+",$");
					if(!matcher.test(path)) paths.push(path);
				});
				user._groupPaths = paths;
				Model.updateDocument(dbId, userId, user, null,function(err,result){
					if(err) console.log("Quit group error: "+ err); 
				});
			}
		});
		return this;
	},
	
	assignRole:function(docId, opts){
		var o = this.options, dbId = (opts&&opts.dbId)||o.dbId;
		$.ans.getDoc(dbId,docId,null,function(err,doc){
			if(err){
				console.log("Load document "+docId+" error: "+ err);
			}else{
				$("<div class='workbench'/>").dialog({
					title:"Assign Roles",
					height: 460,
					width: 320,
					modal: true,
					create: function(event, ui){
						var $this = $(this), ids = [];
						$.each(doc._rolePaths||[], function(k,v){
							var a = v.split(",");
							ids.push(a[a.length-2]);
						});
						$this.explorer({dbId:dbId, roots:[Model.ROLE_ROOT], checkbox: true, checkedNodes:ids});
						setTimeout(function(){ $this.explorer("expand", Model.ROLE_ROOT); },200);
					},
					buttons: {
						OK: function() {
							var $this= $(this), nodes = $this.explorer("option","checkedNodes"),
							    paths = doc._rolePaths = [];
							$.each(nodes||[], function(k,node){ paths.push(node.data._path); });
							Model.updateDocument(dbId, docId, doc, null,function(err,result){
								if(err) console.log("Assign role error:" + err);
								$this.dialog("close");
							});
						},
						Cancel: function() { $( this ).dialog( "close" );}
					},
					close: function(){$(this).remove();}
				});
			}
		});
		
		return this;
	},
	
	destroy: function() {
	    this.element.border("destroy");
		$(window).unbind("resize.workbench", this._proxy);
		$(document).unbind(".workbench");
		this.element.removeClass("an-workbench");
		return $.Widget.prototype.destroy.apply(this, arguments );
	}
});
})( jQuery );
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

$.widget( "an.authorization", $.ui.dialog, {
	options: {
		title: "Authorization",
		westWidth: 220,
		width: 620,
		height: 480,
		forms:[]
	},

	_create: function() {
		$.ui.dialog.prototype._create.apply(this, arguments);
		var el = this.element.addClass("an-authorization");
		this.west = $("<div class='west'/>").appendTo(el);
		this.organization = $("<div class='organization ui-corner-all'/>").appendTo(this.west);
		this.center = $("<div class='center'/>").appendTo(el);
		this.operation = $("<div class='operation ui-corner-all'><h4 class='title'/></div>").appendTo(this.center);
		this.content = $("<div class='content'/>").appendTo(this.operation);
	},
	
	_init:function(){
		$.ui.dialog.prototype._init.apply(this, arguments);
		var self = this, o = this.options;
		this.element.border({west:{selector:".west", width:o.westWidth, resizable:true }, center:{selector:".center" }});
		this.organization.explorer({
			dbId:o.dbId, 
			roots:[Model.OU_ROOT,Model.GROUP_ROOT,Model.ROLE_ROOT],
			nodeclick:function(e,node){
				var doc = node.data;
				self.center.find(".title").html(doc.title||doc.name||doc._id);
				self.content.editor({
					document: self._getACLAuthz(doc), 
					forms: o.forms, 
					dbId: o.dbId, 
					mode: "edit", 
					ignoreEscape: true,
					docpropchanged:function(e,data){ self._updateDocument(doc, data); }
				});
			}
		});
		o.resize = function(){self.element.border("refresh");};
	},

	_getACLAuthz: function(actor){
		var o = this.options, doc = o.document, path = (actor.type==Model.USER?actor._id: actor._path), 
		    paths = null, aclAuthz = {title: doc.title||doc.name||doc._id, typeName:"Document"}, 
		    pathsName = this._getPathsName(actor), acl = doc._acl, authz = doc._authz, 
		    get, post, put, del;
		if(acl){
			paths = acl.get && acl.get[pathsName]; 
			get = paths && ($.inArray(path, paths)!=-1)? true : false;
			paths = acl.put && acl.put[pathsName];
			put = paths && ($.inArray(path, paths)!=-1)? true : false;
			paths = acl["delete"] && acl["delete"][pathsName];
			del = paths && ($.inArray(path, paths)!=-1)? true : false;
			aclAuthz._acl = {get:get, put:put, "delete":del};
		}

		if(doc.type == Model.META){
			aclAuthz.typeName = doc.title||doc.name||doc._id || "Document";
			if(authz){
				paths = authz.post && authz.post[pathsName];
				post = paths && ($.inArray(path, paths)!=-1)? true : false;
				paths = authz.get && authz.get[pathsName]; 
				get = paths && ($.inArray(path, paths)!=-1)? true : false;
				paths = authz.put && authz.put[pathsName];
				put = paths && ($.inArray(path, paths)!=-1)? true : false;
				paths = authz["delete"] && authz["delete"][pathsName];
				del = paths && ($.inArray(path, paths)!=-1)? true : false;
				aclAuthz._authz = {get:get, post:post, put:put, "delete":del};
			}
		}
		
		return aclAuthz;
	},
	
	_updateDocument:function(actor, data){
		var doc = this.options.document, ids = data.id.split("."), list = doc[ids[0]] = doc[ids[0]] || {},  
		    method = list[ids[1]] = list[ids[1]] || {}, pathsName = this._getPathsName(actor), 
		    paths = method[pathsName] = method[pathsName]||[], 
		    path = (actor.type==Model.USER?actor._id: actor._path), index = $.inArray(path, paths);
		if(data.value && (index == -1)){
			paths.push(path);
		}else if(!data.value && index != -1){
			paths.splice(index, 1);
			if(paths.length <= 0){
				delete method[pathsName];
				if($.isEmptyObject(method)){
					delete list[ids[1]];
					if($.isEmptyObject(list)){
//						delete doc[ids[0]];
					}
				}
			}
		}
	},

	_getPathsName:function(actor){
		var pathsName = null;
		if(actor.type == Model.USER){
			pathsName = "users";
		}else	if(actor.type == Model.OU){
			pathsName = "ouPaths";
		}else if(actor.type == Model.GROUP){
			pathsName = "groupPaths";
		}else if(actor.type == Model.ROLE){
			pathsName = "rolePaths";
		}
		return pathsName;
	},
	
	destroy: function() {
		this.element.border("destroy").removeClass("an-authorization");
		$.ui.dialog.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
(function ($) {
    // Monkey patch jQuery 1.3.1+ css() method to support CSS 'transform'
    // property uniformly across Safari/Chrome/Webkit, Firefox 3.5+, IE 9+, and Opera 11+.
    // 2009-2011 Zachary Johnson www.zachstronaut.com
    // Updated 2011.05.04 (May the fourth be with you!)
    function getTransformProperty(element)
    {
        // Try transform first for forward compatibility
        // In some versions of IE9, it is critical for msTransform to be in
        // this list before MozTranform.
        var properties = ['transform', 'WebkitTransform', 'msTransform', 'MozTransform', 'OTransform'];
        var p;
        while (p = properties.shift())
        {
            if (typeof element.style[p] != 'undefined')
            {
                return p;
            }
        }
        
        // Default to transform also
        return 'transform';
    }
    
    var _propsObj = null;
    
    var proxied = $.fn.css;
    $.fn.css = function (arg, val)
    {
        // Temporary solution for current 1.6.x incompatibility, while
        // preserving 1.3.x compatibility, until I can rewrite using CSS Hooks
        if (_propsObj === null)
        {
            if (typeof $.cssProps != 'undefined')
            {
                _propsObj = $.cssProps;
            }
            else if (typeof $.props != 'undefined')
            {
                _propsObj = $.props;
            }
            else
            {
                _propsObj = {}
            }
        }
        
        // Find the correct browser specific property and setup the mapping using
        // $.props which is used internally by jQuery.attr() when setting CSS
        // properties via either the css(name, value) or css(properties) method.
        // The problem with doing this once outside of css() method is that you
        // need a DOM node to find the right CSS property, and there is some risk
        // that somebody would call the css() method before body has loaded or any
        // DOM-is-ready events have fired.
        if
        (
            typeof _propsObj['transform'] == 'undefined'
            &&
            (
                arg == 'transform'
                ||
                (
                    typeof arg == 'object'
                    && typeof arg['transform'] != 'undefined'
                )
            )
        )
        {
            _propsObj['transform'] = getTransformProperty(this.get(0));
        }
        
        // We force the property mapping here because jQuery.attr() does
        // property mapping with jQuery.props when setting a CSS property,
        // but curCSS() does *not* do property mapping when *getting* a
        // CSS property.  (It probably should since it manually does it
        // for 'float' now anyway... but that'd require more testing.)
        //
        // But, only do the forced mapping if the correct CSS property
        // is not 'transform' and is something else.
        if (_propsObj['transform'] != 'transform')
        {
            // Call in form of css('transform' ...)
            if (arg == 'transform')
            {
                arg = _propsObj['transform'];
                
                // User wants to GET the transform CSS, and in jQuery 1.4.3
                // calls to css() for transforms return a matrix rather than
                // the actual string specified by the user... avoid that
                // behavior and return the string by calling jQuery.style()
                // directly
                if (typeof val == 'undefined' && jQuery.style)
                {
                    return jQuery.style(this.get(0), arg);
                }
            }

            // Call in form of css({'transform': ...})
            else if
            (
                typeof arg == 'object'
                && typeof arg['transform'] != 'undefined'
            )
            {
                arg[_propsObj['transform']] = arg['transform'];
                delete arg['transform'];
            }
        }
        
        return proxied.apply(this, arguments);
    };
})(jQuery);
/*
 * jQuery Easing v1.3 - http://gsgd.co.uk/sandbox/jquery/easing/
 *
 * Uses the built in easing capabilities added In jQuery 1.1
 * to offer multiple easing options
 *
 * TERMS OF USE - jQuery Easing
 * 
 * Open source under the BSD License. 
 * 
 * Copyright 漏 2008 George McGinley Smith
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, 
 * are permitted provided that the following conditions are met:
 * 
 * Redistributions of source code must retain the above copyright notice, this list of 
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list 
 * of conditions and the following disclaimer in the documentation and/or other materials 
 * provided with the distribution.
 * 
 * Neither the name of the author nor the names of contributors may be used to endorse 
 * or promote products derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
 * OF THE POSSIBILITY OF SUCH DAMAGE. 
 *
*/

// t: current time, b: begInnIng value, c: change In value, d: duration
jQuery.easing['jswing'] = jQuery.easing['swing'];

jQuery.extend( jQuery.easing,
{
	def: 'easeOutQuad',
	swing: function (x, t, b, c, d) {
		//alert(jQuery.easing.default);
		return jQuery.easing[jQuery.easing.def](x, t, b, c, d);
	},
	easeInQuad: function (x, t, b, c, d) {
		return c*(t/=d)*t + b;
	},
	easeOutQuad: function (x, t, b, c, d) {
		return -c *(t/=d)*(t-2) + b;
	},
	easeInOutQuad: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t + b;
		return -c/2 * ((--t)*(t-2) - 1) + b;
	},
	easeInCubic: function (x, t, b, c, d) {
		return c*(t/=d)*t*t + b;
	},
	easeOutCubic: function (x, t, b, c, d) {
		return c*((t=t/d-1)*t*t + 1) + b;
	},
	easeInOutCubic: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t + b;
		return c/2*((t-=2)*t*t + 2) + b;
	},
	easeInQuart: function (x, t, b, c, d) {
		return c*(t/=d)*t*t*t + b;
	},
	easeOutQuart: function (x, t, b, c, d) {
		return -c * ((t=t/d-1)*t*t*t - 1) + b;
	},
	easeInOutQuart: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
		return -c/2 * ((t-=2)*t*t*t - 2) + b;
	},
	easeInQuint: function (x, t, b, c, d) {
		return c*(t/=d)*t*t*t*t + b;
	},
	easeOutQuint: function (x, t, b, c, d) {
		return c*((t=t/d-1)*t*t*t*t + 1) + b;
	},
	easeInOutQuint: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
		return c/2*((t-=2)*t*t*t*t + 2) + b;
	},
	easeInSine: function (x, t, b, c, d) {
		return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
	},
	easeOutSine: function (x, t, b, c, d) {
		return c * Math.sin(t/d * (Math.PI/2)) + b;
	},
	easeInOutSine: function (x, t, b, c, d) {
		return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
	},
	easeInExpo: function (x, t, b, c, d) {
		return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
	},
	easeOutExpo: function (x, t, b, c, d) {
		return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
	},
	easeInOutExpo: function (x, t, b, c, d) {
		if (t==0) return b;
		if (t==d) return b+c;
		if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
		return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
	},
	easeInCirc: function (x, t, b, c, d) {
		return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
	},
	easeOutCirc: function (x, t, b, c, d) {
		return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
	},
	easeInOutCirc: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
		return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
	},
	easeInElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
	},
	easeOutElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
	},
	easeInOutElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
		if (a < Math.abs(c)) { a=c; var s=p/4; }
		else var s = p/(2*Math.PI) * Math.asin (c/a);
		if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
		return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
	},
	easeInBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c*(t/=d)*t*((s+1)*t - s) + b;
	},
	easeOutBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
	},
	easeInOutBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158; 
		if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
		return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
	},
	easeInBounce: function (x, t, b, c, d) {
		return c - jQuery.easing.easeOutBounce (x, d-t, 0, c, d) + b;
	},
	easeOutBounce: function (x, t, b, c, d) {
		if ((t/=d) < (1/2.75)) {
			return c*(7.5625*t*t) + b;
		} else if (t < (2/2.75)) {
			return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
		} else if (t < (2.5/2.75)) {
			return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
		} else {
			return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
		}
	},
	easeInOutBounce: function (x, t, b, c, d) {
		if (t < d/2) return jQuery.easing.easeInBounce (x, t*2, 0, c, d) * .5 + b;
		return jQuery.easing.easeOutBounce (x, t*2-d, 0, c, d) * .5 + c*.5 + b;
	}
});

/*
 *
 * TERMS OF USE - EASING EQUATIONS
 * 
 * Open source under the BSD License. 
 * 
 * Copyright 漏 2001 Robert Penner
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, 
 * are permitted provided that the following conditions are met:
 * 
 * Redistributions of source code must retain the above copyright notice, this list of 
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list 
 * of conditions and the following disclaimer in the documentation and/or other materials 
 * provided with the distribution.
 * 
 * Neither the name of the author nor the names of contributors may be used to endorse 
 * or promote products derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 *  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 *  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 *  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
 * OF THE POSSIBILITY OF SUCH DAMAGE. 
 *
 */(function ($) {
    // Monkey patch jQuery 1.3.1+ to add support for setting or animating CSS
    // scale and rotation independently.
    // 2009-2010 Zachary Johnson www.zachstronaut.com
    // Updated 2010.11.06
    var rotateUnits = 'deg';
    
    $.fn.rotate = function (val)
    {
        var style = $(this).css('transform') || 'none';
        
        if (typeof val == 'undefined')
        {
            if (style)
            {
                var m = style.match(/rotate\(([^)]+)\)/);
                if (m && m[1])
                {
                    return m[1];
                }
            }
            
            return 0;
        }
        
        var m = val.toString().match(/^(-?\d+(\.\d+)?)(.+)?$/);
        if (m)
        {
            if (m[3])
            {
                rotateUnits = m[3];
            }
            
            $(this).css(
                'transform',
                style.replace(/none|rotate\([^)]*\)/, '') + 'rotate(' + m[1] + rotateUnits + ')'
            );
        }
        
        return this;
    }
    
    // Note that scale is unitless.
    $.fn.scale = function (val, duration, options)
    {
        var style = $(this).css('transform');
        
        if (typeof val == 'undefined')
        {
            if (style)
            {
                var m = style.match(/scale\(([^)]+)\)/);
                if (m && m[1])
                {
                    return m[1];
                }
            }
            
            return 1;
        }
        
        $(this).css(
            'transform',
            style.replace(/none|scale\([^)]*\)/, '') + 'scale(' + val + ')'
        );
        
        return this;
    }

    // fx.cur() must be monkey patched because otherwise it would always
    // return 0 for current rotate and scale values
    var curProxied = $.fx.prototype.cur;
    $.fx.prototype.cur = function ()
    {
        if (this.prop == 'rotate')
        {
            return parseFloat($(this.elem).rotate());
        }
        else if (this.prop == 'scale')
        {
            return parseFloat($(this.elem).scale());
        }
        
        return curProxied.apply(this, arguments);
    }
    
    $.fx.step.rotate = function (fx)
    {
        $(fx.elem).rotate(fx.now + rotateUnits);
    }
    
    $.fx.step.scale = function (fx)
    {
        $(fx.elem).scale(fx.now);
    }
    
    /*
    
    Starting on line 3905 of jquery-1.3.2.js we have this code:
    
    // We need to compute starting value
    if ( unit != "px" ) {
        self.style[ name ] = (end || 1) + unit;
        start = ((end || 1) / e.cur(true)) * start;
        self.style[ name ] = start + unit;
    }
    
    This creates a problem where we cannot give units to our custom animation
    because if we do then this code will execute and because self.style[name]
    does not exist where name is our custom animation's name then e.cur(true)
    will likely return zero and create a divide by zero bug which will set
    start to NaN.
    
    The following monkey patch for animate() gets around this by storing the
    units used in the rotation definition and then stripping the units off.
    
    */
    
    var animateProxied = $.fn.animate;
    $.fn.animate = function (prop)
    {
        if (typeof prop['rotate'] != 'undefined')
        {
            var m = prop['rotate'].toString().match(/^(([+-]=)?(-?\d+(\.\d+)?))(.+)?$/);
            if (m && m[5])
            {
                rotateUnits = m[5];
            }
            
            prop['rotate'] = m[1];
        }
        
        return animateProxied.apply(this, arguments);
    }
})(jQuery);/*

Quicksand 1.2.2

Reorder and filter items with a nice shuffling animation.

Copyright (c) 2010 Jacek Galanciak (razorjack.net) and agilope.com
Big thanks for Piotr Petrus (riddle.pl) for deep code review and wonderful docs & demos.

Dual licensed under the MIT and GPL version 2 licenses.
http://github.com/jquery/jquery/blob/master/MIT-LICENSE.txt
http://github.com/jquery/jquery/blob/master/GPL-LICENSE.txt

Project site: http://razorjack.net/quicksand
Github site: http://github.com/razorjack/quicksand

*/

(function ($) {
    $.fn.quicksand = function (collection, customOptions) {     
        var options = {
            duration: 750,
            easing: 'swing',
            attribute: 'data-id', // attribute to recognize same items within source and dest
            adjustHeight: 'auto', // 'dynamic' animates height during shuffling (slow), 'auto' adjusts it before or after the animation, false leaves height constant
            useScaling: true, // disable it if you're not using scaling effect or want to improve performance
            enhancement: function(c) {}, // Visual enhacement (eg. font replacement) function for cloned elements
            selector: '> *',
            dx: 0,
            dy: 0
        };
        $.extend(options, customOptions);
        
        if ($.browser.msie || (typeof($.fn.scale) == 'undefined')) {
            // Got IE and want scaling effect? Kiss my ass.
            options.useScaling = false;
        }
        
        var callbackFunction;
        if (typeof(arguments[1]) == 'function') {
            var callbackFunction = arguments[1];
        } else if (typeof(arguments[2] == 'function')) {
            var callbackFunction = arguments[2];
        }
    
        
        return this.each(function (i) {
            var val;
            var animationQueue = []; // used to store all the animation params before starting the animation; solves initial animation slowdowns
            var $collection = $(collection).clone(); // destination (target) collection
            var $sourceParent = $(this); // source, the visible container of source collection
            var sourceHeight = $(this).css('height'); // used to keep height and document flow during the animation
            
            var destHeight;
            var adjustHeightOnCallback = false;
            
            var offset = $($sourceParent).offset(); // offset of visible container, used in animation calculations
            var offsets = []; // coordinates of every source collection item            
            
            var $source = $(this).find(options.selector); // source collection items
            
            // Replace the collection and quit if IE6
            if ($.browser.msie && $.browser.version.substr(0,1)<7) {
                $sourceParent.html('').append($collection);
                return;
            }

            // Gets called when any animation is finished
            var postCallbackPerformed = 0; // prevents the function from being called more than one time
            var postCallback = function () {
                
                if (!postCallbackPerformed) {
                    postCallbackPerformed = 1;
                    
                    // hack: 
                    // used to be: $sourceParent.html($dest.html()); // put target HTML into visible source container
                    // but new webkit builds cause flickering when replacing the collections
                    $toDelete = $sourceParent.find('> *');
                    $sourceParent.prepend($dest.find('> *'));
                    $toDelete.remove();
                         
                    if (adjustHeightOnCallback) {
                        $sourceParent.css('height', destHeight);
                    }
                    options.enhancement($sourceParent); // Perform custom visual enhancements on a newly replaced collection
                    if (typeof callbackFunction == 'function') {
                        callbackFunction.call(this);
                    }                    
                }
            };
            
            // Position: relative situations
            var $correctionParent = $sourceParent.offsetParent();
            var correctionOffset = $correctionParent.offset();
            if ($correctionParent.css('position') == 'relative') {
                if ($correctionParent.get(0).nodeName.toLowerCase() == 'body') {

                } else {
                    correctionOffset.top += (parseFloat($correctionParent.css('border-top-width')) || 0);
                    correctionOffset.left +=( parseFloat($correctionParent.css('border-left-width')) || 0);
                }
            } else {
                correctionOffset.top -= (parseFloat($correctionParent.css('border-top-width')) || 0);
                correctionOffset.left -= (parseFloat($correctionParent.css('border-left-width')) || 0);
                correctionOffset.top -= (parseFloat($correctionParent.css('margin-top')) || 0);
                correctionOffset.left -= (parseFloat($correctionParent.css('margin-left')) || 0);
            }
            
            // perform custom corrections from options (use when Quicksand fails to detect proper correction)
            if (isNaN(correctionOffset.left)) {
                correctionOffset.left = 0;
            }
            if (isNaN(correctionOffset.top)) {
                correctionOffset.top = 0;
            }
            
            correctionOffset.left -= options.dx;
            correctionOffset.top -= options.dy;

            // keeps nodes after source container, holding their position
            $sourceParent.css('height', $(this).height());
            
            // get positions of source collections
            $source.each(function (i) {
                offsets[i] = $(this).offset();
            });
            
            // stops previous animations on source container
            $(this).stop();
            var dx = 0; var dy = 0;
            $source.each(function (i) {
                $(this).stop(); // stop animation of collection items
                var rawObj = $(this).get(0);
                if (rawObj.style.position == 'absolute') {
                    dx = -options.dx;
                    dy = -options.dy;
                } else {
                    dx = options.dx;
                    dy = options.dy;                    
                }

                rawObj.style.position = 'absolute';
                rawObj.style.margin = '0';

                rawObj.style.top = (offsets[i].top - parseFloat(rawObj.style.marginTop) - correctionOffset.top + dy) + 'px';
                rawObj.style.left = (offsets[i].left - parseFloat(rawObj.style.marginLeft) - correctionOffset.left + dx) + 'px';
            });
                    
            // create temporary container with destination collection
            var $dest = $($sourceParent).clone();
            var rawDest = $dest.get(0);
            rawDest.innerHTML = '';
            rawDest.setAttribute('id', '');
            rawDest.style.height = 'auto';
            rawDest.style.width = $sourceParent.width() + 'px';
            $dest.append($collection);      
            // insert node into HTML
            // Note that the node is under visible source container in the exactly same position
            // The browser render all the items without showing them (opacity: 0.0)
            // No offset calculations are needed, the browser just extracts position from underlayered destination items
            // and sets animation to destination positions.
            $dest.insertBefore($sourceParent);
            $dest.css('opacity', 0.0);
            rawDest.style.zIndex = -1;
            
            rawDest.style.margin = '0';
            rawDest.style.position = 'absolute';
            rawDest.style.top = offset.top - correctionOffset.top + 'px';
            rawDest.style.left = offset.left - correctionOffset.left + 'px';
            
            if (options.adjustHeight === 'dynamic') {
                // If destination container has different height than source container
                // the height can be animated, adjusting it to destination height
                $sourceParent.animate({height: $dest.height()}, options.duration, options.easing);
            } else if (options.adjustHeight === 'auto') {
                destHeight = $dest.height();
                if (parseFloat(sourceHeight) < parseFloat(destHeight)) {
                    // Adjust the height now so that the items don't move out of the container
                    $sourceParent.css('height', destHeight);
                } else {
                    //  Adjust later, on callback
                    adjustHeightOnCallback = true;
                }
            }
                
            // Now it's time to do shuffling animation
            // First of all, we need to identify same elements within source and destination collections    
            $source.each(function (i) {
                var destElement = [];
                if (typeof(options.attribute) == 'function') {
                    val = options.attribute($(this));
                    $collection.each(function() {
                        if (options.attribute(this) == val) {
                            destElement = $(this);
                            return false;
                        }
                    });
                } else {
                    destElement = $collection.filter('[' + options.attribute + '=' + $(this).attr(options.attribute) + ']');
                }
                if (destElement.length) {
                    // The item is both in source and destination collections
                    // It it's under different position, let's move it
                    if (!options.useScaling) {
                        animationQueue.push(
                                            {
                                                element: $(this), 
                                                animation: 
                                                    {top: destElement.offset().top - correctionOffset.top, 
                                                     left: destElement.offset().left - correctionOffset.left, 
                                                     opacity: 1.0
                                                    }
                                            });

                    } else {
                        animationQueue.push({
                                            element: $(this), 
                                            animation: {top: destElement.offset().top - correctionOffset.top, 
                                                        left: destElement.offset().left - correctionOffset.left, 
                                                        opacity: 1.0, 
                                                        scale: '1.0'
                                                       }
                                            });

                    }
                } else {
                    // The item from source collection is not present in destination collections
                    // Let's remove it
                    if (!options.useScaling) {
                        animationQueue.push({element: $(this), 
                                             animation: {opacity: '0.0'}});
                    } else {
                        animationQueue.push({element: $(this), animation: {opacity: '0.0', 
                                         scale: '0.0'}});
                    }
                }
            });
            
            $collection.each(function (i) {
                // Grab all items from target collection not present in visible source collection
                var sourceElement = [];
                var destElement = [];
                if (typeof(options.attribute) == 'function') {
                    val = options.attribute($(this));
                    $source.each(function() {
                        if (options.attribute(this) == val) {
                            sourceElement = $(this);
                            return false;
                        }
                    });                 

                    $collection.each(function() {
                        if (options.attribute(this) == val) {
                            destElement = $(this);
                            return false;
                        }
                    });
                } else {
                    sourceElement = $source.filter('[' + options.attribute + '=' + $(this).attr(options.attribute) + ']');
                    destElement = $collection.filter('[' + options.attribute + '=' + $(this).attr(options.attribute) + ']');
                }
                
                var animationOptions;
                if (sourceElement.length === 0) {
                    // No such element in source collection...
                    if (!options.useScaling) {
                        animationOptions = {
                            opacity: '1.0'
                        };
                    } else {
                        animationOptions = {
                            opacity: '1.0',
                            scale: '1.0'
                        };
                    }
                    // Let's create it
                    d = destElement.clone();
                    var rawDestElement = d.get(0);
                    rawDestElement.style.position = 'absolute';
                    rawDestElement.style.margin = '0';
                    rawDestElement.style.top = destElement.offset().top - correctionOffset.top + 'px';
                    rawDestElement.style.left = destElement.offset().left - correctionOffset.left + 'px';
                    d.css('opacity', 0.0); // IE
                    if (options.useScaling) {
                        d.css('transform', 'scale(0.0)');
                    }
                    d.appendTo($sourceParent);
                    
                    animationQueue.push({element: $(d), 
                                         animation: animationOptions});
                }
            });
            
            $dest.remove();
            options.enhancement($sourceParent); // Perform custom visual enhancements during the animation
            for (i = 0; i < animationQueue.length; i++) {
                animationQueue[i].element.animate(animationQueue[i].animation, options.duration, options.easing, postCallback);
            }
        });
    };
})(jQuery);/**
 * ColorPicker. JQuery plugin
 * Create drop-down colors palette.
 *
 * Usage:
 * $(selector).ColorPicker(opts)
 *
 * set color after init:
 * var c = $(selector).ColorPicker(opts)
 * c.val('#ffff99)
 *
 * Get selected color:
 * var color = c.val();
 *
 * Notice!
 *   Palette created only after first click on element (lazzy loading)
 *
 * Options:
 *   colors - colors array (by default display 256 web safe colors)
 *   color  - current (selected) color
 *   class - css class for display "button" (element on wich plugin was called)
 *   paletteClass - css class for colors palette
 *   palettePosition - string indicate where palette will created:
 *      'inner' - palette will attach to element (acceptable in most cases)
 *      'outer' - palette will attach to document.body. 
 *                Use, when create color picker inside element with overflow == 'hidden', for example in ui.dialog
 *   update - function wich update button view on select color (by default set selected color as background)
 *   handler - callback, called when color was selected (by default write color to console.log)
 *   name   - hidden text field in wich selected color value will saved
 *
 * @author:    Dmitry Levashov (dio) dio@std42.ru
 *
 **/
(function($) {

	$.fn.ColorPicker = function(o) {
		var self     = this;
		var opts     = $.extend({}, $.fn.ColorPicker.defaults, o);
		this.hidden  = $('<input type="hidden" />').attr('name', opts.name).appendTo(this);
		this.palette = null;
		this.preview = null;
		this.input   = null;
		this.indicator = $('<div />').addClass('color-indicator').appendTo(this);

		function setColor(c) {
			self.val(c);
			opts.handler && opts.handler(self.val());
			self.palette.slideUp();
		}

		function init() {
			self.palette  = $('<div />').addClass(opts.paletteClass+' rounded-3');
			for (var i=0; i < opts.colors.length; i++) {
				$('<div />').addClass('color').css('background-color', opts.colors[i])
					.attr({title : opts.colors[i], unselectable : 'on'}).appendTo(self.palette)
					.mouseenter(function() {
						var v = $(this).attr('title');
						self.input.val(v);
						self.preview.css('background-color', v);
					}).click(function(e) {
						e.stopPropagation(); 
						setColor($(this).attr('title'));
					});
			};
			self.input = $('<input type="text" />').addClass('rounded-3').attr('size', 8)
				.click(function(e) {
					e.stopPropagation();
					$(this).focus();
				}).keydown(function(e) {
					if (e.ctrlKey || e.metaKey) return true;
					var k = e.keyCode;
					if (k == 27) return self.mouseleave();  // on esc - close palette
					// allow input only hex color value
					if (k!=8 && k != 13 && k!=46 && k!=37 && k != 39 && (k<48 || k>57) && (k<65 || k > 70)) {
						return false;
					}
					var c = $(this).val();
					if (c.length == 7 || c.length == 0) {
						if (k == 13) {
							e.stopPropagation();
							e.preventDefault();
							setColor(c);
							self.palette.slideUp();
						}
						if (e.keyCode != 8 && e.keyCode != 46 && k!=37 && k != 39) {
							return false;
						}
					}
				}).keyup(function(e) {
					var c = $(this).val(); 
					c.length == 7 && /^#[0-9abcdef]{6}$/i.test(c) && self.val(c);
				});
				
			self.preview = $('<div />').addClass('preview rounded-3')
				.click(function(e) {
					e.stopPropagation();
					setColor(self.input.val());
				});
			
			self.palette	.append($('<div />').addClass('clearfix'))
				.append($('<div />').addClass('panel').append(self.input).append(self.preview));
			
			if (opts.palettePosition == 'outer') {
				self.palette.hide().appendTo(self.parents('body').eq(0))
					.mouseleave(function() {
						if (!self.palette.is(':animated')) {
							$(this).slideUp();
							self.val(self.val());
					    }
					});
				self.mouseleave(function(e) {
					if (e.relatedTarget != self.palette.get(0)) {
						if (!self.palette.is(':animated')) {
							self.palette.slideUp();
							self.val(self.val());
						}
					}
				});
			} else {
				self.append(self.palette.hide())
					.mouseleave(function(e) {
						self.palette.slideUp();
						self.val(self.val());
					});
			}
			self.val(self.val());
		}
		
		this.click(function(e) { 
			if (!self.hasClass('disabled')) {
				!self.palette && init();
				if (opts.palettePosition == 'outer' && self.palette.css('display') == 'none') {
					var o = $(this).offset(), w = self.palette.width();
					var l = self.parents('body').width() - o.left >= w ? o.left : o.left + $(this).outerWidth() - w;
					self.palette.css({left : l+'px', top : o.top+$(this).height()+1+'px'});
				}
				self.palette.slideToggle();
			}
		});
		
		this.val = function(v) {
			if (!v && v!=='') {
				return this.hidden.val();
			} else {
				this.hidden.val(v);
				if (opts.update) {
					opts.update.apply(this, [this.hidden.val()]);
				} else {
					this.css('background-color', v);
				}
				
				if (self.palette) {
					self.preview.css('background-color', v);
					self.input.val(v);
				}
			}
			return this;
		};

		this.val(opts.color||'');
		return this;
	};

	$.fn.ColorPicker.defaults = {
		'class'         : 'colorpicker',
		paletteClass    : 'palette',
		palettePosition : 'outer',
		name            : 'color',
		color           : '',
		update          :  function(c) { this.indicator.css('background-color', c); },
		handler          : function(c) { },
		colors          : [
			'#ffffff', '#cccccc', '#999999', '#666666', '#333333', '#000000', 
			'#ffcccc', '#cc9999', '#996666', '#663333', '#330000', 
			'#ff9999', '#cc6666', '#cc3333', '#993333', '#660000', 
			'#ff6666', '#ff3333', '#ff0000', '#cc0000', '#990000',
			'#ff9966', '#ff6633', '#ff3300', '#cc3300', '#993300',
			'#ffcc99', '#cc9966', '#cc6633', '#996633', '#663300',
			'#ff9933', '#ff6600', '#ff9900', '#cc6600', '#cc9933',
			'#ffcc66', '#ffcc33', '#ffcc00', '#cc9900', '#996600',
			'#ffffcc', '#cccc99', '#999966', '#666633', '#333300',
			'#ffff99', '#cccc66', '#cccc33', '#999933', '#666600',
			'#ffff66', '#ffff33', '#ffff00', '#cccc00', '#999900',
			'#ccff66', '#ccff33', '#ccff00', '#99cc00', '#669900',
			'#ccff99', '#99cc66', '#99cc33', '#669933', '#336600',
			'#99ff33', '#99ff00', '#66ff00', '#66cc00', '#66cc33',
			'#99ff66', '#66ff33', '#33ff00', '#33cc00', '#339900',
			'#ccffcc', '#99cc99', '#669966', '#336633', '#003300',
			'#99ff99', '#66cc66', '#33cc33', '#339933', '#006600',
			'#66ff66', '#33ff33', '#00ff00', '#00cc00', '#009900',
			'#66ff99', '#33ff66', '#00ff33', '#00cc33', '#009933',			
			'#99ffcc', '#66cc99', '#33cc66', '#339966', '#006633',						
			'#33ff99', '#00ff66', '#00ff99', '#00cc66', '#33cc99',						
			'#66ffcc', '#33ffcc', '#00ffcc', '#00cc99', '#009966',						
			'#ccffff', '#99cccc', '#669999', '#336666', '#003333',						
			'#99ffff', '#66cccc', '#33cccc', '#339999', '#006666',						
			'#66cccc', '#33ffff', '#00ffff', '#00cccc', '#009999',						
			'#66ccff', '#33ccff', '#00ccff', '#0099cc', '#006699',																		
			'#99ccff', '#6699cc', '#3399cc', '#336699', '#003366',						
			'#3399ff', '#0099ff', '#0066ff', '#066ccc', '#3366cc',																		
			'#6699ff', '#3366ff', '#0033ff', '#0033cc', '#003399',						
			'#ccccff', '#9999cc', '#666699', '#333366', '#000033',																		
			'#9999ff', '#6666cc', '#3333cc', '#333399', '#000066',																		
			'#6666ff', '#3333ff', '#0000ff', '#0000cc', '#009999',																		
			'#9966ff', '#6633ff', '#3300ff', '#3300cc', '#330099',																		
			'#cc99ff', '#9966cc', '#6633cc', '#663399', '#330066',
			'#9933ff', '#6600ff', '#9900ff', '#6600cc', '#9933cc',			
			'#cc66ff', '#cc33ff', '#cc00ff', '#9900cc', '#660099',
			'#ffccff', '#cc99cc', '#996699', '#663366', '#330033',			
			'#ff99ff', '#cc66cc', '#cc33cc', '#993399', '#660066',
			'#ff66ff', '#ff33ff', '#ff00ff', '#cc00cc', '#990099',			
			'#ff66cc', '#ff33cc', '#ff00cc', '#cc0099', '#990066',
			'#ff99cc', '#cc6699', '#cc3399', '#993366', '#660033',			
			'#ff3399', '#ff0099', '#ff0066', '#cc0066', '#cc3366',
			'#ff6699', '#ff3366', '#ff0033', '#cc0033', '#990033'		
			]
	};
})(jQuery);
/**
 * jQuery plugin. Create group of text input, elSelect and elColorPicker. 
 * Allow input border-width, border-style and border-color. Used in rte
 *
 * @author:    Dmitry Levashov (dio) dio@std42.ru
 **/
(function($) {
	
	$.fn.elBorderSelect = function(o) {
		
		var $self = this;
		var self  = this.eq(0);
		var opts  = $.extend({}, $.fn.elBorderSelect.defaults, o);
		var width = $('<input type="text" />')
			.attr({'name' : opts.name+'[width]', size : 3}).css('text-align', 'right')
			.change(function() { $self.change(); });
		
		var color = $('<div />').css('position', 'relative').ColorPicker({
				'class'         : 'el-colorpicker ui-icon ui-icon-pencil',
				name            : opts.name+'[color]', 
				palettePosition : 'outer',
				change          : function() { $self.change(); }
			});
		
		
		var style = $('<div />').elSelect({
			tpl       : '<div style="border-bottom:4px %val #000;width:100%;margin:7px 0"> </div>',
			tpls      : { '' : '%label'},
			maxHeight : opts.styleHeight || null,
			select    : function() { $self.change(); },
			src       : {
				''       : 'none',
				solid    : 'solid',
				dashed   : 'dashed',
				dotted   : 'dotted',
				'double' : 'double',
				groove   : 'groove',
				ridge    : 'ridge',
				inset    : 'inset',
				outset   : 'outset'
			}
		});
		
		self.empty()
			.addClass(opts['class'])
			.attr('name', opts.name||'')
			.append(
				$('<table />').attr('cellspacing', 0).append(
					$('<tr />')
						.append($('<td />').append(width).append(' px'))
						.append($('<td />').append(style))
						.append($('<td />').append(color))
				)
			);
		
		function rgb2hex(str) {
		    function hex(x)  {
		    	hexDigits = ["0", "1", "2", "3", "4", "5", "6", "7", "8","9", "a", "b", "c", "d", "e", "f"];
		        return !x  ? "00" : hexDigits[(x - x % 16) / 16] + hexDigits[x% 16];
		    }
			var rgb = (str||'').match(/\(([0-9]{1,3}),\s*([0-9]{1,3}),\s*([0-9]{1,3})\)/); 
			return rgb ? "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]) : '';
		}
		
		function toPixels(num) {
			if (!num) {
				return num;
			}
			var m = num.match(/([0-9]+\.?[0-9]*)\s*(px|pt|em|%)/);
			if (m) {
				num  = m[1];
				unit = m[2];
			} 
			if (num[0] == '.') {
				num = '0'+num;
			}
			num = parseFloat(num);

			if (isNaN(num)) {
				return '';
			}
			var base = parseInt($(document.body).css('font-size')) || 16;
			switch (unit) {
				case 'em': return parseInt(num*base);
				case 'pt': return parseInt(num*base/12);
				case '%' : return parseInt(num*base/100);
			}
			return num;
		}
		
		this.change = function() {
			opts.change && opts.change(this.val());
		};
		
		this.val = function(v) {
			var w, s, c, b, m;
			
			if (!v && v !== '') {
				w = parseInt(width.val());
				w = !isNaN(w) ? w+'px' : '';
				s = style.val();
				c = color.val();
				return { width : w, style : s, color : c, css : $.trim(w+' '+s+' '+c) };
			} else {
				b = '';
				if (v.nodeName || v.css) {
					if (!v.css) {
						v = $(v);					
					}
					b = v.css('border');
					if ((b = v.css('border'))) {
						w = s = c = b;
					} else {
						w = v.css('border-width');
						s = v.css('border-style');
						c = v.css('border-color');
					}

				} else {
					w = v.width||'';
					s = v.style||'';
					c = v.color||'';
				}

				width.val(toPixels(w));
				m = s ? s.match(/(solid|dashed|dotted|double|groove|ridge|inset|outset)/i) :'';
				style.val(m ? m[1] : '');
				color.val(c.indexOf('#') === 0 ? c : rgb2hex(c));
				return this;
			}
		};
		
		this.val(opts.value);
		return this;
	};
	
	$.fn.elBorderSelect.defaults = {
		name      : 'el-borderselect',
		'class'   : 'el-borderselect',
		value     : {},
		change    : null
	};
	
})(jQuery);
/**
 * jQuery plugin. Create group of text input fields and selects for setting padding/margin. Used in rte
 *
 * @author:    Dmitry Levashov (dio) dio@std42.ru
 **/
(function($) {
	
	$.fn.elPaddingInput = function(o) {
		var self = this;
		var opts = $.extend({}, $.fn.elPaddingInput.defaults, {name : this.attr('name')}, o);
		this.regexps = {
			main   : new RegExp(opts.type == 'padding' ? 'padding\s*:\s*([^;"]+)'        : 'margin\s*:\s*([^;"]+)',       'im'),
			left   : new RegExp(opts.type == 'padding' ? 'padding-left\s*:\s*([^;"]+)'   : 'margin-left\s*:\s*([^;"]+)',  'im'),
			top    : new RegExp(opts.type == 'padding' ? 'padding-top\s*:\s*([^;"]+)'    : 'margin-top\s*:\s*([^;"]+)',    'im'),
			right  : new RegExp(opts.type == 'padding' ? 'padding-right\s*:\s*([^;"]+)'  : 'margin-right\s*:\s*([^;"]+)',  'im'),
			bottom : new RegExp(opts.type == 'padding' ? 'padding-bottom\s*:\s*([^;"]+)' : 'margin-bottom\s*:\s*([^;"]+)', 'im')
		};
			
		$.each(['left', 'top', 'right', 'bottom'], function() {
			
			self[this] = $('<input type="text" />')
				.attr('size', 3)
				.css('text-align', 'right')
				.css('border-'+this, '2px solid red')
				.bind('change', function() { $(this).val(parseNum($(this).val())); change(); })
				.attr('name', opts.name+'['+this+']');
		});
		$.each(['uleft', 'utop', 'uright', 'ubottom'], function() {
			self[this] = $('<select />')
				.append('<option value="px">px</option>')
				.append('<option value="em">em</option>')
				.append('<option value="pt">pt</option>')
				.bind('change', function() { change(); })
				.attr('name', opts.name+'['+this+']');
			if (opts.percents) {
				self[this].append('<option value="%">%</option>');
			}
		});
		
		this.empty().addClass(opts['class'])
			.append(this.left).append(this.uleft).append(' x ')
			.append(this.top).append(this.utop).append(' x ')
			.append(this.right).append(this.uright).append(' x ')
			.append(this.bottom).append(this.ubottom);
			
		this.val = function(v) {
			if (!v && v!=='') {
				var l = parseNum(this.left.val());
				var t = parseNum(this.top.val());
				var r = parseNum(this.right.val());
				var b = parseNum(this.bottom.val());
				var ret = {
					left   : l=='auto' || l==0 ? l : (l!=='' ? l+this.uleft.val()   : ''), 
					top    : t=='auto' || t==0 ? t : (t!=='' ? t+this.utop.val()    : ''),
					right  : r=='auto' || r==0 ? r : (r!=='' ? r+this.uright.val()  : ''),
					bottom : b=='auto' || b==0 ? b : (b!=='' ? b+this.ubottom.val() : ''),
					css    : ''
				};
				if (ret.left!=='' && ret.right!=='' && ret.top!=='' && ret.bottom!=='') {
					if (ret.left == ret.right && ret.top == ret.bottom) {
						ret.css = ret.top+' '+ret.left;
					} else{
						ret.css = ret.top+' '+ret.right+' '+ret.bottom+' '+ret.left;
					}
				}
				
				return ret;
			} else {
				
				if (v.nodeName || v.css) {
					if (!v.css) {
						v = $(v);
					}
					var val   = {left : '', top : '', right: '', bottom : ''};
					var style = (v.attr('style')||'').toLowerCase();

					if (style) {
						style   = $.trim(style);
						var m = style.match(this.regexps.main);
						if (m) {
							var tmp    = $.trim(m[1]).replace(/\s+/g, ' ').split(' ', 4);
							val.top    = tmp[0];
							val.right  = tmp[1] && tmp[1]!=='' ? tmp[1] : val.top;
							val.bottom = tmp[2] && tmp[2]!=='' ? tmp[2] : val.top;
							val.left   = tmp[3] && tmp[3]!=='' ? tmp[3] : val.right;
						} else {
							$.each(['left', 'top', 'right', 'bottom'], function() {
								var name = this.toString();
								m = style.match(self.regexps[name]);
								if (m) {
									val[name] = m[1];
								}
							});
						}
					}
					var v = val;
				} 

				$.each(['left', 'top', 'right', 'bottom'], function() {
					var name = this.toString();
					self[name].val('');
					self['u'+name].val();
					if (typeof(v[name]) != 'undefined' && v[name] !== null) {
						v[name] = v[name].toString();
						var _v = parseNum(v[name]);
						self[name].val(_v);
						var m = v[name].match(/(px|em|pt|%)/i);
						self['u'+name].val(m ? m[1] : 'px');
					}
				});
				return this;
			}
		};
			
		function parseNum(num) {
			num = $.trim(num.toString());
			if (num[0] == '.') { 
				num = '0'+num;
			}
			n = parseFloat(num);
			return !isNaN(n) ? n : (num == 'auto' ? num : '');
		}
			
		function change() {
			opts.change && opts.change(self);
		}
		
		this.val(opts.value);
		
		return this;
	};
	
	$.fn.elPaddingInput.defaults = {
		name     : 'el-paddinginput',
		'class'  : 'el-paddinginput',
		type     : 'padding',
		value    : {},
		percents : true,
		change   : null
	};
	
})(jQuery);
/**
 * elSelect JQuery plugin
 * Replacement for select input
 * Allow to put any html and css decoration in drop-down list
 *
 * Usage:
 *   $(selector).elSelect(opts)
 *
 * set value after init:
 *   var c = $(selector).elSelect(opts)
 *   c.val('some value')
 *
 * Get selected value:
 *   var val = c.val();
 *
 * Notice!
 *   1. When called on multiply elements, elSelect create drop-down list only for fist element
 *   2. Elements list created only after first click on element (lazzy loading)
 *
 * Options:
 *   src       - object with pairs value:label to create drop-down list 
 *   value     - current (selected) value
 *   class     - css class for display "button" (element on wich plugin was called)
 *   listClass - css class for drop down elements list
 *   select    - callback, called when value was selected (by default write value to console.log)
 *   name      - hidden text field in wich selected value will saved
 *   maxHeight - elements list max height (if height greater - scroll will appear)
 *   tpl       - template for element in list (contains 2 vars: %var - for src key, %label - for src[val] )
 *   labelTpl  - template for label (current selected element) (contains 2 placeholders: %var - for src key, %label - for src[val] )
 *
 * @author:    Dmitry Levashov (dio) dio@std42.ru
 **/
(function($) {
	
	$.fn.elSelect = function(o) {
		var $self    = this;
		var self     = this.eq(0);
		var opts     = $.extend({}, $.fn.elSelect.defaults, o);
		var hidden   = $('<input type="hidden" />').attr('name', opts.name);
		var label    = $('<label />').attr({unselectable : 'on'}).addClass('rounded-left-3');
		var list     = null;
		var ieWidth  = null;

		if (self.get(0).nodeName == 'SELECT') {
			opts.src = {};
			self.children('option').each(function() {
				opts.src[$(this).val()] = $(this).text();
			});
			opts.value = self.val();
			opts.name  = self.attr('name');
			self.replaceWith((self = $('<div />')));
		}
		
		if (!opts.value || !opts.src[opts.val]) {
			opts.value = null;
			var i = 0;
			for (var v in opts.src) {
				if (i++ == 0) {
					opts.value = v;
				}
			}
		}

		this.val = function(v) {
			if (!v && v!=='') {
				return hidden.val();
			} else {
				if (opts.src[v]) {
					hidden.val(v);
					updateLabel(v);
					if (list) {
						list.children().each(function() {
							if ($(this).attr('name') == v) {
								$(this).addClass('active');
							} else {
								$(this).removeClass('active');
							}
						});
					}
				}
				return this;
			}
		};
	
		// update label content
		function updateLabel(v) {
			var tpl = opts.labelTpl || opts.tpls[v] || opts.tpl;
			label.html(tpl.replace(/%val/g, v).replace(/%label/, opts.src[v])).children().attr({unselectable : 'on'});
		}
		
		// init "select"
		self.empty()
			.addClass(opts['class']+' rounded-3')
			.attr({unselectable : 'on'})
			.append(hidden)
			.append(label)
			.hover(
					function() { $(this).addClass('ui-state-hover'); },
					function() { $(this).removeClass('ui-state-hover'); }
			).click(function(e) {
				!list && init();
				list.slideToggle();
				// stupid ie inherit width from parent
				if ($.browser.msie && !ieWidth) { 
					list.children().each(function() {
						ieWidth = Math.max(ieWidth, $(this).width());
					});
					if (ieWidth > list.width()) {
						list.width(ieWidth+40);
					}
				}
			});
			
		this.val(opts.value);
	
		// create drop-down list
		function init() {
			// not ul because of ie is stupid with mouseleave in it :(
			list = $("<div style='z-index:99999;'/>")
				.addClass(opts.listClass+' rounded-3')
				.hide()
				.appendTo(self.mouseleave(function(e) { list.slideUp(); }));

			for (var v in opts.src) {
				var tpl = opts.tpls[v] || opts.tpl; 
				$('<div class="item"/>')
					.attr('name', v)
					.append( $(tpl.replace(/%val/g, v).replace(/%label/g, opts.src[v])).attr({unselectable : 'on'}) )
					.appendTo(list)
					.click(function(e) {
						e.stopPropagation();
						e.preventDefault();
						
						var v = $(this).attr('name');
						$self.val(v);
						opts.select(v);
						list.slideUp();
					});
			};
			
			var w = self.outerWidth();
			if (list.width() < w) {
				list.width(w);
			}
			
			var h = list.height();
			if (opts.maxHeight>0 && h>opts.maxHeight) {
				list.height(opts.maxHeight);
			}
			
			$self.val(hidden.val());
		}
		
		return this;
	};
	
	$.fn.elSelect.defaults = {
		name      : 'rte-select',
		'class'   : 'rte-select',
		listClass : 'list',
		labelTpl  : null,
		tpl       : '<%val>%label</%val>',
		tpls      : {},
		value     : null,
		src       : {},
		select    : function(v) {  window.console &&  window.console.log && window.console.log('selected: '+v); },
		maxHeight : 410
	};
	
})(jQuery);
function rteDom(rte) {
	this.rte = rte;
	this.regExp = {
		textNodes         : /^(A|ABBR|ACRONYM|ADDRESS|B|BDO|BIG|BLOCKQUOTE|CAPTION|CENTER|CITE|CODE|DD|DEL|DFN|DIV|DT|EM|FIELDSET|FONT|H[1-6]|I|INS|KBD|LABEL|LEGEND|LI|MARQUEE|NOBR|NOEMBED|P|PRE|Q|SAMP|SMALL|SPAN|STRIKE|STRONG|SUB|SUP|TD|TH|TT|VAR)$/,
		textContainsNodes : /^(A|ABBR|ACRONYM|ADDRESS|B|BDO|BIG|BLOCKQUOTE|CAPTION|CENTER|CITE|CODE|DD|DEL|DFN|DIV|DL|DT|EM|FIELDSET|FONT|H[1-6]|I|INS|KBD|LABEL|LEGEND|LI|MARQUEE|NOBR|NOEMBED|OL|P|PRE|Q|SAMP|SMALL|SPAN|STRIKE|STRONG|SUB|SUP|TABLE|THEAD|TBODY|TFOOT|TD|TH|TR|TT|UL|VAR)$/,
		block             : /^(APPLET|BLOCKQUOTE|BR|CAPTION|CENTER|COL|COLGROUP|DD|DIV|DL|DT|H[1-6]|EMBED|FIELDSET|LI|MARQUEE|NOBR|OBJECT|OL|P|PRE|TABLE|THEAD|TBODY|TFOOT|TD|TH|TR|UL)$/,
		selectionBlock    : /^(APPLET|BLOCKQUOTE|BR|CAPTION|CENTER|COL|COLGROUP|DD|DIV|DL|DT|H[1-6]|EMBED|FIELDSET|LI|MARQUEE|NOBR|OBJECT|OL|P|PRE|TD|TH|TR|UL)$/,		
		header            : /^H[1-6]$/,
		formElement       : /^(FORM|INPUT|HIDDEN|TEXTAREA|SELECT|BUTTON)$/
	};
}

rteDom.prototype.createBookmark = function() {
	var b = this.rte.options.doc.createElement('span');
	b.id = 'rte-bm-'+Math.random().toString().substr(2);
	$(b).addClass('rtebm rte-protected');
	return b;
};

rteDom.prototype.attr = function(n, attr) {
	var v = '';
	if (n && n.nodeType == 1) {
		v = $(n).attr(attr);
		if (v && attr != 'src' && attr != 'href' && attr != 'title' && attr != 'alt') {
			v = v.toString().toLowerCase();
		}
	} 
	return v||'';
};

rteDom.prototype.findCommonAncestor = function(n1, n2) {
	if (!n1 || !n2) {
		return;
	}
	if (n1 == n2) {
		return n1;
	} else if (n1.nodeName == 'BODY' || n2.nodeName == 'BODY') {
		return this.rte.options.doc.body;
	}
	var p1 = $(n1).parents(), p2 = $(n2).parents(), l  = p2.length-1, c  = p2[l];
	for (var i = p1.length - 1; i >= 0; i--, l--){
		if (p1[i] == p2[l]) {
			c = p1[i];
		} else {
			break;
		}
	};
	return c;
};

rteDom.prototype.isEmpty = function(n) {
	if (n.nodeType == 1) {
		return this.regExp.textNodes.test(n.nodeName) ? $.trim($(n).text()).length == 0 : false;
	} else if (n.nodeType == 3) {
		return /^(TABLE|THEAD|TFOOT|TBODY|TR|UL|OL|DL)$/.test(n.parentNode.nodeName)
		|| n.nodeValue == ''
			|| ($.trim(n.nodeValue).length== 0 && !(n.nextSibling && n.previousSibling && n.nextSibling.nodeType==1 && n.previousSibling.nodeType==1 && !this.regExp.block.test(n.nextSibling.nodeName) && !this.regExp.block.test(n.previousSibling.nodeName) ));
	}
	return true;
};

rteDom.prototype.next = function(n) {
	while (n.nextSibling && (n = n.nextSibling)) {
		if (n.nodeType == 1 || (n.nodeType == 3 && !this.isEmpty(n))) {
			return n;
		}
	}
	return null;
};

rteDom.prototype.prev = function(n) {
	while (n.previousSibling && (n = n.previousSibling)) {
		if (n.nodeType == 1 || (n.nodeType ==3 && !this.isEmpty(n))) {
			return n;
		}
	}
	return null;
};

rteDom.prototype.isPrev = function(n, prev) {
	while ((n = this.prev(n))) {
		if (n == prev) {
			return true;
		}
	}
	return false;
};

rteDom.prototype.nextAll = function(n) {
	var ret = [];
	while ((n = this.next(n))) {
		ret.push(n);
	}
	return ret;
};

rteDom.prototype.prevAll = function(n) {
	var ret = [];
	while ((n = this.prev(n))) {
		ret.push(n);
	}
	return ret;
};

rteDom.prototype.toLineEnd = function(n) {
	var ret = [];
	while ((n = this.next(n)) && n.nodeName != 'BR' && n.nodeName != 'HR' && this.isInline(n)) {
		ret.push(n);
	}
	return ret;
};

rteDom.prototype.toLineStart = function(n) {
	var ret = [];
	while ((n = this.prev(n)) && n.nodeName != 'BR' && n.nodeName != 'HR' && this.isInline(n) ) {
		ret.unshift(n);
	}
	return ret;
};

rteDom.prototype.isFirstNotEmpty = function(n) {
	while ((n = this.prev(n))) {
		if (n.nodeType == 1 || (n.nodeType == 3 && $.trim(n.nodeValue)!='' ) ) {
			return false;
		}
	}
	return true;
};

rteDom.prototype.isLastNotEmpty = function(n) {
	while ((n = this.next(n))) {
		if (!this.isEmpty(n)) {
			return false;
		}
	}
	return true;
};

rteDom.prototype.isOnlyNotEmpty = function(n) {
	return this.isFirstNotEmpty(n) && this.isLastNotEmpty(n);
};

rteDom.prototype.findLastNotEmpty = function(n) {
	if (n.nodeType == 1 && (l = n.lastChild)) {
		if (!this.isEmpty(l)) {
			return l;
		}
		while (l.previousSibling && (l = l.previousSibling)) {
			if (!this.isEmpty(l)) {
				return l;
			}
		}
	}
	return false;
};

rteDom.prototype.isInline = function(n) {
	if (n.nodeType == 3) {
		return true;
	} else if (n.nodeType == 1) {
		n = $(n);
		var d = n.css('display');
		var f = n.css('float');
		return d == 'inline' || d == 'inline-block' || f == 'left' || f == 'right';
	}
	return true;
};

rteDom.prototype.is = function(n, f) {
	if (n && n.nodeName) {
		if (typeof(f) == 'string') {
			f = this.regExp[f]||/.?/;
		}

		if (f instanceof RegExp && n.nodeName) {
			return f.test(n.nodeName);
		} else if (typeof(f) == 'function') {
			return f(n);
		}
	}
	return false;
};

rteDom.prototype.filter = function(n, filter) {
	var ret = [], i;
	if (!n.push) {
		return this.is(n, filter) ? n : null;
	}
	for (i=0; i < n.length; i++) {
		if (this.is(n[i], filter)) {
			ret.push(n[i]);
		}
	};
	return ret;
};

rteDom.prototype.parents = function(n, filter) {
	var ret = [];
	while (n && (n = n.parentNode) && n.nodeName != 'BODY' && n.nodeName != 'HTML') {
		if (this.is(n, filter)) {
			ret.push(n);
		}
	}
	return ret;
};

rteDom.prototype.parent = function(n, f) { 
	return this.parents(n, f)[0] || null; 
};

rteDom.prototype.selfOrParent = function(n, sf, pf) {
	return this.is(n, sf) ? n : this.parent(n, pf||sf);
};

rteDom.prototype.selfOrParentLink = function(n) {
	n = this.selfOrParent(n, /^A$/);
//	return n && n.href ? n : null;
	return n ? n : null;
};

rteDom.prototype.selfOrParentAnchor = function(n) {
	n = this.selfOrParent(n, /^A$/);
	return n && !n.href && n.name ? n : null;
};

rteDom.prototype.childLinks = function(n) {
	var res = [];
	$('a[href]', n).each(function() { res.push(this); });
	return res;
};

rteDom.prototype.selectionHas = function(sel, f) {
	var n = sel.cloneContents(), i;
	if (n && n.childNodes && n.childNodes.length) {
		for (i=0; i < n.childNodes.length; i++) {
			if (typeof(f) == 'function') {
				if (f(n.childNodes[i])) {
					return true;
				}
			} else if (n instanceof RegExp) {
				if (f.test(n.childNodes[i].nodeName)) {
					return true;
				}
			}
		};
	}

	return false;
};

rteDom.prototype.wrap = function(n, w) {
	n = $.isArray(n) ? n : [n];
	w = w.nodeName ? w : this.rte.options.doc.createElement(w);

	if (n[0] && n[0].nodeType && n[0].parentNode) {
		w = n[0].parentNode.insertBefore(w, n[0]);
		$(n).each(function() {
			if (this!=w) {
				w.appendChild(this);
			}
		});
	}

	return w;
};

rteDom.prototype.unwrap = function(n) {
	if (n && n.parentNode) {
		while (n.firstChild) {
			n.parentNode.insertBefore(n.firstChild, n);
		}
		n.parentNode.removeChild(n);
	}
};

rteDom.prototype.wrapContents = function(n, w) {
	w = w.nodeName ? w : this.rte.options.doc.createElement(w);
	for (var i=0; i < n.childNodes.length; i++) {
		w.appendChild(n.childNodes[i]);
	};
	n.appendChild(w);
	return w;
};

rteDom.prototype.cleanNode = function(n) {
	if (n.nodeType != 1) {
		return;
	}
	if (/^(P|LI)$/.test(n.nodeName) && (l = this.findLastNotEmpty(n)) && l.nodeName == 'BR') {
		$(l).remove();
	}
	$n = $(n);
	$n.children().each(function() {
		this.cleanNode(this);
	});
	if (n.nodeName != 'BODY' && !/^(TABLE|TR|TD)$/.test(n) && this.isEmpty(n)) {
		return $n.remove();
	}
	if ($n.attr('style') === '') {
		$n.removeAttr('style');
	}
	if ($.browser.safari && $n.hasClass('Apple-span')) {
		$n.removeClass('Apple-span');
	}
	if (n.nodeName == 'SPAN' && !$n.attr('style') && !$n.attr('class') && !$n.attr('id')) {
		$n.replaceWith($n.html());
	}
};

rteDom.prototype.cleanChildNodes = function(n) {
	var cmd = this.cleanNode;
	$(n).children().each(function() { cmd(this); });
};

rteDom.prototype.tableMatrix = function(n) {
	var mx = [];
	if (n && n.nodeName == 'TABLE') {
		var max = 0;
		function _pos(r) {
			for (var i=0; i<=max; i++) {
				if (!mx[r][i]) {
					return i;
				}
			};
		}

		$(n).find('tr').each(function(r) {
			if (!$.isArray(mx[r])) {
				mx[r] = [];
			}

			$(this).children('td,th').each(function() {
				var w = parseInt($(this).attr('colspan')||1);
				var h = parseInt($(this).attr('rowspan')||1);
				var i = _pos(r);
				for (var y=0; y<h; y++) {
					for (var x=0; x<w; x++) {
						var _y = r+y;
						if (!$.isArray(mx[_y])) {
							mx[_y] = [];
						}
						var d = x==0 && y==0 ? this : (y==0 ? x : "-");
						mx[_y][i+x] = d;
					}
				};
				max= Math.max(max, mx[r].length);
			});
		});
	}
	return mx;
};

rteDom.prototype.indexesOfCell = function(n, tbm) {
	for (var rnum=0; rnum < tbm.length; rnum++) {
		for (var cnum=0; cnum < tbm[rnum].length; cnum++) {
			if (tbm[rnum][cnum] == n) {
				return [rnum, cnum];
			}

		};
	};
};

rteDom.prototype.fixTable = function(n) {
	if (n && n.nodeName == 'TABLE') {
		var tb = $(n);
		//tb.find('tr:empty').remove();
		var mx = this.tableMatrix(n);
		var x  = 0;
		$.each(mx, function() {
			x = Math.max(x, this.length);
		});
		if (x==0) {
			return tb.remove();
		}

		for (var r=0; r<mx.length; r++) {
			var l = mx[r].length;

			if (l==0) {
				tb.find('tr').eq(r).remove();
//				tb.find('tr').eq(r).append('<td>remove</td>')
			} else if (l<x) {
				var cnt = x-l;
				var row = tb.find('tr').eq(r);
				for (var i=0; i<cnt; i++) {
					row.append('<td>&nbsp;</td>');
				}
			}
		}

	}
};

rteDom.prototype.tableColumn = function(n, ext, fix) {
	n      = this.selfOrParent(n, /^TD|TH$/);
	var tb = this.selfOrParent(n, /^TABLE$/);
	ret    = [];
	info   = {offset : [], delta : []};
	if (n && tb) {
		fix && this.fixTable(tb);
		var mx = this.tableMatrix(tb);
		var _s = false;
		var x;
		for (var r=0; r<mx.length; r++) {
			for (var _x=0; _x<mx[r].length; _x++) {
				if (mx[r][_x] == n) {
					x = _x;
					_s = true;
					break;
				}
			}
			if (_s) {
				break;
			}
		}

		if (x>=0) {
			for(var r=0; r<mx.length; r++) {
				var tmp = mx[r][x]||null;
				if (tmp) {
					if (tmp.nodeName) {
						ret.push(tmp);
						if (ext) {
							info.delta.push(0);
							info.offset.push(x);
						}
					} else {
						var d = parseInt(tmp);
						if (!isNaN(d) && mx[r][x-d] && mx[r][x-d].nodeName) {
							ret.push(mx[r][x-d]);
							if (ext) {
								info.delta.push(d);
								info.offset.push(x);
							}
						}
					}
				}
			}
		}
	}
	return !ext ? ret : {column : ret, info : info};
};
function rteSelection(rte) {
	this.rte = rte;
	this.w3cRange = null;
	var self = this, doc = rte.options.doc;
	$(doc).keyup(function(e) {
		if (e.ctrlKey || e.metaKey || (e.keyCode >= 8 && e.keyCode <= 13) 
				|| (e.keyCode>=32 && e.keyCode<= 40) || e.keyCode == 46 
				|| (e.keyCode >=96 && e.keyCode <= 111)) {
			self.cleanCache();
		}
	}).mousedown(function(e) {
		self.start = (e.target.nodeName == 'HTML' ? doc.body : e.target);
		self.end   = self.node = null;
	}).mouseup(function(e) {
		self.end = (e.target.nodeName == 'HTML'?doc.body:e.target);
		self.node = null;
	}).click();
}

rteSelection.prototype.getSelection = function(){
	var win  = this.rte.options.win;
	return win.getSelection ? win.getSelection() : win.document.selection;
};

rteSelection.prototype.realSelected = function(n, p, s) {
	var dom = this.rte.options.dom ;
	while (n.nodeName != 'BODY' && n.parentNode && n.parentNode.nodeName != 'BODY' 
		&& (p ? n!== p && n.parentNode != p : 1) 
		&& ((s=='left' && dom.isFirstNotEmpty(n)) || (s=='right' && dom.isLastNotEmpty(n)) || (dom.isFirstNotEmpty(n) && dom.isLastNotEmpty(n))) ) {
		n = n.parentNode;
	}
	return n;
};


rteSelection.prototype.collapsed = function() {
	return this.getRangeAt().isCollapsed();
};

rteSelection.prototype.collapse = function(st) {
	var r = this.getRangeAt();
	r.collapse(st?true:false);
	if (!$.browser.msie) {
		this.getSelection().removeAllRanges();
		this.getSelection().addRange(r);
	}
	return this;
};

rteSelection.prototype.getRangeAt = function(updateW3cRange) {
	if ($.browser.msie) {
		if (!this.w3cRange) {
			this.w3cRange = new w3cRange(this.rte.options.win);
		}
		updateW3cRange && this.w3cRange.update();
		return this.w3cRange;
	}

	var s = this.getSelection(), r = s && s.rangeCount > 0 ? s.getRangeAt(0) : this.rte.options.win.document.createRange();
	r.getStart = function() {
		return this.startContainer.nodeType==1 
		? this.startContainer.childNodes[Math.min(this.startOffset, this.startContainer.childNodes.length-1)] 
		: this.startContainer;
	};
	r.getEnd = function() {
		return this.endContainer.nodeType==1 
		? this.endContainer.childNodes[ Math.min(this.startOffset == this.endOffset ? this.endOffset : this.endOffset-1, this.endContainer.childNodes.length-1)] 
		: this.endContainer;
	};
	r.isCollapsed = function() {
		return this.collapsed;
	};
	return r;
};

rteSelection.prototype.saveIERange = function() {
	if ($.browser.msie) {
		bm = this.getRangeAt().getBookmark();
	}
};

rteSelection.prototype.restoreIERange = function() {
	$.browser.msie && bm && this.getRangeAt().moveToBookmark(bm);
};

rteSelection.prototype.cloneContents = function() {
	var doc = this.rte.options.doc, n = doc.createElement('div'), r, c, i;
	if ($.browser.msie) {
		try { 
			r = this.getSelection().createRange(); 
		} catch(e) { 
			r = doc.body.createTextRange(); 
		}
		$(n).html(r.htmlText);
	} else {
		c = this.getRangeAt().cloneContents();
		for (i=0; i<c.childNodes.length; i++) {
			n.appendChild(c.childNodes[i].cloneNode(true));
		}
	}
	return n;
};

rteSelection.prototype.select = function(s, e) {
	e = e||s;

	if ($.browser.msie) {
		var r  = this.rte.options.doc.body.createTextRange(), r1 = r.duplicate(), r2 = r.duplicate();
		r1.moveToElementText(s);
		r2.moveToElementText(e);
		r.setEndPoint('StartToStart', r1);
		r.setEndPoint('EndToEnd',     r2);
		r.select();
	} else {
		var sel = this.getSelection(), r = this.getRangeAt();
		r.setStartBefore(s);
		r.setEndAfter(e);
		sel.removeAllRanges();
		sel.addRange(r);
	}
	return this.cleanCache();
};

rteSelection.prototype.selectContents = function(n) {
	var r = this.getRangeAt();
	if (n && n.nodeType == 1) {
		if ($.browser.msie) {
			r.range();
			r.r.moveToElementText(n.parentNode);
			r.r.select();
		} else {
			try {
				r.selectNodeContents(n);
			} catch (e) {
				return;
			}
			var s = this.getSelection();
			s.removeAllRanges();
			s.addRange(r);
		}
	}
	return this;
};

rteSelection.prototype.deleteContents = function() {
	if (!$.browser.msie) {
		this.getRangeAt().deleteContents();
	}
	return this;
};

rteSelection.prototype.insertNode = function(n, collapse) {
	if (collapse && !this.collapsed()) {
		this.collapse();
	}

	if ($.browser.msie) {
		var r = this.getRangeAt();
		r.insertNode(n.nodeType == 3 ? n.nodeValue : $('span').append($(n)).html());
	} else {
		var r = this.getRangeAt();
		r.insertNode(n);
		r.setStartAfter(n);
		r.setEndAfter(n);
		var s = this.getSelection();
		s.removeAllRanges();
		s.addRange(r);
	}
	return this.cleanCache();
};

rteSelection.prototype.insertHtml = function(html, collapse) {
	if (collapse && !this.collapsed()) {
		this.collapse();
	}

	if ($.browser.msie) {
		this.getRangeAt().range().pasteHTML(html);
	} else {
		var n = $(this.rte.options.doc.create('span')).html(html||'').get(0);
		this.insertNode(n);
		$(n).replaceWith($(n).html());
	}
	return this.cleanCache();
};

rteSelection.prototype.insertText = function(text, collapse) {
	var n = this.rte.options.doc.createTextNode(text);
	return this.insertHtml(n.nodeValue);
};

rteSelection.prototype.getBookmark = function() {
	this.rte.options.win.focus();
	var r, r1, r2, _s, _e, dom = this.rte.options.dom, s = dom.createBookmark(), e = dom.createBookmark(), 
	    doc = this.rte.options.doc;
	if ($.browser.msie) {
		try { 
			r = this.getSelection().createRange(); 
		} catch(e) { 
			r = doc.body.createTextRange(); 
		}

		if (r.item) {
			var n = r.item(0);
			r = doc.body.createTextRange();
			r.moveToElementText(n);
		}

		r1 = r.duplicate();
		r2 = r.duplicate();
		_s = doc.createElement('span');
		_e = doc.createElement('span');

		_s.appendChild(s);
		_e.appendChild(e);

		r1.collapse(true);
		r1.pasteHTML(_s.innerHTML);
		r2.collapse(false);
		r2.pasteHTML(_e.innerHTML);
	} else {
		var sel = this.getSelection(), r = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : doc.createRange();

		r1 = r.cloneRange();
		r2 = r.cloneRange();

		r2.collapse(false);
		r2.insertNode(e);
		r1.collapse(true);
		r1.insertNode(s);
		this.select(s, e);
	}

	return [s.id, e.id];
};

rteSelection.prototype.moveToBookmark = function(b) {
	this.rte.options.win.focus();
	if (b && b.length==2) {
		var doc = this.rte.options.doc, s = doc.getElementById(b[0]), e = doc.getElementById(b[1]), sel, r;
		if (s && e) {
			this.select(s, e);
			if (this.rte.options.dom.next(s) == e) {
				this.collapse(true);
			}
			if (!$.browser.msie) {
				sel = this.getSelection();
				r = sel.rangeCount > 0 ? sel.getRangeAt(0) : doc.createRange();
				sel.removeAllRanges();
				sel.addRange(r);
			}

			s.parentNode.removeChild(s);
			e.parentNode.removeChild(e);
		}
	}
	return this;	
};

rteSelection.prototype.removeBookmark = function(b) {
	this.rte.options.win.focus();
	if (b.length==2) {
		var doc = this.rte.options.doc, s = doc.getElementById(b[0]), e = doc.getElementById(b[1]);
		if (s && e) {
			s.parentNode.removeChild(s);
			e.parentNode.removeChild(e);
		}
	}
};

rteSelection.prototype.cleanCache = function() {
	this.start = this.end = this.node = null;
	return this;
};

rteSelection.prototype.getStart = function() {
	if (!this.start) {
		this.start = this.getRangeAt().getStart();
	}
	return this.start;
};

rteSelection.prototype.getEnd = function() {
	if (!this.end) {
		this.end = this.getRangeAt().getEnd();
	}
	return this.end;
};

rteSelection.prototype.getNode = function() {
	if (!this.node) {
		this.node = this.rte.options.dom.findCommonAncestor(this.getStart(), this.getEnd());
	}
	return this.node;
};

rteSelection.prototype.selected = function(o) {
	var opts = { collapsed:false, blocks:false, filter:false, wrap: 'text', tag: 'span'}, dom = this.rte.options.dom;
	opts = $.extend({}, opts, o);
	if (opts.blocks) {
		var n  = this.getNode(), _n = null;
		if (_n = dom.selfOrParent(n, 'selectionBlock') ) {
			return [_n];
		} 
	}

	var sel = this.selectedRaw(opts.collapsed, opts.blocks), ret = [], buffer = [], ndx = null;
	function wrap() {
		function allowParagraph() {
			for (var i=0; i < buffer.length; i++) {
				if (buffer[i].nodeType == 1 && (dom.selfOrParent(buffer[i], /^P$/) || $(buffer[i]).find('p').length>0)) {
					return false;
				}
			};
			return true;
		} 

		if (buffer.length>0) {
			var tag  = opts.tag == 'p' && !allowParagraph() ? 'div' : opts.tag;
			var n    = dom.wrap(buffer, tag);
			ret[ndx] = n;
			ndx      = null;
			buffer   = [];
		}
	}

	function addToBuffer(n) {
		if (n.nodeType == 1) {
			if (/^(THEAD|TFOOT|TBODY|COL|COLGROUP|TR)$/.test(n.nodeName)) {
				$(n).find('td,th').each(function() {
					var tag = opts.tag == 'p' && $(this).find('p').length>0 ? 'div' : opts.tag;
					var n = dom.wrapContents(this, tag);
					return ret.push(n);
				});
			} else if (/^(CAPTION|TD|TH|LI|DT|DD)$/.test(n.nodeName)) {
				var tag = opts.tag == 'p' && $(n).find('p').length>0 ? 'div' : opts.tag;
				var n = dom.wrapContents(n, tag);
				return ret.push(n);
			}
		} 
		var prev = buffer.length>0 ? buffer[buffer.length-1] : null;
		if (prev && prev != dom.prev(n)) {
			wrap();
		}
		buffer.push(n); 
		if (ndx === null) {
			ndx = ret.length;
			ret.push('dummy');
		}
	}

	if (sel.nodes.length>0) {
		for (var i=0; i < sel.nodes.length; i++) {
			var n = sel.nodes[i];
			if (n.nodeType == 3 && (i==0 || i == sel.nodes.length-1) && $.trim(n.nodeValue).length>0) {
				if (i==0 && sel.so>0) {
					n = n.splitText(sel.so);
				}
				if (i == sel.nodes.length-1 && sel.eo>0) {
					n.splitText(i==0 && sel.so>0 ? sel.eo - sel.so : sel.eo);
				}
			}
			switch (opts.wrap) {
			case 'text':
				if ((n.nodeType == 1 && n.nodeName == 'BR') || (n.nodeType == 3 && $.trim(n.nodeValue).length>0)) {
					addToBuffer(n);
				} else if (n.nodeType == 1) {
					ret.push(n);
				}
				break;
			case 'inline':
				if (dom.isInline(n)) {
					addToBuffer(n);
				} else if (n.nodeType == 1) {

					ret.push(n);
				}
				break;
			case 'all':
				if (n.nodeType == 1 || !dom.isEmpty(n)) {
					addToBuffer(n);
				}
				break;
			default:
				if (n.nodeType == 1 || !dom.isEmpty(n)) {
					ret.push(n);
				}
			}
		};
		wrap();
	}

	if (ret.length) {
		this.rte.options.win.focus();
		this.select(ret[0], ret[ret.length-1]);
	}	
	return opts.filter ? dom.filter(ret, opts.filter) : ret;
};

rteSelection.prototype.selectedRaw = function(collapsed, blocks) {
	var res = {so : null, eo : null, nodes : []};
	var r   = this.getRangeAt(true);
	var ca  = r.commonAncestorContainer;
	var s, e;  // start & end nodes
	var sf  = false; // start node fully selected
	var ef  = false; // end node fully selected
	var dom = this.rte.options.dom;

	function isFullySelected(n, s, e) {
		if (n.nodeType == 3) {
			e = e>=0 ? e : n.nodeValue.length;
			return (s==0 && e==n.nodeValue.length) || $.trim(n.nodeValue).length == $.trim(n.nodeValue.substring(s, e)).length;
		} 
		return true;
	}

	function isEmptySelected(n, s, e) {
		if (n.nodeType == 1) {
			return dom.isEmpty(n);
		} else if (n.nodeType == 3) {
			return $.trim(n.nodeValue.substring(s||0, e>=0 ? e : n.nodeValue.length)).length == 0;
		} 
		return true;
	}

	if (r.startContainer.nodeType == 1) {
		if (r.startOffset<r.startContainer.childNodes.length) {
			s = r.startContainer.childNodes[r.startOffset];
			res.so = s.nodeType == 1 ? null : 0;
		} else {
			s = r.startContainer.childNodes[r.startOffset-1];
			res.so = s.nodeType == 1 ? null : s.nodeValue.length;
		}
	} else {
		s = r.startContainer;
		res.so = r.startOffset;
	} 

	if (r.collapsed) {
		if (collapsed) {
			if (blocks) {
				s = this.realSelected(s);
				if (!dom.isEmpty(s) || (s = dom.next(s))) {
					res.nodes = [s];
				} 

				if (dom.isInline(s)) {
					res.nodes = dom.toLineStart(s).concat(res.nodes, dom.toLineEnd(s));
				}

				if (res.nodes.length>0) {
					res.so = res.nodes[0].nodeType == 1 ? null : 0;
					res.eo = res.nodes[res.nodes.length-1].nodeType == 1 ? null : res.nodes[res.nodes.length-1].nodeValue.length;
				}

			} else if (!dom.isEmpty(s)) {
				res.nodes = [s];
			}

		}
		return res;
	}

	if (r.endContainer.nodeType == 1) {
		e = r.endContainer.childNodes[r.endOffset-1];
		res.eo = e.nodeType == 1 ? null : e.nodeValue.length;
	} else {
		e = r.endContainer;
		res.eo = r.endOffset;
	} 

	if (s.nodeType == 1 || blocks || isFullySelected(s, res.so, s.nodeValue.length)) {
		s = this.realSelected(s, ca, 'left');
		sf = true;
		res.so = s.nodeType == 1 ? null : 0;
	}
	if (e.nodeType == 1 || blocks || isFullySelected(e, 0,  res.eo)) {
		e = this.realSelected(e, ca, 'right');
		ef = true;
		res.eo = e.nodeType == 1 ? null : e.nodeValue.length;
	}

	if (blocks) {
		if (s.nodeType != 1 && s.parentNode != ca && s.parentNode.nodeName != 'BODY') {
			s = s.parentNode;
			res.so = null;
		}
		if (e.nodeType != 1 && e.parentNode != ca && e.parentNode.nodeName != 'BODY') {
			e = e.parentNode;
			res.eo = null;
		}
	}

	if (s.parentNode == e.parentNode && s.parentNode.nodeName != 'BODY' && (sf && dom.isFirstNotEmpty(s)) && (ef && dom.isLastNotEmpty(e))) {
		s = e = s.parentNode;
		res.so = s.nodeType == 1 ? null : 0;
		res.eo = e.nodeType == 1 ? null : e.nodeValue.length;
	}
	if (s == e) {
		if (!dom.isEmpty(s)) {
			res.nodes.push(s);
		}
		return res;
	}

	var sp = s;
	while (sp.nodeName != 'BODY' && sp.parentNode !== ca && sp.parentNode.nodeName != 'BODY') {
		sp = sp.parentNode;
	}

	var ep = e;
	while (ep.nodeName != 'BODY' && ep.parentNode !== ca && ep.parentNode.nodeName != 'BODY') {
		ep = ep.parentNode;
	}

	if (!isEmptySelected(s, res.so, s.nodeType==3 ? s.nodeValue.length : null)) {
		res.nodes.push(s);
	}

	var n = s;
	while (n !== sp) {
		var _n = n;
		while ((_n = dom.next(_n))) {
			res.nodes.push(_n);
		}
		n = n.parentNode;
	}
	n = sp;
	while ((n = dom.next(n)) && n!= ep ) {
		res.nodes.push(n);
	}
	var tmp = [];
	n = e;
	while (n !== ep) {
		var _n = n;
		while ((_n = dom.prev(_n))) {
			tmp.push(_n);
		}
		n = n.parentNode;
	}
	if (tmp.length) {
		res.nodes = res.nodes.concat(tmp.reverse());
	}
	if (!isEmptySelected(e, 0, e.nodeType==3 ? res.eo : null)) {
		res.nodes.push(e);
	}

	if (blocks) {
		if (dom.isInline(s)) {
			res.nodes = dom.toLineStart(s).concat(res.nodes);
			res.so    = res.nodes[0].nodeType == 1 ? null : 0;
		}
		if (dom.isInline(e)) {
			res.nodes = res.nodes.concat(dom.toLineEnd(e));
			res.eo    = res.nodes[res.nodes.length-1].nodeType == 1 ? null : res.nodes[res.nodes.length-1].nodeValue.length;
		}
	}

	return res;
};
function w3cRange(win) {
	this.win = win;
	this.r = null;
	this.collapsed = true;
	this.startContainer = null;
	this.endContainer = null;
	this.startOffset = 0;
	this.endOffset = 0;
	this.commonAncestorContainer = null;
}
	
w3cRange.prototype.range = function() {
	doc = this.win.document;
	try { 
		this.r = doc.selection.createRange(); 
	} catch(e) { 
		this.r = doc.body.createTextRange(); 
	}
	return this.r;
};

w3cRange.prototype.insertNode = function(html) {
	this.range();
	this.r.collapse(false);
	var r = this.r.duplicate();
	r.pasteHTML(html);
};

w3cRange.prototype.getBookmark = function() {
	this.range();
	if (this.r.item) {
		var n = this.r.item(0);
		this.r = this.win.document.body.createTextRange();
		this.r.moveToElementText(n);
	}
	return this.r.getBookmark();
};

w3cRange.prototype.moveToBookmark = function(bm) {
	this.win.focus();
	this.range().moveToBookmark(bm);
	this.r.select();
};

w3cRange.prototype.update = function() {
	var self = this, doc = this.win.document;
	function _findPos(start) {
		var marker = '\uFEFF';
		var ndx = offset = 0;
		var r = self.r.duplicate();
		r.collapse(start);
		var p = r.parentElement();
		if (!p || p.nodeName == 'HTML') {
			return {parent : doc.body, ndx : ndx, offset : offset};
		}

		r.pasteHTML(marker);

		childs = p.childNodes;
		for (var i=0; i < childs.length; i++) {
			var n = childs[i];
			if (i>0 && (n.nodeType!==3 || childs[i-1].nodeType !==3)) {
				ndx++;
			}
			if (n.nodeType !== 3) {
				offset = 0;
			} else {
				var pos = n.nodeValue.indexOf(marker);
				if (pos !== -1) {
					offset += pos;
					break;
				}
				offset += n.nodeValue.length;
			}
		};
		r.moveStart('character', -1);
		r.text = '';
		return {parent : p, ndx : Math.min(ndx, p.childNodes.length-1), offset : offset};
	}

	this.range();
	this.startContainer = this.endContainer = null;

	if (this.r.item) {
		this.collapsed = false;
		var i = this.r.item(0);
		this.setStart(i.parentNode, $(i).index());
		this.setEnd(i.parentNode, this.startOffset+1);
	} else {
		this.collapsed = this.r.boundingWidth == 0;
		var start = _findPos(true), end = _findPos(false);

		start.parent.normalize();
		end.parent.normalize();
		start.ndx = Math.min(start.ndx, start.parent.childNodes.length-1);
		end.ndx = Math.min(end.ndx, end.parent.childNodes.length-1);
		if (start.parent.childNodes[start.ndx].nodeType && start.parent.childNodes[start.ndx].nodeType == 1) {
			this.setStart(start.parent, start.ndx);
		} else {
			this.setStart(start.parent.childNodes[start.ndx], start.offset);
		}
		if (end.parent.childNodes[end.ndx].nodeType && end.parent.childNodes[end.ndx].nodeType == 1) {
			this.setEnd(end.parent, end.ndx);
		} else {
			this.setEnd(end.parent.childNodes[end.ndx], end.offset);
		}
		// this.dump();
		this.select();
	}
	return this;
};

w3cRange.prototype.isCollapsed = function() {
	this.range();
	this.collapsed = this.r.item ? false : this.r.boundingWidth == 0;
	return this.collapsed;
};

w3cRange.prototype.collapse = function(toStart) {
	this.range();
	if (this.r.item) {
		var n = this.r.item(0);
		this.r = this.win.document.body.createTextRange();
		this.r.moveToElementText(n);
	}
	this.r.collapse(toStart);
	this.r.select();
	this.collapsed = true;
};

w3cRange.prototype.getStart = function() {
	this.range();
	if (this.r.item) {
		return this.r.item(0);
	}
	var r = this.r.duplicate();
	r.collapse(true);
	var s = r.parentElement();
	return s && s.nodeName == 'BODY' ? s.firstChild : s;
};


w3cRange.prototype.getEnd = function() {
	this.range();
	if (this.r.item) {
		return this.r.item(0);
	}
	var r = this.r.duplicate();
	r.collapse(false);
	var e = r.parentElement();
	return e && e.nodeName == 'BODY' ? e.lastChild : e;
};

w3cRange.prototype.setStart = function(node, offset) {
	this.startContainer = node;
	this.startOffset    = offset;
	if (this.endContainer) {
		this.commonAncestorContainer = this.findCommonAncestor(this.startContainer, this.endContainer);
	}
};

w3cRange.prototype.setEnd = function(node, offset) {
	this.endContainer = node;
	this.endOffset    = offset;
	if (this.startContainer) {
		this.commonAncestorContainer = this.findCommonAncestor(this.startContainer, this.endContainer);
	}
};

w3cRange.prototype.setStartBefore = function(n) {
	if (n.parentNode) {
		this.setStart(n.parentNode, $(n).index());
	}
};

w3cRange.prototype.setStartAfter = function(n) {
	if (n.parentNode) {
		this.setStart(n.parentNode, $(n).index()+1);
	}
};

w3cRange.prototype.setEndBefore = function(n) {
	if (n.parentNode) {
		this.setEnd(n.parentNode, $(n).index());
	}
};

w3cRange.prototype.setEndAfter = function(n) {
	if (n.parentNode) {
		this.setEnd(n.parentNode, $(n).index()+1);
	}
};

w3cRange.prototype.select = function() {
	var body = this.win.document.body;
	function getPos(n, o) {
		if (n.nodeType != 3) {
			return -1;
		}
		var c   ='\uFEFF', val = n.nodeValue, r = body.createTextRange();
		n.nodeValue = val.substring(0, o) + c + val.substring(o);
		r.moveToElementText(n.parentNode);
		r.findText(c);
		var p = Math.abs(r.moveStart('character', -0xFFFFF));
		n.nodeValue = val;
		return p;
	};

	this.r = body.createTextRange(); 
	var so = this.startOffset, eo = this.endOffset;
	var s = this.startContainer.nodeType == 1 
	? this.startContainer.childNodes[Math.min(so, this.startContainer.childNodes.length - 1)]
	: this.startContainer;
	var e = this.endContainer.nodeType == 1 
	? this.endContainer.childNodes[Math.min(so == eo ? eo : eo - 1, this.endContainer.childNodes.length - 1)]
	: this.endContainer;

	if (this.collapsed) {
		if (s.nodeType == 3) {
			var p = getPos(s, so);
			this.r.move('character', p);
		} else {
			this.r.moveToElementText(s);
			this.r.collapse(true);
		}
	} else {
		var r  = body.createTextRange(); 
		var sp = getPos(s, so);
		var ep = getPos(e, eo);
		if (s.nodeType == 3) {
			this.r.move('character', sp);
		} else {
			this.r.moveToElementText(s);
		}
		if (e.nodeType == 3) {
			r.move('character', ep);
		} else {
			r.moveToElementText(e);
		}
		this.r.setEndPoint('EndToEnd', r);
	}

	try {
		this.r.select();
	} catch(e) {	}
	
	if (r) {
		r = null;
	}
};

w3cRange.prototype.findCommonAncestor = function(n1, n2) {
	if (!n1 || !n2) {
		return;
	}
	if (n1 == n2) {
		return n1;
	} else if (n1.nodeName == 'BODY' || n2.nodeName == 'BODY') {
		return doc.body;
	}
	var p1 = $(n1).parents(), p2 = $(n2).parents(), l  = p2.length-1, c  = p2[l];
	for (var i = p1.length - 1; i >= 0; i--, l--){
		if (p1[i] == p2[l]) {
			c = p1[i];
		} else {
			break;
		}
	};
	return c;
};
/*
    json2.js
    2012-10-08

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (typeof JSON !== 'object') {
    JSON = {};
}

(function () {
    'use strict';

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear()     + '-' +
                    f(this.getUTCMonth() + 1) + '-' +
                    f(this.getUTCDate())      + 'T' +
                    f(this.getUTCHours())     + ':' +
                    f(this.getUTCMinutes())   + ':' +
                    f(this.getUTCSeconds())   + 'Z'
                : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function (key) {
                return this.valueOf();
            };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? '[]'
                    : gap
                    ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                    : '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? '{}'
                : gap
                ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function'
                    ? walk({'': j}, '')
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());
/*! JsRender v1.0pre: http://github.com/BorisMoore/jsrender */
/*
* Optimized version of jQuery Templates, for rendering to string.
* Does not require jQuery, or HTML DOM
* Integrates with JsViews (http://github.com/BorisMoore/jsviews)
* Copyright 2013, Boris Moore
* Released under the MIT License.
*/
// informal pre beta commit counter: 33 (Beta Candidate)

(function(global, jQuery, undefined) {
	// global is the this object, which is window when running in the usual browser environment.
	"use strict";

	if (jQuery && jQuery.views || global.jsviews) { return; } // JsRender is already loaded

	//========================== Top-level vars ==========================

	var versionNumber = "v1.0pre",

		$, jsvStoreName, rTag, rTmplString,
//TODO	tmplFnsCache = {},
		delimOpenChar0 = "{", delimOpenChar1 = "{", delimCloseChar0 = "}", delimCloseChar1 = "}", linkChar = "^",

		rPath = /^(?:null|true|false|\d[\d.]*|([\w$]+|\.|~([\w$]+)|#(view|([\w$]+))?)([\w$.^]*?)(?:[.[^]([\w$]+)\]?)?)$/g,
		//                                     object     helper    view  viewProperty pathTokens      leafToken

		rParams = /(\()(?=\s*\()|(?:([([])\s*)?(?:([#~]?[\w$.^]+)?\s*((\+\+|--)|\+|-|&&|\|\||===|!==|==|!=|<=|>=|[<>%*!:?\/]|(=))\s*|([#~]?[\w$.^]+)([([])?)|(,\s*)|(\(?)\\?(?:(')|("))|(?:\s*((\))(?=\s*\.|\s*\^)|\)|\])([([]?))|(\s+)/g,
		//          lftPrn        lftPrn2                 path    operator err                                                eq          path2       prn    comma   lftPrn2   apos quot      rtPrn rtPrnDot           prn2   space
		// (left paren? followed by (path? followed by operator) or (path followed by left paren?)) or comma or apos or quot or right paren or space

		rNewLine = /\s*\n/g,
		rUnescapeQuotes = /\\(['"])/g,
		// escape quotes and \ character
		rEscapeQuotes = /([\\'"])/g,
		rBuildHash = /\x08(~)?([^\x08]+)\x08/g,
		rTestElseIf = /^if\s/,
		rFirstElem = /<(\w+)[>\s]/,
		rPrevElem = /<(\w+)[^>\/]*>[^>]*$/,
		rAttrEncode = /[<"'&]/g,
		rHtmlEncode = /[><"'&]/g,
		autoTmplName = 0,
		viewId = 0,
		charEntities = {
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			"\x00": "&#0;",
			"'": "&#39;",
			'"': "&#34;"
		},
		tmplAttr = "data-jsv-tmpl",
		slice = [].slice,

		$render = {},
		jsvStores = {
			template: {
				compile: compileTmpl
			},
			tag: {
				compile: compileTag
			},
			helper: {},
			converter: {}
		},

		// jsviews object ($.views if jQuery is loaded)
		$views = {
			jsviews: versionNumber,
			render: $render,
			View: View,
			settings: {
				delimiters: $viewsDelimiters,
				debugMode: true,
				tryCatch: true
			},
			sub: {
				// subscription, e.g. JsViews integration
				Error: JsViewsError,
				tmplFn: tmplFn,
				parse: parseParams,
				extend: $extend,
				error: error,
				syntaxError: syntaxError
//TODO			invoke: $invoke
			},
			_cnvt: convertVal,
			_tag: renderTag,

			// TODO provide better debug experience - e.g. support $.views.onError callback
			_err: function(e) {
				// Place a breakpoint here to intercept template rendering errors
				return $viewsSettings.debugMode ? ("Error: " + (e.message || e)) + ". " : '';
			}
		};

		function JsViewsError(message, object) {
			// Error exception type for JsViews/JsRender
			// Override of $.views.sub.Error is possible
			if (object && object.onError) {
				if (object.onError(message) === false) {
					return;
				}
			}
			this.name = "JsRender Error";
			this.message = message || "JsRender error";
		}

		function $extend(target, source) {
			var name;
			target = target || {};
			for (name in source) {
				target[name] = source[name];
			}
			return target;
		}

//TODO		function $invoke() {
//			try {
//				return arguments[1].apply(arguments[0], arguments[2]);
//			}
//			catch(e) {
//				throw new $views.sub.Error(e, arguments[0]);
//			}
//		}

		(JsViewsError.prototype = new Error()).constructor = JsViewsError;

	//========================== Top-level functions ==========================

	//===================
	// jsviews.delimiters
	//===================
	function $viewsDelimiters(openChars, closeChars, link) {
		// Set the tag opening and closing delimiters and 'link' character. Default is "{{", "}}" and "^"
		// openChars, closeChars: opening and closing strings, each with two characters

		if (!$viewsSub.rTag || arguments.length) {
			delimOpenChar0 = openChars ? openChars.charAt(0) : delimOpenChar0; // Escape the characters - since they could be regex special characters
			delimOpenChar1 = openChars ? openChars.charAt(1) : delimOpenChar1;
			delimCloseChar0 = closeChars ? closeChars.charAt(0) : delimCloseChar0;
			delimCloseChar1 = closeChars ? closeChars.charAt(1) : delimCloseChar1;
			linkChar = link || linkChar;
			openChars = "\\" + delimOpenChar0 + "(\\" + linkChar + ")?\\" + delimOpenChar1;  // Default is "{^{"
			closeChars = "\\" + delimCloseChar0 + "\\" + delimCloseChar1;                   // Default is "}}"
			// Build regex with new delimiters
			//          tag    (followed by / space or })   or cvtr+colon or html or code
			rTag = "(?:(?:(\\w+(?=[\\/\\s\\" + delimCloseChar0 + "]))|(?:(\\w+)?(:)|(>)|!--((?:[^-]|-(?!-))*)--|(\\*)))"
				+ "\\s*((?:[^\\" + delimCloseChar0 + "]|\\" + delimCloseChar0 + "(?!\\" + delimCloseChar1 + "))*?)";

			// make rTag available to JsViews (or other components) for parsing binding expressions
			$viewsSub.rTag = rTag + ")";

			rTag = new RegExp(openChars + rTag + "(\\/)?|(?:\\/(\\w+)))" + closeChars, "g");

			// Default:    bind           tag       converter colon html     comment            code      params            slash   closeBlock
			//           /{(\^)?{(?:(?:(\w+(?=[\/\s}]))|(?:(\w+)?(:)|(>)|!--((?:[^-]|-(?!-))*)--|(\*)))\s*((?:[^}]|}(?!}))*?)(\/)?|(?:\/(\w+)))}}/g

			rTmplString = new RegExp("<.*>|([^\\\\]|^)[{}]|" + openChars + ".*" + closeChars);
			// rTmplString looks for html tags or { or } char not preceded by \\, or JsRender tags {{xxx}}. Each of these strings are considered
			// NOT to be jQuery selectors
		}
		return [delimOpenChar0, delimOpenChar1, delimCloseChar0, delimCloseChar1, linkChar];
	}

	//=========
	// View.get
	//=========

	function getView(inner, type) { //view.get(inner, type)
		if (!type) {
			// view.get(type)
			type = inner;
			inner = undefined;
		}

		var views, i, l, found,
			view = this,
			root = !type || type === "root";
			// If type is undefined, returns root view (view under top view).

		if (inner) {
			// Go through views - this one, and all nested ones, depth-first - and return first one with given type.
			found = view.type === type ? view : undefined;
			if (!found) {
				views = view.views;
				if (view._.useKey) {
					for (i in views) {
						if (found = views[i].get(inner, type)) {
							break;
						}
					}
				} else for (i = 0, l = views.length; !found && i < l; i++) {
					found = views[i].get(inner, type);
				}
			}
		} else if (root) {
			// Find root view. (view whose parent is top view)
			while (view.parent.parent) {
				found = view = view.parent;
			}
		} else while (view && !found) {
			// Go through views - this one, and all parent ones - and return first one with given type.
			found = view.type === type ? view : undefined;
			view = view.parent;
		}
		return found;
	}

	function getIndex() {
		var view = this.get("item");
		return view ? view.index : undefined;
	}

	getIndex.depends = function() {
		return [this.get("item"), "index"];
	};

	//==========
	// View.hlp
	//==========

	function getHelper(helper) {
		// Helper method called as view.hlp(key) from compiled template, for helper functions or template parameters ~foo
		var wrapped,
			view = this,
			res = (view.ctx || {})[helper];

		res = res === undefined ? view.getRsc("helpers", helper) : res;

		if (res) {
			if (typeof res === "function") {
				wrapped = function() {
					// If it is of type function, we will wrap it so it gets called with view as 'this' context.
					// If the helper ~foo() was in a data-link expression, the view will have a 'temporary' linkCtx property too.
					// However note that helper functions on deeper paths will not have access to view and tagCtx.
					// For example, ~util.foo() will have the ~util object as 'this' pointer
					return res.apply(view, arguments);
				};
				$extend(wrapped, res);
			}
		}
		return wrapped || res;
	}

	//==============
	// jsviews._cnvt
	//==============

	function convertVal(converter, view, tagCtx) {
		// self is template object or linkCtx object
		var tmplConverter, tag, value,
			boundTagCtx = +tagCtx === tagCtx && tagCtx, // if value is an integer, then it is the key for the boundTagCtx
			linkCtx = view.linkCtx;

		if (boundTagCtx) {
			// Call compiled function which returns the tagCtxs for current data
			tagCtx = (boundTagCtx = view.tmpl.bnds[boundTagCtx-1])(view.data, view, $views);
		}

		value = tagCtx.args[0];

		if (converter || boundTagCtx) {
			tag = linkCtx && linkCtx.tag || {
				_: {
					inline: !linkCtx
				},
				tagName: converter + ":",
				flow: true,
				_is: "tag"
			};

			tag._.bnd = boundTagCtx;

			if (linkCtx) {
				linkCtx.tag = tag;
				tag.linkCtx = linkCtx;
				tagCtx.ctx = extendCtx(tagCtx.ctx, linkCtx.view.ctx);
			}
			tag.tagCtx = tagCtx;
			tagCtx.view = view;

			tag.ctx = tagCtx.ctx || {};
			delete tagCtx.ctx;
			// Provide this tag on view, for addBindingMarkers on bound tags to add the tag to view._.bnds, associated with the tag id,
			view._.tag = tag;

			converter = converter !== "true" && converter; // If there is a convertBack but no convert, converter will be "true"

			if (converter && ((tmplConverter = view.getRsc("converters", converter)) || error("Unknown converter: {{"+ converter + ":"))) {
				// A call to {{cnvt: ... }} or {^{cnvt: ... }} or data-link="{cnvt: ... }"
				tag.depends = tmplConverter.depends;
				value = tmplConverter.apply(tag, tagCtx.args);
			}
			// Call onRender (used by JsViews if present, to add binding annotations around rendered content)
			value = boundTagCtx && view._.onRender
				? view._.onRender(value, view, boundTagCtx)
				: value;
			view._.tag = undefined;
		}
		return value;
	}

	//=============
	// jsviews._tag
	//=============

	function getResource(storeName, item) {
		var res,
			view = this,
			store = $views[storeName];

		res = store && store[item];
		while ((res === undefined) && view) {
			store = view.tmpl[storeName];
			res = store && store[item];
			view = view.parent;
		}
		return res;
	}

	function renderTag(tagName, parentView, tmpl, tagCtxs) {
		// Called from within compiled template function, to render a template tag
		// Returns the rendered tag

		var render, tag, tags, attr, isElse, parentTag, i, l, itemRet, tagCtx, tagCtxCtx, content, boundTagFn, tagDef,
			ret = "",
			boundTagKey = +tagCtxs === tagCtxs && tagCtxs, // if tagCtxs is an integer, then it is the boundTagKey
			linkCtx = parentView.linkCtx || 0,
			ctx = parentView.ctx,
			parentTmpl = tmpl || parentView.tmpl,
			parentView_ = parentView._;

		if (tagName._is === "tag") {
			tag = tagName;
			tagName = tag.tagName;
		}

		// Provide tagCtx, linkCtx and ctx access from tag
		if (boundTagKey) {
			// if tagCtxs is an integer, we are data binding
			// Call compiled function which returns the tagCtxs for current data
			tagCtxs = (boundTagFn = parentTmpl.bnds[boundTagKey-1])(parentView.data, parentView, $views);
		}

		l = tagCtxs.length;
		tag = tag || linkCtx.tag;
		for (i = 0; i < l; i++) {
			tagCtx = tagCtxs[i];

			// Set the tmpl property to the content of the block tag, unless set as an override property on the tag
			content = tagCtx.tmpl;
			content = tagCtx.content = content && parentTmpl.tmpls[content - 1];
			tmpl = tagCtx.props.tmpl;
			if (!i && (!tmpl || !tag)) {
				tagDef = parentView.getRsc("tags", tagName) || error("Unknown tag: {{"+ tagName + "}}");
			}
			tmpl = tmpl || !i && tagDef.template || content;
			tmpl = "" + tmpl === tmpl // if a string
				? parentView.getRsc("templates", tmpl) || $templates(tmpl)
				: tmpl;

			$extend( tagCtx, {
				tmpl: tmpl,
				render: renderContent,
				index: i,
				view: parentView,
				ctx: extendCtx(tagCtx.ctx, ctx) // Extend parentView.ctx
			}); // Extend parentView.ctx

			if (!tag) {
				// This will only be hit for initial tagCtx (not for {{else}}) - if the tag instance does not exist yet
				// Instantiate tag if it does not yet exist
				if (tagDef.init) {
					// If the tag has not already been instantiated, we will create a new instance.
					// ~tag will access the tag, even within the rendering of the template content of this tag.
					// From child/descendant tags, can access using ~tag.parent, or ~parentTags.tagName
//	TODO provide error handling owned by the tag - using tag.onError
//				try {
					tag = new tagDef.init(tagCtx, linkCtx, ctx);
//				}
//				catch(e) {
//					tagDef.onError(e);
//				}
					// Set attr on linkCtx to ensure outputting to the correct target attribute.
					tag.attr = tag.attr || tagDef.attr || undefined;
					// Setting either linkCtx.attr or this.attr in the init() allows per-instance choice of target attrib.
				} else {
					// This is a simple tag declared as a function. We won't instantiate a specific tag constructor - just a standard instance object.
					tag = {
						// tag instance object if no init constructor
						render: tagDef.render
					};
				}
				tag._ = {
					inline: !linkCtx
				};
				if (linkCtx) {
					// Set attr on linkCtx to ensure outputting to the correct target attribute.
					linkCtx.attr = tag.attr = linkCtx.attr || tag.attr;
					linkCtx.tag = tag;
					tag.linkCtx = linkCtx;
				}
				if (tag._.bnd = boundTagFn || linkCtx) {
					// Bound if {^{tag...}} or data-link="{tag...}"
					tag._.arrVws = {};
				}
				tag.tagName = tagName;
				tag.parent = parentTag = ctx && ctx.tag,
				tag._is = "tag";
				// Provide this tag on view, for addBindingMarkers on bound tags to add the tag to view._.bnds, associated with the tag id,
			}
			parentView_.tag = tag;
			tagCtx.tag = tag;
			tag.tagCtxs = tagCtxs;
			tag.rendering = {}; // Provide object for state during render calls to tag and elses. (Used by {{if}} and {{for}}...)

			if (!tag.flow) {
				tagCtxCtx = tagCtx.ctx = tagCtx.ctx || {};

				// tags hash: tag.ctx.tags, merged with parentView.ctx.tags,
				tags = tagCtxCtx.parentTags = ctx && extendCtx(tagCtxCtx.parentTags, ctx.parentTags) || {};
				if (parentTag) {
					tags[parentTag.tagName] = parentTag;
				}
				tagCtxCtx.tag = tag;
			}
		}
		for (i = 0; i < l; i++) {
			tagCtx = tag.tagCtx = tagCtxs[i];
			tag.ctx = tagCtx.ctx;

			if (render = tag.render) {
				itemRet = render.apply(tag, tagCtx.args);
			}
			ret += itemRet !== undefined
				? itemRet   // Return result of render function unless it is undefined, in which case return rendered template
				: tagCtx.tmpl
					// render template/content on the current data item
					? tagCtx.render()
					: ""; // No return value from render, and no template/content defined, so return ""
		}
		delete tag.rendering;

		tag.tagCtx = tag.tagCtxs[0];
		tag.ctx= tag.tagCtx.ctx;

		if (tag._.inline && (attr = tag.attr) && attr !== "html") {
			ret = attr === "text"
				? $converters.html(ret)
				: "";
		}
		return ret = boundTagKey && parentView._.onRender
			// Call onRender (used by JsViews if present, to add binding annotations around rendered content)
			? parentView._.onRender(ret, parentView, boundTagKey)
			: ret;
	}

	//=================
	// View constructor
	//=================

	function View(context, type, parentView, data, template, key, contentTmpl, onRender) {
		// Constructor for view object in view hierarchy. (Augmented by JsViews if JsViews is loaded)
		var views, parentView_, tag,
			isArray = type === "array",
			self_ = {
				key: 0,
				useKey: isArray ? 0 : 1,
				id: "" + viewId++,
				onRender: onRender,
				bnds: {}
			},
			self = {
				data: data,
				tmpl: template,
				content: contentTmpl,
				views: isArray ? [] : {},
				parent: parentView,
				ctx: context,
				type: type,
				// If the data is an array, this is an 'array view' with a views array for each child 'item view'
				// If the data is not an array, this is an 'item view' with a views 'map' object for any child nested views
				// ._.useKey is non zero if is not an 'array view' (owning a data array). Uuse this as next key for adding to child views map
				get: getView,
				getIndex: getIndex,
				getRsc: getResource,
				hlp: getHelper,
				_: self_,
				_is: "view"
		};
		if (parentView) {
			views = parentView.views;
			parentView_ = parentView._;
			if (parentView_.useKey) {
				// Parent is an 'item view'. Add this view to its views object
				// self._key = is the key in the parent view map
				views[self_.key = "_" + parentView_.useKey++] = self;
				tag = parentView_.tag;
				self_.bnd = isArray && (!tag || !!tag._.bnd && tag); // For array views that are data bound for collection change events, set the
				// view._.bnd property to true for top-level link() or data-link="{for}", or to the tag instance for a data- bound tag, e.g. {^{for ...}}
			} else {
				// Parent is an 'array view'. Add this view to its views array
				views.splice(
					// self._.key = self.index - the index in the parent view array
					self_.key = self.index =
						key !== undefined
							? key
							: views.length,
				0, self);
			}
			// If no context was passed in, use parent context
			// If context was passed in, it should have been merged already with parent context
			self.ctx = context || parentView.ctx;
		}
		return self;
	}

	//=============
	// Registration
	//=============

	function compileChildResources(parentTmpl) {
		var storeName, resources, resourceName, settings, compile;
		for (storeName in jsvStores) {
			settings = jsvStores[storeName];
			if ((compile = settings.compile) && (resources = parentTmpl[storeName + "s"])) {
				for (resourceName in resources) {
					// compile child resource declarations (templates, tags, converters or helpers)
					resources[resourceName] = compile(resourceName, resources[resourceName], parentTmpl, storeName, settings);
				}
			}
		}
	}

	function compileTag(name, item, parentTmpl) {
		var init, tmpl;
		if (typeof item === "function") {
			// Simple tag declared as function. No presenter instantation.
			item = {
				depends: item.depends,
				render: item
			};
		} else {
			// Tag declared as object, used as the prototype for tag instantiation (control/presenter)
			if (tmpl = item.template) {
				item.template = "" + tmpl === tmpl ? ($templates[tmpl] || $templates(tmpl)) : tmpl;
			}
			if (item.init !== false) {
				init = item.init = item.init || function(tagCtx) {};
				init.prototype = item;
				(init.prototype = item).constructor = init;
			}
		}
		if (parentTmpl) {
			item._parentTmpl = parentTmpl;
		}
//TODO	item.onError = function(e) {
//			var error;
//			if (error = this.prototype.onError) {
//				error.call(this, e);
//			} else {
//				throw e;
//			}
//		}
		return item;
	}

	function compileTmpl(name, tmpl, parentTmpl, storeName, storeSettings, options) {
		// tmpl is either a template object, a selector for a template script block, the name of a compiled template, or a template object

		//==== nested functions ====
		function tmplOrMarkupFromStr(value) {
			// If value is of type string - treat as selector, or name of compiled template
			// Return the template object, if already compiled, or the markup string

			if (("" + value === value) || value.nodeType > 0) {
				try {
					elem = value.nodeType > 0
					? value
					: !rTmplString.test(value)
					// If value is a string and does not contain HTML or tag content, then test as selector
						&& jQuery && jQuery(global.document).find(value)[0];
					// If selector is valid and returns at least one element, get first element
					// If invalid, jQuery will throw. We will stay with the original string.
				} catch (e) {}

				if (elem) {
					// Generally this is a script element.
					// However we allow it to be any element, so you can for example take the content of a div,
					// use it as a template, and replace it by the same content rendered against data.
					// e.g. for linking the content of a div to a container, and using the initial content as template:
					// $.link("#content", model, {tmpl: "#content"});

					value = elem.getAttribute(tmplAttr);
					name = name || value;
					value = $templates[value];
					if (!value) {
						// Not already compiled and cached, so compile and cache the name
						// Create a name for compiled template if none provided
						name = name || "_" + autoTmplName++;
						elem.setAttribute(tmplAttr, name);
						// Use tmpl as options
						value = $templates[name] = compileTmpl(name, elem.innerHTML, parentTmpl, storeName, storeSettings, options);
					}
				}
				return value;
			}
			// If value is not a string, return undefined
		}

		var tmplOrMarkup, elem;

		//==== Compile the template ====
		tmpl = tmpl || "";
		tmplOrMarkup = tmplOrMarkupFromStr(tmpl);

		// If options, then this was already compiled from a (script) element template declaration.
		// If not, then if tmpl is a template object, use it for options
		options = options || (tmpl.markup ? tmpl : {});
		options.tmplName = name;
		if (parentTmpl) {
			options._parentTmpl = parentTmpl;
		}
		// If tmpl is not a markup string or a selector string, then it must be a template object
		// In that case, get it from the markup property of the object
		if (!tmplOrMarkup && tmpl.markup && (tmplOrMarkup = tmplOrMarkupFromStr(tmpl.markup))) {
			if (tmplOrMarkup.fn && (tmplOrMarkup.debug !== tmpl.debug || tmplOrMarkup.allowCode !== tmpl.allowCode)) {
				// if the string references a compiled template object, but the debug or allowCode props are different, need to recompile
				tmplOrMarkup = tmplOrMarkup.markup;
			}
		}
		if (tmplOrMarkup !== undefined) {
			if (name && !parentTmpl) {
				$render[name] = function() {
					return tmpl.render.apply(tmpl, arguments);
				};
			}
			if (tmplOrMarkup.fn || tmpl.fn) {
				// tmpl is already compiled, so use it, or if different name is provided, clone it
				if (tmplOrMarkup.fn) {
					if (name && name !== tmplOrMarkup.tmplName) {
						tmpl = extendCtx(options, tmplOrMarkup);
					} else {
						tmpl = tmplOrMarkup;
					}
				}
			} else {
				// tmplOrMarkup is a markup string, not a compiled template
				// Create template object
				tmpl = TmplObject(tmplOrMarkup, options);
				// Compile to AST and then to compiled function
				tmplFn(tmplOrMarkup, tmpl);
			}
			compileChildResources(options);
			return tmpl;
		}
	}
	//==== /end of function compile ====

	function TmplObject(markup, options) {
		// Template object constructor
		var htmlTag,
			wrapMap = $viewsSettings.wrapMap || {},
			tmpl = $extend(
				{
					markup: markup,
					tmpls: [],
					links: {}, // Compiled functions for link expressions
					tags: {}, // Compiled functions for bound tag expressions
					bnds: [],
					_is: "template",
					render: renderContent
				},
				options
			);

		if (!options.htmlTag) {
			// Set tmpl.tag to the top-level HTML tag used in the template, if any...
			htmlTag = rFirstElem.exec(markup);
			tmpl.htmlTag = htmlTag ? htmlTag[1].toLowerCase() : "";
		}
		htmlTag = wrapMap[tmpl.htmlTag];
		if (htmlTag && htmlTag !== wrapMap.div) {
			// When using JsViews, we trim templates which are inserted into HTML contexts where text nodes are not rendered (i.e. not 'Phrasing Content').
			tmpl.markup = $.trim(tmpl.markup);
			tmpl._elCnt = true; // element content model (no rendered text nodes), not phrasing content model
		}

		return tmpl;
	}

	function registerStore(storeName, storeSettings) {

		function theStore(name, item, parentTmpl) {
			// The store is also the function used to add items to the store. e.g. $.templates, or $.views.tags

			// For store of name 'thing', Call as:
			//    $.views.things(items[, parentTmpl]),
			// or $.views.things(name, item[, parentTmpl])

			var onStore, compile, itemName, thisStore;

			if (name && "" + name !== name && !name.nodeType && !name.markup) {
				// Call to $.views.things(items[, parentTmpl]),

				// Adding items to the store
				// If name is a map, then item is parentTmpl. Iterate over map and call store for key.
				for (itemName in name) {
					theStore(itemName, name[itemName], item);
				}
				return $views;
			}
			thisStore = parentTmpl ? parentTmpl[storeNames] = parentTmpl[storeNames] || {} : theStore;

			// Adding a single unnamed item to the store
			if (item === undefined) {
				item = name;
				name = undefined;
			}
			compile = storeSettings.compile;
			if (onStore = $viewsSub.onBeforeStoreItem) {
				// e.g. provide an external compiler or preprocess the item.
				compile = onStore(thisStore, name, item, compile) || compile;
			}
			if (!name) {
				item = compile(undefined, item);
			} else if ("" + name === name) { // name must be a string
				if (item === null) {
					// If item is null, delete this entry
					delete thisStore[name];
				} else {
					thisStore[name] = compile ? (item = compile(name, item, parentTmpl, storeName, storeSettings)) : item;
				}
			}
			if (item) {
				item._is = storeName;
			}
			if (onStore = $viewsSub.onStoreItem) {
				// e.g. JsViews integration
				onStore(thisStore, name, item, compile);
			}
			return item;
		}

		var storeNames = storeName + "s";

		$views[storeNames] = theStore;
		jsvStores[storeName] = storeSettings;
	}

	//==============
	// renderContent
	//==============

	function renderContent(data, context, parentView, key, isLayout, onRender) {
		// Render template against data as a tree of subviews (nested rendered template instances), or as a string (top-level template).
		// If the data is the parent view, treat as layout template, re-render with the same data context.
		var i, l, dataItem, newView, childView, itemResult, swapContent, tagCtx, contentTmpl, tag_, outerOnRender, tmplName, tmpl,
			self = this,
			allowDataLink = !self.attr || self.attr === "html",
			result = "";

		if (key === true) {
			swapContent = true;
			key = 0;
		}
		if (self.tag) {
			// This is a call from renderTag or tagCtx.render()
			tagCtx = self;
			self = self.tag;
			tag_ = self._;
			tmplName = self.tagName;
			tmpl = tagCtx.tmpl;
			context = extendCtx(context, self.ctx);
			contentTmpl = tagCtx.content; // The wrapped content - to be added to views, below
			if ( tagCtx.props.link === false ) {
				// link=false setting on block tag
				// We will override inherited value of link by the explicit setting link=false taken from props
				// The child views of an unlinked view are also unlinked. So setting child back to true will not have any effect.
				context = context || {};
				context.link = false;
			}
			parentView = parentView || tagCtx.view;
			data = data === undefined ? parentView : data;
		} else {
			tmpl = self.jquery && (self[0] || error('Unknown template: "' + self.selector + '"')) // This is a call from $(selector).render
				|| self;
		}
		if (tmpl) {
			if (!parentView && data && data._is === "view") {
				parentView = data; // When passing in a view to render or link (and not passing in a parent view) use the passed in view as parentView
			}
			if (parentView) {
				contentTmpl = contentTmpl || parentView.content; // The wrapped content - to be added as #content property on views, below
				onRender = onRender || parentView._.onRender;
				if (data === parentView) {
					// Inherit the data from the parent view.
					// This may be the contents of an {{if}} block
					// Set isLayout = true so we don't iterate the if block if the data is an array.
					data = parentView.data;
					isLayout = true;
				}
				context = extendCtx(context, parentView.ctx);
			}
			if (!parentView || parentView.data === undefined) {
				(context = context || {}).root = data; // Provide ~root as shortcut to top-level data.
			}

			// Set additional context on views created here, (as modified context inherited from the parent, and to be inherited by child views)
			// Note: If no jQuery, $extend does not support chained copies - so limit extend() to two parameters

			if (!tmpl.fn) {
				tmpl = $templates[tmpl] || $templates(tmpl);
			}

			if (tmpl) {
				onRender = (context && context.link) !== false && allowDataLink && onRender;
				// If link===false, do not call onRender, so no data-linking marker nodes
				outerOnRender = onRender;
				if (onRender === true) {
					// Used by view.refresh(). Don't create a new wrapper view.
					outerOnRender = undefined;
					onRender = parentView._.onRender;
				}
				if ($.isArray(data) && !isLayout) {
					// Create a view for the array, whose child views correspond to each data item. (Note: if key and parentView are passed in
					// along with parent view, treat as insert -e.g. from view.addViews - so parentView is already the view item for array)
					newView = swapContent
						? parentView :
						(key !== undefined && parentView) || View(context, "array", parentView, data, tmpl, key, contentTmpl, onRender);
					for (i = 0, l = data.length; i < l; i++) {
						// Create a view for each data item.
						dataItem = data[i];
						childView = View(context, "item", newView, dataItem, tmpl, (key || 0) + i, contentTmpl, onRender);
						itemResult = tmpl.fn(dataItem, childView, $views);
						result += newView._.onRender ? newView._.onRender(itemResult, childView) : itemResult;
					}
				} else {
					// Create a view for singleton data object. The type of the view will be the tag name, e.g. "if" or "myTag" except for
					// "item", "array" and "data" views. A "data" view is from programatic render(object) against a 'singleton'.
					newView = swapContent ? parentView : View(context, tmplName||"data", parentView, data, tmpl, key, contentTmpl, onRender);
					if (tag_ && !self.flow) {
						newView.tag = self;
					}
					result += tmpl.fn(data, newView, $views);
				}
				return outerOnRender ? outerOnRender(result, newView) : result;
			}
		}
		return "";
	}

	//===========================
	// Build and compile template
	//===========================

	// Generate a reusable function that will serve to render a template against data
	// (Compile AST then build template function)

	function error(message) {
		if ($viewsSettings.debugMode) {
			throw new $views.sub.Error(message);
		}
	}

	function syntaxError(message) {
		error("Syntax error\n" + message);
	}

	function tmplFn(markup, tmpl, isLinkExpr, convertBack) {
		// Compile markup to AST (abtract syntax tree) then build the template function code from the AST nodes
		// Used for compiling templates, and also by JsViews to build functions for data link expressions


		//==== nested functions ====
		function pushprecedingContent(shift) {
			shift -= loc;
			if (shift) {
				content.push(markup.substr(loc, shift).replace(rNewLine, "\\n"));
			}
		}

		function blockTagCheck(tagName) {
			tagName && syntaxError('Unmatched or missing tag: "{{/' + tagName + '}}" in template:\n' + markup);
		}

		function parseTag(all, bind, tagName, converter, colon, html, comment, codeTag, params, slash, closeBlock, index) {

			//    bind         tag        converter colon html     comment            code      params            slash   closeBlock
			// /{(\^)?{(?:(?:(\w+(?=[\/\s}]))|(?:(\w+)?(:)|(>)|!--((?:[^-]|-(?!-))*)--|(\*)))\s*((?:[^}]|}(?!}))*?)(\/)?|(?:\/(\w+)))}}/g
			// Build abstract syntax tree (AST): [ tagName, converter, params, content, hash, bindings, contentMarkup ]
			if (html) {
				colon = ":";
				converter = "html";
			}
			slash = slash || isLinkExpr;
			var noError, current0,
				pathBindings = bind && [],
				code = "",
				hash = "",
				passedCtx = "",
				// Block tag if not self-closing and not {{:}} or {{>}} (special case) and not a data-link expression
				block = !slash && !colon && !comment;

			//==== nested helper function ====
			tagName = tagName || colon;
			pushprecedingContent(index);
			loc = index + all.length; // location marker - parsed up to here
			if (codeTag) {
				if (allowCode) {
					content.push(["*", "\n" + params.replace(rUnescapeQuotes, "$1") + "\n"]);
				}
			} else if (tagName) {
				if (tagName === "else") {
					if (rTestElseIf.test(params)) {
						syntaxError('for "{{else if expr}}" use "{{else expr}}"');
					}
					pathBindings = current[6];
					current[7] = markup.substring(current[7], index); // contentMarkup for block tag
					current = stack.pop();
					content = current[3];
					block = true;
				}
				if (params) {
					// remove newlines from the params string, to avoid compiled code errors for unterminated strings
					params = params.replace(rNewLine, " ");
					code = parseParams(params, pathBindings)
						.replace(rBuildHash, function(all, isCtx, keyValue) {
							if (isCtx) {
								passedCtx += keyValue + ",";
							} else {
								hash += keyValue + ",";
							}
							return "";
						});
				}
				hash = hash.slice(0, -1);
				code = code.slice(0, -1);
				noError = hash && (hash.indexOf("noerror:true") + 1) && hash || "";

				newNode = [
						tagName,
						converter || !!convertBack || "",
						code,
						block && [],
						'params:"' + params + '",props:{' + hash + "}"
							+ (passedCtx ? ",ctx:{" + passedCtx.slice(0, -1) + "}" : ""),
						noError,
						pathBindings || 0
					];
				content.push(newNode);
				if (block) {
					stack.push(current);
					current = newNode;
					current[7] = loc; // Store current location of open tag, to be able to add contentMarkup when we reach closing tag
				}
			} else if (closeBlock) {
				current0 = current[0];
				blockTagCheck(closeBlock !== current0 && current0 !== "else" && closeBlock);
				current[7] = markup.substring(current[7], index); // contentMarkup for block tag
				current = stack.pop();
			}
			blockTagCheck(!current && closeBlock);
			content = current[3];
		}
		//==== /end of nested functions ====

		var newNode,
			allowCode = tmpl && tmpl.allowCode,
			astTop = [],
			loc = 0,
			stack = [],
			content = astTop,
			current = [, , , astTop];

		markup = markup.replace(rEscapeQuotes, "\\$1");

//TODO	result = tmplFnsCache[markup]; // Only cache if template is not named and markup length < ...,
//and there are no bindings or subtemplates?? Consider standard optimization for data-link="a.b.c"
//		if (result) {
//			tmpl.fn = result;
//		} else {

//		result = markup;

		blockTagCheck(stack[0] && stack[0][3].pop()[0]);

		// Build the AST (abstract syntax tree) under astTop
		markup.replace(rTag, parseTag);

		pushprecedingContent(markup.length);

		if (loc = astTop[astTop.length - 1]) {
			blockTagCheck("" + loc !== loc && (+loc[7] === loc[7]) && loc[0]);
		}
//			result = tmplFnsCache[markup] = buildCode(astTop, tmpl);
//		}
		return buildCode(astTop, tmpl || markup, isLinkExpr);
	}

	function buildCode(ast, tmpl, isLinkExpr) {
		// Build the template function code from the AST nodes, and set as property on the passed-in template object
		// Used for compiling templates, and also by JsViews to build functions for data link expressions
		var i, node, tagName, converter, params, hash, hasTag, hasEncoder, getsVal, hasCnvt, tmplBindings, pathBindings, elseStartIndex, elseIndex,
			nestedTmpls, tmplName, nestedTmpl, tagAndElses, allowCode, content, markup, notElse, nextIsElse, oldCode, isElse, isGetVal, prm, tagCtxFn,
			tmplBindingKey = 0,
			code = "",
			noError = "",
			tmplOptions = {},
			l = ast.length;

		if ("" + tmpl === tmpl) {
			tmplName = isLinkExpr ? 'data-link="' + tmpl.replace(rNewLine, " ").slice(1, -1) + '"' : tmpl;
			tmpl = 0;
		} else {
			tmplName = tmpl.tmplName || "unnamed";
			if (allowCode = tmpl.allowCode) {
				tmplOptions.allowCode = true;
			}
			if (tmpl.debug) {
				tmplOptions.debug = true;
			}
			tmplBindings = tmpl.bnds;
			nestedTmpls = tmpl.tmpls;
		}
		for (i = 0; i < l; i++) {
			// AST nodes: [ tagName, converter, params, content, hash, noError, pathBindings, contentMarkup, link ]
			node = ast[i];

			// Add newline for each callout to t() c() etc. and each markup string
			if ("" + node === node) {
				// a markup string to be inserted
				code += '\nret+="' + node + '";';
			} else {
				// a compiled tag expression to be inserted
				tagName = node[0];
				if (tagName === "*") {
					// Code tag: {{* }}
					code += "" + node[1];
				} else {
					converter = node[1];
					params = node[2];
					content = node[3];
					hash = node[4];
					noError = node[5];
					markup = node[7];

					if (!(isElse = tagName === "else")) {
						tmplBindingKey = 0;
						if (tmplBindings && (pathBindings = node[6])) { // Array of paths, or false if not data-bound
							tmplBindingKey = tmplBindings.push(pathBindings);
						}
					}
					if (isGetVal = tagName === ":") {
						if (converter) {
							tagName = converter === "html" ? ">" : converter + tagName;
						}
						if (noError) {
							// If the tag includes noerror=true, we will do a try catch around expressions for named or unnamed parameters
							// passed to the tag, and return the empty string for each expression if it throws during evaluation
							//TODO This does not work for general case - supporting noError on multiple expressions, e.g. tag args and properties.
							//Consider replacing with try<a.b.c(p,q) + a.d, xxx> and return the value of the expression a.b.c(p,q) + a.d, or, if it throws, return xxx||'' (rather than always the empty string)
							prm = "prm" + i;
							noError = "try{var " + prm + "=[" + params + "][0];}catch(e){" + prm + '="";}\n';
							params = prm;
						}
					} else {
						if (content) {
							// Create template object for nested template
							nestedTmpl = TmplObject(markup, tmplOptions);
							nestedTmpl.tmplName = tmplName + "/" + tagName;
							// Compile to AST and then to compiled function
							buildCode(content, nestedTmpl);
							nestedTmpls.push(nestedTmpl);
						}

						if (!isElse) {
							// This is not an else tag.
							tagAndElses = tagName;
							// Switch to a new code string for this bound tag (and its elses, if it has any) - for returning the tagCtxs array
							oldCode = code;
							code = "";
							elseStartIndex = i;
						}
						nextIsElse = ast[i + 1];
						nextIsElse = nextIsElse && nextIsElse[0] === "else";
					}

//TODO consider passing in ret to c() and t() so they can look at the previous ret, and detect whether this is a jsrender tag _within_an_HTML_element_tag_
// and if so, don't insert marker nodes, add data-link attributes to the HTML element markup... No need for people to set link=false.

//TODO consider the following approach rather than noerror=true: params.replace(/data.try\([^]*\)/)

					hash += ",args:[" + params + "]}";

					if (isGetVal && pathBindings || converter && tagName !== ">") {
						// For convertVal we need a compiled function to return the new tagCtx(s)
						tagCtxFn = new Function("data,view,j,u", " // "
									+ tmplName + " " + tmplBindingKey + " " + tagName + "\n" + noError + "return {" + hash + ";");
						tagCtxFn.paths = pathBindings;
						tagCtxFn._ctxs = tagName;
						if (isLinkExpr) {
							return tagCtxFn;
						}
						hasCnvt = true;
					}

					code += (isGetVal
						? "\n" + (pathBindings ? "" : noError) + (isLinkExpr ? "return " : "ret+=") + (hasCnvt // Call _cnvt if there is a converter: {{cnvt: ... }} or {^{cnvt: ... }}
							? (hasCnvt = true, 'c("' + converter + '",view,' + (pathBindings
								? ((tmplBindings[tmplBindingKey - 1] = tagCtxFn), tmplBindingKey) // Store the compiled tagCtxFn in tmpl.bnds, and pass the key to convertVal()
								: "{" + hash) + ");")
							: tagName === ">"
								? (hasEncoder = true, "h(" + params + ");")
								: (getsVal = true, "(v=" + params + ")!=" + (isLinkExpr ? "=" : "") + 'u?v:"";') // Strict equality just for data-link="title{:expr}" so expr=null will remove title attribute 
						)
						: (hasTag = true, "{tmpl:" // Add this tagCtx to the compiled code for the tagCtxs to be passed to renderTag()
							+ (content ? nestedTmpls.length: "0") + "," // For block tags, pass in the key (nestedTmpls.length) to the nested content template
							+ hash + ","));

					if (tagAndElses && !nextIsElse) {
						code = "[" + code.slice(0, -1) + "]"; // This is a data-link expression or the last {{else}} of an inline bound tag. We complete the code for returning the tagCtxs array
						if (isLinkExpr || pathBindings) {
							// This is a bound tag (data-link expression or inline bound tag {^{tag ...}}) so we store a compiled tagCtxs function in tmp.bnds
							code = new Function("data,view,j,u", " // " + tmplName + " " + tmplBindingKey + " " + tagAndElses + "\nreturn " + code + ";");
							if (pathBindings) {
								(tmplBindings[tmplBindingKey - 1] = code).paths = pathBindings;
							}
							code._ctxs = tagName;
							if (isLinkExpr) {
								return code; // For a data-link expression we return the compiled tagCtxs function
							}
						}

						// This is the last {{else}} for an inline tag.
						// For a bound tag, pass the tagCtxs fn lookup key to renderTag.
						// For an unbound tag, include the code directly for evaluating tagCtxs array
						code = oldCode + '\nret+=t("' + tagAndElses + '",view,this,' + (tmplBindingKey || code) + ");";
						pathBindings = 0;
						tagAndElses = 0;
					}
				}
			}
		}
		// Include only the var references that are needed in the code
		code = "// " + tmplName
			+ "\nvar j=j||" + (jQuery ? "jQuery." : "js") + "views"
			+ (getsVal ? ",v" : "")                      // gets value
			+ (hasTag ? ",t=j._tag" : "")                // has tag
			+ (hasCnvt ? ",c=j._cnvt" : "")              // converter
			+ (hasEncoder ? ",h=j.converters.html" : "") // html converter
			+ (isLinkExpr ? ";\n" : ',ret="";\n')
			+ ($viewsSettings.tryCatch ? "try{\n" : "")
			+ (tmplOptions.debug ? "debugger;" : "")
			+ code + (isLinkExpr ? "\n" : "\nreturn ret;\n")
			+ ($viewsSettings.tryCatch ? "\n}catch(e){return j._err(e);}" : "");
		try {
			code = new Function("data,view,j,u", code);
		} catch (e) {
			syntaxError("Compiled template code:\n\n" + code, e);
		}
		if (tmpl) {
			tmpl.fn = code;
		}
		return code;
	}

	function parseParams(params, bindings) {

		function parseTokens(all, lftPrn0, lftPrn, path, operator, err, eq, path2, prn, comma, lftPrn2, apos, quot, rtPrn, rtPrnDot, prn2, space, index, full) {
			// rParams = /(\()(?=\s*\()|(?:([([])\s*)?(?:([#~]?[\w$^.]+)?\s*((\+\+|--)|\+|-|&&|\|\||===|!==|==|!=|<=|>=|[<>%*!:?\/]|(=))\s*|([#~]?[\w$^.]+)([([])?)|(,\s*)|(\(?)\\?(?:(')|("))|(?:\s*([)\]])([([]?))|(\s+)
			//          lftPrn0-flwed by (- lftPrn               path    operator err                                                eq         path2       prn    comma   lftPrn2   apos quot        rtPrn   prn2   space
			// (left paren? followed by (path? followed by operator) or (path followed by paren?)) or comma or apos or quot or right paren or space
			operator = operator || "";
			lftPrn = lftPrn || lftPrn0 || lftPrn2;
			path = path || path2;
			if (bindings && rtPrnDot) {
				// TODO check for nested call ~foo(~bar().x).y
				bindings.push({_jsvOb: full.slice(pathStart[parenDepth - 1] + 1, index + 1)});
			}
			prn = prn || prn2 || "";

			function parsePath(all, object, helper, view, viewProperty, pathTokens, leafToken) {
				// rPath = /^(?:null|true|false|\d[\d.]*|([\w$]+|~([\w$]+)|#(view|([\w$]+))?)([\w$.^]*?)(?:[.[^]([\w$]+)\]?)?)$/g,
				//                                        object   helper    view  viewProperty pathTokens       leafToken
				if (object) {
					bindings && !isAlias && bindings.push(path); // Add path binding for paths on props and args,
					// but not within foo=expr (named parameter) or ~foo=expr (passing in template parameter aliases).
//TODO Add opt-out for path binding {^{foo |expr1| b=|expr2|}
					if (object !== ".") {
						var ret = (helper
								? 'view.hlp("' + helper + '")'
								: view
									? "view"
									: "data")
							+ (leafToken
								? (viewProperty
									? "." + viewProperty
									: helper
										? ""
										: (view ? "" : "." + object)
									) + (pathTokens || "")
								: (leafToken = helper ? "" : view ? viewProperty || "" : object, ""));

						ret = ret + (leafToken ? "." + leafToken : "");

						return ret.slice(0, 9) === "view.data"
							? ret.slice(5) // convert #view.data... to data...
							: ret;
					}
				}
				return all;
			}

			if (err) {
				syntaxError(params);
			} else {
				var tokens = (aposed
					// within single-quoted string
					? (aposed = !apos, (aposed ? all : '"'))
					: quoted
					// within double-quoted string
						? (quoted = !quot, (quoted ? all : '"'))
						:
					(
						(lftPrn
								? (parenDepth++, pathStart[parenDepth] = index, lftPrn)
								: "")
						+ (space
							? (parenDepth
								? ""
								: named
									? (named = isAlias = false, "\b")
									: ","
							)
							: eq
					// named param
					// Insert backspace \b (\x08) as separator for named params, used subsequently by rBuildHash
								? (parenDepth && syntaxError(params), named = path, isAlias = path.charAt(0) === "~", '\b' + path + ':')
								: path
					// path
									? (path.split("^").join(".").replace(rPath, parsePath)
										+ (prn
											? (fnCall[++parenDepth] = true, prn)
											: operator)
									)
									: operator
										? operator
										: rtPrn
					// function
											? ((fnCall[parenDepth--] = false, rtPrn)
												+ (prn
													? (fnCall[++parenDepth] = true, prn)
													: "")
											)
											: comma
//TODO add support for top-level literals
												? (fnCall[parenDepth] || syntaxError(params), ",") // We don't allow top-level literal arrays or objects
												: lftPrn0
													? ""
													: (aposed = apos, quoted = quot, '"')
					))
				);
				return tokens;
			}
		}

		var named, isAlias,
			fnCall = {},
			pathStart = {0:-1},
			parenDepth = 0,
			quoted = false, // boolean for string content in double quotes
			aposed = false; // or in single quotes

		return (params + " ").replace(rParams, parseTokens);
	}

	//==========
	// Utilities
	//==========

	// Merge objects, in particular contexts which inherit from parent contexts
	function extendCtx(context, parentContext) {
		// Return copy of parentContext, unless context is defined and is different, in which case return a new merged context
		// If neither context nor parentContext are undefined, return undefined
		return context && context !== parentContext
			? (parentContext
				? $extend($extend({}, parentContext), context)
				: context)
			: parentContext && $extend({}, parentContext);
	}

	//========================== Initialize ==========================

	for (jsvStoreName in jsvStores) {
		registerStore(jsvStoreName, jsvStores[jsvStoreName]);
	}

	var $templates = $views.templates,
		$converters = $views.converters,
		$helpers = $views.helpers,
		$tags = $views.tags,
		$viewsSub = $views.sub,
		$viewsSettings = $views.settings;

	if (jQuery) {
		////////////////////////////////////////////////////////////////////////////////////////////////
		// jQuery is loaded, so make $ the jQuery object
		$ = jQuery;
		$.fn.render = renderContent;

	} else {
		////////////////////////////////////////////////////////////////////////////////////////////////
		// jQuery is not loaded.

		$ = global.jsviews = {};

		$.isArray = Array && Array.isArray || function(obj) {
			return Object.prototype.toString.call(obj) === "[object Array]";
		};
	}

	$.render = $render;
	$.views = $views;
	$.templates = $templates = $views.templates;

	//========================== Register tags ==========================

	$tags({
		"else": function() {}, // Does nothing but ensures {{else}} tags are recognized as valid
		"if": {
			render: function(val) {
				// This function is called once for {{if}} and once for each {{else}}.
				// We will use the tag.rendering object for carrying rendering state across the calls.
				// If not done (a previous block has not been rendered), look at expression for this block and render the block if expression is truey
				// Otherwise return ""
				var self = this,
					ret = (self.rendering.done || !val && (arguments.length || !self.tagCtx.index))
						? ""
						: (self.rendering.done = true, self.selected = self.tagCtx.index,
							// Test is satisfied, so render content on current context. We call tagCtx.render() rather than return undefined
							// (which would also render the tmpl/content on the current context but would iterate if it is an array)
							self.tagCtx.render());
				return ret;
			},
			onUpdate: function(ev, eventArgs, tagCtxs) {
				var tci, prevArg, different;
				for (tci = 0; (prevArg = this.tagCtxs[tci]) && prevArg.args.length; tci++) {
					prevArg = prevArg.args[0];
					different = !prevArg !== !tagCtxs[tci].args[0];
					if (!!prevArg || different) {
						return different;
						// If newArg and prevArg are both truey, return false to cancel update. (Even if values on later elses are different, we still don't want to update, since rendered output would be unchanged)
						// If newArg and prevArg are different, return true, to update
						// If newArg and prevArg are both falsey, move to the next {{else ...}}
					}
				}
				// Boolean value of all args are unchanged (falsey), so return false to cancel update
				return false;
			},
			flow: true
		},
		"for": {
			render: function(val) {
				// This function is called once for {{for}} and once for each {{else}}.
				// We will use the tag.rendering object for carrying rendering state across the calls.
				var i, arg,
					self = this,
					tagCtx = self.tagCtx,
					noArg = !arguments.length,
					result = "",
					done = noArg || 0;

				if (!self.rendering.done) {
					if (noArg) {
						result = undefined;
					} else if (val !== undefined) {
						result += tagCtx.render(val);
						// {{for}} (or {{else}}) with no argument will render the block content
						done += $.isArray(val) ? val.length : 1;
					}
					if (self.rendering.done = done) {
						self.selected = tagCtx.index;
					}
					// If nothing was rendered we will look at the next {{else}}. Otherwise, we are done.
				}
				return result;
			},
			onUpdate: function(ev, eventArgs, tagCtxs) {
				//Consider adding filtering for perf optimization. However the below prevents update on some scenarios which _should_ update - namely when there is another array on which for also depends.
				//var i, l, tci, prevArg;
				//for (tci = 0; (prevArg = this.tagCtxs[tci]) && prevArg.args.length; tci++) {
				//	if (prevArg.args[0] !== tagCtxs[tci].args[0]) {
				//		return true;
				//	}
				//}
				//return false;
			},
			onArrayChange: function(ev, eventArgs) {
				var arrayView,
					self = this,
					change = eventArgs.change;
				if (this.tagCtxs[1] && (
						   change === "insert" && ev.target.length === eventArgs.items.length // inserting, and new length is same as inserted length, so going from 0 to n
						|| change === "remove" && !ev.target.length // removing , and new length 0, so going from n to 0
						|| change === "refresh" && !eventArgs.oldItems.length !== !ev.target.length // refreshing, and length is going from 0 to n or from n to 0
					)) {
					this.refresh();
				} else {
					for (arrayView in self._.arrVws) {
						arrayView = self._.arrVws[arrayView];
						if (arrayView.data === ev.target) {
							arrayView._.onArrayChange.apply(arrayView, arguments);
						}
					}
				}
				ev.done = true;
			},
			flow: true
		},
		include: {
			flow: true
		},
		"*": {
			// {{* code... }} - Ignored if template.allowCode is false. Otherwise include code in compiled template
			render: function(value) {
				return value; // Include the code.
			},
			flow: true
		}
	});

	//========================== Register global helpers ==========================

	//	$helpers({ // Global helper functions
	//		// TODO add any useful built-in helper functions
	//	});

	//========================== Register converters ==========================

	// Get character entity for HTML and Attribute encoding
	function getCharEntity(ch) {
		return charEntities[ch];
	}

	$converters({
		html: function(text) {
			// HTML encode: Replace < > & and ' and " by corresponding entities.
			return text != undefined ? String(text).replace(rHtmlEncode, getCharEntity) : ""; // null and undefined return ""
		},
		attr: function(text) {
			// Attribute encode: Replace < & ' and " by corresponding entities.
			return text != undefined ? String(text).replace(rAttrEncode, getCharEntity) : text === null ? null : ""; // null returns null, e.g. to remove attribute. undefined returns ""
		},
		url: function(text) {
			// TODO - support chaining {{attr|url:....}} to protect against injection attacks from url parameters containing " or '.
			// URL encoding helper.
			return text != undefined ? encodeURI(String(text)) : text === null ? null : ""; // null returns null, e.g. to remove attribute. undefined returns ""
		}
	});

	//========================== Define default delimiters ==========================
	$viewsDelimiters();

})(this, this.jQuery);/*!
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

$.widget( "an.sliderfield",  $.an.inputfield, {
	_create: function() {
		$.an.inputfield.prototype._create.apply(this, arguments);
		this.element.addClass("an-sliderfield");
	},
	
	_createControl : function() {
		var o = this.options, self = this;
		if (!o.min) {
			o.min = 1;
		}
		
		if (!o.max) {
			o.max = 100;
		}
		
		this.input = $("<input type='text'/>").attr({ name : o.id }).attr({min:o.min, max:o.max}).bind(
			"change.inputfield keyup.inputfield",
			function(e) {
				var value = self.input.val(), oldValue = o.value;
				if (value != oldValue) {
					o.value = value;
					self._trigger("optionchanged", null, { key : "value", value : value, oldValue : oldValue,
						isTransient : o.isTransient });
				}
			}).addClass("content ui-shadow-inset ui-corner-all ui-btn-shadow ui-body-c ui-input-text");
	},
	
	_edit : function() {
		this.input.appendTo(this.content).slider(this.options);
	},
	
	_makeResizable:function(){},
	
	_design:function() {
		if(!this.linkStr){
			this.linkStr= $('<input type="text" disabled="disabled" class="content ui-shadow-inset ui-corner-all ui-btn-shadow ui-body-c ui-input-text ui-slider-input"><div role="application" class="ui-slider-track ui-btn-down-c ui-btn-corner-all">\
			<a href="#"\
			class="ui-slider-handle ui-btn ui-shadow ui-btn-corner-all ui-btn-up-c"\
			data-corners="true" data-shadow="true" data-iconshadow="true"\
			data-wrapperels="span" data-theme="c" role="slider" aria-valuemin="0"\
			aria-valuemax="100" aria-valuenow="0" aria-valuetext="0" title="0"\
			aria-labelledby="slider1-label" style="left: 50%;">\
			<span class="ui-btn-inner">\
				<span class="ui-btn-text"></span>\
			</span>\
		</a>\
	</div>');
			this.linkStr.appendTo(this.content.removeClass("content"));
			}
	},
	
	destroy: function() {
		return $.an.inputfield.prototype.destroy.apply(this, arguments);
	}
});
})( jQuery );
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

$.widget( "an.togglefield", $.an.sliderfield, {
	_create: function() {
		$.an.sliderfield.prototype._create.apply(this, arguments);
		this.element.addClass("an-togglefield");
		this.element.unbind("change.widget");
	},
	
	_createControl : function() {
		var o = this.options, self = this;
		var el=this.element;
		o.ontext = o.ontext || "On";
		o.offtext = o.offtext || "Off";
		this.input = $('<select >\
		    <option value="no">' + o.ontext + '</option>\
		    <option value="yes">' + o.offtext + '</option>\
		  </select>').attr({ name : o.id });
		o.stop=function(e, ui){
			var value = self.input.val(), oldValue = o.value;
			if (value != oldValue) {
				o.value = value;
				self._trigger("optionchanged", null, { key : "value", value : value, oldValue : oldValue,isTransient : o.isTransient });
			}
			if($(e.target).closest(".widget")[0] == self.element[0]){
				setTimeout(function(){el.trigger($.Event(e,{type:"widgetchange"}), self);},20);
			}
		}
		self._trigger("optionchanged", null, { key : "value", value : "no", oldValue : "",isTransient : o.isTransient });
	},
	
	_edit : function() {
		var o = this.options, self = this;
		this.input.appendTo(this.content).slider(this.options);
	},

	_browser : function() {
		var o = this.options, self = this;
		var text=o.value=="no"?o.ontext:o.offtext;
		this.input.detach();
		this.content.empty().append($("<span style=\"height:32px;line-height:32px;margin:.5em 0;width: 5.8em;display:inline-block;\">"+text+"</span>"));
	},
	
	_makeResizable:function(){},
	
	_design:function() {
		if(!this.select){
			var o = this.options;
			if (o.mobile) {
				var cl = this.element.find(".content").eq(0);
				cl.addClass("codiqa-control ui-field-contain ui-body ui-br");
				this.select = $('<select />').attr({id:o.id, name:o.id, value:this.value})
			    .addClass("ui-slider-switch").appendTo(cl);
				var toggle_content = $('<div />').addClass('ui-slider ui-slider-switch ui-btn-down-c ui-btn-corner-all').appendTo(cl);
				toggle_content.html('<span class="ui-slider-label ui-slider-label-a ui-btn-active ui-btn-corner-all" role="img" style="width: 0%;">On</span><span class="ui-slider-label ui-slider-label-b ui-btn-down-c ui-btn-corner-all" role="img" style="width: 100%;">Off</span>');
				var toggle_a_content = $('<div />').addClass("ui-slider-inneroffset").appendTo(toggle_content);
				$('<a />').addClass('ui-slider-handle ui-slider-handle-snapping ui-btn ui-btn-up-c ui-shadow ui-btn-corner-all')
										.html('<span class="ui-btn-inner"><span class="ui-btn-text"></span></span>').appendTo(toggle_a_content);
				this.content.removeClass("content");
			}
			}
	},
	
	destroy: function() {
		return $.an.sliderfield.prototype.destroy.apply(this, arguments);
	}
});
})( jQuery );
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
            var wrap = $('<div data-content-theme="'+o.content_theme+'"></div>'),
				header = $('<h3>' + o.headerText + '</h3>');
            this.contentDiv = $('<div></div>');
			wrap.append(header);
			if(o.link=="raw"){
				wrap.append(this.element.children(".content").children());
			}else{
				wrap.append(this.contentDiv);
			}
            this.element.find('.content').append(wrap);
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
			
			wrap.collapsible&&wrap.collapsible(newOps);
        }
	},
	
	_browser:function(){
		var o = this.options,link=o.link;
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
		var o = this.options,link=o.link;
		this.option("contextmenu2", false);
		this.content[0].contentEditable = false;
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
		this.element.removeClass("an-collapsiblewidget");
        this.element.unbind('collapsiblewidget');
        this.content.remove();
		return $.an.widget.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
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

$.widget( "an.navbarwidget",  $.an.widget, {

	_create: function() {
		var o = this.options;
		$.an.widget.prototype._create.apply(this, arguments);
		// this.element.addClass("an-navbarwidget");
		if (o.mobile) {
			try {this.content.navbar({iconpos:o.iconpos}); }catch(e) {}
		}
	},

	_makeResizable:function(){},
	
	_browser:function() {
		var span = this.content.find(".an-navbarwidget");
		$(span).each(function(k, v) {
			$(v).remove();
		});
		
		this.content.find(".c li").css("clear", "none");
	},

	_edit:function() {
		var span = this.content.find(".an-navbarwidget");
		$(span).each(function(k, v) {
			$(v).remove();
		});
		
		this.content.find(".c li").css("clear", "none");
	},
	
	_design:function() {
		var o = this.options;
		if (o.mobile) {
			var content = $("<div data-role='navbar'/>").attr("id", o.id);
			var ul = $("<ul class='c' />"), width;
			var len = o.selectItems.length;
			$(o.selectItems).each(function(k, v) {
				var link = $("<a/>"), linkClass = 'ui-btn ';
				var subspan = $("<span style='display:none;' class='an-navbarwidget' />");
				subspan.addClass(o.iconpos || "");
				if (v.data_transition) {
					link.attr("data-transition", v.data_transition);
				}
				
				if (v.data_icon) {
					subspan.addClass("ui-icon ui-icon-" + v.data_icon);
					subspan.css('display', 'block');
					link.attr("data-icon", v.data_icon);
				}
				
				if (o.iconpos) {
					subspan.addClass("ui-btn-icon-" + o.iconpos);
				}
				
				if (v.data_theme) {
					linkClass += " ui-btn-up-" + v.data_theme;
					link.attr("data-theme", v.data_theme);
				}
				
				if (v.data_inline) {
					linkClass += " ui-btn-inline";
					link.attr("data-inline", true);
				}
				
				if (v.isMini) {
					linkClass += " ui-mini";
					link.attr("data-mini", true);
				}

				if (v.href) {
					link.attr("link", v.href);
				}
				
				if (len <= 5) {
					width = 100 / len;
				} else {
					width = "33.33";
				}
				if (o.iconpos && o.iconpos != 'bottom') {
					link.append(subspan).addClass(linkClass);
				}
				link.append(v.label || "Button");
				if (o.iconpos && o.iconpos == 'bottom') {
					link.append(subspan).addClass(linkClass);
				}
				ul.append($("<li style='width:" + width + "%;'/>").addClass("ui-block-a").append(link));
			});
			
			content.append(ul);
			this.content.html(content.html());
		}
	},
	
	destroy: function() {
		return $.an.widget.prototype.destroy.apply(this, arguments);
	}
});
})( jQuery );
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

$.widget( "an.listviewfield", $.an.field, {
	options: {
		mode: "browser",
		value:[]
	},

	_create: function() {
		$.an.field.prototype._create.apply(this, arguments);
		this.element.addClass("an-listviewfield");
	},	

	_createControl : function() {
		var self = this, o = this.options, el = this.element;
		if (o.mobile) {
			var cl = this.element.find(".content").eq(0);
			this.ul_element = $('<ul name="' + o.id + '" data-role="listview" />').appendTo(cl);
			if(o.isInset){
				this.ul_element.attr("data-inset","true");
			}

			if(o.label_theme){
				this.ul_element.attr("data-divider-theme",o.label_theme);
			}
			if(o.data_theme){
				this.ul_element.attr("data-theme",o.data_theme);		
			}
			if(o.splitIcon){
				this.ul_element.attr("data-split-icon",o.splitIcon);
				this.ul_element.attr("data-split-theme","d");
			}
		} 
	},
	
	_createLabel:function(){
	},

	_makeResizable : function() {
	},

	_notify:function(oldValue, value){
		var o = this.options;
		if(value != oldValue){
			o.value = value;
			this._trigger("optionchanged",null,{key:"value", value:value, oldValue:oldValue, isTransient:o.isTransient});
		}
	},
	
	appendValue:function(value) {
		var o = this.options, oldValue = [].concat(o.value);
		o.value.push(value);
		this.refresh();
		this._notify(oldValue, o.value);
	},

	insertValue:function(index, value) {
		var o = this.options, oldValue = [].concat(o.value);
		o.value.splice(index, 1, value);
		this.refresh();
		this._notify(oldValue, o.value);
	},
	
	delValue:function(index) {
		var o = this.options, oldValue = [].concat(o.value);
		o.value.splice(index, 1);
		this.refresh();
		this._notify(oldValue, o.value);
	},
	
	getValue:function(index) {
		var o = this.options;
		return o.value[index];
	},
	
	replaceValue:function(index, value) {
		var o = this.options, oldValue = [].concat(o.value);
		o.value[index] = value;
		this.refresh();
		this._notify(oldValue, o.value);
	},

	_browser : function() {
		var o = this.options,button_li="";
		this.ul_element.empty();
		o.value=[];
		$.each(o.selectItems||[], function(k,v){
			o.value.push(o.selectItems[k].value);
			button_li += "<li><a>"+this.label+"</a></li>";							
		});
		if(o.label){
			this.ul_element.append('<li data-role="list-divider"><a>' + o.label + '</a></li>');
		}
		this.ul_element.append(button_li);
		this.ul_element.listview();
		this.ul_element.data("mobileListview").refresh();
	},

	_edit : function() {
		var o = this.options,button_li="";
		this.ul_element.empty();
		o.value=[];
		$.each(o.selectItems||[], function(k,v){
			o.value.push(o.selectItems[k].value);
			if(o.splitIcon){
				button_li += "<li><a>"+this.label+"</a><a href=\"javascript:;\">"+o.splitText+"</a></li>";
			}else{
				button_li += "<li><a>"+this.label+"</a></li>";	
			}
		});
		if(o.value.length>0)this._trigger("optionchanged",null,{key:"value", value:o.value, oldValue:[], isTransient:o.isTransient});
		if(o.label){
			this.ul_element.append('<li data-role="list-divider"><a>' + o.label + '</a></li>');
		}
		
		this.ul_element.append(button_li);
		if(this.ul_element.listview){
			this.ul_element.listview();
			this.ul_element.data("mobileListview").refresh();
		}
	},

	_design : function() {
		//this.input.detach();
		var self = this, o = this.options, cl = this.content;
	
		if (cl.is(".ui-resizable")) c.resizable("destroy");
		cl.html('');
			var ul_element = $('<ul />').addClass('codiqa-control ui-listview').appendTo(cl);
			if(!o.label_theme){
				o.label_theme='c';
			}
			if(o.label){
				ul_element.html('<li data-role="list-divider"><a>' + o.label + '</a></li>');
			}
			var label_li = $('<li />').addClass('ui-li ui-li-divider ui-bar-' + o.label_theme + ' ui-first-child').html(o.label).appendTo(ul_element);
			$.each(o.selectItems||[], function(k,v){
				button_li = $("<li class='ui-btn ui-btn-icon-right ui-li-has-arrow ui-li' />").appendTo(ul_element);				
				$('<div class="ui-btn-inner ui-li" />').html('<div class="ui-btn-text"><a class="ui-link-inherit" >' + this.label + '</a></div><span class="ui-icon ui-icon-arrow-r ui-icon-shadow"> </span>')
														.appendTo(button_li);
														
				if(k==o.selectItems.length-1){
					button_li.addClass("ui-last-child");
				}
				
				if (o.isInset) {
					ul_element.addClass("ui-listview-inset ui-corner-all ui-shadow");
				}
				button_li.addClass("ui-btn-up-" + o.data_theme);
				
				
			});						
		
	},



	/*highlight : function(highlight) {
		(this.options.mode == "edit" ? this.input : this.element).toggleClass("an-state-hover", highlight);
	},*/

	destroy : function() {
		//this.element.unbind(".listviewfield").remove();
		this.element.removeClass("an-listviewfield");
		return $.an.field.prototype.destroy.apply(this, arguments);
	} });
})( jQuery );
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

$.widget( "an.customhtmlfield", $.an.field, {


	_create: function() {
		$.an.field.prototype._create.apply(this, arguments);
		this.element.addClass("an-customhtmlfield");
	},	

	_createControl : function() {
		var self = this, o = this.options, el = this.element;
		if (o.mobile) {
			try{
			var cl = this.element.find(".content").eq(0);
			var customhtml = '';
			customhtml += o.customhtml; 
			
			cl.html(customhtml);
			this.element.context.lastElementChild.lastElementChild.className = 'customhtml';
			if($('.customhtml').listview){
				$('.customhtml').listview();
			}
			}catch (e){}
		} 
		
	},
	
	_createLabel:function(){
		this.element.find('label').remove();
		
	},

	_makeResizable : function() {
	},

	_browser : function() {
		//this.element.find('label').remove();
		//this.input.detach();
		/*var c = this.content;
		if (c.is(".ui-resizable")) c.resizable("destroy");
		c.html(this.options.value + "").css("display", "");*/
	},

	_edit : function() {
		//this.input.detach().val(this.options.value).appendTo(this.content.empty());
	},

	_design : function() {
		//this.input.detach();
		//var self = this, o = this.options, c = this.content;
		//if (c.is(".ui-resizable")) c.resizable("destroy");
		//this.element.find('li').unbind();
		/*c.html(o.value + "").css({ width : o.width, height : o.height, display : "" }).resizable(
			{ stop : function(e, ui) {
				o.width = c.width();
				o.height = c.height();
				$.extend(true, o.metadata[self.widgetName], { width : o.width, height : o.height });
				self._updateMetadata();
				self._trigger("resize", null, { size : ui.size, oldSize : ui.originalSize });
			} });*/
		var self = this;
		//self.content.html(123);
		/*$.get("http://192.168.1.52:8080/page2.html?dbid=519093fbac8f2702b2000002&formid=51abf3e521c7d6005b000069", {}, function(data) {
			console.log(data);
			//self.content.html(data);
		}, 'html');*/
		//console.log(document.body.innerHTML);
		//var fram = '<iframe style="display:none;" src="http://192.168.1.52:8080/page2.html?dbid=519093fbac8f2702b2000002&formid=51abf3e521c7d6005b000069" />';
		//console.log($(fram));
		//this.content.html(fram);
		//this.content.find();
		/*$.ajax({
			  type: "GET",
			  url: "http://192.168.1.52:8080/page2.html?dbid=519093fbac8f2702b2000002&formid=51abf3e521c7d6005b000069",
			  dataType: "html",
			  success:function(data){
				  fram.html(data);
				  this.content.html(fram);
			  }
			});*/
	},



	/*highlight : function(highlight) {
		(this.options.mode == "edit" ? this.input : this.element).toggleClass("an-state-hover", highlight);
	},*/

	destroy : function() {
		//this.element.unbind(".customhtmlfield").remove();
		this.element.removeClass("an-customhtmlfield");
		return $.an.field.prototype.destroy.apply(this, arguments);
	} });
})( jQuery );
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

$.widget( "an.mobilelistview", $.an.view, {
	options: {
		printable: false,
		pagerPosition: "bottom" // bottom, both sides
	},

	_create: function(){
		$.an.view.prototype._create.apply(this, arguments);

		var o = this.options, el = this.element;
		el.addClass("an-mobilelistbview");
		o.templateTemp = o.view.templateTemp;
		o.templateSelector = o.view.templateSelector;
		o.templateConverts = o.view.templateConverts;
		o.templateContent = o.view.templateContent;
		this.documents = $(o.templateContent).prependTo(el);
				
		if (o.templateTemp) {
			o.templateTemp=$.templates(o.templateTemp);
		}
		
		if(o.templateConverts&&typeof o.templateConverts=='string'){
			o.templateConverts=eval("("+o.templateConverts+")");			
			$.views.converters(o.templateConverts);
		}
	},

	_showDocuments:function(){
		var self = this, o = this.options, html = '';
		if (o.templateTemp) {
			html = o.templateTemp.render(self.docs);
			$(o.templateSelector, this.documents).html(html);
		}
		
		if($(o.templateSelector).listview){
			$(o.templateSelector).listview();
		}else if (o.templateTemp) {
			$(o.templateSelector, this.documents).attr('data-role', 'listview').mlist();
		}
		if(o.templateConverts&&typeof o.templateConverts=='string'){
			o.templateConverts=eval("("+o.templateConverts+")");			
			$.views.converters(o.templateConverts);
		}
	},
	
	_docsLoaded:function(){
		this.refresh();
		
	},
	
	_design:function(){
		this._showDocuments();
	},
	
	_browser:function(){
		this._showDocuments();
		if($(this.options.templateSelector).listview){
			$(this.options.templateSelector).listview('refresh');
		}
	},
	
	save:function(){
		var value = {};
		$.extend(this.options.view.options, value);
		return $.an.view.prototype.save.apply(this,arguments);
	},
	
	print: function(){ 
		var o = this.options, loc = window.location, 
		      url = loc.protocol +"//"+loc.host+"/pdfs?dbid="+o.dbId+"&viewid="+o.view._id;
		print(url);
	},
	
	destroy: function() {
		this.element.unbind(".formview").removeClass("an-formview show-pager");
		$.an.view.prototype.destroy.apply(this,arguments);
	}
});
})( jQuery );
(function(a){function r(c,g){function n(C){return a.isArray(k.readonly)?(C=a(".dwwl",x).index(C),k.readonly[C]):k.readonly}function d(C){var d='<div class="dw-bf">',C=ja[C],C=C.values?C:E(C),b=1,c=C.values,j=C.keys||c;a.each(c,function(a,C){0==b%20&&(d+='</div><div class="dw-bf">');d+='<div class="dw-li dw-v" data-val="'+j[a]+'" style="height:'+G+"px;line-height:"+G+'px;"><div class="dw-i">'+C+"</div></div>";b++});return d+="</div>"}function j(C){Y=a(".dw-li",C).index(a(".dw-v",C).eq(0));Z=a(".dw-li",
C).index(a(".dw-v",C).eq(-1));L=a(".dw-ul",x).index(C)}function J(a){var d=k.headerText;return d?"function"===typeof d?d.call(M,a):d.replace(/\{value\}/i,a):""}function A(){m.temp=$&&null!==m.val&&m.val!=H.val()||null===m.values?k.parseValue(H.val()||"",m):m.values.slice(0);fa()}function F(C){var d=window.getComputedStyle?getComputedStyle(C[0]):C[0].style,c;b?(a.each(["t","webkitT","MozT","OT","msT"],function(a,C){if(void 0!==d[C+"ransform"])return c=d[C+"ransform"],!1}),c=c.split(")")[0].split(", "),
C=c[13]||c[5]):C=d.top.replace("px","");return Math.round(ka-C/G)}function e(a,d){clearTimeout(aa[d]);delete aa[d];a.closest(".dwwl").removeClass("dwa")}function p(a,d,c,j,n){var A=(ka-c)*G,g=a[0].style;A==ga[d]&&aa[d]||(j&&A!=ga[d]&&o("onAnimStart",[x,d,j]),ga[d]=A,g[y+"Transition"]="all "+(j?j.toFixed(3):0)+"s ease-out",b?g[y+"Transform"]="translate3d(0,"+A+"px,0)":g.top=A+"px",aa[d]&&e(a,d),j&&void 0!==n&&(a.closest(".dwwl").addClass("dwa"),aa[d]=setTimeout(function(){e(a,d)},1E3*j)),ca[d]=c)}
function t(d,b,c,j,n){!1!==o("validate",[x,b,d])&&(a(".dw-ul",x).each(function(c){var A=a(this),g=a('.dw-li[data-val="'+m.temp[c]+'"]',A),f=a(".dw-li",A),l=f.index(g),F=f.length,J=c==b||void 0===b;if(!g.hasClass("dw-v")){for(var i=g,k=0,h=0;0<=l-k&&!i.hasClass("dw-v");)k++,i=f.eq(l-k);for(;l+h<F&&!g.hasClass("dw-v");)h++,g=f.eq(l+h);(h<k&&h&&2!==j||!k||0>l-k||1==j)&&g.hasClass("dw-v")?l+=h:(g=i,l-=k)}if(!g.hasClass("dw-sel")||J)m.temp[c]=g.attr("data-val"),a(".dw-sel",A).removeClass("dw-sel"),g.addClass("dw-sel"),
p(A,c,l,J?d:0.1,J?n:!1)}),Q=k.formatResult(m.temp),"inline"==k.display?fa(c,0,!0):a(".dwv",x).html(J(Q)),c&&o("onChange",[Q]))}function o(d,c){var b;c.push(m);a.each([ha.defaults,oa,g],function(a,j){j[d]&&(b=j[d].apply(M,c))});return b}function r(d,c,b,j,g){var c=Math.max(Y,Math.min(c,Z)),A=a(".dw-li",d).eq(c),n=void 0===g?c:g,l=L,f=j?c==n?0.1:Math.abs((c-n)*k.timeUnit):0;m.temp[l]=A.attr("data-val");p(d,l,c,f,g);setTimeout(function(){t(f,l,!0,b,g)},10)}function R(a){var d=ca[L]+1;r(a,d>Z?Y:d,1,!0)}
function S(a){var d=ca[L]-1;r(a,d<Y?Z:d,2,!0)}function fa(a,d,c,b){W&&!c&&t(d);Q=k.formatResult(m.temp);b||(m.values=m.temp.slice(0),m.val=Q);a&&$&&H.val(Q).trigger("change")}var ka,G,Q,x,T,O,qa,ba,P,U,va,ha,wa,ia,da,ra,X,xa,V,ea,Y,Z,K,L,sa,ta,m=this,ua=a.mobiscroll,M=c,H=a(M),k=I({},B),oa={},aa={},ca={},ga={},ja=[],$=H.is("input"),W=!1,Ba=function(d){z(d)&&!h&&!n(this)&&!ia&&(d.preventDefault(),h=!0,da="clickpick"!=k.mode,K=a(".dw-ul",this),j(K),ea=(ra=void 0!==aa[L])?F(K):ca[L],X=u(d,"Y"),xa=new Date,
V=X,p(K,L,ea,0.0010),da&&K.closest(".dwwl").addClass("dwa"),a(document).bind(i,ya).bind(w,za))},ya=function(a){da&&(a.preventDefault(),a.stopPropagation(),V=u(a,"Y"),p(K,L,Math.max(Y-1,Math.min(ea+(X-V)/G,Z+1))));ra=!0},za=function(){var d=new Date-xa,c=Math.max(Y-1,Math.min(ea+(X-V)/G,Z+1)),b,j=K.offset().top;300>d?(d=(V-X)/d,b=d*d/k.speedUnit,0>V-X&&(b=-b)):b=V-X;d=Math.round(ea-b/G);if(!b&&!ra){var j=Math.floor((V-j)/G),g=a(".dw-li",K).eq(j);b=da;!1!==o("onValueTap",[g])?d=j:b=!0;b&&(g.addClass("dw-hl"),
setTimeout(function(){g.removeClass("dw-hl")},200))}da&&r(K,d,0,!0,Math.round(c));h=!1;K=null;a(document).unbind(i,ya).unbind(w,za)},Ca=function(d){a(document).bind(w,Aa);a(this).hasClass("dwb-d")||a(this).addClass("dwb-a");if(a(this).hasClass("dwwb")){var c=a(this).closest(".dwwl");if(z(d)&&!n(c)&&!c.hasClass("dwa")){d.stopPropagation();d.preventDefault();ia=!0;var b=c.find(".dw-ul"),g=a(this).hasClass("dwwbp")?R:S;j(b);clearInterval(sa);sa=setInterval(function(){g(b)},k.delay);g(b)}}},Aa=function(){ia&&
(clearInterval(sa),ia=!1);a(document).unbind(w,Aa);a(".dwb-a",x).removeClass("dwb-a")},Da=function(d){if(!n(this)){d.preventDefault();var d=d.originalEvent,d=d.wheelDelta?d.wheelDelta/120:d.detail?-d.detail/3:0,c=a(".dw-ul",this);j(c);r(c,Math.round(ca[L]-d),0>d?1:2)}};m.position=function(d){if(!("inline"==k.display||T===a(window).width()&&qa===a(window).height()&&d||!1===o("onPosition",[x]))){var c,b,j,g,A,n,l,f,J,F=0,h=0,d=a(window).scrollTop();g=a(".dwwr",x);var i=a(".dw",x),m={};A=void 0===k.anchor?
H:k.anchor;T=a(window).width();qa=a(window).height();O=(O=window.innerHeight)||qa;/modal|bubble/.test(k.display)&&(a(".dwc",x).each(function(){c=a(this).outerWidth(!0);F+=c;h=c>h?c:h}),c=F>T?h:F,g.width(c).css("white-space",F>T?"":"nowrap"));ba=i.outerWidth();P=i.outerHeight(!0);"modal"==k.display?(b=(T-ba)/2,j=d+(O-P)/2):"bubble"==k.display?(J=!0,f=a(".dw-arrw-i",x),b=A.offset(),n=b.top,l=b.left,g=A.outerWidth(),A=A.outerHeight(),b=l-(i.outerWidth(!0)-g)/2,b=b>T-ba?T-(ba+20):b,b=0<=b?b:20,j=n-P,
j<d||n>d+O?(i.removeClass("dw-bubble-top").addClass("dw-bubble-bottom"),j=n+A):i.removeClass("dw-bubble-bottom").addClass("dw-bubble-top"),f=f.outerWidth(),g=l+g/2-(b+(ba-f)/2),a(".dw-arr",x).css({left:Math.max(0,Math.min(g,f))})):(m.width="100%","top"==k.display?j=d:"bottom"==k.display&&(j=d+O-P));m.top=0>j?0:j;m.left=b;i.css(m);a(".dw-persp",x).height(0).height(j+P>a(document).height()?j+P:a(document).height());J&&(j+P>d+O||n>d+O)&&a(window).scrollTop(j+P-O)}};m.enable=function(){k.disabled=!1;
$&&H.prop("disabled",!1)};m.disable=function(){k.disabled=!0;$&&H.prop("disabled",!0)};m.setValue=function(d,b,c,j){m.temp=a.isArray(d)?d.slice(0):k.parseValue.call(M,d+"",m);fa(b,c,!1,j)};m.getValue=function(){return m.values};m.getValues=function(){var a=[],d;for(d in m._selectedValues)a.push(m._selectedValues[d]);return a};m.changeWheel=function(b,c){if(x){var j=0,g=b.length;a.each(k.wheels,function(A,n){a.each(n,function(A,n){if(-1<a.inArray(j,b)&&(ja[j]=n,a(".dw-ul",x).eq(j).html(d(j)),g--,!g))return m.position(),
t(c,void 0,!0),!1;j++});if(!g)return!1})}};m.isVisible=function(){return W};m.tap=function(a,d){var b,c;k.tap&&a.bind("touchstart",function(a){a.preventDefault();b=u(a,"X");c=u(a,"Y")}).bind("touchend",function(a){20>Math.abs(u(a,"X")-b)&&20>Math.abs(u(a,"Y")-c)&&d.call(this,a);s=!0;setTimeout(function(){s=!1},300)});a.bind("click",function(a){s||d.call(this,a)})};m.show=function(b){if(k.disabled||W)return!1;"top"==k.display&&(U="slidedown");"bottom"==k.display&&(U="slideup");A();o("onBeforeShow",
[]);var c=0,j="";U&&!b&&(j="dw-"+U+" dw-in");var g='<div class="'+k.theme+" dw-"+k.display+(v?" dw"+v:"")+'">'+("inline"==k.display?'<div class="dw dwbg dwi"><div class="dwwr">':'<div class="dw-persp"><div class="dwo"></div><div class="dw dwbg '+j+'"><div class="dw-arrw"><div class="dw-arrw-i"><div class="dw-arr"></div></div></div><div class="dwwr">'+(k.headerText?'<div class="dwv"></div>':""))+'<div class="dwcc">';a.each(k.wheels,function(b,j){g+='<div class="dwc'+("scroller"!=k.mode?" dwpm":" dwsc")+
(k.showLabel?"":" dwhl")+'"><div class="dwwc dwrc"><table cellpadding="0" cellspacing="0"><tr>';a.each(j,function(a,b){ja[c]=b;g+='<td><div class="dwwl dwrc dwwl'+c+'">'+("scroller"!=k.mode?'<div class="dwb-e dwwb dwwbp" style="height:'+G+"px;line-height:"+G+'px;"><span>+</span></div><div class="dwb-e dwwb dwwbm" style="height:'+G+"px;line-height:"+G+'px;"><span>&ndash;</span></div>':"")+'<div class="dwl">'+(b.label||a)+'</div><div class="dwww"><div class="dww" style="height:'+k.rows*G+"px;min-width:"+
k.width+'px;"><div class="dw-ul">';g+=d(c);g+='</div><div class="dwwol"></div></div><div class="dwwo"></div></div><div class="dwwol"></div></div></td>';c++});g+="</tr></table></div></div>"});g+="</div>"+("inline"!=k.display?'<div class="dwbc'+(k.button3?" dwbc-p":"")+'"><span class="dwbw dwb-s"><span class="dwb dwb-e">'+k.setText+"</span></span>"+(k.button3?'<span class="dwbw dwb-n"><span class="dwb dwb-e">'+k.button3Text+"</span></span>":"")+'<span class="dwbw dwb-c"><span class="dwb dwb-e">'+k.cancelText+
"</span></span></div></div>":"")+"</div></div></div>";x=a(g);t();o("onMarkupReady",[x]);"inline"!=k.display?(x.appendTo("body"),U&&!b&&(x.addClass("dw-trans"),setTimeout(function(){x.removeClass("dw-trans").find(".dw").removeClass(j)},350))):H.is("div")?H.html(x):x.insertAfter(H);o("onMarkupInserted",[x]);W=!0;ha.init(x,m);"inline"!=k.display&&(m.tap(a(".dwb-s span",x),function(){if(m.hide(false,"set")!==false){fa(true,0,true);o("onSelect",[m.val])}}),m.tap(a(".dwb-c span",x),function(){m.cancel()}),
k.button3&&m.tap(a(".dwb-n span",x),k.button3),k.scrollLock&&x.bind("touchmove",function(a){P<=O&&ba<=T&&a.preventDefault()}),a("input,select,button").each(function(){this.disabled||a(this).addClass("dwtd").prop("disabled",true).data("autocomplete",a(this).attr("autocomplete")).attr("autocomplete","off")}),m.position(),a(window).bind("orientationchange.dw resize.dw",function(){clearTimeout(va);va=setTimeout(function(){m.position(true)},100)}));x.delegate(".dwwl","DOMMouseScroll mousewheel",Da).delegate(".dwb-e",
D,Ca).delegate(".dwwl",D,Ba);o("onShow",[x,Q])};m.hide=function(d,b){if(!W||!1===o("onClose",[Q,b]))return!1;a(".dwtd").each(function(){a(this).prop("disabled",!1).removeClass("dwtd");a(this).data("autocomplete")?a(this).attr("autocomplete",a(this).data("autocomplete")):a(this).removeAttr("autocomplete")});H.blur();x&&("inline"!=k.display&&U&&!d?(x.addClass("dw-trans").find(".dw").addClass("dw-"+U+" dw-out"),setTimeout(function(){x.remove();x=null},350)):(x.remove(),x=null),W=!1,ga={},a(window).unbind(".dw"))};
m.cancel=function(){!1!==m.hide(!1,"cancel")&&o("onCancel",[m.val])};m.init=function(a){ha=I({defaults:{},init:f},ua.themes[a.theme||k.theme]);wa=ua.i18n[a.lang||k.lang];I(g,a);I(k,ha.defaults,wa,g);m.settings=k;H.unbind(".dw");if(a=ua.presets[k.preset])oa=a.call(M,m),I(k,oa,g);ka=Math.floor(k.rows/2);G=k.height;U=k.animate;W&&m.hide();"inline"==k.display?m.show():(A(),$&&k.showOnFocus&&(void 0===ta&&(ta=M.readOnly),M.readOnly=!0,H.bind("focus.dw",function(){m.show()})))};m.trigger=function(a,d){return o(a,
d)};m.option=function(a,d){var b={};"object"===typeof a?b=a:b[a]=d;m.init(b)};m.destroy=function(){m.hide();H.unbind(".dw");delete q[M.id];$&&(M.readOnly=ta)};m.getInst=function(){return m};m.values=null;m.val=null;m.temp=null;m._selectedValues={};m.init(g)}function e(a){for(var b in a)if(void 0!==o[a[b]])return!0;return!1}function z(a){if("touchstart"===a.type)p=!0;else if(p)return p=!1;return!0}function u(a,b){var c=a.originalEvent,d=a.changedTouches;return d||c&&c.changedTouches?c?c.changedTouches[0]["page"+
b]:d[0]["page"+b]:a["page"+b]}function E(b){var c={values:[],keys:[]};a.each(b,function(a,d){c.keys.push(a);c.values.push(d)});return c}function c(a,b,c){var d=a;if("object"===typeof b)return a.each(function(){this.id||(t+=1,this.id="mobiscroll"+t);q[this.id]=new r(this,b)});"string"===typeof b&&a.each(function(){var a;if((a=q[this.id])&&a[b])if(a=a[b].apply(this,Array.prototype.slice.call(c,1)),void 0!==a)return d=a,!1});return d}var h,s,p,t=(new Date).getTime(),q={},f=function(){},o=document.createElement("modernizr").style,
b=e(["perspectiveProperty","WebkitPerspective","MozPerspective","OPerspective","msPerspective"]),v=function(){var a=["Webkit","Moz","O","ms"],b;for(b in a)if(e([a[b]+"Transform"]))return"-"+a[b].toLowerCase();return""}(),y=v.replace(/^\-/,"").replace("moz","Moz"),I=a.extend,D="touchstart mousedown",i="touchmove mousemove",w="touchend mouseup",B={width:70,height:40,rows:3,delay:300,disabled:!1,readonly:!1,showOnFocus:!0,showLabel:!0,wheels:[],theme:"",headerText:"{value}",display:"modal",mode:"scroller",
preset:"",lang:"en-US",setText:"Set",cancelText:"Cancel",scrollLock:!0,tap:!0,speedUnit:0.0012,timeUnit:0.1,formatResult:function(a){return a.join(" ")},parseValue:function(b,c){var n=b.split(" "),d=[],j=0,f;a.each(c.settings.wheels,function(b,c){a.each(c,function(b,c){c=c.values?c:E(c);f=c.keys||c.values;-1!==a.inArray(n[j],f)?d.push(n[j]):d.push(f[0]);j++})});return d}};a(document).bind("mouseover mouseup mousedown click",function(a){if(s)return a.stopPropagation(),a.preventDefault(),!1});a.fn.mobiscroll=
function(b){I(this,a.mobiscroll.shorts);return c(this,b,arguments)};a.mobiscroll=a.mobiscroll||{setDefaults:function(a){I(B,a)},presetShort:function(a){this.shorts[a]=function(b){return c(this,I(b,{preset:a}),arguments)}},shorts:{},presets:{},themes:{},i18n:{}};a.scroller=a.scroller||a.mobiscroll;a.fn.scroller=a.fn.scroller||a.fn.mobiscroll})(jQuery);(function(a){a.mobiscroll.i18n.hu=a.extend(a.mobiscroll.i18n.hu,{setText:"OK",cancelText:"M\u00e9gse",dateFormat:"dd.mm.yy",dateOrder:"ddmmyy",dayNames:"Vas\u00e1rnap,H\u00e9tf\u0151,Kedd,Szerda,Cs\u00fct\u00f6rt\u00f6k,P\u00e9ntek,Szombat".split(","),dayNamesShort:"Va,H\u00e9,Ke,Sze,Cs\u00fc,P\u00e9,Szo".split(","),dayText:"Nap",hourText:"\u00d3ra",minuteText:"Perc",monthNames:"Janu\u00e1r,Febru\u00e1r,M\u00e1rcius,\u00c1prilis,M\u00e1jus,J\u00fanius,J\u00falius,Augusztus,Szeptember,Okt\u00f3ber,November,December".split(","),
monthNamesShort:"Jan,Feb,M\u00e1r,\u00c1pr,M\u00e1j,J\u00fan,J\u00fal,Aug,Szep,Okt,Nov,Dec".split(","),monthText:"H\u00f3nap",secText:"M\u00e1sodperc",timeFormat:"HH:ii",timeWheels:"HHii",yearText:"\u00c9v",nowText:"Most",dateText:"D\u00e1tum",timeText:"Id\u0151",calendarText:"Napt\u00e1r",wholeText:"Eg\u00e9sz",fractionText:"T\u00f6rt",unitText:"Egys\u00e9g",labels:"\u00c9v,H\u00f3nap,Nap,\u00d3ra,Perc,M\u00e1sodperc,".split(","),labelsShort:"\u00c9v,H\u00f3.,Nap,\u00d3ra,Perc,Mp.,".split(","),startText:"Ind\u00edt",
stopText:"Meg\u00e1ll\u00edt",resetText:"Vissza\u00e1ll\u00edt",lapText:"Lap",hideText:"Elrejt"})})(jQuery);(function(a){a.mobiscroll.i18n.de=a.extend(a.mobiscroll.i18n.de,{setText:"OK",cancelText:"Abbrechen",dateFormat:"dd.mm.yy",dateOrder:"ddmmyy",dayNames:"Sonntag,Montag,Dienstag,Mittwoch,Donnerstag,Freitag,Samstag".split(","),dayNamesShort:"So,Mo,Di,Mi,Do,Fr,Sa".split(","),dayText:"Tag",hourText:"Stunde",minuteText:"Minuten",monthNames:"Januar,Februar,M\u00e4rz,April,Mai,Juni,Juli,August,September,Oktober,November,Dezember".split(","),monthNamesShort:"Jan,Feb,M\u00e4r,Apr,Mai,Jun,Jul,Aug,Sep,Okt,Nov,Dez".split(","),
monthText:"Monat",secText:"Sekunden",timeFormat:"HH:ii",timeWheels:"HHii",yearText:"Jahr",nowText:"Jetzt",dateText:"Datum",timeText:"Zeit",calendarText:"Kalender",wholeText:"Ganze Zahl",fractionText:"Bruchzahl",unitText:"Ma\u00dfeinheit",labels:"Jahre,Monate,Tage,Stunden,Minuten,Sekunden,".split(","),labelsShort:"Yrs,Mths,Days,Hrs,Mins,Secs,".split(","),startText:"Start",stopText:"Stop",resetText:"Reset",lapText:"Lap",hideText:"Hide"})})(jQuery);(function(a){a.mobiscroll.i18n.es=a.extend(a.mobiscroll.i18n.es,{setText:"Aceptar",cancelText:"Cancelar",dateFormat:"dd/mm/yy",dateOrder:"ddmmyy",dayNames:"Domingo,Lunes,Martes,Mi&#xE9;rcoles,Jueves,Viernes,S&#xE1;bado".split(","),dayNamesShort:"Do,Lu,Ma,Mi,Ju,Vi,S&#xE1;".split(","),dayText:"D&#237;a",hourText:"Horas",minuteText:"Minutos",monthNames:"Enero,Febrero,Marzo,Abril,Mayo,Junio,Julio,Agosto,Septiembre,Octubre,Noviembre,Diciembre".split(","),monthNamesShort:"Ene,Feb,Mar,Abr,May,Jun,Jul,Ago,Sep,Oct,Nov,Dic".split(","),
monthText:"Mes",secText:"Segundos",timeFormat:"HH:ii",timeWheels:"HHii",yearText:"A&ntilde;o",nowText:"Ahora",dateText:"Fecha",timeText:"Tiempo",calendarText:"Calendario",wholeText:"Entero",fractionText:"Fracci\u00f3n",unitText:"Unidad",labels:"A\u00f1os,Meses,D\u00edas,Horas,Minutos,Segundos,".split(","),labelsShort:"Yrs,Mths,Days,Hrs,Mins,Secs,".split(","),startText:"Iniciar",stopText:"Det\u00e9ngase",resetText:"Reinicializar",lapText:"Lap",hideText:"Esconder"})})(jQuery);(function(a){a.mobiscroll.i18n.fr=a.extend(a.mobiscroll.i18n.fr,{setText:"Termin\u00e9",cancelText:"Annuler",dateFormat:"dd/mm/yy",dateOrder:"ddmmyy",dayNames:"&#68;imanche,Lundi,Mardi,Mercredi,Jeudi,Vendredi,Samedi".split(","),dayNamesShort:"&#68;im.,Lun.,Mar.,Mer.,Jeu.,Ven.,Sam.".split(","),dayText:"Jour",monthText:"Mois",monthNames:"Janvier,F\u00e9vrier,Mars,Avril,Mai,Juin,Juillet,Ao\u00fbt,Septembre,Octobre,Novembre,D\u00e9cembre".split(","),monthNamesShort:"Janv.,F\u00e9vr.,Mars,Avril,Mai,Juin,Juil.,Ao\u00fbt,Sept.,Oct.,Nov.,D\u00e9c.".split(","),
hourText:"Heures",minuteText:"Minutes",secText:"Secondes",timeFormat:"HH:ii",timeWheels:"HHii",yearText:"Ann\u00e9e",nowText:"Maintenant",dateText:"Date",timeText:"Heure",calendarText:"Calendrier",wholeText:"Entier",fractionText:"Fraction",unitText:"Unit\u00e9",labels:"Ans,Mois,Jours,Heures,Minutes,Secondes,".split(","),labelsShort:"Yrs,Mths,Days,Hrs,Mins,Secs,".split(","),startText:"Ind\u00edt",stopText:"Meg\u00e1ll\u00edt",resetText:"Vissza\u00e1ll\u00edt",lapText:"Lap",hideText:"Elrejt"})})(jQuery);(function(a){a.mobiscroll.i18n.it=a.extend(a.mobiscroll.i18n.it,{setText:"OK",cancelText:"Annulla",dateFormat:"dd-mm-yyyy",dateOrder:"ddmmyy",dayNames:"Domenica,Luned&Igrave;,Merted&Igrave;,Mercoled&Igrave;,Gioved&Igrave;,Venerd&Igrave;,Sabato".split(","),dayNamesShort:"Do,Lu,Ma,Me,Gi,Ve,Sa".split(","),dayText:"Giorno",hourText:"Ore",minuteText:"Minuti",monthNames:"Gennaio,Febbraio,Marzo,Aprile,Maggio,Giugno,Luglio,Agosto,Settembre,Ottobre,Novembre,Dicembre".split(","),monthNamesShort:"Gen,Feb,Mar,Apr,Mag,Giu,Lug,Ago,Set,Ott,Nov,Dic".split(","),
monthText:"Mese",secText:"Secondi",timeFormat:"HH:ii",timeWheels:"HHii",yearText:"Anno",dateText:"Data",timeText:"Volta",calendarText:"Calendario",wholeText:"Intero",fractionText:"Frazione",unitText:"Unit\u00e0",labels:"Anni,Mesi,Giorni,Ore,Minuti,Secondi,".split(","),labelsShort:"Yrs,Mths,Days,Hrs,Mins,Secs,".split(","),startText:"Inizio",stopText:"Arresto",resetText:"Ripristina",lapText:"Lap",hideText:"Nascondi"})})(jQuery);(function(a){a.mobiscroll.i18n.no=a.extend(a.mobiscroll.i18n.no,{setText:"OK",cancelText:"Avbryt",dateFormat:"dd.mm.yy",dateOrder:"ddmmyy",dayNames:"S\u00f8ndag,Mandag,Tirsdag,Onsdag,Torsdag,Fredag,L\u00f8rdag".split(","),dayNamesShort:"S\u00f8,Ma,Ti,On,To,Fr,L\u00f8".split(","),dayText:"Dag",hourText:"Time",minuteText:"Minutt",monthNames:"Januar,Februar,Mars,April,Mai,Juni,Juli,August,September,Oktober,November,Desember".split(","),monthNamesShort:"Jan,Feb,Mar,Apr,Mai,Jun,Jul,Aug,Sep,Okt,Nov,Des".split(","),
monthText:"M\u00e5ned",secText:"Sekund",timeFormat:"HH:ii",timeWheels:"HHii",yearText:"\u00c5r",nowText:"N\u00e5",dateText:"Dato",timeText:"Tid",calendarText:"Kalender",wholeText:"Hele",fractionText:"Fraksjon",unitText:"Enhet",labels:"\u00c5r,M\u00e5neder,Dager,Timer,Minutter,Sekunder,".split(","),labelsShort:"Yrs,Mths,Days,Hrs,Mins,Secs,".split(","),startText:"Start",stopText:"Stopp",resetText:"Tilbakestille",lapText:"Runde",hideText:"Skjul"})})(jQuery);(function(a){a.mobiscroll.i18n["pt-BR"]=a.extend(a.mobiscroll.i18n["pt-BR"],{setText:"Selecionar",cancelText:"Cancelar",dateFormat:"dd/mm/yy",dateOrder:"ddMMyy",dayNames:"Domingo,Segunda-feira,Ter\u00e7a-feira,Quarta-feira,Quinta-feira,Sexta-feira,S\u00e1bado".split(","),dayNamesShort:"Dom,Seg,Ter,Qua,Qui,Sex,S\u00e1b".split(","),dayText:"Dia",hourText:"Hora",minuteText:"Minutos",monthNames:"Janeiro,Fevereiro,Mar\u00e7o,Abril,Maio,Junho,Julho,Agosto,Setembro,Outubro,Novembro,Dezembro".split(","),
monthNamesShort:"Jan,Fev,Mar,Abr,Mai,Jun,Jul,Ago,Set,Out,Nov,Dez".split(","),monthText:"M\u00eas",secText:"Segundo",timeFormat:"HH:ii",timeWheels:"HHii",yearText:"Ano",dateText:"Data",timeText:"Tempo",calendarText:"Calend\u00e1rio",wholeText:"Inteiro",fractionText:"Fra\u00e7\u00e3o",unitText:"Unidade",labels:"Anos,Meses,Dias,Horas,Minutos,Segundos,".split(","),labelsShort:"Yrs,Mths,Days,Hrs,Mins,Secs,".split(","),startText:"Come\u00e7ar",stopText:"Pare",resetText:"Reinicializar",lapText:"Lap",hideText:"Esconder"})})(jQuery);(function(a){a.mobiscroll.i18n.zh=a.extend(a.mobiscroll.i18n.zh,{setText:"\u786e\u5b9a",cancelText:"\u53d6\u6d88",dateFormat:"dd/mm/yy",dateOrder:"ddmmyy",dayNames:"\u5468\u65e5,\u5468\u4e00,\u5468\u4e8c,\u5468\u4e09,\u5468\u56db,\u5468\u4e94,\u5468\u516d".split(","),dayNamesShort:"\u65e5,\u4e00,\u4e8c,\u4e09,\u56db,\u4e94,\u516d".split(","),dayText:"\u65e5",hourText:"\u65f6",minuteText:"\u5206",monthNames:"1\u6708,2\u6708,3\u6708,4\u6708,5\u6708,6\u6708,7\u6708,8\u6708,9\u6708,10\u6708,11\u6708,12\u6708".split(","),
monthNamesShort:"\u4e00,\u4e8c,\u4e09,\u56db,\u4e94,\u516d,\u4e03,\u516b,\u4e5d,\u5341,\u5341\u4e00,\u5341\u4e8c".split(","),monthText:"\u6708",secText:"\u79d2",timeFormat:"HH:ii",timeWheels:"HHii",yearText:"\u5e74",nowText:"\u5f53\u524d",dateText:"\u65e5",timeText:"\u65f6\u95f4",calendarText:"\u65e5\u5386",wholeText:"Whole",fractionText:"Fraction",unitText:"Unit",labels:"Years,Months,Days,Hours,Minutes,Seconds,".split(","),labelsShort:"Yrs,Mths,Days,Hrs,Mins,Secs,".split(","),startText:"Start",stopText:"Stop",
resetText:"Reset",lapText:"Lap",hideText:"Hide"})})(jQuery);(function(a){a.mobiscroll.i18n.nl=a.extend(a.mobiscroll.i18n.nl,{setText:"Instellen",cancelText:"Annuleer",dateFormat:"dd/mm/yy",dateOrder:"ddmmyy",dayNames:"Zondag,Maandag,Dinsdag,Woensdag,Donderdag,Vrijdag,Zaterdag".split(","),dayNamesShort:"Zo,Ma,Di,Wo,Do,Vr,Za".split(","),dayText:"Dag",hourText:"Uur",minuteText:"Minuten",monthNames:"Januari,Februari,Maart,April,Mei,Juni,Juli,Augustus,September,Oktober,November,December".split(","),monthNamesShort:"Jan,Feb,Mrt,Apr,Mei,Jun,Jul,Aug,Sep,Okt,Nov,Dec".split(","),
monthText:"Maand",secText:"Seconden",timeFormat:"hh:ii A",timeWheels:"hhiiA",yearText:"Jaar",nowText:"Nu",dateText:"Datum",timeText:"Tijd",calendarText:"Kalender",wholeText:"geheel",fractionText:"fractie",unitText:"eenheid",labels:"Jaren,Maanden,Dagen,Uren,Minuten,Seconden,".split(","),labelsShort:"j,m,d,u,min,sec,".split(","),startText:"Start",stopText:"Stop",resetText:"Reset",lapText:"Lap",hideText:"Verbergen"})})(jQuery);(function(a){var r=a.mobiscroll,e=new Date,z={dateFormat:"mm/dd/yy",dateOrder:"mmddy",timeWheels:"hhiiA",timeFormat:"hh:ii A",startYear:e.getFullYear()-100,endYear:e.getFullYear()+1,monthNames:"January,February,March,April,May,June,July,August,September,October,November,December".split(","),monthNamesShort:"Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec".split(","),dayNames:"Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday".split(","),dayNamesShort:"Sun,Mon,Tue,Wed,Thu,Fri,Sat".split(","),
shortYearCutoff:"+10",monthText:"Month",dayText:"Day",yearText:"Year",hourText:"Hours",minuteText:"Minutes",secText:"Seconds",ampmText:"&nbsp;",nowText:"Now",showNow:!1,stepHour:1,stepMinute:1,stepSecond:1,separator:" "},u=function(e){function c(a,d,b){return void 0!==l[d]?+a[l[d]]:void 0!==b?b:la[g[d]]?la[g[d]]():g[d](la)}function h(a,d,b,c){a.push({values:b,keys:d,label:c})}function s(a,d){return Math.floor(a/d)*d}function p(a){var d=c(a,"h",0);return new Date(c(a,"y"),c(a,"m"),c(a,"d",1),c(a,"a")?
d+12:d,c(a,"i",0),c(a,"s",0))}var t=a(this),q={},f;if(t.is("input")){switch(t.attr("type")){case "date":f="yy-mm-dd";break;case "datetime":f="yy-mm-ddTHH:ii:ssZ";break;case "datetime-local":f="yy-mm-ddTHH:ii:ss";break;case "month":f="yy-mm";q.dateOrder="mmyy";break;case "time":f="HH:ii:ss"}var o=t.attr("min"),t=t.attr("max");o&&(q.minDate=r.parseDate(f,o));t&&(q.maxDate=r.parseDate(f,t))}var b,v,y,u,D,o=a.extend({},e.settings),i=a.extend(e.settings,z,q,o),w=0,t=[],B=[],l={},g={y:"getFullYear",m:"getMonth",
d:"getDate",h:function(a){a=a.getHours();a=F&&12<=a?a-12:a;return s(a,na)},i:function(a){return s(a.getMinutes(),ma)},s:function(a){return s(a.getSeconds(),pa)},a:function(a){return A&&11<a.getHours()?1:0}},n=i.preset,d=i.dateOrder,j=i.timeWheels,J=d.match(/D/),A=j.match(/a/i),F=j.match(/h/),N="datetime"==n?i.dateFormat+i.separator+i.timeFormat:"time"==n?i.timeFormat:i.dateFormat,la=new Date,na=i.stepHour,ma=i.stepMinute,pa=i.stepSecond,R=i.minDate||new Date(i.startYear,0,1),S=i.maxDate||new Date(i.endYear,
11,31,23,59,59);f=f||N;if(n.match(/date/i)){a.each(["y","m","d"],function(a,c){b=d.search(RegExp(c,"i"));-1<b&&B.push({o:b,v:c})});B.sort(function(a,d){return a.o>d.o?1:-1});a.each(B,function(a,d){l[d.v]=a});o=[];for(q=0;3>q;q++)if(q==l.y){w++;y=[];v=[];u=R.getFullYear();D=S.getFullYear();for(b=u;b<=D;b++)v.push(b),y.push(d.match(/yy/i)?b:(b+"").substr(2,2));h(o,v,y,i.yearText)}else if(q==l.m){w++;y=[];v=[];for(b=0;12>b;b++)u=d.replace(/[dy]/gi,"").replace(/mm/,9>b?"0"+(b+1):b+1).replace(/m/,b+1),
v.push(b),y.push(u.match(/MM/)?u.replace(/MM/,'<span class="dw-mon">'+i.monthNames[b]+"</span>"):u.replace(/M/,'<span class="dw-mon">'+i.monthNamesShort[b]+"</span>"));h(o,v,y,i.monthText)}else if(q==l.d){w++;y=[];v=[];for(b=1;32>b;b++)v.push(b),y.push(d.match(/dd/i)&&10>b?"0"+b:b);h(o,v,y,i.dayText)}t.push(o)}if(n.match(/time/i)){B=[];a.each(["h","i","s","a"],function(a,d){a=j.search(RegExp(d,"i"));-1<a&&B.push({o:a,v:d})});B.sort(function(a,d){return a.o>d.o?1:-1});a.each(B,function(a,d){l[d.v]=
w+a});o=[];for(q=w;q<w+4;q++)if(q==l.h){w++;y=[];v=[];for(b=0;b<(F?12:24);b+=na)v.push(b),y.push(F&&0==b?12:j.match(/hh/i)&&10>b?"0"+b:b);h(o,v,y,i.hourText)}else if(q==l.i){w++;y=[];v=[];for(b=0;60>b;b+=ma)v.push(b),y.push(j.match(/ii/)&&10>b?"0"+b:b);h(o,v,y,i.minuteText)}else if(q==l.s){w++;y=[];v=[];for(b=0;60>b;b+=pa)v.push(b),y.push(j.match(/ss/)&&10>b?"0"+b:b);h(o,v,y,i.secText)}else q==l.a&&(w++,v=j.match(/A/),h(o,[0,1],v?["AM","PM"]:["am","pm"],i.ampmText));t.push(o)}e.setDate=function(a,
d,b,c){for(var j in l)e.temp[l[j]]=a[g[j]]?a[g[j]]():g[j](a);e.setValue(e.temp,d,b,c)};e.getDate=function(a){return p(a?e.temp:e.values)};return{button3Text:i.showNow?i.nowText:void 0,button3:i.showNow?function(){e.setDate(new Date,!1,0.3,!0)}:void 0,wheels:t,headerText:function(){return r.formatDate(N,p(e.temp),i)},formatResult:function(a){return r.formatDate(f,p(a),i)},parseValue:function(a){var d=new Date,b,c=[];try{d=r.parseDate(f,a,i)}catch(j){}for(b in l)c[l[b]]=d[g[b]]?d[g[b]]():g[b](d);return c},
validate:function(b){var j=e.temp,A={y:R.getFullYear(),m:0,d:1,h:0,i:0,s:0,a:0},f={y:S.getFullYear(),m:11,d:31,h:s(F?11:23,na),i:s(59,ma),s:s(59,pa),a:1},n=!0,h=!0;a.each("y,m,d,a,h,i,s".split(","),function(F,e){if(l[e]!==void 0){var p=A[e],q=f[e],o=31,y=c(j,e),v=a(".dw-ul",b).eq(l[e]),s,t;if(e=="d"){s=c(j,"y");t=c(j,"m");q=o=32-(new Date(s,t,32)).getDate();J&&a(".dw-li",v).each(function(){var b=a(this),c=b.data("val"),j=(new Date(s,t,c)).getDay(),c=d.replace(/[my]/gi,"").replace(/dd/,c<10?"0"+c:
c).replace(/d/,c);a(".dw-i",b).html(c.match(/DD/)?c.replace(/DD/,'<span class="dw-day">'+i.dayNames[j]+"</span>"):c.replace(/D/,'<span class="dw-day">'+i.dayNamesShort[j]+"</span>"))})}n&&R&&(p=R[g[e]]?R[g[e]]():g[e](R));h&&S&&(q=S[g[e]]?S[g[e]]():g[e](S));if(e!="y"){var u=a(".dw-li",v).index(a('.dw-li[data-val="'+p+'"]',v)),r=a(".dw-li",v).index(a('.dw-li[data-val="'+q+'"]',v));a(".dw-li",v).removeClass("dw-v").slice(u,r+1).addClass("dw-v");e=="d"&&a(".dw-li",v).removeClass("dw-h").slice(o).addClass("dw-h")}y<
p&&(y=p);y>q&&(y=q);n&&(n=y==p);h&&(h=y==q);if(i.invalid&&e=="d"){var w=[];i.invalid.dates&&a.each(i.invalid.dates,function(a,d){d.getFullYear()==s&&d.getMonth()==t&&w.push(d.getDate()-1)});if(i.invalid.daysOfWeek){var E=(new Date(s,t,1)).getDay(),N;a.each(i.invalid.daysOfWeek,function(a,d){for(N=d-E;N<o;N=N+7)N>=0&&w.push(N)})}i.invalid.daysOfMonth&&a.each(i.invalid.daysOfMonth,function(a,d){d=(d+"").split("/");d[1]?d[0]-1==t&&w.push(d[1]-1):w.push(d[0]-1)});a.each(w,function(d,b){a(".dw-li",v).eq(b).removeClass("dw-v")})}j[l[e]]=
y}})}}};a.each(["date","time","datetime"],function(a,c){r.presets[c]=u;r.presetShort(c)});r.formatDate=function(e,c,h){if(!c)return null;var h=a.extend({},z,h),s=function(a){for(var b=0;q+1<e.length&&e.charAt(q+1)==a;)b++,q++;return b},p=function(a,b,c){b=""+b;if(s(a))for(;b.length<c;)b="0"+b;return b},t=function(a,b,c,e){return s(a)?e[b]:c[b]},q,f="",o=!1;for(q=0;q<e.length;q++)if(o)"'"==e.charAt(q)&&!s("'")?o=!1:f+=e.charAt(q);else switch(e.charAt(q)){case "d":f+=p("d",c.getDate(),2);break;case "D":f+=
t("D",c.getDay(),h.dayNamesShort,h.dayNames);break;case "o":f+=p("o",(c.getTime()-(new Date(c.getFullYear(),0,0)).getTime())/864E5,3);break;case "m":f+=p("m",c.getMonth()+1,2);break;case "M":f+=t("M",c.getMonth(),h.monthNamesShort,h.monthNames);break;case "y":f+=s("y")?c.getFullYear():(10>c.getYear()%100?"0":"")+c.getYear()%100;break;case "h":var b=c.getHours(),f=f+p("h",12<b?b-12:0==b?12:b,2);break;case "H":f+=p("H",c.getHours(),2);break;case "i":f+=p("i",c.getMinutes(),2);break;case "s":f+=p("s",
c.getSeconds(),2);break;case "a":f+=11<c.getHours()?"pm":"am";break;case "A":f+=11<c.getHours()?"PM":"AM";break;case "'":s("'")?f+="'":o=!0;break;default:f+=e.charAt(q)}return f};r.parseDate=function(e,c,h){var s=new Date;if(!e||!c)return s;var c="object"==typeof c?c.toString():c+"",p=a.extend({},z,h),t=p.shortYearCutoff,h=s.getFullYear(),q=s.getMonth()+1,f=s.getDate(),o=-1,b=s.getHours(),s=s.getMinutes(),v=0,u=-1,r=!1,D=function(a){(a=l+1<e.length&&e.charAt(l+1)==a)&&l++;return a},i=function(a){D(a);
a=c.substr(B).match(RegExp("^\\d{1,"+("@"==a?14:"!"==a?20:"y"==a?4:"o"==a?3:2)+"}"));if(!a)return 0;B+=a[0].length;return parseInt(a[0],10)},w=function(a,b,d){a=D(a)?d:b;for(b=0;b<a.length;b++)if(c.substr(B,a[b].length).toLowerCase()==a[b].toLowerCase())return B+=a[b].length,b+1;return 0},B=0,l;for(l=0;l<e.length;l++)if(r)"'"==e.charAt(l)&&!D("'")?r=!1:B++;else switch(e.charAt(l)){case "d":f=i("d");break;case "D":w("D",p.dayNamesShort,p.dayNames);break;case "o":o=i("o");break;case "m":q=i("m");break;
case "M":q=w("M",p.monthNamesShort,p.monthNames);break;case "y":h=i("y");break;case "H":b=i("H");break;case "h":b=i("h");break;case "i":s=i("i");break;case "s":v=i("s");break;case "a":u=w("a",["am","pm"],["am","pm"])-1;break;case "A":u=w("A",["am","pm"],["am","pm"])-1;break;case "'":D("'")?B++:r=!0;break;default:B++}100>h&&(h+=(new Date).getFullYear()-(new Date).getFullYear()%100+(h<=("string"!=typeof t?t:(new Date).getFullYear()%100+parseInt(t,10))?0:-100));if(-1<o){q=1;f=o;do{p=32-(new Date(h,q-
1,32)).getDate();if(f<=p)break;q++;f-=p}while(1)}b=new Date(h,q-1,f,-1==u?b:u&&12>b?b+12:!u&&12==b?0:b,s,v);if(b.getFullYear()!=h||b.getMonth()+1!=q||b.getDate()!=f)throw"Invalid date";return b}})(jQuery);(function(a){var r=a.mobiscroll,e={invalid:[],showInput:!0,inputClass:""},z=function(u){function r(d,b,e,A){for(var f=0;f<b;){var n=a(".dwwl"+f,d),g=c(A,f,e);a.each(g,function(d,b){a('.dw-li[data-val="'+b+'"]',n).removeClass("dw-v")});f++}}function c(a,b,c){for(var e=0,f,n=[];e<b;){var g=a[e];for(f in c)if(c[f].key==g){c=c[f].children;break}e++}for(e=0;e<c.length;)c[e].invalid&&n.push(c[e].key),e++;return n}function h(a,b){for(var c=[];a;)c[--a]=!0;c[b]=!1;return c}function s(a,b,c){var e=0,f,n,g=
[],h=B;if(b)for(f=0;f<b;f++)g[f]=[{}];for(;e<a.length;){f=g;for(var b=e,i=h,q={keys:[],values:[],label:l[e]},o=0;o<i.length;)q.values.push(i[o].value),q.keys.push(i[o].key),o++;f[b]=[q];f=0;for(b=void 0;f<h.length&&void 0===b;){if(h[f].key==a[e]&&(void 0!==c&&e<=c||void 0===c))b=f;f++}if(void 0!==b&&h[b].children)e++,h=h[b].children;else if((n=p(h))&&n.children)e++,h=n.children;else break}return g}function p(a,b){if(!a)return!1;for(var c=0,e;c<a.length;)if(!(e=a[c++]).invalid)return b?c-1:e;return!1}
function t(b,c){a(".dwc",b).css("display","").slice(c).hide()}function q(a,b){var c=[],e=B,f=0,n=!1,g,h;if(void 0!==a[f]&&f<=b){n=0;g=a[f];for(h=void 0;n<e.length&&void 0===h;)e[n].key==a[f]&&!e[n].invalid&&(h=n),n++}else h=p(e,!0),g=e[h].key;n=void 0!==h?e[h].children:!1;for(c[f]=g;n;){e=e[h].children;f++;if(void 0!==a[f]&&f<=b){n=0;g=a[f];for(h=void 0;n<e.length&&void 0===h;)e[n].key==a[f]&&!e[n].invalid&&(h=n),n++}else h=p(e,!0),h=!1===h?void 0:h,g=e[h].key;n=void 0!==h&&p(e[h].children)?e[h].children:
!1;c[f]=g}return{lvl:f+1,nVector:c}}function f(b){var c=[];D=D>i++?D:i;b.children("li").each(function(b){var d=a(this),e=d.clone();e.children("ul,ol").remove();var e=e.html().replace(/^\s\s*/,"").replace(/\s\s*$/,""),n=d.data("invalid")?!0:!1,b={key:d.data("val")||b,value:e,invalid:n,children:null},d=d.children("ul,ol");d.length&&(b.children=f(d));c.push(b)});i--;return c}var o=a.extend({},u.settings),b=a.extend(u.settings,e,o),o=a(this),v,y,z=this.id+"_dummy",D=0,i=0,w={},B=b.wheelArray||f(o),l=
function(a){var c=[],e;for(e=0;e<a;e++)c[e]=b.labels&&b.labels[e]?b.labels[e]:e;return c}(D),g=[],n=function(a){for(var b=[],c,e=!0,f=0;e;)if(c=p(a),b[f++]=c.key,e=c.children)a=c.children;return b}(B),n=s(n,D);a("#"+z).remove();b.showInput&&(v=a('<input type="text" id="'+z+'" value="" class="'+b.inputClass+'" readonly />').insertBefore(o),u.settings.anchor=v,b.showOnFocus&&v.focus(function(){u.show()}));b.wheelArray||o.hide().closest(".ui-field-contain").trigger("create");return{width:50,wheels:n,
headerText:!1,onBeforeShow:function(){var a=u.temp;g=a.slice(0);u.settings.wheels=s(a,D,D);y=true},onSelect:function(a){v&&v.val(a)},onChange:function(a){v&&b.display=="inline"&&v.val(a)},onClose:function(){v&&v.blur()},onShow:function(b){a(".dwwl",b).bind("mousedown touchstart",function(){clearTimeout(w[a(".dwwl",b).index(this)])})},validate:function(a,b,c){var e=u.temp;if(b!==void 0&&g[b]!=e[b]||b===void 0&&!y){u.settings.wheels=s(e,null,b);var f=[],n=(b||0)+1,i=q(e,b);if(b!==void 0)u.temp=i.nVector.slice(0);
for(;n<i.lvl;)f.push(n++);t(a,i.lvl);g=u.temp.slice(0);if(f.length){y=true;u.settings.readonly=h(D,b);clearTimeout(w[b]);w[b]=setTimeout(function(){u.changeWheel(f);u.settings.readonly=false},c*1E3);return false}r(a,i.lvl,B,u.temp)}else{i=q(e,e.length);r(a,i.lvl,B,e);t(a,i.lvl)}y=false}}};a.each(["list","image","treelist"],function(a,e){r.presets[e]=z;r.presetShort(e)})})(jQuery);(function(a){var r={inputClass:"",invalid:[],rtl:!1,group:!1,groupLabel:"Groups"};a.mobiscroll.presetShort("select");a.mobiscroll.presets.select=function(e){function z(){var b,d=0,e=[],f=[],g=[[]];c.group?(c.rtl&&(d=1),a("optgroup",h).each(function(b){e.push(a(this).attr("label"));f.push(b)}),g[d]=[{values:e,keys:f,label:v}],b=t,d+=c.rtl?-1:1):b=h;e=[];f=[];a("option",b).each(function(){var b=a(this).attr("value");e.push(a(this).text());f.push(b);a(this).prop("disabled")&&y.push(b)});g[d]=[{values:e,
keys:f,label:v}];return g}function u(a,b){var c=[];if(s){var f=[],g=0;for(g in e._selectedValues)f.push(D[g]),c.push(g);l.val(f.join(", "))}else l.val(a),c=b?e.values[w]:null;b&&(o=!0,h.val(c).trigger("change"))}var E=a.extend({},e.settings),c=a.extend(e.settings,r,E),h=a(this),s=h.prop("multiple"),E=this.id+"_dummy",p=s?h.val()?h.val()[0]:a("option",h).attr("value"):h.val(),t=h.find('option[value="'+p+'"]').parent(),q=t.index()+"",f=q,o;a('label[for="'+this.id+'"]').attr("for",E);var b=a('label[for="'+
E+'"]'),v=void 0!==c.label?c.label:b.length?b.text():h.attr("name"),y=[],I=[],D={},i,w,B,l,g=c.readonly;c.group&&!a("optgroup",h).length&&(c.group=!1);c.invalid.length||(c.invalid=y);c.group?c.rtl?(i=1,w=0):(i=0,w=1):(i=-1,w=0);a("#"+E).remove();l=a('<input type="text" id="'+E+'" class="'+c.inputClass+'" readonly />').insertBefore(h);a("option",h).each(function(){D[a(this).attr("value")]=a(this).text()});c.showOnFocus&&l.focus(function(){e.show()});E=h.val()||[];b=0;for(b;b<E.length;b++)e._selectedValues[E[b]]=
E[b];u(D[p]);h.unbind(".dwsel").bind("change.dwsel",function(){o||e.setValue(s?h.val()||[]:[h.val()],true);o=false}).hide().closest(".ui-field-contain").trigger("create");e._setValue||(e._setValue=e.setValue);e.setValue=function(b,d,g,i,o){var l=a.isArray(b)?b[0]:b;p=l!==void 0?l:a("option",h).attr("value");if(s){e._selectedValues={};l=0;for(l;l<b.length;l++)e._selectedValues[b[l]]=b[l]}if(c.group){t=h.find('option[value="'+p+'"]').parent();f=t.index();b=c.rtl?[p,t.index()]:[t.index(),p];if(f!==q){c.wheels=
z();e.changeWheel([w]);q=f+""}}else b=[p];e._setValue(b,d,g,i,o);if(d){d=s?true:p!==h.val();u(D[p],d)}};e.getValue=function(a){return(a?e.temp:e.values)[w]};return{width:50,wheels:void 0,headerText:!1,multiple:s,anchor:l,formatResult:function(a){return D[a[w]]},parseValue:function(){var b=h.val()||[],d=0;if(s){e._selectedValues={};for(d;d<b.length;d++)e._selectedValues[b[d]]=b[d]}p=s?h.val()?h.val()[0]:a("option",h).attr("value"):h.val();t=h.find('option[value="'+p+'"]').parent();f=t.index();q=f+
"";return c.group&&c.rtl?[p,f]:c.group?[f,p]:[p]},validate:function(b,d,j){if(d===void 0&&s){var l=e._selectedValues,o=0;a(".dwwl"+w+" .dw-li",b).removeClass("dw-msel");for(o in l)a(".dwwl"+w+' .dw-li[data-val="'+l[o]+'"]',b).addClass("dw-msel")}if(d===i){f=e.temp[i];if(f!==q){t=h.find("optgroup").eq(f);f=t.index();p=(p=t.find("option").eq(0).val())||h.val();c.wheels=z();if(c.group){e.temp=c.rtl?[p,f]:[f,p];c.readonly=[c.rtl,!c.rtl];clearTimeout(B);B=setTimeout(function(){e.changeWheel([w]);c.readonly=
g;q=f+""},j*1E3);return false}}else c.readonly=g}else p=e.temp[w];var r=a(".dw-ul",b).eq(w);a.each(c.invalid,function(b,c){a('.dw-li[data-val="'+c+'"]',r).removeClass("dw-v")})},onBeforeShow:function(){c.wheels=z();if(c.group)e.temp=c.rtl?[p,t.index()]:[t.index(),p]},onMarkupReady:function(b){a(".dwwl"+i,b).bind("mousedown touchstart",function(){clearTimeout(B)});if(s){b.addClass("dwms");a(".dwwl",b).eq(w).addClass("dwwms");I={};for(var c in e._selectedValues)I[c]=e._selectedValues[c]}},onValueTap:function(a){if(s&&
a.hasClass("dw-v")&&a.closest(".dw").find(".dw-ul").index(a.closest(".dw-ul"))==w){var b=a.attr("data-val");a.hasClass("dw-msel")?delete e._selectedValues[b]:e._selectedValues[b]=b;a.toggleClass("dw-msel");c.display=="inline"&&u(b,true);return false}},onSelect:function(a){u(a,true);if(c.group)e.values=null},onCancel:function(){if(c.group)e.values=null;if(s){e._selectedValues={};for(var a in I)e._selectedValues[a]=I[a]}},onChange:function(a){if(c.display=="inline"&&!s){l.val(a);o=true;h.val(e.temp[w]).trigger("change")}},
onClose:function(){l.blur()}}}})(jQuery);(function(a){a.mobiscroll.themes.android={defaults:{dateOrder:"Mddyy",mode:"clickpick",height:50,showLabel:!1}}})(jQuery);(function(a){var r={defaults:{dateOrder:"Mddyy",mode:"mixed",rows:5,width:70,height:36,showLabel:!1,useShortLabels:!0}};a.mobiscroll.themes["android-ics"]=r;a.mobiscroll.themes["android-ics light"]=r})(jQuery);(function(a){a.mobiscroll.themes.ios={defaults:{dateOrder:"MMdyy",rows:5,height:30,width:55,headerText:!1,showLabel:!1,useShortLabels:!0}}})(jQuery);(function(a){a.mobiscroll.themes.jqm={defaults:{jqmBorder:"a",jqmBody:"c",jqmHeader:"b",jqmWheel:"d",jqmClickPick:"c",jqmSet:"b",jqmCancel:"c"},init:function(r,e){var z=e.settings;a(".dw",r).removeClass("dwbg").addClass("ui-overlay-shadow ui-corner-all ui-body-"+z.jqmBorder);a(".dwb-s span",r).attr("data-role","button").attr("data-theme",z.jqmSet);a(".dwb-n span",r).attr("data-role","button").attr("data-theme",z.jqmCancel);a(".dwb-c span",r).attr("data-role","button").attr("data-theme",z.jqmCancel);
a(".dwwb",r).attr("data-role","button").attr("data-theme",z.jqmClickPick);a(".dwv",r).addClass("ui-header ui-bar-"+z.jqmHeader);a(".dwwr",r).addClass("ui-body-"+z.jqmBody);a(".dwpm .dwwl",r).addClass("ui-body-"+z.jqmWheel);a(".dwpm .dwl",r).addClass("ui-body-"+z.jqmBody);r.trigger("create");a(".dwo",r).click(function(){e.cancel()})}}})(jQuery);(function(a){var r;a.mobiscroll.themes.wp={defaults:{width:70,height:76,accent:"none",dateOrder:"mmMMddDDyy",showLabel:!1,onAnimStart:function(e,z,u){a(".dwwl"+z,e).addClass("wpam");clearTimeout(r[z]);r[z]=setTimeout(function(){a(".dwwl"+z,e).removeClass("wpam")},1E3*u+100)}},init:function(e,z){var u,E;r={};a(".dw",e).addClass("wp-"+z.settings.accent);a(".dwwl",e).delegate(".dw-sel","touchstart mousedown DOMMouseScroll mousewheel",function(){u=!0;E=a(this).closest(".dwwl").hasClass("wpa");a(".dwwl",
e).removeClass("wpa");a(this).closest(".dwwl").addClass("wpa")}).bind("touchmove mousemove",function(){u=!1}).bind("touchend mouseup",function(){u&&E&&a(this).closest(".dwwl").removeClass("wpa")})}};a.mobiscroll.themes["wp light"]=a.mobiscroll.themes.wp})(jQuery);
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

$.widget( "an.mobiledatefield", $.an.inputfield, {
	
	options:{
		theme: 'jqm',
		lang: 'en',
		display: 'bottom',
		mode: 'scroller',
		dateFormat:'yy-mm-dd',
		dateOrder: 'yy mmD dd',
		minDate:'',
		maxDate:'',
	},

	_create: function() {
		$.an.inputfield.prototype._create.apply(this, arguments);
		this.element.addClass("an-mobiledatetimefield");
	},
	
	_edit:function(){
		var minDate,maxDate,self=this,o=this.options;
		var date=new Date(), lng=window.database.local,
		opts={
			//invalid: {  dates: [new Date(2013/07/01), new Date(2014/06/30)],daysOfWeek: [], daysOfMonth: [] },
			theme: o.theme,
			lang: o.lang,
			display: o.display,
			mode: o.mode,
			dateFormat:o.dateFormat,
			dateOrder: o.dateOrder,
		}
		minDate=o.minDate=="now"?date:new Date(o.minDate);
		minDate.toString()!="Invalid Date"&&(opts.minDate=minDate);
		maxDate=o.maxDate=="now"?date:new Date(o.maxDate);
		maxDate.toString()!="Invalid Date"&&(opts.maxDate=maxDate);
		$.an.inputfield.prototype._edit.apply( this, arguments );
		opts.onSelect=function(value){
			self.input.trigger("keyup");
		};
		this.input.mobiscroll().date(opts);
	},
	
	destroy: function() {
		this.input.mobiscroll&&this.input.mobiscroll("destroy");
		this.input.removeAttr("readony");
		this.element.removeClass("an-mobiledatetimefield" );
		return $.an.inputfield.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
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

$.widget( "an.swipewidget", $.an.widget, {

    options:{
        swipeContent : '<li>no content</li>',
        swipeIcon : '<b class="swipe-icon-active"></b>',
        swipeindex : 0,
        swipeContent : '<li>no content</li>',
        swipeduration : false,
        swipeduration : 2000,
        width : '100'
    },

	_create: function() {
        $.an.widget.prototype._create.apply(this, arguments);
        var o = this.options;
        if(o.mobile){
            var self = this;
            this.element.addClass("an-swipewidget");
            var wrap = $('<div class="swipeBox"></div>'),
                contentList = $('<ul class="swipeList c"></ul>'),
                iconList = $('<div class="iconList"></div>');
            contentList.append(o.swipeContent);
            contentList.find('li').each(function(i){
                var icon = '<b></b>';
                if(i == o.swipeindex){
                    icon = '<b class="swipe-icon-active"></b>';
                }
                iconList.append($(icon));
            });
            contentList.width(o.width * contentList.find('li').length+'%');
            contentList.find('li').width(o.width / contentList.find('li').length+'%');

			wrap.append(contentList).append(iconList).appendTo(this.element.find('.content'));
            self.pos = {};
            var pos = self.pos;
            pos.t = null;
            pos.index = o.swipeindex;
            pos.itemLen = contentList.find('li').length;
            pos.itemWidth = contentList.find('li').eq(0).outerWidth(true);

           this.element.bind('touchstart.swipewidget', function(e){
             var e = e.originalEvent.touches[0];
             pos.x = e.pageX;
             pos.y = e.pageY;
             pos.dx = 0;
             pos.dy = 0;
             pos.Left = contentList.offset().left;
             pos.target = e.target.tagName.toLowerCase() == 'li' ? e.target : $(e.target).closest('li');
             pos.index = contentList.find('li').index($(pos.target));
             pos.itemWidth = $(pos.target).outerWidth(true);

             clearTimeout(pos.t);
             pos.t = null;
          })

          this.element.bind('touchmove.swipewidget', function(e){
             e.preventDefault();  //important
             var e = e.originalEvent.touches[0];
             pos.dx = e.pageX - pos.x;
             pos.dy = e.pageY - pos.y;
             contentList.css({"left":parseInt(pos.dx + pos.Left)+"px"});
          })

          this.element.bind('touchend.swipewidget', function(e){
              var posLeft = 0, posIndex = 0;
              if(pos.index == 0 && pos.dx > 0){
                 posLeft = 0;
                 posIndex = 0;
              }else if(pos.index == pos.itemLen-1 && pos.dx < 0){
                  posLeft = -pos.itemWidth*pos.index;
                  posIndex = pos.index;
              }else{
                if(Math.abs(pos.dx) >= pos.itemWidth/2){
                    if(pos.dx > 0){
                        posLeft = -pos.itemWidth*(pos.index-1);
                        posIndex = pos.index-1;
                    }else if(pos.dx < 0){
                        posLeft = -pos.itemWidth*(pos.index+1);
                        posIndex = pos.index+1;
                    }
                }else{
                    posLeft = -pos.itemWidth*(pos.index);
                    posIndex = pos.index;
                }
              }
              self._setActive(contentList, posLeft, posIndex);
              if(o.autoSwipe && o.mode != 'design'){
                 pos.t = setTimeout(function(){self.autoRun(contentList, posLeft, posIndex);},o.swipeduration);
              }
          })
        }
	},
    _setActive : function(obj, posLeft, index){
        var self = this;
        //obj.css({'left':posLeft + 'px'});
        obj.css({'left':-index*100+'%'});
        setTimeout(function(){
            self.element.find('.iconList b').eq(index).addClass('swipe-icon-active').siblings().removeClass('swipe-icon-active');
        },100);  //after css3 transition complete
    },
    autoRun:function(obj, posLeft, index){
        var self = this, o = this.options, pos = this.pos;
        if(index <= 0 || index > (pos.itemLen - 1)){
            index = 0;
        }
        posLeft = -pos.itemWidth*index;
        self._setActive(obj, posLeft, index);
        index ++;
        pos.index++;
        pos.t = setTimeout(function(){self.autoRun(obj, posLeft, index);},o.swipeduration);
   },
	_browser:function(){
		var o = this.options;
        if(o.autoSwipe){
           this.autoRun(this.element.find('.swipeList'), 0, 0);
        }
	},

	_edit:function(){
		var o = this.options;
        if(o.autoSwipe){
           this.autoRun(this.element.find('.swipeList'), 0, 0);
        }
	},

    _design: function(){
		var o = this.options;

    },

	destroy: function() {
		this.element.removeClass("an-swipewidget");
        this.element.unbind('swipewidget');
        this.content.remove();
		return $.an.widget.prototype.destroy.apply( this, arguments );
	}
});
})( jQuery );
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

$.widget( "an.loading", {
	options:{
		trans:'0.6',
		fullscreen:false,
		msg:''
	},
	
	_create: function(){
		var o = this.options,self=this;
		this.wrap=$('<div class="loading" style="width:100%;height:100%;position:absolute;left:0;top:0;z-index:9997;vertical-align:middle;"><div style="position:absolute;left:0;top:0;width:100%;height:100%;z-index:9998;background:#fff;"></div></div>');
		this.wrap.css('opacity',o.trans);
		this.wrap.append($('<span style="background:url(images/large-loading.gif) no-repeat;width:32px;height:32px;position:absolute;left:49%;top:49%;z-index:9999;padding-top:32px;">'+o.msg+'</span>'));
		if(!o.fullscreen){
			this.oldPos=this.element.css("postion");
			this.element.css("postion","relatvie").append(this.wrap);
		}else{
			this.wrap.css("position","fixed").appendTo($("body"));
		}
	},
	
	open:function(){
		this.wrap && this.wrap.show();
	},

	close:function(){
		this.wrap && this.wrap.hide();
	},

	destroy: function() {
		if(this.oldPos){
			this.element.css("postion",this.oldPos);
		}
		this.wrap && this.wrap.remove();
		delete this.pager;
		$.Widget.prototype.destroy.apply(this,arguments);
	}
});
})( jQuery );
(function( $, undefined ) {
// This function calls getAttribute, which should be safe for data-* attributes
var getAttrFixed = function( e, key ) {
	var value = e.getAttribute( key );

	return value === "true" ? true :
		value === "false" ? false :
		value === null ? undefined : value;
};

$.fn.buttonMarkup = function( options ) {
	var $workingSet = this,
		nsKey = "data-",
		key = {};

	// Enforce options to be of type string
	options = ( options && ( $.type( options ) === "object" ) )? options : {};
	for ( var i = 0; i < $workingSet.length; i++ ) {
		var el = $workingSet.eq( i ),
			e = el[ 0 ],
			o = $.extend( {}, $.fn.buttonMarkup.defaults, {
				icon:       options.icon       !== undefined ? options.icon       : getAttrFixed( e, nsKey + "icon" ),
				iconpos:    options.iconpos    !== undefined ? options.iconpos    : getAttrFixed( e, nsKey + "iconpos" ),
				theme:      options.theme      !== undefined ? options.theme      : getAttrFixed( e, nsKey + "theme" ) || "c",
				inline:     options.inline     !== undefined ? options.inline     : getAttrFixed( e, nsKey + "inline" ),
				shadow:     options.shadow     !== undefined ? options.shadow     : getAttrFixed( e, nsKey + "shadow" ),
				corners:    options.corners    !== undefined ? options.corners    : getAttrFixed( e, nsKey + "corners" ),
				iconshadow: options.iconshadow !== undefined ? options.iconshadow : getAttrFixed( e, nsKey + "iconshadow" ),
				mini:       options.mini       !== undefined ? options.mini       : getAttrFixed( e, nsKey + "mini" )
			}, options ),

			// Classes Defined
			innerClass = "ui-btn-inner",
			textClass = "ui-btn-text",
			buttonClass, iconClass,
			hover = false,
			state = "up",
			// Button inner markup
			buttonInner,
			buttonText,
			buttonIcon,
			buttonElements;

		for ( key in o ) {
			if ( o[ key ] === undefined || o[ key ] === null ) {
				el.removeAttr( nsKey + key );
			} else {
				e.setAttribute( nsKey + key, o[ key ] );
			}
		}

		if ( getAttrFixed( e, nsKey + "rel" ) === "popup" && el.attr( "href" ) ) {
			e.setAttribute( "aria-haspopup", true );
			e.setAttribute( "aria-owns", el.attr( "href" ) );
		}

		// Check if this element is already enhanced
		buttonElements = $.data( ( ( e.tagName === "INPUT" || e.tagName === "BUTTON" ) ? e.parentNode : e ), "buttonElements" );
		
		if ( buttonElements ) {
			e = buttonElements.outer;
			el = $( e );
			buttonInner = buttonElements.inner;
			buttonText = buttonElements.text;
			// We will recreate this icon below
			$( buttonElements.icon ).remove();
			buttonElements.icon = null;
			hover = buttonElements.hover;
			state = buttonElements.state;
		}
		else {
			buttonInner = document.createElement( o.wrapperEls );
			buttonText = document.createElement( o.wrapperEls );
		}
		buttonIcon = o.icon ? document.createElement( "span" ) : null;

		// if not, try to find closest theme container
		if ( !o.theme ) {
			o.theme = "c";
		}

		buttonClass = "ui-btn ";
		buttonClass += ( hover ? "ui-btn-hover-" + o.theme : "" );
		buttonClass += ( state ? " ui-btn-" + state + "-" + o.theme : "" );
		buttonClass += o.shadow ? " ui-shadow" : "";
		buttonClass += o.corners ? " ui-btn-corner-all" : "";

		if ( o.mini !== undefined ) {
			// Used to control styling in headers/footers, where buttons default to `mini` style.
			buttonClass += o.mini === true ? " ui-mini" : " ui-fullsize";
		}

		if ( o.inline !== undefined ) {
			// Used to control styling in headers/footers, where buttons default to `inline` style.
			buttonClass += o.inline === true ? " ui-btn-inline" : " ui-btn-block";
		}

		if ( o.icon ) {
			o.icon = "ui-icon-" + o.icon;
			o.iconpos = o.iconpos || "left";

			iconClass = "ui-icon " + o.icon;

			if ( o.iconshadow ) {
				iconClass += " ui-icon-shadow";
			}
		}

		if ( o.iconpos ) {
			buttonClass += " ui-btn-icon-" + o.iconpos;

			if ( o.iconpos === "notext" && !el.attr( "title" ) ) {
				el.attr( "title", el.getEncodedText() );
			}
		}

		if ( buttonElements ) {
			el.removeClass( buttonElements.bcls || "" );
		}
		el.removeClass( "ui-link" ).addClass( buttonClass );

		buttonInner.className = innerClass;
		buttonText.className = textClass;
		if ( !buttonElements ) {
			buttonInner.appendChild( buttonText );
		}
		if ( buttonIcon ) {
			buttonIcon.className = iconClass;
			if ( !( buttonElements && buttonElements.icon ) ) {
				buttonIcon.innerHTML = "&#160;";
				buttonInner.appendChild( buttonIcon );
			}
		}

		while ( e.firstChild && !buttonElements ) {
			buttonText.appendChild( e.firstChild );
		}

		if ( !buttonElements ) {
			e.appendChild( buttonInner );
		}

		// Assign a structure containing the elements of this button to the elements of this button. This
		// will allow us to recognize this as an already-enhanced button in future calls to buttonMarkup().
		buttonElements = {
			hover : hover,
			state : state,
			bcls  : buttonClass,
			outer : e,
			inner : buttonInner,
			text  : buttonText,
			icon  : buttonIcon
		};

		$.data( e,           'buttonElements', buttonElements );
		$.data( buttonInner, 'buttonElements', buttonElements );
		$.data( buttonText,  'buttonElements', buttonElements );
		if ( buttonIcon ) {
			$.data( buttonIcon, 'buttonElements', buttonElements );
		}
	}

	return this;
};

$.fn.buttonMarkup.defaults = {
	corners: true,
	shadow: true,
	iconshadow: true,
	wrapperEls: "span"
};

})(jQuery);

(function( $, undefined ) {

//Keeps track of the number of lists per page UID
//This allows support for multiple nested list in the same page
//https://github.com/jquery/jquery-mobile/issues/1617
var listCountPerPage = {};
var addFirstLastClasses = {
		_addFirstLastClasses : function (e,t,i){e.removeClass("ui-first-child ui-last-child"),t.eq(0).addClass("ui-first-child").end().last().addClass("ui-last-child"),i||this.element.trigger("updatelayout")},
		_getVisibles : function (e,t){var i;return t?i=e.not(".ui-screen-hidden"):(i=e.filter(":visible"),0===i.length&&(i=e.not(".ui-screen-hidden"))),i}
};

var getInheritedTheme = function (e,t){for(var i,n,a=e[0],o="",s=/ui-(bar|body|overlay)-([a-z])\b/;a&&(i=a.className||"",!(i&&(n=s.exec(i))&&(o=n[2])));)a=a.parentNode;return o||t||"a"};

$.widget( "an.mlist", $.an.widget, $.extend( {
	options: {
		theme: null,
		countTheme: "c",
		headerTheme: "b",
		dividerTheme: "b",
		icon: "arrow-r",
		splitIcon: "arrow-r",
		splitTheme: "b",
		corners: true,
		shadow: true,
		inset: false,
		initSelector: ":jqmData(role='listview')"
	},

	_create: function() {
		var t = this,
			listviewClasses = "";

		listviewClasses += t.options.inset ? " ui-listview-inset" : "";

		if ( !!t.options.inset ) {
			listviewClasses += t.options.corners ? " ui-corner-all" : "";
			listviewClasses += t.options.shadow ? " ui-shadow" : "";
		}

		// create listview markup
		t.element.addClass(function( i, orig ) {
			return orig + " ui-listview" + listviewClasses;
		});
		t.refresh( true );
	},

	// This is a generic utility method for finding the first
	// node with a given nodeName. It uses basic DOM traversal
	// to be fast and is meant to be a substitute for simple
	// $.fn.closest() and $.fn.children() calls on a single
	// element. Note that callers must pass both the lowerCase
	// and upperCase version of the nodeName they are looking for.
	// The main reason for this is that this function will be
	// called many times and we want to avoid having to lowercase
	// the nodeName from the element every time to ensure we have
	// a match. Note that this function lives here for now, but may
	// be moved into $.mobile if other components need a similar method.
	_findFirstElementByTagName: function( ele, nextProp, lcName, ucName ) {
		var dict = {};
		dict[ lcName ] = dict[ ucName ] = true;
		while ( ele ) {
			if ( dict[ ele.nodeName ] ) {
				return ele;
			}
			ele = ele[ nextProp ];
		}
		return null;
	},
	_getChildrenByTagName: function( ele, lcName, ucName ) {
		var results = [],
			dict = {};
		dict[ lcName ] = dict[ ucName ] = true;
		ele = ele.firstChild;
		while ( ele ) {
			if ( dict[ ele.nodeName ] ) {
				results.push( ele );
			}
			ele = ele.nextSibling;
		}
		return $( results );
	},

	_addThumbClasses: function( containers ) {
		var i, img, len = containers.length;
		for ( i = 0; i < len; i++ ) {
			img = $( this._findFirstElementByTagName( containers[ i ].firstChild, "nextSibling", "img", "IMG" ) );
			if ( img.length ) {
				img.addClass( "ui-li-thumb" );
				$( this._findFirstElementByTagName( img[ 0 ].parentNode, "parentNode", "li", "LI" ) ).addClass( img.is( ".ui-li-icon" ) ? "ui-li-has-icon" : "ui-li-has-thumb" );
			}
		}
	},

	refresh: function( create ) {
		this.parentPage = this.element.closest( ".ui-page" );

		var o = this.options,
			$list = this.element,
			self = this,
			dividertheme = $list.attr( "data-divider-theme" ) || o.dividerTheme,
			listsplittheme = $list.attr( "data-split-theme" ),
			listspliticon = $list.attr( "data-split-icon" ),
			listicon = $list.attr( "data-icon" ),
			li = this._getChildrenByTagName( $list[ 0 ], "li", "LI" ),
			ol = !!$.nodeName( $list[ 0 ], "ol" ),
			jsCount = !$.support.cssPseudoElement,
			start = $list.attr( "start" ),
			itemClassDict = {},
			item, itemClass, itemTheme,
			a, last, splittheme, counter, startCount, newStartCount, countParent, icon, imgParents, img, linkIcon;

		if ( ol && jsCount ) {
			$list.find( ".ui-li-dec" ).remove();
		}

		if ( ol ) {
			// Check if a start attribute has been set while taking a value of 0 into account
			if ( start || start === 0 ) {
				if ( !jsCount ) {
					startCount = parseInt( start , 10 ) - 1;
					$list.css( "counter-reset", "listnumbering " + startCount );
				} else {
					counter = parseInt( start , 10 );
				}
			} else if ( jsCount ) {
					counter = 1;
			}
		}

		if ( !o.theme ) {
			o.theme = getInheritedTheme( this.element, "c" );
		}

		for ( var pos = 0, numli = li.length; pos < numli; pos++ ) {
			item = li.eq( pos );
			itemClass = "ui-li";

			// If we're creating the element, we update it regardless
			if ( create || !item.hasClass( "ui-li" ) ) {
				itemTheme = item.attr( "data-theme" ) || o.theme;
				a = this._getChildrenByTagName( item[ 0 ], "a", "A" );
				var isDivider = ( item.attr( "data-role" ) === "list-divider" );

				if ( a.length && !isDivider ) {
					icon = item.attr( "data-icon" );
					
					item.buttonMarkup({
						wrapperEls: "div",
						shadow: false,
						corners: false,
						iconpos: "right",
						icon: a.length > 1 || icon === false ? false : icon || listicon || o.icon,
						theme: itemTheme
					});

					if ( ( icon !== false ) && ( a.length === 1 ) ) {
						item.addClass( "ui-li-has-arrow" );
					}

					a.first().removeClass( "ui-link" ).addClass( "ui-link-inherit" );

					if ( a.length > 1 ) {
						itemClass += " ui-li-has-alt";

						last = a.last();
						splittheme = listsplittheme || last.attr( "data-theme" ) || o.splitTheme;
						linkIcon = last.attr( "data-icon" );

						last.appendTo( item )
							.attr( "title", $.trim(last.getEncodedText()) )
							.addClass( "ui-li-link-alt" )
							.empty()
							.buttonMarkup({
								shadow: false,
								corners: false,
								theme: itemTheme,
								icon: false,
								iconpos: "notext"
							})
							.find( ".ui-btn-inner" )
								.append(
									$( document.createElement( "span" ) ).buttonMarkup({
										shadow: true,
										corners: true,
										theme: splittheme,
										iconpos: "notext",
										// link icon overrides list item icon overrides ul element overrides options
										icon: linkIcon || icon || listspliticon || o.splitIcon
									})
								);
					}
				} else if ( isDivider ) {

					itemClass += " ui-li-divider ui-bar-" + ( item.attr( "data-theme" ) || dividertheme );
					item.attr( "role", "heading" );

					if ( ol ) {
						//reset counter when a divider heading is encountered
						if ( start || start === 0 ) {
							if ( !jsCount ) {
								newStartCount = parseInt( start , 10 ) - 1;
								item.css( "counter-reset", "listnumbering " + newStartCount );
							} else {
								counter = parseInt( start , 10 );
							}
						} else if ( jsCount ) {
								counter = 1;
						}
					}

				} else {
					itemClass += " ui-li-static ui-btn-up-" + itemTheme;
				}
			}

			if ( ol && jsCount && itemClass.indexOf( "ui-li-divider" ) < 0 ) {
				countParent = itemClass.indexOf( "ui-li-static" ) > 0 ? item : item.find( ".ui-link-inherit" );

				countParent.addClass( "ui-li-jsnumbering" )
					.prepend( "<span class='ui-li-dec'>" + ( counter++ ) + ". </span>" );
			}

			// Instead of setting item class directly on the list item and its
			// btn-inner at this point in time, push the item into a dictionary
			// that tells us what class to set on it so we can do this after this
			// processing loop is finished.

			if ( !itemClassDict[ itemClass ] ) {
				itemClassDict[ itemClass ] = [];
			}

			itemClassDict[ itemClass ].push( item[ 0 ] );
		}

		// Set the appropriate listview item classes on each list item
		// and their btn-inner elements. The main reason we didn't do this
		// in the for-loop above is because we can eliminate per-item function overhead
		// by calling addClass() and children() once or twice afterwards. This
		// can give us a significant boost on platforms like WP7.5.

		for ( itemClass in itemClassDict ) {
			$( itemClassDict[ itemClass ] ).addClass( itemClass ).children( ".ui-btn-inner" ).addClass( itemClass );
		}

		$list.find( "h1, h2, h3, h4, h5, h6" ).addClass( "ui-li-heading" )
			.end()

			.find( "p, dl" ).addClass( "ui-li-desc" )
			.end()

			.find( ".ui-li-aside" ).each(function() {
					var $this = $( this );
					$this.prependTo( $this.parent() ); //shift aside to front for css float
				})
			.end()

			.find( ".ui-li-count" ).each(function() {
					$( this ).closest( "li" ).addClass( "ui-li-has-count" );
				}).addClass( "ui-btn-up-" + ( $list.attr( "data-count-theme" ) || this.options.countTheme) + " ui-btn-corner-all" );

		// The idea here is to look at the first image in the list item
		// itself, and any .ui-link-inherit element it may contain, so we
		// can place the appropriate classes on the image and list item.
		// Note that we used to use something like:
		//
		//    li.find(">img:eq(0), .ui-link-inherit>img:eq(0)").each( ... );
		//
		// But executing a find() like that on Windows Phone 7.5 took a
		// really long time. Walking things manually with the code below
		// allows the 400 listview item page to load in about 3 seconds as
		// opposed to 30 seconds.

		this._addThumbClasses( li );
		this._addThumbClasses( $list.find( ".ui-link-inherit" ) );

		this._addFirstLastClasses( li, this._getVisibles( li, create ), create );
		// autodividers binds to this to redraw dividers after the listview refresh
		this._trigger( "afterrefresh" );
	}
}, addFirstLastClasses ) );

//auto self-init widgets
/*$.mobile.document.bind( "pagecreate create", function( e ) {
	$.mobile.listview.prototype.enhanceWithin( e.target );
});*/

})(jQuery);