define ['sprintf'], (sprintf) ->
    
    time = {}

    time.now = ->
        new Date().getTime() / 1000
    
    time.niceTime = (secs) ->
        days  = Math.floor secs / (60*60*24)
        secs  = secs - (days*24*60*60)
        hours = Math.floor secs / (60*60)
        secs  = secs - (hours*60*60)
        mins  = Math.floor secs / 60
        secs  = secs - (mins*60)
        msecs = (secs-Math.floor(secs))*1000
        secs  = Math.floor secs
        if secs < 1 then return sprintf '%dms', msecs
        else if mins < 1 then return sprintf '%.2ds', secs
        else if hours < 1 then return sprintf '%dm %ds', mins, secs
        else if days  < 1 then return sprintf '%dh %dm', hours, mins
        else return sprintf '%d %dh %dm', days, hours, mins
    
    time.Timer = (timeout,call) ->

        tickled = true
        keepalive = false

        monitor = ->
            if keepalive
                if tickled then tickled = false
                else call()
                setTimeout monitor, timeout

        timer =
            stop : -> 
                keepalive = false
                return timer
            reset : (time) ->
                timeout = time || timeout
                tickled = true
                return timer
            start : (time) -> 
                timeout = time || timeout
                if not keepalive
                    keepalive = true
                    monitor()
                return timer

    return time


