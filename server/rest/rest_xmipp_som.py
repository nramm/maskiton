import os
import time
import json
import signal
import hashlib
import multiprocessing as mp

from tornado.gen import engine, Task
from tornado.web import RequestHandler, asynchronous

from misc import reglob
from fs import FSCache, FSDict
from xmipp import hed_som
from rest_image import pathFromId, rest_saveImagePath
from rest_stack_handling import rest_queryStackPath

with open('config.json','r') as fp:
    CONFIG = json.load(fp)
    CONFIG['SOM_URL']  = 'xmipp/som'
    CONFIG['SOM_PATH'] = os.path.join(CONFIG['JOB_PATH'],'xmipp/som')

def hashargs(args=[],kwargs={}):
    md5 = hashlib.md5()
    for arg in args:
        md5.update(str(arg))
    for key in sorted(kwargs):
        md5.update(str(key))
        md5.update(str(kwargs[key]))
    return md5.hexdigest()

def rest_urlForJobId(host,procid):
    host = 'http://%s'%host
    path = os.path.join(CONFIG['SOM_URL'],procid)
    return os.path.join(host,path)

def rest_pathForJobId(id):
    return os.path.join(CONFIG['SOM_PATH'],id)

def rest_jobIdFromURL(url):
    return os.path.basename(url)

def rest_jobIdFromPath(path):
    return os.path.basename(url)

def rest_pathForURL(url):
    return rest_pathForJobId(rest_jobIdFromURL(url))

def rest_som_status(jobid,callback):
    try:
        job_status = FSDict(rest_pathForJobId(jobid))
        processing_status = FSDict(job_status['stat'])
        avgs = processing_status['avgs']
        avgs = [[rest_saveImagePath(avg) for avg in row] for row in avgs]
        callback({
            'done'  : processing_status.get('done',None),
            'total' : processing_status.get('total',None),
            'avgs'  : avgs,
        })
    except:
        callback({
            'done'  : None,
            'total' : None,
            'avgs'  : None,
        })

def rest_som_stop(jobid,callback):
    try:
        job_status = FSDict(rest_pathForJobId(jobid))
        pid = job_status['pid']
        code = os.kill(pid,signal.SIGTERM)
        callback({
            'killed': True,
        })
    except:
        callback({
            'killed': False,
        })

def rest_som_start(host,params,callback=None):

    params = json.loads(params)

    maskid    = params.get('maskid',None)
    stackid   = params.get('stackid')
    projectid = params.get('projectid')
    xdim      = int(params.get('xdim',10))
    ydim      = int(params.get('ydim',2))
    radius    = int(params.get('radius',1))
    levels    = int(params.get('levels',3))
    iters     = int(params.get('iters',5000))
    alpha     = float(params.get('alpha',0.01))

    hed,img = rest_queryStackPath(projectid,stackid)
    mask = pathFromId(maskid,ext='.png')

    print 'parent group process id:',os.getpgrp()

    jobid = hashargs([hed,img,mask,xdim,ydim,radius,levels,iters,alpha])
    job = mp.Process(target=som_start,args=[host,hed,img,mask,xdim,ydim,radius,levels,iters,alpha])
    job.start()
    callback({
        'id'  : jobid,
        'url' : rest_urlForJobId(host,jobid)
    })

def som_start(host,hed,img,mask,xdim,ydim,radius,levels,iters,alpha):
    jobid = hashargs([hed,img,mask,xdim,ydim,radius,levels,iters,alpha])
    cache = FSCache(hed_som,hed,img,mask,xdim,ydim,radius,levels,iters,alpha)
    print 'starting som job, cached:',cache.cached,'running:',cache.locked,'pgid:',os.getpgrp()
    if not cache.cached and not cache.locked:
        with FSDict(rest_pathForJobId(jobid)) as status:
            status['stat'] = cache.stat.path
            status['pid']  = os.getpid()
        hed_som(cache,hed,img,mask,xdim,ydim,radius,levels,iters,alpha)
        with FSDict(rest_pathForJobId(jobid)) as status:
            status['pid']  = None

class SOMJob(RequestHandler):

    @asynchronous
    @engine
    def get(self,procid):
        result = yield Task(rest_som_status,procid)
        self.set_header('Access-Control-Allow-Origin','*')
        self.write(result)
        self.finish()

    @asynchronous
    @engine
    def delete(self,procid):
        result = yield Task(rest_som_stop,procid)
        self.set_header('Access-Control-Allow-Origin','*')
        self.write(result)
        self.finish()

    def options(self,procid):
        self.set_header('Access-Control-Allow-Origin','*')
        self.set_header('Access-Control-Allow-Methods','DELETE, GET')
        self.finish()


class SOMJobs(RequestHandler):

    @asynchronous
    @engine
    def post(self):
        result = yield Task(rest_som_start,self.request.host,self.request.body)
        print result
        self.set_header('Access-Control-Allow-Origin','*')
        self.write(result)
        self.finish()





