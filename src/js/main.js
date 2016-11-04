/**
 * Created by linxiaojie on 2016/11/4.
 */
$(function(){

    /*页面框架最小宽度设置*/
    var $footer = $('.footer');
    var height = $(window).height();
    $('.right-content').css({
        'min-height': $(window).height() - ($footer.length > 0 ? $footer.height() : 0) + 'px'
    })
});