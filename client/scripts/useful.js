(function() {

  define(['sprintf'], function(sprintf) {
    var enumerate, exports, niceSize, split;
    enumerate = function(list) {
      var i, _ref, _results;
      _results = [];
      for (i = 0, _ref = list.length; 0 <= _ref ? i < _ref : i > _ref; 0 <= _ref ? i++ : i--) {
        _results.push([i, list[i]]);
      }
      return _results;
    };
    split = function(list, splits) {
      var i, splitsize, _ref;
      split = [];
      splitsize = Math.ceil(list.length / splits);
      for (i = 0, _ref = list.length; 0 <= _ref ? i < _ref : i > _ref; i += splitsize) {
        split.push(list.slice(i, (i + splitsize)));
      }
      return split;
    };
    niceSize = function(bytes) {
      var GB, KB, MB, TB;
      KB = 1024;
      MB = KB * 1024;
      GB = MB * 1024;
      TB = GB * 1024;
      if (bytes / KB < 1) {
        return "" + bytes + " B";
      } else if (bytes / MB < 1) {
        return "" + ((bytes / KB).toFixed(2)) + " KB";
      } else if (bytes / GB < 1) {
        return "" + ((bytes / MB).toFixed(2)) + " MB";
      } else if (bytes / TB < 1) {
        return "" + ((bytes / GB).toFixed(2)) + " GB";
      } else {
        return "" + ((bytes / TB).toFixed(2)) + " TB";
      }
    };
    return exports = {
      niceSize: niceSize,
      split: split,
      enumerate: enumerate
    };
  });

}).call(this);
