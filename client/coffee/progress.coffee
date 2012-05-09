define ['events','time','useful'], ({observable,computed,uibindings},time,useful) ->

    options = (values...) ->
        for value in values
            if value? then return value
    
    from = (obj) ->
        sub = {}
        for key of obj
            if obj.hasOwnProperty key
                sub[key] = obj[key]
        return sub

    Progress = (proto={}) ->
        progress = from proto
        # I should change all these to extend the passed object...
        progress.done = observable options progress.done, 0
        progress.total = observable options progress.total, 0
        progress.started = observable options progress.started, time.now()
        
        last_done = progress.done()
        progress.reset = (done) ->
            if done? then progress.done done
            last_done = progress.done()
            progress.started time.now()
            return progress
        
        progress.done.nice = computed -> "#{useful.niceSize progress.done()}"
        progress.total.nice = computed -> "#{useful.niceSize progress.total()}"

        progress.done.percent = computed ->
            total = progress.total()
            if total > 0 then progress.done() / total
            else 1.0
        
        progress.elapsed = -> 
            started = progress.started()
            if started then time.now() - started
            else null
        
        progress.rate = computed ->
            elapsed = progress.elapsed()
            delta_done = progress.done() - last_done
            if elapsed? > 0 then delta_done / elapsed
            else null
        
        progress.rate.nice = computed ->
            rate = progress.rate()
            if rate? then "#{useful.niceSize rate}/sec"
            else 'unknown'

        progress.remaining = computed ->
            progress.total() - progress.done()
        
        progress.remaining.percent = computed ->
            total = progress.total()
            if total > 0 then progress.remaining() / total
            else 0.0
        
        progress.remaining.time = computed ->
            remaining = progress.remaining()
            if remaining > 0
                rate = progress.rate()
                if rate > 0 then remaining / rate
                else null
            else 0.0
        
        progress.remaining.time.nice = computed ->
            left = progress.remaining.time()
            if left then time.niceTime left
            else 'unknown'

        return progress
    
    uitemplate = '''
    <div class="pbar">
        <div class="pbar-bar"></div>
        <span class="pbar-label"></span>
    </div>
    '''

    uibindings.pbar =  
        init : (element,_model) ->
            vm = _model()
            ui = $(uitemplate)
            uibar = $('.pbar-bar',ui)
            uilabel = $('.pbar-label',ui)
            computed ->
                [r,g,b,a] = vm.rgba()
                uibar.css 
                    'background-color': "rgba(#{r},#{g},#{b},#{a})"
                    'border': "1px solid rgba(#{r-40},#{g-40},#{b-40},#{a-0.2})"
            computed -> 
                percent = vm.percent()
                uibar.width "#{Math.min(percent*98+2,100)}%"
            computed -> 
                uilabel.text vm.message()
            computed ->
                if vm.animate() then ui.addClass 'animate'
                else ui.removeClass 'animate'
            computed ->
                if vm.stripes() then ui.addClass 'stripes'
                else ui.removeClass 'stripes'
            $(element).append ui
    
    uiProgressBar = (proto={}) ->
        progress = from proto
        progress.rgba = observable options progress.rgba, [100,100,100,0.5]
        progress.message = observable options progress.message, ''
        progress.percent = observable options progress.percent, progress.done?.percent, 0.0
        progress.stripes = observable options progress.stripes, true
        progress.animate = observable options progress.animate, true
        return progress
    
    progress = 
        uiProgressBar : uiProgressBar
        Progress : Progress
    
