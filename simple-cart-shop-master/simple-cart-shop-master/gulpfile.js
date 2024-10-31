var $ = require('gulp-load-plugins')();
var argv = require('yargs').argv;
var gulp = require('gulp');
var rimraf = require('rimraf');
var sequence = require('run-sequence');

var ISPRODUCTION = !!(argv.production);
var HASMAP = !!(argv.soursemap);
var NPMPATH = 'node_modules';
var DISTPATH = 'dist';
var SUFFIXMIN = ISPRODUCTION ? '.min' : '';


var PATHS = {
    js: [
        'src/js/*.js',
        'src/js/**/*.js',
        'src/js/**/**/*.js'
    ],
    jsCore: [
        'src/js/cart-core.js'
    ]

};

gulp.task('clean', function (done) {
    rimraf(DISTPATH, done);
});

gulp.task('copy', function () {
    return gulp.src([
        NPMPATH + '/jquery/dist/jquery.js',
        NPMPATH + '/js-cookie/src/js.cookie.js'
    ])
        .pipe(gulp.dest(DISTPATH + '/js'));
});

gulp.task('js-core', function () {
    var uglify = $.if(ISPRODUCTION, $.uglify()
        .on('error', function (e) {
            console.log(e);
        }));
    return gulp.src(PATHS.jsCore)
        .pipe($.sourcemaps.init())
        .pipe($.concat('simple-cart' + SUFFIXMIN + '.js'))
        .pipe(uglify)
        .pipe($.if(!HASMAP, $.sourcemaps.write()))
        .pipe(gulp.dest(DISTPATH + '/js'));
});


gulp.task('watch', function () {
    gulp.watch([PATHS.js], ['js-core']);
});
