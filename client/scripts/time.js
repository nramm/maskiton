(function() {

  define(['sprintf'], function(sprintf) {
    var time;
    time = {};
    time.now = function() {
      return new Date().getTime() / 1000;
    };
    time.niceTime = function(secs) {
      var days, hours, mins, msecs;
      days = Math.floor(secs / (60 * 60 * 24));
      secs = secs - (days * 24 * 60 * 60);
      hours = Math.floor(secs / (60 * 60));
      secs = secs - (hours * 60 * 60);
      mins = Math.floor(secs / 60);
      secs = secs - (mins * 60);
      msecs = (secs - Math.floor(secs)) * 1000;
      secs = Math.floor(secs);
      if (secs < 1) {
        return sprintf('%dms', msecs);
      } else if (mins < 1) {
        return sprintf('%.2ds', secs);
      } else if (hours < 1) {
        return sprintf('%dm %ds', mins, secs);
      } else if (days < 1) {
        return sprintf('%dh %dm', hours, mins);
      } else {
        return sprintf('%d %dh %dm', days, hours, mins);
      }
    };
    time.Timer = function(timeout, call) {
      var keepalive, monitor, tickled, timer;
      tickled = true;
      keepalive = false;
      monitor = function() {
        if (keepalive) {
          if (tickled) {
            tickled = false;
          } else {
            call();
          }
          return setTimeout(monitor, timeout);
        }
      };
      return timer = {
        stop: function() {
          keepalive = false;
          return timer;
        },
        reset: function(time) {
          timeout = time || timeout;
          tickled = true;
          return timer;
        },
        start: function(time) {
          timeout = time || timeout;
          if (!keepalive) {
            keepalive = true;
            monitor();
          }
          return timer;
        }
      };
    };
    return time;
  });

}).call(this);
