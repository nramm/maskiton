(function() {

  define(['base'], function(base) {
    $.fn.popup = function(popup, options) {
      var clearIgnoreExit, clickExit, fade_in, hide, ignore_exit, ignore_fade, ignore_pause, offset, offset_x, offset_y, start, startIgnoreExit, target;
      if (options == null) options = {};
      target = this;
      offset = target.offset();
      offset = {
        left: offset.left + target.width() / 2,
        top: offset.top + target.height() / 2
      };
      fade_in = options.fade_in || 0;
      ignore_exit = options.ignore_pause || true;
      ignore_pause = options.ignore_pause || 200;
      ignore_fade = options.ignore_fade || 1000;
      offset_x = options.offset_x || 10;
      offset_y = options.offset_y || 10;
      if (popup.data('popup_inuse') === void 0) {
        popup.data('popup_inuse', false);
        popup.data('popup_onhide', []);
        popup.css('position', 'absolute');
        popup.css('display', 'none');
        popup.addClass('popup');
      }
      start = function(event) {
        if (popup.data('popup_inuse')) hide();
        popup.data('popup_inuse', true);
        if (options.onhide != null) {
          popup.data('popup_onhide').push(options.onhide);
        }
        if (options.onshow != null) options.onshow(popup);
        $(document).bind('mousedown', clickExit);
        popup.css({
          left: event.pageX - offset_x,
          top: event.pageY - offset_y
        });
        popup.fadeIn(options.fade_in, function() {
          if (ignore_exit) {
            popup.bind('mouseleave', startIgnoreExit);
            return popup.bind('mouseenter', clearIgnoreExit);
          }
        });
        return true;
      };
      clickExit = function(event) {
        if (!popup.under(event)) return hide();
      };
      hide = function() {
        var event, hide_events, _i, _len;
        hide_events = popup.data('popup_onhide');
        for (_i = 0, _len = hide_events.length; _i < _len; _i++) {
          event = hide_events[_i];
          event(popup);
        }
        if (popup.css('display') !== 'none') popup.stop(true).clearQueue().hide();
        $(document).unbind('mousedown', clickExit);
        popup.unbind('mouseleave', startIgnoreExit);
        popup.unbind('mouseenter', clearIgnoreExit);
        return popup.data('popup_inuse', false);
      };
      startIgnoreExit = function() {
        return popup.delay(ignore_pause).fadeOut(ignore_fade, hide);
      };
      clearIgnoreExit = function() {
        return popup.stop(true).clearQueue().css('opacity', 1.0);
      };
      return target.bind('mousedown', start);
    };
    return ko.bindingHandlers.popup = {
      init: function(element, _value, _values, vm) {
        var options;
        options = ko.utils.unwrapObservable(_value());
        return $(element).popup($(options.$), options);
      }
    };
  });

}).call(this);
