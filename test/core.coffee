Sudoku = require '../src/core.coffee'

dump = (result, empty = '.') ->
  out = []
  line = null
  # 稀疏数组不能用forEach遍历
  for i in [0 ... TOTAL]
    item = result[i] or empty
    unless i % 9
      line = []
      out.push line
    line.push item
  out
  .map (line) -> line.join ' '
  .join '\n'

sudoku = new Sudoku
do sudoku.generate
console.log dump sudoku.data
for level in [0 .. 4]
  sudoku.level = level
  console.log ''
  do sudoku.generatePuzzle
  console.log dump sudoku.puzzle
