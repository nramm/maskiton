
bindings = [
    ['globalCompositeOperation' , 'compositor'    ]
    ['fillStyle'                , 'fill_color'    ]
    ['strokeStyle'              , 'stroke_color'  ]
    ['lineWidth'                , 'stroke_width'  ]
    ['lineCap'                  , 'stroke_cap'    ]
    ['lineJoin'                 , 'stroke_join'   ]
    ['shadowBlur'               , 'blur_radius'   ]
    ['shadowColor'              , 'blur_color'    ]
    ['shadowOffsetX'            , 'blur_offset_x' ]
    ['shadowOffsetY'            , 'blur_offset_y' ]
]

define ['base'], (base) ->

    applyBindings = (brush,bindings) ->
        bind = (brush,binding) ->
            src = binding[1]
            dst = binding[0]
            base.dependent ->
                if brush.canvas()
                    value = brush[src]()
                    brush.context[dst] = value
        for binding in bindings
            bind(brush,binding)

    Brush = (template={}) ->
        
        brush = {}
        brush.canvas = base.observable template.canvas
        brush.target = base.observable template.target
        brush.context = undefined
        brush.compositor    = base.observable (template.compositor)    || 'copy'
        brush.fill_color    = base.observable (template.fill_color)    || "rgb(0,0,0)"
        brush.stroke_color  = base.observable (template.stroke_color)  || "rgb(0,0,0)"
        brush.stroke_width  = base.observable (template.stroke_width)  || 10
        brush.stroke_cap    = base.observable (template.stroke_cap)    || 'round'
        brush.stroke_join   = base.observable (template.stroke_join)   || 'round'
        brush.blur_color    = base.observable (template.blur_color)    || "rgb(0,0,0)"
        brush.blur_radius   = base.observable (template.blur_radius)   || 0
        brush.blur_offset_x = base.observable (template.blur_offset_x) || 0
        brush.blur_offset_y = base.observable (template.blur_offset_y) || 0
        brush.ox = 0
        brush.oy = 0
        brush.sx = 0
        brush.sy = 0
        
        brush.position = (event) ->
            py = (event.pageY-brush.oy)*brush.sy
            px = (event.pageX-brush.ox)*brush.sx
            return [px,py]
        
        _start = ->
            target = brush.target()
            canvas = brush.canvas()
            if canvas and target
                brush.context.save()
                brush.ox = $(target).offset().left
                brush.oy = $(target).offset().top
                brush.sx = canvas.width  / target.offsetWidth
                brush.sy = canvas.height / target.offsetHeight 
                brush.original = brush.context.getImageData(0,0,canvas.width,canvas.height)
        
        _end = ->
            brush.context.restore()
        
        _down = (event) ->
            if brush.canvas()
                if brush.target()
                    _start()
                    $(document).bind('mousemove',_move)
                    $(document).bind('mouseup',_up)
                    if template.predown then template.predown(event)
                    if brush.down then brush.down(event)
                    if template.postdown then template.postdown(event)
            return false
        
        
        _move = (event) ->
            if template.premove then template.premove(event)
            if brush.move then brush.move(event)
            if template.postmove then template.postmove(event)
            return false
        
        
        _up = (event) ->
            if template.preup then template.preup(event)
            if brush.up then brush.up(event)
            if template.postup then template.postup(event)
            $(document).unbind('mousemove',_move)
            $(document).unbind('mouseup',_up)
            _end()
            return false
        
        
        last_target = undefined
        subs = [
            base.dependent ->
                target = brush.target()
                if last_target then $(last_target).unbind('mousedown',_down)
                if target then $(target).bind('mousedown',_down)
                last_target = target
            base.dependent ->
                brush.context = brush.canvas()?.getContext('2d')
            applyBindings(brush,bindings)
        ]
        
        
        return brush


    Paint = (template) ->
        
        brush = Brush(template)
        
        brush.blur_color = base.dependent
            read : -> brush.stroke_color()
            write : (v) -> brush.stroke_color v
        
        brush.down = (event) ->
            [px,py] = brush.position(event)
            brush.context.beginPath()
            brush.context.moveTo(px,py)
        
        brush.move = (event) ->
            [px,py] = brush.position(event)
            brush.context.lineTo(px,py)
            brush.context.stroke()
            brush.context.beginPath()
            brush.context.moveTo(px,py)
        
        return brush


    Eraser = (template) ->
        brush = Paint(template)
        brush.compositor 'destination-out'
        return brush


    Masker = (template) ->
        brush = Eraser(template)
        original = undefined
        brush.down = (event) ->
            [px,py] = brush.position(event)
            brush.context.beginPath()
            brush.context.moveTo(px,py)
        brush.move = (event) ->
            [px,py] = brush.position(event)
            brush.context.putImageData(brush.original,0,0)
            brush.context.lineTo(px,py)
            brush.context.fill()
        brush.up = (event) ->
            original = undefined
        return brush


    window.brushes =
        Eraser: Eraser
        Masker: Masker
        Paint: Paint






