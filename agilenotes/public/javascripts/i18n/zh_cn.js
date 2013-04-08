;(function($){

$.i18n = $.i18n || {};
$.extend($.i18n,{
	save:"保存",
	print:"打印",
	cut:"剪切",
	copy:"拷贝",
	paste:"粘贴",
	undo:"撤消",
	redo:"恢复",
	startNew: "新建 ...",
	newForm: "表单",
	newDocument: "文档",
	newView: "视图",
	newPage: "页面",
	showSideView:"显示视图",
	explorer: "浏览器",
	outline: "纲要",
	organization: "组织",
	groups: "组",
	roles: "角色"
});

$.i18n.gridfield={
	addItemLabel: "新增",
	editItemLabel: "编辑",
	deleteItemLabel: "删除"
}

$.i18n.datepicker={
	closeText: '完成', // Display text for close link
	prevText: '上一页', // Display text for previous month link
	nextText: '下一页', // Display text for next month link
	currentText: '今天', // Display text for current month link
	monthNames: ['一月','二月','三月','四月','五月','六月',
		'七月','八月','九月','十月','十一月','十二月'], // Names of months for drop-down and formatting
	monthNamesShort: ['一月','二月','三月','四月','五月','六月',
		'七月','八月','九月','十月','十一月','十二月'], // For formatting
	dayNames: ['星期天', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'], // For formatting
	dayNamesShort: ['日', '一', '二', '三', '四', '五', '六'], // For formatting
	dayNamesMin: ['日', '一', '二', '三', '四', '五', '六'],  // Column headings for days starting at Sunday
	weekHeader: '星期'
}
$.i18n.validate={
		required: "请输入信息",
		remote: "请修改此处信息",
		email: "请输出有效的邮箱",
		url: "请输入合法的URL",
		date: "请输入有效的日期",
		dateISO: "请输入有效的日期(ISO)",
		number: "请输入有效的数字",
		digits: "只能输入点",
		creditcard: "请输入有效的信用卡卡号",
		equalTo: "请再一次输入同样的值",
		accept: "请输入一个有效的扩展值",
		maxlength: $.validator.format("请不要输入多于{0}个字符."),
		minlength: $.validator.format("最少输入{0}个字符"),
		rangelength: $.validator.format("请输入少于{0}个且不多于{1}个字符长度"),
		range: $.validator.format("请输入一个值在{0}和{1}之间"),
		max: $.validator.format("请输入一个小于或等于{0}的值"),
		min: $.validator.format("请输入一个大于或等于{0}的值")
}
})(jQuery);