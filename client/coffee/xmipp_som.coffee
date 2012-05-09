
define ['coffee/base'], (base) ->


    XmippSOMParams = (opts={}) ->
        params = {}
        params.name = 'XMIPP SOM Classification'
        params.templateid = 't_xmipp_som_params'
        params.xdim = base.observable 8
        params.ydim = base.observable 2
        params.layer = base.observable opts.layer
        params.server = base.observable opts.server
        params.stackid = base.observable opts.stackid
        params.start = -> startXMIPPSOMJob params
        return params
    
    imageURL = (server,imageid) -> 
        if imageid then "http://#{server}/images/#{imageid}"
        else "http://#{server}/images"
    
    stackURL = (server,stackid) -> 
        if stackid then "http://#{server}/stacks/#{stackid}"
        else "http://#{server}/stacks/#{stackid}"
    
    xmippSomURL = (server,jobid) -> 
        if jobid then "http://#{server}/xmippsom/jobs/#{jobid}"
        else "http://#{server}/xmippsom/jobs"

    XmippSOMJob = (params) ->
        
        abort = false
        
        job = {}
        job.name = 'XMIPP SOM Classification'
        job.templateid = 't_xmipp_som_job'
        job.mask = params.layer().masked().toDataURL('image/png')
        job.stackid = params.stackid()
        job.xdim = params.xdim()
        job.ydim = params.ydim()
        job.server = params.server()

        job.imageurl = imageURL job.server
        job.jobsubmiturl = xmippSomURL job.server
        job.jobprogressurl = undefined

        job.status = jsem.observable 'starting...'
        job.progress = uiProgress Progress()
        job.classurls = ko.observable []

        job.start = ->
            abort = false
            job.status 'saving mask to server...'
            $.ajax imageURL job.server,
                type: 'POST'
                data: job.mask
                success: (result) ->
                    if abort then return
                    job.status 'starting job on server...'
                    jobparams = JSON.stringify
                        maskid: result.imageid
                        stackid: job.stackid
                        xdim: job.xdim
                        ydim: job.ydim
                    $.post job.jobsubmiturl, jobparams, (response) ->
                        startPolling response.processurl

        job.abort = -> abort = true

        startPolling = (url) ->
            poll = ->
                if abort then return
                $.get url, null, (response) ->
                    if response.done != job.progress.done()
                        job.status response.status
                        job.progress.done response.done
                        job.progress.total response.total
                        job.classurls response.imageurls
                    setTimeout poll, 1000
            poll()
        

        return job


