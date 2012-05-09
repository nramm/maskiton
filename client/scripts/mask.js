(function() {

  define(['base', 'color', 'canvas'], function(base, color, canvas) {
    var Layer;
    return Layer = function(id, rows, cols, label, rgb) {
      var layer;
      layer = {};
      layer.mask = base.observable(void 0);
      layer.fill = base.observable(void 0);
      layer.label = base.observable(label);
      layer.rgb = base.observable(rgb);
      layer.cssrgb = base.dependent(function() {
        return color.cssrgba(layer.rgb());
      });
      layer.size = base.observable({
        width: cols,
        height: rows
      });
      layer.masked = function() {
        return canvas.filters.mask(layer.mask());
      };
      layer.outline = function() {
        return canvas.filters.outline(layer.mask(), layer.fill(), [0, 255, 0, 1]);
      };
      layer.recolor = function() {
        return canvas.filters.recolor(layer.mask(), layer.rgb());
      };
      layer.clear = function() {
        return canvas.filters.clear(layer.mask(), layer.rgb());
      };
      layer.asPNG = function() {
        return canvas.filters.mask(layer.mask()).toDataURL('image/png');
      };
      layer.asAlphaPNG = function() {
        return canvas.filters.asAlpha(layer.mask()).toDataURL('image/png');
      };
      layer.save = function(url, callback) {
        return $.ajax(url, {
          type: 'POST',
          data: layer.asPNG(),
          success: callback
        });
      };
      base.subscription({
        values: [layer.rgb],
        actions: [layer.recolor]
      });
      return layer;
    };
  });

}).call(this);
