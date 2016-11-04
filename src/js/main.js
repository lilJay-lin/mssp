/**
 * Created by linxiaojie on 2016/11/4.
 */
$(function(){
    /*util*/
    var util = (function(){
        var tokenReg = /(\\)?\{([^\{\}\\]+)(\\)?\}/g;
        /*
         * 渲染，
         * param{html string} template,
         * param{obj} context
         * 根据传入String做变量替换，返回替换之后的字符串
         */
        function render(template, context) {
            return template.replace(tokenReg, function (word, slash1, token, slash2) {
                if (slash1 || slash2) {
                    return word.replace('\\', '');
                }

                var variables = token.replace(/\s/g, '').split('.');
                var currentObject = context;
                var i, length, variable;

                for (i = 0, length = variables.length; i < length; ++i) {
                    variable = variables[i];
                    currentObject = currentObject[variable];
                    if (currentObject === undefined || currentObject === null) return '';
                }
                return currentObject;
            })
        }

        /*不处理多重内嵌的数组，只处理一元数组*/
        function renderArray(template, arr){
            if(arr == null || !$.isArray(arr)){
                return template;
            }
            var html = '', obj = {};
            $.each(arr, function(i){
                if(toString.call(arr[i]) == '[object Object]'){
                    obj = arr[i];
                    obj._order = i + 1;
                }else{
                    obj.value = arr[i];
                    obj._order = i + 1;
                }
                html += render(template, obj);
            })
            return html;
        }
        return {
            compile: function(template, data){
                var html = ''
                if($.isArray(data)){
                    html = renderArray(template, data)
                }else{
                    html = render(template, data)
                }
                return html;
            }
        }
    })();
    /*页面框架最小宽度设置*/
    var $footer = $('.footer');
    var height = $(window).height();
    $('.right-content').css({
        'min-height': $(window).height() - ($footer.length > 0 ? $footer.height() : 0) + 'px'
    })

    /*侧边栏*/
    function Slider(el, data){
        this.$el = $(el);
        this.data = data || [];
        this.init();
    }
    Slider.prototype = {
        parentTpl: '<li class="submenu open"><a href="#" class="js-menu"><i class="icon icon-th-list"></i> <span>{name}</span></a><ul>{child}</ul></li>',
        childTpl: '<li data-sk="{sk}"><a href="{href}">{name}</a></li>',
        init: function(){
            var me = this;
            if(!me.$el || me.$el.length == 0 || !$.isArray(me.data)){
                return;
            }
            me._render();
            me._bindEvent();
            me._checkSelected();
        },
        _bindEvent: function(){
            this.$el.delegate('.js-menu', 'click', function(e){
                var $el = $(this).closest('.submenu');
                $el.toggleClass('open')
            })
        },
        goTo: function(toName, qstr){
            var me = this;
            $.each(me.data, function(i){
                var $els = null, obj = this,name = '', str = '', child = obj.child, href = '';
                var key = 'p_' + i + '_c_', tKey = '';
                if($.isArray(child)){
                    $.each(child, function(j){
                        name = this.name;
                        if (toName == name){
                            tKey = key + j;
                            return false;
                        }
                    })
                }
                if(tKey != ''){
                    $els = me.$el.find('li[data-sk="' + tKey + '"]');
                    if($els.length > 0){
                        href = $els.find('a').eq(0).attr('href') + (typeof qstr == 'undefined' ? '' : qstr);
                        window.location.href = href;
                    }
                    return false;
                }
            })
        },
        _checkSelected: function(){
            var me = this,
                skReg = /[&\s\?]sk=([^&\s\?]*)/;
                match = skReg.exec(location.search),
                    sk = '',
                $els = null;
            if(match.length > 0 ){
                sk = (match[1]|| '').trim();
                if(sk){
                    $els = me.$el.find('li[data-sk="' + sk + '"]');
                    if($els.length > 0){
                        me.$el.find('li').removeClass('active');
                        $els.addClass('active');
                    }

                }
            }
        },
        _render: function(){
            var me = this, html = '';
            if(!me.$el || me.$el.length == 0 || !$.isArray(me.data)){
                return;
            }
            $.each(me.data, function(i){
                var obj = this, str = '', child = obj.child, href = '', idx = -1;
                var key = 'p_' + i + '_c_', tKey;
                if($.isArray(child)){
                    $.each(child, function(j){
                        href = this.href;
                        idx = this.href.indexOf('?');
                        tKey = key + j;
                        this['sk'] = tKey
                        this['href'] = href + (idx == -1 ? '?' : '&') + 'sk=' + tKey
                    })
                    str = util.compile(me.childTpl, child);
                }
                html += util.compile(me.parentTpl, {name: obj.name, child: str});
            });
            me.$el.html(html)
        }
    }
    var slider = new Slider('.js-slider-container', [
        {
            name: '活动管理',
            child: [
                {
                    name: '所有活动',
                    href: './所有活动.html'
                },
                {
                    name: '参与活动用户记录',
                    href: './参与活动用户记录.html'
                },
                {
                    name: '黑名单管理',
                    href: './黑名单管理.html'
                },
                {
                    name: '活动渠道管理',
                    href: './活动渠道管理.html'
                }
            ]
        },
        {
            name: '奖品管理',
            child: [
                {
                    name: '奖品池管理',
                    href: './奖品池管理.html'
                },
                {
                    name: '活动奖池信息查询',
                    href: './活动奖池信息查询.html'
                },
                {
                    name: '奖品池录入明细',
                    href: './奖品池录入明细.html'
                },
                {
                    name: '奖品池使用明细',
                    href: './奖品池使用明细.html'
                }
            ]
        },
        {
            name: '数据报表',
            child: [
                {
                    name: '整体数据统计',
                    href: './整体数据统计.html'
                },
                {
                    name: '访问数据统计',
                    href: './访问数据统计.html'
                },
                {
                    name: '应用下载数据统计',
                    href: './应用下载数据统计.html'
                },
                {
                    name: '奖品池使用明细',
                    href: './奖品池使用明细.html'
                }
            ]
        }
    ]);
});