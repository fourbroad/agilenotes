/* *
 *类名：AlipayConfig
 *功能：基础配置类
 *详细：设置帐户有关信息及返回路径
 *版本：3.2
 *日期：2011-03-17
 *说明：
 *以下代码只是为了方便商户测试而提供的样例代码，商户可以根据自己网站的需要，按照技术文档编写,并非一定要使用该代码。
 *该代码仅供学习和研究支付宝接口使用，只是提供一个参考。

 *提示：如何获取安全校验码和合作身份者ID
 *1.用您的签约支付宝账号登录支付宝网站(www.alipay.com)
 *2.点击“商家服务”(https://b.alipay.com/order/myOrder.htm)
 *3.点击“查询合作者身份(PID)”、“查询安全校验码(Key)”

 *安全校验码查看时，输入支付密码后，页面呈灰色的现象，怎么办？
 *解决方法：
 *1、检查浏览器配置，不让浏览器做弹框屏蔽设置
 *2、更换浏览器或电脑，重新登录查询。
 */
// var AlipayConfig = require('../config/alipay.js').AlipayConfig;
Alipay = function(AlipayConfig) {
	this.AlipayConfig = AlipayConfig;
};

Alipay.prototype.verity = function(params, callback) {

	var mysign = this.getMySign(params);
	var sign = params["sign"] ? params["sign"] : "";
	console.log("mysign:" + mysign + ";sign:" + sign);
	if (mysign == sign) {
		if (params["notify_id"]) {
			// 获取远程服务器ATN结果，验证是否是支付宝服务器发来的请求

			var partner = this.AlipayConfig.partner;
			var veryfy_path = this.AlipayConfig.HTTPS_VERIFY_PATH + "partner=" + partner + "&notify_id="
					+ params["notify_id"];

			this.requestUrl(this.AlipayConfig.ALIPAY_HOST, veryfy_path, function(responseTxt) {
				if (responseTxt) {
					callback(responseTxt);
				} else {
					callback(false);
				}
			});
		}
	} else {
		callback(false);
	}
	// 写日志记录（若要调试，请取消下面两行注释）
	// String sWord = "responseTxt=" + responseTxt + "\n notify_url_log:sign=" +
	// sign + "&mysign="
	// + mysign + "\n 返回参数：" + AlipayCore.createLinkString(params);
	// AlipayCore.logResult(sWord);

	// 验证
	// responsetTxt的结果不是true，与服务器设置问题、合作身份者ID、notify_id一分钟失效有关
	// mysign与sign不等，与安全校验码、请求时的参数格式（如：带自定义参数等）、编码格式有关
};

//获取验证码
Alipay.prototype.getMySign = function(params) {
	var sPara = [];// 转换为数组利于排序 除去空值和签名参数
	if (!params) return null;
	for ( var key in params) {
		console.log(params[key]);
		if ((!params[key]) || key == "sign" || key == "sign_type") {
			console.log('null:' + key);
			continue;
		}
		;
		sPara.push([ key, params[key] ]);
	}
	sPara.sort();
	// 生成签名结果
	var prestr = "";
	// 把数组所有元素，按照“参数=参数值”的模式用“&”字符拼接成字符串
	for ( var i2 = 0; i2 < sPara.length; i2++) {
		var obj = sPara[i2];
		if (i2 == sPara.length - 1) {
			prestr = prestr + obj[0] + "=" + obj[1];
		} else {
			prestr = prestr + obj[0] + "=" + obj[1] + "&";
		}

	}
	prestr = prestr + this.AlipayConfig.key; // 把拼接后的字符串再与安全校验码直接连接起来
	// body=Hello&buyer_email=13758698870&buyer_id=2088002007013600&discount=-5&extra_common_param=你好，这是测试商户的广告。&gmt_close=2008-10-22
	// 20:49:46&gmt_create=2008-10-22 20:49:31&gmt_payment=2008-10-22
	// 20:49:50&gmt_refund=2008-10-29
	// 19:38:25&is_total_fee_adjust=N&notify_id=70fec0c2730b27528665af4517c27b95&notify_time=2009-08-12
	// 11:08:32&notify_type=交易状态同步通知(trade_status_sync)&out_trade_no=3618810634349901&payment_type=1&price=10.00&quantity=1&refund_status=REFUND_SUCCESS&seller_email=chao.chenc1@alipay.com&seller_id=2088002007018916&sign=_p_w_l_h_j0b_gd_aejia7n_ko4_m%2Fu_w_jd3_nx_s_k_mxus9_hoxg_y_r_lunli_pmma29_t_q%3D%3D&sign_type=DSA&subject=iphone手机&total_fee=10.00&trade_no=2008102203208746&trade_status=TRADE_FINISHED&use_coupon=N
	var crypto = require('crypto');
	return crypto.createHash('md5').update(prestr, 'utf8').digest("hex");
};

