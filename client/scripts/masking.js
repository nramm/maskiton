(function() {
  var PROCESSING_SERVER, equals, memoize, pollStackAverage, urlparam,
    __slice = Array.prototype.slice;

  PROCESSING_SERVER = 'http://amibox04.scripps.edu:9050';

  equals = function(a, b) {
    var x;
    for (x in a) {
      if (a[x] !== b[x]) return false;
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

  pollStackAverage = function(projectid, stackid, callb) {
    var poll, url;
    url = "" + PROCESSING_SERVER + "/projects/" + projectid + "/stacks/" + stackid + "/average";
    poll = function() {
      return $.ajax({
        url: url,
        success: function(data) {
          if (!data.done || data.done < data.total) setTimeout(poll, 1000);
          console.log('polling for stack average @', url, '->', data.url);
          return callb(data.url);
        },
        error: function() {
          return setTimeout(poll, 1000);
        }
      });
    };
    return poll();
  };

  require(['base', 'color', 'canvas', 'colorpicker', 'brushes', 'mask', 'progress'], function(base, color, canvas, ColorPicker, brushes, Layer, progress) {
    var ViewModel;
    ViewModel = function() {
      var last_brush, model, newBrush, xmipp_som;
      model = {};
      model.projectid = base.observable(urlparam('projectid'));
      model.stackid = base.observable(urlparam('stackid'));
      model.layers = ko.observableArray();
      model.layers.selected = base.observable();
      model.layers.background = base.observable(null);
      pollStackAverage(model.projectid(), model.stackid(), model.layers.background);
      model.viewsize = base.observable({
        width: 400,
        height: 400
      });
      model.masksize = base.observable({
        width: 380,
        height: 380
      });
      model.picker = ColorPicker();
      model.brush = base.observable();
      model.brush.min = base.dependent(function() {
        return model.viewsize().width * 0.005;
      });
      model.brush.max = base.dependent(function() {
        return model.viewsize().width * 0.1;
      });
      model.brush.size = base.observable((model.brush.min() + model.brush.max()) / 2);
      model.brush.softness = base.observable(model.brush.min() * 2);
      newBrush = function(proto) {
        var brush;
        brush = proto({
          postmove: function() {
            var _ref;
            return (_ref = model.layers.selected()) != null ? _ref.outline() : void 0;
          },
          stroke_width: model.brush.size,
          blur_radius: model.brush.softness,
          stroke_color: ko.computed(function() {
            var _ref;
            return (_ref = model.layers.selected()) != null ? _ref.csscolor() : void 0;
          })
        });
        brush.selected = ko.computed(function() {
          return model.brush() === brush;
        });
        brush.select = function() {
          return model.brush(brush);
        };
        return brush;
      };
      model.brushes = {
        eraser: newBrush(brushes.Eraser),
        masker: newBrush(brushes.Masker),
        paint: newBrush(brushes.Paint)
      };
      model.brushes.eraser.select();
      last_brush = void 0;
      ko.dependentObservable(function() {
        var brush, selected;
        brush = model.brush();
        selected = model.layers.selected();
        if (last_brush) {
          last_brush.canvas(void 0);
          last_brush.target(void 0);
        }
        if (brush && selected) {
          brush.canvas(selected.mask());
          brush.target(selected.fill());
        }
        return last_brush = brush;
      });
      base.dependent(function() {
        var layer, size, _i, _len, _ref, _results;
        size = model.masksize();
        _ref = model.layers();
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          layer = _ref[_i];
          _results.push(layer.size(size));
        }
        return _results;
      });
      model.global_alpha = ko.observable(0.6);
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
        $('#zoom .class-mask').attr('src', result.mask).toggle(10);
        return false;
      };
      model.results = ko.observableArray();
      model.results.tracked = {};
      model.addResult = function(url, layer, xdim, ydim) {
        var poll_time, result, x, y;
        if (model.results.tracked[url]) return;
        result = {
          color: ko.dependentObservable(function() {
            var alpha, rgb;
            alpha = model.global_alpha();
            rgb = layer.rgb();
            return "rgba(" + (rgb[0].toFixed(0)) + "," + (rgb[1].toFixed(0)) + "," + (rgb[2].toFixed(0)) + "," + alpha + ")";
          }),
          avgs: (function() {
            var _results;
            _results = [];
            for (y = 0; 0 <= ydim ? y < ydim : y > ydim; 0 <= ydim ? y++ : y--) {
              _results.push((function() {
                var _results2;
                _results2 = [];
                for (x = 0; 0 <= xdim ? x < xdim : x > xdim; 0 <= xdim ? x++ : x--) {
                  _results2.push({
                    url: ko.observable(null)
                  });
                }
                return _results2;
              })());
            }
            return _results;
          })(),
          mask: layer.asAlphaPNG(),
          progress: progress.uiProgressBar({
            percent: ko.observable(0.0),
            rgba: ko.observable([100, 200, 100, 1]),
            animate: false,
            stripes: false
          }),
          stop: function() {
            return $.ajax({
              url: url,
              type: 'DELETE',
              success: function(data) {
                if (data.killed) {
                  result.progress.rgba([200, 100, 100, 1]);
                  return model.results.tracked[url] = false;
                }
              }
            });
          }
        };
        poll_time = 5000;
        result.refresh = function() {
          console.log('polling for job status:', url);
          $.ajax({
            url: url,
            timeout: poll_time * 2,
            success: function(data) {
              var col, row;
              console.log('received status update:', url);
              if (data.done && data.total) {
                result.progress.percent(data.done / data.total);
              }
              if (data.avgs) {
                for (row = 0; 0 <= ydim ? row < ydim : row > ydim; 0 <= ydim ? row++ : row--) {
                  for (col = 0; 0 <= xdim ? col < xdim : col > xdim; 0 <= xdim ? col++ : col--) {
                    result.avgs[row][col].url(data.avgs[row][col]);
                  }
                }
              }
              if (data.done && data.done === data.total) return;
              if (model.results.tracked[url]) {
                return setTimeout(result.refresh, poll_time);
              }
            },
            error: function() {
              if (model.results.tracked[url]) {
                return setTimeout(result.refresh, poll_time);
              }
            }
          });
          return result;
        };
        model.results.unshift(result);
        model.results.tracked[url] = true;
        return result.refresh();
      };
      model.actions = [
        xmipp_som = {
          name: 'XMIPP SOM Classification',
          templateid: 't_xmipp_som',
          xdim: base.observable(8),
          ydim: base.observable(2),
          radius: base.observable(1),
          alpha: base.observable(0.01),
          iters: base.observable(1000),
          maskname: ko.computed(function() {
            var layer;
            layer = model.layers.selected();
            if (!layer) {
              return "None";
            } else {
              return layer.label();
            }
          }),
          start: function() {
            var layer;
            layer = model.layers.selected();
            if (layer) {
              return layer.save("" + PROCESSING_SERVER + "/images", function(data) {
                var params;
                console.log('mask saved to server under id:', data.id);
                params = {
                  maskid: data.id,
                  projectid: model.projectid(),
                  stackid: model.stackid(),
                  xdim: xmipp_som.xdim(),
                  ydim: xmipp_som.ydim(),
                  radius: xmipp_som.radius(),
                  alpha: xmipp_som.alpha(),
                  iters: xmipp_som.iters()
                };
                return $.post("" + PROCESSING_SERVER + "/xmipp/som", JSON.stringify(params), function(data) {
                  console.log('server job is at:', data.url);
                  return model.addResult(data.url, layer, params.xdim, params.ydim);
                });
              });
            }
          }
        }
      ];
      model.addLayer = function() {
        var cols, layer, pastel_rgb, rows, _ref;
        _ref = model.masksize(), cols = _ref.width, rows = _ref.height;
        pastel_rgb = color.hsl2rgb([base.randomF(0, 1.0), 1.0, base.randomF(0.7, 0.8)]);
        layer = Layer(void 0, rows, cols, 'unlabeled', pastel_rgb);
        layer.selected = ko.computed(function() {
          return model.layers.selected() === layer;
        });
        layer.hidden = ko.computed(function() {
          return !layer.selected();
        });
        layer.visible = ko.computed(function() {
          return !layer.hidden();
        });
        layer.mzindex = ko.computed(function() {
          if (layer.selected()) {
            return 2;
          } else {
            return 1;
          }
        });
        layer.fzindex = ko.computed(function() {
          if (layer.selected()) {
            return 3;
          } else {
            return 1;
          }
        });
        layer.rowcolor = ko.computed(function() {
          if (layer.selected()) {
            return 'rgb(220,220,255)';
          } else {
            return 'rgb(255,255,255)';
          }
        });
        layer.mopacity = ko.computed(function() {
          if (layer.visible()) {
            return model.global_alpha().toFixed(2);
          } else {
            return '0.0';
          }
        });
        layer.fopacity = ko.computed(function() {
          if (layer.visible() && layer.selected()) {
            return '1.0';
          } else {
            return '0.0';
          }
        });
        layer.csscolor = ko.computed(function() {
          return color.cssrgba(layer.rgb());
        });
        layer.remove = function() {
          return model.layers.remove(layer);
        };
        layer.select = function() {
          return model.layers.selected(layer);
        };
        model.layers.selected(layer);
        model.layers.push(layer);
        return layer.clear();
      };
      return model;
    };
    $(document).ready(function() {
      window.vm = ViewModel();
      ko.applyBindings(vm);
      return $('body').on('keypress', function(event) {
        if (document.activeElement === document.body) {
          switch (event.which) {
            case 91:
              return vm.brush.size(vm.brush.size() - vm.brush.min());
            case 93:
              return vm.brush.size(vm.brush.size() + vm.brush.min());
          }
        }
      });
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
    ko.bindingHandlers.slider = {
      init: function(element, _values) {
        var values;
        values = _values();
        if (values.value) {
          $(element).attr('value', values.value());
          return $(element).bind('change', function() {
            return values.value(parseFloat(this.value));
          });
        }
      },
      update: function(element, _model) {
        var model;
        model = _model();
        $(element).attr('min', ko.utils.unwrapObservable(model.min || 0.0));
        $(element).attr('max', ko.utils.unwrapObservable(model.max || 1.0));
        return $(element).attr('value', ko.utils.unwrapObservable(model.value));
      }
    };
    return ko.bindingHandlers.bimg = {
      update: function(img, _url) {
        var url;
        url = ko.utils.unwrapObservable(_url());
        img.onload = function() {
          return _url().last = url;
        };
        return img.src = url;
      }
    };
  });

}).call(this);
