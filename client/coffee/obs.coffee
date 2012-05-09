
# each frame in the stack holds all the observables
# called for the current evaluating computed...
# when a frame gets popped it dumps it observables into
# the next frame, so that that computed gets the observables as well
# popFrame also filters out redundantly called observables, but keeps the order

frames = []
addFrame = (frame) -> frames.push frame || []
addToStack = (obs) -> if frames.length > 0 then frames[frames.length-1].push obs
mergeFrame = (obs) -> if frames.length > 0 then frames[frames.length-1] = frames[frames.length-1].concat obs
popFrame = ->
    popped = unique frames.pop()
    mergeFrame popped
    return popped

unique = (frame) ->
    set = {}
    nframe = []
    for obs in frame
        if obs.id not of set
            set[obs.id] = true
            nframe.push obs
    return nframe

notify = (bindings,value) ->
    newbindings = []
    for call in bindings
        if call value
            newbindings.push call
    return newbindings

obsids = 0
computed = (tocompute) ->
    watched = []
    cached  = null
    dirty   = true
    evaluate = ->
        if dirty
            dirty = false
            addFrame()
            value = tocompute()
            watched = popFrame()
            if value != cached
                for obs in watched
                    obs.bind -> dirty = true; false;
                cached = value
        else mergeFrame watched
        return cached
    evaluate.id = obsids++
    evaluate.bind = (call) -> obs.bind(-> call evaluate()) for obs in watched
    evaluate.tocompute = tocompute
    evaluate()
    return evaluate

observable = (value) ->
    if value.id
        return value
    cached = value
    bindings = []
    evaluate = (value) ->
        addToStack evaluate
        if value? and value != cached
            cached = value
            bindings = notify bindings, value
        return cached
    evaluate.id = obsids++
    evaluate.bind = (call) -> bindings.push call
    return evaluate

runs = 0
count = 10000
stop = false
t_make = 0
t_update = 0
t_verify1 = 0
t_verify2 = 0
self.stop = -> stop = true
self.startmy = -> 
    t_make = 0
    t_update = 0
    t_verify1 = 0
    t_verify2 = 0
    run (observable 10), observable, computed
self.startko = -> 
    t_make = 0
    t_update = 0
    t_verify1 = 0
    t_verify2 = 0
    run (ko.observable 10), ko.observable, ko.computed

run = (base,observable,computed) ->
    #base = observable 10
    t0   = Date.now()
    results = []
    for i in [0...count]
        b = observable i
        c = computed do (b) -> 
            -> b() + 1
        d = computed do (c) -> 
            -> if base() > 50 then c() + base() else c() - base()
        results.push [b,c,d]
    t_make += Date.now() - t0
    t0 = Date.now()
    base 100
    t_update += Date.now() - t0
    t0 = Date.now()
    for i in [0...results.length]
        [b,c,d] = results[i]
        v3 = if base() > 50 then (i+1)+base() else (i+1)-base()
        if b() != i then throw Error 'assert'
        if c() != i + 1 then throw Error 'assert'
        if d() != v3 then throw Error 'assert'
    t_verify1 += Date.now() - t0
    t0 = Date.now()
    for i in [0...results.length]
        [b,c,d] = results[i]
        v3 = if base() > 50 then (i+1)+base() else (i+1)-base()
        if b() != i then throw Error 'assert'
        if c() != i + 1 then throw Error 'assert'
        if d() != v3 then throw Error 'assert'
    t_verify2 += Date.now() - t0
    runs += 1
    console.log """
    make: #{(t_make/runs).toFixed(2)}ms
    update: #{(t_update/runs).toFixed(2)}ms
    verify1: #{(t_verify1/runs).toFixed(2)}ms
    verify2: #{(t_verify2/runs).toFixed(2)}ms
    """
    base 0
    if not stop then setTimeout (-> run base, observable, computed), 10
