
define ['knockout-2.0.0'], ->

    computed = (value) ->
        if ko.isObservable value then value
        else ko.computed value

    observable = (value) ->
        # why create a new observable when 
        # we can reference the original?
        if ko.isObservable value then value
        else ko.observable value
    
    class Relay
        
        constructor : ->
            @reset()
        
        on : (event,call) ->
            @for event, 0, call
        
        relay : (call) ->
            @delegates.push call

        for : (event,count,call) ->
            if event not of @events
                @events[event] = {}
            response = 
                resid : @resids++
                count : count
                call  : call
            @events[event][response.resid] = response
            return this
        
        emit : (event,args...) ->
            if event of @events
                for id of @events[event]
                    response = @events[event][id]
                    response.call args...
                    response.count--
                    if response.count == 0
                        delete @events[event][id]
            for callback in @delegates
                callback event, args...
            return this
        
        reset : ->
            @delegates = []
            @events = {}
            @resids = 0

        clear : (event,call) ->
            if not event?
                @events = {}
            else if not callback?
                @events[event] = {}
            else for response in @events[event]
                if response.call == call
                    delete @events[event][response.resid]
            return this
        
        listen  : @::on
        respond : @::emit
        addEventListener : @::on
    
    throttle = (rate,tothrottle) ->
        last = Date.now()
        throttled = (args...) ->
            if ( Date.now() - last ) > rate
                tothrottle args...
                last = Date.now()            
        return throttled

    delay = (msecs,call) ->
        # more coffee-script friendly version of setTimeout
        setTimeout call, msecs
    
    exports = 
        Relay      : Relay
        throttle   : throttle
        delay      : delay
        observable : observable
        computed   : computed
        uibindings : ko.bindingHandlers
    

