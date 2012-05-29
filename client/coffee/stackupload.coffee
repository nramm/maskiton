STATIC_SERVER  = 'http://amibox04.scripps.edu:80'
UPLOAD_SERVER  = 'http://amibox04.scripps.edu:9000'
PROCESS_SERVER = 'http://amibox04.scripps.edu:9050'

self.path =
    splitext: (path) ->
        matches = path.match /^(.+)([.].+)$/
        if matches
            matches[1...]
        else null

public_datasets = [
    p0 =
        name: 'Select A Public Dataset'
        hedid: undefined
        imgid: undefined
    p1 =
        name: '30S Ribosomes'
        hedid: 'c6042e2d01bd945d468953610a9d1775'
        imgid: 'c12e8941932e72794011d068c024e8bb'
    p2 =
        name: 'Listerin'
        hedid: 'e2baa1fb79a0a9d02a213ed8a432446a'
        imgid: 'e453f406f293ee105ee99c42f9fe6343'
    p3 =
        name: 'Synthethic Dataset'
        hedid: '8b0846bf8e6ad7e554239a93f68abee6'
        imgid: '5fd0dfe8514d7237a90fe9f60ece6853'
]


require ['jquery-1.7.2',
         'knockout-2.0.0',
         'md5',
         'useful',
         'time',
         'upload',
         'progress'], (_...,useful,time,upload,progress) ->

    uploadStack = (hedid,imgid,callb) ->
        params = JSON.stringify
            hedid : hedid
            imgid : imgid
        $.post "#{PROCESS_SERVER}/stacks", params, (data) ->
            callb data.projectid, data.stackid

    maskOnStack = (projectid,stackid) ->
        url = "#{STATIC_SERVER}/masking.html?projectid=#{projectid}&stackid=#{stackid}"
        window.location = url

    hashFile = (file) ->
        id1 = file.name
        id2 = file.size
        id3 = file.lastModifiedDate?.getTime() || file.mozFullPath
        MD5.hash "#{id1}-#{id2}-#{id3}"

    ko.bindingHandlers.fileinput =
        init : (element,_value,_,vm) ->
            $(element).on 'change', (event) ->
                _value() element.files

    colors =
        yellow : [255,190, 50,1.0]
        red    : [255,150,150,1.0]
        green  : [150,200,150,1.0]
        gray   : [100,100,100,1.0]
        asCSS  : ([r,g,b,a]) -> "rgba(#{r},#{g},#{b},#{a||1.0})"

    uiUploadProgress = (up) ->
        ui = {}
        ui.upload = up
        ui.name = up.file.name
        ui.button =
            action : ko.computed ->
                switch up.status()
                    when 'uploading...' then -> up.stop()
                    when 'uploaded'     then -> up.restart()
                    else -> up.resume()
            color : ko.computed ->
                switch up.status()
                    when 'uploading...' then colors.asCSS colors.yellow
                    when 'uploaded'     then colors.asCSS colors.red
                    else colors.asCSS colors.green
            text : ko.computed ->
                switch up.status()
                    when 'uploading...' then 'Stop'
                    when 'uploaded'     then 'Restart'
                    else 'Resume'
        ui.progress = progress.uiProgressBar
            percent : up.progress.done.percent
            rgba : ko.computed ->
                switch up.status()
                    when 'waiting...'   then colors.yellow
                    when 'stopped'      then colors.yellow
                    when 'uploading...' then colors.green
                    when 'uploaded'     then colors.green
                    else colors.red
            message : ko.computed ->
                switch up.status()
                    when 'uploading...'
                        time = up.progress.remaining.time.nice()
                        rate = up.progress.rate.nice()
                        "#{time} @ #{rate}"
                    else up.status()
            animate : ko.computed ->
                switch up.status()
                    when 'waiting...'   then false
                    when 'stopped'      then false
                    when 'uploading...' then true
                    when 'uploaded'     then false
                    when 'server did not like us...' then false
                    when 'upload connection lost...' then false
            stripes : ko.computed ->
                switch up.status()
                    when 'waiting...'   then false
                    when 'stopped'      then true
                    when 'uploading...' then true
                    when 'uploaded'     then false
                    when 'server did not like us...' then true
                    when 'upload connection lost...' then true
        return ui

    inc = (obs,val=1) -> obs obs() + val
    dec = (obs,val=1) -> obs obs() - val

    ViewModel = {}
    ViewModel.status = ko.observable 'no files selected'
    ViewModel.hedid = ko.observable undefined
    ViewModel.imgid = ko.observable undefined
    ViewModel.public_datasets = public_datasets
    ViewModel.selectedDataset = ko.observable undefined
    ViewModel.selectedDataset.subscribe (value) ->
        ViewModel.hedid value.hedid
        ViewModel.imgid value.imgid

    ViewModel.proceed = ko.computed ->
        hedid = ViewModel.hedid()
        imgid = ViewModel.imgid()
        if hedid and imgid
            enabled: true
            action: -> uploadStack hedid,imgid,maskOnStack
        else
            enabled: false
    ViewModel.uploads = ko.observableArray()
    ViewModel.uploads.todo = ko.observable 0
    ViewModel.uploads.done = ko.observable 0
    ViewModel.uploads.errors = ko.observable 0
    ViewModel.uploads.stopped = ko.observable 0
    ViewModel.progress = progress.uiProgressBar progress.Progress
        stripes : ko.computed ->
            todo = ViewModel.uploads.todo()
            done = ViewModel.uploads.done()
            if todo > 0 and done < todo
                return true
            return false
        animate : ko.computed ->
            todo = ViewModel.uploads.todo()
            done = ViewModel.uploads.done()
            if todo > 0 and done < todo
                return true
            return false
        rgba: ko.computed ->
            if ViewModel.uploads.errors() > 0
                return colors.red
            else if ViewModel.uploads.stopped() > 0
                return colors.yellow
            else if ViewModel.uploads.todo() == 0
                return colors.gray
            return colors.green
        message: ko.computed ->
            todo = ViewModel.uploads.todo()
            if todo > 0
                done  = ViewModel.uploads.done()
                btodo = ViewModel.progress.total.nice()
                bdone = ViewModel.progress.done.nice()
                rate  = ViewModel.progress.rate.nice()
                "#{done} of #{todo} files, #{bdone} of #{btodo}, #{rate}"
            else ''

    ViewModel.addToUploads = (newfiles) ->
        for file in newfiles
            hash = hashFile file
            uploader = new upload.Uploader file, "#{UPLOAD_SERVER}/uploads/#{hash}"
            do (uploader) ->
                vmupload = uiUploadProgress uploader
                ViewModel.uploads.push vmupload
                uploader.onupload = (data) -> ViewModel.handleUpload uploader.file, data
                uploader.start()

    ViewModel.handleUpload = (file,data) ->
        # here we see if the upload was a valid .img or .hed file
        [base,ext] = path.splitext file.name
        switch ext
            when '.img' then ViewModel.imgid data.id
            when '.hed' then ViewModel.hedid data.id
        console.log ViewModel.hedid(), ViewModel.imgid()


    $(document).ready ->
        ko.applyBindings ViewModel
        if $.browser.mozilla
            # fix for stupid fing firefox doesn't handle click on styled file button
            # this forwards the click to the file button
            $('button>input[type="file"]').parent().on 'click', (e) ->
                $('input[type="file"]',e.target).click()

    self.ViewModel = ViewModel


