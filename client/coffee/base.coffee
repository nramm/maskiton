
setCenter = (element,position) ->
    element.css
        left: position.left - ( element.width()  / 2 )
        top:  position.top  - ( element.height() / 2 )

getCenter = (element) ->
    offset = element.offset()
    center =
        left: offset.left + ( element.width()  / 2 )
        top:  offset.top  + ( element.height() / 2 )

getBounds = (element) ->
    bounds = element.offset()
    extend bounds,
        bottom : bounds.top  + element.outerHeight()
        right  : bounds.left + element.outerWidth()


self.extend = (obj, ext) ->
    for key of ext
        if ext.hasOwnProperty key then obj[key] = ext[key]
    return obj

define ['jquery-1.7.2'
        'knockout-2.0.0'
        'jquery-ui-1.8.16'], ->

    $.fn.under = (event) ->
        bounds = getBounds this
        if event.pageY < bounds.top or event.pageY > bounds.bottom
            return false
        if event.pageX < bounds.left or event.pageX > bounds.right
            return false
        return true

    $.fn.center = ( position ) ->
        if position? then setCenter this, position
        else getCenter this

    observable : (value,options) ->
        if not ko.isObservable value then value = ko.observable value
        if options then value.extend options
        return value

    dependent : (options) ->
        bound = ko.dependentObservable options
        return bound

    throttle : (throttle,tothrottle) ->
        throttling = false
        run = ->
            tothrottle()
            throttling = false
        throttled = ->
            if throttling then return
            throttling = setTimeout run, throttle
        return throttled

    delay : (delay,todelay) ->
        delaying = false
        run = ->
            todelay()
            delaying = false
        delayed = ->
            if delaying then clearTimeout delaying
            delaying = setTimeout run, delay
        return delayed

    subscription : (options) ->
        for dependent in options.values
            for action in options.actions
                if options.throttle
                    action = throttle options.throttle, action
                dependent.subscribe action

    subscriptions : (subs) ->
        for sub in subs
            subscription sub

    randomF : (min,max) -> Math.random()*(max-min)+min
    randomI : (min,max) -> Math.floor randomF min, max



