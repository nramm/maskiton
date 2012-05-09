(function() {
  var getBounds, getCenter, setCenter;

  setCenter = function(element, position) {
    return element.css({
      left: position.left - (element.width() / 2),
      top: position.top - (element.height() / 2)
    });
  };

  getCenter = function(element) {
    var center, offset;
    offset = element.offset();
    return center = {
      left: offset.left + (element.width() / 2),
      top: offset.top + (element.height() / 2)
    };
  };

  getBounds = function(element) {
    var bounds;
    bounds = element.offset();
    return extend(bounds, {
      bottom: bounds.top + element.outerHeight(),
      right: bounds.left + element.outerWidth()
    });
  };

  self.extend = function(obj, ext) {
    var key;
    for (key in ext) {
      if (ext.hasOwnProperty(key)) obj[key] = ext[key];
    }
    return obj;
  };

  define(['jquery-1.7.1', 'knockout-2.0.0', 'jquery-ui-1.8.16'], function() {
    $.fn.under = function(event) {
      var bounds;
      bounds = getBounds(this);
      if (event.pageY < bounds.top || event.pageY > bounds.bottom) return false;
      if (event.pageX < bounds.left || event.pageX > bounds.right) return false;
      return true;
    };
    $.fn.center = function(position) {
      if (position != null) {
        return setCenter(this, position);
      } else {
        return getCenter(this);
      }
    };
    return {
      observable: function(value, options) {
        if (!ko.isObservable(value)) value = ko.observable(value);
        if (options) value.extend(options);
        return value;
      },
      dependent: function(options) {
        var bound;
        bound = ko.dependentObservable(options);
        return bound;
      },
      throttle: function(throttle, tothrottle) {
        var run, throttled, throttling;
        throttling = false;
        run = function() {
          tothrottle();
          return throttling = false;
        };
        throttled = function() {
          if (throttling) return;
          return throttling = setTimeout(run, throttle);
        };
        return throttled;
      },
      delay: function(delay, todelay) {
        var delayed, delaying, run;
        delaying = false;
        run = function() {
          todelay();
          return delaying = false;
        };
        delayed = function() {
          if (delaying) clearTimeout(delaying);
          return delaying = setTimeout(run, delay);
        };
        return delayed;
      },
      subscription: function(options) {
        var action, dependent, _i, _len, _ref, _results;
        _ref = options.values;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          dependent = _ref[_i];
          _results.push((function() {
            var _j, _len2, _ref2, _results2;
            _ref2 = options.actions;
            _results2 = [];
            for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
              action = _ref2[_j];
              if (options.throttle) action = throttle(options.throttle, action);
              _results2.push(dependent.subscribe(action));
            }
            return _results2;
          })());
        }
        return _results;
      },
      subscriptions: function(subs) {
        var sub, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = subs.length; _i < _len; _i++) {
          sub = subs[_i];
          _results.push(subscription(sub));
        }
        return _results;
      },
      randomF: function(min, max) {
        return Math.random() * (max - min) + min;
      },
      randomI: function(min, max) {
        return Math.floor(randomF(min, max));
      }
    };
  });

}).call(this);
