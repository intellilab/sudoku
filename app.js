var $, SudokuGame,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

$ = function(selector, el) {
  return (el || document).querySelector(selector);
};

SudokuGame = (function() {
  SudokuGame.prototype.levels = ['入门级', '初级', '中级', '高级', '骨灰级'];

  function SudokuGame(wrap) {
    this.ctrlClose = bind(this.ctrlClose, this);
    this.onCtrlClick = bind(this.onCtrlClick, this);
    this.onGameClick = bind(this.onGameClick, this);
    this.onRestart = bind(this.onRestart, this);
    var level;
    this.core = new Sudoku;
    this.els = {
      level: level = $('.sudoku-level', wrap),
      game: $('.sudoku-game', wrap),
      timer: $('.sudoku-timer', wrap),
      ctrl: $('.sudoku-ctrl', wrap),
      restart: $('.sudoku-restart', wrap),
      msg: $('.sudoku-msg', wrap)
    };
    this.timer = {
      time: 0
    };
    level.innerHTML = this.levels.map(function(level, i) {
      return "<option value=" + i + ">" + level + "</option>";
    }).join('');
    level.value = (function() {
      var data;
      data = location.hash.slice(1).split('&').reduce(function(map, piece) {
        var parts;
        parts = piece.split('=');
        map[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
        return map;
      }, {});
      return +data.level || 0;
    })();
    this.bindEvents();
    this.onRestart();
  }

  SudokuGame.prototype.bindEvents = function() {
    this.els.level.addEventListener('change', (function(_this) {
      return function(e) {
        location.hash = "\#level=" + e.target.value;
        return _this.onRestart();
      };
    })(this), false);
    this.els.restart.addEventListener('click', this.onRestart, false);
    this.els.game.addEventListener('click', this.onGameClick, false);
    return this.els.ctrl.addEventListener('click', this.onCtrlClick, false);
  };

  SudokuGame.prototype.render = function() {
    var html, i, j, k, l;
    this.data.puzzle = this.core.puzzle.slice();
    html = [];
    for (i = k = 0; k < 9; i = ++k) {
      html.push('<div>');
      for (j = l = 0; l < 9; j = ++l) {
        html.push('<span class=close></span>');
      }
      html.push('</div>');
    }
    this.els.game.innerHTML = html.join('');
    this.els.items = [].slice.call(this.els.game.querySelectorAll('span'));
    return this.data.puzzle.forEach((function(_this) {
      return function(v, i) {
        var el, item;
        el = _this.els.items[i];
        el.innerHTML = v || '';
        el.className = v ? '' : 'user';
        item = _this.data.items[i] = {
          data: [],
          locked: !!v
        };
        if (v) {
          return item.data.push(v);
        } else {
          return _this.data.invalid += 1;
        }
      };
    })(this));
  };

  SudokuGame.prototype.renderCtrl = function(item) {
    var html, i, k, selected;
    this.data.multi = item.data.length > 1;
    html = [];
    for (i = k = 1; k <= 9; i = ++k) {
      selected = ~item.data.indexOf(i) ? 'selected' : '';
      if (i % 3 === 1) {
        html.push('<div>');
      }
      html.push("<span data-key=" + i + " class=\"" + selected + "\" unselectable=on>" + i + "</span>");
      if (!(i % 3)) {
        html.push('</div>');
      }
    }
    selected = this.data.multi ? 'selected' : '';
    html.push("<span data-key=multi class=\"col2 " + selected + "\" unselectable=on>多选</span>");
    html.push('<span data-key=0 unselectable=on>&times;</span>');
    return this.els.ctrl.innerHTML = html.join('');
  };

  SudokuGame.prototype.startTimer = function() {
    this.els.timer.innerHTML = this.timer.time = 0;
    return this.timer.timer = setInterval((function(_this) {
      return function() {
        _this.timer.time += 1;
        return _this.els.timer.innerHTML = _this.timer.time;
      };
    })(this), 1000);
  };

  SudokuGame.prototype.stopTimer = function() {
    if (this.timer.timer) {
      clearInterval(this.timer.timer);
      return this.timer.timer = null;
    }
  };

  SudokuGame.prototype.onRestart = function() {
    this.stopTimer();
    this.data = {
      items: [],
      invalid: 0,
      current: -1
    };
    this.core.level = this.els.level.value;
    this.core.generate();
    this.core.generatePuzzle();
    this.render();
    this.els.msg.innerHTML = '游戏开始了，加油喔~';
    return this.startTimer();
  };

  SudokuGame.prototype.onGameClick = function(e) {
    var i;
    e.stopPropagation();
    if (!this.timer.timer) {
      return;
    }
    i = this.els.items.indexOf(e.target);
    if (~i) {
      return this.ctrlOpen(i);
    }
  };

  SudokuGame.prototype.onCtrlClick = function(e) {
    var current, el, i, item, key, target;
    e.stopPropagation();
    target = e.target;
    key = target.dataset.key;
    if (key === 'multi') {
      target.classList.toggle('selected');
      return this.data.multi = !this.data.multi;
    } else if (key) {
      key = +key;
      current = this.data.current;
      item = this.data.items[current];
      if (!key) {
        item.data = [];
        this.data.multi = false;
      } else if (this.data.multi) {
        i = item.data.indexOf(key);
        if (~i) {
          item.data.splice(i, 1);
          target.classList.remove('selected');
        } else {
          item.data.push(key);
          item.data.sort();
          target.classList.add('selected');
        }
      } else {
        item.data = [key];
      }
      el = this.els.items[current];
      el.classList[item.data.length > 1 ? 'add' : 'remove']('doubt');
      el.innerHTML = item.data.map(function(e, i) {
        return (i % 3 ? ' ' : i ? '<br>' : '') + e;
      }).join('');
      this.data.puzzle[current] = item.data.length === 1 ? item.data[0] : 0;
      this.check(current);
      if (!this.data.multi) {
        return this.ctrlClose();
      }
    }
  };

  SudokuGame.prototype.check = function(i) {
    var check, col, j, k, major;
    check = (function(_this) {
      return function(i) {
        var candidates, el, item, wrong;
        item = _this.data.items[i];
        if (item.locked) {
          return;
        }
        if (item.valid === 2) {
          _this.data.invalid += 1;
        }
        candidates = _this.core.candidates(_this.data.puzzle, i);
        wrong = item.data.some(function(v) {
          return (candidates.indexOf(v)) < 0;
        });
        item.valid = wrong ? 0 : (item.data.length === 1) + 1;
        if (item.valid === 2) {
          _this.data.invalid -= 1;
        }
        el = _this.els.items[i];
        return el.classList[wrong ? 'add' : 'remove']('wrong');
      };
    })(this);
    col = i % 9;
    for (j = k = 0; k < 9; j = ++k) {
      check(i - col + j);
      check(j * 9 + col);
    }
    major = ~~(i / 27) * 27 + col - col % 3;
    return this.core.squareMinor.forEach(function(j) {
      return check(major + j);
    });
  };

  SudokuGame.prototype.ctrlOpen = function(i) {
    var item;
    this.ctrlClose();
    this.data.current = i;
    item = this.data.items[i];
    if (item.locked) {
      return;
    }
    this.els.items[i].classList.add('focus');
    this.renderCtrl(item);
    this.els.ctrl.classList.remove('sudoku-hide');
    return document.addEventListener('click', this.ctrlClose, false);
  };

  SudokuGame.prototype.ctrlClose = function() {
    var i;
    document.removeEventListener('click', this.ctrlClose, false);
    i = this.data.current;
    if (!~i) {
      return;
    }
    this.els.ctrl.innerHTML = '';
    this.els.ctrl.classList.add('sudoku-hide');
    this.els.items[i].classList.remove('focus');
    this.data.current = -1;
    if (!this.data.invalid) {
      this.stopTimer();
      return this.els.msg.innerHTML = '恭喜您成功解出数独！';
    }
  };

  return SudokuGame;

})();

document.addEventListener('DOMContentLoaded', function() {
  var game;
  return game = new SudokuGame($('.sudoku-wrap'));
});

var Sudoku, TOTAL;

TOTAL = 81;

Sudoku = (function() {
  Sudoku.prototype.squareMajor = [0, 3, 6, 27, 30, 33, 54, 57, 60];

  Sudoku.prototype.squareMinor = [0, 1, 2, 9, 10, 11, 18, 19, 20];

  Sudoku.prototype.leastGiven = [50, 45, 31, 21, 17];

  Sudoku.prototype.level = 0;

  function Sudoku() {
    this.data = [];
  }

  Sudoku.prototype.generate = function() {
    var available, i, index, j, k, l, m, n, ok, result, results, v;
    console.time('generate');
    this.data = [];
    while (1) {
      available = (function() {
        results = [];
        for (var l = 0; 0 <= TOTAL ? l < TOTAL : l > TOTAL; 0 <= TOTAL ? l++ : l--){ results.push(l); }
        return results;
      }).apply(this);
      result = [];
      for (i = m = 0; m < 11; i = ++m) {
        ok = false;
        while (!ok) {
          k = ~~(Math.random() * available.length);
          index = available[k];
          for (j = n = 0; n < 9; j = ++n) {
            result[index] = ~~(Math.random() * 9) + 1;
            if (this.validate(result, index)) {
              v = available.pop();
              if (k < available.length) {
                available[k] = v;
              }
              ok = true;
              break;
            }
          }
          if (!ok) {
            result[index] = 0;
          }
        }
      }
      result = this.solve(result);
      if (result) {
        this.data = result;
        break;
      }
    }
    console.timeEnd('generate');
    return !!this.data.length;
  };

  Sudoku.prototype.validate = function(result, index) {
    var col, h, i, j, l, m, major, n, row, v;
    if (index == null) {
      index = -1;
    }
    if (index < 0) {
      for (i = l = 0; l < 9; i = ++l) {
        v = {};
        h = {};
        for (j = m = 0; m < 9; j = ++m) {
          if (!((this.validateGroup(h, result[i * 9 + j])) && (this.validateGroup(v, result[j * 9 + i])))) {
            return false;
          }
        }
      }
      return this.squareMajor.every((function(_this) {
        return function(i) {
          v = {};
          return _this.squareMinor.every(function(j) {
            return _this.validateGroup(v, result[i + j]);
          });
        };
      })(this));
    } else {
      col = index % 9;
      row = ~~(index / 9);
      v = {};
      h = {};
      for (i = n = 0; n < 9; i = ++n) {
        if (!((this.validateGroup(h, result[row * 9 + i])) && (this.validateGroup(v, result[i * 9 + col])))) {
          return false;
        }
      }
      major = ~~(row / 3) * 3 * 9 + ~~(col / 3) * 3;
      v = {};
      return this.squareMinor.every((function(_this) {
        return function(j) {
          return _this.validateGroup(v, result[major + j]);
        };
      })(this));
    }
  };

  Sudoku.prototype.validateGroup = function(dict, value) {
    var ok;
    ok = true;
    if (value) {
      if (dict[value]) {
        ok = false;
      } else {
        dict[value] = 1;
      }
    }
    return ok;
  };

  Sudoku.prototype.solve = function(result) {
    var dfs, solved;
    solved = false;
    dfs = (function(_this) {
      return function() {
        var _item, candidates, filled, i, item, items, l, length, results, status;
        items = (function() {
          results = [];
          for (var l = 0; 0 <= TOTAL ? l < TOTAL : l > TOTAL; 0 <= TOTAL ? l++ : l--){ results.push(l); }
          return results;
        }).apply(this).filter(function(i) {
          return !result[i];
        }).map(function(i) {
          return {
            index: i
          };
        });
        status = 3;
        filled = [];
        while (status > 2) {
          status = 0;
          i = 0;
          while (i < items.length) {
            item = items[i];
            candidates = item.candidates = _this.candidates(result, item.index);
            length = candidates.length;
            if (!length) {
              status = 2;
              break;
            } else if (length === 1) {
              result[item.index] = candidates.pop();
              filled.push(item);
              _item = items.pop();
              if (item !== _item) {
                items[i] = _item;
              }
              status = 3;
            } else {
              i += 1;
              status || (status = 1);
            }
          }
          if (status === 2) {
            break;
          }
        }
        if (status < 2) {
          if (!status) {
            solved = true;
            return;
          }
          item = items.reduce(function(selectedItem, item) {
            if (selectedItem.candidates.length > item.candidates.length) {
              return item;
            } else {
              return selectedItem;
            }
          });
          if (item.candidates.some(function(c) {
            result[item.index] = c;
            dfs();
            return solved;
          })) {
            return;
          }
          result[item.index] = 0;
        }
        return filled.forEach(function(item) {
          return result[item.index] = 0;
        });
      };
    })(this);
    result = result.slice();
    if (this.validate(result)) {
      dfs();
    }
    if (solved) {
      return result;
    }
  };

  Sudoku.prototype.candidates = function(result, index) {
    var i, k, l, v, x;
    v = {};
    x = index % 9;
    for (i = l = 0; l < 9; i = ++l) {
      k = index - x + i;
      if (k !== index) {
        this.validateGroup(v, result[k]);
      }
      k = i * 9 + x;
      if (k !== index) {
        this.validateGroup(v, result[k]);
      }
    }
    k = ~~(index / 27) * 27 + ~~(x / 3) * 3;
    this.squareMinor.forEach((function(_this) {
      return function(i) {
        i += k;
        if (i !== index) {
          return _this.validateGroup(v, result[i]);
        }
      };
    })(this));
    return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(function(i) {
      return !v[i];
    });
  };

  Sudoku.prototype.generatePuzzle = function(result) {
    var i, leastGiven, level, next, remained, seed, uniqueAnswer;
    if (result == null) {
      result = this.data;
    }
    level = this.level;
    leastGiven = this.leastGiven[level];
    result = result.slice();
    remained = TOTAL;
    console.time("puzzle level-" + level);
    uniqueAnswer = (function(_this) {
      return function(i) {
        var ans, unique;
        ans = result[i];
        unique = ![1, 2, 3, 4, 5, 6, 7, 8, 9].some(function(j) {
          if (j !== ans) {
            result[i] = j;
            return _this.solve(result);
          }
        });
        result[i] = ans;
        return unique;
      };
    })(this);
    next = function(i) {
      var col, delta, j;
      switch (+level) {
        case 2:
          return (i + 2 + ~~(Math.random() * 3)) % TOTAL;
        case 3:
          delta = ~~(i / 9) % 2 ? -1 : 1;
          col = i % 9;
          if (delta < 0 && !col || delta > 0 && col === 8) {
            delta = 9;
          }
          j = i + delta;
          if (j >= TOTAL) {
            j = 0;
          }
          return j;
        case 4:
          return (i + 1) % TOTAL;
        default:
          return ~~(Math.random() * TOTAL);
      }
    };
    i = seed = ~~(Math.random() * TOTAL);
    while (remained > leastGiven) {
      if (uniqueAnswer(i)) {
        result[i] = 0;
        remained -= 1;
      }
      while (true) {
        i = next(i);
        if (result[i] || level >= 3) {
          break;
        }
      }
      if (level >= 3 && i === seed) {
        break;
      }
    }
    this.puzzle = result;
    return console.timeEnd("puzzle level-" + level);
  };

  return Sudoku;

})();

if (typeof module !== "undefined" && module !== null) {
  module.exports = Sudoku;
}
