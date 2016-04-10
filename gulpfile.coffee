gulp = require 'gulp'
coffee = require 'gulp-coffee'
concat = require 'gulp-concat'
less = require 'gulp-less'
cssnano = require 'gulp-cssnano'

gulp.task 'build-js', ->
  gulp.src 'src/**/*.coffee'
    .pipe coffee
      bare: true
    .pipe concat 'app.js'
    .pipe gulp.dest 'dist'

gulp.task 'build-css', ->
  gulp.src 'src/**/*.less'
    .pipe do less
    .pipe concat 'style.css'
    .pipe do cssnano
    .pipe gulp.dest 'dist'

gulp.task 'build-html', ->
  gulp.src 'src/**/*.html'
    .pipe gulp.dest 'dist'

gulp.task 'build', ['build-js', 'build-css', 'build-html']

gulp.task 'watch', ->
  gulp.watch 'src/**/*.coffee', ['build-js']
  gulp.watch 'src/**/*.less', ['build-css']
  gulp.watch 'src/**/*.html', ['build-html']
