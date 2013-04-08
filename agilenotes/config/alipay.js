var path = require('path');
exports.AlipayConfig = {
// 合作身份者ID，以2088开头由16位纯数字组成的字符串
    partner:"2088401855323333",

// 交易安全检验码，由数字和字母组成的32位字符串
    key:"es37zm8pnba2l183a5nbq3gch672cmdg",

// 签约支付宝账号或卖家收款支付宝帐户
    seller_email:"pay@zaitu.cn",

// 支付宝服务器通知的页面 要用 http://格式的完整路径，不允许加?id:123这类自定义参数
// 必须保证其地址能够在互联网中访问的到
    notify_url:"http://192.168.1.40/dbs/513417a59239e279a7000000/paynotify",

// 当前页面跳转后的页面 要用 http://格式的完整路径，不允许加?id:123这类自定义参数
// 域名不能写成http://localhost/create_direct_pay_by_user_jsp_utf8/return_url.jsp ，否则会导致return_url执行无效
    return_url:"http://192.168.1.40/dbs/513417a59239e279a7000000/payreturn",

//      支付宝通知验证地址

    ALIPAY_HOST: "mapi.alipay.com",
    HTTPS_VERIFY_PATH: "/gateway.do?service=notify_verify&",
    ALIPAY_PATH:"gateway.do?",


// 调试用，创建TXT日志路径
    log_path:"~/alipay_log_.txt",

// 字符编码格式 目前支持 gbk 或 utf-8
    input_charset:"utf-8",

// 签名方式 不需修改
    sign_type:"MD5"
};
