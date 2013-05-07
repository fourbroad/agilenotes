var sprintf = require("./sprintf");
var parser = require('xml2json');
// handle waats communications
var provider = null;

var msgid = ''; // AIG required transction unique MsgID

var pid = 0; // Policy ID

// private policy = array(); // Policy array load by AIG::waats_array()
var type = ''; // transaction Type:
// 'NQuote','NSell','Policy','Cancellation','GenerateDoc','Endorsement'

// var num = 0; // transaction num, NOT IN USE
var amount = 0; // transaction RMB value, if occured

var pnum = ''; // Policy Number, if there is one

var start_time = 0;

var error = ''; // class internal error message

var xml = ''; // xml sent to WAATS

var result = ''; // result get from WAATS

var error_code = 0; // result error code, if parsed one from result

var _MSG = '';

var config = '';

var g_policy = '';

Waats = function(provider, config, policy, c_type) {
	this.provider = provider;
	this.type = c_type;
	// this.policy = policy;
	this.pid = policy['_id'];
	this.config = config;
	this._MSG = this.config;
	this.msgid = this._genMsgId(this._MSG['waats_GDSCode']);
	var date = new Date();
	this.start_time = date;
	this.xml = this.gen_xml(policy);
	this.g_policy = policy;
};

Waats.prototype.parseUrl = function(url) {
	var matchs = /^((\w+):\/\/)?((\w+):?(\w+)?@)?([^\/\?:]+):?(\d+)?(\/?[^\?#]+)?\??([^#]+)?#?(\w*)/.exec(url);
	var result = {};
	if (matchs) {
		result.Username = matchs[4];
		result.Password = matchs[5];
		result.Port = matchs[7];
		result.Protocol = matchs[2];
		result.Host = matchs[6];
		result.Pathname = matchs[8];
		result.URL = matchs[0];
		result.Querystring = matchs[9];
		result.Fragment = matchs[10];
	}

	return result;
};

Waats.prototype._genMsgId = function(waats_GDSCode) {
	var date = new Date();
	var msg = sprintf("%s%04d%02d%02d%02d%02d%02d", waats_GDSCode, date.getFullYear(), date.getMonth() + 1, date
			.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
	var rand = "00000" + Math.round(Math.random() * 100000);

	return msg + rand.substring(rand.length - 6, rand.length);
};

Waats.prototype.query = function(callback) {
	var post_data = "MessageId=" + this.msgid + "&GDSCode=" + this._MSG['waats_GDSCode'];
	post_data += "&MessageType=INPN" + "&MessageText=" + this.xml;

	// console.log(post_data);

	var mod = null;

	var options = { hostname : null, port : 80, path : null, method : 'POST', instance : this };

	var urlparser = this.parseUrl(this._MSG['waats_gateway']);
	if (!urlparser) {
		return callback("parse url error!", {});
	} else {
		if (urlparser.Protocol.toLowerCase() == 'https') {
			mod = require('https');
			options.port = 443;
		} else {
			mod = require('http');
		}

		var dns = require("dns");
		dns.resolve4(urlparser.Host, function(err, address) {
			if (err) {
				callback(err, {});
			} else {
				options.hostname = address[0];
				options.path = urlparser.Pathname;
				console.log(post_data);
				var req = mod.request(options, function(res) {
					if (res && res.statusCode == 200) {
						res.on('data', function(d) {
							console.log(d.toString());
							options.instance.doModule(d, callback);
						});
					} else {
						callback("waats return response : " + res.statusCode, {});
					}
				});

				req.write(post_data);
				req.end();

				req.on('error', function(e) {
					console.error(e);
					callback(e, {});
				});
			}
		});
	}
};

/*
 * Waats.prototype.isEmpty = function(obj) { for ( var name in obj) { return
 * false; } return true; };
 */

Waats.prototype.doModule = function(buffer, callback) {
	var data = buffer.toString();
	var m_policy = this.g_policy;
	var provider = this.provider;
	if (data) {
		if (/^<startwaats>/.test(data)) {
			data_array = data.split(/\r?\n/);

			if (data_array[1] && data_array[1].length > 0 && parseInt(data_array[1]) != 0) {
				this.error_code = data_array[1];
				this.error = this.result = data_array[2];
				this.store(function(err, data) {
					callback(err, data);
				});

				return false;
			}

			var node = parser.toJson(data_array[3]);

			if (node) {
				if (typeof (node) == 'string') {
					node = eval("(" + node + ")");
				}

				xml = node.TINS_XML_DATA;
				// break if errorcode
				if (parseInt(xml.Header.ErrorCode) > 0) {
					this.error_code = xml.Header.ErrorCode;
					this.error = this.result = xml.Header.ErrorMessage;
					this.store(function(err, data) {
						callback(err, data);
					});

					return false;
				}

				if (parseInt(xml.Segment.ErrorCode) > 0) {
					if (parseInt(xml.Segment.ErrorCode) == 137) {
						var selector = { _id : g_doc['_id'], TransType : "Cancellation", ErrorCode : { $ne : "0" } };

						var options = { sort : { StartTime : 0 } };
						provider.findOne(selector, fields, options, function(err, last_msg) {
							var log_waats = { 'transAmount' : 0 - g_doc['TotalPremium'],
								'PolicyNumber' : g_doc['PolicyNumber'], 'dataRecv' : 'done', 'errorCode' : 0 };

							this.provider.update({ category : "log_waats", MsgID : last_msg['msgID'] }, log_waats, {},
									function(err, data) {
										var log_policy = {
											'_id' : this.pid,
											'logTime' : last_msg['endTime'] ? last_msg['endTime'] : Math
													.round(new Date().getTime() / 1000), 'ip' : g_doc.ip,
											'action' : 'Cancel', 'memo' : "admin cancel!", category : "log_policy" };

										this.provider.insert(log_policy, {}, {}, function(err, data) {
											var policy_new = this.g_policy;
											policy_new.PolicyNumber = "";
											policy_new.PolicyState = 'canceled';

											this.provider.update({ category : "policy", _id : this.pid }, policy_new,
													{}, function(err, data) {

													});
										});
									});
						});

						callback(false, xml);
						return true;
					}

					this.error_code = xml.Segment.ErrorCode;
					this.error = this.result = xml.Segment.ErrorMessage;
					this.store(function(err, data) {
						callback(err, data);
					});

					return false;
				}

				// return policy number for NSell
				if (this.type == 'NSell' && xml.Segment.TransactionType == 'NSell' && xml.Segment.PolicyOut
						&& xml.Segment.PolicyOut.PolicyNumber) {
					this.result = this.tidy_xml(data_array[3]);
					this.pnum = xml.Segment.PolicyOut.PolicyNumber;
					this.amount = xml.Segment.PolicyOut.TransactionPremAmt * 100;
					this.store(function(err, data) {
						var policy_new = m_policy;
						policy_new.PolicyNumber = '';
						policy_new.PolicyState = 'canceled';

						provider.update({ category : "policy", _id : this.pid }, policy_new, {}, function(err, data) {

						});
						callback(false, xml.Segment.PolicyOut.PolicyNumber);
					});

					return xml.Segment.PolicyOut.PolicyNumber;
				}
				// return whole xml for Policy
				else if (this.type == 'Policy') {
					this.result = tidy_xml(data_array[3]);
					this.pnum = xml.Segment.PolicyIn.PolicyNumber;
					this.store(function(err, data) {
						callback(false, data);
					});
				}
				// return true for Cancellation
				else if (this.type == 'Cancellation' && xml.Segment.TransactionType == 'Cancellation'
						&& xml.Segment.PolicyOut.PolicyStage == 'Cancelled') {
					this.result = tidy_xml(data_array[3]);
					this.pnum = xml.Segment.PolicyIn.PolicyNumber;
					this.amount = xml.Segment.PolicyOut.TransactionPremAmt * 100;
					this.store(function(err, data) {
						callback(false, data);
					});
				}
				// return quotation for NQuote
				else if (this.type == 'NQuote' && xml.Segment.TransactionType == 'NQuote') {
					this.result = tidy_xml(data_array[3]);
					this.store(function(err, data) {
						callback(false, xml.Segment.PolicyOut.TransactionPremAmt);
					});
				} else {
					this.error_code = 997;
					this.error = "WAATS返回结果解析失败。";
					this.result = data;
					this.store(function(err, data) {
						callback(err, data);
					});
				}
			} else {
				this.error_code = 997;
				this.error = "WAATS返回结果解析失败。";
				this.result = data;
				this.store(function(err, data) {
					callback(err, data);
				});
			}
		}
	} else {
		// waats down ...
		this.error_code = 998;
		this.error = result = "WAATS服务器暂时不可用，请稍候重试。";
		this.store(function(err, data) {
			callback(err, data);
		});
	}
};

Waats.prototype.store = function(callback) {
	var record = { 'msgID' : this.msgid, 'policyId' : this.pid, 'transType' : this.type, 'transNum' : 0,
		'transAmount' : this.amount, 'PolicyNumber' : this.pnum, 'startTime' : this.start_time,
		'dataSent' : this.tidy_xml(this.xml), 'endTime' : new Date(), 'dataRecv' : this.result,
		'errorCode' : this.error_code, 'category' : "log_waats" };

	var g_error = this.error;
	var g_result = this.result;
	this.provider.insert(record, {}, function(err, data) {
		if (err) {
			callback(err, {});
		} else {
			callback(g_error, g_result);
		}
	});
};

Waats.prototype.tidy_xml = function(string) {
	if (string) {
		string.replace(/<(Header|Address|Insured)>/i, "\n0\n");
		string.replace(/<\w+?>\w+<\/\w+>/, "\n\0");
		string.replace(/<(\w+)?\/(\w+)?>/, "\0\n");
		string.replace(/\n{2}/, "\n");
	}

	return string;
};

Waats.prototype.gen_xml_header = function() {
	header = "<Header><Version>WAATS</Version><SourceId>" + this._MSG['waats_GDSCode'] + "</SourceId><MessageId>"
			+ this.msgid + "</MessageId></Header>";

	return header;
};

Waats.prototype._getTypeCode = function(doc) {
	var birthday = new Date(doc.BirthDt.replace(/-/g, "\/"));
	var d = new Date();
	var age = d.getFullYear()
			- birthday.getFullYear()
			- ((d.getMonth() < birthday.getMonth() || d.getMonth() == birthday.getMonth()
					&& d.getDate() < birthday.getDate()) ? 1 : 0);

	doc.typeCode = age < 17 ? "CHD" : "IND";

	return doc;
};

Waats.prototype.gen_xml = function(policy) {
	var xml = '';
	var i = 0;
	if (this.type == 'NQuote') {
		xml = "<TINS_XML_DATA>";
		xml += this.gen_xml_header();
		xml += "<Segment><TransactionType>NQuote</TransactionType><PolicyIn>";
		xml += "<GDSCode>" + this._MSG['waats_GDSCode'] + "</GDSCode>";
		xml += "<AgencyPCC>" + this._MSG['waats_AgencyPCC'] + "</AgencyPCC>";
		xml += "<AgencyCode>" + this._MSG['waats_AgencyCode'] + "</AgencyCode>";
		xml += "<IATACntryCd>" + this._MSG['waats_IATACntryCd'] + "</IATACntryCd>";
		xml += "<GDSProductCode>" + policy['ProductCode'] + "</GDSProductCode>";
		xml += "<TransactionApplDate>" + date("m/d/Y h:i:s A") + "</TransactionApplDate>";
		xml += "<InceptionDate>" + this.conv_date(policy['DateStart'], false) + "</InceptionDate>";
		xml += "<ExpirationDate>" + this.conv_date(policy['DateEnd'], true) + "</ExpirationDate>";
		xml += "<TransactionEffDate>" + this.conv_date(policy['DateStart'], false) + "</TransactionEffDate>";
		xml += "<TransactionExpDate>" + this.conv_date(policy['DateStart'], true) + "</TransactionExpDate>";
		xml += "</PolicyIn>";

		for (i = 0; i < policy['Insured'].length; i++) {
			var c = policy['Insured'][i];
			this._getTypeCode(c);
			xml += "<Insured><TitleNm/><FirstNm></FirstNm><MiNm/><LastNm>" + c['Name'] + "</LastNm>";
			xml += "<InsuredTypCd>" + c['typeCode'] + "</InsuredTypCd>";
			xml += "<BirthDt>" + this.conv_birth(c['BirthDt']) + "</BirthDt>";
			xml += "<PlanCode>" + policy['PlanCode'] + "</PlanCode>";
			xml += "<Address><EmailAddr>" + (c['mail'] ? c['mail'] : "") + "</EmailAddr></Address>";

			if (c['bnfs']) {
				var j = 0;
				for (j = 0; j < c['bnfs'].length; j++) {
					bnf = c['bnfs'][j];
					xml += "<Beneficiary><FirstNm/><LastNm>" + bnf['Name'] + "</LastNm><Relation>" + bnf['Relation']
							+ "</Relation><Percentage>" + bnf['ratio'] + "</Percentage></Beneficiary>";
				}
			}

			xml += "<BenefitIn><BenefitCd>1</BenefitCd></BenefitIn>";
			xml += "<IsInsuredFlag>" + policy['Insured'].length + "</IsInsuredFlag></Insured>";
		}

		xml += "</Segment></TINS_XML_DATA>";

		this.xml = xml;
		return xml;
	} else if (this.type == 'Policy') {
		if (!policy['PolicyNumber']) {
			error = "无法查询尚未获得合同编号的保单！";
			return false;
		}

		xml = "<TINS_XML_DATA>";
		xml += this.gen_xml_header();
		xml += "<Segment><TransactionType>Policy</TransactionType>";
		xml += "<PolicyIn><PolicyNumber>" + policy['PolicyNumber'] + "</PolicyNumber>";
		xml += "<GDSCode>" + this._MSG['waats_GDSCode'] + "</GDSCode>";
		xml += "<IATACntryCd>" + this._MSG['waats_IATACntryCd'] + "</IATACntryCd>";
		xml += "</PolicyIn></Segment></TINS_XML_DATA>";

		this.xml = xml;
		return xml;
	} else if (this.type == 'NSell') {
		if (policy['PolicyState'] != 'paid') {
			this.error = "无法开出非“已付费”状态的保单！";
			return false;
		}

		/*
		 * if (policy['DateStart'] < time()) { this.error =
		 * "无法开出生效时间早于当前时间的保单！"; return false; }
		 */
		xml = "<TINS_XML_DATA>";
		xml += this.gen_xml_header();
		xml += "<Segment><TransactionType>NSell</TransactionType>";
		xml += "<TransactionId>" + this.msgid + "</TransactionId>";
		xml += "<PolicyIn><GDSCode>" + this._MSG['waats_GDSCode'] + "</GDSCode>";
		xml += "<AgencyPCC>" + this._MSG['waats_AgencyPCC'] + "</AgencyPCC>";
		xml += "<AgencyCode>" + this._MSG['waats_AgencyCode'] + "</AgencyCode>";
		xml += "<IATACntryCd>" + this._MSG['waats_IATACntryCd'] + "</IATACntryCd>";
		xml += "<GDSProductCode>" + policy['ProductCode'] + "</GDSProductCode>";
		xml += "<TransactionApplDate>" + this.std_date() + "</TransactionApplDate>";
		xml += "<InceptionDate>" + this.conv_date(policy['DateStart'], false) + "</InceptionDate>";
		xml += "<ExpirationDate>" + this.conv_date(policy['DateEnd'], true) + "</ExpirationDate>";
		xml += "<TransactionEffDate>" + this.conv_date(policy['DateStart'], false) + "</TransactionEffDate>";
		xml += "<TransactionExpDate>" + this.conv_date(policy['DateEnd'], true) + "</TransactionExpDate>";
		xml += "</PolicyIn>";

		for (i = 0; i < policy['Insured'].length; i++) {
			var c = policy['Insured'][i];
			this._getTypeCode(c);
			xml += "<Insured><TitleNm/><FirstNm></FirstNm><MiNm/><LastNm>" + c['Name'] + "</LastNm>";
			xml += "<InsuredTypCd>" + c['typeCode'] + "</InsuredTypCd>";
			xml += "<BirthDt>" + this.conv_birth(c['BirthDt']) + "</BirthDt>";
			xml += "<PlanCode>" + policy['PlanCode'] + "</PlanCode>";
			xml += "<InsuredIdNo>" + c['IdNo'] + "</InsuredIdNo>";
			xml += "<Address><EmailAddr>" + (c['mail'] ? c['mail'] : "") + "</EmailAddr></Address>";

			if (c['Bnfs']) {
				var j = 0;
				for (j = 0; j < c['Bnfs'].length; j++) {
					bnf = c['Bnfs'][j];
					xml += "<Beneficiary><FirstNm/><LastNm>" + bnf['Name'] + "</LastNm><Relation>" + bnf['Relation']
							+ "</Relation><Percentage>" + bnf['Per'] + "</Percentage></Beneficiary>";
				}
			}

			xml += "<BenefitIn><BenefitCd>1</BenefitCd></BenefitIn>";
			xml += "<IsInsuredFlag>" + policy['Insured'].length + "</IsInsuredFlag></Insured>";
		}

		xml += "</Segment></TINS_XML_DATA>";

		this.xml = xml;
		return xml;
	} else if (this.type == 'Cancellation') {
		if (policy['PolicyState'] != 'issued' || policy['dateStart'] < time()) {
			this.error = "无法取消未开出或已过期的保单！";
			return false;
		}

		xml = "<TINS_XML_DATA>";
		xml += gen_xml_header();
		xml += "<Segment><Transaction><RefundType>2</RefundType><TransactionReasons>";
		xml += "<TransactionReasonCode>10</TransactionReasonCode><TransactionReasonSubCode>101</TransactionReasonSubCode>";
		xml += "</TransactionReasons></Transaction>";
		xml += "<TransactionType>Cancellation</TransactionType><TransactionId/><PolicyIn>";
		xml += "<GDSCode>" + this._MSG['waats_GDSCode'] + "</GDSCode>";
		xml += "<AgencyPCC>" + this._MSG['waats_AgencyPCC'] + "</AgencyPCC>";
		xml += "<AgencyCode>" + this._MSG['waats_AgencyCode'] + "</AgencyCode>";
		xml += "<IATACntryCd>" + this._MSG['waats_IATACntryCd'] + "</IATACntryCd>";
		xml += "<GDSProductCode>" + policy['ProductCode'] + "</GDSProductCode>";
		xml += "<TransactionEffDate>" + this.conv_date(policy['dateStart'], false) + "</TransactionEffDate>";
		xml += "<TransactionExpDate>" + this.conv_date(policy['dateEnd'], true) + "</TransactionExpDate>";
		xml += "<PolicyNumber>" + policy['PolicyNumber'] + "</PolicyNumber>";
		xml += "<TransactionNo>0</TransactionNo>";
		xml += "</PolicyIn></Segment></TINS_XML_DATA>";

		this.xml = xml;
		return xml;
	}

	return false;
};

Waats.prototype.time = function() {
	var date = new Date();
	return Math.round(date.getTime() / 1000);
};

Waats.prototype.conv_date = function(date, end) {
	// return date("m/d/Y h:i:s A", date);
	var d = new Date(date);
	if (/\d{10}/.test(date)) d.setTime(date * 1000);

	var result = sprintf("%02d/%02d/%04d", d.getMonth() + 1, d.getDate(), d.getFullYear());
	if (end) {
		result += " 11:59:59 PM";
	} else {
		result += " 12:00:00 AM";
	}

	return result;
};

Waats.prototype.conv_birth = function(date) {
	// return date("m/d/Y", strtotime(date));
	var d = new Date(date);

	return sprintf("%02d/%02d/%04d", d.getMonth() + 1, d.getDate(), d.getFullYear());
};

Waats.prototype.std_date = function() {
	var d = new Date();
	var result = sprintf("%02d/%02d/%04d %02d:%02d:%02d ", d.getMonth() + 1, d.getDate(), d.getFullYear(),
			d.getHours() % 12, d.getMinutes(), d.getSeconds());

	if (d.getHours() > 11) {
		result += "PM";
	} else {
		result += "AM";
	}

	return result;
};

module.exports = Waats;
