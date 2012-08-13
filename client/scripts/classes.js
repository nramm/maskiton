// Generated by CoffeeScript 1.3.3
(function() {
  var PROCESSING_SERVER, equals, memoize, urlparam,
    __slice = [].slice;

  PROCESSING_SERVER = 'http://node-2:9050';

  equals = function(a, b) {
    var x;
    for (x in a) {
      if (a[x] !== b[x]) {
        return false;
      }
    }
    return true;
  };

  memoize = function(func) {
    var cached, last, memoized;
    last = [];
    cached = void 0;
    return memoized = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (!equals(args, last)) {
        last = args;
        cached = func.apply(null, args);
      }
      return cached;
    };
  };

  urlparam = function(name) {
    var parse, parsed;
    parse = memoize(function(search) {
      var key, params, part, parts, value, _i, _len, _ref;
      params = {};
      parts = search.slice(1).split('&');
      for (_i = 0, _len = parts.length; _i < _len; _i++) {
        part = parts[_i];
        _ref = part.split('='), key = _ref[0], value = _ref[1];
        params[key] = value;
      }
      return params;
    });
    parsed = parse(window.location.search);
    return parsed[name];
  };

  require(['base', 'color', 'canvas', 'colorpicker', 'brushes', 'mask', 'progress'], function(base, color, canvas, ColorPicker, brushes, Layer, progress) {
    var ViewModel;
    ViewModel = function() {
      var model, result;
      model = {};
      model.zoomOn = function(avg) {
        $('#zoom .class-average').attr('src', avg.url.last);
        return false;
      };
      model.toggleZoom = function(event) {
        $('#zoom').toggle(10);
        $('#zoom').draggable({
          stop: function(_, ui) {
            return ui.helper.css('position', 'fixed');
          }
        });
        $('#zoom').resizable({
          aspectRatio: true
        });
        return false;
      };
      model.toggleZoomMask = function(result) {
        $('#zoom .class-mask').attr('src', model.result.mask()).toggle(10);
        return false;
      };
      model.poll_time = 1000;
      model.url = PROCESSING_SERVER + '/xmipp/som/' + urlparam('id');
      console.log('set query url to:', model.url);
      result = {
        avgs: ko.observable(null),
        mask: ko.observable(null),
        progress: progress.uiProgressBar({
          percent: ko.observable(0.0),
          rgba: ko.observable([100, 200, 100, 1]),
          animate: false,
          stripes: false
        }),
        xdim: null,
        ydim: null
      };
      result.refresh = function() {
        $.ajax({
          url: model.url,
          timeout: model.poll_time * 2,
          success: function(data) {
            var col, row, x, y, _i, _j, _ref, _ref1;
            if (typeof data === 'string') {
              data = JSON.parse(data);
            }
            console.log('received result:', data);
            if (data.done && data.total) {
              result.progress.percent(data.done / data.total);
            }
            if (data.mask) {
              result.mask(data.mask);
            }
            if (data.avgs) {
              if (!result.avgs()) {
                result.ydim = data.avgs.length;
                result.xdim = data.avgs[0].length;
                result.avgs((function() {
                  var _i, _ref, _results;
                  _results = [];
                  for (y = _i = 0, _ref = result.ydim; 0 <= _ref ? _i < _ref : _i > _ref; y = 0 <= _ref ? ++_i : --_i) {
                    _results.push((function() {
                      var _j, _ref1, _results1;
                      _results1 = [];
                      for (x = _j = 0, _ref1 = result.xdim; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; x = 0 <= _ref1 ? ++_j : --_j) {
                        _results1.push({
                          url: ko.observable(null)
                        });
                      }
                      return _results1;
                    })());
                  }
                  return _results;
                })());
              }
              for (row = _i = 0, _ref = result.ydim; 0 <= _ref ? _i < _ref : _i > _ref; row = 0 <= _ref ? ++_i : --_i) {
                for (col = _j = 0, _ref1 = result.xdim; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; col = 0 <= _ref1 ? ++_j : --_j) {
                  result.avgs()[row][col].url(data.avgs[row][col]);
                }
              }
            }
            if (data.done && data.done === data.total) {
              return;
            }
            return setTimeout(result.refresh, model.poll_time);
          },
          error: function() {
            return setTimeout(result.refresh, model.poll_time);
          }
        });
        return result;
      };
      model.result = result;
      model.result.refresh();
      return model;
    };
    $(document).ready(function() {
      window.vm = ViewModel();
      return ko.applyBindings(vm);
    });
    ko.bindingHandlers.size = {
      update: function(element, _values) {
        var $element, values;
        values = _values()();
        $element = $(element);
        $element.height(values.height);
        return $element.width(values.width);
      }
    };
    return ko.bindingHandlers.bimg = {
      update: function(img, _url) {
        var url;
        url = ko.utils.unwrapObservable(_url());
        img.onload = function() {
          return _url().last = url;
        };
        img.onerror = function() {
          return img.src = void 0;
        };
        return img.src = url;
      }
    };
  });

}).call(this);
