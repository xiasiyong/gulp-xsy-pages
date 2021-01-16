const path = require('path')
const { src, dest, parallel, series, watch } = require('gulp')
const gulpLoadPlugins = require('gulp-load-plugins');
const plugins = gulpLoadPlugins();
const del = require('del')
const bs = require("browser-sync").create();
let config = {
  build: {
    src: 'src',
    dist: 'dist',
    temp: 'temp',
    public: 'public',
    paths: {
      styles: 'assets/styles/*.scss',
      scripts: 'assets/scripts/*.js',
      pages: '*.html',
      images: 'assets/images/**',
      fonts: 'assets/fonts/**',
    }
  }
}
try {
  const loadConfig = require(`${process.cwd()}/gulp.config.js`)
  config = Object.assign({}, config, loadConfig)
} catch (err) {
  console.log(err)
}

const clean = () => {
  return del([config.build.temp, config.build.dist])
}

const style = () => {
  return src(config.build.paths.styles, { base: config.build.src, cwd: config.build.src })
  .pipe(plugins.sass({ outputStyle: 'expanded' }))
  .pipe(dest(config.build.temp))
  .pipe(bs.reload({ stream: true }))
}

const script = () => {
  return src(config.build.paths.scripts, { base: config.build.src, cwd: config.build.src })
  .pipe(plugins.babel({ presets: [require('@babel/preset-env')] }))
  .pipe(dest(config.build.temp))
  .pipe(bs.reload({ stream: true }))
}

const pages = () => {
  return src(config.build.paths.pages, { base: config.build.src, cwd: config.build.src })
  .pipe(plugins.swig({ data: config.data, defaults: { cache: false } }))
  .pipe(dest(config.build.temp))
  .pipe(bs.reload({ stream: true }))
}

const images = () => {
  return src(config.build.paths.images, { base: config.build.src, cwd: config.build.src })
  .pipe(plugins.imagemin())
  .pipe(dest(config.build.dist))
}

const fonts = () => {
  return src(config.build.paths.fonts, { base: config.build.src, cwd: config.build.src })
  .pipe(plugins.imagemin())
  .pipe(dest(config.build.dist))
}

const extra = () => {
  return src('**', { base: 'public', cwd: config.build.public })
    .pipe(dest(config.build.dist))
}

const useref = () => {
  return src(config.build.paths.pages, { base: config.build.temp, cwd: config.build.temp })
  .pipe(plugins.useref({ searchPath: [config.build.temp, '..'] }))
  .pipe(plugins.if(/\.js$/, plugins.uglify()))
  .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
  .pipe(plugins.if(/\.html$/, plugins.htmlmin({
    collapseWhitespace: true,
    minifyCSS: true,
    minifyJS: true
  })))
  .pipe(dest(config.build.dist))
}

const serve = () => {
  watch(config.build.paths.styles, { cwd: config.build.src }, style)
  watch(config.build.paths.scripts, { cwd: config.build.src }, script)
  watch(config.build.paths.pages,  { cwd: config.build.src }, pages)

  watch([
    config.build.paths.images,
    config.build.paths.fonts,
  ], { cwd: config.build.src}, bs.reload)
  watch([
    '**'
  ], { cwd: config.build.public}, bs.reload)

  bs.init({
    // files: 'dist/**',
    notify: false,
    open: false,
    server: {
      baseDir: [config.build.temp, config.build.src, config.build.public],
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  })
}

const compiler = parallel(style, script, pages)
const dev = series(compiler, serve)
const build = series(clean, parallel(series(compiler, useref), images, fonts, extra))
module.exports = {
  clean,
  serve,
  dev,
  build
}