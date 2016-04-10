$ = (selector, el) ->
  (el or document).querySelector selector

class SudokuGame
  levels: [
    '入门级'
    '初级'
    '中级'
    '高级'
    '骨灰级'
  ]
  constructor: (wrap) ->
    @core = new Sudoku
    @els =
      level: level = $ '.sudoku-level', wrap
      game: $ '.sudoku-game', wrap
      timer: $ '.sudoku-timer', wrap
      ctrl: $ '.sudoku-ctrl', wrap
      restart: $ '.sudoku-restart', wrap
      msg: $ '.sudoku-msg', wrap
    @timer =
      time: 0
    level.innerHTML = @levels.map (level, i) ->
      "<option value=#{i}>#{level}</option>"
    .join ''
    level.value = do ->
      data = location.hash.slice 1
        .split '&'
        .reduce (map, piece) ->
          parts = piece.split '='
          map[decodeURIComponent parts[0]] = decodeURIComponent parts[1]
          map
        , {}
      +data.level || 0
    do @bindEvents
    do @onRestart

  bindEvents: ->
    @els.level.addEventListener 'change', (e) =>
      location.hash = "\#level=#{e.target.value}"
      do @onRestart
    , false
    @els.restart.addEventListener 'click', @onRestart, false
    @els.game.addEventListener 'click', @onGameClick, false
    @els.ctrl.addEventListener 'click', @onCtrlClick, false

  render: ->
    @data.puzzle = do @core.puzzle.slice
    html = []
    for i in [0 ... 9]
      html.push '<div>'
      for j in [0 ... 9]
        html.push '<span class=close></span>'
      html.push '</div>'
    @els.game.innerHTML = html.join ''
    @els.items = [].slice.call @els.game.querySelectorAll 'span'
    @data.puzzle.forEach (v, i) =>
      el = @els.items[i]
      el.innerHTML = v or ''
      el.className = if v then '' else 'user'
      item = @data.items[i] =
        data: []
        locked: not not v
      if v
        item.data.push v
      else
        @data.invalid += 1

  renderCtrl: (item) ->
    @data.multi = item.data.length > 1
    html = []
    for i in [1 .. 9]
      selected = if ~ item.data.indexOf i then 'selected' else ''
      html.push '<div>' if i % 3 == 1
      html.push "<span data-key=#{i} class=\"#{selected}\" unselectable=on>#{i}</span>"
      html.push '</div>' unless i % 3
    selected = if @data.multi then 'selected' else ''
    html.push "<span data-key=multi class=\"col2 #{selected}\" unselectable=on>多选</span>"
    html.push '<span data-key=0 unselectable=on>&times;</span>'
    @els.ctrl.innerHTML = html.join ''
    # @els.ctrlItems = [].slice.call @els.ctrl.querySelectorAll 'span'

  startTimer: ->
    @els.timer.innerHTML = @timer.time = 0
    @timer.timer = setInterval =>
      @timer.time += 1
      @els.timer.innerHTML = @timer.time
    , 1000

  stopTimer: ->
    if @timer.timer
      clearInterval @timer.timer
      @timer.timer = null

  onRestart: =>
    do @stopTimer
    @data = {
      items: []
      invalid: 0
      current: -1
    }
    @core.level = @els.level.value
    do @core.generate
    do @core.generatePuzzle
    do @render
    @els.msg.innerHTML = '游戏开始了，加油喔~'
    do @startTimer

  onGameClick: (e) =>
    do e.stopPropagation
    return unless @timer.timer
    i = @els.items.indexOf e.target
    @ctrlOpen i if ~i

  onCtrlClick: (e) =>
    do e.stopPropagation
    target = e.target
    key = target.dataset.key
    if key is 'multi'
      target.classList.toggle 'selected'
      @data.multi = not @data.multi
    else if key
      key = +key
      current = @data.current
      item = @data.items[current]
      # clear
      unless key
        item.data = []
        @data.multi = false
      else if @data.multi
        i = item.data.indexOf key
        if ~i
          item.data.splice i, 1
          target.classList.remove 'selected'
        else
          item.data.push key
          do item.data.sort
          target.classList.add 'selected'
      else
        item.data = [key]
      el = @els.items[current]
      el.classList[if item.data.length > 1 then 'add' else 'remove'] 'doubt'
      el.innerHTML = item.data.map (e, i) ->
        (if i % 3 then ' ' else if i then '<br>' else '') + e
      .join ''
      @data.puzzle[current] = if item.data.length is 1 then item.data[0] else 0
      @check current
      do @ctrlClose unless @data.multi

  check: (i) ->
    check = (i) =>
      item = @data.items[i]
      return if item.locked
      @data.invalid += 1 if item.valid is 2
      candidates = @core.candidates @data.puzzle, i
      wrong = item.data.some (v) -> (candidates.indexOf v) < 0
      item.valid = if wrong then 0 else (item.data.length is 1) + 1
      @data.invalid -= 1 if item.valid is 2
      el = @els.items[i]
      el.classList[if wrong then 'add' else 'remove'] 'wrong'
    col = i % 9
    for j in [0 ... 9]
      check i - col + j
      check j * 9 + col
    major = ~~ (i / 27) * 27 + col - col % 3
    @core.squareMinor.forEach (j) -> check major + j

  ctrlOpen: (i) ->
    do @ctrlClose
    @data.current = i
    item = @data.items[i]
    return if item.locked
    @els.items[i].classList.add 'focus'
    @renderCtrl item
    @els.ctrl.classList.remove 'sudoku-hide'
    document.addEventListener 'click', @ctrlClose, false

  ctrlClose: =>
    document.removeEventListener 'click', @ctrlClose, false
    i = @data.current
    return unless ~i
    @els.ctrl.innerHTML = ''
    @els.ctrl.classList.add 'sudoku-hide'
    @els.items[i].classList.remove 'focus'
    @data.current = -1
    unless @data.invalid
      do @stopTimer
      @els.msg.innerHTML = '恭喜您成功解出数独！'

document.addEventListener 'DOMContentLoaded', ->
  game = new SudokuGame($('.sudoku-wrap'))
