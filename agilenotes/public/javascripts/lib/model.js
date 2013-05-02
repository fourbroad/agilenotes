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
    ACTION: "00000000000000000000000b",
    VALIDATE_METHOD:"00000000000000000000000c",
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
    ACTION_ROOT: "0000000000000000000e000b",
    DATABASE_ROOT: "0000000000000000000e000f",

    // Cache of document type, page(form), view, side view.
    types:{},
    pages:{},
    views:{},
    sideViews:{},
    
    typeId:function(rootId){
    	if(rootId == this.META_ROOT){
    		return this.META;
    	}else	if(rootId == this.FORM_ROOT){
    		return this.FORM;
    	}else	if(rootId == this.VIEW_ROOT){
    		return this.VIEW;
    	}else	if(rootId == this.PAGE_ROOT){
    		return this.PAGE;
    	}else	if(rootId == this.TASK_ROOT){
    		return this.TASK;
    	}else if(rootId == this.OU_ROOT){
    		return this.OU;
    	}else if(rootId == this.GROUP_ROOT){
    		return this.GROUP;
    	}else if(rootId == this.ROLE_ROOT){
    		return this.ROLE;
    	}else if(rootId == this.SIDE_VIEW_ROOT){
    		return this.SIDE_VIEW;
    	}else if(rootId == this.ACTION_ROOT){
    		return this.ACTION;
    	}else if(rootId == this.DATABASE_ROOT){
    		return this.DATABASE;
    	}
    },

    typeName:function(typeId){
    	if(typeId == this.META){
    		return "Meta";
    	}else	if(typeId == this.FORM){
    		return "Form";
    	}else	if(typeId == this.VIEW){
    		return "View";
    	}else	if(typeId == this.PAGE){
    		return "Page";
    	}else	if(typeId == this.TASK){
    		return "Task";
    	}else if(typeId == this.USER){
    		return "User";
    	}else if(typeId == this.OU){
    		return "Organization Unit";
    	}else if(typeId == this.GROUP){
    		return "Group";
    	}else if(typeId == this.ROLE){
    		return "Role";
    	}else if(typeId == this.SIDE_VIEW){
    		return "Side View";
    	}else if(typeId == this.CATEGORY){
    		return "Category";
    	}else if(typeId == this.ACTION){
    		return "Action";
    	}else if(typeId == this.DATABASE){
    		return "Database";
    	}
    },

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
    	}else if(typeId == this.ACTION){
    		return this.ACTION_ROOT;
    	}else if(typeId == this.DATABASE){
    		return this.DATABASE_ROOT;
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
    						sortedPages.push(pages[j]);
    						self.pages[pages[j]._id] = pages[j];
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

    loadToolbarActions: function(dbId, callback){
    	var sel = {type:Model.ACTION, $or:[]};
    	$.each(["toolbarHeader","toolbarMiddle","toolbarTail"], function(){
    		sel.$or.push({extendPoint:this});
    	});
    	$.ans.getDoc(dbId, null, {selector:sel},function(err,data){
    		var tas = null;
    		if(data){
    			tas = {toolbarHeaderActions:[],toolbarMiddleActions:[],toolbarTailActions:[]};
    			$.each(data.docs,function(){
    				tas[this.extendPoint+"Actions"].push(this);
    			});
    		}
    		callback(err, tas);
    	});
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
	    				element.editor($.extend(true, {title:title, dbId:dbId, document:page, forms:forms, design:true, isPageEditor:true}, $.extend(true,{},opts,{mode:'edit'})));
	    				opts.opened && opts.opened(element.data("editor"));
	    			}
	    		});
			}else{
		    	if(page.type==Model.PAGE){
					element.page($.extend(true, {title:title, dbId:dbId, page:page}, opts));
					opts.opened && opts.opened(element.data("page"));
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
    		this._doOpenPage(element, dbId, this.pages[pageId], opts);
    	}else{
    		$.ans.getDoc(dbId, pageId, null, function(err, page){
    			if(err){
    				console.log("Load page "+ pageId+" error: "+err);
    			}else{
    				self.pages[pageId] = page;
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
    						element.editor($.extend(true, { title:title, dbId:dbId, document:viewDoc, forms:forms, design:true, isViewEditor:true}, $.extend(true,{},opts,{mode:"edit"})));
    						opts.opened && opts.opened(element.data("editor"));
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
		if(sideView && sideView.category == "treeView"){
			element.sideview($.extend(true, {dbId:dbId}, sideView, opts));
			opts.opened && opts.opened(element.data("sideview"));
		}else if(sideView && sideView.category == "outline"){
			element.outline($.extend(true,sideView,opts));
			opts.opened && opts.opened(element.data("outline"));
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
        delete this.pages[docId];
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
			try{return eval("this._doc."+id)}catch(e){};
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
