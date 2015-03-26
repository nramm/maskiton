

fs = require 'fs'

merge = (root,overlay) ->
    for key of overlay
        root[key] = overlay[key]
    return root

merge exports, JSON.parse fs.readFileSync '../client/config.json', 'utf8'
merge exports, JSON.parse fs.readFileSync 'config.json', 'utf8'


