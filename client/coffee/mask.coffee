
define ['base','color','canvas'], (base,color,canvas) ->

    Layer = (id,rows,cols,label,rgb) ->

        layer = {}
        layer.mask  = base.observable undefined
        layer.fill  = base.observable undefined
        layer.label = base.observable label

        layer.rgb = base.observable rgb
        layer.cssrgb = base.dependent -> color.cssrgba layer.rgb()

        layer.size = base.observable
            width  : cols
            height : rows

        layer.masked  = -> canvas.filters.mask(layer.mask())
        layer.outline = -> canvas.filters.outline(layer.mask(),layer.fill(),[0,255,0,1])
        layer.recolor = -> canvas.filters.recolor(layer.mask(),layer.rgb())
        layer.clear   = -> canvas.filters.clear(layer.mask(),layer.rgb())
        layer.asPNG   = -> canvas.filters.mask(layer.mask()).toDataURL('image/png')
        layer.asAlphaPNG = -> canvas.filters.asAlpha(layer.mask()).toDataURL('image/png')

        layer.save = (url,callback) ->
            $.ajax url,
                type: 'POST'
                data: layer.asPNG()
                success: callback

        base.subscription
            values:  [ layer.rgb ]
            actions: [ layer.recolor ]

        return layer

