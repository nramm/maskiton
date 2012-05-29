(function() {
  var __slice = Array.prototype.slice;

  define(['events', 'time', 'useful'], function(_arg, time, useful) {
    var Progress, computed, from, observable, options, progress, uiProgressBar, uibindings, uitemplate;
    observable = _arg.observable, computed = _arg.computed, uibindings = _arg.uibindings;
    options = function() {
      var value, values, _i, _len;
      values = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      for (_i = 0, _len = values.length; _i < _len; _i++) {
        value = values[_i];
        if (value != null) return value;
      }
    };
    from = function(obj) {
      var key, sub;
      sub = {};
      for (key in obj) {
        if (obj.hasOwnProperty(key)) sub[key] = obj[key];
      }
      return sub;
    };
    Progress = function(proto) {
      var last_done, progress;
      if (proto == null) proto = {};
      progress = from(proto);
      progress.done = observable(options(progress.done, 0));
      progress.total = observable(options(progress.total, 0));
      progress.started = observable(options(progress.started, time.now()));
      last_done = progress.done();
      progress.reset = function(done) {
        if (done != null) progress.done(done);
        last_done = progress.done();
        progress.started(time.now());
        return progress;
      };
      progress.done.nice = computed(function() {
        return "" + (useful.niceSize(progress.done()));
      });
      progress.total.nice = computed(function() {
        return "" + (useful.niceSize(progress.total()));
      });
      progress.done.percent = computed(function() {
        var total;
        total = progress.total();
        if (total > 0) {
          return progress.done() / total;
        } else {
          return 1.0;
        }
      });
      progress.elapsed = function() {
        var started;
        started = progress.started();
        if (started) {
          return time.now() - started;
        } else {
          return null;
        }
      };
      progress.rate = computed(function() {
        var delta_done, elapsed;
        elapsed = progress.elapsed();
        delta_done = progress.done() - last_done;
        if ((elapsed != null) > 0) {
          return delta_done / elapsed;
        } else {
          return null;
        }
      });
      progress.rate.nice = computed(function() {
        var rate;
        rate = progress.rate();
        if (rate != null) {
          return "" + (useful.niceSize(rate)) + "/sec";
        } else {
          return 'unknown';
        }
      });
      progress.remaining = computed(function() {
        return progress.total() - progress.done();
      });
      progress.remaining.percent = computed(function() {
        var total;
        total = progress.total();
        if (total > 0) {
          return progress.remaining() / total;
        } else {
          return 0.0;
        }
      });
      progress.remaining.time = computed(function() {
        var rate, remaining;
        remaining = progress.remaining();
        if (remaining > 0) {
          rate = progress.rate();
          if (rate > 0) {
            return remaining / rate;
          } else {
            return null;
          }
        } else {
          return 0.0;
        }
      });
      progress.remaining.time.nice = computed(function() {
        var left;
        left = progress.remaining.time();
        if (left) {
          return time.niceTime(left);
        } else {
          return 'unknown';
        }
      });
      return progress;
    };
    uitemplate = '<div class="pbar">\n    <div class="pbar-bar"></div>\n    <span class="pbar-label"></span>\n</div>';
    uibindings.pbar = {
      init: function(element, _model) {
        var ui, uibar, uilabel, vm;
        vm = _model();
        ui = $(uitemplate);
        uibar = $('.pbar-bar', ui);
        uilabel = $('.pbar-label', ui);
        computed(function() {
          var a, b, g, r, _ref;
          _ref = vm.rgba(), r = _ref[0], g = _ref[1], b = _ref[2], a = _ref[3];
          return uibar.css({
            'background-color': "rgba(" + r + "," + g + "," + b + "," + a + ")",
            'border': "1px solid rgba(" + (r - 40) + "," + (g - 40) + "," + (b - 40) + "," + (a - 0.2) + ")"
          });
        });
        computed(function() {
          var percent;
          percent = vm.percent();
          return uibar.width("" + (Math.min(percent * 98 + 2, 100)) + "%");
        });
        computed(function() {
          return uilabel.text(vm.message());
        });
        computed(function() {
          if (vm.animate()) {
            return ui.addClass('animate');
          } else {
            return ui.removeClass('animate');
          }
        });
        computed(function() {
          if (vm.stripes()) {
            return ui.addClass('stripes');
          } else {
            return ui.removeClass('stripes');
          }
        });
        return $(element).append(ui);
      }
    };
    uiProgressBar = function(proto) {
      var progress, _ref;
      if (proto == null) proto = {};
      progress = from(proto);
      progress.rgba = observable(options(progress.rgba, [100, 100, 100, 0.5]));
      progress.message = observable(options(progress.message, ''));
      progress.percent = observable(options(progress.percent, (_ref = progress.done) != null ? _ref.percent : void 0, 0.0));
      progress.stripes = observable(options(progress.stripes, true));
      progress.animate = observable(options(progress.animate, true));
      return progress;
    };
    return progress = {
      uiProgressBar: uiProgressBar,
      Progress: Progress
    };
  });

}).call(this);
