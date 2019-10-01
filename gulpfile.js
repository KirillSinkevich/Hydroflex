// Поключение зависимостей
var gulp         = require('gulp'),
    babel        = require('gulp-babel'),
    rigger       = require('gulp-rigger'),
    mincss       = require('gulp-cssnano'),
    autoprefixer = require('gulp-autoprefixer'),
    sourcemaps   = require('gulp-sourcemaps'),
    imagemin     = require('gulp-imagemin'),
    gnf          = require('gulp-npm-files'),
    rimraf       = require('rimraf'),
    fs           = require('fs'),
    browserSync  = require('browser-sync').create(),
    less         = require('gulp-less'),
    spa          = require('browser-sync-spa');
  
// Пути
var path = {
    build: { //Тут мы укажем куда складывать готовые после сборки файлы
        html:    'build/',
        js:      'build/js/',
        data:    'build/data/',
        styles:  'build/styles/',
        content: 'build/content/',
        images:  'build/images/',
        fonts:   'build/fonts/',
        modules: 'build/node_modules'
    },

    src: { //Пути откуда брать исходники
        html:     'src/*.{html,php}', //Синтаксис src/*.html говорит gulp что мы хотим взять все файлы с расширением .html
        js:       'src/js/*.js',//В стилях и скриптах нам понадобятся только main файлы
        data:     'src/data/**/*.json', //Папка для тестовых данных в формате json
        styles:   'src/styles/*.less',
        lessTemp: 'src/styles/temporary',
        content:  'src/content/**/*.*',
        images:   'src/images/**/*.*', //Синтаксис images/**/*.* означает - взять все файлы всех расширений из папки и из вложенных каталогов
        fonts:    'src/fonts/**/*.*',
        favicon:  'src/favicon.png'
    },

    watch: { //Тут мы укажем, за изменением каких файлов мы хотим наблюдать
        html:   'src/**/*.{html,php}',
        js:     'src/js/**/*.js',
        data:   'src/data/**/*.json',
        styles: 'src/styles/**/*.less',
        images: 'src/content/**/*.*',
        images: 'src/images/**/*.*',
        fonts:  'src/fonts/**/*.*'
    },

    clean: './build'
};

// Сборка html и фавикон
gulp.task('html:build', function () {
    gulp.src(path.src.html) //Выберем файлы по нужному пути
        .pipe(rigger())
        .pipe(gulp.dest(path.build.html)) //Выплюнем их в папку build
        .pipe(browserSync.stream());

    gulp.src(path.src.favicon)
        .pipe(gulp.dest('build/'));
});

// Сборка стилей
gulp.task('style:build', function () {
    gulp.src(path.src.styles)
        .pipe(sourcemaps.init())
        .pipe(autoprefixer({
            browsers: ['last 2 versions']
        }))
        .pipe(less())
        .pipe(mincss())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(path.build.styles))
        .pipe(browserSync.stream());
});

// Сборка шрифтов
gulp.task('fonts:build', function() {
    gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts))
        .pipe(browserSync.stream());
});

// Сборка и сжатие изображений
gulp.task('image:build', function () {
    gulp.src(path.src.images) //Выберем наши картинки
        .pipe(gulp.dest(path.build.images)); //И бросим в build

    gulp.src(path.src.content) //Выберем наши картинки
        .pipe(gulp.dest(path.build.content)); //И бросим в build
});

// Сборка js и json
gulp.task('js:build', function () {
    gulp.src(path.src.js) //Найдем наш main файл
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(path.build.js)) //Выплюнем готовый файл в build
        .pipe(browserSync.stream());
});

gulp.task('js:data', function () {
    gulp.src(path.src.data) //Найдем наш main файл
        .pipe(gulp.dest(path.build.data));
});

// Перенос зависимостей в build
gulp.task('clean-module', function (cb) {
    return rimraf(path.build.modules, cb);
});

gulp.task('module', ['clean-module'], function() {
    gulp.src(gnf(), {base:'./'})
        .pipe(gulp.dest('./build'));
});

gulp.task('re-module', ['module'], function() {
    gulp.src('./package.json')
        .pipe(browserSync.stream());
});

// Построение структуры Build
gulp.task('build', [
    'html:build',
    'js:build',
    'style:build',
    'fonts:build',
    'image:build',
    're-module'
]);

// Отслеживание изменений файлов
gulp.task('watch', ['server'], function(){
    gulp.watch([path.watch.html], ['html:build']);
    gulp.watch([path.watch.styles], ['style:build']);
    gulp.watch([path.watch.js], ['js:build']);
    gulp.watch([path.watch.data], ['js:data']);
    gulp.watch([path.watch.images], ['image:build']);
    gulp.watch([path.watch.fonts], ['fonts:build']);

    gulp.watch('./package.json', function(event) {
        if (event.path.indexOf('package.json') > -1) {
            gulp.start('re-module');
        }
    });
});

// Удаление папки build
gulp.task('clean', function (cb) {
    rimraf(path.clean, cb);
});

// Запуск сервера
gulp.task('server', ['build'], function() {
    var
        argv = process.argv, // Берем аргументы из строки запуска команды
        open = argv.indexOf('--dev') == -1;

    browserSync.use(spa({
        history: {
            index: '/index.html'
        }
    }));

    browserSync.init({
        open: open,
        notify: false,
        
        middleware: [{
            route: "/api",
            handle: function (request, respond, next) {
                var 
                    body     = '',
                    filePath = __dirname + '\\src\\data\\data.json';
                
                request.on('data', function(data) {
                    body += data;
                });

                request.on('end', function (){
                    fs.writeFile(filePath, body, function() {
                        respond.end(body);
                    });
                });
            }
        }],
        
        server: {
            baseDir: './build'
        },
        
        port: 8080
    });
});

// Сжатие изображений
gulp.task('image', function() {
    gulp.src(path.src.images)
        .pipe(imagemin())
        .pipe(gulp.dest(path.build.images))
});

// Команда Gulp
gulp.task('default', ['watch', 'js:data']);
