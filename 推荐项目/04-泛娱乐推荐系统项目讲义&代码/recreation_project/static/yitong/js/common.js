/**
 * Created by Villen on 18/7/13.
 */
var GlobalParam={};
GlobalParam.apiHost='http://39.106.254.132:8087/api';


/*提示*/
function showTip(msg) {
    if($('#showTip').length==0){
        $('body').append('<div id="showTip"></div>')
    }
    var tipDom=$('#showTip');
    tipDom.html(msg).fadeIn();
    setTimeout(function () {
        tipDom.fadeOut();
    },2000)
}

function showWait() {
    if($('#showWait').length==0){
        $('body').append('<div id="showWait"></div>')
    }
    var tipDom=$('#showWait');
    tipDom.html("请稍等...").fadeIn();
}

function hideWait() {
    var tipDom=$('#showWait');
    tipDom.fadeOut();
}

/*获取参数*/
function getUrlString(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) {
        return decodeURIComponent(r[2]);
    } else if (name == 'd_source' && r == null) {
        var reg = new RegExp("(^|&)d=([^&]*)(&|$)");
        var r = window.location.search.substr(1).match(reg);
        if (r != null) {
            return 'toutiao';
        }
    }
    return '';
}