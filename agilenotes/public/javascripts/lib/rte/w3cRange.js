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
