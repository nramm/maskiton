define ['sprintf'], (sprintf) ->

    enumerate = (list) ->
        [i,list[i]] for i in [0...list.length]

    split = (list,splits) ->
        split = []
        splitsize = Math.ceil list.length / splits
        for i in [0...list.length] by splitsize
            split.push list[i...i+splitsize]
        return split

    niceSize = (bytes) ->
        KB = 1024
        MB = KB * 1024
        GB = MB * 1024
        TB = GB * 1024
        if bytes/KB < 1 then return "#{bytes} B"
        else if bytes/MB < 1 then return "#{(bytes/KB).toFixed(2)} KB"
        else if bytes/GB < 1 then return "#{(bytes/MB).toFixed(2)} MB"
        else if bytes/TB < 1 then return "#{(bytes/GB).toFixed(2)} GB"
        else return "#{(bytes/TB).toFixed(2)} TB"

    return exports =
        niceSize  : niceSize
        split     : split
        enumerate : enumerate

