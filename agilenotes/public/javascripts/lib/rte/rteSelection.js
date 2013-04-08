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
