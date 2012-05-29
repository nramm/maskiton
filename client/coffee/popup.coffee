define ['base'], (base) ->

    $.fn.popup = (popup,options={}) ->
        
        target = this
        offset = target.offset()
        offset =
            left : offset.left + target.width()  / 2
            top  : offset.top  + target.height() / 2
        
        fade_in = options.fade_in or 0
        ignore_exit  = options.ignore_pause or true
        ignore_pause = options.ignore_pause or 200
        ignore_fade  = options.ignore_fade  or 1000
        offset_x = options.offset_x or 10
        offset_y = options.offset_y or 10
        
        if popup.data('popup_inuse') == undefined
            popup.data('popup_inuse',false)
            popup.data('popup_onhide',[])
            popup.css('position','absolute')
            popup.css('display','none')
            popup.addClass('popup')
        
        
        start = (event) ->
            
            if popup.data('popup_inuse') then hide()
            
            popup.data('popup_inuse',true)
            
            if options.onhide?
                popup.data('popup_onhide').push(options.onhide)
            if options.onshow?
                options.onshow(popup)
            
            $(document).bind('mousedown',clickExit)
            
            # move the popup to current location
            popup.css
                left : event.pageX - offset_x
                top  : event.pageY - offset_y
            
            # display the popup, then set additional events once done
            popup.fadeIn options.fade_in, ->
                if ignore_exit
                    popup.bind('mouseleave',startIgnoreExit)
                    popup.bind('mouseenter',clearIgnoreExit)
            
            return true
        
        
        clickExit = (event) ->
            if not popup.under(event) then hide()
        
        
        hide = ->
            # clear all pending hide events, possible if multiple
            # elements reference the same popup
            hide_events = popup.data('popup_onhide')
            for event in hide_events
                event(popup)
            # if the popup isn't already hidden, then hide it now
            if popup.css('display') != 'none'
                popup.stop(true).clearQueue().hide()
            # reset the popup to its original opacity, in case it was
            # left changed from a canceled fade event
            $(document).unbind('mousedown',clickExit)
            popup.unbind('mouseleave',startIgnoreExit)
            popup.unbind('mouseenter',clearIgnoreExit)
            popup.data('popup_inuse',false)
        
        
        startIgnoreExit = -> popup.delay(ignore_pause).fadeOut(ignore_fade,hide)
        clearIgnoreExit = -> popup.stop(true).clearQueue().css('opacity',1.0)
        
        
        target.bind('mousedown',start)
        
    ko.bindingHandlers.popup =
        init: (element,_value,_values,vm) ->
            options = ko.utils.unwrapObservable(_value())
            $(element).popup($(options.$),options)
    
    

