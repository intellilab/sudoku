TOTAL = 81

class Sudoku
  # 每个小九宫格的第一个格子的位置
  squareMajor: [
    0,  3,  6
    27, 30, 33
    54, 57, 60
  ]
	# 小九宫格里9个格子相对第一个格子的位置
  squareMinor: [
    0,  1,  2
    9,  10, 11
    18, 19, 20
  ]
  # 不同难度下至少给定的格子数目
  leastGiven: [50, 45, 31, 21, 17]
  level: 0

  constructor: ->
    @data = []

  # 生成一个终盘
  generate: ->
    console.time 'generate'
    # 随机填11个数，然后求解，据说有解率99.7%
    @data = []
    while 1
      available = [0 ... TOTAL]
      result = []
      # 随机填入11个数，81个格子填11个数总能填出来的
      for i in [0 ... 11]
        ok = false
        while not ok
          # 随机选择一个格子
          k = ~~ (Math.random() * available.length)
          index = available[k]
          # 填入一个数，如果与已填入的数冲突则重填
          # 尝试9次仍失败则放弃，然后重新选格子
          for j in [0 ... 9]
            result[index] = ~~ (Math.random() * 9) + 1
            if @validate result, index
              v = do available.pop
              available[k] = v if k < available.length
              ok = true
              break
          result[index] = 0 if not ok
      result = @solve result
      if result
        @data = result
        break
    console.timeEnd 'generate'
    return !!@data.length

  validate: (result, index = -1) ->
    # 验证整盘
    if index < 0
      # 验证行和列
      for i in [0 ... 9]
        v = {}
        h = {}
        for j in [0 ... 9]
          return false unless (@validateGroup h, result[i * 9 + j]) and (@validateGroup v, result[j * 9 + i])
      # 验证小九宫格
      @squareMajor.every (i) =>
        v = {}
        @squareMinor.every (j) => @validateGroup v, result[i + j]
    else
      col = index % 9
      row = ~~ (index / 9)
      v = {}
      h = {}
      for i in [0 ... 9]
        return false unless (@validateGroup h, result[row * 9 + i]) and (@validateGroup v, result[i * 9 + col])
      major = ~~ (row / 3 ) * 3 * 9 + ~~ (col / 3) * 3
      v = {}
      @squareMinor.every (j) => @validateGroup v, result[major + j]

  validateGroup: (dict, value) ->
    ok = true
    if value
      if dict[value]
        ok = false
      else
        dict[value] = 1
    ok

  solve: (result) ->
    solved = false
    dfs = =>
      items = [0 ... TOTAL]
        .filter (i) -> not result[i]
        .map (i) ->
          index: i
      status = 3
      filled = [] # For rollback
      while status > 2
        status = 0
        i = 0
        while i < items.length
          item = items[i]
          candidates = item.candidates = @candidates result, item.index
          length = candidates.length
          if not length
            # 无解
            status = 2
            break
          else if length is 1
            result[item.index] = do candidates.pop
            filled.push item
            _item = do items.pop
            unless item is _item
              items[i] = _item
            status = 3
          else
            # 无法确定
            i += 1
            status or= 1
        break if status is 2
        # TODO 填充可推断的值
      if status < 2
        if not status
          solved = true
          return
        item = items.reduce (selectedItem, item) ->
          if selectedItem.candidates.length > item.candidates.length
            item
          else
            selectedItem
        return if item.candidates.some (c) =>
          result[item.index] = c
          do dfs
          solved
        result[item.index] = 0
      filled.forEach (item) ->
        result[item.index] = 0
    result = do result.slice
    do dfs if @validate result
    return result if solved

  candidates: (result, index) ->
    v = {}
    x = index % 9
    for i in [0 ... 9]
      k = index - x + i
      @validateGroup v, result[k] unless k is index
      k = i * 9 + x
      @validateGroup v, result[k] unless k is index
    k = ~~ (index / 27) * 27 + ~~ (x / 3) * 3
    @squareMinor.forEach (i) =>
      i += k
      @validateGroup v, result[i] unless i is index
    [1 .. 9].filter (i) -> not v[i]

  generatePuzzle: (result = @data) ->
    level = @level
    leastGiven = @leastGiven[level]
    result = do result.slice
    remained = TOTAL
    console.time "puzzle level-#{level}"
    uniqueAnswer = (i) =>
      ans = result[i]
      unique = not [1 .. 9].some (j) =>
        unless j is ans
          result[i] = j
          @solve result
      result[i] = ans
      unique
    next = (i) ->
      switch +level
        when 2
          # 间隔
          (i + 2 + ~~ (Math.random() * 3)) % TOTAL
        when 3
          # 蛇形
          delta = if ~~ (i / 9) % 2 then -1 else 1
          col = i % 9
          if delta < 0 and not col or delta > 0 and col is 8
            delta = 9
          j = i + delta
          j = 0 if j >= TOTAL
          j
        when 4
          # 顺序，尽可能多且成片地挖空
          (i + 1) % TOTAL
        else
          ~~ (Math.random() * TOTAL)
    i = seed = ~~ (Math.random() * TOTAL)
    while remained > leastGiven
      if uniqueAnswer i
        result[i] = 0
        remained -= 1
      while true
        i = next i
        break if result[i] or level >= 3
      # 挖不出更多了
      break if level >= 3 and i is seed
    @puzzle = result
    console.timeEnd "puzzle level-#{level}"

module?.exports = Sudoku
