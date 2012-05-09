
define ['events','time','progress'], ({observable,computed,throttle},time,{Progress}) ->

    class XHR
        
        constructor : ->
            
            @onsuccess = ->
            @onerror   = ->
            @onabort   = ->
            @abort     = ->
        
            @status = observable 'waiting'
            @throttle = 100
            @outgoing = Progress()
            @incoming = Progress()
            @incoming.headers = observable null
            @incoming.body = observable null
            
            @timeout = 
                start : null
                onstart : ->
                transfer : null
                ontransfer : ->

        send : (method,url,data,headers={}) ->

            xhr = new XMLHttpRequest()

            createTimer = (timeout,call) =>
                if timeout
                    time.Timer timeout, =>
                        xhr.onabort = call
                        xhr.abort()
                        @status 'timedout'
                else null

            s_timer = createTimer @timeout.start, @timeout.onstart
            t_timer = createTimer Math.max( @timeout.transfer, @throttle * 5 ), @timeout.ontransfer

            @incoming.reset 0
            @outgoing.reset 0
            
            xhr.onloadend = =>
                s_timer?.stop()
                t_timer?.stop()
            xhr.onloadstart = (event) =>
                t_timer?.start()
                @status 'sending'
            xhr.onload = (event) =>
                @outgoing.done @outgoing.total()
                @incoming.done @incoming.total()
                @incoming.headers event.target.getAllResponseHeaders()
                @incoming.body event.target.response
                @status 'done'
                @onsuccess event
            xhr.onprogress = throttle @throttle, (event) =>
                t_timer?.start()
                t_timer?.reset()
                s_timer?.stop()
                @incoming.total Math.max event.total, event.loaded
                @incoming.done event.loaded
            xhr.upload.onprogress = throttle @throttle, (event) =>
                t_timer?.start()
                t_timer?.reset()
                s_timer?.stop()
                @outgoing.total Math.max event.total, event.loaded
                @outgoing.done event.loaded
            xhr.onabort = =>
                @status 'stopped'
                @onabort()
            xhr.onerror = (error) =>
                @status 'error'
                @onerror error
            
            xhr.open method, url
            for header of headers
                xhr.setRequestHeader header, headers[header]
            xhr.send data
            s_timer?.start()
            @abort = -> xhr.abort()

        
        
        

    self.testXHR = ->
        xhr = new XHR()
        xhr.timeout.connect.after 0
        xhr.timeout.transfer.after 0
        computed -> console.log 'status:', xhr.status()
        computed -> 
            console.log 'received:', xhr.incoming.progress.done()
            console.log '      of:', xhr.incoming.progress.total(), '@', xhr.incoming.progress.rate.nice()
        computed -> 
            console.log 'sent:', xhr.outgoing.progress.done()
            console.log '  of:', xhr.outgoing.progress.total(), '@', xhr.outgoing.progress.rate.nice()
        xhr.send 'PUT', 'http://localhost:8888/uploads/test', "#{[0...5000000]}"
        return xhr
    
    return XHR

