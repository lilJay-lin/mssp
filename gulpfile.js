/* jshint -W097*/
/* jshint node:true */

'use strict';

var browserSync = require('browser-sync').create(),
    path = require('path'),
    gulp = require('gulp'),
    del = require('del'),
    fs = require('fs'),
    $ = require('gulp-load-plugins')(),
    changed = require('gulp-changed'),
    base64 = require('gulp-base64'),
    runSequence = require('run-sequence'),
    parseArgs  = require('minimist');
var date = new Date();
var m = date.getMonth() + 1,
    d = date.getDate();
var argv = parseArgs(process.argv.slice(2),{
    string: ['f', 'o'],
    default: {
        'f': 'nofound',
        'p': 3000,
        'o': date.getFullYear() + '' + (m < 10 ? '0' + m : m) + '' + (d < 10 ? '0' + d : d)//输出文件名
    }
});

var pth = 'src/' + (argv.f == 'nofound' ? '' : argv.f),
    dist = 'dist/' + (argv.f == 'nofound' ? '' : argv.f),
    port = argv.p;
var isProduction = false;
var config = {
    dist:{
        css: dist + '/css',
        js: dist + '/js',
        img: dist + '/images',
        html: dist,
        font: dist + '/font',
        vendor: dist
    },
    build: {
        zip: 'dist/build',
        js:  pth + '/js/*.js',
        less:  pth + '/css/*.*',
        img: pth + '/images/*.*',
        html: pth + '/*.html',
        font: pth + '/font/*.*',
        vendor:  pth + '/**/*.js',
    },
    AUTOPREFIXER_BROWSERS: [
        'ie >= 8',
        'ie_mob >= 10',
        'ff >= 30',
        'chrome >= 34',
        'safari >= 7',
        'opera >= 23',
        'ios >= 7',
        'android >= 2.3',
        'bb >= 10'
    ],
    uglify: {
        compress: {
            warnings: false
        },
        output: {
            ascii_only: true
        }
    }
};


/*gulp.task("webpack", function(callback) {
 var myConfig = Object.create(webpackConfig);
 // run webpack
 webpack(
 // configuration
 myConfig
 , function(err, stats) {
 // if(err) throw new gutil.PluginError("webpack", err);
 // gutil.log("[webpack]", stats.toString({
 //     // output options
 // }));
 callback();
 //this.emit('end');//报错不中断
 });
 });*/

gulp.task('appServer',function(){
    var dir = './dist/' +  (argv.f == 'nofound' ? '' :  argv.f + '/');
    /*    var files = [
     dir + '/!**!/!*.*'
     ];*/
    browserSync.init({
        server: {
            baseDir: dir
        },
        open: false,
        browser: ['google chrome'],
        port: port
    });

    //gulp.watch(config.build.less, ['less-watch']);
});
//创建一个任务确保JS任务完成之前能够继续响应
// 浏览器重载
/*
gulp.task('less-watch', ['build:less'], browserSync.reload);
gulp.task('js-watch', ['build:js'], browserSync.reload);
*/

/*
 gulp.task('lint', function() {
 return gulp.src(config.build.js)
 .pipe($.jshint())
 .pipe($.jshint.reporter('hint'));
 });
 */


gulp.task("build:js", function(){
    return gulp.src(config.build.js,{sourcemaps: true})
        //.pipe($.if(!isProduction, $.watch(config.build.js)))
        .pipe($.plumber({errorHandler: function (err) {
            // 处理编译less错误提示  防止错误之后gulp任务直接中断
            // $.notify.onError({
            //           title:    "编译错误",
            //           message:  "错误信息: <%= error.message %>",
            //           sound:    "Bottle"
            //       })(err);
            console.log(err);
            this.emit('end');
        }}))
        .pipe(changed(config.dist.js))
        //.pipe($.if(isProduction, $.sourcemaps.init()))
        //.pipe($.jshint())
        //.pipe($.jshint.reporter('default'))
        .pipe($.if(isProduction, $.uglify()))
        //.pipe($.if(isProduction, $.sourcemaps.write()))
        //.pipe($.rev()) //添加MD5
        .pipe($.plumber.stop())
        .pipe(gulp.dest(config.dist.js))
        .pipe(browserSync.stream())
        .pipe($.size({showFiles: true, title: 'uglify'}))
        .pipe($.size({showFiles: true, gzip: true, title: 'gzipped'}));
});

