(function() {

  define(['events', 'time', 'progress'], function(_arg, time, _arg2) {
    var Progress, XHR, computed, observable, throttle;
    observable = _arg.observable, computed = _arg.computed, throttle = _arg.throttle;
    Progress = _arg2.Progress;
    XHR = (function() {

      function XHR() {
        this.onsuccess = function() {};
        this.onerror = function() {};
        this.onabort = function() {};
        this.abort = function() {};
        this.status = observable('waiting');
        this.throttle = 100;
        this.outgoing = Progress();
        this.incoming = Progress();
        this.incoming.headers = observable(null);
        this.incoming.body = observable(null);
        this.timeout = {
          start: null,
          onstart: function() {},
          transfer: null,
          ontransfer: function() {}
        };
      }

      XHR.prototype.send = function(method, url, data, headers) {
        var createTimer, header, s_timer, t_timer, xhr,
          _this = this;
        if (headers == null) headers = {};
        xhr = new XMLHttpRequest();
        createTimer = function(timeout, call) {
          if (timeout) {
            return time.Timer(timeout, function() {
              xhr.onabort = call;
              xhr.abort();
              return _this.status('timedout');
            });
          } else {
            return null;
          }
        };
        s_timer = createTimer(this.timeout.start, this.timeout.onstart);
        t_timer = createTimer(Math.max(this.timeout.transfer, this.throttle * 5), this.timeout.ontransfer);
        this.incoming.reset(0);
        this.outgoing.reset(0);
        xhr.onloadend = function() {
          if (s_timer != null) s_timer.stop();
          return t_timer != null ? t_timer.stop() : void 0;
        };
        xhr.onloadstart = function(event) {
          if (t_timer != null) t_timer.start();
          return _this.status('sending');
        };
        xhr.onload = function(event) {
          _this.outgoing.done(_this.outgoing.total());
          _this.incoming.done(_this.incoming.total());
          _this.incoming.headers(event.target.getAllResponseHeaders());
          _this.incoming.body(event.target.response);
          _this.status('done');
          return _this.onsuccess(event);
        };
        xhr.onprogress = throttle(this.throttle, function(event) {
          if (t_timer != null) t_timer.start();
          if (t_timer != null) t_timer.reset();
          if (s_timer != null) s_timer.stop();
          _this.incoming.total(Math.max(event.total, event.loaded));
          return _this.incoming.done(event.loaded);
        });
        xhr.upload.onprogress = throttle(this.throttle, function(event) {
          if (t_timer != null) t_timer.start();
          if (t_timer != null) t_timer.reset();
          if (s_timer != null) s_timer.stop();
          _this.outgoing.total(Math.max(event.total, event.loaded));
          return _this.outgoing.done(event.loaded);
        });
        xhr.onabort = function() {
          _this.status('stopped');
          return _this.onabort();
        };
        xhr.onerror = function(error) {
          _this.status('error');
          return _this.onerror(error);
        };
        xhr.open(method, url);
        for (header in headers) {
          xhr.setRequestHeader(header, headers[header]);
        }
        xhr.send(data);
        if (s_timer != null) s_timer.start();
        return this.abort = function() {
          return xhr.abort();
        };
      };

      return XHR;

    })();
    self.testXHR = function() {
      var xhr, _i, _results;
      xhr = new XHR();
      xhr.timeout.connect.after(0);
      xhr.timeout.transfer.after(0);
      computed(function() {
        return console.log('status:', xhr.status());
      });
      computed(function() {
        console.log('received:', xhr.incoming.progress.done());
        return console.log('      of:', xhr.incoming.progress.total(), '@', xhr.incoming.progress.rate.nice());
      });
      computed(function() {
        console.log('sent:', xhr.outgoing.progress.done());
        return console.log('  of:', xhr.outgoing.progress.total(), '@', xhr.outgoing.progress.rate.nice());
      });
      xhr.send('PUT', 'http://localhost:8888/uploads/test', "" + (function() {
        _results = [];
        for (_i = 0; _i < 5000000; _i++){ _results.push(_i); }
        return _results;
      }).apply(this));
      return xhr;
    };
    return XHR;
  });

}).call(this);
