define ['time','events','progress','xhr'], (time,{observable,computed,throttle},progress,XHR) ->

    sliceFile = (file,src=0,dst=file.size) ->
        _sliceFile = file.webkitSlice || file.mozSlice
        _sliceFile.call file, src, dst

    class Uploader

        ids = 0

        constructor : (file, url, opts={}) ->
            @file = file
            @id   = "uploader-#{ids++}"
            @url  = url
            @status = observable 'waiting'
            @progress = progress.Progress()
            @progress.total  @file.size
            @progress.done   0
            @onupload = opts.onupload || ->
            @onstart = opts.onstart || ->
            @onerror = opts.onerror || ->
            @retries = opts.retries || -1

        fileStatus : (nextCall) ->
            xhr = new XHR()
            xhr.onerror = => @status 'no response from server'
            xhr.onsuccess = (event) =>
                status = JSON.parse event.target.response
                if status.written >= @file.size
                    @progress.reset @file.size
                    @onupload status
                    @status 'uploaded'
                else nextCall status
            xhr.timeout.start = 5000
            xhr.timeout.transfer = 20000
            xhr.timeout.onstart = => @status 'connect timed out'
            xhr.timeout.ontransfer = => @status 'transfer timed out'
            @stop = -> xhr.abort()
            xhr.send 'GET', @url

        resumeUpload : ->
            @fileStatus (status) =>
                @resumeUploadAt status.written

        resumeUploadAt : (offset) ->

            @status 'uploading...'
            @onstart()
            @progress.reset offset

            xhr = new XHR()
            xhr.onsuccess = (event) =>
                @progress.done @file.size
                @onupload JSON.parse event.target.response
                @status 'uploaded'
            xhr.onerror = => @status 'no response from server'
            xhr.onabort = => @status 'stopped'
            xhr.timeout.transfer = 5000
            xhr.timeout.ontransfer = => @status 'upload timed out...'
            xhr.outgoing.done.subscribe (done) => @progress.done offset + done

            @stop = -> xhr.abort()
            blob = sliceFile @file, offset
            xhr.send 'PUT', @url, blob,
                'Content-Range': "#{offset}-#{@file.size}/#{@file.size}"


        start : -> @resumeUpload()
        resume : @::start
        restart : -> @resumeUploadAt 0

    exports =
        Uploader : Uploader



