
PROCESSING_SERVER = 'http://amibox04.scripps.edu:9050'

equals = (a,b) ->
    for x of a
        if a[x] != b[x] then return false
    return true

memoize = (func) ->
    last = []
    cached = undefined
    memoized = (args...) ->
        if not equals args, last
            last = args
            cached = func(args...)
        return cached

urlparam = (name) ->
    parse = memoize (search) ->
        params = {}
        parts = search[1...].split('&')
        for part in parts
            [key,value] = part.split('=')
            params[key] = value
        return params
    parsed = parse(window.location.search)
    parsed[name]

pollStackAverage = (projectid,stackid,callb) ->
    url  = "#{PROCESSING_SERVER}/projects/#{projectid}/stacks/#{stackid}/average"
    poll = ->
        $.ajax
            url: url
            success: (data) ->
                if not data.done or data.done < data.total
                    setTimeout poll, 1000
                console.log 'polling for stack average @',url,'->',data.url
                callb data.url
            error: ->
                setTimeout poll, 1000
    poll()

require ['base'
         'color'
         'canvas'
         'colorpicker'
         'brushes'
         'mask'
         'progress'], (base,color,canvas,ColorPicker,brushes,Layer,progress) ->

    ViewModel = ->

        model = {}

        model.projectid = base.observable urlparam 'projectid'
        model.stackid = base.observable urlparam 'stackid'

        model.layers = ko.observableArray()
        model.layers.selected = base.observable()
        model.layers.background = base.observable null
        pollStackAverage model.projectid(),model.stackid(),model.layers.background

        model.viewsize = base.observable width:400, height:400
        model.masksize = base.observable width:380, height:380

        model.picker = ColorPicker()

        model.brush = base.observable()
        model.brush.min = base.dependent -> model.viewsize().width*0.005
        model.brush.max = base.dependent -> model.viewsize().width*0.1
        model.brush.size = base.observable ( model.brush.min() + model.brush.max() ) / 2
        model.brush.softness = base.observable model.brush.min()*2

        newBrush = (proto) ->
            brush = proto
                postmove: -> model.layers.selected()?.outline()
                stroke_width : model.brush.size
                blur_radius  : model.brush.softness
                stroke_color : ko.computed -> model.layers.selected()?.csscolor()
            brush.selected = ko.computed -> model.brush() == brush
            brush.select = -> model.brush brush
            return brush

        model.brushes =
            eraser : newBrush brushes.Eraser
            masker : newBrush brushes.Masker
            paint  : newBrush brushes.Paint

        model.brushes.eraser.select()

        #-bindings between viewmodels--------------------
        last_brush = undefined
        ko.dependentObservable ->
            brush = model.brush()
            selected = model.layers.selected()
            if last_brush
                last_brush.canvas undefined
                last_brush.target undefined
            if brush and selected
                brush.canvas selected.mask()
                brush.target selected.fill()
            last_brush = brush
        base.dependent ->
            size = model.masksize()
            for layer in model.layers()
                layer.size(size)
        #------------------------------------------------

        model.global_alpha = ko.observable(0.6)

        model.zoomOn = (avg) ->
            $('#zoom .class-average').attr('src',avg.url.last)
            return false

        model.toggleZoom = (event) ->
            $('#zoom').toggle(10)
            $('#zoom').draggable
                stop: (_,ui) ->
                    ui.helper.css 'position','fixed'
            $('#zoom').resizable
                aspectRatio: true
            return false

        model.toggleZoomMask = (result) ->
            $('#zoom .class-mask').attr('src',result.mask).toggle(10)
            return false

        model.results = ko.observableArray()
        model.results.tracked = {}
        model.addResult = (url,layer,xdim,ydim) ->
            if model.results.tracked[url]
                return
            result =
                color: ko.dependentObservable ->
                    alpha = model.global_alpha()
                    rgb = layer.rgb()
                    "rgba(#{rgb[0].toFixed(0)},#{rgb[1].toFixed(0)},#{rgb[2].toFixed(0)},#{alpha})"
                avgs : ({url:ko.observable(null)} for x in [0...xdim]) for y in [0...ydim]
                mask : layer.asAlphaPNG()
                progress : progress.uiProgressBar
                    percent : ko.observable 0.0
                    rgba    : ko.observable [100,200,100,1]
                    animate : false
                    stripes : false
                stop : ->
                    $.ajax
                        url: url
                        type: 'DELETE'
                        success: (data) ->
                            if data.killed
                                result.progress.rgba [200,100,100,1]
                                model.results.tracked[url] = false
            poll_time = 5000
            result.refresh = ->
                console.log 'polling for job status:',url
                $.ajax
                    url: url
                    timeout: poll_time * 2
                    success: (data) ->
                        console.log 'received status update:',url
                        if data.done and data.total
                            result.progress.percent ( data.done / data.total )
                        if data.avgs
                            for row in [0...ydim]
                                for col in [0...xdim]
                                    result.avgs[row][col].url data.avgs[row][col]
                        if data.done and data.done == data.total
                            return
                        if model.results.tracked[url]
                            setTimeout result.refresh, poll_time

                    error: ->
                        if model.results.tracked[url]
                            setTimeout result.refresh, poll_time
                return result
            model.results.unshift(result)
            model.results.tracked[url] = true
            return result.refresh()

        model.actions = [
            xmipp_som =
                name: 'XMIPP SOM Classification'
                templateid: 't_xmipp_som'
                xdim:   base.observable 8
                ydim:   base.observable 2
                radius: base.observable 1
                alpha:  base.observable 0.01
                iters:  base.observable 1000
                maskname: ko.computed ->
                    layer = model.layers.selected()
                    if not layer then return "None"
                    else return layer.label()
                start : ->
                    layer = model.layers.selected()
                    if layer
                        layer.save "#{PROCESSING_SERVER}/images", (data) ->
                            console.log 'mask saved to server under id:', data.id
                            params =
                                maskid : data.id
                                projectid : model.projectid()
                                stackid : model.stackid()
                                xdim : xmipp_som.xdim()
                                ydim : xmipp_som.ydim()
                                radius : xmipp_som.radius()
                                alpha : xmipp_som.alpha()
                                iters : xmipp_som.iters()
                            $.post "#{PROCESSING_SERVER}/xmipp/som", JSON.stringify(params), (data)->
                                console.log 'server job is at:',data.url
                                model.addResult data.url,layer,params.xdim,params.ydim
        ]

        model.addLayer = ->

            {width: cols, height: rows} = model.masksize()
            pastel_rgb = color.hsl2rgb [base.randomF(0,1.0),1.0,base.randomF(0.7,0.8)]

            layer = Layer undefined, rows, cols, 'unlabeled', pastel_rgb

            # used for ui related to layer being selected
            layer.selected = ko.computed -> model.layers.selected() == layer
            layer.hidden   = ko.computed -> !layer.selected()
            layer.visible  = ko.computed -> !layer.hidden()
            layer.mzindex  = ko.computed -> if layer.selected() then 2 else 1
            layer.fzindex  = ko.computed -> if layer.selected() then 3 else 1
            layer.rowcolor = ko.computed -> if layer.selected() then 'rgb(220,220,255)' else 'rgb(255,255,255)'

            layer.mopacity = ko.computed -> if layer.visible() then model.global_alpha().toFixed(2) else '0.0'
            layer.fopacity = ko.computed -> if layer.visible() && layer.selected() then '1.0' else '0.0'

            layer.csscolor = ko.computed -> color.cssrgba layer.rgb()

            # events for the current layer
            layer.remove = -> model.layers.remove(layer)
            layer.select = -> model.layers.selected(layer)

            model.layers.selected(layer)
            model.layers.push(layer)

            layer.clear()

        return model


    $(document).ready ->
        window.vm = ViewModel()
        ko.applyBindings(vm)
        $('body').on 'keypress', (event) ->
            if document.activeElement == document.body
                switch event.which
                    when 91 then vm.brush.size vm.brush.size() - vm.brush.min()
                    when 93 then vm.brush.size vm.brush.size() + vm.brush.min()


    ko.bindingHandlers.size =
        update: (element,_values) ->
            values = _values()()
            $element = $(element)
            $element.height(values.height)
            $element.width(values.width)


    ko.bindingHandlers.slider =
        init: (element,_values) ->
            values = _values()
            if values.value
                $(element).attr('value',values.value())
                $(element).bind('change',->values.value(parseFloat(@value)))
        update: (element,_model) ->
            model = _model()
            $(element).attr('min',ko.utils.unwrapObservable(model.min||0.0))
            $(element).attr('max',ko.utils.unwrapObservable(model.max||1.0))
            $(element).attr('value',ko.utils.unwrapObservable(model.value))


    ko.bindingHandlers.bimg =
        update: (img,_url) ->
            url = ko.utils.unwrapObservable _url()
            img.onload = ->
                _url().last = url
            img.src = url



