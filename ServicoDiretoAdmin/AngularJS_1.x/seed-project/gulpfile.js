var es = require('event-stream');
var gulp = require('gulp');
var concat = require('gulp-concat');
//var connect = require('gulp-connect');
var replace = require('gulp-replace');
var browserSync     = require('browser-sync').create();
var templateCache = require('gulp-angular-templatecache');
var ngAnnotate = require('gulp-ng-annotate');
var uglify = require('gulp-uglify');
var fs = require('fs');
var _ = require('lodash');

var reload      = browserSync.reload;
var scripts = require('./app.scripts.json');

var source = {
    js: {
        main: 'app/main.js',
        src: [
            // application config
            'app.config.js',

            // application bootstrap file
            'app/main.js',

            // main module
            'app/app.js',

            // module files
            'app/**/module.js',

            // other js files [controllers, services, etc.]
            'app/**/!(module)*.js'
        ],
        tpl: 'app/**/*.tpl.html'
    }
};

var destinations = {
    js: 'build'
};


gulp.task('build', function(){
    return es.merge(gulp.src(source.js.src) , getTemplateStream())
         .pipe(ngAnnotate())
         .pipe(uglify())
         .pipe(replace('http://192.168.1.101/servicodireto/api', 'http://api.servicodireto.com'))
        .pipe(concat('app.js'))
        .pipe(gulp.dest(destinations.js));
});

gulp.task('js', function(){
    return es.merge(gulp.src(source.js.src) , getTemplateStream())
        .pipe(concat('app.js'))
        .pipe(gulp.dest(destinations.js));
});

gulp.task('watch', function(){
    gulp.watch(source.js.src, ['js']);
    gulp.watch(source.js.tpl, ['js']);
});

/*
gulp.task('connect', function() {
    connect.server({
        port: 8888
    });
});
*/

// Static server
gulp.task('browser-sync', function() {
    browserSync.init({
        port:8888,
        server: 
        {
            directory: false,
            baseDir: "./",
            routes: {
              "/bower_components": "./bower_components/"
            }
        }
    });
});


gulp.task('vendor', function(){
    _.forIn(scripts.chunks, function(chunkScripts, chunkName){
        var paths = [];
        chunkScripts.forEach(function(script){
            var scriptFileName = scripts.paths[script];
            if (!fs.existsSync(__dirname + '/' + scriptFileName)) {
                throw console.error('Required path doesn\'t exist: ' + __dirname + '/' + scriptFileName, script)
            }
            paths.push(scriptFileName);
            console.log(scriptFileName);
        });
        gulp.src(paths)
            .pipe(concat(chunkName + '.js'))
            //.on('error', swallowError)
            .pipe(gulp.dest(destinations.js))
    })

});

gulp.task('prod', ['vendor', 'build']);
gulp.task('dev', ['vendor', 'js', 'watch', 'browser-sync']);
gulp.task('default', ['dev']);

var swallowError = function(error){
    console.log(error.toString());
    this.emit('end')
};

var getTemplateStream = function () {
    return gulp.src(source.js.tpl)
        .pipe(templateCache({
            root: 'app/',
            module: 'app'
        }))
};