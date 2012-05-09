
Canvas = (rows,cols) ->
    canvas = document.createElement('canvas')
    canvas.height = rows
    canvas.width  = cols
    return canvas

resize = (canvas,size) ->

    if canvas == undefined
        return

    orows = canvas.height
    ocols = canvas.width

    nrows = size.height
    ncols = size.width

    if orows == nrows and ocols == ncols
        return

    if orows == 0 or ocols == 0
        canvas.height = nrows
        canvas.width  = ncols
        return

    buffer = Canvas orows, ocols
    bctx = buffer?.getContext '2d'
    if bctx
        bctx.globalCompositeOperation = 'copy'
        bctx.drawImage canvas, 0, 0

        scalex = ncols / ocols
        scaley = nrows / orows

        canvas.width  = ncols
        canvas.height = nrows

        octx = canvas.getContext '2d'
        if octx
            octx.save()
            octx.globalCompositeOperation = 'copy'
            octx.scale scalex, scaley
            octx.drawImage buffer, 0, 0
            octx.restore()


asAlpha = (src,dst) ->

    rows = src.width
    cols = src.height

    if dst == undefined
        dst = Canvas(rows,cols)

    b_ctx = dst.getContext('2d')

    b_ctx.save()

    # removing color from mask ---------------------
    b_ctx.shadowBlur = 0
    b_ctx.globalCompositeOperation = 'copy'
    b_ctx.drawImage(src,0,0)
    b_ctx.globalCompositeOperation = 'source-in'
    b_ctx.fillStyle = "rgba(0,0,0,1)"
    b_ctx.fillRect(0,0,cols,rows)
    # ----------------------------------------------

    b_ctx.restore()

    return dst

mask = (src,dst) ->

    rows = src.width
    cols = src.height

    if dst == undefined
        dst = Canvas(rows,cols)

    b_ctx = dst.getContext('2d')

    b_ctx.save()

    # removing color from mask ---------------------
    b_ctx.shadowBlur = 0
    b_ctx.globalCompositeOperation = 'copy'
    b_ctx.drawImage(src,0,0)
    b_ctx.globalCompositeOperation = 'source-in'
    b_ctx.fillStyle = "rgba(0,0,0,1)"
    b_ctx.fillRect(0,0,cols,rows)
    # ----------------------------------------------

    # subtraction
    b_ctx.globalCompositeOperation = 'destination-over'
    b_ctx.fillStyle = "rgba(255,255,255,1)"
    b_ctx.fillRect(0,0,cols,rows)

    b_ctx.restore()

    return dst



outline = (src,dst,rgba) ->

    cols = src.width
    rows = src.height

    if dst == undefined
        dst = Canvas(rows,cols)

    buffer1 = Canvas(rows,cols)
    buffer2 = Canvas(rows,cols)

    b1_ctx = buffer1.getContext('2d')
    b2_ctx = buffer2.getContext('2d')

    b1_ctx.shadowBlur = 5
    b1_ctx.drawImage(src,0,0)

    # removing color from mask ---------------------
    b1_ctx.shadowBlur = 0
    b1_ctx.globalCompositeOperation = 'source-atop'
    b1_ctx.fillStyle = 'rgba(255,255,255,1)'
    b1_ctx.fillRect(0,0,cols,rows)
    # ----------------------------------------------

    # subtraction
    b2_ctx.fillStyle = 'rgba(255,255,255,1)'
    b2_ctx.fillRect(0,0,cols,rows)
    b2_ctx.globalCompositeOperation = 'destination-out'
    b2_ctx.drawImage(buffer1,0,0)

    # subtract
    b1_ctx.globalCompositeOperation = 'source-over'
    b1_ctx.drawImage(buffer2,0,0)

    b2_ctx.globalCompositeOperation = 'source-over'
    b2_ctx.fillStyle = "rgba(#{rgba[0]},#{rgba[1]},#{rgba[2]},#{rgba[3]})"
    b2_ctx.fillRect(0,0,cols,rows)

    b2_ctx.globalCompositeOperation = 'destination-out'
    b2_ctx.drawImage(buffer1,0,0)

    b2_ctx.globalCompositeOperation = 'lighter'
    b2_ctx.drawImage(buffer2,0,0)

    dst_ctx = dst.getContext('2d')
    dst_ctx.globalCompositeOperation = 'copy'
    dst_ctx.drawImage(buffer2,0,0)

    return dst


loadURL = (canvas,url,success) ->
    image = new Image
    image.onload = ->
        if canvas.width != image.width
            canvas.width = image.width
        if  canvas.height != image.height
            canvas.height = image.height
        context = canvas.getContext('2d')
        context.save()
        context.globalCompositeOperation = 'copy'
        context.drawImage(image,0,0)
        context.restore()
        if success then success()
    image.src = url

saveURL = (canvas,url,success) ->
    $.ajax url,
        type: 'POST'
        data: canvas.toDataURL('image/png')
        success: success

realSize = (img) ->
    if img.naturalHeight and img.naturalWidth
        return width: img.naturalWidth, height: img.naturalHeight
    else
        newimg = document.createElement('img')
        newimg.src = img.src
        return width: newimg.width, height: newimg.height

define ['base','color'], (base,{cssrgba}) ->

    recolor = (canvas,newrgb) ->
        rows = canvas.width
        cols = canvas.height
        context = canvas.getContext('2d')
        context.save()
        context.globalCompositeOperation = 'source-atop'
        context.fillStyle = cssrgba newrgb
        context.fillRect(0,0,cols,rows)
        context.restore()

    clear = (canvas,rgb) ->
        if canvas == undefined
            return
        context = canvas.getContext('2d')
        context.save()
        context.fillStyle = cssrgba rgb
        context.globalCompositeOperation = 'copy'
        context.fillRect(0,0,canvas.width,canvas.height)
        context.restore()

    ko.bindingHandlers.canvas =
        init: (canvas,_value,_,vm) ->
            values = _value()
            if values.bind then values.bind(canvas)
        update: (canvas,_values) ->
            size = _values()?.size?()
            if (size?.width) != canvas.width or (size?.height) != canvas.height
                resize canvas, size

    ko.bindingHandlers.img =
        init: (element,_values) ->
            values = _values()
            if values.size
                element.onload = (event) ->
                    values.size realSize event.target
        update: (element,_values) ->
            values = _values()
            if values.src
                url = ko.utils.unwrapObservable values.src
                element.src = url

    exports =
        filters  :
            outline : outline
            recolor : recolor
            mask    : mask
            resize  : resize
            clear   : clear
            asAlpha : asAlpha
        loadURL  : loadURL
        saveURL  : saveURL
        Canvas   : Canvas
        realSize : realSize




