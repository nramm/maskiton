
/*
 * Farbtastic Color Picker 1.2
 * © 2008 Steven Wittens
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
*/

(function() {
  var picker_template;

  picker_template = '<div class="colorpicker">\n    <div class="wheel" data-bind="size: size, respond: true">\n        <img class="fitted" src="images/colorpicker/wheel.png"/>\n        <div class="overlay">\n            <img class="fitted" src="images/colorpicker/mask1.png"/>\n            <img class="fitted" src="images/colorpicker/mask0.png"/>\n            <img class="marker s" src="images/colorpicker/marker.png">\n        </div>\n        <img class="marker h" src="images/colorpicker/marker.png">\n    </div>\n    <div>\n        <table>\n            <tr>\n                <td class="current" rowspan="2"></td>\n                <td class="label">hsl:</td>\n                <td class="value h"></td>\n                <td class="value s"></td>\n                <td class="value l"></td>\n            </tr>\n            <tr>\n                <td class="label">rgb:</td>\n                <td class="value r"></td>\n                <td class="value g"></td>\n                <td class="value b"></td>\n            </tr>\n        </table>\n    </div>\n</div>';

  define(['base', 'color', 'popup'], function(base, _arg, _) {
    var ColorPicker, cssrgba, hsl2rgb, rgb2hsl;
    rgb2hsl = _arg.rgb2hsl, hsl2rgb = _arg.hsl2rgb, cssrgba = _arg.cssrgba;
    ColorPicker = function() {
      var bindings, html, htracker, mousedown, mouseup, picker, sltracker;
      picker = {};
      picker.h = base.observable(0);
      picker.s = base.observable(0);
      picker.l = base.observable(0);
      picker.size = base.observable(195);
      picker.hsl = base.dependent({
        read: function() {
          return [picker.h(), picker.s(), picker.l()];
        },
        write: function(hsl) {
          picker.h(hsl[0]);
          picker.s(hsl[1]);
          return picker.l(hsl[2]);
        }
      });
      picker.rgb = base.dependent({
        read: function() {
          return hsl2rgb(picker.hsl());
        },
        write: function(rgb) {
          return picker.hsl(rgb2hsl(rgb));
        }
      });
      picker.r = base.dependent(function() {
        return picker.rgb()[0];
      });
      picker.g = base.dependent(function() {
        return picker.rgb()[1];
      });
      picker.b = base.dependent(function() {
        return picker.rgb()[2];
      });
      picker.css = base.dependent(function() {
        return cssrgba(picker.rgb());
      });
      html = {
        main: $(picker_template)
      };
      extend(html, {
        wheel: $('.wheel', html.main),
        overlay: $('.overlay', html.main),
        current: $('.current', html.main),
        markers: $('.marker', html.main),
        table: $('table', html.main),
        ht: $('.value.h', html.main),
        st: $('.value.s', html.main),
        lt: $('.value.l', html.main),
        rt: $('.value.r', html.main),
        gt: $('.value.g', html.main),
        bt: $('.value.b', html.main),
        hm: $('.marker.h', html.main),
        sm: $('.marker.s', html.main)
      });
      mouseup = function(event) {
        return $(document).off('mousemove', htracker).off('mousemove', sltracker).off('mouseup', mouseup);
      };
      mousedown = function(event) {
        $(document).bind('mouseup', mouseup);
        if (html.overlay.under(event)) {
          $(document).on('mousemove', sltracker);
          sltracker(event);
        } else {
          $(document).on('mousemove', htracker);
          htracker(event);
        }
        return false;
      };
      htracker = function(event) {
        var center, hue, position;
        center = html.wheel.center();
        position = {
          x: event.pageX - center.left,
          y: event.pageY - center.top
        };
        hue = Math.atan2(position.x, -position.y) / 6.28;
        if (hue < 0) hue += 1;
        picker.h(hue);
        return false;
      };
      sltracker = function(event) {
        var overlay, px, py, reference;
        overlay = html.overlay;
        reference = overlay.offset();
        px = (event.pageX - reference.left + 1) / overlay.width();
        py = (event.pageY - reference.top + 1) / overlay.height();
        picker.s(Math.max(Math.min(1.0 - px, 1.0), 0.0));
        picker.l(Math.max(Math.min(1.0 - py, 1.0), 0.0));
        return false;
      };
      bindings = {
        osize: base.dependent(function() {
          return 0.5 * picker.size();
        }),
        msize: base.dependent(function() {
          return 0.08 * picker.size();
        }),
        radius: base.dependent(function() {
          return 0.43 * picker.size();
        })
      };
      extend(bindings, {
        wheel: {
          event: html.wheel.bind('mousedown', mousedown),
          size: base.dependent({
            read: function() {
              var size;
              size = picker.size();
              return html.wheel.css({
                height: size,
                width: size
              });
            }
          })
        },
        table: {
          size: base.dependent(function() {
            return html.table.css({
              width: picker.size()
            });
          })
        },
        overlay: {
          size: base.dependent(function() {
            var osize, size;
            size = picker.size();
            osize = bindings.osize();
            return html.overlay.css({
              width: osize,
              height: osize,
              left: size / 2 - osize / 2,
              top: size / 2 - osize / 2
            });
          }),
          color: base.dependent(function() {
            return html.overlay.css('background-color', cssrgba(hsl2rgb([picker.h(), 1, 0.5])));
          })
        },
        ht: base.dependent(function() {
          return html.ht.text(picker.h().toFixed(2));
        }),
        st: base.dependent(function() {
          return html.st.text(picker.s().toFixed(2));
        }),
        lt: base.dependent(function() {
          return html.lt.text(picker.l().toFixed(2));
        }),
        rt: base.dependent(function() {
          return html.rt.text(Math.round(picker.r()));
        }),
        gt: base.dependent(function() {
          return html.gt.text(Math.round(picker.g()));
        }),
        bt: base.dependent(function() {
          return html.bt.text(Math.round(picker.b()));
        }),
        current: base.dependent(function() {
          return html.current.css('background-color', picker.css());
        }),
        markers: base.dependent(function() {
          var size;
          size = bindings.msize();
          return html.markers.css({
            height: size,
            width: size
          });
        }),
        hm: base.dependent(function() {
          var angle, center, radius;
          angle = picker.h() * 6.28;
          center = picker.size() / 2 - bindings.msize() / 2;
          radius = bindings.radius();
          return html.hm.css({
            left: center + Math.sin(angle) * radius,
            top: center - Math.cos(angle) * radius
          });
        }),
        sm: base.dependent(function() {
          var msize, size;
          size = bindings.osize();
          msize = bindings.msize() / 2;
          return html.sm.css({
            left: size * (1.0 - picker.s()) - msize,
            top: size * (1.0 - picker.l()) - msize
          });
        })
      });
      picker.html = html.main;
      return picker;
    };
    ko.bindingHandlers.ColorPicker = {
      init: function(element, _values) {
        var picker;
        picker = _values();
        picker.html.css('display', 'none');
        return $(element).replaceWith(picker.html);
      }
    };
    ko.bindingHandlers.ColorWell = {
      init: function(colorwell, _values) {
        var options, picker, subscription, wcolor;
        colorwell = $(colorwell);
        options = _values();
        picker = options.picker;
        wcolor = options.rgb;
        subscription = false;
        return colorwell.popup(picker.html, {
          ignore_pause: options.ignore_pause,
          ignore_fade: options.ignore_fade,
          ignore_exit: options.ignore_exit,
          fade_in: options.fade_in,
          onhide: function(event) {
            if (subscription !== false) {
              subscription.dispose();
              return subscription = false;
            }
          },
          onshow: function(event) {
            picker.rgb(wcolor());
            return subscription = picker.rgb.subscribe(function(rgb) {
              return wcolor(rgb);
            });
          }
        });
      },
      update: function(well, _values) {
        var rgb;
        rgb = _values().rgb();
        return $(well).css('background-color', cssrgba(rgb));
      }
    };
    return ColorPicker;
  });

}).call(this);
