(function() {

  define(['time', 'events', 'progress', 'xhr'], function(time, _arg, progress, XHR) {
    var Uploader, computed, exports, observable, sliceFile, throttle;
    observable = _arg.observable, computed = _arg.computed, throttle = _arg.throttle;
    sliceFile = function(file, src, dst) {
      var _sliceFile;
      if (src == null) src = 0;
      if (dst == null) dst = file.size;
      _sliceFile = file.webkitSlice || file.mozSlice;
      return _sliceFile.call(file, src, dst);
    };
    Uploader = (function() {
      var ids;

      ids = 0;

      function Uploader(file, url, opts) {
        if (opts == null) opts = {};
        this.file = file;
        this.id = "uploader-" + (ids++);
        this.url = url;
        this.status = observable('waiting');
        this.progress = progress.Progress();
        this.progress.total(this.file.size);
        this.progress.done(0);
        this.onupload = opts.onupload || function() {};
        this.onstart = opts.onstart || function() {};
        this.onerror = opts.onerror || function() {};
        this.retries = opts.retries || -1;
      }

      Uploader.prototype.fileStatus = function(nextCall) {
        var xhr,
          _this = this;
        xhr = new XHR();
        xhr.onerror = function() {
          return _this.status('no response from server');
        };
        xhr.onsuccess = function(event) {
          var status;
          status = JSON.parse(event.target.response);
          if (status.written >= _this.file.size) {
            _this.progress.reset(_this.file.size);
            _this.onupload(status);
            return _this.status('uploaded');
          } else {
            return nextCall(status);
          }
        };
        xhr.timeout.start = 5000;
        xhr.timeout.transfer = 20000;
        xhr.timeout.onstart = function() {
          return _this.status('connect timed out');
        };
        xhr.timeout.ontransfer = function() {
          return _this.status('transfer timed out');
        };
        this.stop = function() {
          return xhr.abort();
        };
        return xhr.send('GET', this.url);
      };

      Uploader.prototype.resumeUpload = function() {
        var _this = this;
        return this.fileStatus(function(status) {
          return _this.resumeUploadAt(status.written);
        });
      };

      Uploader.prototype.resumeUploadAt = function(offset) {
        var blob, xhr,
          _this = this;
        this.status('uploading...');
        this.onstart();
        this.progress.reset(offset);
        xhr = new XHR();
        xhr.onsuccess = function(event) {
          _this.progress.done(_this.file.size);
          _this.onupload(JSON.parse(event.target.response));
          return _this.status('uploaded');
        };
        xhr.onerror = function() {
          return _this.status('no response from server');
        };
        xhr.onabort = function() {
          return _this.status('stopped');
        };
        xhr.timeout.transfer = 5000;
        xhr.timeout.ontransfer = function() {
          return _this.status('upload timed out...');
        };
        xhr.outgoing.done.subscribe(function(done) {
          return _this.progress.done(offset + done);
        });
        this.stop = function() {
          return xhr.abort();
        };
        blob = sliceFile(this.file, offset);
        return xhr.send('PUT', this.url, blob, {
          'Content-Range': "" + offset + "-" + this.file.size + "/" + this.file.size
        });
      };

      Uploader.prototype.start = function() {
        return this.resumeUpload();
      };

      Uploader.prototype.resume = Uploader.prototype.start;

      Uploader.prototype.restart = function() {
        return this.resumeUploadAt(0);
      };

      return Uploader;

    })();
    return exports = {
      Uploader: Uploader
    };
  });

}).call(this);
