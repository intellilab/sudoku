rm -rf dist
./node_modules/.bin/gulp build
cd dist
git init
git add -A
git commit -m 'Auto deloy to Github-Pages'
git push -f git@github.com:intellilab/sudoku.git master:gh-pages
