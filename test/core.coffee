Sudoku = require '../src/core.coffee'

sudoku = new Sudoku
do sudoku.generate
console.log do sudoku.dump
for level in [0 .. 4]
  sudoku.level = level
  console.log ''
  do sudoku.generatePuzzle
  console.log sudoku.dump sudoku.puzzle
