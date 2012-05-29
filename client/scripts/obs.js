(function() {
  var addFrame, addToStack, computed, count, frames, mergeFrame, notify, observable, obsids, popFrame, run, runs, stop, t_make, t_update, t_verify1, t_verify2, unique;

  frames = [];

  addFrame = function(frame) {
    return frames.push(frame || []);
  };

  addToStack = function(obs) {
    if (frames.length > 0) return frames[frames.length - 1].push(obs);
  };

  mergeFrame = function(obs) {
    if (frames.length > 0) {
      return frames[frames.length - 1] = frames[frames.length - 1].concat(obs);
    }
  };

  popFrame = function() {
    var popped;
    popped = unique(frames.pop());
    mergeFrame(popped);
    return popped;
  };

  unique = function(frame) {
    var nframe, obs, set, _i, _len;
    set = {};
    nframe = [];
    for (_i = 0, _len = frame.length; _i < _len; _i++) {
      obs = frame[_i];
      if (!(obs.id in set)) {
        set[obs.id] = true;
        nframe.push(obs);
      }
    }
    return nframe;
  };

  notify = function(bindings, value) {
    var call, newbindings, _i, _len;
    newbindings = [];
    for (_i = 0, _len = bindings.length; _i < _len; _i++) {
      call = bindings[_i];
      if (call(value)) newbindings.push(call);
    }
    return newbindings;
  };

  obsids = 0;

  computed = function(tocompute) {
    var cached, dirty, evaluate, watched;
    watched = [];
    cached = null;
    dirty = true;
    evaluate = function() {
      var obs, value, _i, _len;
      if (dirty) {
        dirty = false;
        addFrame();
        value = tocompute();
        watched = popFrame();
        if (value !== cached) {
          for (_i = 0, _len = watched.length; _i < _len; _i++) {
            obs = watched[_i];
            obs.bind(function() {
              dirty = true;
              return false;
            });
          }
          cached = value;
        }
      } else {
        mergeFrame(watched);
      }
      return cached;
    };
    evaluate.id = obsids++;
    evaluate.bind = function(call) {
      var obs, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = watched.length; _i < _len; _i++) {
        obs = watched[_i];
        _results.push(obs.bind(function() {
          return call(evaluate());
        }));
      }
      return _results;
    };
    evaluate.tocompute = tocompute;
    evaluate();
    return evaluate;
  };

  observable = function(value) {
    var bindings, cached, evaluate;
    if (value.id) return value;
    cached = value;
    bindings = [];
    evaluate = function(value) {
      addToStack(evaluate);
      if ((value != null) && value !== cached) {
        cached = value;
        bindings = notify(bindings, value);
      }
      return cached;
    };
    evaluate.id = obsids++;
    evaluate.bind = function(call) {
      return bindings.push(call);
    };
    return evaluate;
  };

  runs = 0;

  count = 10000;

  stop = false;

  t_make = 0;

  t_update = 0;

  t_verify1 = 0;

  t_verify2 = 0;

  self.stop = function() {
    return stop = true;
  };

  self.startmy = function() {
    t_make = 0;
    t_update = 0;
    t_verify1 = 0;
    t_verify2 = 0;
    return run(observable(10), observable, computed);
  };

  self.startko = function() {
    t_make = 0;
    t_update = 0;
    t_verify1 = 0;
    t_verify2 = 0;
    return run(ko.observable(10), ko.observable, ko.computed);
  };

  run = function(base, observable, computed) {
    var b, c, d, i, results, t0, v3, _ref, _ref2, _ref3, _ref4;
    t0 = Date.now();
    results = [];
    for (i = 0; 0 <= count ? i < count : i > count; 0 <= count ? i++ : i--) {
      b = observable(i);
      c = computed((function(b) {
        return function() {
          return b() + 1;
        };
      })(b));
      d = computed((function(c) {
        return function() {
          if (base() > 50) {
            return c() + base();
          } else {
            return c() - base();
          }
        };
      })(c));
      results.push([b, c, d]);
    }
    t_make += Date.now() - t0;
    t0 = Date.now();
    base(100);
    t_update += Date.now() - t0;
    t0 = Date.now();
    for (i = 0, _ref = results.length; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
      _ref2 = results[i], b = _ref2[0], c = _ref2[1], d = _ref2[2];
      v3 = base() > 50 ? (i + 1) + base() : (i + 1) - base();
      if (b() !== i) throw Error('assert');
      if (c() !== i + 1) throw Error('assert');
      if (d() !== v3) throw Error('assert');
    }
    t_verify1 += Date.now() - t0;
    t0 = Date.now();
    for (i = 0, _ref3 = results.length; 0 <= _ref3 ? i < _ref3 : i > _ref3; 0 <= _ref3 ? i++ : i--) {
      _ref4 = results[i], b = _ref4[0], c = _ref4[1], d = _ref4[2];
      v3 = base() > 50 ? (i + 1) + base() : (i + 1) - base();
      if (b() !== i) throw Error('assert');
      if (c() !== i + 1) throw Error('assert');
      if (d() !== v3) throw Error('assert');
    }
    t_verify2 += Date.now() - t0;
    runs += 1;
    console.log("make: " + ((t_make / runs).toFixed(2)) + "ms\nupdate: " + ((t_update / runs).toFixed(2)) + "ms\nverify1: " + ((t_verify1 / runs).toFixed(2)) + "ms\nverify2: " + ((t_verify2 / runs).toFixed(2)) + "ms");
    base(0);
    if (!stop) {
      return setTimeout((function() {
        return run(base, observable, computed);
      }), 10);
    }
  };

}).call(this);
