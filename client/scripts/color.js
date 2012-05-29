(function() {

  define([], function() {
    var hue2rgb;
    hue2rgb = function(m1, m2, h) {
      h = h < 0 ? h + 1 : (h > 1 ? h - 1 : h);
      if (h * 6 < 1) return m1 + (m2 - m1) * h * 6;
      if (h * 2 < 1) return m2;
      if (h * 3 < 2) return m1 + (m2 - m1) * (0.66666 - h) * 6;
      return m1;
    };
    return {
      cssrgba: function(rgba) {
        var b, g, r;
        r = Math.round(rgba[0]);
        g = Math.round(rgba[1]);
        b = Math.round(rgba[2]);
        if (rgba.length === 4) {
          return "rgba(" + r + "," + g + "," + b + "," + rgba[3] + ")";
        } else {
          return "rgb(" + r + "," + g + "," + b + ")";
        }
      },
      hsl2rgb: function(hsl) {
        var h, l, m1, m2, s;
        h = hsl[0], s = hsl[1], l = hsl[2];
        m2 = l <= 0.5 ? l * (s + 1) : l + s - l * s;
        m1 = l * 2 - m2;
        return [hue2rgb(m1, m2, h + 0.33333) * 255, hue2rgb(m1, m2, h) * 255, hue2rgb(m1, m2, h - 0.33333) * 255];
      },
      rgb2hsl: function(rgb) {
        var b, delta, g, h, l, max, min, r, s, x, _ref;
        _ref = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = rgb.length; _i < _len; _i++) {
            x = rgb[_i];
            _results.push(x / 255);
          }
          return _results;
        })(), r = _ref[0], g = _ref[1], b = _ref[2];
        min = Math.min(r, Math.min(g, b));
        max = Math.max(r, Math.max(g, b));
        delta = max - min;
        l = (min + max) / 2;
        s = 0;
        if (l > 0 && l < 1) s = delta / (l < 0.5 ? 2 * l : 2 - 2 * l);
        h = 0;
        if (delta > 0) {
          if (max === r && max !== g) h += (g - b) / delta;
          if (max === g && max !== b) h += 2 + (b - r) / delta;
          if (max === b && max !== r) h += 4 + (r - g) / delta;
          h /= 6;
        }
        return [h, s, l];
      }
    };
  });

}).call(this);
