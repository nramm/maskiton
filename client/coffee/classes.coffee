
PROCESS_SERVER = 'undefined'

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

require ['base'
         'color'
         'canvas'
         'colorpicker'
         'brushes'
         'mask'
         'progress',
         'text!../config.json'], (base,color,canvas,ColorPicker,brushes,Layer,progress,config) ->

    { PROCESS_SERVER } = JSON.parse config

    ViewModel = ->

        model = {}

        model.zoom = $('#zoom')
        model.zoom.mask = $('.mask',model.zoom)
        model.zoom.avg = $('.average',model.zoom)

        model.zoom.draggable
            stop: (_,ui) ->
                ui.helper.css 'position','fixed'

        model.zoom.resizable
            aspectRatio: true

        model.zoom.on = (avg) ->
            model.zoom.avg.attr('src',avg.url.loaded)
            return false

        model.zoom.toggleMask = ->
            model.zoom.mask.attr 'src', model.result.mask()
            model.zoom.mask.toggle 10
            return false

        model.zoom.toggleZoom = ->
            model.zoom.toggle 10
            return false

        model.poll_time = 1000

        model.url =  "#{PROCESS_SERVER}/xmipp/som/#{urlparam 'id'}"
        console.log 'set query url to:', model.url

        result =
            avgs : ko.observable null
            mask : ko.observable null
            progress : progress.uiProgressBar
                percent : ko.observable 0.0
                rgba    : ko.observable [100,200,100,1]
                animate : false
                stripes : false
            xdim : null
            ydim : null
            tar  : ko.observable null

        result.refresh = ->
            console.log 'loading:',model.url
            $.ajax
                url: model.url
                timeout: model.poll_time * 2
                success: (data) ->
                    if typeof data == 'string'
                        data = JSON.parse data
                    console.log 'received result:',data
                    if data.done and data.total
                        result.progress.percent ( data.done / data.total )
                    if data.mask
                        result.mask data.mask
                    result.tar data.tar
                    if data.avgs
                        if not result.avgs()
                            result.ydim = data.avgs.length
                            result.xdim = data.avgs[0].length
                            result.avgs (({url:ko.observable(null)} for x in [0...result.xdim]) for y in [0...result.ydim])
                        for row in [0...result.ydim]
                            for col in [0...result.xdim]
                                result.avgs()[row][col].url data.avgs[row][col]
                    if data.done and data.done == data.total
                        return
                    setTimeout result.refresh, model.poll_time
                error: ->
                    setTimeout result.refresh, model.poll_time
            return result

        model.result = result
        model.result.refresh()

        return model


    $(document).ready ->
        window.vm = ViewModel()
        ko.applyBindings(vm)


    ko.bindingHandlers.size =
        update: (element,_values) ->
            values = _values()()
            $element = $(element)
            $element.height(values.height)
            $element.width(values.width)


    ko.bindingHandlers.bimg =
        update: (img,_url) ->
            url = ko.utils.unwrapObservable _url()
            img.onload = ->
                _url().loaded = url
            img.src = url







