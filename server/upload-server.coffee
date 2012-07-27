require 'coffee-script'
express = require 'express'
mkdirp  = require 'express/node_modules/mkdirp'
url     = require 'url'
fs      = require 'fs'
fs.path = require 'path'

CONFIG  = require './config.coffee'

console.log CONFIG

serverPath = do ->
    matcher = new RegExp(CONFIG.UPLOAD_PATH)
    (request,path) ->
        urlbase = fs.path.join request.headers['host'], 'uploads/'
        path.replace matcher, urlbase

cachePath = (id) ->
    return fs.path.join CONFIG.UPLOAD_PATH, id

ensureCache = (call) ->
    mkdirp CONFIG.UPLOAD_PATH, 777, (error) ->
        call error, CONFIG.UPLOAD_PATH

fileSize = (path,call) ->
    fs.stat path, (error,stats) ->
        if error and error.code == 'ENOENT'
            return call null, 0
        else if error
            return call error, null
        else
            return call null, stats.size

parseContentRangeHeader = (request) ->
    start  = 0
    length = request.headers['content-length'] || 0
    stop   = length
    if request.headers['content-range']
        match = request.headers['content-range'].match /(\d+)-(\d+)\/(\d+)/
        if match then [start,stop,length] = (parseInt(x) for x in match[1..])
    return [start,stop,length]

app = express.createServer()

app.get '/uploads/:fileid', (request,response) ->
    console.log 'client requested status of file:',request.params.fileid
    path = cachePath request.params.fileid
    fileSize path, (error,size) ->
        console.log 'status for file:',path
        response.statusCode = 200
        response.setHeader 'Access-Control-Allow-Origin', '*'
        response.send
            written : size || 0
            path    : path
            url     : serverPath request, path
            id      : request.params.fileid

app.options '/uploads/:fileid', (request,response) ->
    response.setHeader 'Access-Control-Allow-Origin', '*'
    response.setHeader 'Access-Control-Allow-Methods', 'PUT'
    response.setHeader 'Access-Control-Allow-Headers', 'Content-Range, Content-Type'
    response.setHeader 'Access-Control-Max-Age', '0'
    response.send null

uploads = {}
printStatus = ->
    console.log """\033[2J\033[0;0H"""
    console.log uploads
setInterval printStatus, 5000

app.put '/uploads/:fileid', (request,response) ->

    request.pause()

    if request.params.fileid not of uploads
        uploads[request.params.fileid] = {}

    uploads[request.params.fileid].status = 'uploading'

    sendError = (error) ->
        response.statusCode = 500
        response.setHeader 'Access-Control-Allow-Origin', '*'
        response.write error
        response.end()
        uploads[request.params.fileid].status = 'error'

    sendSuccess = (written,path) ->
        uploads[request.params.fileid].status = 'done'
        response.statusCode = 202
        response.setHeader 'Access-Control-Allow-Origin', '*'
        response.write JSON.stringify
            written : written
            path    : path
            url     : serverPath request, path
            id      : request.params.fileid
        console.log path
        response.end()

    ensureCache (error,cache) ->

        if error then throw error

        path = fs.path.join cache, request.params.fileid
        uploads[request.params.fileid].path = path

        [start,end,_] = parseContentRangeHeader request
        console.log "resuming file upload #{path} @ #{start}"
        console.log "receiving #{request.headers['content-length']}"
        uploads[request.params.fileid].current = start
        uploads[request.params.fileid].start = start
        uploads[request.params.fileid].end = end

        request.on 'data', (data) ->
            uploads[request.params.fileid].current += data.length

        stream = fs.createWriteStream path,
            bufferSize: 1024
            encoding: 'binary'
            start: start
            flags: if start != 0 then 'r+' else 'w'

        ended = false

        stream.on 'close', ->
            console.log 'file stream closed'
            if ended then sendSuccess end-start, path
            else sendError 'file write did not complete'

        request.on 'close', ->
            if not ended then console.log 'network stream closed early'

        request.on 'end', ->
            console.log 'transfer finished'
            ended = true

        request.pipe stream

        request.resume()

app.listen(url.parse(CONFIG.UPLOAD_SERVER).port)

