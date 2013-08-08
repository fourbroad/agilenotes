var time = parseInt(new Date().getTime() / 1000);

function _cdata(text) {
	return '<![CDATA[' + text + ']]>';
}

function _to(req) {
	var str = '<ToUserName>' + _cdata(req.FromUserName) + '</ToUserName>';
	str += '<FromUserName>' + _cdata(req.ToUserName) + '</FromUserName>';
	str += '<CreateTime>' + time + '</CreateTime>';
	return str;
}

function genText(req, opts, callback) {
	var str = '<xml>' + _to(req) + '<MsgType><![CDATA[text]]></MsgType>';
	str += '<Content>' + _cdata(opts.Content) + '</Content></xml>';
	callback(str);
}

function _getItem(item) {
	var str = '<item>';
	if (item.Title) {
		str += '<Title>' + _cdata(item.Title) + '</Title>';
	}

	if (item.Description) {
		str += '<Description>' + _cdata(item.Description) + '</Description>';
	}

	if (item.PicUrl) {
		str += '<PicUrl>' + _cdata(item.PicUrl) + '</PicUrl>';
	}

	if (item.Url) {
		str += '<Url>' + _cdata(item.Url) + '</Url>';
	}

	return str + '</item>';
}

function genArticle(req, opts, callback) {
	if (!opts) {
		callback("");
	} else {
		opts.items = opts.items || [];
		var str = '<xml>' + _to(req) + '<MsgType><![CDATA[news]]></MsgType>';
		str += '<ArticleCount>' + opts.items.length + '</ArticleCount><Articles>';
		for ( var i = 0; i < opts.items.length; i++) {
			str += _getItem(opts.items[i]);
		}
		str += '</Articles></xml>';
		callback(str);
	}
}

exports.genText = genText;
exports.genArticle = genArticle;