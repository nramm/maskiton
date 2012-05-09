(function() {
  var Canvas, asAlpha, loadURL, mask, outline, realSize, resize, saveURL;

  Canvas = function(rows, cols) {
    var canvas;
    canvas = document.createElement('canvas');
    canvas.height = rows;
    canvas.width = cols;
    return canvas;
  };

  resize = function(canvas, size) {
    var bctx, buffer, ncols, nrows, ocols, octx, orows, scalex, scaley;
    if (canvas === void 0) return;
    orows = canvas.height;
    ocols = canvas.width;
    nrows = size.height;
    ncols = size.width;
    if (orows === nrows && ocols === ncols) return;
    if (orows === 0 || ocols === 0) {
      canvas.height = nrows;
      canvas.width = ncols;
      return;
    }
    buffer = Canvas(orows, ocols);
    bctx = buffer != null ? buffer.getContext('2d') : void 0;
    if (bctx) {
      bctx.globalCompositeOperation = 'copy';
      bctx.drawImage(canvas, 0, 0);
      scalex = ncols / ocols;
      scaley = nrows / orows;
      canvas.width = ncols;
      canvas.height = nrows;
      octx = canvas.getContext('2d');
      if (octx) {
        octx.save();
        octx.globalCompositeOperation = 'copy';
        octx.scale(scalex, scaley);
        octx.drawImage(buffer, 0, 0);
        return octx.restore();
      }
    }
  };

  asAlpha = function(src, dst) {
    var b_ctx, cols, rows;
    rows = src.width;
    cols = src.height;
    if (dst === void 0) dst = Canvas(rows, cols);
    b_ctx = dst.getContext('2d');
    b_ctx.save();
    b_ctx.shadowBlur = 0;
    b_ctx.globalCompositeOperation = 'copy';
    b_ctx.drawImage(src, 0, 0);
    b_ctx.globalCompositeOperation = 'source-in';
    b_ctx.fillStyle = "rgba(0,0,0,1)";
    b_ctx.fillRect(0, 0, cols, rows);
    b_ctx.restore();
    return dst;
  };

  mask = function(src, dst) {
    var b_ctx, cols, rows;
    rows = src.width;
    cols = src.height;
    if (dst === void 0) dst = Canvas(rows, cols);
    b_ctx = dst.getContext('2d');
    b_ctx.save();
    b_ctx.shadowBlur = 0;
    b_ctx.globalCompositeOperation = 'copy';
    b_ctx.drawImage(src, 0, 0);
    b_ctx.globalCompositeOperation = 'source-in';
    b_ctx.fillStyle = "rgba(0,0,0,1)";
    b_ctx.fillRect(0, 0, cols, rows);
    b_ctx.globalCompositeOperation = 'destination-over';
    b_ctx.fillStyle = "rgba(255,255,255,1)";
    b_ctx.fillRect(0, 0, cols, rows);
    b_ctx.restore();
    return dst;
  };

  outline = function(src, dst, rgba) {
    var b1_ctx, b2_ctx, buffer1, buffer2, cols, dst_ctx, rows;
    cols = src.width;
    rows = src.height;
    if (dst === void 0) dst = Canvas(rows, cols);
    buffer1 = Canvas(rows, cols);
    buffer2 = Canvas(rows, cols);
    b1_ctx = buffer1.getContext('2d');
    b2_ctx = buffer2.getContext('2d');
    b1_ctx.shadowBlur = 5;
    b1_ctx.drawImage(src, 0, 0);
    b1_ctx.shadowBlur = 0;
    b1_ctx.globalCompositeOperation = 'source-atop';
    b1_ctx.fillStyle = 'rgba(255,255,255,1)';
    b1_ctx.fillRect(0, 0, cols, rows);
    b2_ctx.fillStyle = 'rgba(255,255,255,1)';
    b2_ctx.fillRect(0, 0, cols, rows);
    b2_ctx.globalCompositeOperation = 'destination-out';
    b2_ctx.drawImage(buffer1, 0, 0);
    b1_ctx.globalCompositeOperation = 'source-over';
    b1_ctx.drawImage(buffer2, 0, 0);
    b2_ctx.globalCompositeOperation = 'source-over';
    b2_ctx.fillStyle = "rgba(" + rgba[0] + "," + rgba[1] + "," + rgba[2] + "," + rgba[3] + ")";
    b2_ctx.fillRect(0, 0, cols, rows);
    b2_ctx.globalCompositeOperation = 'destination-out';
    b2_ctx.drawImage(buffer1, 0, 0);
    b2_ctx.globalCompositeOperation = 'lighter';
    b2_ctx.drawImage(buffer2, 0, 0);
    dst_ctx = dst.getContext('2d');
    dst_ctx.globalCompositeOperation = 'copy';
    dst_ctx.drawImage(buffer2, 0, 0);
    return dst;
  };

  loadURL = function(canvas, url, success) {
    var image;
    image = new Image;
    image.onload = function() {
      var context;
      if (canvas.width !== image.width) canvas.width = image.width;
      if (canvas.height !== image.height) canvas.height = image.height;
      context = canvas.getContext('2d');
      context.save();
      context.globalCompositeOperation = 'copy';
      context.drawImage(image, 0, 0);
      context.restore();
      if (success) return success();
    };
    return image.src = url;
  };

  saveURL = function(canvas, url, success) {
    return $.ajax(url, {
      type: 'POST',
      data: canvas.toDataURL('image/png'),
      success: success
    });
  };

  realSize = function(img) {
    var newimg;
    if (img.naturalHeight && img.naturalWidth) {
      return {
        width: img.naturalWidth,
        height: img.naturalHeight
      };
    } else {
      newimg = document.createElement('img');
      newimg.src = img.src;
      return {
        width: newimg.width,
        height: newimg.height
      };
    }
  };

  define(['base', 'color'], function(base, _arg) {
    var clear, cssrgba, exports, recolor;
    cssrgba = _arg.cssrgba;
    recolor = function(canvas, newrgb) {
      var cols, context, rows;
      rows = canvas.width;
      cols = canvas.height;
      context = canvas.getContext('2d');
      context.save();
      context.globalCompositeOperation = 'source-atop';
      context.fillStyle = cssrgba(newrgb);
      context.fillRect(0, 0, cols, rows);
      return context.restore();
    };
    clear = function(canvas, rgb) {
      var context;
      if (canvas === void 0) return;
      context = canvas.getContext('2d');
      context.save();
      context.fillStyle = cssrgba(rgb);
      context.globalCompositeOperation = 'copy';
      context.fillRect(0, 0, canvas.width, canvas.height);
      return context.restore();
    };
    ko.bindingHandlers.canvas = {
      init: function(canvas, _value, _, vm) {
        var values;
        values = _value();
        if (values.bind) return values.bind(canvas);
      },
      update: function(canvas, _values) {
        var size, _ref;
        size = (_ref = _values()) != null ? typeof _ref.size === "function" ? _ref.size() : void 0 : void 0;
        if ((size != null ? size.width : void 0) !== canvas.width || (size != null ? size.height : void 0) !== canvas.height) {
          return resize(canvas, size);
        }
      }
    };
    ko.bindingHandlers.img = {
      init: function(element, _values) {
        var values;
        values = _values();
        if (values.size) {
          return element.onload = function(event) {
            return values.size(realSize(event.target));
          };
        }
      },
      update: function(element, _values) {
        var url, values;
        values = _values();
        if (values.src) {
          url = ko.utils.unwrapObservable(values.src);
          return element.src = url;
        }
      }
    };
    return exports = {
      filters: {
        outline: outline,
        recolor: recolor,
        mask: mask,
        resize: resize,
        clear: clear,
        asAlpha: asAlpha
      },
      loadURL: loadURL,
      saveURL: saveURL,
      Canvas: Canvas,
      realSize: realSize
    };
  });

}).call(this);
