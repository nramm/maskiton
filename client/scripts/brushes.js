(function() {
  var bindings;

  bindings = [['globalCompositeOperation', 'compositor'], ['fillStyle', 'fill_color'], ['strokeStyle', 'stroke_color'], ['lineWidth', 'stroke_width'], ['lineCap', 'stroke_cap'], ['lineJoin', 'stroke_join'], ['shadowBlur', 'blur_radius'], ['shadowColor', 'blur_color'], ['shadowOffsetX', 'blur_offset_x'], ['shadowOffsetY', 'blur_offset_y']];

  define(['base'], function(base) {
    var Brush, Eraser, Masker, Paint, applyBindings;
    applyBindings = function(brush, bindings) {
      var bind, binding, _i, _len, _results;
      bind = function(brush, binding) {
        var dst, src;
        src = binding[1];
        dst = binding[0];
        return base.dependent(function() {
          var value;
          if (brush.canvas()) {
            value = brush[src]();
            return brush.context[dst] = value;
          }
        });
      };
      _results = [];
      for (_i = 0, _len = bindings.length; _i < _len; _i++) {
        binding = bindings[_i];
        _results.push(bind(brush, binding));
      }
      return _results;
    };
    Brush = function(template) {
      var brush, last_target, subs, _down, _end, _move, _start, _up;
      if (template == null) template = {};
      brush = {};
      brush.canvas = base.observable(template.canvas);
      brush.target = base.observable(template.target);
      brush.context = void 0;
      brush.compositor = base.observable(template.compositor || 'copy');
      brush.fill_color = base.observable(template.fill_color || "rgb(0,0,0)");
      brush.stroke_color = base.observable(template.stroke_color || "rgb(0,0,0)");
      brush.stroke_width = base.observable(template.stroke_width || 10);
      brush.stroke_cap = base.observable(template.stroke_cap || 'round');
      brush.stroke_join = base.observable(template.stroke_join || 'round');
      brush.blur_color = base.observable(template.blur_color || "rgb(0,0,0)");
      brush.blur_radius = base.observable(template.blur_radius || 0);
      brush.blur_offset_x = base.observable(template.blur_offset_x || 0);
      brush.blur_offset_y = base.observable(template.blur_offset_y || 0);
      brush.ox = 0;
      brush.oy = 0;
      brush.sx = 0;
      brush.sy = 0;
      brush.position = function(event) {
        var px, py;
        py = (event.pageY - brush.oy) * brush.sy;
        px = (event.pageX - brush.ox) * brush.sx;
        return [px, py];
      };
      _start = function() {
        var canvas, target;
        target = brush.target();
        canvas = brush.canvas();
        if (canvas && target) {
          brush.context.save();
          brush.ox = $(target).offset().left;
          brush.oy = $(target).offset().top;
          brush.sx = canvas.width / target.offsetWidth;
          brush.sy = canvas.height / target.offsetHeight;
          return brush.original = brush.context.getImageData(0, 0, canvas.width, canvas.height);
        }
      };
      _end = function() {
        return brush.context.restore();
      };
      _down = function(event) {
        if (brush.canvas()) {
          if (brush.target()) {
            _start();
            $(document).bind('mousemove', _move);
            $(document).bind('mouseup', _up);
            if (template.predown) template.predown(event);
            if (brush.down) brush.down(event);
            if (template.postdown) template.postdown(event);
          }
        }
        return false;
      };
      _move = function(event) {
        if (template.premove) template.premove(event);
        if (brush.move) brush.move(event);
        if (template.postmove) template.postmove(event);
        return false;
      };
      _up = function(event) {
        if (template.preup) template.preup(event);
        if (brush.up) brush.up(event);
        if (template.postup) template.postup(event);
        $(document).unbind('mousemove', _move);
        $(document).unbind('mouseup', _up);
        _end();
        return false;
      };
      last_target = void 0;
      subs = [
        base.dependent(function() {
          var target;
          target = brush.target();
          if (last_target) $(last_target).unbind('mousedown', _down);
          if (target) $(target).bind('mousedown', _down);
          return last_target = target;
        }), base.dependent(function() {
          var _ref;
          return brush.context = (_ref = brush.canvas()) != null ? _ref.getContext('2d') : void 0;
        }), applyBindings(brush, bindings)
      ];
      return brush;
    };
    Paint = function(template) {
      var brush;
      brush = Brush(template);
      brush.blur_color = base.dependent({
        read: function() {
          return brush.stroke_color();
        },
        write: function(v) {
          return brush.stroke_color(v);
        }
      });
      brush.down = function(event) {
        var px, py, _ref;
        _ref = brush.position(event), px = _ref[0], py = _ref[1];
        brush.context.beginPath();
        return brush.context.moveTo(px, py);
      };
      brush.move = function(event) {
        var px, py, _ref;
        _ref = brush.position(event), px = _ref[0], py = _ref[1];
        brush.context.lineTo(px, py);
        brush.context.stroke();
        brush.context.beginPath();
        return brush.context.moveTo(px, py);
      };
      return brush;
    };
    Eraser = function(template) {
      var brush;
      brush = Paint(template);
      brush.compositor('destination-out');
      return brush;
    };
    Masker = function(template) {
      var brush, original;
      brush = Eraser(template);
      original = void 0;
      brush.down = function(event) {
        var px, py, _ref;
        _ref = brush.position(event), px = _ref[0], py = _ref[1];
        brush.context.beginPath();
        return brush.context.moveTo(px, py);
      };
      brush.move = function(event) {
        var px, py, _ref;
        _ref = brush.position(event), px = _ref[0], py = _ref[1];
        brush.context.putImageData(brush.original, 0, 0);
        brush.context.lineTo(px, py);
        return brush.context.fill();
      };
      brush.up = function(event) {
        return original = void 0;
      };
      return brush;
    };
    return window.brushes = {
      Eraser: Eraser,
      Masker: Masker,
      Paint: Paint
    };
  });

}).call(this);