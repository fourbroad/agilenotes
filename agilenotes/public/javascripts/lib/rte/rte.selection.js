(function($) {
$.rteSelection = function(rte) {
	this.rte      = rte;
	var doc = rte.options.doc;
	var window = rte.options.win;
	var self      = this;
	this.w3cRange = null;
	var start, end, node, bm;
	
	$(doc).keyup(function(e) {
			if (e.ctrlKey || e.metaKey || (e.keyCode >= 8 && e.keyCode <= 13) 
			 || (e.keyCode>=32 && e.keyCode<= 40) || e.keyCode == 46 
			 || (e.keyCode >=96 && e.keyCode <= 111)) {
				self.cleanCache();
			}
		}).mousedown(function(e) {
			if (e.target.nodeName == 'HTML') {
				start = doc.body;
			} else {
				start = e.target;
			}
			end   = node = null;
		}).mouseup(function(e) {
			if (e.target.nodeName == 'HTML') {
				end = doc.body;
			} else {
				end = e.target;
			}
			end  = e.target;
			node = null;
		}).click();
		
	function selection() {
		return window.getSelection ? window.getSelection() : window.document.selection;
	}
	
	function realSelected(n, p, s) {
		var dom = rte.options.dom;
		while (n.nodeName != 'BODY' && n.parentNode && n.parentNode.nodeName != 'BODY' 
			&& (p ? n!== p && n.parentNode != p : 1) 
			&& ((s=='left' && dom.isFirstNotEmpty(n)) || (s=='right' && dom.isLastNotEmpty(n)) || (dom.isFirstNotEmpty(n) && dom.isLastNotEmpty(n))) ) {
			n = n.parentNode;
		}
		return n;
	}
	
	this.collapsed = function() {
		return this.getRangeAt().isCollapsed();
	};
	
	this.collapse = function(st) {
		var s = selection(),	r = this.getRangeAt();
		r.collapse(st?true:false);
		if (!$.browser.msie) {
			s.removeAllRanges();
			s.addRange(r);
		}
		return this;
	};
	
	this.getRangeAt = function(updateW3cRange) {
		if ($.browser.msie) {
			if (!this.w3cRange) {
				this.w3cRange = new $.w3cRange(rte);
			}
			updateW3cRange && this.w3cRange.update();
			return this.w3cRange;
		}
		
		var s = selection(), doc = rte.options.doc, r = s && s.rangeCount > 0 ? s.getRangeAt(0) : doc.createRange();
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
	
	this.saveIERange = function() {
		if ($.browser.msie) {
			bm = this.getRangeAt().getBookmark();
		}
	};
	
	this.restoreIERange = function() {
		$.browser.msie && bm && this.getRangeAt().moveToBookmark(bm);
	};
	
	this.cloneContents = function() {
		var o = rte.options, sel = o.win.document.selection, body = o.doc.body, 
		      n = o.dom.create('div'), r, c, i;
		if ($.browser.msie) {
			try { 
				r = sel.createRange(); 
			} catch(e) { 
				r = body.createTextRange(); 
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
	
	this.select = function(s, e) {
		e = e||s;
		
		if ($.browser.msie) {
			var r  = rte.options.doc.body.createTextRange(), r1 = r.duplicate(), r2 = r.duplicate();
			r1.moveToElementText(s);
			r2.moveToElementText(e);
			r.setEndPoint('StartToStart', r1);
			r.setEndPoint('EndToEnd',     r2);
			r.select();
		} else {
			var sel = selection(), r = this.getRangeAt();
			r.setStartBefore(s);
			r.setEndAfter(e);
			sel.removeAllRanges();
			sel.addRange(r);
		}
		return this.cleanCache();
	};
	
	this.selectContents = function(n) {
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
				var s = selection();
				s.removeAllRanges();
				s.addRange(r);
			}
		}
		return this;
	};
	
	this.deleteContents = function() {
		if (!$.browser.msie) {
			this.getRangeAt().deleteContents();
		}
		return this;
	};
	
	this.insertNode = function(n, collapse) {
		if (collapse && !this.collapsed()) {
			this.collapse();
		}

		if ($.browser.msie) {
			var html = n.nodeType == 3 ? n.nodeValue : $(rte.options.dom.create('span')).append($(n)).html();
			 var r = this.getRangeAt();
			r.insertNode(html);
		} else {
			var r = this.getRangeAt();
			r.insertNode(n);
			r.setStartAfter(n);
			r.setEndAfter(n);
			var s = selection();
			s.removeAllRanges();
			s.addRange(r);
		}
		return this.cleanCache();
	};

	this.insertHtml = function(html, collapse) {
		if (collapse && !this.collapsed()) {
			this.collapse();
		}
		
		if ($.browser.msie) {
			this.getRangeAt().range().pasteHTML(html);
		} else {
			var n = $(rte.options.dom.create('span')).html(html||'').get(0);
			this.insertNode(n);
			$(n).replaceWith($(n).html());
		}
		return this.cleanCache();
	};

	this.insertText = function(text, collapse) {
		var n = rte.options.doc.createTextNode(text);
		return this.insertHtml(n.nodeValue);
	};

	this.getBookmark = function() {
		var o = rte.options, dom = o.dom, window = o.win, doc = o.doc;
		window.focus();
		var r, r1, r2, _s, _e, s = dom.createBookmark(), e = dom.createBookmark();
		if ($.browser.msie) {
			try { 
				r = window.document.selection.createRange(); 
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
			_s = dom.create('span');
			_e = dom.create('span');

			_s.appendChild(s);
			_e.appendChild(e);

			r1.collapse(true);
			r1.pasteHTML(_s.innerHTML);
			r2.collapse(false);
			r2.pasteHTML(_e.innerHTML);
		} else {
			var sel = selection();
			var r = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : doc.createRange();
				
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

	this.moveToBookmark = function(b) {
		var o = rte.options, doc = o.doc, dom = o.dom;
		o.win.focus();
		if (b && b.length==2) {
			var s = doc.getElementById(b[0]), e = doc.getElementById(b[1]), sel, r;
			if (s && e) {
				this.select(s, e);
				if (dom.next(s) == e) {
					this.collapse(true);
				}
				if (!$.browser.msie) {
					sel = selection();
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

	this.removeBookmark = function(b) {
		var o = rte.options, doc = o.doc;
		o.win.focus();
		if (b.length==2) {
			var s = doc.getElementById(b[0]),
				e = doc.getElementById(b[1]);
			if (s && e) {
				s.parentNode.removeChild(s);
				e.parentNode.removeChild(e);
			}
		}
	};

	this.cleanCache = function() {
		start = end = node = null;
		return this;
	};

	this.getStart = function() {
		if (!start) {
			start = this.getRangeAt().getStart();
		}
		return start;
	};
	
	this.getEnd = function() {
		if (!end) {
			end = this.getRangeAt().getEnd();
		}
		return end;
	};

	this.getNode = function() {
		var dom = rte.options.dom;
		if (!node) {
			node = dom.findCommonAncestor(this.getStart(), this.getEnd());
		}
		return node;
	};

	this.selected = function(o) {
		var dom = rte.options.dom, opts = { collapsed:false, blocks:false, filter:false, wrap: 'text', tag: 'span'};
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
			rte.options.win.focus();
			this.select(ret[0], ret[ret.length-1]);
		}	
		return opts.filter ? dom.filter(ret, opts.filter) : ret;
	};

	this.selectedRaw = function(collapsed, blocks) {
		var res = {so : null, eo : null, nodes : []};
		var r   = this.getRangeAt(true);
		var ca  = r.commonAncestorContainer;
		var s, e;  // start & end nodes
		var sf  = false; // start node fully selected
		var ef  = false; // end node fully selected
		
		function isFullySelected(n, s, e) {
			if (n.nodeType == 3) {
				e = e>=0 ? e : n.nodeValue.length;
				return (s==0 && e==n.nodeValue.length) || $.trim(n.nodeValue).length == $.trim(n.nodeValue.substring(s, e)).length;
			} 
			return true;
		}
		
		function isEmptySelected(n, s, e) {
			if (n.nodeType == 1) {
				return rte.options.dom.isEmpty(n);
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
					s = realSelected(s);
					if (!rte.options.dom.isEmpty(s) || (s = rte.options.dom.next(s))) {
						res.nodes = [s];
					} 
					
					if (rte.options.dom.isInline(s)) {
						res.nodes = rte.options.dom.toLineStart(s).concat(res.nodes, rte.options.dom.toLineEnd(s));
					}
					
					if (res.nodes.length>0) {
						res.so = res.nodes[0].nodeType == 1 ? null : 0;
						res.eo = res.nodes[res.nodes.length-1].nodeType == 1 ? null : res.nodes[res.nodes.length-1].nodeValue.length;
					}
					
				} else if (!rte.options.dom.isEmpty(s)) {
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
			s = realSelected(s, ca, 'left');
			sf = true;
			res.so = s.nodeType == 1 ? null : 0;
		}
		if (e.nodeType == 1 || blocks || isFullySelected(e, 0,  res.eo)) {
			e = realSelected(e, ca, 'right');
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

		if (s.parentNode == e.parentNode && s.parentNode.nodeName != 'BODY' && (sf && rte.options.dom.isFirstNotEmpty(s)) && (ef && rte.options.dom.isLastNotEmpty(e))) {
			s = e = s.parentNode;
			res.so = s.nodeType == 1 ? null : 0;
			res.eo = e.nodeType == 1 ? null : e.nodeValue.length;
		}
		if (s == e) {
			if (!rte.options.dom.isEmpty(s)) {
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
			while ((_n = rte.options.dom.next(_n))) {
					res.nodes.push(_n);
			}
			n = n.parentNode;
		}
		n = sp;
		while ((n = rte.options.dom.next(n)) && n!= ep ) {
			res.nodes.push(n);
		}
		var tmp = [];
		n = e;
		while (n !== ep) {
			var _n = n;
			while ((_n = rte.options.dom.prev(_n))) {
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
			if (rte.options.dom.isInline(s)) {
				res.nodes = rte.options.dom.toLineStart(s).concat(res.nodes);
				res.so    = res.nodes[0].nodeType == 1 ? null : 0;
			}
			if (rte.options.dom.isInline(e)) {
				res.nodes = res.nodes.concat(rte.options.dom.toLineEnd(e));
				res.eo    = res.nodes[res.nodes.length-1].nodeType == 1 ? null : res.nodes[res.nodes.length-1].nodeValue.length;
			}
		}

		return res;
	};
};

})(jQuery);