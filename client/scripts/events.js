(function() {
  var __slice = Array.prototype.slice;

  define(['knockout-2.0.0'], function() {
    var Relay, computed, delay, exports, observable, throttle;
    computed = function(value) {
      if (ko.isObservable(value)) {
        return value;
      } else {
        return ko.computed(value);
      }
    };
    observable = function(value) {
      if (ko.isObservable(value)) {
        return value;
      } else {
        return ko.observable(value);
      }
    };
    Relay = (function() {

      function Relay() {
        this.reset();
      }

      Relay.prototype.on = function(event, call) {
        return this["for"](event, 0, call);
      };

      Relay.prototype.relay = function(call) {
        return this.delegates.push(call);
      };

      Relay.prototype["for"] = function(event, count, call) {
        var response;
        if (!(event in this.events)) this.events[event] = {};
        response = {
          resid: this.resids++,
          count: count,
          call: call
        };
        this.events[event][response.resid] = response;
        return this;
      };

      Relay.prototype.emit = function() {
        var args, callback, event, id, response, _i, _len, _ref;
        event = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        if (event in this.events) {
          for (id in this.events[event]) {
            response = this.events[event][id];
            response.call.apply(response, args);
            response.count--;
            if (response.count === 0) delete this.events[event][id];
          }
        }
        _ref = this.delegates;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          callback = _ref[_i];
          callback.apply(null, [event].concat(__slice.call(args)));
        }
        return this;
      };

      Relay.prototype.reset = function() {
        this.delegates = [];
        this.events = {};
        return this.resids = 0;
      };

      Relay.prototype.clear = function(event, call) {
        var response, _i, _len, _ref;
        if (!(event != null)) {
          this.events = {};
        } else if (!(typeof callback !== "undefined" && callback !== null)) {
          this.events[event] = {};
        } else {
          _ref = this.events[event];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            response = _ref[_i];
            if (response.call === call) delete this.events[event][response.resid];
          }
        }
        return this;
      };

      Relay.prototype.listen = Relay.prototype.on;

      Relay.prototype.respond = Relay.prototype.emit;

      Relay.prototype.addEventListener = Relay.prototype.on;

      return Relay;

    })();
    throttle = function(rate, tothrottle) {
      var last, throttled;
      last = Date.now();
      throttled = function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        if ((Date.now() - last) > rate) {
          tothrottle.apply(null, args);
          return last = Date.now();
        }
      };
      return throttled;
    };
    delay = function(msecs, call) {
      return setTimeout(call, msecs);
    };
    return exports = {
      Relay: Relay,
      throttle: throttle,
      delay: delay,
      observable: observable,
      computed: computed,
      uibindings: ko.bindingHandlers
    };
  });

}).call(this);