gulp.task("build:less", function(){
    return gulp.src(config.build.less)
        //.pipe($.if(!isProduction, $.watch(config.build.less)))
        .pipe($.plumber({errorHandler: function (err) {
            console.log(err);
            this.emit('end');
        }}))
        .pipe(changed(config.dist.css, {extension: '.css'}))
        .pipe($.less({
            paths: [ path.join(__dirname, 'src/common') , path.join(__dirname, pth, '/css')]
        }))
        .pipe(base64({
            baseDir: path.join(__dirname, pth + '/base64/'),
            extensions: ['svg', 'png', /\.jpg#datauri$/i],
            exclude:    [/\.server\.(com|net)\/dynamic\//, '--live.jpg'],
            maxImageSize: 8*1024, // bytes
            /*debug: false*/
        }))
        .pipe($.autoprefixer({browsers: config.AUTOPREFIXER_BROWSERS}))
        .pipe($.size({showFiles: true, title: 'source'}))
        .pipe($.if(isProduction, $.minifyCss({noAdvanced: true})))
        .pipe($.plumber.stop())
        .pipe(gulp.dest(config.dist.css))
        .pipe(browserSync.stream())
        .pipe($.size({showFiles: true, title: 'minified'}))
        .pipe($.size({showFiles: true, gzip: true, title: 'gzipped'}));
});


/*
 gulp.task("build:package", function(){
 var pkg = require(config.build.pkg);
 console.log(JSON.stringify(pkg));
 });
 */


gulp.task('build:all', function(cb){
    runSequence(
        ['build:less', 'build:js', 'build:html', 'build:font', 'build:vendor', 'build:img'],
        cb
    )
});

gulp.task('build:html', function(){
    return gulp.src(config.build.html)
        //.pipe($.if(!isProduction, $.watch(config.build.html)))
        .pipe(changed(config.dist.html, {extension: '.html'}))
        .pipe(gulp.dest(config.dist.html))
        .pipe(browserSync.reload({stream:true}));
});
gulp.task('build:img', function(){
    return gulp.src(config.build.img)
        //.pipe($.if(!isProduction, $.watch(config.build.img)))
/*        .pipe(changed(config.dist.img, {extension: '.png'}))*/
        .pipe(changed(config.dist.img))
        .pipe(gulp.dest(config.dist.img))
        .pipe(browserSync.stream());
});
gulp.task('build:font', function(){
    return gulp.src(config.build.font)
        //.pipe($.if(!isProduction, $.watch(config.build.font)))
        .pipe(gulp.dest(config.dist.font))
        .pipe(browserSync.stream());;
});
gulp.task('build:vendor', function(){
    return gulp.src(config.build.vendor)
        //.pipe($.if(!isProduction, $.watch(config.build.vendor)))
        .pipe(gulp.dest(config.dist.vendor))
        .pipe(browserSync.stream());;
});

gulp.task('copy:js', function(){
    return gulp.src([
            'node_modules/jquery/dist/jquery.min.js'
        ])
        .pipe(gulp.dest('src/vendor'));
});

gulp.task('copy', [ 'copy:js']);

gulp.task('watch', function(){
    function fn(glob, task){
     var watch = gulp.watch(glob, function(evt){
         gulp.start(task);
     });
    }
    [
        {
            glob: config.build.less,
            task: 'build:less'
        },
        {
            glob: config.build.js,
            task: 'build:js'
        },
        {
            glob: config.build.html,
            task: 'build:html'
        },
        {
            glob: config.build.img,
            task: 'build:img'
        },
        {
            glob: config.build.vendor,
            task: 'build:vendor'
        },
        {
            glob: config.build.font,
            task: 'build:font'
        },
    ].forEach(function(item){
        fn(item.glob, item.task)
    });
});

gulp.task("clean", function(cb){
    return del([
        dist
    ], cb);
});

gulp.task("archive:clean", function(cb){
    return del([
        config.build.zip + '/' + argv.f
    ], cb);
});

gulp.task('archive:zip', function() {
    var file = 'dist/' + argv.f + '/**' ;

    return gulp.src(file)
        .pipe($.zip(argv.o + '.zip'))
        .pipe(gulp.dest(config.build.zip + '/' + argv.f ));
});

gulp.task('zip', function(cb){
    isProduction = true;
    runSequence (
        'clean',
        'build:all',
        'archive:clean',
        'archive:zip',
        cb);
});


//创建文件夹
function ensureDir(pth){
    fs.mkdirSync(pth);
    fs.mkdirSync(pth + '/css');
    fs.mkdirSync(pth + '/js');
    fs.mkdirSync(pth + '/img');
    fs.mkdirSync(pth + '/vendor');
    createHtmlTemplate(pth);
}

function createHtmlTemplate(pth){
    /*    var html = '<!DOCTYPE html>\n' +
     '<html lang="en">\n' +
     '   <script>!function(n){var e=n.document,t=e.documentElement,i=720,d=i/100,rem,o="orientationchange"in n?"orientationchange":"resize",a=function(){var n=t.clientWidth||320;n>720&&(n=720),t.style.fontSize=(rem=n/d)+"px"};n.px2rem=function(px){var v=parseFloat(px);return v/rem;};n.rem2px=function(r){var v=parseFloat(r);return rem*v};e.addEventListener&&(n.addEventListener(o,a,!1),e.addEventListener("DOMContentLoaded",a,!1))}(window);</script>' +
     '   <head>\n' +
     '       <meta charset="UTF-8">\n' +
     '       <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">\n' +
     '       <meta http-equiv="Cache-Control" content="no-transform">\n' +
     '       <meta http-equiv="Cache-Control" content="no-siteapp">\n' +
     '       <meta name="apple-mobile-web-app-capable" content="yes">\n' +
     '       <meta name="apple-mobile-web-app-status-bar-style" content="black">\n' +
     '       <title></title>\n' +
     '   </head>\n' +
     '   <body>\n' +
     '       hello world\n' +
     '   </body>\n' +
     '</html>' ;*/
    var html =
        `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <meta http-equiv="Cache-Control" content="no-transform"/>
    <meta http-equiv="Cache-Control" content="no-siteapp"/>
    <meta name="format-detection" content="telephone=no"/>
    <meta name="apple-mobile-web-app-capable" content="yes"/>
    <meta content="yes" name="apple-touch-fullscreen"/>
    <meta name="apple-mobile-web-app-status-bar-style" content="black"/>
    <title></title>
    <script>!function(n){var e=n.document,t=e.documentElement,dpr,scale;var isAndroid=n.navigator.appVersion.match(/android/gi),isIPhone=n.navigator.appVersion.match(/iphone/gi),devicePixelRatio=n.devicePixelRatio;if(isIPhone){if(devicePixelRatio>=2&&(!dpr||dpr>=2)){dpr=2}else{dpr=1}}else{dpr=1}scale=1/dpr;var metaEl=e.createElement("meta");var scale=dpr===1?1:0.5;metaEl.setAttribute("name","viewport");metaEl.setAttribute("content","initial-scale="+scale+", maximum-scale="+scale+", minimum-scale="+scale+", user-scalable=no");if(t.firstElementChild){t.firstElementChild.appendChild(metaEl)}else{var wrap=e.createElement("div");wrap.appendChild(metaEl);e.write(wrap.innerHTML)}var i=1440,d=i/200,rem,o="orientationchange" in n?"orientationchange":"resize",a=function(){var n=t.clientWidth||320;n>i&&(n=i),t.style.fontSize=(rem=n/d)+"px"};n.px2rem=function(px){var v=parseFloat(px);return v/rem};n.rem2px=function(r){var v=parseFloat(r);return rem*v};e.addEventListener&&(n.addEventListener(o,a,!1),e.addEventListener("DOMContentLoaded",a,!1))}(window);</script>
</head>
<body>
    hell world!
</body>
</html>`;
    fs.writeFileSync(pth + '/index.html', html)
}

gulp.task('prepare', function(cb){
    try{
        fs.statSync(pth)
    }catch(e){
        ensureDir(pth);
        /*        return gulp.src(config.build.html)
         .pipe(gulp.dest(config.dist.html))*/
    }
    return cb();
});
gulp.task('default',function(cb){
    runSequence (
        'prepare',
        'clean',
        'copy',
        ['appServer', 'build:all'],
        'watch',
        cb
    )
});
gulp.task('build',function(cb){
    runSequence (
        'prepare',
        'clean',
        'copy',
        'build:all',
        'watch',
        cb
    )
});