Alipay.prototype.requestUrl = function(host, path, callback) {
	var https = require('https');

	var options = { host : host, port : 443, path : path, method : 'GET' };

	var req = https.request(options, function(res) {
		console.log("statusCode: ", res.statusCode);
		console.log("headers: ", res.headers);

		res.on('data', function(d) {
			callback(d);
		});
	});
	req.end();

	req.on('error', function(e) {
		console.error(e);
	});
};

/**
 * 在应用中发送付款请求，替换掉构造form的应用
 * // 请与贵网站订单系统中的唯一订单号匹配
	var out_trade_no = out_trade_no;
	// 订单名称，显示在支付宝收银台里的“商品名称”里，显示在支付宝的交易管理的“商品名称”的列表里。
	var subject = subject;
	// 订单描述、订单详细、订单备注，显示在支付宝收银台里的“商品描述”里
	var body = body;
	// 默认网银代号，代号列表见“即时到帐接口”技术文档“附录”→“银行列表”
	var defaultbank = defaultbank;
 * @param req
 * @param res
 */
Alipay.prototype.alipayto = function(subject, body, fee, defaultbank, out_trade_no) {
	// ////////////////////////////////////////////////////////////////////////////////
	
	/**
	 * 构造即时到帐接口
	 * 
	 * @param sParaTemp
	 *            请求参数集合
	 * @return 表单提交HTML信息
	 */
	
	var AlipayConfig = this.AlipayConfig;
	var create_direct_pay_by_user = function(sParaTemp) {
		// 增加基本配置
		sParaTemp.push([ "service", "create_direct_pay_by_user" ]);
		sParaTemp.push([ "partner", AlipayConfig.partner ]);
		sParaTemp.push([ "return_url", AlipayConfig.return_url ]);
		sParaTemp.push([ "notify_url", AlipayConfig.notify_url ]);
		sParaTemp.push([ "seller_email", AlipayConfig.seller_email ]);
		sParaTemp.push([ "_input_charset", AlipayConfig.input_charset ]);

		/**
		 * 构造提交表单HTML数据
		 * 
		 * @param sParaTemp
		 *            请求参数数组
		 * @param gateway
		 *            网关地址
		 * @param strMethod
		 *            提交方式。两个值可选：post、get
		 * @param strButtonName
		 *            确认按钮显示文字
		 * @return 提交表单HTML文本
		 */
		var buildURL = function(sParaTemp) {
			/**
			 * 生成要请求给支付宝的参数数组
			 * 
			 * @param sParaTemp
			 *            请求前的参数数组
			 * @return 要请求的参数数组
			 */
			var buildRequestPara = function(sParaTemp) {
				var sPara = [];
				// 除去数组中的空值和签名参数
				for ( var i1 = 0; i1 < sParaTemp.length; i1++) {
					var value = sParaTemp[i1];
					if (value[1] == null || value[1] == "" || value[0] == "sign" || value[0] == "sign_type") {
						continue;
					}
					sPara.push(value);
				}
				sPara.sort();
				// 生成签名结果
				var prestr = "";
				// 把数组所有元素，按照“参数=参数值”的模式用“&”字符拼接成字符串
				for ( var i2 = 0; i2 < sPara.length; i2++) {
					var obj = sPara[i2];
					if (i2 == sPara.length - 1) {
						prestr = prestr + obj[0] + "=" + obj[1];
					} else {
						prestr = prestr + obj[0] + "=" + obj[1] + "&";
					}

				}
				prestr = prestr + AlipayConfig.key; // 把拼接后的字符串再与安全校验码直接连接起来
				console.log(prestr);
				var crypto = require('crypto');
				var mysign = crypto.createHash('md5').update(prestr, 'utf8').digest("hex");
				// 签名结果与签名方式加入请求提交参数组中
				sPara.push([ "sign", mysign ]);
				sPara.push([ "sign_type", AlipayConfig.sign_type ]);

				return sPara;
			};
			// 待请求参数数组
			var sPara = buildRequestPara(sParaTemp);
			var path = AlipayConfig.ALIPAY_PATH;

			for ( var i3 = 0; i3 < sPara.length; i3++) {
				var obj = sPara[i3];
				var name = obj[0];
				var value = obj[1];
				if (i3 < (sPara.length - 1)) {
					path = path + name + "=" + value + "&";
				} else {
					path = path + name + "=" + value;
				}
			}
			return path.toString();
		};

		return buildURL(sParaTemp);
	};

	// 订单总金额，显示在支付宝收银台里的“应付总额”里
	var total_fee = fee;

	// 扩展功能参数——默认支付方式//

	// 默认支付方式，取值见“即时到帐接口”技术文档中的请求参数列表
	var paymethod = "bankPay";
	// 扩展功能参数——防钓鱼//

	// 防钓鱼时间戳
	var anti_phishing_key = "";
	// 获取客户端的IP地址，建议：编写获取客户端IP地址的程序
	var exter_invoke_ip = "";
	// 注意：
	// 1.请慎重选择是否开启防钓鱼功能
	// 2.exter_invoke_ip、anti_phishing_key一旦被设置过，那么它们就会成为必填参数
	// 3.开启防钓鱼功能后，服务器、本机电脑必须支持远程XML解析，请配置好该环境。
	// 4.建议使用POST方式请求数据
	// 示例：
	// anti_phishing_key = AlipayService.query_timestamp(); //获取防钓鱼时间戳函数
	// exter_invoke_ip = "202.1.1.1";

	// 扩展功能参数——其他///

	// 自定义参数，可存放任何内容（除=、&等特殊字符外），不会显示在页面上
	var extra_common_param = "";
	// 默认买家支付宝账号
	var buyer_email = "";
	// 商品展示地址，要用http:// 格式的完整路径，不允许加?id=123这类自定义参数
	// var show_url = "http://www.xxx.com/order/myorder.jsp";

	// 扩展功能参数——分润(若要使用，请按照注释要求的格式赋值)//

	// 提成类型，该值为固定值：10，不需要修改
	var royalty_type = "";
	// 提成信息集
	var royalty_parameters = "";
	// 注意：
	// 与需要结合商户网站自身情况动态获取每笔交易的各分润收款账号、各分润金额、各分润说明。最多只能设置10条
	// 各分润金额的总和须小于等于total_fee
	// 提成信息集格式为：收款方Email_1^金额1^备注1|收款方Email_2^金额2^备注2
	// 示例：
	// royalty_type = "10"
	// royalty_parameters = "111@126.com^0.01^分润备注一|222@126.com^0.01^分润备注二"

	// 把请求参数打包成数组
	var sParaTemp = [];
	sParaTemp.push([ "payment_type", "1" ]);
	sParaTemp.push([ "out_trade_no", out_trade_no ]);
	sParaTemp.push([ "subject", subject ]);
	sParaTemp.push([ "body", body ]);
	sParaTemp.push([ "total_fee", total_fee ]);
	// sParaTemp.push(["show_url", show_url]);
	sParaTemp.push([ "paymethod", paymethod ]);
	sParaTemp.push([ "defaultbank", defaultbank ]);
	sParaTemp.push([ "anti_phishing_key", anti_phishing_key ]);
	sParaTemp.push([ "exter_invoke_ip", exter_invoke_ip ]);
	sParaTemp.push([ "extra_common_param", extra_common_param ]);
	sParaTemp.push([ "buyer_email", buyer_email ]);
	sParaTemp.push([ "royalty_type", royalty_type ]);
	sParaTemp.push([ "royalty_parameters", royalty_parameters ]);

	// 构造函数，生成请求URL
	var sURL = create_direct_pay_by_user(sParaTemp);
	sURL = encodeURI(sURL);
	return "https://" + AlipayConfig.ALIPAY_HOST + "/" + sURL;
};

exports.Alipay = Alipay;