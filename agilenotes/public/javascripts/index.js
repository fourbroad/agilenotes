var designMode='develop';

if(designMode=='develop'){
document.write('\
<link rel="stylesheet" href="stylesheets/jquery-ui-1.8.24.custom.css" type="text/css">\
<link rel="stylesheet" href="stylesheets/jquery.ui.timepicker.css" type="text/css">\
<link rel="stylesheet" href="stylesheets/jquery.an.menu.css" type="text/css">\
<link rel="stylesheet" href="stylesheets/jquery.an.agilegrid.css" type="text/css">\
<link rel="stylesheet" href="stylesheets/jquery.an.tree.css" type="text/css">\
<link rel="stylesheet" href="stylesheets/jquery.an.workbench.css" type="text/css">\
<link rel="stylesheet" href="stylesheets/jquery.an.border.css" type="text/css">\
<link rel="stylesheet" href="stylesheets/jquery.an.tabsx.css" type="text/css">\
<link rel="stylesheet" href="stylesheets/jquery.an.tabsxwidget.css" type="text/css">\
<link rel="stylesheet" href="stylesheets/jquery.an.box.css" type="text/css">\
<link rel="stylesheet" href="stylesheets/jquery.an.toolbar.css" type="text/css">\
<link rel="stylesheet" href="stylesheets/jquery.an.page.css" type="text/css">\
<link rel="stylesheet" href="stylesheets/jquery.an.form.css" type="text/css">\
<link rel="stylesheet" href="stylesheets/jquery.an.formview.css" type="text/css">\
<link rel="stylesheet" href="stylesheets/jquery.an.editor.css" type="text/css">\
<link rel="stylesheet" href="stylesheets/jquery.an.widget.css" type="text/css">\
<link rel="stylesheet" href="stylesheets/jquery.an.fileinput.css" type="text/css">\
<link rel="stylesheet" href="stylesheets/jquery.an.filefield.css" type="text/css">\
<link rel="stylesheet" href="stylesheets/jquery.an.gridfield.css" type="text/css">\
<link rel="stylesheet" href="stylesheets/jquery.an.authorization.css" type="text/css">\
<link rel="stylesheet" href="stylesheets/jquery.colorpicker.css" type="text/css">\
<link rel="stylesheet" href="stylesheets/jquery.ui.select.css" type="text/css">\
<link rel="stylesheet" href="stylesheets/rte/paddinginput.css" type="text/css">\
<link rel="stylesheet" href="stylesheets/jquery.an.rte.css" type="text/css">\
<link rel="stylesheet" href="stylesheets/base.css" type="text/css">\
<script src="javascripts/lib/model.js"><\/script>\
<script src="javascripts/lib/utils.js"><\/script>\
<script src="javascripts/lib/objectid.js"><\/script>\
<script src="javascripts/jquery-1.8.2.js"><\/script>\
<script src="javascripts/jquery.ans.js"><\/script>\
<script src="javascripts/jquery.an.metadata.js"><\/script>\
<script src="javascripts/jquery.validate.js"><\/script>\
<script src="javascripts/jquery.json-2.2.js"><\/script>\
<script src="javascripts/jquery.mousewheel.js"><\/script>\
<script src="javascripts/jquery.scrollto.js"><\/script>\
<script src="javascripts/jquery-ui-1.8.24.custom.js"><\/script>\
<script src="javascripts/jquery.ui.timepicker.js"><\/script>\
<script src="javascripts/jquery.form.js"><\/script>\
<script src="javascripts/widgets/jquery.an.widget.js"><\/script>\
<script src="javascripts/widgets/jquery.an.field.js"><\/script>\
<script src="javascripts/widgets/jquery.an.box.js"><\/script>\
<script src="javascripts/widgets/jquery.an.inputfield.js"><\/script>\
<script src="javascripts/jquery.an.fileinput.js"><\/script>\
<script src="javascripts/widgets/jquery.an.textfield.js"><\/script>\
<script src="javascripts/widgets/jquery.an.radiofield.js"><\/script>\
<script src="javascripts/widgets/jquery.an.checkboxfield.js"><\/script>\
<script src="javascripts/widgets/jquery.an.passwordfield.js"><\/script>\
<script src="javascripts/widgets/jquery.an.datetimefield.js"><\/script>\
<script src="javascripts/widgets/jquery.an.textareafield.js"><\/script>\
<script src="javascripts/widgets/jquery.an.rtefield.js"><\/script>\
<script src="javascripts/widgets/jquery.an.selectfield.js"><\/script>\
<script src="javascripts/widgets/jquery.an.filefield.js"><\/script>\
<script src="javascripts/widgets/jquery.an.gridfield.js"><\/script>\
<script src="javascripts/widgets/jquery.an.jsrenderfield.js"><\/script>\
<script src="javascripts/widgets/jquery.an.buttonwidget.js"><\/script>\
<script src="javascripts/widgets/jquery.an.tabsxwidget.js"><\/script>\
<script src="javascripts/jquery.an.tree.js"><\/script>\
<script src="javascripts/jquery.cookie.js"><\/script>\
<script src="javascripts/jquery.hotkeys.js"><\/script>\
<script src="javascripts/jquery.an.menu.js"><\/script>\
<script src="javascripts/jquery.an.border.js"><\/script>\
<script src="javascripts/jquery.an.rte.js"><\/script>\
<script src="javascripts/jquery.an.tabsx.js"><\/script>\
<script src="javascripts/jquery.an.explorer.js"><\/script>\
<script src="javascripts/jquery.an.page.js"><\/script>\
<script src="javascripts/jquery.an.form.js"><\/script>\
<script src="javascripts/jquery.an.agilegrid.js"><\/script>\
<script src="javascripts/jquery.an.toolbar.js"><\/script>\
<script src="javascripts/jquery.an.view.js"><\/script>\
<script src="javascripts/jquery.an.gridview.js"><\/script>\
<script src="javascripts/jquery.an.formview.js"><\/script>\
<script src="javascripts/jquery.an.customview.js"><\/script>\
<script src="javascripts/jquery.an.editor.js"><\/script>\
<script src="javascripts/jquery.an.sideview.js"><\/script>\
<script src="javascripts/jquery.an.workbench.js"><\/script>\
<script src="javascripts/jquery.an.authorization.js"><\/script>\
<script src="javascripts/jquery-css-transform.js"><\/script>\
<script src="javascripts/jquery.easing.1.3.js"><\/script>\
<script src="javascripts/jquery-animate-css-rotate-scale.js"><\/script>\
<script src="javascripts/jquery.quicksand.js"><\/script>\
<script src="javascripts/jquery.ui.colorpicker.js"><\/script>\
<script src="javascripts/lib/rte/jquery.borderselect.js"><\/script>\
<script src="javascripts/lib/rte/jquery.paddinginput.js"><\/script>\
<script src="javascripts/jquery.ui.select.js"><\/script>\
<script src="javascripts/lib/rte/rteDom.js"><\/script>\
<script src="javascripts/lib/rte/rteSelection.js"><\/script>\
<script src="javascripts/lib/rte/w3cRange.js"><\/script>\
<script src="javascripts/json2.js"><\/script>\
<script src="javascripts/jsrender.js"><\/script>\
<script src="javascripts/widgets/jquery.an.searchfield.js"><\/script>\
<script src="javascripts/widgets/jquery.an.sliderwidget.js"><\/script>\
<script src="javascripts/widgets/jquery.an.collapsiblewidget.js"><\/script>\
');
}else{
document.write('<link rel="stylesheet" href="stylesheets/uicombin.css" type="text/css">');
document.write('\
<script src="javascripts/jquery-1.8.2.min.js"><\/script>\
<script src="javascripts/jquery-ui-1.8.24.custom.min.js"><\/script>\
<script src="javascripts/agnotes.js?v=0.0.1"><\/script>\
');
}
