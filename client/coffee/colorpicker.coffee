###
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
###

picker_template = 
'''
<div class="colorpicker">
    <div class="wheel" data-bind="size: size, respond: true">
        <img class="fitted" src="images/colorpicker/wheel.png"/>
        <div class="overlay">
            <img class="fitted" src="images/colorpicker/mask1.png"/>
            <img class="fitted" src="images/colorpicker/mask0.png"/>
            <img class="marker s" src="images/colorpicker/marker.png">
        </div>
        <img class="marker h" src="images/colorpicker/marker.png">
    </div>
    <div>
        <table>
            <tr>
                <td class="current" rowspan="2"></td>
                <td class="label">hsl:</td>
                <td class="value h"></td>
                <td class="value s"></td>
                <td class="value l"></td>
            </tr>
            <tr>
                <td class="label">rgb:</td>
                <td class="value r"></td>
                <td class="value g"></td>
                <td class="value b"></td>
            </tr>
        </table>
    </div>
</div>
'''

define ['base','color','popup'], (base,{rgb2hsl,hsl2rgb,cssrgba},_) ->

    ColorPicker = ->
        
        picker = {}
        picker.h = base.observable 0
        picker.s = base.observable 0
        picker.l = base.observable 0
        picker.size = base.observable 195
        picker.hsl = base.dependent
            read: -> [picker.h(),picker.s(),picker.l()]
            write: (hsl) ->
                picker.h hsl[0]
                picker.s hsl[1]
                picker.l hsl[2]
        picker.rgb = base.dependent
            read: -> hsl2rgb picker.hsl()
            write: (rgb) -> picker.hsl rgb2hsl rgb
        picker.r = base.dependent -> picker.rgb()[0]
        picker.g = base.dependent -> picker.rgb()[1]
        picker.b = base.dependent -> picker.rgb()[2]
        picker.css = base.dependent -> cssrgba picker.rgb()
        
        html =
            main: $(picker_template)
        extend html,
            wheel: $('.wheel',html.main)
            overlay: $('.overlay',html.main)
            current: $('.current',html.main)
            markers: $('.marker',html.main)
            table: $('table',html.main)
            ht: $('.value.h',html.main)
            st: $('.value.s',html.main)
            lt: $('.value.l',html.main)
            rt: $('.value.r',html.main)
            gt: $('.value.g',html.main)
            bt: $('.value.b',html.main)
            hm: $('.marker.h',html.main)
            sm: $('.marker.s',html.main)
        
        mouseup = (event) ->
            $(document).off('mousemove',htracker).off('mousemove',sltracker).off('mouseup',mouseup)
        
        mousedown = (event) ->
            $(document).bind('mouseup',mouseup)
            if html.overlay.under event
                $(document).on 'mousemove', sltracker
                sltracker event
            else
                $(document).on 'mousemove', htracker
                htracker event
            return false
        
        htracker = (event) ->
            center = html.wheel.center()
            position = 
                x: event.pageX - center.left
                y: event.pageY - center.top
            hue = Math.atan2(position.x,-position.y) / 6.28
            if hue < 0 then hue += 1
            picker.h hue
            return false
        
        sltracker = (event) ->
            overlay = html.overlay
            reference = overlay.offset()
            px = ( event.pageX - reference.left + 1 ) / overlay.width()
            py = ( event.pageY - reference.top  + 1 ) / overlay.height()
            picker.s Math.max Math.min(1.0-px,1.0), 0.0
            picker.l Math.max Math.min(1.0-py,1.0), 0.0
            return false
        
        bindings =
            osize: base.dependent -> 0.5 * picker.size()
            msize: base.dependent -> 0.08 * picker.size()
            radius: base.dependent -> 0.43 * picker.size()
        extend bindings,
            wheel:
                event: html.wheel.bind('mousedown',mousedown)
                size: base.dependent
                    read: ->
                        size = picker.size()
                        html.wheel.css
                            height: size
                            width:  size
            table:
                size: base.dependent ->
                    html.table.css
                        width: picker.size()
            overlay:
                size: base.dependent ->
                    size = picker.size()
                    osize = bindings.osize()
                    html.overlay.css
                        width  : osize
                        height : osize
                        left   : size / 2 - osize / 2
                        top    : size / 2 - osize / 2
                color: base.dependent ->
                    html.overlay.css 'background-color', cssrgba hsl2rgb [picker.h(),1,0.5]
            ht: base.dependent -> html.ht.text picker.h().toFixed(2)
            st: base.dependent -> html.st.text picker.s().toFixed(2)
            lt: base.dependent -> html.lt.text picker.l().toFixed(2)
            rt: base.dependent -> html.rt.text Math.round(picker.r())
            gt: base.dependent -> html.gt.text Math.round(picker.g())
            bt: base.dependent -> html.bt.text Math.round(picker.b())
            current: base.dependent -> html.current.css 'background-color', picker.css()
            markers: base.dependent ->
                size = bindings.msize()
                html.markers.css
                    height: size
                    width: size
            hm: base.dependent ->
                angle = picker.h() * 6.28
                center = picker.size()/2 - bindings.msize()/2
                radius = bindings.radius()
                html.hm.css
                    left : center + Math.sin(angle)*radius
                    top  : center - Math.cos(angle)*radius
            sm: base.dependent ->
                size = bindings.osize()
                msize = bindings.msize() / 2
                html.sm.css
                    left : size*(1.0-picker.s()) - msize
                    top  : size*(1.0-picker.l()) - msize
        
        picker.html = html.main
        
        return picker

    ko.bindingHandlers.ColorPicker =
        init: (element,_values) ->
            picker = _values()
            picker.html.css 'display', 'none'
            $(element).replaceWith(picker.html)
        
    ko.bindingHandlers.ColorWell = 
        
        init: (colorwell,_values) ->
            
            colorwell = $(colorwell)
            options = _values()
            
            picker = options.picker
            wcolor = options.rgb
            
            subscription = false
            
            colorwell.popup picker.html,
                ignore_pause: options.ignore_pause
                ignore_fade: options.ignore_fade
                ignore_exit: options.ignore_exit
                fade_in: options.fade_in
                onhide: (event) ->
                    if subscription != false
                        subscription.dispose()
                        subscription = false
                onshow: (event) ->
                    picker.rgb(wcolor())
                    subscription = picker.rgb.subscribe((rgb)->wcolor(rgb))
        
        update: (well,_values) ->
            rgb = _values().rgb()
            $(well).css('background-color',cssrgba(rgb))
                
    ColorPicker



